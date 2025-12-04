import { useState, useEffect } from "react";
import { useRouter } from "next/router";

export default function Admin() {
  const [view, setView] = useState("orders"); // "orders" | "add" | "edit"
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);
  
  useEffect(() => {
    const checkAuth = () => {
      if (typeof window === 'undefined') {
        setLoadingAuth(false);
        return;
      }
      
      const authStatus = localStorage.getItem('adminAuthenticated');
      const loginTime = localStorage.getItem('adminLoginTime');
      
      if (authStatus === 'true' && loginTime) {
        // Check session expiration
        const loginDate = new Date(loginTime);
        const currentDate = new Date();
        const hoursDiff = (currentDate - loginDate) / (1000 * 60 * 60);
        
        if (hoursDiff > 8) {
          localStorage.removeItem('adminAuthenticated');
          localStorage.removeItem('adminLoginTime');
          router.push('/admin-login');
          return;
        }
        
        setIsAuthenticated(true);
      } else {
        router.push('/admin-login');
      }
      setLoadingAuth(false);
    };
    
    checkAuth();
  }, [router]);

  useEffect(() => {
    if (!isAuthenticated) return; // Don't fetch if not authenticated
    
    if (view === "orders") {
      fetch("/api/admin/orders")
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.orders)) {
            setOrders(data.orders);
          } else {
            console.error("Unexpected response format:", data);
            setOrders([]);
          }
        })
        .catch((err) => console.error("Error fetching orders:", err));
    }
    
    if (view === "edit" || view === "add") {
      fetch("/api/products")
        .then((res) => res.json())
        .then((data) => {
          console.log("Products API response:", data);
          
          // The API returns { success: true, products: [...], categories: [...] }
          // So we need to access data.products
          if (data && data.products && Array.isArray(data.products)) {
            setProducts(data.products);
            console.log("Set products array with", data.products.length, "items");
          } else {
            console.error("Unexpected products response format:", data);
            setProducts([]);
          }
        })
        .catch((error) => {
          console.error("Error fetching products:", error);
          setProducts([]);
        });
    }
  }, [view, isAuthenticated]);

  const logout = () => {
    localStorage.removeItem('adminAuthenticated');
    localStorage.removeItem('adminLoginTime');
    router.push('/admin-login');
  };

  // Show loading while checking authentication
  if (loadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Checking authentication...</div>
      </div>
    );
  }

  // Show nothing if not authenticated (router will redirect)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-extrabold text-indigo-600">
          Admin Panel Dashboard
        </h2>
        <button
          onClick={logout}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition"
        >
          Logout
        </button>
      </div>

      <div className="flex justify-center gap-6 mb-12">
        <button
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
          onClick={() => setView("orders")}
        >
          View Customer Orders
        </button>
        <button
          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition"
          onClick={() => setView("add")}
        >
          Add New Product
        </button>
        <button
          className="bg-yellow-600 text-white px-6 py-3 rounded-lg hover:bg-yellow-700 transition"
          onClick={() => setView("edit")}
        >
          Edit Existing Products
        </button>
      </div>

      {view === "orders" && (
        <div>
          <h3 className="text-2xl text-gray-800 font-semibold mb-4">Customer Orders</h3>
          {orders.length === 0 ? (
            <p className="text-2xl text-gray-800 font-semibold mb-4">No orders placed yet 😞</p>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <OrderCard key={order._id} order={order} setOrders={setOrders} orders={orders} />
              ))}
            </div>
          )}
        </div>
      )}

      {view === "add" && <AddProductForm />}
      {view === "edit" && !editingProduct && (
        <EditProducts
          products={products}
          setProducts={setProducts}
          setEditingProduct={setEditingProduct}
        />
      )}

      {editingProduct && (
        <EditProductForm
          product={editingProduct}
          setEditingProduct={setEditingProduct}
          setProducts={setProducts}
        />
      )}
    </div>
  );
}

