import { useCart } from "../context/CartContext";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

export default function Checkout() {
  const router = useRouter();
  const { cart, clearCart, updateQuantity, removeFromCart } = useCart();
  
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [notes, setNotes] = useState("");
  const [user, setUser] = useState(null);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [trackingId, setTrackingId] = useState("");
  const [checkoutItems, setCheckoutItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cod"); // cod or online

  // Provinces of Nepal
  const provinces = [
    "Koshi", "Madhesh", "Bagmati", "Gandaki", "Lumbini", 
    "Karnali", "Sudurpashchim"
  ];

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      setName(userData.name || "");
      setPhone(userData.mobile || "");
      setCity(userData.city || "");
      setProvince(userData.province || "");
    }

    // Get checkout items from localStorage (set by cart page)
    const storedCheckoutItems = localStorage.getItem("checkoutItems");
    if (storedCheckoutItems) {
      setCheckoutItems(JSON.parse(storedCheckoutItems));
    } else if (cart.length > 0) {
      // If no stored checkout items but cart has items, use all cart items
      setCheckoutItems(cart);
    }
  }, [cart]);

  // Calculate totals
  const subtotal = checkoutItems.reduce(
    (sum, item) => sum + item.price * item.qty,
    0
  );
  
  const shippingFee = subtotal > 0 ? 0 : 0; // Free shipping for now
  const total = subtotal + shippingFee;

  const generateTrackingId = () =>
    "TRK" + Date.now() + Math.random().toString(36).substr(2, 9).toUpperCase();

  const handleRemoveItem = (itemId) => {
    removeFromCart(itemId);
    // Update checkout items
    const updatedItems = checkoutItems.filter(item => item.id !== itemId);
    setCheckoutItems(updatedItems);
    localStorage.setItem("checkoutItems", JSON.stringify(updatedItems));
  };

  const handleQuantityChange = (itemId, newQty) => {
    if (newQty < 1) return;
    
    // Find the item in checkout items
    const item = checkoutItems.find(item => item.id === itemId);
    if (!item) return;
    
    // Don't exceed stock
    const maxQty = item.stock || 99;
    if (newQty > maxQty) {
      alert(`Maximum quantity available is ${maxQty}`);
      return;
    }
    
    // Update in CartContext
    updateQuantity(itemId, newQty);
    
    // Update checkout items
    const updatedItems = checkoutItems.map(item =>
      item.id === itemId ? { ...item, qty: newQty } : item
    );
    setCheckoutItems(updatedItems);
    localStorage.setItem("checkoutItems", JSON.stringify(updatedItems));
  };

  const handlePlaceOrder = async () => {
    // Validation
    if (!name.trim()) {
      alert("Please enter your name");
      return;
    }
    if (!phone.trim() || phone.length < 7) {
      alert("Please enter a valid phone number");
      return;
    }
    if (!address.trim()) {
      alert("Please enter your address");
      return;
    }
    if (!city.trim()) {
      alert("Please enter your city");
      return;
    }
    if (!province.trim()) {
      alert("Please select your province");
      return;
    }
    if (checkoutItems.length === 0) {
      alert("No items selected for checkout!");
      return;
    }

    setLoading(true);
    const newTrackingId = generateTrackingId();

    // Prepare order data
    const order = {
      name,
      phone,
      email: user?.email,
      address: {
        street: address,
        city,
        province,
        postalCode,
      },
      items: checkoutItems.map(item => ({
        productId: item.productId || item.id,
        name: item.name,
        price: item.price,
        quantity: item.qty,
        color: item.selectedColor,
        image: item.image,
      })),
      subtotal,
      shippingFee,
      total,
      paymentMethod,
      notes,
      status: paymentMethod === "cod" ? "pending" : "processing",
      trackingId: newTrackingId,
      createdAt: new Date(),
    };

    try {
      const res = await fetch("/api/customer/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(order),
      });

      const response = await res.json();
      
      if (response.success || response.orderId) {
        // Remove checkout items from cart
        checkoutItems.forEach(item => removeFromCart(item.id));
        
        // Clear checkout items from localStorage
        localStorage.removeItem("checkoutItems");
        
        setTrackingId(newTrackingId);
        setOrderPlaced(true);
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        alert("Failed to place order: " + (response.message || "Unknown error"));
      }
    } catch (error) {
      console.error("Error placing order:", error);
      alert("Error placing order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (orderPlaced) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4 sm:p-6">
      <div className="bg-white p-5 sm:p-7 md:p-8 rounded-2xl shadow-xl max-w-md w-full">
        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>
        
        {/* Success Heading */}
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
            Order Confirmed! 🎉
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            Thank you for your purchase. We're preparing your order.
          </p>
        </div>

        {/* Order Details Card */}
        <div className="bg-gray-50 p-4 sm:p-5 rounded-xl mb-6 border border-gray-200">
          <div className="text-center mb-4">
            <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full mb-2 text-xs">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span className="font-semibold">TRACKING ID</span>
            </div>
            <p className="text-lg sm:text-xl font-bold text-gray-800 font-mono tracking-wide">
              {trackingId}
            </p>
          </div>
          
          {/* Order Info Grid - Compact */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Date</p>
                  <p className="text-sm font-semibold text-gray-800">{new Date().toLocaleDateString()}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total</p>
                  <p className="text-sm font-bold text-green-700">Rs. {total.toLocaleString()}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Payment</p>
                  <p className="text-sm font-semibold text-gray-800 capitalize">{paymentMethod === "cod" ? "COD" : paymentMethod}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500">City</p>
                  <p className="text-sm font-semibold text-gray-800">{city}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* What's Next Section - Compact */}
        <div className="bg-blue-50 border-l-3 border-blue-500 rounded-lg p-4 mb-6">
          <h3 className="font-bold text-blue-900 text-sm mb-3 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            What happens next?
          </h3>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-600 text-xs font-bold">1</span>
              </div>
              <div>
                <p className="font-medium text-blue-900 text-sm">Save Tracking ID</p>
                <p className="text-blue-700 text-xs">Use it to track your order</p>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-600 text-xs font-bold">2</span>
              </div>
              <div>
                <p className="font-medium text-blue-900 text-sm">Delivery Updates</p>
                <p className="text-blue-700 text-xs">We'll SMS you on {phone}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-600 text-xs font-bold">3</span>
              </div>
              <div>
                <p className="font-medium text-blue-900 text-sm">Estimated Delivery</p>
                <p className="text-blue-700 text-xs">3-5 business days</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons - Now Visible */}
        <div className="space-y-4">
          {/* View My Orders Button - Visible with proper styling */}
          <Link href="/my-orders">
            <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-lg font-semibold transition flex items-center justify-center gap-2 text-sm sm:text-base">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              View My Orders
            </button>
          </Link>

          {/* Spacer/Divider */}
            <div className="flex items-center justify-center">
              <div className="h-px bg-gray-200 flex-grow"></div>
              <span className="px-4 text-gray-500 text-sm font-medium">or</span>
              <div className="h-px bg-gray-200 flex-grow"></div>
            </div>
          
          {/* Continue Shopping Button - Visible with proper styling */}
          <Link href="/">
            <button className="w-full bg-gray-700 hover:bg-gray-800 text-white py-3 px-4 rounded-lg font-semibold transition flex items-center justify-center gap-2 text-sm sm:text-base">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              Continue Shopping
            </button>
          </Link>

          {/* Copy Tracking ID Button */}
          <button
            onClick={() => {
              navigator.clipboard.writeText(trackingId);
              alert("Tracking ID copied to clipboard!");
            }}
            className="w-full border border-indigo-600 text-indigo-600 hover:bg-indigo-50 py-2.5 px-4 rounded-lg font-medium transition flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Copy Tracking ID
          </button>
        </div>

        {/* Footer Note - Smaller */}
        <div className="mt-6 text-center">
          <p className="text-gray-500 text-xs">
            Need help? <a href="mailto:support@example.com" className="text-indigo-600 hover:text-indigo-800 font-medium">Contact support</a>
          </p>
        </div>
      </div>
    </div>
  );
}

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <ol className="flex items-center text-sm text-gray-600">
            <li>
              <Link href="/" className="hover:text-indigo-600 transition">
                Home
              </Link>
            </li>
            <li className="mx-2">/</li>
            <li>
              <Link href="/cart" className="hover:text-indigo-600 transition">
                Cart
              </Link>
            </li>
            <li className="mx-2">/</li>
            <li className="font-medium text-gray-900">Checkout</li>
          </ol>
        </nav>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Checkout</h1>
        <p className="text-gray-600 mb-8">Complete your purchase</p>

        {checkoutItems.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-8 text-center">
            <div className="text-6xl mb-4">🛒</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">Add items to your cart before checkout</p>
            <Link href="/">
              <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium">
                Continue Shopping
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Customer Details */}
            <div className="lg:col-span-2 space-y-8">
              {/* Customer Information */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 pb-4 border-b">
                  Contact Information
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full p-3 text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full p-3 text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="98XXXXXXXX"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City *
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full p-3 text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Kathmandu"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Province *
                    </label>
                    <select
                      value={province}
                      onChange={(e) => setProvince(e.target.value)}
                      className="w-full p-3 text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select Province</option>
                      {provinces.map((prov) => (
                        <option key={prov} value={prov}>{prov}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Delivery Address *
                    </label>
                    <textarea
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      rows="3"
                      placeholder="House number, street, ward number"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Postal Code (Optional)
                    </label>
                    <input
                      type="text"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      className="w-full p-3 text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="44600"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 pb-4 border-b">
                  Payment Method
                </h2>
                
                <div className="space-y-4">
                  <label className="flex items-center p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-indigo-500">
                    <input
                      type="radio"
                      name="payment"
                      value="cod"
                      checked={paymentMethod === "cod"}
                      onChange={() => setPaymentMethod("cod")}
                      className="w-5 h-5 text-indigo-600"
                    />
                    <div className="ml-4">
                      <span className="font-medium text-gray-800">Cash on Delivery</span>
                      <p className="text-sm text-gray-600">Pay when you receive your order</p>
                    </div>
                  </label>
                  
                  <label className="flex items-center p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-indigo-500">
                    <input
                      type="radio"
                      name="payment"
                      value="online"
                      checked={paymentMethod === "online"}
                      onChange={() => setPaymentMethod("online")}
                      className="w-5 h-5 text-indigo-600"
                    />
                    <div className="ml-4">
                      <span className="font-medium text-gray-800">Online Payment</span>
                      <p className="text-sm text-gray-600">Pay with eSewa, Khalti, or Card</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Order Notes */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  Additional Notes (Optional)
                </h2>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-3 text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  rows="3"
                  placeholder="Any special instructions for delivery..."
                />
              </div>
            </div>

            {/* Right Column - Order Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-4 bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 pb-4 border-b">
                  Order Summary
                </h2>

                {/* Order Items */}
                <div className="space-y-4 mb-6 max-h-96 overflow-y-auto pr-2">
                  {checkoutItems.map((item) => (
                    <div key={item.id} className="border-b pb-4 last:border-0">
                      <div className="flex gap-3">
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-800 truncate">{item.name}</h4>
                          
                          {item.selectedColor && (
                            <div className="flex items-center gap-1 mt-1">
                              <div
                                className="w-3 h-3 rounded-full border"
                                style={{
                                  backgroundColor: getColorHex(item.selectedColor)
                                }}
                              ></div>
                              <span className="text-xs text-gray-600">{item.colorName || item.selectedColor}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center border border-gray-300 rounded">
                              <button
                                onClick={() => handleQuantityChange(item.id, item.qty - 1)}
                                className="px-2 py-1 text-gray-600 hover:bg-gray-100"
                                disabled={item.qty <= 1}
                              >
                                -
                              </button>
                              <span className="px-3 py-1 text-gray-600 min-w-[40px] text-center">{item.qty}</span>
                              <button
                                onClick={() => handleQuantityChange(item.id, item.qty + 1)}
                                className="px-2 py-1 text-gray-600 hover:bg-gray-100"
                                disabled={item.qty >= (item.stock || 99)}
                              >
                                +
                              </button>
                            </div>
                            
                            <div className="text-right">
                              <p className="font-semibold text-gray-800">
                                Rs. {(item.price * item.qty).toLocaleString()}
                              </p>
                              <button
                                onClick={() => handleRemoveItem(item.id)}
                                className="text-sm text-red-600 hover:text-red-800 mt-1"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Price Breakdown */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium text-gray-600">Rs. {subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-medium text-green-600">
                      {shippingFee === 0 ? "FREE" : `Rs. ${shippingFee}`}
                    </span>
                  </div>
                  {paymentMethod === "cod" && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">COD Fee</span>
                      <span className="font-medium text-gray-600  ">Rs. 0</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-4 text-gray-600 border-t border-gray-200 text-lg font-bold">
                    <span>Total</span>
                    <span className="text-2xl text-indigo-600">
                      Rs. {total.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Place Order Button */}
                <button
                  onClick={handlePlaceOrder}
                  disabled={loading}
                  className={`w-full py-4 text-lg font-semibold rounded-lg transition ${
                    loading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-green-600 hover:bg-green-700 transform hover:-translate-y-0.5"
                  } text-white`}
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Processing...
                    </div>
                  ) : (
                    `Place Order (Rs. ${total.toLocaleString()})`
                  )}
                </button>

                {/* Security Notice */}
                <div className="mt-6 pt-6 border-t border-gray-200 text-center">
                  <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Secure checkout · SSL encrypted</span>
                  </div>
                </div>
              </div>
              
              {/* Back to Cart */}
              <div className="mt-6">
                <button
                  onClick={() => router.push("/cart")}
                  className="w-full py-3 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-medium transition"
                >
                  ← Back to Cart
                </button>
              </div>
            </div>
          </div>
        )}
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