// pages/admin-login.js
import { useState } from "react";
import { useRouter } from "next/router";
import { FaLock, FaUser, FaArrowRight, FaShieldAlt, FaEye, FaEyeSlash } from "react-icons/fa";

export default function AdminLogin() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // You can store admin credentials in environment variables for security
  const ADMIN_USERNAME = process.env.NEXT_PUBLIC_ADMIN_USERNAME;
  const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Simple authentication check
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      // Store admin session
      localStorage.setItem("adminAuthenticated", "true");
      localStorage.setItem("adminLoginTime", new Date().toISOString());
      
      if (rememberMe) {
        localStorage.setItem("adminRememberMe", "true");
      }
      
      // Small delay for better UX
      setTimeout(() => {
        // Redirect to admin dashboard
        router.push("/admin");
      }, 500);
    } else {
      setError("Invalid username or password");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
      <div className="absolute top-0 right-0 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>

      <div className="relative z-10 w-full max-w-lg px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl shadow-lg">
              <FaShieldAlt className="text-4xl text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-3">
            Admin Portal
          </h1>
          <p className="text-gray-600 text-lg">
            Secure access to your store management dashboard
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Card Header with Gradient */}
          <div className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
            <p className="text-blue-100">Enter your credentials to continue</p>
          </div>

          {/* Login Form */}
          <div className="p-8 md:p-10">
            <form onSubmit={handleLogin} className="space-y-6">
              {/* Username Field */}
              <div className="group">
                <label className="block text-gray-700 text-sm font-semibold mb-2">
                  <span className="flex items-center gap-2">
                    <FaUser className="text-blue-500" />
                    Username
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 text-gray-600 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all duration-300 hover:border-gray-300"
                    placeholder="Enter admin username"
                    required
                    disabled={loading}
                  />
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                    <FaUser className="text-gray-400 text-lg" />
                  </div>
                </div>
              </div>

              {/* Password Field */}
              <div className="group">
                <label className="block text-gray-700 text-sm font-semibold mb-2">
                  <span className="flex items-center gap-2">
                    <FaLock className="text-blue-500" />
                    Password
                  </span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-4 text-gray-600 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all duration-300 hover:border-gray-300"
                    placeholder="Enter your password"
                    required
                    disabled={loading}
                  />
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                    <FaLock className="text-gray-400 text-lg" />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-5 h-5 text-blue-500 rounded focus:ring-blue-400"
                  />
                  <span className="ml-2 text-gray-700 text-sm">Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => alert("Please contact system administrator to reset password.")}
                  className="text-sm text-blue-500 hover:text-blue-700 font-medium transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg animate-fadeIn">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-200 text-black font-semibold py-4 px-6 rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-3 group"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Authenticating...
                  </>
                ) : (
                  <>
                    <span>Access Dashboard</span>
                    <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* Security Note */}
            <div className="mt-8 pt-6 border-t border-gray-100">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FaShieldAlt className="text-blue-500" />
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-800">Security Notice</h4>
                  <p className="text-xs text-gray-600 mt-1">
                    This panel is restricted to authorized personnel only. Unauthorized access attempts may be logged and reported.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add custom animations to global.css or use inline styles */}
      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}