import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useCart } from "../../context/CartContext";

export default function ProductDetail() {
  const router = useRouter();
  const { id } = router.query;

  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/products/${id}`);
        const data = await res.json();
        setProduct(data);
        
        // Set default selected color if product has colors
        if (data.hasColors && data.colors && data.colors.length > 0) {
          setSelectedColor(data.colors[0]);
        }
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    
    const productToAdd = {
      ...product,
      selectedColor: selectedColor,
      quantity: quantity
    };
    
    addToCart(productToAdd);
  };

  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    if (value > 0 && value <= (product?.stock || 99)) {
      setQuantity(value);
    }
  };

  const incrementQuantity = () => {
    if (quantity < (product?.stock || 99)) {
      setQuantity(quantity + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Product Not Found</h2>
          <p className="text-gray-600 mb-4">The product you're looking for doesn't exist.</p>
          <button
            onClick={() => router.push("/")}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  // Color options mapping for display
  const colorOptions = {
    "red": { name: "Red", hex: "#EF4444" },
    "blue": { name: "Blue", hex: "#3B82F6" },
    "green": { name: "Green", hex: "#10B981" },
    "black": { name: "Black", hex: "#000000" },
    "white": { name: "White", hex: "#FFFFFF", border: "border-gray-300" },
    "yellow": { name: "Yellow", hex: "#F59E0B" },
    "purple": { name: "Purple", hex: "#8B5CF6" },
    "pink": { name: "Pink", hex: "#EC4899" },
    "gray": { name: "Gray", hex: "#6B7280" },
    "brown": { name: "Brown", hex: "#92400E" }
  };

  // Get images array or fall back to single image
  const images = product.images || (product.image ? [product.image] : []);
  const mainImage = images[selectedImage] || "/placeholder-image.jpg";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Breadcrumb */}
        <nav className="mb-6 sm:mb-8">
          <ol className="flex items-center text-sm text-gray-600">
            <li>
              <button
                onClick={() => router.push("/")}
                className="hover:text-indigo-600 transition"
              >
                Home
              </button>
            </li>
            <li className="mx-2">/</li>
            <li>
              <button
                onClick={() => router.back()}
                className="hover:text-indigo-600 transition"
              >
                Products
              </button>
            </li>
            <li className="mx-2">/</li>
            <li className="font-medium text-gray-900 truncate max-w-xs">
              {product.name}
            </li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* IMAGE GALLERY */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <img
                src={mainImage}
                alt={product.name}
                className="w-full h-64 sm:h-80 md:h-96 object-cover"
              />
            </div>

            {/* Thumbnail Gallery */}
            {images.length > 1 && (
              <div className="flex space-x-2 sm:space-x-4 overflow-x-auto pb-2">
                {images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden border-2 ${
                      selectedImage === index
                        ? "border-indigo-600 ring-2 ring-indigo-200"
                        : "border-gray-300"
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${product.name} view ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* PRODUCT DETAILS */}
          <div className="space-y-6">
            {/* Category & Name */}
            <div>
              <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium mb-2">
                {product.category || "Uncategorized"}
              </span>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
                {product.name}
              </h1>
            </div>

            {/* Price */}
            <div className="flex items-center space-x-4">
              <p className="text-3xl sm:text-4xl font-bold text-indigo-600">
                Rs. {product.price.toLocaleString()}
              </p>
              {product.stock < 10 && product.stock > 0 && (
                <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                  Only {product.stock} left!
                </span>
              )}
            </div>

            {/* Description */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Description
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {product.desc}
              </p>
            </div>

            {/* Features */}
            {product.features && product.features.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Key Features
                </h3>
                <ul className="space-y-2">
                  {product.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <svg
                        className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Color Selection */}
            {product.hasColors && product.colors && product.colors.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Select Color
                </h3>
                <div className="flex flex-wrap gap-3">
                  {product.colors.map((color) => {
                    const colorInfo = colorOptions[color] || { name: color, hex: "#ccc" };
                    return (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`flex items-center px-4 py-2 rounded-lg border-2 text-gray-600 ${
                          selectedColor === color
                            ? "border-indigo-600 bg-indigo-50"
                            : "border-gray-300 hover:border-gray-400"
                        }`}
                      >
                        <div
                          className="w-6 h-6 rounded-full mr-2 border border-gray-300"
                          style={{ backgroundColor: colorInfo.hex }}
                        />
                        <span className="font-medium">{colorInfo.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity & Add to Cart */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Quantity
                </h3>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center border border-gray-300 rounded-lg">
                    <button
                      onClick={decrementQuantity}
                      className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-l-lg"
                      disabled={quantity <= 1}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      max={product.stock || 99}
                      value={quantity}
                      onChange={handleQuantityChange}
                      className="w-16 text-center py-2 text-gray-600 border-x border-gray-300"
                    />
                    <button
                      onClick={incrementQuantity}
                      className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-r-lg"
                      disabled={quantity >= (product.stock || 99)}
                    >
                      +
                    </button>
                  </div>
                  <p className="text-sm text-gray-600">
                    {product.stock || "Limited"} available in stock
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleAddToCart}
                  disabled={!product.stock || product.stock <= 0}
                  className={`flex-1 py-3 px-6 rounded-lg font-medium text-lg transition ${
                    !product.stock || product.stock <= 0
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-indigo-600 hover:bg-indigo-700 transform hover:-translate-y-0.5"
                  } text-white`}
                >
                  {!product.stock || product.stock <= 0
                    ? "Out of Stock"
                    : "Add to Cart"}
                </button>
                
                <button
                  onClick={() => router.back()}
                  className="py-3 px-6 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-medium text-lg transition"
                >
                  Continue Shopping
                </button>
              </div>
            </div>

            {/* Stock & Additional Info */}
            <div className="pt-6 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-medium">SKU:</span> #{id?.slice(-6)}
                </div>
                <div>
                  <span className="font-medium">Category:</span> {product.category || "N/A"}
                </div>
                <div>
                  <span className="font-medium">Availability:</span>{" "}
                  {product.stock > 0 ? "In Stock" : "Out of Stock"}
                </div>
                {product.hasColors && selectedColor && (
                  <div>
                    <span className="font-medium">Selected Color:</span>{" "}
                    {colorOptions[selectedColor]?.name || selectedColor}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Related Products Section (Optional) */}
        {/* You can add a related products section here */}
      </div>
    </div>
  );
}