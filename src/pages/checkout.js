import { useCart } from "../context/CartContext";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function Checkout() {
  const { cart, setCart } = useCart();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [user, setUser] = useState(null);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [trackingId, setTrackingId] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      setName(userData.name || "");
      setPhone(userData.mobile || "");
    }

    const selected = localStorage.getItem("selectedItems");
    if (selected) setSelectedItems(JSON.parse(selected));
  }, []);

  const checkoutItems = cart.filter(item => selectedItems.includes(item.id));

  const total = checkoutItems.reduce(
    (sum, item) => sum + item.price * (item.qty || 1),
    0
  );

  const generateTrackingId = () =>
    "TRK" + Date.now() + Math.random().toString(36).substr(2, 9).toUpperCase();

  const removeItem = (id) => {
    setCart(cart.filter(item => item.id !== id));
    setSelectedItems(selectedItems.filter(itemId => itemId !== id));
  };

  const changeQty = (id, delta) => {
    setCart(
      cart.map(item =>
        item.id === id
          ? { ...item, qty: Math.max(1, (item.qty || 1) + delta) }
          : item
      )
    );
  };

  const placeOrder = async () => {
    if (!name || !phone || !address) {
      alert("Please fill all fields!");
      return;
    }
    if (checkoutItems.length === 0) {
      alert("No items selected for checkout!");
      return;
    }

    setLoading(true);
    const newTrackingId = generateTrackingId();

    const order = {
      name,
      phone,
      address,
      email: user?.email,
      cart: checkoutItems,
      total,
      date: new Date().toString(),
      trackingId: newTrackingId,
    };

    try {
      const res = await fetch("/api/customer/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(order),
      });

      const response = await res.json();
      if (response.success || response.orderId) {
        setCart([]);
        setTrackingId(newTrackingId);
        setOrderPlaced(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        alert("Failed to place order: " + response.message);
      }
    } catch (error) {
      alert("Error placing order: " + error.message);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (orderPlaced) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center bg-gray-50 py-12">
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-lg mx-auto">
          <h1 className="text-4xl font-bold text-green-600 mb-4">Order Placed 🎉</h1>
          <div className="bg-green-50 border-2 border-green-200 p-6 rounded-lg mb-6">
            <p className="text-gray-700 mb-2">Your Tracking ID:</p>
            <p className="text-2xl font-bold text-green-700">{trackingId}</p>
            <p className="text-sm text-gray-600 mt-2">Save this ID to track your order</p>
          </div>
          <p className="text-gray-600 text-lg mb-6">We will contact you soon!</p>
          <div>
            <Link href="/my-orders">
              <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-6 rounded-lg font-semibold transition mb-5">
                📦 View My Orders
              </button>
            </Link>
            <Link href="/products">
              <button className="w-full bg-gray-600 hover:bg-gray-700 text-white py-3 px-6 rounded-lg font-semibold transition">
                Continue Shopping
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* CUSTOMER FORM */}
        <div className="bg-white text-gray-800 p-8 rounded-xl shadow-md">
          <h2 className="text-3xl font-bold mb-6">Billing Details</h2>
          <label className="block mb-4">
            <span className="font-medium">Full Name</span>
            <input type="text" className="w-full p-3 mt-1 border rounded" value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="block mb-4">
            <span className="font-medium">Phone Number</span>
            <input type="text" className="w-full p-3 mt-1 border rounded" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </label>
          <label className="block mb-4">
            <span className="font-medium">Address</span>
            <textarea className="w-full p-3 mt-1 border rounded" value={address} onChange={(e) => setAddress(e.target.value)}></textarea>
          </label>
          <button
            className={`w-full py-3 text-lg rounded-lg mt-5 font-semibold transition ${
              checkoutItems.length === 0
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700 text-white"
            }`}
            onClick={placeOrder}
            disabled={checkoutItems.length === 0 || loading}
          >
            {loading ? "Placing Order..." : "Place Order"}
          </button>
        </div>

        {/* ORDER SUMMARY */}
        <div className="bg-white text-gray-800 p-8 rounded-xl shadow-md">
          <h2 className="text-3xl font-bold mb-6">Order Summary</h2>

          {checkoutItems.length === 0 ? (
            <p className="text-gray-600">No items selected for checkout</p>
          ) : (
            <div className="space-y-4">
              {checkoutItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-4 border-b pb-2">
                  <div className="flex items-center gap-3">
                    <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded" />
                    <div>
                      <p className="font-semibold">{item.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <button
                          onClick={() => changeQty(item.id, -1)}
                          className="px-2 py-1 bg-gray-300 rounded"
                        >-</button>
                        <span>{item.qty || 1}</span>
                        <button
                          onClick={() => changeQty(item.id, 1)}
                          className="px-2 py-1 bg-gray-300 rounded"
                        >+</button>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="font-semibold">Rs. {item.price * (item.qty || 1)}</span>
                    <button onClick={() => removeItem(item.id)} className="text-red-600 font-bold">
                      ✖
                    </button>
                  </div>
                </div>
              ))}

              <hr className="my-4" />
              <h3 className="text-2xl font-bold">
                Total: <span className="text-indigo-600">Rs. {total}</span>
              </h3>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
