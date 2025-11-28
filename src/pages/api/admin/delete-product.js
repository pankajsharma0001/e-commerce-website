import { MongoClient, ObjectId } from "mongodb";

export default async function handler(req, res) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ success: false, message: "Only DELETE allowed" });
  }

  if (!process.env.MONGODB_URI) {
    return res.status(500).json({ success: false, message: "Server configuration error" });
  }

  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ success: false, message: "Product ID is required" });
    }

    const client = await MongoClient.connect(process.env.MONGODB_URI);
    const db = client.db("store");

    const result = await db.collection("products").deleteOne({ _id: new ObjectId(id) });

    client.close();

    if (result.deletedCount > 0) {
      return res.status(200).json({ success: true, message: "Product deleted successfully" });
    } else {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
  } catch (error) {
    console.error("Delete product error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
}
