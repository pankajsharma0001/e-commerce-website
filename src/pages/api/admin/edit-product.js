import { IncomingForm } from "formidable";
import { v2 as cloudinary } from "cloudinary";
import { MongoClient, ObjectId } from "mongodb";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const config = {
  api: {
    bodyParser: false,
  },
};

const parseForm = (req) =>
  new Promise((resolve, reject) => {
    const form = new IncomingForm({ keepExtensions: true });
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });

export default async function handler(req, res) {
  if (req.method !== "PUT") {
    return res.status(405).json({ success: false, message: "Only PUT allowed" });
  }

  if (!process.env.MONGODB_URI) {
    console.error("Missing MONGODB_URI environment variable");
    return res.status(500).json({ success: false, message: "Server configuration error" });
  }

  try {
    const { fields, files } = await parseForm(req);

    const id = Array.isArray(fields.id) ? fields.id[0] : fields.id;
    const name = Array.isArray(fields.name) ? fields.name[0] : fields.name;
    const price = Array.isArray(fields.price) ? fields.price[0] : fields.price;
    const stock = Array.isArray(fields.stock) ? fields.stock[0] : fields.stock;
    const desc = Array.isArray(fields.desc) ? fields.desc[0] : fields.desc;
    const fileArray = Array.isArray(files.image) ? files.image : [files.image];
    const file = fileArray[0];

    if (!id || !name || !price || !stock || !desc) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    // Connect to MongoDB
    const client = await MongoClient.connect(process.env.MONGODB_URI);
    const db = client.db("store");

    const updateData = {
      name,
      price: Number(price),
      stock: Number(stock),
      desc,
      updatedAt: new Date(),
    };

    // If a new image is provided, upload to Cloudinary
    if (file && file.filepath) {
      console.log("Uploading new image to Cloudinary...");
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: "mystore" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(fs.readFileSync(file.filepath));
      });
      updateData.image = result.secure_url;
    }

    // Update product in MongoDB
    const result = await db.collection("products").updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    client.close();

    if (result.modifiedCount > 0) {
      return res.status(200).json({ success: true, message: "Product updated successfully" });
    } else {
      return res.status(400).json({ success: false, message: "Product not found or no changes made" });
    }
  } catch (error) {
    console.error("Edit product error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
}
