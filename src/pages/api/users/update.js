import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import { ObjectId } from "mongodb";
import clientPromise from "../../../lib/mongodb";

export default async function handler(req, res) {
  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Get session to verify user
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
      return res.status(401).json({ error: "Unauthorized. Please login." });
    }

    const { userId, name, mobile } = req.body;

    // Validate input
    if (!userId || !name) {
      return res.status(400).json({ error: "User ID and name are required" });
    }

    // Check if the user is updating their own profile
    if (session.user.id !== userId) {
      return res.status(403).json({ error: "You can only update your own profile" });
    }

    const client = await clientPromise;
    const db = client.db("store");

    // Update user in database
    const result = await db.collection("users").updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          name: name.trim(),
          mobile: mobile || null,
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: userId,
        name: name.trim(),
        mobile: mobile || null,
      },
    });
  } catch (error) {
    console.error("Error updating user:", error);
    
    // Handle MongoDB ObjectId errors
    if (error.message.includes("ObjectId")) {
      return res.status(400).json({ error: "Invalid user ID format" });
    }
    
    res.status(500).json({ error: "Internal server error" });
  }
}