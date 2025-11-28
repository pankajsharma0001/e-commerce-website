import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function MyOrders() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/login");
      return;
    }

    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);

    // Fetch all orders (including admin-deleted) and filter by user email
    fetch("/api/customer/orders")
      .then((res) => res.json())
      .then((data) => {
        const userOrders = data.filter(
          (order) => order.email === parsedUser.email
        );
        // Show all orders except rejected ones (but include admin-deleted)
        const filteredOrders = userOrders.filter(
          (order) => order.status !== "rejected"
        );
        setOrders(filteredOrders);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching orders:", err);
        setLoading(false);
      });
  }, [router]);

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800",
    accepted: "bg-blue-100 text-blue-800",
    processing: "bg-purple-100 text-purple-800",
    delivering: "bg-orange-100 text-orange-800",
    done: "bg-green-100 text-green-800",
  };

  const statusIcons = {
    pending: "⏳",
    accepted: "✓",
    processing: "⚙",
    delivering: "🚚",
    done: "✅",
    delivering: "🚚",
    done: "✅",
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-6">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">My Orders</h1>
        <p className="text-gray-600 mb-8">
          View and track all your orders
        </p>

        {orders.length === 0 ? (
          <div className="bg-white rounded-lg p-12 text-center">
            <p className="text-gray-600 text-xl mb-4">📭 No orders found</p>
            <p className="text-gray-500 mb-6">
              You don't have any shipped or processing orders yet.
            </p>
            <Link href="/products">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold">
                Start Shopping
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div
                key={order._id}
                className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Order ID</p>
                    <p className="text-lg font-bold text-gray-800">
                      #{order.trackingId}
                    </p>
                  </div>
                  <span
                    className={`px-4 py-2 rounded-full font-semibold ${
                      statusColors[order.status]
                    }`}
                  >
                    {statusIcons[order.status]} {order.status.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 pb-4 border-b">
                  <div>
                    <p className="text-sm text-gray-600">Order Date</p>
                    <p className="font-semibold text-gray-800">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Amount</p>
                    <p className="font-bold text-indigo-600 text-lg">
                      Rs. {order.total}
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">Items</p>
                  <div className="space-y-1">
                    {order.cart.map((item, idx) => (
                      <p key={idx} className="text-gray-700">
                        • {item.name} x{item.qty} @ Rs. {item.price}
                      </p>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4">
                  {order.status !== "done" ? (
                    <Link href={`/order-tracking/${order._id}`}>
                      <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition">
                        🚚 Track Order
                      </button>
                    </Link>
                  ) : (
                    <button className="bg-gray-400 text-white px-6 py-2 rounded-lg font-semibold cursor-default">
                      ✅ Delivered
                    </button>
                  )}
                  <Link href="/products">
                    <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold transition">
                      🛍️ Shop More
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
