import { MongoClient, ObjectId } from "mongodb";

export default async function handler(req, res) {
  if (!process.env.MONGODB_URI) {
    return res.status(500).json({ success: false, message: "Server configuration error" });
  }

  try {
    const client = await MongoClient.connect(process.env.MONGODB_URI);
    const db = client.db("store");

    if (req.method === "GET") {
      // Get cart for a user
      const { email } = req.query;
      if (!email) {
        return res.status(400).json({ success: false, message: "Email is required" });
      }

      let cart = await db.collection("carts").findOne({ email });
      if (!cart) {
        cart = { email, items: [] };
      }

      res.status(200).json({ success: true, cart: cart.items || [] });
    } else if (req.method === "POST") {
      // Save cart for a user
      const { email, items } = req.body;
      if (!email) {
        return res.status(400).json({ success: false, message: "Email is required" });
      }

      const result = await db.collection("carts").updateOne(
        { email },
        { $set: { email, items, updatedAt: new Date() } },
        { upsert: true }
      );

      res.status(200).json({ success: true, message: "Cart saved" });
    } else if (req.method === "DELETE") {
      // Clear cart for a user
      const { email } = req.query;
      if (!email) {
        return res.status(400).json({ success: false, message: "Email is required" });
      }

      await db.collection("carts").updateOne(
        { email },
        { $set: { items: [] } }
      );

      res.status(200).json({ success: true, message: "Cart cleared" });
    }

    client.close();
  } catch (error) {
    console.error("Cart API error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}
