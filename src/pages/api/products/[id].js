import { ObjectId } from "mongodb";
import clientPromise from "../../../lib/mongodb";

export default async function handler(req, res) {
  const client = await clientPromise;
  const db = client.db("store");

  const { id } = req.query;

  if (req.method === "GET") {
    try {
      // Validate ID format
      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid product ID format" 
        });
      }

      const product = await db
        .collection("products")
        .findOne({ _id: new ObjectId(id) });

      if (!product) {
        return res.status(404).json({ 
          success: false, 
          message: "Product not found" 
        });
      }

      // Format response to ensure consistent structure
      const formattedProduct = {
        _id: product._id.toString(),
        name: product.name || "",
        price: product.price || 0,
        stock: product.stock || 0,
        desc: product.desc || "",
        category: product.category || "Uncategorized",
        // Handle both single image and multiple images
        images: product.images || (product.image ? [product.image] : []),
        image: product.image || (product.images?.[0] || ""),
        features: product.features || [],
        hasColors: product.hasColors || false,
        colors: product.colors || [],
        createdAt: product.createdAt,
        updatedAt: product.updatedAt
      };

      res.status(200).json(formattedProduct);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ 
        success: false, 
        message: "Internal server error",
        error: error.message 
      });
    }
  } else {
    res.status(405).json({ 
      success: false, 
      message: "Method not allowed" 
    });
  }
}