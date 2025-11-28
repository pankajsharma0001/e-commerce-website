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
          body: JSON.stringify({ email: user.email, items: cart }),
        });
      } catch (err) {
        console.error("Error saving cart:", err);
        // Still save to localStorage as fallback
        localStorage.setItem("cart", JSON.stringify(cart));
      }
    };

    saveCart();
  }, [cart, user, loading]);

  // Add item to cart
  const addToCart = (product) => {
    const exists = cart.find((item) => item.id === product._id);

    if (exists) {
      setCart(
        cart.map((item) =>
          item.id === product._id
            ? { ...item, qty: (item.qty || 1) + 1 }
            : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          id: product._id,
          name: product.name,
          price: product.price,
          image: product.image,
          qty: 1,
        },
      ]);
    }
  };

  // Remove item
  const removeFromCart = (id) => {
    setCart(cart.filter((item) => item.id !== id));
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
  const cartCount = cart.reduce((sum, item) => sum + (item.qty || 1), 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        setCart,
        addToCart,
        removeFromCart,
        clearCart,
        cartCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);

