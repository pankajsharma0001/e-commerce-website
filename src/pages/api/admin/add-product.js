import { IncomingForm } from "formidable";
import { v2 as cloudinary } from "cloudinary";
import { MongoClient } from "mongodb";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Disable Next.js body parsing for multipart
export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper to parse FormData as Promise
const parseForm = (req) =>
  new Promise((resolve, reject) => {
    const form = new IncomingForm({ keepExtensions: true });
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Only POST allowed" });
  }

  // Validate environment variables
  if (!process.env.MONGODB_URI) {
    console.error("Missing MONGODB_URI environment variable");
    return res.status(500).json({ success: false, message: "Server configuration error: MONGODB_URI not set" });
  }

  try {
    const { fields, files } = await parseForm(req);

    // Debug: log what we received
    console.log("Parsed fields:", Object.keys(fields));
    console.log("Parsed files:", Object.keys(files));

    // formidable returns arrays for fields and files
    const name = (Array.isArray(fields?.name) ? fields.name[0] : fields?.name) || null;
    const price = (Array.isArray(fields?.price) ? fields.price[0] : fields?.price) || null;
    const stock = (Array.isArray(fields?.stock) ? fields.stock[0] : fields?.stock) || null;
    const desc = (Array.isArray(fields?.desc) ? fields.desc[0] : fields?.desc) || null;
    const fileArray = Array.isArray(files?.image) ? files.image : [files?.image];
    const file = fileArray[0];

    console.log("Extracted - name:", name, "price:", price, "desc:", desc, "file:", !!file);

    if (!name || !price || !stock || !desc || !file) {
      return res.status(400).json({ success: false, message: "Missing fields or file", debug: { name, price, stock, desc, hasFile: !!file } });
    }

    // Cloudinary upload using stream from temporary file
    console.log("Starting Cloudinary upload for file:", file.filepath);
    let result;
    try {
      result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: "mystore" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(fs.readFileSync(file.filepath));
      });
      console.log("Cloudinary upload successful");
    } catch (cloudinaryError) {
      console.error("Cloudinary upload error:", cloudinaryError);
      throw cloudinaryError;
    }

    // Save product to MongoDB
    console.log("Connecting to MongoDB...");
    try {
      const client = await MongoClient.connect(process.env.MONGODB_URI);
      const db = client.db("store");

      console.log("Inserting product into database...");
      await db.collection("products").insertOne({
        name,
        price: Number(price),
        stock: Number(stock),
        desc,
        image: result.secure_url,
        createdAt: new Date(),
      });

      client.close();
      console.log("Product inserted successfully");
    } catch (mongoError) {
      console.error("MongoDB error:", mongoError);
      throw mongoError;
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Cloudinary / MongoDB error:", error);
    console.error("Error stack:", error.stack);
    return res.status(500).json({ success: false, message: error.message, stack: error.stack });
  }
}
