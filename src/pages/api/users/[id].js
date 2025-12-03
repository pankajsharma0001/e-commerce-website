// pages/api/users/[id].js
import { MongoClient, ObjectId } from "mongodb";

export default async function handler(req, res) {
  if (!process.env.MONGODB_URI) {
    return res.status(500).json({ 
      success: false, 
      message: "Database connection error" 
    });
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ 
      success: false, 
      message: "User ID is required" 
    });
  }

  let client;

  try {
    client = await MongoClient.connect(process.env.MONGODB_URI);
    const db = client.db("store");

    if (req.method === "PUT") {
      const { name, mobile } = req.body;

      if (!name) {
        return res.status(400).json({ 
          success: false, 
          message: "Name is required" 
        });
      }

      // Update user
      const result = await db.collection("users").updateOne(
        { _id: new ObjectId(id) },
        { 
          $set: { 
            name: name,
            mobile: mobile || "",
            updatedAt: new Date()
          } 
        }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ 
          success: false, 
          message: "User not found" 
        });
      }

      // Get updated user
      const updatedUser = await db.collection("users").findOne(
        { _id: new ObjectId(id) },
        { projection: { password: 0 } } // Don't return password
      );

      return res.status(200).json({
        _id: updatedUser._id.toString(),
        name: updatedUser.name,
        email: updatedUser.email,
        mobile: updatedUser.mobile || "",
        image: updatedUser.image || null,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt
      });

    } else {
      return res.status(405).json({ 
        success: false, 
        message: "Method not allowed" 
      });
    }

  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Server error",
      error: error.message 
    });
  } finally {
    if (client) await client.close();
  }
}