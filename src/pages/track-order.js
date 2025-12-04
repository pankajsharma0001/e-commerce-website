import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

export default function TrackOrder() {
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  // Get search query from URL if present
  useEffect(() => {
    if (router.query.trackingId) {
      setSearchQuery(router.query.trackingId);
      handleSearch(null, router.query.trackingId);
    }
  }, [router.query.trackingId]);

  const handleSearch = async (e, queryOverride = null) => {
    if (e) e.preventDefault();
    
    const searchTerm = queryOverride || searchQuery.trim();
    
    if (!searchTerm) {
      setError("Please enter tracking ID, phone number, or name");
      return;
    }

    setLoading(true);
    setError(null);
    setSearchPerformed(true);

    try {
      // Use the public tracking API endpoint
      const res = await fetch(`/api/orders/search?q=${encodeURIComponent(searchTerm)}`);
      
      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }
      
      const data = await res.json();
      console.log("Search results:", data);
      
      if (data.success && Array.isArray(data.orders)) {
        setFilteredOrders(data.orders);
      } else if (Array.isArray(data)) {
        // Handle case where API returns array directly
        setFilteredOrders(data);
      } else {
        setError(data.message || "No orders found.");
      }
    } catch (err) {
      console.error("Error searching orders:", err);
      setError("An error occurred while searching. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setFilteredOrders([]);
    setSearchPerformed(false);
    setError(null);
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

  // Format address
  const formatAddress = (address) => {
    if (typeof address === 'object' && address !== null) {
      const parts = [];
      if (address.street) parts.push(address.street);
      if (address.city) parts.push(address.city);
      if (address.province) parts.push(address.province);
      if (address.postalCode) parts.push(address.postalCode);
      return parts.join(", ");
    }
    return address || "Address not specified";
  };

  // Status timeline definitions
  const statusTimeline = {
    pending: [
      { step: "pending", label: "Order Placed", icon: "📝", color: "bg-yellow-500" },
      { step: "accepted", label: "Accepted", icon: "✓", color: "bg-blue-500" },
      { step: "processing", label: "Processing", icon: "⚙", color: "bg-purple-500" },
      { step: "delivering", label: "On the Way", icon: "🚚", color: "bg-orange-500" },
      { step: "done", label: "Delivered", icon: "✅", color: "bg-green-500" },
    ],
    rejected: [
      { step: "pending", label: "Order Placed", icon: "📝", color: "bg-yellow-500" },
      { step: "rejected", label: "Cancelled", icon: "❌", color: "bg-red-500" },
    ],
  };

  const getTimeline = (status) => 
    status === "rejected" ? statusTimeline.rejected : statusTimeline.pending;
  
  const getStepIndex = (timeline, currentStatus) => 
    timeline.findIndex((step) => step.step === currentStatus);

  // Status messages
  const statusMessages = {
    pending: "Your order has been placed and is pending acceptance.",
    accepted: "Your order has been accepted and will be processed soon.",
    processing: "Your order is being processed and will be shipped soon.",
    delivering: "Your order is on the way! You will receive it soon.",
    done: "Your order has been delivered. Thank you for shopping with us!",
    rejected: "Your order has been cancelled. Please contact support for more information.",
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

  return (
    <div className="min-h-screen bg-white font-sans">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-800 mb-3">
            Track Your Order
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Enter your tracking ID, phone number, or name to track your order status in real-time
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="max-w-2xl mx-auto">
            <form onSubmit={handleSearch} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Order By:
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    placeholder="Tracking ID, phone number, name, or email"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      if (error) setError(null);
                    }}
                    className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-700"
                    disabled={loading}
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Searching...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        Track Order
                      </>
                    )}
                  </button>
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  <p>• Tracking ID example: TRK123456789</p>
                  <p>• Phone number: 98XXXXXXXX</p>
                </div>
              </div>
              
              {searchQuery && !loading && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Clear search
                </button>
              )}
            </form>

            {/* Error Message */}
            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Searching for your orders...</p>
          </div>
        ) : searchPerformed && filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">No orders found</h3>
            <p className="text-gray-600 mb-6">
              We couldn't find any orders matching "{searchQuery}". Please check your details and try again.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={clearSearch}
                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium"
              >
                Try Different Search
              </button>
              <Link href="/my-orders">
                <button className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium">
                  View My Orders
                </button>
              </Link>
            </div>
          </div>
        ) : filteredOrders.length > 0 ? (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">
                Found {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}
              </h2>
              <button
                onClick={clearSearch}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Clear results
              </button>
            </div>

            {filteredOrders.map((order) => {
              const timeline = getTimeline(order.status);
              const currentStep = getStepIndex(timeline, order.status);
              const orderItems = getOrderItems(order);
              const totalItems = getTotalItems(order);
              const orderTotal = getOrderTotal(order);
              const formattedAddress = formatAddress(order.address);

              return (
                <div key={order._id} className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
                  {/* Order Header */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`px-4 py-2 rounded-full font-semibold border ${
                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                            order.status === 'accepted' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                            order.status === 'processing' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                            order.status === 'delivering' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                            order.status === 'done' ? 'bg-green-100 text-green-800 border-green-200' :
                            'bg-red-100 text-red-800 border-red-200'
                          }`}>
                            {order.status === 'pending' ? '⏳' :
                             order.status === 'accepted' ? '✓' :
                             order.status === 'processing' ? '⚙' :
                             order.status === 'delivering' ? '🚚' :
                             order.status === 'done' ? '✅' : '❌'} {order.status.toUpperCase()}
                          </span>
                          <span className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-sm">
                            {totalItems} item{totalItems !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-4">
                          <div>
                            <p className="text-sm text-gray-600">Tracking ID</p>
                            <p className="text-lg font-bold text-gray-800">{order.trackingId}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Order Date</p>
                            <p className="font-medium text-gray-800">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Total Amount</p>
                            <p className="text-2xl font-bold text-indigo-600">
                              Rs. {orderTotal.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="p-6 border-b">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Order Progress</h3>
                    <div className="relative">
                      {/* Progress line */}
                      <div className="absolute left-0 right-0 top-4 h-1 bg-gray-300 z-0"></div>
                      
                      {/* Filled progress line */}
                      {currentStep >= 0 && (
                        <div 
                          className="absolute left-0 top-4 h-1 bg-green-500 z-0 transition-all duration-500"
                          style={{ width: `${(currentStep / (timeline.length - 1)) * 100}%` }}
                        ></div>
                      )}

                      <div className="relative flex justify-between">
                        {timeline.map((step, index) => (
                          <div key={step.step} className="flex flex-col items-center z-10 px-2">
                            {/* Step circle */}
                            <div className={`
                              w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold
                              transition-all duration-300
                              ${index <= currentStep ? step.color : 'bg-gray-300 text-gray-600'}
                              ${order.status === step.step ? 'ring-4 ring-opacity-50 ring-current' : ''}
                            `}>
                              {step.icon}
                            </div>
                            
                            {/* Step label */}
                            <div className="mt-3 text-center max-w-[100px]">
                              <p className={`
                                font-medium text-sm
                                ${index <= currentStep ? 'text-gray-800' : 'text-gray-500'}
                              `}>
                                {step.label}
                              </p>
                              {index === currentStep && (
                                <p className="text-xs text-gray-500 mt-1">Current</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Order Details */}
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-2">Customer Information</h4>
                        <div className="space-y-2 text-gray-600">
                          <p><span>Name:</span> {order.name}</p>
                          <p><span>Phone:</span> {order.phone}</p>
                          <p><span>Address:</span> {formattedAddress}</p>
                          {order.email && (
                            <p><span className="text-gray-600">Email:</span> {order.email}</p>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-2">Order Details</h4>
                        <div className="space-y-2 text-gray-600">
                          {order.paymentMethod && (
                            <p><span className="text-gray-600">Payment:</span> {
                              order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'
                            }</p>
                          )}
                          {order.shippingFee !== undefined && (
                            <p><span className="text-gray-600">Shipping:</span> {
                              order.shippingFee === 0 ? 'FREE' : `Rs. ${order.shippingFee}`
                            }</p>
                          )}
                          <p><span className="text-gray-600">Order ID:</span> {order._id}</p>
                        </div>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="mb-6">
                      <h4 className="font-semibold text-gray-800 mb-3">Order Items</h4>
                      <div className="space-y-3">
                        {orderItems.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                            <div className="w-16 h-16 flex-shrink-0">
                              <img
                                src={item.image || '/placeholder-image.jpg'}
                                alt={item.name}
                                className="w-full h-full object-cover rounded"
                              />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-800">{item.name}</p>
                              <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-600">
                                <span>Qty: {item.quantity || item.qty || 1}</span>
                                <span>Price: Rs. {item.price}</span>
                                {item.color && (
                                  <div className="flex items-center gap-1">
                                    <div 
                                      className="w-3 h-3 rounded-full border border-gray-300"
                                      style={{ backgroundColor: getColorHex(item.color) }}
                                    ></div>
                                    <span>{getColorName(item.color)}</span>
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
                      </div>
                    </div>

                    {/* Status Message */}
                    <div className={`p-4 rounded-lg ${
                      order.status === 'done' ? 'bg-green-50 border border-green-200' :
                      order.status === 'rejected' ? 'bg-red-50 border border-red-200' :
                      'bg-blue-50 border border-blue-200'
                    }`}>
                      <p className={`font-medium ${
                        order.status === 'done' ? 'text-green-800' :
                        order.status === 'rejected' ? 'text-red-800' :
                        'text-blue-800'
                      }`}>
                        {statusMessages[order.status] || "Your order is being processed."}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="bg-gray-50 px-6 py-4 border-t">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={() => window.print()}
                        className="sm:w-auto px-6 py-3 border-2 border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-semibold transition"
                      >
                        Print Details
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : !searchPerformed ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Track Your Package</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Enter your tracking information above to see real-time updates about your order delivery status.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl mb-2">📝</div>
                <p className="font-medium text-gray-800">Enter Tracking ID</p>
                <p className="text-sm text-gray-600">Find it in your order confirmation email</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-2xl mb-2">🔍</div>
                <p className="font-medium text-gray-800">Search Instantly</p>
                <p className="text-sm text-gray-600">We'll show your order status in seconds</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl mb-2">📱</div>
                <p className="font-medium text-gray-800">Track Progress</p>
                <p className="text-sm text-gray-600">See every step from order to delivery</p>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Help Section - Light Background */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-100 text-gray-800 py-12 mt-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">Need Help with Your Order?</h3>
            <div className="flex flex-col sm:flex-row gap-6 justify-center mt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  📞
                </div>
                <div>
                  <p className="font-medium">Call Support</p>
                  <p className="text-gray-600 text-sm">+92 123 4567890</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  ✉️
                </div>
                <div>
                  <p className="font-medium">Email Support</p>
                  <p className="text-gray-600 text-sm">support@example.com</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  💬
                </div>
                <div>
                  <p className="font-medium">Live Chat</p>
                  <p className="text-gray-600 text-sm">Available 24/7</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer - Light Background */}
      <footer className="bg-black text-white py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-white mb-2">Pankaj Mega Mart</p>
            <p className="mb-6 max-w-md mx-auto">
              Your trusted shopping destination with real-time order tracking
            </p>
            <div className="flex flex-wrap justify-center gap-6 mb-6">
              <Link href="/" className="hover:text-indigo-600 transition">
                Home
              </Link>
              <Link href="/products" className="hover:text-indigo-600 transition">
                Products
              </Link>
              <Link href="/my-orders" className="hover:text-indigo-600 transition">
                My Orders
              </Link>
              <Link href="/contact" className="hover:text-indigo-600 transition">
                Contact
              </Link>
            </div>
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} Pankaj Mega Mart — All Rights Reserved.
            </p>
          </div>
        </div>
      </footer>
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