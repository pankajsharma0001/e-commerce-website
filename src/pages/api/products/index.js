import clientPromise from "../../../lib/mongodb";

export default async function handler(req, res) {
  try {
    const client = await clientPromise;
    const db = client.db("store");

    if (req.method === "GET") {
      // Get query parameters for filtering
      const { category, search, minPrice, maxPrice } = req.query;
      
      let filter = {};
      
      // Apply category filter
      if (category && category !== 'all') {
        filter.category = category;
      }
      
      // Apply search filter
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { desc: { $regex: search, $options: 'i' } },
          { category: { $regex: search, $options: 'i' } }
        ];
      }
      
      // Apply price range filter
      if (minPrice || maxPrice) {
        filter.price = {};
        if (minPrice) filter.price.$gte = parseFloat(minPrice);
        if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
      }
      
      // Fetch products with filter
      const products = await db
        .collection("products")
        .find(filter)
        .sort({ createdAt: -1 }) // Sort by newest first
        .toArray();
      
      // Format products for consistent response
      const formattedProducts = products.map(product => ({
        _id: product._id.toString(),
        name: product.name || "",
        price: product.price || 0,
        stock: product.stock || 0,
        desc: product.desc || "",
        category: product.category || "Uncategorized",
        images: product.images || (product.image ? [product.image] : []),
        image: product.image || (product.images?.[0] || ""),
        features: product.features || [],
        hasColors: product.hasColors || false,
        colors: product.colors || [],
        createdAt: product.createdAt,
        updatedAt: product.updatedAt
      }));
      
      // Get unique categories for filters
      const categories = await db
        .collection("products")
        .distinct("category");
      
      res.status(200).json({
        success: true,
        products: formattedProducts,
        categories: categories.filter(cat => cat), // Remove null/empty categories
        total: formattedProducts.length
      });
    } else if (req.method === "POST") {
      // Create new product (admin only)
      const product = req.body;
      
      // Validate required fields
      if (!product.name || !product.price || !product.category) {
        return res.status(400).json({ 
          success: false, 
          message: "Missing required fields" 
        });
      }
      
      const newProduct = {
        ...product,
        createdAt: new Date(),
        updatedAt: new Date(),
        stock: product.stock || 0,
        images: product.images || [],
        features: product.features || [],
        hasColors: product.hasColors || false,
        colors: product.colors || []
      };
      
      const result = await db.collection("products").insertOne(newProduct);
      
      res.status(201).json({
        success: true,
        productId: result.insertedId,
        message: "Product created successfully"
      });
    } else {
      res.status(405).json({ 
        success: false, 
        message: "Method not allowed" 
      });
    }
  } catch (error) {
    console.error("API error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Internal server error",
      error: error.message 
    });
  }
}