import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useCart } from "../context/CartContext";

export default function Cart() {
  const router = useRouter();
  const { cart, removeFromCart, setCart } = useCart();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState([]);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/login");
    } else {
      setUser(JSON.parse(storedUser));
      setLoading(false);
    }
  }, [router]);

  // Set first product as checked by default when cart loads
  useEffect(() => {
    if (cart.length > 0 && selectedItems.length === 0) {
      setSelectedItems([cart[0].id]);
    }
  }, [cart.length]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const increaseQty = (id) => {
    setCart(
      cart.map(item =>
        item.id === id ? { ...item, qty: (item.qty || 1) + 1 } : item
      )
    );
  };

  const decreaseQty = (id) => {
    setCart(
      cart.map(item =>
        item.id === id && item.qty > 1
          ? { ...item, qty: item.qty - 1 } : item
      )
    );
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

  const total = cart.reduce(
    (sum, item) => (selectedItems.includes(item.id) ? sum + item.price * (item.qty || 1) : sum),
    0
  );

  const handleCheckoutClick = (e) => {
    if (selectedItems.length === 0) {
      e.preventDefault();
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } else {
      localStorage.setItem("selectedItems", JSON.stringify(selectedItems));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-4xl font-bold mb-8 text-gray-800 text-center">Your Cart</h1>

        {cart.length === 0 ? (
          <p className="text-xl text-gray-600 text-center">Your cart is empty 😞</p>
        ) : (
          <div>
            {/* Select All */}
            <div className="bg-white p-5 mb-4 rounded-xl shadow flex items-center gap-4">
              <input
                type="checkbox"
                checked={selectedItems.length === cart.length && cart.length > 0}
                onChange={selectAllItems}
                className="w-5 h-5 cursor-pointer"
              />
              <label className="text-lg font-semibold text-gray-800 cursor-pointer">
                Select All Items ({selectedItems.length}/{cart.length})
              </label>
            </div>

            {cart.map((item) => (
            <div
              key={item.id}
              className="flex flex-col bg-white p-5 mb-4 rounded-xl shadow hover:shadow-lg transition"
            >
              {/* Header: Name + Remove Button */}
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xl text-gray-800 font-semibold">{item.name}</h3>
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="text-red-600 font-bold text-xl hover:text-red-700 transition"
                >
                  ✖
                </button>
              </div>

              {/* Main Info */}
              <div className="flex items-center gap-4">
                <input
                  type="checkbox"
                  checked={selectedItems.includes(item.id)}
                  onChange={() => toggleItemSelection(item.id)}
                  className="w-5 h-5 cursor-pointer"
                />

                <img
                  src={item.image}
                  className="w-24 h-24 rounded-lg object-cover"
                />

                <div className="flex-1">
                  <p className="text-gray-600">Rs. {item.price}</p>

                  <div className="flex items-center text-gray-600 gap-4 mt-3">
                    <button
                      onClick={() => decreaseQty(item.id)}
                      className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400 transition"
                    >
                      -
                    </button>

                    <span className="font-semibold">{item.qty}</span>

                    <button
                      onClick={() => increaseQty(item.id)}
                      className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400 transition"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

            <div className={`mt-8 p-6 bg-white rounded-xl shadow-md ${shake ? "animate-shake" : ""}`}>
              <h2 className="text-2xl font-bold text-gray-800">
                Total: Rs. {total}
              </h2>

              <Link href={selectedItems.length > 0 ? "/checkout" : "#"}>
                <button 
                  onClick={handleCheckoutClick}
                  className="mt-5 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 text-lg rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                >
                  {selectedItems.length === 0 ? "Select Items to Checkout" : "Proceed to Checkout"}
                </button>
              </Link>
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
