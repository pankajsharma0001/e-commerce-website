import { useState, useEffect } from "react";

export default function Admin() {
  const [view, setView] = useState("orders"); // "orders" | "add" | "edit"
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null); // product being edited

  useEffect(() => {
    if (view === "orders") {
      // Fetch orders from database
      fetch("/api/admin/orders")
        .then((res) => res.json())
        .then((data) => setOrders(data))
        .catch((err) => console.error("Error fetching orders:", err));
    }
    if (view === "edit" || view === "add") {
      fetch("/api/products")
        .then((res) => res.json())
        .then((data) => setProducts(data));
    }
  }, [view]);

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      <h2 className="text-3xl font-extrabold text-indigo-600 text-center mb-8">
        Admin Panel Dashboard
      </h2>

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
          setEditingProduct={setEditingProduct} // ✅ pass this
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

// -------------------- ADD PRODUCT FORM --------------------
function AddProductForm() {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [desc, setDesc] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [message, setMessage] = useState("");

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!imageFile) {
      setMessage("❌ Please select an image");
      return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("price", price);
    formData.append("stock", stock);
    formData.append("desc", desc);
    formData.append("image", imageFile);

    try {
      const res = await fetch("/api/admin/add-product", {
        method: "POST",
        body: formData,
      });
      const response = await res.json();

      if (response.success) {
        setMessage("✅ Product added successfully!");
        setName(""); setPrice(""); setStock(""); setDesc(""); setImageFile(null); setPreview("");
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
      className="max-w-2xl mx-auto p-8 text-gray-800 bg-white rounded-xl shadow space-y-4"
    >
      <h3 className="text-2xl font-semibold text-gray-800">Add New Product</h3>

      <input
        type="text"
        placeholder="Product Name"
        value={name}
        required
        onChange={(e) => setName(e.target.value)}
        className="w-full p-3 border rounded"
      />
      <input
        type="number"
        placeholder="Price"
        value={price}
        required
        onChange={(e) => setPrice(e.target.value)}
        className="w-full p-3 border rounded"
      />
      <input
        type="number"
        placeholder="Stock"
        value={stock}
        required
        onChange={(e) => setStock(e.target.value)}
        className="w-full p-3 border rounded"
      />
      <textarea
        placeholder="Description"
        value={desc}
        required
        onChange={(e) => setDesc(e.target.value)}
        className="w-full p-3 border rounded"
      ></textarea>

      <input type="file" accept="image/*" onChange={handleImageChange} />
      {preview && <img src={preview} className="w-32 h-32 object-cover rounded mt-2" />}

      <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded">
        Add Product
      </button>
      {message && <p>{message}</p>}
    </form>
  );
}

// -------------------- EDIT PRODUCTS --------------------
function EditProducts({ products, setEditingProduct, setProducts }) {
  const deleteProduct = async (id) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    const res = await fetch(`/api/admin/delete-product?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setProducts(products.filter((p) => p._id !== id));
      alert("Product deleted!");
    }
  };

  return (
    <div>
      <h3 className="text-2xl text-gray-800 font-semibold mb-4">Edit Products</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <div key={product._id} className="bg-white text-gray-800 p-4 rounded-lg shadow">
            <img src={product.image} className="w-full h-40 object-cover rounded-lg mb-2" />
            <h4 className="font-semibold">{product.name}</h4>
            <p>Rs. {product.price}</p>
            <p>Stock: {product.stock}</p>
            <div className="flex gap-2 mt-2">
              <button className="bg-yellow-500 px-3 py-1 rounded text-white" onClick={() => setEditingProduct(product)}>Edit</button>
              <button className="bg-red-500 px-3 py-1 rounded text-white" onClick={() => deleteProduct(product._id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// -------------------- EDIT PRODUCT FORM --------------------
function EditProductForm({ product, setEditingProduct, setProducts }) {
  const [name, setName] = useState(product?.name || "");
  const [price, setPrice] = useState(product?.price || "");
  const [stock, setStock] = useState(product?.stock || "");
  const [desc, setDesc] = useState(product?.desc || "");
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(product?.image || "");
  const [message, setMessage] = useState("");

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("id", product._id);
    formData.append("name", name);
    formData.append("price", price);
    formData.append("stock", stock);
    formData.append("desc", desc);
    if (imageFile) formData.append("image", imageFile);

    try {
      const res = await fetch("/api/admin/edit-product", {
        method: "PUT",
        body: formData,
      });
      const response = await res.json();
      if (response.success) {
        alert("✅ Product updated!");
        setEditingProduct(null);
        // Refresh products list
        const updatedProducts = await fetch("/api/products").then(r => r.json());
        setProducts(updatedProducts);
      } else {
        setMessage("❌ Error: " + response.message);
      }
    } catch (err) {
      setMessage("❌ Error: " + err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto p-8 text-gray-800 bg-white rounded-xl shadow space-y-4">
      <h3 className="text-2xl font-semibold text-gray-800">Edit Product</h3>
      <input type="text" placeholder="Product Name" value={name} required onChange={e => setName(e.target.value)} className="w-full p-3 border rounded" />
      <input type="number" placeholder="Price" value={price} required onChange={e => setPrice(e.target.value)} className="w-full p-3 border rounded" />
      <input type="number" placeholder="Stock" value={stock} required onChange={e => setStock(e.target.value)} className="w-full p-3 border rounded" />
      <textarea placeholder="Description" value={desc} required onChange={e => setDesc(e.target.value)} className="w-full p-3 border rounded"></textarea>
      <input type="file" accept="image/*" onChange={handleImageChange} />
      {preview && <img src={preview} className="w-32 h-32 object-cover rounded mt-2" />}
      <div className="flex gap-2">
        <button type="submit" className="bg-yellow-600 text-white px-6 py-2 rounded">Update Product</button>
        <button type="button" onClick={() => setEditingProduct(null)} className="bg-gray-500 text-white px-6 py-2 rounded">Cancel</button>
      </div>
      {message && <p>{message}</p>}
    </form>
  );
}

// -------------------- ORDER CARD --------------------
function OrderCard({ order, setOrders, orders }) {
  const [loading, setLoading] = useState(false);

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
          <p className="text-lg font-bold text-gray-800">{order.name}</p>
          <p className="text-sm text-gray-600">{order.phone} | {order.address}</p>
          <p className="text-sm text-gray-600">
            Order Date: {new Date(order.createdAt).toLocaleDateString()}
          </p>
        </div>
        <span className={`px-4 py-2 rounded-full font-semibold ${statusColors[order.status]}`}>
          {order.status.toUpperCase()}
        </span>
      </div>

      <div className="mb-4">
        <p className="font-semibold text-gray-800 mb-2">Items:</p>
        <div className="space-y-1 text-gray-700">
          {order.cart.map((item, idx) => (
            <p key={idx}>
              • {item.name} x{item.qty} @ Rs. {item.price}
            </p>
          ))}
        </div>
        <p className="text-lg font-bold text-indigo-600 mt-3">
          Total: Rs. {order.total}
        </p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {order.status === "pending" && (
          <>
            <button
              onClick={() => updateOrderStatus("accepted")}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              ✓ Accept
            </button>
            <button
              onClick={() => updateOrderStatus("rejected")}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              ✗ Reject
            </button>
          </>
        )}

        {order.status === "accepted" && (
          <button
            onClick={() => updateOrderStatus("processing")}
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            ⚙ Processing
          </button>
        )}

        {order.status === "processing" && (
          <button
            onClick={() => updateOrderStatus("delivering")}
            disabled={loading}
            className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            🚚 Delivering
          </button>
        )}

        {order.status === "delivering" && (
          <button
            onClick={() => updateOrderStatus("done")}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            ✅ Done
          </button>
        )}

        {order.status === "done" && (
          <button
            onClick={deleteOrder}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
          >
            🗑 Remove
          </button>
        )}

        {order.status === "rejected" && (
          <button
            onClick={deleteOrder}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
          >
            🗑 Remove
          </button>
        )}
      </div>
    </div>
  );
}