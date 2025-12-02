// pages/profile.js
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function Profile() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editMobile, setEditMobile] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/login");
      return;
    }
    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);
    setEditName(parsedUser.name || "");
    setEditMobile(parsedUser.mobile || "");
    setLoading(false);
  }, [router]);

  const handleSave = async () => {
    if (!editName.trim()) {
      alert("Name cannot be empty!");
      return;
    }

    try {
      const res = await fetch(`/api/users/${user._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editName,
          mobile: editMobile,
        }),
      });

      const updatedUser = await res.json();
      if (res.ok) {
        setUser(updatedUser);
        setIsModalOpen(false);
        alert("Profile updated successfully!");
      } else {
        alert(updatedUser.message || "Failed to update profile.");
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      alert("An error occurred while updating profile.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-lg text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-10 relative">
          <button
            onClick={() => setIsModalOpen(true)}
            className="absolute top-4 right-4 text-indigo-600 font-semibold hover:text-indigo-800 transition"
          >
            Edit Profile
          </button>

          <div className="flex flex-col sm:flex-row items-center gap-6 mb-8 pb-6 border-b">
            {user?.image ? (
              <img
                src={user.image}
                alt={user.name}
                className="w-24 h-24 rounded-full border-4 border-blue-600 object-cover"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center text-white text-4xl font-bold">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="text-center sm:text-left">
              <h1 className="text-3xl font-bold text-gray-800">{user?.name}</h1>
              <p className="text-gray-600 text-md sm:text-lg">{user?.email}</p>
              <p className="text-gray-600 text-md sm:text-lg">{user?.mobile || "Not provided"}</p>
            </div>
          </div>

          {/* Profile Details */}
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Profile Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link href="/my-orders">
                  <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition transform hover:-translate-y-0.5">
                    📦 My Orders
                  </button>
                </Link>
                <Link href="/products">
                  <button className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition transform hover:-translate-y-0.5">
                    🛍️ Shop More
                  </button>
                </Link>
                <Link href="/track-order">
                  <button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-semibold transition transform hover:-translate-y-0.5">
                    🚚 Track Order
                  </button>
                </Link>
                <Link href="/dashboard">
                  <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-semibold transition transform hover:-translate-y-0.5">
                    🏠 Dashboard
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-2xl p-6 sm:p-8 w-full max-w-md shadow-2xl transform transition-all scale-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Edit Profile</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-600 font-semibold mb-1">Full Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full p-3 text-gray-600 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-600 transition"
                />
              </div>
              <div>
                <label className="block text-gray-600 font-semibold mb-1">Mobile</label>
                <input
                  type="tel"
                  value={editMobile}
                  onChange={(e) => setEditMobile(e.target.value)}
                  className="w-full p-3 text-gray-600 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-600 transition"
                />
              </div>
            </div>
            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 text-gray-600 transition font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
