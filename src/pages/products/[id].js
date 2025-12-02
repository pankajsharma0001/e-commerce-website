import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useCart } from "../../context/CartContext";

export default function ProductDetail() {
  const router = useRouter();
  const { id } = router.query;

  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/products/${id}`)
      .then((res) => res.json())
      .then((data) => setProduct(data));
  }, [id]);

  if (!product) {
    return (
      <div className="min-h-screen flex justify-center items-center text-xl">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          {/* IMAGE */}
          <div className="w-full h-80 sm:h-96 md:h-[500px] bg-gray-100 rounded-xl overflow-hidden shadow-lg">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            />
          </div>

          {/* DETAILS */}
          <div className="flex flex-col justify-start">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900">
              {product.name}
            </h1>

            <p className="text-gray-700 mt-4 text-base sm:text-lg md:text-xl leading-relaxed">
              {product.desc}
            </p>

            <p className="text-indigo-600 text-2xl sm:text-3xl md:text-4xl font-bold mt-6">
              Rs. {product.price}
            </p>

            <p className="text-gray-600 mt-3 text-sm sm:text-base md:text-lg">
              <span className="font-semibold">Stock:</span> {product.stock ?? "N/A"}
            </p>

            <button
              className="mt-8 w-full sm:w-auto md:w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-6 sm:px-8 rounded-lg text-lg sm:text-xl font-medium transition transform hover:-translate-y-0.5"
              onClick={() => addToCart(product)}
            >
              Add to Cart
            </button>
          </div>
        </div>

        {/* Back to Products */}
        <div className="mt-10 text-center md:text-left">
          <button
            onClick={() => router.back()}
            className="text-indigo-600 hover:text-indigo-800 font-semibold text-lg sm:text-xl transition"
          >
            &larr; Back to Products
          </button>
        </div>
      </div>
    </div>
  );
}
