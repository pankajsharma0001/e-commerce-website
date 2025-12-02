import { ObjectId } from "mongodb";
import clientPromise from "../../../lib/mongodb";

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === "PUT") {
    const { name, mobile, email, image, provider } = req.body;

    try {
      const client = await clientPromise;
      const db = client.db("store");

      // FIRST: Check if user with this email already exists
      // This prevents creating multiple users with same email
      if (email) {
        const existingUserByEmail = await db.collection("users").findOne({ email });
        
        if (existingUserByEmail) {
          // Update the existing user instead of creating new
          const result = await db.collection("users").findOneAndUpdate(
            { email }, // Find by email instead of ID
            {
              $set: {
                name: name || existingUserByEmail.name,
                mobile: mobile || existingUserByEmail.mobile,
                image: image || existingUserByEmail.image,
                lastLogin: new Date(),
              },
            },
            { returnDocument: "after" }
          );
          
          return res.status(200).json(result.value);
        }
      }

      // If no existing user found by email, proceed with upsert by ID
      let query;
      if (ObjectId.isValid(id)) {
        query = { _id: new ObjectId(id) };
      } else {
        // For Google/email-based IDs, use a dedicated field
        query = { userId: id };
      }

      const updateData = {
        $set: {
          name,
          mobile,
          email: email || undefined,
          image: image || undefined,
          provider: provider || "email",
          lastLogin: new Date(),
        },
        $setOnInsert: { 
          createdAt: new Date(),
          userId: id, // Store the custom ID
        },
      };

      const result = await db.collection("users").findOneAndUpdate(
        query,
        updateData,
        { returnDocument: "after", upsert: true }
      );

      return res.status(200).json(result.value);
      
    } catch (err) {
      console.error("Error in user update/create:", err);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  } else {
    res.setHeader("Allow", ["PUT"]);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
}