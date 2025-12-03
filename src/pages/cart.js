import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useCart } from "../context/CartContext";

export default function Cart() {
  const router = useRouter();
  const { cart, removeFromCart, updateQuantity, cartTotal, loading } = useCart();
  const [user, setUser] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [shake, setShake] = useState(false);
  const [localLoading, setLocalLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/login");
    } else {
      setUser(JSON.parse(storedUser));
      setLocalLoading(false);
    }
  }, [router]);

  // Set first product as checked by default when cart loads
  useEffect(() => {
    if (cart.length > 0 && selectedItems.length === 0) {
      setSelectedItems([cart[0].id]);
    }
  }, [cart.length]);

  const handleIncreaseQty = (itemId, currentQty, stock) => {
    if (currentQty < (stock || 99)) {
      updateQuantity(itemId, currentQty + 1);
    }
  };

  const handleDecreaseQty = (itemId, currentQty) => {
    if (currentQty > 1) {
      updateQuantity(itemId, currentQty - 1);
    }
  };

  const toggleItemSelection = (id) => {
    setSelectedItems(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const selectAllItems = () => {
    if (selectedItems.length === cart.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(cart.map(item => item.id));
    }
  };

  const selectedTotal = cart.reduce(
    (sum, item) => (selectedItems.includes(item.id) ? sum + item.price * item.qty : sum),
    0
  );

  const selectedItemsCount = selectedItems.length;

  const handleCheckoutClick = (e) => {
    if (selectedItems.length === 0) {
      e.preventDefault();
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } else {
      // Store selected items and their quantities for checkout
      const selectedCartItems = cart.filter(item => selectedItems.includes(item.id));
      localStorage.setItem("checkoutItems", JSON.stringify(selectedCartItems));
    }
  };

  const clearSelected = () => {
    setSelectedItems([]);
  };

  if (localLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4 mx-auto"></div>
          <p className="text-gray-600">Loading your cart...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-4xl font-bold mb-8 text-gray-800 text-center">Your Shopping Cart</h1>

        {cart.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🛒</div>
            <p className="text-xl text-gray-600 mb-6">Your cart is empty</p>
            <Link href="/">
              <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg text-lg font-medium transition">
                Continue Shopping
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Cart Items */}
            <div className="lg:col-span-2">
              {/* Select All Section */}
              <div className="bg-white p-4 mb-6 rounded-xl shadow flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedItems.length === cart.length && cart.length > 0}
                    onChange={selectAllItems}
                    className="w-5 h-5 cursor-pointer text-indigo-600 rounded"
                  />
                  <label className="text-lg font-semibold text-gray-800 cursor-pointer">
                    Select All Items ({selectedItems.length}/{cart.length})
                  </label>
                </div>
                {selectedItems.length > 0 && (
                  <button
                    onClick={clearSelected}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Clear Selection
                  </button>
                )}
              </div>

              {/* Cart Items List */}
              <div className="space-y-4">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition"
                  >
                    <div className="flex flex-col md:flex-row gap-6">
                      {/* Checkbox and Image */}
                      <div className="flex items-start gap-4">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(item.id)}
                          onChange={() => toggleItemSelection(item.id)}
                          className="w-5 h-5 cursor-pointer text-indigo-600 rounded mt-2"
                        />
                        <div className="w-32 h-32 rounded-lg overflow-hidden bg-gray-100">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>

                      {/* Item Details */}
                      <div className="flex-1">
                        {/* Item Header */}
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="text-xl font-semibold text-gray-800">{item.name}</h3>
                            {item.selectedColor && (
                              <div className="flex items-center gap-2 mt-1">
                                <div
                                  className="w-4 h-4 rounded-full border border-gray-300"
                                  style={{
                                    backgroundColor: getColorHex(item.selectedColor)
                                  }}
                                ></div>
                                <span className="text-sm text-gray-600">
                                  Color: {item.colorName || item.selectedColor}
                                </span>
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-gray-400 hover:text-red-600 transition p-1"
                            title="Remove item"
                          >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>

                        {/* Price and Quantity */}
                        <div className="flex flex-wrap items-center justify-between gap-4">
                          <div>
                            <p className="text-2xl font-bold text-indigo-600">
                              Rs. {item.price.toLocaleString()}
                            </p>
                            {item.qty > 1 && (
                              <p className="text-sm text-gray-500">
                                Rs. {item.price} × {item.qty}
                              </p>
                            )}
                          </div>

                          {/* Quantity Controls */}
                          <div className="flex items-center border border-gray-300 rounded-lg">
                            <button
                              onClick={() => handleDecreaseQty(item.id, item.qty)}
                              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-l-lg disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={item.qty <= 1}
                            >
                              -
                            </button>
                            <span className="px-4 py-2 text-gray-600 border-x border-gray-300 min-w-[60px] text-center font-medium">
                              {item.qty}
                            </span>
                            <button
                              onClick={() => handleIncreaseQty(item.id, item.qty, item.stock)}
                              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-r-lg disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={item.qty >= (item.stock || 99)}
                            >
                              +
                            </button>
                          </div>

                          {/* Item Total */}
                          <div className="text-right">
                            <p className="text-lg font-bold text-gray-800">
                              Rs. {(item.price * item.qty).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        {/* Stock Warning */}
                        {item.stock && item.qty >= item.stock && (
                          <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-700">
                            ⚠ Maximum available quantity reached
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column - Order Summary */}
            <div className="lg:col-span-1">
              <div className={`sticky top-4 bg-white rounded-xl shadow-lg p-6 ${shake ? "animate-shake" : ""}`}>
                <h2 className="text-2xl font-bold text-gray-800 mb-6 pb-4 border-b">
                  Order Summary
                </h2>

                {/* Cart Summary */}
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Selected Items:</span>
                    <span className="font-medium text-gray-600">{selectedItemsCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium text-gray-600">Rs. {selectedTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping:</span>
                    <span className="font-medium text-green-600">Free</span>
                  </div>
                  <div className="flex justify-between pt-4 border-t border-gray-200">
                    <span className="text-lg font-bold text-gray-800">Total:</span>
                    <span className="text-2xl font-bold text-indigo-600">
                      Rs. {selectedTotal.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Checkout Button */}
                <Link href={selectedItemsCount > 0 ? "/checkout" : "#"}>
                  <button 
                    onClick={handleCheckoutClick}
                    className={`w-full py-4 text-lg font-medium rounded-lg transition ${
                      selectedItemsCount === 0
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-indigo-600 hover:bg-indigo-700 transform hover:-translate-y-0.5"
                    } text-white`}
                    disabled={selectedItemsCount === 0}
                  >
                    {selectedItemsCount === 0 
                      ? "Select Items to Checkout" 
                      : `Proceed to Checkout (${selectedItemsCount} items)`}
                  </button>
                </Link>

                {/* Continue Shopping */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <Link href="/">
                    <button className="w-full py-3 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-medium transition">
                      Continue Shopping
                    </button>
                  </Link>
                </div>

                {/* Cart Info */}
                <div className="mt-6 text-sm text-gray-500 space-y-2">
                  <p className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Secure checkout
                  </p>
                  <p className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Free shipping on all orders
                  </p>
                </div>
              </div>

              {/* Cart Stats */}
              <div className="mt-6 bg-white rounded-xl shadow p-6">
                <h3 className="font-semibold text-gray-800 mb-3">Cart Statistics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Items:</span>
                    <span className="font-medium text-gray-600">{cart.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Quantity:</span>
                    <span className="font-medium text-gray-600">{cart.reduce((sum, item) => sum + item.qty, 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cart Total Value:</span>
                    <span className="font-medium text-green-600">Rs. {cartTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          50% { transform: translateX(5px); }
          75% { transform: translateX(-5px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
}

// Helper function to get color hex code
function getColorHex(colorValue) {
  const colorMap = {
    "red": "#EF4444",
    "blue": "#3B82F6",
    "green": "#10B981",
    "black": "#000000",
    "white": "#FFFFFF",
    "yellow": "#F59E0B",
    "purple": "#8B5CF6",
    "pink": "#EC4899",
    "gray": "#6B7280",
    "brown": "#92400E"
  };
  return colorMap[colorValue] || "#ccc";
}