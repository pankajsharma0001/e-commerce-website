import { MongoClient, ObjectId } from "mongodb";

export default async function handler(req, res) {
  if (!process.env.MONGODB_URI) {
    return res.status(500).json({ success: false, message: "Server configuration error" });
  }

  try {
    const client = await MongoClient.connect(process.env.MONGODB_URI);
    const db = client.db("store");

    if (req.method === "GET") {
      // Get all orders (excluding admin-deleted orders)
      const orders = await db
        .collection("orders")
        .find({ deletedByAdmin: { $ne: true } })
        .sort({ createdAt: -1 })
        .toArray();
      res.status(200).json(orders);
    } else if (req.method === "POST") {
      // Create new order
      const order = {
        ...req.body,
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const result = await db.collection("orders").insertOne(order);
      res.status(201).json({ success: true, orderId: result.insertedId });
    } else if (req.method === "PUT") {
      // Update order status
      const { id, status } = req.body;
      if (!id || !status) {
        return res.status(400).json({ success: false, message: "Missing id or status" });
      }
      const result = await db.collection("orders").updateOne(
        { _id: new ObjectId(id) },
        { $set: { status, updatedAt: new Date() } }
      );
      if (result.modifiedCount > 0) {
        res.status(200).json({ success: true, message: "Order updated" });
      } else {
        res.status(404).json({ success: false, message: "Order not found" });
      }
    } else if (req.method === "DELETE") {
      // Mark order as deleted by admin (soft delete)
      const { id } = req.query;
      if (!id) {
        return res.status(400).json({ success: false, message: "Missing id" });
      }
      const result = await db.collection("orders").updateOne(
        { _id: new ObjectId(id) },
        { $set: { deletedByAdmin: true, updatedAt: new Date() } }
      );
      if (result.modifiedCount > 0) {
        res.status(200).json({ success: true, message: "Order removed from admin view" });
      } else {
        res.status(404).json({ success: false, message: "Order not found" });
      }
    }

    client.close();
  } catch (error) {
    console.error("Orders API error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}
