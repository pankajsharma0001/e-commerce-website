import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Link from "next/link";
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
      <div className="max-w-5xl mx-auto px-6 py-14 grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* IMAGE */}
        <div className="w-full h-96 bg-gray-100 rounded-xl overflow-hidden shadow">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* DETAILS */}
        <div>
          <h1 className="text-4xl font-semibold text-gray-900">{product.name}</h1>

          <p className="text-gray-700 mt-4 text-lg">{product.desc}</p>

          <p className="text-indigo-600 text-3xl font-bold mt-6">
            Rs. {product.price}
          </p>

          <p className="text-gray-600 mt-3">
            <span className="font-semibold">Stock:</span> {product.stock ?? "N/A"}
          </p>

          <button
            className="mt-8 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg text-lg font-medium transition"
            onClick={() => addToCart(product)}
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}
