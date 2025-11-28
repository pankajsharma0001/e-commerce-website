    import { ObjectId } from "mongodb";
import clientPromise from "../../../lib/mongodb";

export default async function handler(req, res) {
  const client = await clientPromise;
  const db = client.db("store");

  const { id } = req.query;

  if (req.method === "GET") {
    const product = await db
      .collection("products")
      .findOne({ _id: new ObjectId(id) });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  }
}