// -------------------- ADD PRODUCT FORM (ENHANCED) --------------------
function AddProductForm() {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [desc, setDesc] = useState("");
  const [imageFiles, setImageFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [message, setMessage] = useState("");
  
  // New states for enhanced features
  const [hasColors, setHasColors] = useState(false);
  const [selectedColors, setSelectedColors] = useState([]);
  const [features, setFeatures] = useState([""]); // Start with one empty feature
  const [category, setCategory] = useState("");

  // Available color options
  const colorOptions = [
    { name: "Red", value: "red", hex: "#EF4444" },
    { name: "Blue", value: "blue", hex: "#3B82F6" },
    { name: "Green", value: "green", hex: "#10B981" },
    { name: "Black", value: "black", hex: "#000000" },
    { name: "White", value: "white", hex: "#FFFFFF" },
    { name: "Yellow", value: "yellow", hex: "#F59E0B" },
    { name: "Purple", value: "purple", hex: "#8B5CF6" },
    { name: "Pink", value: "pink", hex: "#EC4899" },
    { name: "Gray", value: "gray", hex: "#6B7280" },
    { name: "Brown", value: "brown", hex: "#92400E" }
  ];

  // Category options
  const categories = [
    "Electronics",
    "Clothing",
    "Home & Kitchen",
    "Books",
    "Beauty",
    "Sports",
    "Toys",
    "Automotive",
    "Other"
  ];

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImageFiles(files);
    
    // Create previews for all selected images
    const previewUrls = files.map(file => URL.createObjectURL(file));
    setPreviews(previewUrls);
  };

  const handleColorChange = (colorValue) => {
    if (selectedColors.includes(colorValue)) {
      setSelectedColors(selectedColors.filter(c => c !== colorValue));
    } else {
      setSelectedColors([...selectedColors, colorValue]);
    }
  };

  const handleFeatureChange = (index, value) => {
    const updatedFeatures = [...features];
    updatedFeatures[index] = value;
    setFeatures(updatedFeatures);
  };

  const addFeatureField = () => {
    setFeatures([...features, ""]);
  };

  const removeFeatureField = (index) => {
    if (features.length > 1) {
      const updatedFeatures = features.filter((_, i) => i !== index);
      setFeatures(updatedFeatures);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate features - remove empty ones
    const validFeatures = features.filter(feature => feature.trim() !== "");
    if (validFeatures.length === 0) {
      setMessage("❌ Please add at least one feature");
      return;
    }

    if (imageFiles.length === 0) {
      setMessage("❌ Please select at least one image");
      return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("price", price);
    formData.append("stock", stock);
    formData.append("desc", desc);
    formData.append("category", category);
    formData.append("hasColors", hasColors);
    formData.append("colors", JSON.stringify(selectedColors));
    formData.append("features", JSON.stringify(validFeatures));
    
    // Append all image files
    imageFiles.forEach((file, index) => {
      formData.append(`images`, file);
    });

    try {
      const res = await fetch("/api/admin/add-product", {
        method: "POST",
        body: formData,
      });
      const response = await res.json();

      if (response.success) {
        setMessage("✅ Product added successfully!");
        // Reset form
        setName(""); 
        setPrice(""); 
        setStock(""); 
        setDesc(""); 
        setCategory("");
        setImageFiles([]); 
        setPreviews([]);
        setHasColors(false);
        setSelectedColors([]);
        setFeatures([""]);
      } else {
        setMessage("❌ Error: " + response.message);
      }
    } catch (err) {
      setMessage("❌ Error: " + err.message);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-4xl mx-auto p-8 text-gray-800 bg-white rounded-xl shadow space-y-6"
    >
      <h3 className="text-2xl font-semibold text-gray-800">Add New Product</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
          <input
            type="text"
            placeholder="Product Name"
            value={name}
            required
            onChange={(e) => setName(e.target.value)}
            className="w-full p-3 border rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
          <input
            type="number"
            placeholder="Price"
            value={price}
            required
            onChange={(e) => setPrice(e.target.value)}
            className="w-full p-3 border rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Stock *</label>
          <input
            type="number"
            placeholder="Stock"
            value={stock}
            required
            onChange={(e) => setStock(e.target.value)}
            className="w-full p-3 border rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
          <select
            value={category}
            required
            onChange={(e) => setCategory(e.target.value)}
            className="w-full p-3 border rounded"
          >
            <option value="">Select Category</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
        <textarea
          placeholder="Product Description"
          value={desc}
          required
          rows="3"
          onChange={(e) => setDesc(e.target.value)}
          className="w-full p-3 border rounded"
        ></textarea>
      </div>

      {/* Features Section */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Features (Bullet Points) *</label>
        {features.map((feature, index) => (
          <div key={index} className="flex gap-2 mb-2">
            <span className="mt-3">•</span>
            <input
              type="text"
              placeholder={`Feature ${index + 1}`}
              value={feature}
              onChange={(e) => handleFeatureChange(index, e.target.value)}
              className="flex-1 p-3 border rounded"
            />
            <button
              type="button"
              onClick={() => removeFeatureField(index)}
              className="px-3 py-2 bg-red-100 text-red-600 rounded hover:bg-red-200"
              disabled={features.length === 1}
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addFeatureField}
          className="mt-2 px-4 py-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
        >
          + Add Another Feature
        </button>
      </div>

      {/* Color Options */}
      <div className="p-4 border rounded">
        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            id="hasColors"
            checked={hasColors}
            onChange={(e) => setHasColors(e.target.checked)}
            className="h-4 w-4 text-indigo-600 rounded"
          />
          <label htmlFor="hasColors" className="ml-2 font-medium text-gray-700">
            This product has color options
          </label>
        </div>

        {hasColors && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Available Colors:</label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {colorOptions.map((color) => (
                <div
                  key={color.value}
                  className={`p-3 border rounded cursor-pointer transition-all ${
                    selectedColors.includes(color.value)
                      ? 'ring-2 ring-offset-2 ring-indigo-500'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handleColorChange(color.value)}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-full border"
                      style={{ backgroundColor: color.hex }}
                    />
                    <span className="text-sm">{color.name}</span>
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    {selectedColors.includes(color.value) ? '✓ Selected' : 'Click to select'}
                  </div>
                </div>
              ))}
            </div>
            {selectedColors.length > 0 && (
              <div className="mt-3 text-sm text-gray-600">
                Selected: {selectedColors.map(c => colorOptions.find(co => co.value === c)?.name).join(', ')}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Multiple Image Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Product Images * (Select multiple)
        </label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageChange}
          className="w-full p-2 border rounded"
        />
        
        {previews.length > 0 && (
          <div className="mt-4">
            <p className="text-sm text-gray-600 mb-2">
              {previews.length} image{previews.length !== 1 ? 's' : ''} selected
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {previews.map((preview, index) => (
                <div key={index} className="relative">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-32 object-cover rounded"
                  />
                  <div className="absolute top-1 right-1 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                    {index + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <button
        type="submit"
        className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition"
      >
        Add Product
      </button>
      
      {message && (
        <div className={`p-3 rounded ${message.includes('✅') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message}
        </div>
      )}
    </form>
  );
}

// -------------------- EDIT PRODUCT FORM (UPDATED) --------------------
function EditProductForm({ product, setEditingProduct, setProducts }) {
  const [name, setName] = useState(product?.name || "");
  const [price, setPrice] = useState(product?.price || "");
  const [stock, setStock] = useState(product?.stock || "");
  const [desc, setDesc] = useState(product?.desc || "");
  const [category, setCategory] = useState(product?.category || "");
  const [imageFiles, setImageFiles] = useState([]);
  const [previews, setPreviews] = useState(product?.images || []);
  const [message, setMessage] = useState("");
  const [hasColors, setHasColors] = useState(product?.hasColors || false);
  const [selectedColors, setSelectedColors] = useState(product?.colors || []);
  const [features, setFeatures] = useState(product?.features || [""]);

  const colorOptions = [
    { name: "Red", value: "red", hex: "#EF4444" },
    { name: "Blue", value: "blue", hex: "#3B82F6" },
    { name: "Green", value: "green", hex: "#10B981" },
    { name: "Black", value: "black", hex: "#000000" },
    { name: "White", value: "white", hex: "#FFFFFF" },
    { name: "Yellow", value: "yellow", hex: "#F59E0B" },
    { name: "Purple", value: "purple", hex: "#8B5CF6" },
    { name: "Pink", value: "pink", hex: "#EC4899" },
    { name: "Gray", value: "gray", hex: "#6B7280" },
    { name: "Brown", value: "brown", hex: "#92400E" }
  ];

  const categories = [
    "Electronics",
    "Clothing",
    "Home & Kitchen",
    "Books",
    "Beauty",
    "Sports",
    "Toys",
    "Automotive",
    "Other"
  ];

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImageFiles(files);
    
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviews([...previews, ...newPreviews]);
  };

  const handleColorChange = (colorValue) => {
    if (selectedColors.includes(colorValue)) {
      setSelectedColors(selectedColors.filter(c => c !== colorValue));
    } else {
      setSelectedColors([...selectedColors, colorValue]);
    }
  };

  const handleFeatureChange = (index, value) => {
    const updatedFeatures = [...features];
    updatedFeatures[index] = value;
    setFeatures(updatedFeatures);
  };

  const addFeatureField = () => {
    setFeatures([...features, ""]);
  };

  const removeFeatureField = (index) => {
    if (features.length > 1) {
      const updatedFeatures = features.filter((_, i) => i !== index);
      setFeatures(updatedFeatures);
    }
  };

  const removePreview = (index) => {
    const updatedPreviews = previews.filter((_, i) => i !== index);
    setPreviews(updatedPreviews);
    // Also remove corresponding file if it's a new upload
    if (index >= (product?.images?.length || 0)) {
      const updatedFiles = imageFiles.filter((_, i) => i !== (index - (product?.images?.length || 0)));
      setImageFiles(updatedFiles);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validFeatures = features.filter(feature => feature.trim() !== "");
    if (validFeatures.length === 0) {
      setMessage("❌ Please add at least one feature");
      return;
    }

    const formData = new FormData();
    formData.append("id", product._id);
    formData.append("name", name);
    formData.append("price", price);
    formData.append("stock", stock);
    formData.append("desc", desc);
    formData.append("category", category);
    formData.append("hasColors", hasColors);
    formData.append("colors", JSON.stringify(selectedColors));
    formData.append("features", JSON.stringify(validFeatures));
    formData.append("existingImages", JSON.stringify(previews.filter(p => typeof p === 'string' && p.includes('http'))));
    
    imageFiles.forEach((file) => {
      formData.append(`newImages`, file);
    });

    try {
      const res = await fetch("/api/admin/edit-product", {
        method: "PUT",
        body: formData,
      });
      const response = await res.json();
      if (response.success) {
        alert("✅ Product updated!");
        setEditingProduct(null);
        const response = await fetch("/api/products");
        const data = await response.json();
        const updatedProducts = data.products || [];
        setProducts(updatedProducts);
      } else {
        setMessage("❌ Error: " + response.message);
      }
    } catch (err) {
      setMessage("❌ Error: " + err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-8 text-gray-800 bg-white rounded-xl shadow space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-semibold text-gray-800">Edit Product</h3>
        <button
          type="button"
          onClick={() => setEditingProduct(null)}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Cancel
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
          <input
            type="text"
            placeholder="Product Name"
            value={name}
            required
            onChange={(e) => setName(e.target.value)}
            className="w-full p-3 border rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
          <input
            type="number"
            placeholder="Price"
            value={price}
            required
            onChange={(e) => setPrice(e.target.value)}
            className="w-full p-3 border rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Stock *</label>
          <input
            type="number"
            placeholder="Stock"
            value={stock}
            required
            onChange={(e) => setStock(e.target.value)}
            className="w-full p-3 border rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
          <select
            value={category}
            required
            onChange={(e) => setCategory(e.target.value)}
            className="w-full p-3 border rounded"
          >
            <option value="">Select Category</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
        <textarea
          placeholder="Product Description"
          value={desc}
          required
          rows="3"
          onChange={(e) => setDesc(e.target.value)}
          className="w-full p-3 border rounded"
        ></textarea>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Features (Bullet Points) *</label>
        {features.map((feature, index) => (
          <div key={index} className="flex gap-2 mb-2">
            <span className="mt-3">•</span>
            <input
              type="text"
              placeholder={`Feature ${index + 1}`}
              value={feature}
              onChange={(e) => handleFeatureChange(index, e.target.value)}
              className="flex-1 p-3 border rounded"
            />
            <button
              type="button"
              onClick={() => removeFeatureField(index)}
              className="px-3 py-2 bg-red-100 text-red-600 rounded hover:bg-red-200"
              disabled={features.length === 1}
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addFeatureField}
          className="mt-2 px-4 py-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
        >
          + Add Another Feature
        </button>
      </div>

      <div className="p-4 border rounded">
        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            id="hasColors"
            checked={hasColors}
            onChange={(e) => setHasColors(e.target.checked)}
            className="h-4 w-4 text-indigo-600 rounded"
          />
          <label htmlFor="hasColors" className="ml-2 font-medium text-gray-700">
            This product has color options
          </label>
        </div>

        {hasColors && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Available Colors:</label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {colorOptions.map((color) => (
                <div
                  key={color.value}
                  className={`p-3 border rounded cursor-pointer transition-all ${
                    selectedColors.includes(color.value)
                      ? 'ring-2 ring-offset-2 ring-indigo-500'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handleColorChange(color.value)}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-full border"
                      style={{ backgroundColor: color.hex }}
                    />
                    <span className="text-sm">{color.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Product Images (Add new ones or remove existing)
        </label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageChange}
          className="w-full p-2 border rounded"
        />
        
        {previews.length > 0 && (
          <div className="mt-4">
            <p className="text-sm text-gray-600 mb-2">Current Images:</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {previews.map((preview, index) => (
                <div key={index} className="relative group">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-32 object-cover rounded"
                  />
                  <button
                    type="button"
                    onClick={() => removePreview(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ✕
                  </button>
                  <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                    {index + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button type="submit" className="flex-1 bg-yellow-600 text-white px-6 py-3 rounded hover:bg-yellow-700">
          Update Product
        </button>
      </div>
      
      {message && (
        <div className={`p-3 rounded ${message.includes('✅') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message}
        </div>
      )}
    </form>
  );
}

// -------------------- EDIT PRODUCTS (UPDATED TO SHOW MORE INFO) --------------------
function EditProducts({ products, setEditingProduct, setProducts }) {
  const deleteProduct = async (id) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    const res = await fetch(`/api/admin/delete-product?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setProducts(products.filter((p) => p._id !== id));
      alert("Product deleted!");
    }
  };

  const safeProducts = Array.isArray(products) ? products : [];

  return (
    <div>
      <h3 className="text-2xl text-gray-800 font-semibold mb-4">
        Edit Products ({safeProducts.length} total)
      </h3>
      
      {safeProducts.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">No products found or loading...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {safeProducts.map((product) => (
            <div key={product._id} className="bg-white text-gray-800 p-4 rounded-lg shadow">
              <img 
                src={product.images?.[0] || product.image} 
                className="w-full h-40 object-cover rounded-lg mb-2" 
              />
              <h4 className="font-semibold">{product.name}</h4>
              <p className="text-sm text-gray-600">{product.category}</p>
              <p className="font-bold">Rs. {product.price}</p>
              <p>Stock: {product.stock}</p>
              
              {product.hasColors && product.colors?.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600">Colors: {product.colors.length}</p>
                  <div className="flex gap-1 mt-1">
                    {product.colors.slice(0, 3).map((color, idx) => (
                      <div
                        key={idx}
                        className="w-4 h-4 rounded-full border"
                        style={{
                          backgroundColor: colorOptions.find(c => c.value === color)?.hex || '#ccc'
                        }}
                        title={color}
                      />
                    ))}
                    {product.colors.length > 3 && (
                      <span className="text-xs text-gray-500 ml-1">
                        +{product.colors.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              <div className="flex gap-2 mt-3">
                <button 
                  className="bg-yellow-500 px-3 py-1 rounded text-white hover:bg-yellow-600" 
                  onClick={() => setEditingProduct(product)}
                >
                  Edit
                </button>
                <button 
                  className="bg-red-500 px-3 py-1 rounded text-white hover:bg-red-600" 
                  onClick={() => deleteProduct(product._id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// -------------------- ORDER CARD (UNCHANGED) --------------------
function OrderCard({ order, setOrders, orders }) {
  const [loading, setLoading] = useState(false);

  // Add safety check for cart
  const cartItems = order.cart || order.items || [];

  // Function to format address (handles both string and object)
  const formatAddress = (address) => {
    if (!address) return "No Address Provided";
    
    if (typeof address === 'string') return address;
    
    if (typeof address === 'object') {
      // Handle address object
      const parts = [];
      if (address.street) parts.push(address.street);
      if (address.city) parts.push(address.city);
      if (address.province) parts.push(address.province);
      if (address.postalCode) parts.push(address.postalCode);
      
      return parts.length > 0 ? parts.join(', ') : "Address details incomplete";
    }
    
    return "Invalid Address Format";
  };

  const updateOrderStatus = async (newStatus) => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: order._id, status: newStatus }),
      });
      const response = await res.json();
      if (response.success) {
        setOrders(
          orders.map((o) =>
            o._id === order._id ? { ...o, status: newStatus } : o
          )
        );
      }
    } catch (error) {
      console.error("Error updating order:", error);
    }
    setLoading(false);
  };

  const deleteOrder = async () => {
    if (!confirm("Are you sure you want to delete this order?")) return;
    try {
      const res = await fetch(`/api/admin/orders?id=${order._id}`, {
        method: "DELETE",
      });
      const response = await res.json();
      if (response.success) {
        setOrders(orders.filter((o) => o._id !== order._id));
        alert("Order deleted!");
      }
    } catch (error) {
      console.error("Error deleting order:", error);
    }
  };

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800",
    accepted: "bg-blue-100 text-blue-800",
    processing: "bg-purple-100 text-purple-800",
    delivering: "bg-orange-100 text-orange-800",
    done: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg border-2 border-gray-200">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-lg font-bold text-gray-800">{order.name || "No Name"}</p>
          <p className="text-sm text-gray-600">
            {order.phone || "No Phone"} | {formatAddress(order.address)}
          </p>
          <p className="text-sm text-gray-600">
            Order Date: {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "Unknown Date"}
          </p>
        </div>
        <span className={`px-4 py-2 rounded-full font-semibold ${statusColors[order.status] || "bg-gray-100 text-gray-800"}`}>
          {(order.status || "pending").toUpperCase()}
        </span>
      </div>

      <div className="mb-4">
        <p className="font-semibold text-gray-800 mb-2">Items:</p>
        <div className="space-y-3">
          {cartItems.length === 0 ? (
            <p className="text-gray-500 italic">No items in this order</p>
          ) : (
            cartItems.map((item, idx) => {
              const itemName = item.name || "Unknown Item";
              const quantity = item.qty || item.quantity || 0;
              const price = item.price || 0;
              const imageUrl = item.image || item.imageUrl || '/placeholder-image.jpg';
              const color = item.color;
              
              // Color mapping for display
              const getColorHex = (colorValue) => {
                const colorMap = {
                  "red": "#EF4444", "blue": "#3B82F6", "green": "#10B981",
                  "black": "#000000", "white": "#FFFFFF", "yellow": "#F59E0B",
                  "purple": "#8B5CF6", "pink": "#EC4899", "gray": "#6B7280",
                  "brown": "#92400E"
                };
                return colorMap[colorValue] || "#ccc";
              };

              const getColorName = (colorValue) => {
                const colorMap = {
                  "red": "Red", "blue": "Blue", "green": "Green",
                  "black": "Black", "white": "White", "yellow": "Yellow",
                  "purple": "Purple", "pink": "Pink", "gray": "Gray",
                  "brown": "Brown"
                };
                return colorMap[colorValue] || colorValue;
              };

              return (
                <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  {/* Item Image */}
                  <div className="w-16 h-16 flex-shrink-0">
                    <img
                      src={imageUrl}
                      alt={itemName}
                      className="w-full h-full object-cover rounded-lg border border-gray-300"
                      onError={(e) => {
                        e.target.src = '/placeholder-image.jpg';
                      }}
                    />
                  </div>
                  
                  {/* Item Details */}
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{itemName}</p>
                    
                    <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-600">
                      <span>Qty: {quantity}</span>
                      <span>Price: Rs. {price}</span>
                      {color && (
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full border border-gray-300"
                            style={{ backgroundColor: getColorHex(color) }}
                            title={getColorName(color)}
                          />
                          <span>{getColorName(color)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Item Total */}
                  <div className="text-right">
                    <p className="font-bold text-gray-800">
                      Rs. {(price * quantity).toLocaleString()}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
        <p className="text-lg font-bold text-indigo-600 mt-3">
          Total: Rs. {order.total || 0}
        </p>
      </div>

      {/* If you want to display address details separately, you can add this: */}
      {typeof order.address === 'object' && order.address && (
        <div className="mt-4 p-3 bg-gray-50 rounded">
          <p className="font-semibold text-gray-700 mb-1">Delivery Address:</p>
          <div className="text-sm text-gray-600">
            {order.address.street && <p>Street: {order.address.street}</p>}
            {order.address.city && <p>City: {order.address.city}</p>}
            {order.address.province && <p>Province: {order.address.province}</p>}
            {order.address.postalCode && <p>Postal Code: {order.address.postalCode}</p>}
          </div>
        </div>
      )}

      {/* Rest of your buttons remain the same */}
      <div className="flex gap-2 flex-wrap">
        {order.status === "pending" && (
          <>
            <button
              onClick={() => updateOrderStatus("accepted")}
              disabled={loading}
              className="relative bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div> : "✓ Accept"}
            </button>
            <button
              onClick={() => updateOrderStatus("rejected")}
              disabled={loading}
              className="relative bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div> : "✗ Reject"}
            </button>
          </>
        )}

        {order.status === "accepted" && (
          <button
            onClick={() => updateOrderStatus("processing")}
            disabled={loading}
            className="relative bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div> : "⚙ Processing"}
          </button>
        )}

        {order.status === "processing" && (
          <button
            onClick={() => updateOrderStatus("delivering")}
            disabled={loading}
            className="relative bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div> : "🚚 Delivering"}
          </button>
        )}

        {order.status === "delivering" && (
          <button
            onClick={() => updateOrderStatus("done")}
            disabled={loading}
            className="relative bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div> : "✅ Done"}
          </button>
        )}

        {order.status === "done" && (
          <button
            onClick={deleteOrder}
            className="relative bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div> : "🗑 Remove"}
          </button>
        )}

        {order.status === "rejected" && (
          <button
            onClick={deleteOrder}
            className="relative bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div> : "🗑 Remove"}
          </button>
        )}
      </div>
    </div>
  );
}

// Add colorOptions at the end for EditProducts component
const colorOptions = [
  { name: "Red", value: "red", hex: "#EF4444" },
  { name: "Blue", value: "blue", hex: "#3B82F6" },
  { name: "Green", value: "green", hex: "#10B981" },
  { name: "Black", value: "black", hex: "#000000" },
  { name: "White", value: "white", hex: "#FFFFFF" },
  { name: "Yellow", value: "yellow", hex: "#F59E0B" },
  { name: "Purple", value: "purple", hex: "#8B5CF6" },
  { name: "Pink", value: "pink", hex: "#EC4899" },
  { name: "Gray", value: "gray", hex: "#6B7280" },
  { name: "Brown", value: "brown", hex: "#92400E" }
];