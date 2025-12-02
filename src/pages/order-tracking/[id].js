import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function OrderTracking() {
  const router = useRouter();
  const { id } = router.query;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    fetch("/api/customer/orders")
      .then((res) => res.json())
      .then((data) => {
        const foundOrder = data.find((o) => o._id === id);
        if (foundOrder) {
          setOrder(foundOrder);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching order:", err);
        setLoading(false);
      });
  }, [id]);

  const statusTimeline = [
    { step: "accepted", label: "Order Accepted", icon: "✓" },
    { step: "processing", label: "Processing", icon: "⚙" },
    { step: "delivering", label: "On the Way", icon: "🚚" },
    { step: "done", label: "Delivered", icon: "✅" },
  ];

  const getStepIndex = (currentStatus) => {
    return statusTimeline.findIndex((step) => step.step === currentStatus);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-2xl text-red-600 mb-4">❌ Order not found</p>
          <Link href="/my-orders">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold">
              Back to Orders
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const currentStepIndex = getStepIndex(order.status);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-6">
        {/* Header */}
        <div className="mb-8">
          <Link href="/my-orders">
            <button className="text-blue-600 hover:text-blue-700 font-semibold mb-4">
              ← Back to Orders
            </button>
          </Link>
          <h1 className="text-4xl font-bold text-gray-800">Track Your Order</h1>
        </div>

        {/* Order Info Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 pb-6 border-b">
            <div>
              <p className="text-sm text-gray-600 font-semibold">Tracking ID</p>
              <p className="text-xl font-bold text-gray-800">#{order.trackingId}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 font-semibold">Order Date</p>
              <p className="text-xl font-semibold text-gray-800">
                {new Date(order.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 font-semibold">Total</p>
              <p className="text-xl font-bold text-indigo-600">Rs. {order.total}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 font-semibold">Status</p>
              <p className="text-xl font-semibold text-blue-600">
                {order.status.toUpperCase()}
              </p>
            </div>
          </div>

          {/* Customer Info */}
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Delivery Address</h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-semibold text-gray-800">{order.name}</p>
              <p className="text-gray-600">{order.phone}</p>
              <p className="text-gray-600">{order.address}</p>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 overflow-x-auto">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Delivery Timeline</h2>
          <div className="flex justify-between items-center relative min-w-[500px]">
            <div className="absolute top-10 left-0 right-0 h-1 bg-gray-300"></div>
            {statusTimeline.map((item, index) => (
              <div key={item.step} className="flex flex-col items-center relative z-10 px-2">
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold transition-all ${
                    index <= currentStepIndex
                      ? "bg-green-500 text-white shadow-lg"
                      : "bg-gray-300 text-gray-600"
                  }`}
                >
                  {item.icon}
                </div>
                <p
                  className={`text-center mt-3 font-semibold text-sm ${
                    index <= currentStepIndex ? "text-green-600" : "text-gray-500"
                  }`}
                >
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Order Items</h2>
          <div className="space-y-3">
            {order.cart.map((item, idx) => (
              <div
                key={idx}
                className="flex justify-between items-center p-4 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-semibold text-gray-800">{item.name}</p>
                  <p className="text-sm text-gray-600">Quantity: {item.qty}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-indigo-600">
                    Rs. {item.price * item.qty}
                  </p>
                  <p className="text-sm text-gray-600">
                    @ Rs. {item.price} each
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t pt-4 mt-4 flex justify-between items-center">
            <p className="text-lg font-semibold text-gray-800">Total:</p>
            <p className="text-2xl font-bold text-indigo-600">Rs. {order.total}</p>
          </div>
        </div>

        {/* Status Message */}
        <div className="bg-blue-50 border-2 border-blue-200 p-6 rounded-lg text-center mb-8">
          <p className="text-blue-900 font-semibold text-lg">
            {order.status === "accepted" &&
              "Your order has been accepted and will be processed soon!"}
            {order.status === "processing" &&
              "Your order is being prepared for shipment."}
            {order.status === "delivering" &&
              "Your order is on the way! 🚚 Expect delivery soon."}
            {order.status === "done" &&
              "Your order has been delivered. Thank you for shopping with us! 🎉"}
          </p>
        </div>

        {/* Action Button */}
        <Link href="/my-orders">
          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition">
            ← Back to My Orders
          </button>
        </Link>
      </div>
    </div>
  );
}
