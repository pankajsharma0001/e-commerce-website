import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function MyOrders() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    processing: 0,
    delivering: 0,
    done: 0,
    rejected: 0
  });

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/login");
      return;
    }

    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);
    fetchOrders(parsedUser.email);
  }, [router]);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/login");
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);
      console.log("Current user from localStorage:", parsedUser);
      
      if (!parsedUser.email) {
        console.error("User has no email!");
        return;
      }
      
      setUser(parsedUser);
      fetchOrders(parsedUser.email);
    } catch (error) {
      console.error("Error parsing user:", error);
      router.push("/login");
    }
  }, [router]);

  const fetchOrders = async (email) => {
    try {
      setLoading(true);
      console.log("Fetching orders for email:", email);
      
      // Add email as query parameter
      const res = await fetch(`/api/customer/orders?email=${encodeURIComponent(email)}`);
      console.log("Response status:", res.status);
      
      const data = await res.json();
      console.log("API Response data:", data);
      
      if (data.success && Array.isArray(data.orders)) {
        console.log("Orders found:", data.orders.length);
        setOrders(data.orders);
        setFilteredOrders(data.orders);
        calculateStats(data.orders);
      } else {
        console.error("API returned error or invalid format:", data.message);
        setOrders([]);
        setFilteredOrders([]);
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
      setOrders([]);
      setFilteredOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (ordersList) => {
    const stats = {
      total: ordersList.length,
      pending: 0,
      processing: 0,
      delivering: 0,
      done: 0,
      rejected: 0
    };

    ordersList.forEach(order => {
      if (stats[order.status] !== undefined) {
        stats[order.status]++;
      }
    });

    setStats(stats);
  };

  useEffect(() => {
    if (selectedStatus === "all") {
      setFilteredOrders(orders);
    } else {
      setFilteredOrders(orders.filter(order => order.status === selectedStatus));
    }
  }, [selectedStatus, orders]);

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    accepted: "bg-blue-100 text-blue-800 border-blue-200",
    processing: "bg-purple-100 text-purple-800 border-purple-200",
    delivering: "bg-orange-100 text-orange-800 border-orange-200",
    done: "bg-green-100 text-green-800 border-green-200",
    rejected: "bg-red-100 text-red-800 border-red-200",
  };

  const statusIcons = {
    pending: "⏳",
    accepted: "✓",
    processing: "⚙",
    delivering: "🚚",
    done: "✅",
    rejected: "❌",
  };

  const statusLabels = {
    pending: "Pending",
    accepted: "Accepted",
    processing: "Processing",
    delivering: "Delivering",
    done: "Delivered",
    rejected: "Cancelled"
  };

  // Get items from order (supports both new and old structure)
  const getOrderItems = (order) => {
    if (order.items && order.items.length > 0) {
      return order.items;
    } else if (order.cart && order.cart.length > 0) {
      return order.cart;
    }
    return [];
  };

  // Calculate total items count
  const getTotalItems = (order) => {
    const items = getOrderItems(order);
    return items.reduce((total, item) => total + (item.quantity || item.qty || 1), 0);
  };

  // Calculate order total (with fallback)
  const getOrderTotal = (order) => {
    if (order.total) return order.total;
    
    const items = getOrderItems(order);
    return items.reduce((sum, item) => {
      const qty = item.quantity || item.qty || 1;
      return sum + (item.price * qty);
    }, 0);
  };

  // Get color name for display
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

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">Loading your orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">My Orders</h1>
              <p className="text-gray-600 mt-1">Track and manage all your orders in one place</p>
            </div>
            
            <Link href="/">
              <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Continue Shopping
              </button>
            </Link>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <div className="bg-white p-4 rounded-xl shadow">
              <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
              <div className="text-sm text-gray-600">Total Orders</div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow">
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow">
              <div className="text-2xl font-bold text-purple-600">{stats.processing}</div>
              <div className="text-sm text-gray-600">Processing</div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow">
              <div className="text-2xl font-bold text-orange-600">{stats.delivering}</div>
              <div className="text-sm text-gray-600">Delivering</div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow">
              <div className="text-2xl font-bold text-green-600">{stats.done}</div>
              <div className="text-sm text-gray-600">Delivered</div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow">
              <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
              <div className="text-sm text-gray-600">Cancelled</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <span className="font-medium text-gray-700">Filter by status:</span>
            <div className="flex flex-wrap gap-2">
              {['all', 'pending', 'processing', 'delivering', 'done', 'rejected'].map(status => (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    selectedStatus === status
                      ? status === 'all' 
                        ? 'bg-gray-800 text-white' 
                        : statusColors[status].replace('100', '600').replace('800', 'white')
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status === 'all' ? 'All Orders' : statusLabels[status]}
                  {status !== 'all' && (
                    <span className="ml-2 px-2 py-1 text-xs rounded-full bg-white bg-opacity-20">
                      {stats[status]}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              {selectedStatus === 'all' ? 'No orders yet' : `No ${selectedStatus} orders`}
            </h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              {selectedStatus === 'all' 
                ? "You haven't placed any orders yet. Start shopping to see your orders here!"
                : `You don't have any ${statusLabels[selectedStatus].toLowerCase()} orders.`
              }
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/products">
                <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition">
                  Browse Products
                </button>
              </Link>
              {selectedStatus !== 'all' && (
                <button
                  onClick={() => setSelectedStatus('all')}
                  className="border-2 border-gray-300 hover:bg-gray-50 text-gray-700 px-6 py-3 rounded-lg font-semibold transition"
                >
                  View All Orders
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order) => {
              const orderItems = getOrderItems(order);
              const totalItems = getTotalItems(order);
              const orderTotal = getOrderTotal(order);
              
              return (
                <div
                  key={order._id}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                >
                  {/* Order Header */}
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 border-b">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                          <span className={`px-4 py-2 rounded-full font-semibold border ${statusColors[order.status]}`}>
                            {statusIcons[order.status]} {statusLabels[order.status]}
                          </span>
                          <span className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-sm font-medium">
                            {totalItems} item{totalItems !== 1 ? 's' : ''}
                          </span>
                          {order.paymentMethod && (
                            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                              {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-4">
                          <div>
                            <p className="text-sm text-gray-600">Order ID</p>
                            <p className="text-lg font-bold text-gray-800 truncate">
                              #{order.trackingId}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Order Date</p>
                            <p className="font-medium text-gray-800">
                              {formatDate(order.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Total Amount</p>
                        <p className="text-2xl font-bold text-indigo-600">
                          Rs. {orderTotal.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Order Items Preview */}
                  <div className="p-6">
                    <div className="mb-4">
                      <h4 className="font-semibold text-gray-800 mb-3">Order Items</h4>
                      <div className="space-y-3">
                        {orderItems.slice(0, 2).map((item, idx) => (
                          <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <div className="w-16 h-16 flex-shrink-0">
                              <img
                                src={item.image || '/placeholder-image.jpg'}
                                alt={item.name}
                                className="w-full h-full object-cover rounded-lg"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-800 truncate">{item.name}</p>
                              <div className="flex flex-wrap items-center gap-3 mt-1">
                                <span className="text-sm text-gray-600">
                                  Qty: {item.quantity || item.qty || 1}
                                </span>
                                <span className="text-sm text-gray-600">
                                  Price: Rs. {item.price}
                                </span>
                                {item.color && (
                                  <div className="flex items-center gap-1">
                                    <div 
                                      className="w-3 h-3 rounded-full border border-gray-300"
                                      style={{ backgroundColor: getColorHex(item.color) }}
                                    ></div>
                                    <span className="text-xs text-gray-600">{getColorName(item.color)}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-gray-800">
                                Rs. {(item.price * (item.quantity || item.qty || 1)).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))}
                        
                        {orderItems.length > 2 && (
                          <div className="text-center py-3 border-t border-gray-200">
                            <p className="text-gray-600">
                              + {orderItems.length - 2} more item{orderItems.length - 2 !== 1 ? 's' : ''}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Order Summary */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Customer</p>
                          <p className="font-medium text-gray-600">{order.name}</p>
                          <p className="text-sm text-gray-600">{order.phone}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Payment</p>
                          <p className="font-medium text-gray-600">
                            {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
                          </p>
                          {order.subtotal && (
                            <p className="text-sm text-gray-600">
                              Subtotal: Rs. {order.subtotal.toLocaleString()}
                            </p>
                          )}
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Shipping</p>
                          <p className="font-medium text-gray-600">
                            {order.shippingFee === 0 ? 'FREE Shipping' : `Rs. ${order.shippingFee}`}
                          </p>
                          <p className="text-sm text-gray-600">
                            Last updated: {new Date(order.updatedAt || order.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="bg-gray-50 px-6 py-4 border-t">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Link href={`/order-tracking/${order._id}`} className="flex-1">
                        <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Track Order
                        </button>
                      </Link>
                      
                      {order.status === 'done' && (
                        <button className="sm:w-auto px-6 py-3 border-2 border-green-600 text-green-600 hover:bg-green-50 rounded-lg font-semibold transition">
                          ✅ Order Delivered
                        </button>
                      )}
                      
                      {order.status === 'rejected' && (
                        <button className="sm:w-auto px-6 py-3 border-2 border-red-600 text-red-600 hover:bg-red-50 rounded-lg font-semibold transition">
                          ❌ Order Cancelled
                        </button>
                      )}
                      
                      <button
                        onClick={() => window.print()}
                        className="sm:w-auto px-6 py-3 border-2 border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-semibold transition"
                      >
                        Print Invoice
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination (if needed) */}
        {filteredOrders.length > 0 && (
          <div className="mt-8 flex justify-center">
            <div className="flex items-center gap-2">
              <button className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
                Previous
              </button>
              <span className="px-4 py-2 text-gray-700">Page 1 of 1</span>
              <button className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
                Next
              </button>
            </div>
          </div>
        )}

        {/* Help Section */}
        <div className="mt-12 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">Need Help?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Track Your Order</h4>
              <p className="text-gray-600">
                Click on "Track Order" to see real-time updates about your delivery status.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Contact Support</h4>
              <p className="text-gray-600">
                Have questions? Contact our support team at 
                <a href="mailto:support@example.com" className="text-indigo-600 font-medium ml-1 hover:underline">
                  support@example.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
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