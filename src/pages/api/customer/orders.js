import { MongoClient, ObjectId } from "mongodb";

export default async function handler(req, res) {
  if (!process.env.MONGODB_URI) {
    return res.status(500).json({ success: false, message: "Server configuration error" });
  }

  try {
    const client = await MongoClient.connect(process.env.MONGODB_URI);
    const db = client.db("store");

    if (req.method === "GET") {
      // Get all orders (including admin-deleted) for customer history
      const orders = await db
        .collection("orders")
        .find({})
        .sort({ createdAt: -1 })
        .toArray();
      res.status(200).json(orders);
    }

    client.close();
  } catch (error) {
    console.error("Customer Orders API error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}
