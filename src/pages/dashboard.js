import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useSession, signOut } from "next-auth/react";

export default function Dashboard() {
  const router = useRouter();
  const { data: session } = useSession();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loggedInUser = localStorage.getItem("user");

    if (session?.user && !loggedInUser) {
      const userData = {
        id: Date.now(),
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
      };
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);
      setLoading(false);
    } else if (loggedInUser) {
      setUser(JSON.parse(loggedInUser));
      setLoading(false);
    } else {
      router.push("/login");
    }
  }, [session, router]);

  const handleLogout = async () => {
    localStorage.removeItem("user");
    if (session) {
      await signOut({ callbackUrl: "/login" });
    } else {
      router.push("/login");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="font-sans bg-gray-50">
      {/* HERO SECTION */}
      <section className="px-4 sm:px-6 md:px-12 py-24 sm:py-32 text-center bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight drop-shadow-lg">
          Discover Amazing Products
        </h1>

        <p className="text-lg sm:text-xl md:text-2xl mt-6 opacity-90 max-w-2xl mx-auto">
          Quality items delivered fast — at the best prices
        </p>

        <Link href="/products">
          <button className="mt-10 bg-white text-indigo-600 font-bold text-lg sm:text-xl px-8 py-3 sm:px-10 sm:py-4 rounded-full shadow-xl hover:bg-gray-100 transition-all hover:-translate-y-1">
            Shop Now
          </button>
        </Link>
      </section>

      {/* FEATURE CARDS */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 md:px-12">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-10 sm:mb-14 text-gray-800">
          Why Shop With Us?
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">

          {/* Card 1 */}
          <div className="p-6 sm:p-8 bg-white shadow-xl rounded-2xl hover:shadow-2xl transition">
            <div className="bg-indigo-100 text-indigo-600 w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center rounded-full mx-auto mb-5 sm:mb-6 text-2xl sm:text-3xl font-bold">
              🚚
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2 text-center">
              Fast Delivery
            </h3>
            <p className="text-gray-600 text-center text-sm sm:text-base">
              We deliver orders quickly, safely, and reliably.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-6 sm:p-8 bg-white shadow-xl rounded-2xl hover:shadow-2xl transition">
            <div className="bg-purple-100 text-purple-600 w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center rounded-full mx-auto mb-5 sm:mb-6 text-2xl sm:text-3xl font-bold">
              ⭐
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2 text-center">
              Premium Quality
            </h3>
            <p className="text-gray-600 text-center text-sm sm:text-base">
              Only high-quality items handpicked for customers.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-6 sm:p-8 bg-white shadow-xl rounded-2xl hover:shadow-2xl transition">
            <div className="bg-pink-100 text-pink-600 w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center rounded-full mx-auto mb-5 sm:mb-6 text-2xl sm:text-3xl font-bold">
              💰
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2 text-center">
              Best Prices
            </h3>
            <p className="text-gray-600 text-center text-sm sm:text-base">
              Affordable prices for top-quality products.
            </p>
          </div>

        </div>
      </section>

      {/* FOOTER */}
      <footer className="text-center py-6 bg-gray-900 text-gray-300 text-sm">
        © {new Date().getFullYear()} Pankaj Mega Mart — All Rights Reserved.
      </footer>
    </div>
  );
}
