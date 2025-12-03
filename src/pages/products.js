import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useCart } from "@/context/CartContext";

export default function Products() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [priceRange, setPriceRange] = useState({ min: 0, max: 100000 });
  const [maxPriceLimit, setMaxPriceLimit] = useState(100000);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("newest");
  const { addToCart } = useCart();

  // Fetch products and categories
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/products");
        const data = await res.json();
        
        // Get products array
        const productList = Array.isArray(data) ? data : data.products || [];
        setProducts(productList);
        setFilteredProducts(productList);
        
        // Calculate max price from all products
        if (productList.length > 0) {
          const prices = productList.map(p => p.price).filter(p => !isNaN(p));
          if (prices.length > 0) {
            const maxPrice = Math.max(...prices);
            // Round up to nearest 1000
            const roundedMax = Math.ceil(maxPrice / 1000) * 1000;
            setMaxPriceLimit(roundedMax);
            setPriceRange({ min: 0, max: roundedMax });
          }
        }
        
        // Set categories
        if (data.categories) {
          setCategories(data.categories);
        }
        
      } catch (err) {
        console.error("Error fetching products:", err);
        setProducts([]);
        setFilteredProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Filter products based on selected category, search, and price
  useEffect(() => {
    let filtered = [...products];

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter(product => 
        product.category?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(product =>
        product.name?.toLowerCase().includes(query) ||
        product.desc?.toLowerCase().includes(query) ||
        product.category?.toLowerCase().includes(query)
      );
    }

    // Filter by price range
    filtered = filtered.filter(product =>
      product.price >= priceRange.min && product.price <= priceRange.max
    );

    // Sort products
    switch (sortBy) {
      case "price-low":
        filtered.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        filtered.sort((a, b) => b.price - a.price);
        break;
      case "name":
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "newest":
        filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        break;
      default:
        break;
    }

    setFilteredProducts(filtered);
  }, [products, selectedCategory, searchQuery, priceRange, sortBy]);

  // Color mapping for display
  const getColorName = (colorValue) => {
    const colorMap = {
      "red": "Red",
      "blue": "Blue",
      "green": "Green",
      "black": "Black",
      "white": "White",
      "yellow": "Yellow",
      "purple": "Purple",
      "pink": "Pink",
      "gray": "Gray",
      "brown": "Brown"
    };
    return colorMap[colorValue] || colorValue;
  };

  const handleAddToCart = (product) => {
    const user = localStorage.getItem("user");
    if (!user) {
      router.push("/login");
      return;
    }
    
    // For products with colors, we need to prompt for color selection or use default
    const productToAdd = {
      ...product,
      quantity: 1
    };
    
    addToCart(productToAdd);
    
    // Show success message
    const message = document.createElement("div");
    message.className = "fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in";
    message.textContent = `"${product.name}" added to cart!`;
    document.body.appendChild(message);
    
    setTimeout(() => {
      message.classList.add("animate-fade-out");
      setTimeout(() => document.body.removeChild(message), 300);
    }, 2000);
  };

  // Reset filters
  const resetFilters = () => {
    setSelectedCategory("all");
    setSearchQuery("");
    setPriceRange({ min: 0, max: 100000 });
    setSortBy("newest");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-xl text-gray-600">Loading products...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* HEADER */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:py-12">
          <h1 className="text-3xl text-gray-600 sm:text-4xl md:text-5xl font-bold text-center mb-3">
            Our Products
          </h1>
          <p className="text-center text-indigo-500 text-lg max-w-2xl mx-auto">
            Explore our latest collection with multiple colors, features, and the best prices
          </p>
        </div>
      </div>

      {/* FILTERS SECTION */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <span className="text-gray-700 font-medium hidden sm:inline">Category:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">All Categories</option>
                {categories.map((category, index) => (
                  <option key={index} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort By */}
            <div className="flex items-center gap-2">
              <span className="text-gray-700 font-medium hidden sm:inline">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="newest">Newest</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name">Name: A to Z</option>
              </select>
            </div>

            {/* Reset Button */}
            <button
              onClick={resetFilters}
              className="px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg font-medium transition"
            >
              Reset Filters
            </button>
          </div>

          {/* Price Range Filter */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-700 font-medium">Price Range:</span>
              <span className="text-indigo-600 font-semibold">
                Rs. {priceRange.min.toLocaleString()} - Rs. {priceRange.max.toLocaleString()}
              </span>
            </div>
            
            {/* Price limits info */}
            <div className="flex justify-between text-xs text-gray-500 mb-2">
              <span>Rs. 0</span>
              <span>Rs. {maxPriceLimit.toLocaleString()}</span>
            </div>
            
            {/* Dual range slider */}
            <div className="relative py-2">
              {/* Background track */}
              <div className="h-2 bg-gray-300 rounded-full"></div>
              
              {/* Colored active track */}
              <div 
                className="absolute top-2 h-2 bg-indigo-500 rounded-full"
                style={{
                  left: `${(priceRange.min / maxPriceLimit) * 100}%`,
                  right: `${100 - (priceRange.max / maxPriceLimit) * 100}%`
                }}
              ></div>
              
              {/* Min slider */}
              <input
                type="range"
                min="0"
                max={maxPriceLimit}
                value={priceRange.min}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (value <= priceRange.max) {
                    setPriceRange(prev => ({ ...prev, min: value }));
                  }
                }}
                className="absolute top-0 left-0 w-full h-4 opacity-0 cursor-pointer z-10"
              />
              
              {/* Max slider */}
              <input
                type="range"
                min="0"
                max={maxPriceLimit}
                value={priceRange.max}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (value >= priceRange.min) {
                    setPriceRange(prev => ({ ...prev, max: value }));
                  }
                }}
                className="absolute top-0 left-0 w-full h-4 opacity-0 cursor-pointer z-20"
              />
              
              {/* Min thumb */}
              <div 
                className="absolute top-1 w-4 h-4 bg-white border-2 border-indigo-500 rounded-full shadow-lg transform -translate-y-1/2 z-30 cursor-pointer"
                style={{ left: `${(priceRange.min / maxPriceLimit) * 100}%` }}
              ></div>
              
              {/* Max thumb */}
              <div 
                className="absolute top-1 w-4 h-4 bg-white border-2 border-indigo-500 rounded-full shadow-lg transform -translate-y-1/2 z-30 cursor-pointer"
                style={{ left: `${(priceRange.max / maxPriceLimit) * 100}%` }}
              ></div>
            </div>
            
            {/* Manual input fields */}
            <div className="flex flex-col sm:flex-row items-center gap-3 mt-4">
              <div className="flex-1 w-full">
                <label className="block text-sm text-gray-600 mb-1">Min Price</label>
                <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                  <span className="px-3 py-2 bg-gray-100 text-gray-700">Rs.</span>
                  <input
                    type="number"
                    min="0"
                    max={priceRange.max}
                    value={priceRange.min}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0;
                      if (value >= 0 && value <= priceRange.max && value <= maxPriceLimit) {
                        setPriceRange(prev => ({ ...prev, min: value }));
                      }
                    }}
                    className="flex-1 min-w-0 px-3 py-2 border-0 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="hidden sm:block text-gray-400">—</div>
              
              <div className="flex-1 w-full">
                <label className="block text-sm text-gray-600 mb-1">Max Price</label>
                <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                  <span className="px-3 py-2 bg-gray-100 text-gray-700">Rs.</span>
                  <input
                    type="number"
                    min={priceRange.min}
                    max={maxPriceLimit}
                    value={priceRange.max}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || maxPriceLimit;
                      if (value >= priceRange.min && value <= maxPriceLimit) {
                        setPriceRange(prev => ({ ...prev, max: value }));
                      }
                    }}
                    className="flex-1 min-w-0 px-3 py-2 border-0 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              {/* Reset price button */}
              <button
                onClick={() => setPriceRange({ min: 0, max: maxPriceLimit })}
                className="w-full sm:w-auto px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition self-end sm:self-auto"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* RESULTS INFO */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-gray-700">
            Showing <span className="font-semibold">{filteredProducts.length}</span> of{" "}
            <span className="font-semibold">{products.length}</span> products
          </p>
          {searchQuery && (
            <p className="text-gray-600">
              Search results for: <span className="font-semibold">"{searchQuery}"</span>
            </p>
          )}
        </div>
      </div>

      {/* PRODUCTS GRID */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">No products found</h3>
            <p className="text-gray-600 mb-6">Try adjusting your search or filter criteria</p>
            <button
              onClick={resetFilters}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredProducts.map((product) => {
              // Use first image from images array, fallback to single image
              const productImage = product.images?.[0] || product.image;
              
              return (
                <div
                  key={product._id}
                  className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden flex flex-col"
                >
                  {/* Product Image */}
                  <Link href={`/products/${product._id}`}>
                    <div className="relative w-full h-48 sm:h-56 overflow-hidden bg-gray-100">
                      {productImage ? (
                        <img
                          src={productImage}
                          alt={product.name}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                      
                      {/* Category Badge */}
                      {product.category && (
                        <span className="absolute top-2 left-2 px-2 py-1 bg-black bg-opacity-70 text-white text-xs rounded">
                          {product.category}
                        </span>
                      )}
                      
                      {/* Stock Status */}
                      <div className="absolute top-2 right-2">
                        {product.stock <= 0 ? (
                          <span className="px-2 py-1 bg-red-500 text-white text-xs rounded">
                            Out of Stock
                          </span>
                        ) : product.stock < 10 ? (
                          <span className="px-2 py-1 bg-yellow-500 text-white text-xs rounded">
                            Only {product.stock} left
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </Link>

                  {/* Product Info */}
                  <div className="p-4 flex-grow flex flex-col">
                    <Link href={`/products/${product._id}`}>
                      <h3 className="font-semibold text-gray-800 mb-1 line-clamp-1 hover:text-indigo-600 transition">
                        {product.name}
                      </h3>
                    </Link>
                    
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2 flex-grow">
                      {product.desc}
                    </p>
                    
                    {/* Color Indicators */}
                    {product.hasColors && product.colors && product.colors.length > 0 && (
                      <div className="mb-3">
                        <div className="flex items-center gap-1 mb-1">
                          {product.colors.slice(0, 3).map((color, index) => (
                            <div
                              key={index}
                              className="w-4 h-4 rounded-full border border-gray-300"
                              style={{
                                backgroundColor: getColorHex(color)
                              }}
                              title={getColorName(color)}
                            />
                          ))}
                          {product.colors.length > 3 && (
                            <span className="text-xs text-gray-500 ml-1">
                              +{product.colors.length - 3}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          Available in {product.colors.length} color{product.colors.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    )}
                    
                    {/* Features Preview */}
                    {product.features && product.features.length > 0 && (
                      <div className="mb-3">
                        <ul className="space-y-1">
                          {product.features.slice(0, 2).map((feature, index) => (
                            <li key={index} className="flex items-start text-xs text-gray-600">
                              <svg className="w-3 h-3 text-green-500 mt-0.5 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              <span className="line-clamp-1">{feature}</span>
                            </li>
                          ))}
                          {product.features.length > 2 && (
                            <li className="text-xs text-gray-500">
                              +{product.features.length - 2} more features
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                    
                    {/* Price and Add to Cart */}
                    <div className="mt-auto">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-lg font-bold text-indigo-600">
                            Rs. {product.price.toLocaleString()}
                          </p>
                          {product.stock > 0 && (
                            <p className="text-xs text-gray-500">
                              In stock: {product.stock}
                            </p>
                          )}
                        </div>
                        
                        {/* Quick view button for desktop */}
                        <Link href={`/products/${product._id}`} className="hidden sm:block">
                          <button className="text-sm text-gray-600 hover:text-indigo-600">
                            View →
                          </button>
                        </Link>
                      </div>
                      
                      <button
                        onClick={() => handleAddToCart(product)}
                        disabled={product.stock <= 0}
                        className={`w-full py-2 rounded-lg font-medium transition ${
                          product.stock <= 0
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                            : "bg-indigo-600 hover:bg-indigo-700 text-white"
                        }`}
                      >
                        {product.stock <= 0 ? "Out of Stock" : "Add to Cart"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Load More (optional) */}
        {filteredProducts.length > 0 && filteredProducts.length < products.length && (
          <div className="text-center mt-8">
            <button className="bg-gray-800 hover:bg-gray-900 text-white px-6 py-3 rounded-lg font-medium">
              Load More Products
            </button>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-gray-300 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">
            <p className="text-2xl font-bold mb-2">JK Mega Mart</p>
            <p className="mb-6 max-w-md mx-auto">
              Your one-stop shop for quality products with multiple color options and features
            </p>
            <div className="flex flex-wrap justify-center gap-6 mb-6">
              <Link href="/about" className="hover:text-white transition">
                About Us
              </Link>
              <Link href="/contact" className="hover:text-white transition">
                Contact
              </Link>
              <Link href="/privacy" className="hover:text-white transition">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-white transition">
                Terms of Service
              </Link>
            </div>
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} JK Mega Mart — All Rights Reserved.
            </p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes fade-out {
          from { opacity: 1; transform: translateY(0); }
          to { opacity: 0; transform: translateY(-10px); }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        
        .animate-fade-out {
          animation: fade-out 0.3s ease-out;
        }
        
        /* Custom scrollbar for webkit browsers */
        ::-webkit-scrollbar {
          width: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>
    </div>
  );
}

// Helper function to get color hex code
function getColorHex(colorValue) {
  const colorMap = {
    "red": "#EF4444",
    "blue": "#3B82F6",
    "green": "#10B981",
    "black": "#000000",
    "white": "#FFFFFF",
    "yellow": "#F59E0B",
    "purple": "#8B5CF6",
    "pink": "#EC4899",
    "gray": "#6B7280",
    "brown": "#92400E"
  };
  return colorMap[colorValue] || "#ccc";
}