import { useState, useEffect } from "react";
import Link from "next/link";

export default function OrderTracking() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customerEmail, setCustomerEmail] = useState("");
  const [filteredOrders, setFilteredOrders] = useState([]);

  useEffect(() => {
    // Fetch all orders (including admin-deleted for customer history)
    fetch("/api/customer/orders")
      .then((res) => res.json())
      .then((data) => {
        setOrders(data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching orders:", err);
        setLoading(false);
      });
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!customerEmail.trim()) {
      setFilteredOrders(orders);
      return;
    }
    const searchTerm = customerEmail.toLowerCase();
    const filtered = orders.filter(
      (order) =>
        order.phone.includes(customerEmail) ||
        order.name.toLowerCase().includes(searchTerm) ||
        (order.trackingId && order.trackingId.toLowerCase().includes(searchTerm))
    );
    setFilteredOrders(filtered);
  };

  const displayOrders = customerEmail.trim() ? filteredOrders : [];

  const statusTimeline = {
    pending: [
      { step: "pending", label: "Order Placed", icon: "📦" },
      { step: "accepted", label: "Accepted", icon: "✓" },
      { step: "processing", label: "Processing", icon: "⚙" },
      { step: "delivering", label: "On the Way", icon: "🚚" },
      { step: "done", label: "Delivered", icon: "✅" },
    ],
    rejected: [
      { step: "pending", label: "Order Placed", icon: "📦" },
      { step: "rejected", label: "Rejected", icon: "✗" },
    ],
  };

  const getTimeline = (status) => (status === "rejected" ? statusTimeline.rejected : statusTimeline.pending);
  const getStepIndex = (timeline, currentStatus) => timeline.findIndex((step) => step.step === currentStatus);

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-5xl font-bold text-gray-800 mb-2">Track Your Order</h1>
        <p className="text-gray-600 text-lg mb-8">
          Enter your tracking ID, phone number, or name to track your order status.
        </p>

        {/* SEARCH FORM */}
        <form onSubmit={handleSearch} className="bg-white p-6 md:p-8 rounded-2xl shadow-lg mb-10">
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="Tracking ID, phone number, or name"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              className="flex-1 p-4 border-2 border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:border-indigo-600"
            />
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-4 rounded-lg font-semibold w-full md:w-auto transition"
            >
              Search
            </button>
          </div>
        </form>

        {/* LOADING */}
        {loading && (
          <div className="text-center text-gray-600 text-xl py-12">Loading orders...</div>
        )}

        {/* NO RESULTS */}
        {!loading && customerEmail.trim() && displayOrders.length === 0 && (
          <div className="bg-yellow-50 border-2 border-yellow-200 p-8 rounded-lg text-center">
            <p className="text-yellow-800 text-lg">
              No orders found for "{customerEmail}".
            </p>
          </div>
        )}

        {/* ORDERS DISPLAY */}
        {displayOrders.length > 0 && (
          <div className="space-y-8">
            {displayOrders.map((order) => {
              const timeline = getTimeline(order.status);
              const currentStep = getStepIndex(timeline, order.status);

              return (
                <div key={order._id} className="bg-white p-6 md:p-8 rounded-2xl shadow-lg border-l-4 border-indigo-600">
                  {/* HEADER */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Order ID</p>
                      <p className="text-lg font-bold text-gray-800">{order._id?.toString().slice(-8).toUpperCase()}</p>
                    </div>
                    <div className="text-left md:text-right">
                      <p className="text-sm text-gray-500">Order Date</p>
                      <p className="text-lg font-semibold text-gray-800">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* STATUS TIMELINE */}
                  <div className="mb-8 overflow-x-auto">
                    <div className="flex items-center gap-6 min-w-max">
                      {timeline.map((step, index) => (
                        <div key={step.step} className="flex flex-col items-center">
                          <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold transition-all ${
                              index <= currentStep ? "bg-green-500 text-white" : "bg-gray-300 text-gray-600"
                            }`}
                          >
                            {step.icon}
                          </div>
                          <p
                            className={`text-xs font-semibold mt-2 text-center ${
                              index <= currentStep ? "text-green-600" : "text-gray-500"
                            }`}
                          >
                            {step.label}
                          </p>
                          {index < timeline.length - 1 && (
                            <div className={`h-1 w-12 mt-4 ${index < currentStep ? "bg-green-500" : "bg-gray-300"}`}></div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CUSTOMER & ORDER INFO */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <p className="text-sm text-gray-500 font-semibold">Customer</p>
                      <p className="text-gray-800 font-medium">{order.name}</p>
                      <p className="text-gray-600">{order.phone}</p>
                      <p className="text-gray-600 text-sm mt-1">{order.address}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 font-semibold">Total Amount</p>
                      <p className="text-3xl font-bold text-indigo-600">Rs. {order.total}</p>
                    </div>
                  </div>

                  {/* ORDER ITEMS */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 font-semibold mb-3">Order Items</p>
                    <div className="space-y-2">
                      {order.cart.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
                            />
                            <span className="text-gray-700 truncate">{item.name} x{item.qty}</span>
                          </div>
                          <span className="font-medium text-gray-800">Rs. {item.price * item.qty}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* STATUS MESSAGE */}
                  <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
                    <p className="text-blue-900 font-semibold">
                      {order.status === "pending" && "Your order has been placed and is pending acceptance."}
                      {order.status === "accepted" && "Your order has been accepted and will be processed soon."}
                      {order.status === "processing" && "Your order is being processed and will be shipped soon."}
                      {order.status === "delivering" && "Your order is on the way! You will receive it soon."}
                      {order.status === "done" && "Your order has been delivered. Thank you for shopping with us!"}
                      {order.status === "rejected" && "Your order has been rejected. Please contact support for more information."}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && !customerEmail.trim() && (
          <div className="bg-gray-100 p-12 rounded-xl text-center">
            <p className="text-gray-600 text-lg mb-4">
              🔍 Search for your orders using tracking ID, phone number, or name
            </p>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <footer className="text-center py-6 bg-gray-900 text-gray-300 text-sm mt-12">
        © {new Date().getFullYear()} JK Mega Mart — All Rights Reserved.
      </footer>
    </div>
  );
}
