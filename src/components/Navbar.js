// components/Navbar.js
import Link from "next/link";
import { useRouter } from "next/router";
import { FaHome, FaBoxes, FaShoppingCart, FaUser, FaChevronDown, FaBars, FaTimes } from "react-icons/fa";
import { useCart } from "../context/CartContext";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect, useRef } from "react";

export default function Navbar() {
  const router = useRouter();
  const { cartCount } = useCart();
  const { data: session, status } = useSession();
  const [showDropdown, setShowDropdown] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [desktopImgError, setDesktopImgError] = useState(false);
  const [mobileImgError, setMobileImgError] = useState(false);
  const dropdownRef = useRef(null);
  const mobileMenuRef = useRef(null);

  const user = session?.user;

  // Reset image errors when user changes
  useEffect(() => {
    setDesktopImgError(false);
    setMobileImgError(false);
  }, [user]);

  // Close dropdown and mobile menu on outside click
  useEffect(() => {
    const handler = (e) => {
      // Close dropdown if clicked outside
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
      // Close mobile menu if clicked outside
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target) && mobileMenu) {
        // Check if click is on hamburger button
        const isHamburger = e.target.closest('button[aria-label="Toggle menu"]');
        if (!isHamburger) {
          setMobileMenu(false);
        }
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [mobileMenu]);

  const handleLogout = async () => {
    localStorage.removeItem("user");
    await signOut({ 
      callbackUrl: "/login",
      redirect: true 
    });
    
    setShowDropdown(false);
    setMobileMenu(false);
  };

  const handleProfileClick = () => {
    setShowDropdown(false);
    router.push("/profile");
  };

  const handleOrdersClick = () => {
    setShowDropdown(false);
    router.push("/my-orders");
  };

  // Close mobile menu when clicking any link
  const closeMobileMenu = () => {
    setMobileMenu(false);
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const getRandomColor = (name) => {
    const colors = [
      "bg-red-500",
      "bg-blue-500", 
      "bg-green-500",
      "bg-yellow-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-teal-500",
    ];
    if (!name) return colors[0];
    const charCode = name.charCodeAt(0);
    return colors[charCode % colors.length];
  };

  return (
    <nav className="w-full bg-purple-600 text-white px-4 sm:px-6 py-3 flex items-center justify-between shadow-lg sticky top-0 z-50 font-sans">
      {/* Logo */}
      <h1
        className="text-2xl sm:text-3xl font-extrabold tracking-wide cursor-pointer hover:opacity-90 transition"
        onClick={() => router.push("/")}
      >
        Pankaj Mega Mart
      </h1>

      {/* RIGHT SIDE — CART + HAMBURGER (MOBILE) */}
      <div className="flex items-center gap-4 md:hidden">
        <Link href="/cart" className="relative" onClick={closeMobileMenu}>
          <FaShoppingCart size={22} />
          {cartCount > 0 && (
            <span className="absolute -top-2 -right-3 bg-red-500 text-xs w-5 h-5 flex items-center justify-center rounded-full font-bold">
              {cartCount}
            </span>
          )}
        </Link>

        <button 
          className="text-white text-2xl p-1"
          onClick={() => setMobileMenu(!mobileMenu)}
          aria-label="Toggle menu"
          aria-expanded={mobileMenu}
        >
          {mobileMenu ? <FaTimes /> : <FaBars />}
        </button>
      </div>

      {/* Desktop Menu */}
      <div className="hidden md:flex items-center gap-4 lg:gap-6 text-base lg:text-lg font-semibold">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition px-3 py-1 rounded-lg hover:bg-purple-700">
          <FaHome size={18} /> <span className="hidden lg:inline">Home</span>
        </Link>
        <Link href="/products" className="flex items-center gap-2 hover:opacity-80 transition px-3 py-1 rounded-lg hover:bg-purple-700">
          <FaBoxes size={18} /> <span className="hidden lg:inline">Products</span>
        </Link>
        <Link href="/cart" className="relative flex items-center gap-2 px-3 py-1 rounded-lg hover:bg-purple-700 transition">
          <FaShoppingCart size={20} />
          <span className="hidden lg:inline">Cart</span>
          {cartCount > 0 && (
            <span className="absolute -top-2 -right-1 bg-red-500 text-xs w-5 h-5 flex items-center justify-center rounded-full font-bold">
              {cartCount}
            </span>
          )}
        </Link>

        {/* PROFILE DROPDOWN or LOGIN BUTTON */}
        {status === "loading" ? (
          <div className="w-8 h-8 rounded-full bg-white/20 animate-pulse"></div>
        ) : user ? (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 hover:opacity-80 transition focus:outline-none px-2 py-1 rounded-lg hover:bg-purple-700"
              aria-label="User menu"
              aria-expanded={showDropdown}
            >
              {user.image && !desktopImgError ? (
                <img
                  src={user.image}
                  className="w-8 h-8 rounded-full border-2 border-white object-cover"
                  alt={user.name || "User"}
                  onError={() => setDesktopImgError(true)}
                />
              ) : (
                <div className={`w-8 h-8 rounded-full ${getRandomColor(user?.name)} flex items-center justify-center`}>
                  <span className="text-white font-bold text-sm">
                    {getInitials(user?.name)}
                  </span>
                </div>
              )}
              <span className="hidden lg:inline text-sm truncate max-w-[100px]">
                {user.name?.split(' ')[0] || 'User'}
              </span>
              <FaChevronDown size={10} className={showDropdown ? "rotate-180 transition-transform" : ""} />
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-white text-gray-800 rounded-xl shadow-xl py-2 z-50 animate-fadeIn border border-gray-200">
                <div className="px-4 py-3 border-b border-gray-200">
                  <p className="font-semibold truncate">{user.name || 'User'}</p>
                  <p className="text-sm text-gray-600 truncate">{user.email}</p>
                </div>
                <button 
                  onClick={handleProfileClick} 
                  className="w-full text-left px-4 py-2 hover:bg-purple-50 transition flex items-center gap-2"
                >
                  <FaUser size={14} /> View Profile
                </button>
                <button 
                  onClick={handleOrdersClick} 
                  className="w-full text-left px-4 py-2 hover:bg-purple-50 transition flex items-center gap-2"
                >
                  <FaBoxes size={14} /> My Orders
                </button>
                <button 
                  onClick={handleLogout} 
                  className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 border-t border-gray-200 transition flex items-center gap-2"
                >
                  <FaTimes size={14} /> Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link
            href="/login"
            className="px-4 py-2 bg-white text-purple-600 rounded-lg hover:bg-gray-100 font-semibold transition"
          >
            Login
          </Link>
        )}
      </div>

      {/* MOBILE MENU */}
      {mobileMenu && (
        <div 
          ref={mobileMenuRef}
          className="absolute top-full left-0 right-0 bg-purple-500 text-white flex flex-col shadow-xl z-50 animate-slideDown md:hidden border-t border-purple-400"
        >
          <div className="px-5 py-3 space-y-1">
            {/* Navigation Items - Closer spacing */}
            <div className="mb-2">
              <div className="text-xs text-purple-300 font-semibold uppercase tracking-wider px-3 py-1">
                Navigation
              </div>
              <button 
                onClick={() => { router.push("/"); closeMobileMenu(); }} 
                className="flex items-center gap-3 text-base hover:bg-purple-700/50 transition w-full text-left px-3 py-2 rounded-lg active:scale-[0.98]"
              >
                <FaHome className="text-lg" /> Home
              </button>
              
              <button 
                onClick={() => { router.push("/products"); closeMobileMenu(); }} 
                className="flex items-center gap-3 text-base hover:bg-purple-700/50 transition w-full text-left px-3 py-2 rounded-lg active:scale-[0.98]"
              >
                <FaBoxes className="text-lg" /> Products
              </button>
              
              <button 
                onClick={() => { router.push("/cart"); closeMobileMenu(); }} 
                className="flex items-center gap-3 text-base hover:bg-purple-700/50 transition w-full text-left px-3 py-2 rounded-lg active:scale-[0.98] relative"
              >
                <FaShoppingCart className="text-lg" /> Cart
                {cartCount > 0 && (
                  <span className="bg-red-500 text-xs min-w-5 h-5 flex items-center justify-center rounded-full px-1 absolute right-3">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>

            {/* Profile Section - Separated with visual divider */}
            {status === "loading" ? (
              <div className="pt-3 border-t border-purple-400">
                <div className="flex items-center gap-3 px-3 py-2">
                  <div className="w-10 h-10 rounded-full bg-white/20 animate-pulse"></div>
                  <div className="space-y-1 flex-1">
                    <div className="h-3 w-24 bg-white/20 rounded animate-pulse"></div>
                    <div className="h-2 w-32 bg-white/20 rounded animate-pulse"></div>
                  </div>
                </div>
              </div>
            ) : user ? (
              <div className="pt-3 border-t border-purple-400">
                {/* User Info Header */}
                <div className="px-3 mb-2">
                  <div className="text-xs text-purple-300 font-semibold uppercase tracking-wider py-1">
                    Your Account
                  </div>
                </div>
                
                {/* User Profile Preview */}
                <div className="flex items-center gap-3 px-3 py-2 mb-2 bg-purple-700/30 rounded-lg mx-1">
                  {user.image && !mobileImgError ? (
                    <img
                      src={user.image}
                      className="w-10 h-10 rounded-full border-2 border-white object-cover"
                      alt={user.name || "User"}
                      onError={() => setMobileImgError(true)}
                    />
                  ) : (
                    <div className={`w-10 h-10 rounded-full ${getRandomColor(user?.name)} flex items-center justify-center`}>
                      <span className="text-white font-bold text-sm">
                        {getInitials(user?.name)}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{user.name || 'User'}</p>
                    <p className="text-xs text-purple-200 truncate">{user.email}</p>
                  </div>
                </div>

                {/* Profile Actions - Compact buttons */}
                <div className="space-y-0.5 px-2">
                  <button 
                    onClick={() => { router.push("/profile"); closeMobileMenu(); }} 
                    className="flex items-center gap-3 text-sm hover:bg-purple-700/50 transition w-full text-left px-3 py-2 rounded-lg active:scale-[0.98]"
                  >
                    <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
                      <FaUser className="text-xs" />
                    </div>
                    View Profile
                  </button>
                  
                  <button 
                    onClick={() => { router.push("/my-orders"); closeMobileMenu(); }} 
                    className="flex items-center gap-3 text-sm hover:bg-purple-700/50 transition w-full text-left px-3 py-2 rounded-lg active:scale-[0.98]"
                  >
                    <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
                      <FaBoxes className="text-xs" />
                    </div>
                    My Orders
                  </button>
                  
                  <button 
                    onClick={handleLogout} 
                    className="flex items-center gap-3 text-sm hover:bg-red-600/20 text-red-200 transition w-full text-left px-3 py-2 rounded-lg active:scale-[0.98] mt-1"
                  >
                    <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                      <FaTimes className="text-xs" />
                    </div>
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <div className="pt-3 border-t border-purple-400">
                <div className="px-3 mb-2">
                  <div className="text-xs text-purple-300 font-semibold uppercase tracking-wider py-1">
                    Account
                  </div>
                </div>
                <button 
                  onClick={() => { router.push("/login"); closeMobileMenu(); }} 
                  className="mx-1 bg-gradient-to-r from-white to-gray-100 text-purple-700 rounded-lg py-2.5 font-semibold hover:from-gray-100 hover:to-white transition w-full active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <FaUser className="text-sm" />
                  Login / Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Animation styles */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideDown {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>
    </nav>
  );
}