import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function Profile() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/login");
    } else {
      setUser(JSON.parse(storedUser));
      setLoading(false);
    }
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-6">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex items-center gap-6 mb-8 pb-8 border-b">
            {/* Profile Picture */}
            {user?.image ? (
              <img
                src={user.image}
                alt={user.name}
                className="w-24 h-24 rounded-full border-4 border-blue-600"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center text-white text-4xl font-bold">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            )}

            <div>
              <h1 className="text-3xl font-bold text-gray-800">{user?.name}</h1>
              <p className="text-gray-600 text-lg">{user?.email}</p>
              <p className="text-gray-600 text-lg">{user?.mobile}</p>
            </div>
          </div>

          {/* Profile Details */}
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Profile Information</h2>
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-600 text-sm font-semibold">Full Name</p>
                  <p className="text-gray-800 text-lg font-medium">{user?.name}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-600 text-sm font-semibold">Email</p>
                  <p className="text-gray-800 text-lg font-medium">{user?.email}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-600 text-sm font-semibold">Mobile</p>
                  <p className="text-gray-800 text-lg font-medium">{user?.mobile || "Not provided"}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-600 text-sm font-semibold">Account Type</p>
                  <p className="text-gray-800 text-lg font-medium">{user?.image ? "Google" : "Email/Password"}</p>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Quick Links</h2>
              <div className="grid grid-cols-2 gap-4">
                <Link href="/my-orders">
                  <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition">
                    📦 My Orders
                  </button>
                </Link>
                <Link href="/products">
                  <button className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition">
                    🛍️ Shop More
                  </button>
                </Link>
                <Link href="/track-order">
                  <button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-semibold transition">
                    🚚 Track Order
                  </button>
                </Link>
                <Link href="/dashboard">
                  <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-semibold transition">
                    🏠 Dashboard
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
