import clientPromise from "../../../lib/mongodb";

export default async function handler(req, res) {
  try {
    const client = await clientPromise;
    const db = client.db("store");

    if (req.method === "GET") {
      // Get all unique categories
      const categories = await db
        .collection("products")
        .distinct("category");
      
      // Get product count per category
      const categoryCounts = await Promise.all(
        categories.map(async (category) => {
          const count = await db
            .collection("products")
            .countDocuments({ category });
          return {
            name: category,
            count: count
          };
        })
      );
      
      res.status(200).json({
        success: true,
        categories: categoryCounts
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
      message: "Internal server error" 
    });
  }
}