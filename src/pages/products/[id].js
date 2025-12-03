import { useRouter } from "next/router";
import { useEffect, useState, useRef } from "react";
import { useCart } from "../../context/CartContext";
import { useSession, signIn } from "next-auth/react";

export default function ProductDetail() {
  const router = useRouter();
  const { id } = router.query;

  const { addToCart } = useCart();
  const { data: session, status } = useSession(); // NextAuth session
  const user = session?.user;
  
  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [newReview, setNewReview] = useState({
    rating: 5,
    comment: "",
    images: []
  });
  const [reviewImages, setReviewImages] = useState([]);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const fileInputRef = useRef(null);
  const slideshowInterval = useRef(null);

  // Image slideshow effect
  useEffect(() => {
    if (!product || !product.images || product.images.length <= 1) return;

    slideshowInterval.current = setInterval(() => {
      setSelectedImage((prev) => (prev + 1) % product.images.length);
    }, 3000);

    return () => {
      if (slideshowInterval.current) {
        clearInterval(slideshowInterval.current);
      }
    };
  }, [product]);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      reviewImages.forEach(img => {
        URL.revokeObjectURL(img.preview);
      });
    };
  }, [reviewImages]);

  // Pause slideshow on hover
  const pauseSlideshow = () => {
    if (slideshowInterval.current) {
      clearInterval(slideshowInterval.current);
    }
  };

  // Resume slideshow on mouse leave
  const resumeSlideshow = () => {
    if (!product || !product.images || product.images.length <= 1) return;
    
    slideshowInterval.current = setInterval(() => {
      setSelectedImage((prev) => (prev + 1) % product.images.length);
    }, 3000);
  };

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

        // Fetch reviews and related products
        await Promise.all([
          fetchReviews(id),
          fetchRelatedProducts(id)
        ]);
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const fetchReviews = async (productId) => {
    try {
      const res = await fetch(`/api/products/${productId}/reviews`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data);
      } else {
        throw new Error('Failed to fetch reviews');
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
      setReviews([]);
    }
  };

  const fetchRelatedProducts = async (productId) => {
    try {
      const res = await fetch(`/api/products/${productId}/related`);
      if (res.ok) {
        const data = await res.json();
        setRelatedProducts(data);
      } else {
        throw new Error('Failed to fetch related products');
      }
    } catch (error) {
      console.error("Error fetching related products:", error);
      setRelatedProducts([]);
    }
  };

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

  const handleReviewImageUpload = (e) => {
    if (status === "unauthenticated" || !user) {
      setShowLoginPrompt(true);
      return;
    }
    
    const files = Array.from(e.target.files);
    const newImages = files.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));
    setReviewImages([...reviewImages, ...newImages]);
    setNewReview({
      ...newReview,
      images: [...newReview.images, ...files]
    });
  };

  const removeReviewImage = (index) => {
    URL.revokeObjectURL(reviewImages[index].preview);
    
    const newImages = reviewImages.filter((_, i) => i !== index);
    setReviewImages(newImages);
    setNewReview({
      ...newReview,
      images: newImages.map(img => img.file)
    });
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    
    // Check if user is authenticated
    if (status === "unauthenticated" || !user) {
      setShowLoginPrompt(true);
      alert("Please login to submit a review");
      return;
    }
    
    if (!newReview.comment.trim()) {
      alert("Please enter a review comment");
      return;
    }

    setIsSubmittingReview(true);

    try {
      // Upload images to Cloudinary first
      let uploadedImageUrls = [];
      if (newReview.images.length > 0) {
        const formData = new FormData();
        newReview.images.forEach((image, index) => {
          formData.append('images', image);
        });

        const uploadRes = await fetch('/api/upload/review-images', {
          method: 'POST',
          body: formData
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          uploadedImageUrls = uploadData.imageUrls;
        }
      }

      // Submit review with NextAuth user data
      const response = await fetch(`/api/products/${id}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // ← Add this line
        body: JSON.stringify({
          rating: newReview.rating,
          comment: newReview.comment,
          images: uploadedImageUrls,
        }),
      });

      if (response.ok) {
        const savedReview = await response.json();
        
        // Add the new review to the state
        setReviews([savedReview, ...reviews]);
        
        // Update product rating in local state
        if (product) {
          const newReviewCount = reviews.length + 1;
          const newAverageRating = (
            (product.averageRating * reviews.length + newReview.rating) / 
            newReviewCount
          ).toFixed(1);
          
          setProduct({
            ...product,
            averageRating: parseFloat(newAverageRating),
            reviewCount: newReviewCount
          });
        }
        
        // Reset form
        setNewReview({
          rating: 5,
          comment: "",
          images: []
        });
        setReviewImages([]);
        setShowLoginPrompt(false);
        
        alert("Review submitted successfully!");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit review');
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      alert(error.message || "Failed to submit review");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleProductClick = (productId) => {
    router.push(`/products/${productId}`);
  };

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
  const images = product?.images || (product?.image ? [product.image] : []);
  const mainImage = images[selectedImage] || "/placeholder-image.jpg";

  // Calculate average rating
  const calculateAverageRating = () => {
    if (product?.averageRating !== undefined) {
      return product.averageRating;
    }
    if (reviews.length > 0) {
      const total = reviews.reduce((sum, review) => sum + review.rating, 0);
      return parseFloat((total / reviews.length).toFixed(1));
    }
    return 0;
  };

  const averageRating = calculateAverageRating();
  const reviewCount = product?.reviewCount || reviews.length;

  // Show loading state
  if (loading || status === "loading") {
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
            {/* Main Image with Slideshow Controls */}
            <div 
              className="bg-white rounded-xl shadow-lg overflow-hidden relative group"
              onMouseEnter={pauseSlideshow}
              onMouseLeave={resumeSlideshow}
            >
              <img
                src={mainImage}
                alt={product.name}
                className="w-full h-64 sm:h-80 md:h-96 object-cover group-hover:scale-105 transition-transform duration-500 ease-in-out"
              />
              
              {/* Slideshow indicator dots */}
              {images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                  {images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        selectedImage === index 
                          ? 'bg-white w-6' 
                          : 'bg-white/50 hover:bg-white/80'
                      }`}
                    />
                  ))}
                </div>
              )}
              
              {/* Navigation arrows */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setSelectedImage((prev) => prev === 0 ? images.length - 1 : prev - 1)}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg transition"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setSelectedImage((prev) => (prev + 1) % images.length)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg transition"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {images.length > 1 && (
              <div className="flex space-x-2 sm:space-x-4 overflow-x-auto pb-2">
                {images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === index
                        ? "border-indigo-600 ring-2 ring-indigo-200 scale-105"
                        : "border-gray-300 hover:border-gray-400"
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

            {/* Rating */}
            <div className="flex items-center space-x-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`w-5 h-5 ${
                      i < Math.floor(averageRating)
                        ? "text-yellow-400"
                        : averageRating - i > 0.5
                        ? "text-yellow-400"
                        : "text-gray-300"
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-gray-600">
                {averageRating} ({reviewCount} reviews)
              </span>
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

        {/* RELATED PRODUCTS SECTION */}
        {relatedProducts.length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <div
                  key={relatedProduct.id || relatedProduct._id}
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
                  onClick={() => handleProductClick(relatedProduct.id || relatedProduct._id)}
                >
                  <div className="h-48 overflow-hidden">
                    <img
                      src={relatedProduct.image || relatedProduct.images?.[0]}
                      alt={relatedProduct.name}
                      className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 line-clamp-1">
                      {relatedProduct.name}
                    </h3>
                    <p className="text-indigo-600 font-bold mt-2">
                      Rs. {relatedProduct.price?.toLocaleString()}
                    </p>
                    <div className="mt-2 flex items-center">
                      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                        {relatedProduct.category}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* REVIEWS SECTION */}
        <section className="mt-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Customer Reviews</h2>
            <div className="flex items-center space-x-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`w-6 h-6 ${
                      i < Math.floor(averageRating)
                        ? "text-yellow-400"
                        : averageRating - i > 0.5
                        ? "text-yellow-400"
                        : "text-gray-300"
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-lg font-semibold text-gray-900">
                {averageRating} out of 5
              </span>
            </div>
          </div>

          {/* Add Review Form */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {status === "authenticated" ? 'Write a Review' : 'Login to Write a Review'}
            </h3>
            
            {showLoginPrompt && status === "unauthenticated" && (
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800 mb-2">
                  Please login to submit a review.
                </p>
                <button
                  onClick={() => signIn()}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Login Now
                </button>
              </div>
            )}
            
            {status === "authenticated" ? (
              <form onSubmit={handleSubmitReview}>
                <div className="space-y-4">
                  {/* Rating */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your Rating
                    </label>
                    <div className="flex items-center space-x-2">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          type="button"
                          onClick={() => setNewReview({...newReview, rating})}
                          className="focus:outline-none"
                        >
                          <svg
                            className={`w-8 h-8 ${
                              rating <= newReview.rating
                                ? "text-yellow-400"
                                : "text-gray-300"
                            }`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Review Comment */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your Review
                    </label>
                    <textarea
                      value={newReview.comment}
                      onChange={(e) => setNewReview({...newReview, comment: e.target.value})}
                      className="w-full px-4 py-3 text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      rows="4"
                      placeholder="Share your experience with this product..."
                      required
                    />
                  </div>

                  {/* Image Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Add Photos (Optional)
                    </label>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 transition"
                        >
                          <div className="flex items-center space-x-2">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            <span className="text-gray-600">Add Photos</span>
                          </div>
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleReviewImageUpload}
                          className="hidden"
                        />
                      </div>

                      {/* Preview Images */}
                      {reviewImages.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                          {reviewImages.map((img, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={img.preview}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-32 object-cover rounded-lg"
                              />
                              <button
                                type="button"
                                onClick={() => removeReviewImage(index)}
                                className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div>
                    <button
                      type="submit"
                      disabled={isSubmittingReview}
                      className={`bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition ${
                        isSubmittingReview ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="text-center p-8 border-2 border-dashed border-gray-300 rounded-lg">
                <p className="text-gray-600 mb-4">You need to be logged in to submit a review.</p>
                <button
                  onClick={() => signIn()}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Login to Continue
                </button>
              </div>
            )}
          </div>

          {/* Reviews List */}
          <div className="space-y-6">
            {reviews.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No reviews yet. Be the first to review this product!</p>
              </div>
            ) : (
              reviews.map((review) => (
                <div key={review._id || review.id} className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                        {review.userAvatar ? (
                          <img
                            src={review.userAvatar}
                            alt={review.userName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="font-semibold text-gray-600">
                            {review.userName?.charAt(0) || 'U'}
                          </span>
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{review.userName || 'User'}</h4>
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <svg
                                key={i}
                                className={`w-4 h-4 ${
                                  i < review.rating
                                    ? "text-yellow-400"
                                    : "text-gray-300"
                                }`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                          <span className="text-sm text-gray-500">
                            {new Date(review.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                    {/* Show edit/delete buttons if this review belongs to the current user */}
                    {status === "authenticated" && user && review.userId === user.id && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {/* Implement edit functionality */}}
                          className="text-sm text-gray-500 hover:text-indigo-600"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {/* Implement delete functionality */}}
                          className="text-sm text-gray-500 hover:text-red-600"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="text-gray-700 mb-4">{review.comment}</p>
                  
                  {/* Review Images */}
                  {review.images && review.images.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
                      {review.images.map((img, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={img}
                            alt={`Review image ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg"
                            loading="lazy"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = '/placeholder-image.jpg';
                            }}
                          />
                          <button
                            onClick={() => window.open(img, '_blank')}
                            className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center"
                          >
                            <svg className="w-8 h-8 text-white opacity-0 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m0 0l3-3m-3 3l-3-3" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}