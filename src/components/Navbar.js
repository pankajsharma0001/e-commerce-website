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
  const { data: session } = useSession();
  const [user, setUser] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));
    else if (session?.user) setUser(session.user);
  }, [session]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    localStorage.removeItem("user");
    setShowDropdown(false); // Close dropdown on logout
    if (session) await signOut({ callbackUrl: "/login" });
    else router.push("/login");
  };

  const handleProfileClick = () => {
    setShowDropdown(false); // Close dropdown
    router.push("/profile");
  };

  const handleOrdersClick = () => {
    setShowDropdown(false); // Close dropdown
    router.push("/my-orders");
  };

  // Close mobile menu when clicking any link
  const closeMobileMenu = () => {
    setMobileMenu(false);
  };

  return (
    <nav className="w-full bg-purple-500 text-white px-6 py-3 flex items-center justify-between shadow-lg sticky top-0 z-50 font-sans">
      {/* Logo */}
      <h1
        className="text-3xl font-extrabold tracking-wide cursor-pointer hover:opacity-90 transition"
        onClick={() => router.push("/dashboard")}
      >
        JK Mega Mart
      </h1>

      {/* RIGHT SIDE — CART + HAMBURGER (MOBILE) */}
      <div className="flex items-center gap-5 md:hidden">
        <Link href="/cart" className="relative" onClick={closeMobileMenu}>
          <FaShoppingCart size={26} />
          {cartCount > 0 && (
            <span className="absolute -top-2 -right-3 bg-red-500 text-xs w-5 h-5 flex items-center justify-center rounded-full">
              {cartCount}
            </span>
          )}
        </Link>

        <button className="text-white text-3xl" onClick={() => setMobileMenu(!mobileMenu)}>
          {mobileMenu ? <FaTimes /> : <FaBars />}
        </button>
      </div>

      {/* Desktop Menu */}
      <div className="hidden md:flex items-center gap-6 text-lg font-semibold">
        <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition">
          <FaHome size={20} /> Home
        </Link>
        <Link href="/products" className="flex items-center gap-2 hover:opacity-80 transition">
          <FaBoxes size={20} /> Products
        </Link>
        <Link href="/cart" className="relative flex items-center">
          <FaShoppingCart size={26} />
          {cartCount > 0 && (
            <span className="absolute -top-2 -right-3 bg-red-500 text-xs w-5 h-5 flex items-center justify-center rounded-full">
              {cartCount}
            </span>
          )}
        </Link>

        {/* PROFILE DROPDOWN */}
        {user && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 hover:opacity-80 transition"
            >
              {user.image ? (
                <img
                  src={user.image}
                  className="w-8 h-8 rounded-full border-2 border-white"
                  alt="User profile"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                  <FaUser className="text-indigo-600" />
                </div>
              )}
              <FaChevronDown size={12} />
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-white text-gray-800 rounded-2xl shadow-xl py-2 z-50 animate-fadeIn">
                <div className="px-4 py-2 border-b border-gray-200">
                  <p className="font-semibold truncate">{user.name}</p>
                  <p className="text-sm text-gray-600 truncate">{user.email}</p>
                </div>
                <button 
                  onClick={handleProfileClick} 
                  className="w-full text-left px-4 py-2 hover:bg-indigo-50 rounded-lg transition"
                >
                  👤 View Profile
                </button>
                <button 
                  onClick={handleOrdersClick} 
                  className="w-full text-left px-4 py-2 hover:bg-indigo-50 rounded-lg transition"
                >
                  📦 My Orders
                </button>
                <button 
                  onClick={handleLogout} 
                  className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 border-t border-gray-200 rounded-b-lg transition"
                >
                  🚪 Sign Out
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MOBILE MENU */}
      {mobileMenu && (
        <div className="absolute top-16 left-0 w-full bg-purple-300 text-white flex flex-col px-6 py-4 gap-4 md:hidden shadow-lg z-50 animate-slideDown">
          <Link href="/dashboard" onClick={closeMobileMenu} className="flex items-center gap-3 text-lg hover:opacity-90 transition">
            <FaHome /> Home
          </Link>
          <Link href="/products" onClick={closeMobileMenu} className="flex items-center gap-3 text-lg hover:opacity-90 transition">
            <FaBoxes /> Products
          </Link>
          <Link href="/cart" onClick={closeMobileMenu} className="flex items-center gap-3 text-lg hover:opacity-90 transition">
            <FaShoppingCart /> Cart
          </Link>
          {user && (
            <div className="flex flex-col gap-2 mt-3 border-t border-white pt-3">
              <span className="font-semibold">{user.name}</span>
              <button onClick={() => { router.push("/profile"); closeMobileMenu(); }} className="text-left hover:opacity-80 transition">
                👤 View Profile
              </button>
              <button onClick={() => { router.push("/my-orders"); closeMobileMenu(); }} className="text-left hover:opacity-80 transition">
                📦 My Orders
              </button>
              <button onClick={() => { handleLogout(); closeMobileMenu(); }} className="text-left text-red-300 hover:opacity-80 transition">
                🚪 Sign Out
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}