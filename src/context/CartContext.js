import { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Get user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      // Fetch cart from MongoDB for this user
      fetchCart(userData.email);
    } else {
      // No user, load from localStorage fallback
      const saved = JSON.parse(localStorage.getItem("cart") || "[]");
      setCart(saved);
      setLoading(false);
    }
  }, []);

  // Fetch cart from MongoDB
  const fetchCart = async (email) => {
    try {
      const res = await fetch(`/api/cart?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (data.success) {
        setCart(data.cart);
      } else {
        // Fallback to localStorage
        const saved = JSON.parse(localStorage.getItem("cart") || "[]");
        setCart(saved);
      }
    } catch (err) {
      console.error("Error fetching cart:", err);
      // Fallback to localStorage
      const saved = JSON.parse(localStorage.getItem("cart") || "[]");
      setCart(saved);
    } finally {
      setLoading(false);
    }
  };

  // Save cart to MongoDB whenever it changes
  useEffect(() => {
    if (loading || !user?.email) return;

    const saveCart = async () => {
      try {
        await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            email: user.email, 
            items: cart.map(item => ({
              id: item.id,
              name: item.name,
              price: item.price,
              image: item.image,
              qty: item.qty,
              selectedColor: item.selectedColor,
              quantity: item.quantity
            }))
          }),
        });
      } catch (err) {
        console.error("Error saving cart:", err);
        // Still save to localStorage as fallback
        localStorage.setItem("cart", JSON.stringify(cart));
      }
    };

    saveCart();
  }, [cart, user, loading]);

  // Add item to cart - updated to handle colors
  const addToCart = (product) => {
    // Check if product has colors and a selected color
    const colorKey = product.selectedColor || 'default';
    
    // Generate unique cart ID based on product ID and color
    const cartItemId = `${product._id}_${colorKey}`;
    
    // Check if item already exists in cart
    const existingItemIndex = cart.findIndex(item => 
      item.id === cartItemId
    );

    if (existingItemIndex >= 0) {
      // Update quantity of existing item
      const updatedCart = [...cart];
      const newQuantity = updatedCart[existingItemIndex].qty + (product.quantity || 1);
      updatedCart[existingItemIndex] = {
        ...updatedCart[existingItemIndex],
        qty: newQuantity
      };
      setCart(updatedCart);
    } else {
      // Add new item to cart
      const cartItem = {
        id: cartItemId,
        productId: product._id, // Keep original product ID for reference
        name: product.name,
        price: product.price,
        image: product.images?.[0] || product.image,
        qty: product.quantity || 1,
        selectedColor: product.selectedColor,
        colorName: getColorName(product.selectedColor),
        stock: product.stock,
        hasColors: product.hasColors
      };
      setCart([...cart, cartItem]);
    }
  };

  // Helper function to get color name
  const getColorName = (colorValue) => {
    const colorMap = {
      "red": "Red",
      "blue": "Blue", 
      "green": "Green",
      "black": "Black",
      "white": "White",
      "yellow": "Yellow",
      "purple": "Purple",
      "pink": "Pink",
      "gray": "Gray",
      "brown": "Brown"
    };
    return colorMap[colorValue] || colorValue;
  };

  // Remove item
  const removeFromCart = (cartItemId) => {
    setCart(cart.filter((item) => item.id !== cartItemId));
  };

  // Update item quantity
  const updateQuantity = (cartItemId, newQuantity) => {
    if (newQuantity < 1) return;
    
    setCart(cart.map((item) => {
      if (item.id === cartItemId) {
        // Don't exceed stock
        const maxQuantity = item.stock || 99;
        return {
          ...item,
          qty: Math.min(newQuantity, maxQuantity)
        };
      }
      return item;
    }));
  };

  // Clear cart
  const clearCart = async () => {
    setCart([]);
    if (user?.email) {
      try {
        await fetch(`/api/cart?email=${encodeURIComponent(user.email)}`, {
          method: "DELETE",
        });
      } catch (err) {
        console.error("Error clearing cart:", err);
      }
    }
  };

  // Cart count
  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  // Cart total
  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        setCart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartCount,
        cartTotal,
        loading
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);