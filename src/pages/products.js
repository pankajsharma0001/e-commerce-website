import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useCart } from "@/context/CartContext";

export default function Products() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const { addToCart } = useCart(); // use CartContext

  useEffect(() => {
    fetch("/api/products")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`API error: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => setProducts(data))
      .catch((err) => {
        console.error("Error fetching products:", err);
        setProducts([]);
      });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* TITLE */}
      <div className="text-center pt-6 md:pt-12">
        <h1 className="text-5xl font-bold text-gray-800">Our Products</h1>
        <p className="text-gray-600 mt-3 text-lg">
          Explore our latest items at the best prices.
        </p>
      </div>

      {/* PRODUCTS GRID */}
      <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-10">
        {products.length === 0 && (
          <p className="text-center text-gray-500 col-span-full text-xl">
            No products available 😞
          </p>
        )}

        {products.map((product) => (
          <div
            key={product._id}
            className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-1 transition duration-300"
          >
            <Link href={`/products/${product._id}`} legacyBehavior>
              <a>
                {/* Product Image */}
                <div className="w-full h-48 rounded-xl shadow-inner mb-5 overflow-hidden flex items-center justify-center bg-gray-100">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-gray-500 text-lg">No Image</span>
                  )}
                </div>

                <h2 className="text-xl font-semibold text-gray-800 mb-1">
                  {product.name}
                </h2>

                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                  {product.desc}
                </p>

                <p className="text-indigo-600 font-bold text-lg mb-3">
                  Rs.{product.price}
                </p>
              </a>
            </Link>

            {/* Add to Cart Button */}
            <button
              onClick={() => {
                const user = localStorage.getItem("user");
                if (!user) {
                  router.push("/login");
                  return;
                }
                addToCart(product);
              }}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg font-medium transition"
            >
              Add to Cart
            </button>
          </div>
        ))}
      </div>

      {/* FOOTER */}
      <footer className="text-center py-6 bg-gray-900 text-gray-300 text-sm">
        © {new Date().getFullYear()} MyStore — All Rights Reserved.
      </footer>
    </div>
  );
}
