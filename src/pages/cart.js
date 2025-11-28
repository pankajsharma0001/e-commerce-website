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
        <p className="text-xl text-gray-600">Loading...</p>
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
          ? { ...item, qty: item.qty - 1 }
          : item
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-4xl font-bold mb-8 text-gray-800">Your Cart</h1>

        {cart.length === 0 ? (
          <p className="text-xl text-gray-600">Your cart is empty 😞</p>
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
                className="flex items-center gap-6 bg-white p-5 mb-4 rounded-xl shadow"
              >
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
                  <h3 className="text-xl text-gray-800 font-semibold">{item.name}</h3>
                  <p className="text-gray-600">Rs. {item.price}</p>

                  <div className="flex items-center text-gray-600 gap-4 mt-3">
                    <button
                      onClick={() => decreaseQty(item.id)}
                      className="px-3 py-1 bg-gray-300 rounded"
                    >
                      -
                    </button>

                    <span className="font-semibold">{item.qty}</span>

                    <button
                      onClick={() => increaseQty(item.id)}
                      className="px-3 py-1 bg-gray-300 rounded"
                    >
                      +
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => removeFromCart(item.id)}
                  className="text-red-600 font-bold"
                >
                  ✖
                </button>
              </div>
            ))}

            <div className="mt-8 p-6 bg-white rounded-xl shadow-md">
              <h2 className="text-2xl font-bold text-gray-800">
                Total: Rs. {total}
              </h2>

              <Link href={selectedItems.length > 0 ? "/checkout" : "#"}>
                <button 
                  disabled={selectedItems.length === 0}
                  onClick={(e) => {
                    if (selectedItems.length === 0) {
                      e.preventDefault();
                    } else {
                      localStorage.setItem("selectedItems", JSON.stringify(selectedItems));
                    }
                  }}
                  className="mt-5 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 text-lg rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                >
                  {selectedItems.length === 0 ? "Select Items to Checkout" : "Proceed to Checkout"}
                </button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
