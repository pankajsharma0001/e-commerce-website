// components/Navbar.js
import Link from "next/link";
import { useRouter } from "next/router";
import { FaHome, FaBoxes, FaShoppingCart, FaUser, FaChevronDown } from "react-icons/fa";
import { useCart } from "../context/CartContext";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect, useRef } from "react";

export default function Navbar() {
  const router = useRouter();
  const { cartCount } = useCart();
  const { data: session } = useSession();
  const [user, setUser] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    // Get user from localStorage or session
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else if (session?.user) {
      setUser(session.user);
    }
  }, [session]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    localStorage.removeItem("user");
    if (session) {
      await signOut({ callbackUrl: "/login" });
    } else {
      router.push("/login");
    }
  };

  const handleNavigation = (path) => {
    setShowDropdown(false);
    router.push(path);
  };

  return (
    <nav className="w-full bg-blue-600 text-white px-6 py-3 flex items-center justify-between shadow-md sticky top-0 z-50">
      {/* Left Logo */}
      <h1
        className="text-3xl font-extrabold text-white tracking-wide cursor-pointer"
        onClick={() => router.push("/dashboard")}
      >
        MyShop
      </h1>

      {/* Right Menu */}
      <div className="flex items-center gap-6 text-lg font-semibold">
        {/* Home */}
        <Link href="/dashboard" className="flex items-center gap-2 hover:text-gray-300">
          <FaHome size={20} /> Home
        </Link>

        {/* Products */}
        <Link
          href="/products"
          className="flex items-center gap-2 hover:text-gray-300"
        >
          <FaBoxes size={20} /> Products
        </Link>

        {/* Cart */}
        <Link href="/cart" className="relative flex items-center">
          <FaShoppingCart size={26} />
          {cartCount > 0 && (
            <span className="absolute -top-2 -right-3 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full shadow-md">
              {cartCount}
            </span>
          )}
        </Link>

        {/* Profile Dropdown */}
        {user && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 hover:text-gray-300 transition"
            >
              {user.image ? (
                <img
                  src={user.image}
                  alt={user.name}
                  className="w-8 h-8 rounded-full border-2 border-white"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                  <FaUser size={16} className="text-blue-600" />
                </div>
              )}
              <FaChevronDown size={12} />
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-white text-gray-800 rounded-lg shadow-xl py-2 z-50">
                <div className="px-4 py-2 border-b border-gray-200">
                  <p className="font-semibold truncate">{user.name}</p>
                  <p className="text-sm text-gray-600 truncate">{user.email}</p>
                </div>

                <button
                  onClick={() => handleNavigation("/profile")}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 transition"
                >
                  👤 View Profile
                </button>

                <button
                  onClick={() => handleNavigation("/my-orders")}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 transition"
                >
                  📦 My Orders
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 transition border-t border-gray-200"
                >
                  🚪 Sign Out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
