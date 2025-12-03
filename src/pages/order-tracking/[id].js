import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function OrderTracking() {
  const router = useRouter();
  const { id } = router.query;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;

    const fetchOrder = async () => {
      try {
        setLoading(true);
        // Use the new direct order endpoint
        const res = await fetch(`/api/orders/${id}`);
        
        if (res.ok) {
          const orderData = await res.json();
          setOrder(orderData);
        } else if (res.status === 404) {
          // Fallback: try to get from customer orders
          const ordersRes = await fetch("/api/customer/orders");
          const ordersData = await ordersRes.json();
          if (Array.isArray(ordersData)) {
            const foundOrder = ordersData.find((o) => o._id === id);
            if (foundOrder) {
              setOrder(foundOrder);
            } else {
              setError("Order not found");
            }
          } else {
            setError("Order not found");
          }
        } else {
          setError("Failed to load order");
        }
      } catch (err) {
        console.error("Error fetching order:", err);
        setError("Failed to load order details");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  const statusTimeline = [
    { step: "pending", label: "Order Placed", icon: "📝", color: "bg-yellow-500" },
    { step: "accepted", label: "Order Accepted", icon: "✓", color: "bg-blue-500" },
    { step: "processing", label: "Processing", icon: "⚙", color: "bg-purple-500" },
    { step: "delivering", label: "On the Way", icon: "🚚", color: "bg-orange-500" },
    { step: "done", label: "Delivered", icon: "✅", color: "bg-green-500" },
    { step: "rejected", label: "Cancelled", icon: "❌", color: "bg-red-500" },
  ];

  const getStepIndex = (currentStatus) => {
    return statusTimeline.findIndex((step) => step.step === currentStatus);
  };

  // Format address (supports both old string and new object format)
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

  // Get items array (new) or cart array (old)
  const getOrderItems = () => {
    if (order.items && order.items.length > 0) {
      return order.items;
    } else if (order.cart && order.cart.length > 0) {
      return order.cart;
    }
    return [];
  };

  // Calculate total if not provided
  const calculateTotal = () => {
    if (order.total) return order.total;
    
    const items = getOrderItems();
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-2xl shadow-lg max-w-md mx-4">
          <div className="text-6xl mb-4">📦</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Order Not Found</h2>
          <p className="text-gray-600 mb-6">The order you're looking for doesn't exist or you don't have permission to view it.</p>
          <div className="space-y-3">
            <Link href="/my-orders">
              <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition">
                View All Orders
              </button>
            </Link>
            <Link href="/">
              <button className="w-full border-2 border-gray-300 hover:bg-gray-50 text-gray-700 px-6 py-3 rounded-lg font-semibold transition">
                Continue Shopping
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentStepIndex = getStepIndex(order.status);
  const orderItems = getOrderItems();
  const totalAmount = calculateTotal();
  const formattedAddress = formatAddress(order.address);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <Link href="/my-orders">
                <button className="flex items-center text-indigo-600 hover:text-indigo-700 font-semibold mb-2">
                  <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to Orders
                </button>
              </Link>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">Order Tracking</h1>
              <p className="text-gray-600 mt-1">Track the status of your order</p>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-1">Order Status</p>
                <div className={`inline-flex items-center px-4 py-2 rounded-full text-white font-semibold ${
                  order.status === 'pending' ? 'bg-yellow-500' :
                  order.status === 'accepted' ? 'bg-blue-500' :
                  order.status === 'processing' ? 'bg-purple-500' :
                  order.status === 'delivering' ? 'bg-orange-500' :
                  order.status === 'done' ? 'bg-green-500' :
                  'bg-red-500'
                }`}>
                  <span className="mr-2">{statusTimeline.find(s => s.step === order.status)?.icon}</span>
                  {order.status.toUpperCase()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Order Summary Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-6 text-white">
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <div>
                <h2 className="text-2xl text-gray-600 font-bold mb-2">Order #{order.trackingId}</h2>
                <p className="text-indigo-600">Placed on {new Date(order.createdAt).toLocaleDateString('en-US', { 
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric' 
                })}</p>
              </div>
              <div className="mt-4 md:mt-0">
                <p className="text-3xl font-bold">Rs. {totalAmount.toLocaleString()}</p>
                <p className="text-indigo-600 text-sm mt-1">
                  {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Delivery Information</h3>
                <div className="space-y-2">
                  <div className="flex">
                    <span className="w-24 text-gray-600">Name:</span>
                    <span className="font-medium text-gray-600">{order.name}</span>
                  </div>
                  <div className="flex">
                    <span className="w-24 text-gray-600">Phone:</span>
                    <span className="font-medium text-gray-600">{order.phone}</span>
                  </div>
                  <div className="flex">
                    <span className="w-24 text-gray-600">Email:</span>
                    <span className="font-medium text-gray-600">{order.email || 'N/A'}</span>
                  </div>
                  <div className="flex items-start">
                    <span className="w-24 text-gray-600 flex-shrink-0">Address:</span>
                    <span className="font-medium text-gray-600">{formattedAddress}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Order Details</h3>
                <div className="space-y-2">
                  <div className="flex">
                    <span className="w-32 text-gray-600">Total Items:</span>
                    <span className="font-medium text-gray-600">{orderItems.length}</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 text-gray-600">Subtotal:</span>
                    <span className="font-medium text-gray-600">Rs. {order.subtotal?.toLocaleString() || totalAmount}</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 text-gray-600">Shipping:</span>
                    <span className="font-medium text-green-600">
                      {order.shippingFee === 0 ? 'FREE' : `Rs. ${order.shippingFee}`}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="w-32 text-gray-600">Order ID:</span>
                    <span className="font-mono text-sm text-gray-600">{id}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Notes */}
            {order.notes && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="font-semibold text-gray-800 mb-2">Customer Notes</h4>
                <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">{order.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Order Timeline */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Order Journey</h2>
          
          <div className="relative">
            {/* Progress line */}
            <div className="absolute left-0 right-0 top-6 h-1 bg-gray-300 z-0"></div>
            
            {/* Filled progress line */}
            {currentStepIndex >= 0 && (
              <div 
                className="absolute left-0 top-6 h-1 bg-green-500 z-0 transition-all duration-500"
                style={{ width: `${(currentStepIndex / (statusTimeline.length - 1)) * 100}%` }}
              ></div>
            )}

            <div className="relative flex justify-between">
              {statusTimeline.map((item, index) => (
                <div key={item.step} className="flex flex-col items-center z-10">
                  {/* Step circle */}
                  <div className={`
                    w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold
                    transition-all duration-300 transform
                    ${index <= currentStepIndex ? 'scale-110 shadow-lg' : 'scale-100'}
                    ${index <= currentStepIndex ? item.color : 'bg-gray-300 text-gray-600'}
                    ${order.status === item.step ? 'ring-4 ring-opacity-50 ring-current' : ''}
                  `}>
                    {item.icon}
                  </div>
                  
                  {/* Step label */}
                  <div className="mt-4 text-center max-w-[120px]">
                    <p className={`
                      font-semibold text-sm
                      ${index <= currentStepIndex ? 'text-gray-800' : 'text-gray-500'}
                    `}>
                      {item.label}
                    </p>
                    {index === currentStepIndex && (
                      <p className="text-xs text-gray-500 mt-1">Current Status</p>
                    )}
                  </div>
                  
                  {/* Date for completed steps */}
                  {index < currentStepIndex && (
                    <div className="mt-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mx-auto"></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Order Items ({orderItems.length})</h2>
          
          <div className="space-y-4">
            {orderItems.map((item, index) => (
              <div
                key={index}
                className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
              >
                <div className="w-20 h-20 flex-shrink-0">
                  <img
                    src={item.image || '/placeholder-image.jpg'}
                    alt={item.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
                
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">{item.name}</h3>
                  
                  {/* Item details */}
                  <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Price:</span> Rs. {item.price}
                    </div>
                    <div>
                      <span className="font-medium">Quantity:</span> {item.quantity || item.qty || 1}
                    </div>
                    {item.color && (
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Color:</span>
                        <div 
                          className="w-3 h-3 rounded-full border border-gray-300"
                          style={{ 
                            backgroundColor: getColorHex(item.color) 
                          }}
                        ></div>
                        <span>{getColorName(item.color)}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Item total */}
                  <div className="mt-2">
                    <p className="font-bold text-gray-800">
                      Item Total: Rs. {(item.price * (item.quantity || item.qty || 1)).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Order Summary */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="max-w-md ml-auto">
              <div className="space-y-3">
                {order.subtotal && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium text-gray-600">Rs. {order.subtotal.toLocaleString()}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping Fee:</span>
                  <span className="font-medium text-green-600">
                    {order.shippingFee === 0 ? 'FREE' : `Rs. ${order.shippingFee}`}
                  </span>
                </div>
                
                {order.paymentMethod === 'cod' && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">COD Fee:</span>
                    <span className="font-medium text-gray-600">Rs. 0</span>
                  </div>
                )}
                
                <div className="flex justify-between text-lg font-bold pt-3 text-gray-600 border-t border-gray-200">
                  <span>Total Amount:</span>
                  <span className="text-2xl text-indigo-600">
                    Rs. {totalAmount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Status Messages */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6 mb-8">
          <h3 className="text-xl font-bold text-gray-800 mb-4">📋 Order Updates</h3>
          
          <div className="space-y-4">
            {order.status === "pending" && (
              <div className="flex items-start">
                <div className="w-8 h-8 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center flex-shrink-0 mr-3">
                  ⏳
                </div>
                <div>
                  <p className="font-medium text-gray-800">Your order is being reviewed</p>
                  <p className="text-gray-600 text-sm mt-1">
                    We've received your order and will confirm it shortly. Estimated processing time: 1-2 hours.
                  </p>
                </div>
              </div>
            )}
            
            {order.status === "accepted" && (
              <div className="flex items-start">
                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mr-3">
                  ✓
                </div>
                <div>
                  <p className="font-medium text-gray-800">Order accepted and being prepared</p>
                  <p className="text-gray-600 text-sm mt-1">
                    Great news! We've accepted your order and it's now being prepared for shipment.
                  </p>
                </div>
              </div>
            )}
            
            {order.status === "processing" && (
              <div className="flex items-start">
                <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center flex-shrink-0 mr-3">
                  ⚙
                </div>
                <div>
                  <p className="font-medium text-gray-800">Order is being processed</p>
                  <p className="text-gray-600 text-sm mt-1">
                    Your order is being packed and prepared for delivery. Estimated dispatch: Today.
                  </p>
                </div>
              </div>
            )}
            
            {order.status === "delivering" && (
              <div className="flex items-start">
                <div className="w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center flex-shrink-0 mr-3">
                  🚚
                </div>
                <div>
                  <p className="font-medium text-gray-800">Your order is on the way!</p>
                  <p className="text-gray-600 text-sm mt-1">
                    Your order has been dispatched and is out for delivery. You will receive it soon.
                  </p>
                </div>
              </div>
            )}
            
            {order.status === "done" && (
              <div className="flex items-start">
                <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center flex-shrink-0 mr-3">
                  ✅
                </div>
                <div>
                  <p className="font-medium text-gray-800">Order delivered successfully!</p>
                  <p className="text-gray-600 text-sm mt-1">
                    Your order has been delivered. Thank you for shopping with us!
                  </p>
                </div>
              </div>
            )}
            
            {order.status === "rejected" && (
              <div className="flex items-start">
                <div className="w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center flex-shrink-0 mr-3">
                  ❌
                </div>
                <div>
                  <p className="font-medium text-gray-800">Order cancelled</p>
                  <p className="text-gray-600 text-sm mt-1">
                    Your order has been cancelled. If you have any questions, please contact customer support.
                  </p>
                </div>
              </div>
            )}
            
            <div className="pt-4 border-t border-blue-200">
              <p className="text-sm text-gray-600">
                Need help with your order?{" "}
                <a href="mailto:support@example.com" className="text-indigo-600 font-medium hover:underline">
                  Contact our support team
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/my-orders" className="flex-1">
            <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              View All Orders
            </button>
          </Link>
          
          <button
            onClick={() => window.print()}
            className="flex-1 border-2 border-gray-300 hover:bg-gray-50 text-gray-700 py-3 rounded-lg font-semibold transition"
          >
            Print Order Details
          </button>
          
          <Link href="/" className="flex-1">
            <button className="w-full bg-gray-800 hover:bg-gray-900 text-white py-3 rounded-lg font-semibold transition">
              Continue Shopping
            </button>
          </Link>
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