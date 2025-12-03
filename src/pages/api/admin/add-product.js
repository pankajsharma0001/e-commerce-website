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
    const form = new IncomingForm({ keepExtensions: true, multiples: true });
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });

// Helper function to extract single field value
const extractField = (fields, fieldName) => {
  if (!fields || !fields[fieldName]) return null;
  return Array.isArray(fields[fieldName]) ? fields[fieldName][0] : fields[fieldName];
};

// Helper function to extract array field
const extractArrayField = (fields, fieldName) => {
  if (!fields || !fields[fieldName]) return [];
  const value = fields[fieldName];
  if (Array.isArray(value)) return value;
  return [value];
};

// Upload multiple images to Cloudinary
const uploadImagesToCloudinary = async (imageFiles) => {
  const uploadPromises = imageFiles.map((file) => {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: "mystore" },
        (error, result) => {
          if (error) reject(error);
          else resolve(result.secure_url);
        }
      );
      
      // Read file and pipe to upload stream
      const fileStream = fs.createReadStream(file.filepath);
      fileStream.pipe(uploadStream);
    });
  });

  return Promise.all(uploadPromises);
};

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

    // Extract fields
    const name = extractField(fields, "name");
    const price = extractField(fields, "price");
    const stock = extractField(fields, "stock");
    const desc = extractField(fields, "desc");
    const category = extractField(fields, "category");
    const hasColors = extractField(fields, "hasColors") === "true";
    
    // Parse JSON fields
    let colors = [];
    let features = [];
    
    try {
      const colorsField = extractField(fields, "colors");
      if (colorsField) {
        colors = JSON.parse(colorsField);
      }
      
      const featuresField = extractField(fields, "features");
      if (featuresField) {
        features = JSON.parse(featuresField);
      }
    } catch (parseError) {
      console.error("Error parsing JSON fields:", parseError);
      return res.status(400).json({ 
        success: false, 
        message: "Invalid data format for colors or features" 
      });
    }

    // Handle multiple images
    let imagesArray = [];
    if (files.images) {
      // If multiple files are uploaded
      if (Array.isArray(files.images)) {
        imagesArray = files.images;
      } else {
        // If single file
        imagesArray = [files.images];
      }
    }

    console.log("Extracted fields:", { 
      name, price, stock, desc, category, hasColors, 
      colorsCount: colors.length, featuresCount: features.length,
      imagesCount: imagesArray.length 
    });

    // Validation
    if (!name || !price || !stock || !desc || !category) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing required fields",
        debug: { name, price, stock, desc, category } 
      });
    }

    if (imagesArray.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Please upload at least one image" 
      });
    }

    if (features.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Please add at least one feature" 
      });
    }

    // Upload images to Cloudinary
    console.log("Starting Cloudinary upload for", imagesArray.length, "images");
    let imageUrls = [];
    try {
      imageUrls = await uploadImagesToCloudinary(imagesArray);
      console.log("Cloudinary upload successful:", imageUrls.length, "images uploaded");
    } catch (cloudinaryError) {
      console.error("Cloudinary upload error:", cloudinaryError);
      return res.status(500).json({ 
        success: false, 
        message: "Failed to upload images to Cloudinary" 
      });
    }

    // Clean up temporary files
    imagesArray.forEach((file) => {
      try {
        fs.unlinkSync(file.filepath);
      } catch (unlinkError) {
        console.warn("Failed to delete temp file:", unlinkError);
      }
    });

    // Save product to MongoDB
    console.log("Connecting to MongoDB...");
    let client;
    try {
      client = await MongoClient.connect(process.env.MONGODB_URI);
      const db = client.db("store");

      console.log("Inserting product into database...");
      const productData = {
        name,
        price: Number(price),
        stock: Number(stock),
        desc,
        category,
        images: imageUrls,
        features,
        hasColors,
        colors: hasColors ? colors : [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // If there's a main image field, use the first image
      if (imageUrls.length > 0) {
        productData.image = imageUrls[0]; // For backward compatibility
      }

      const result = await db.collection("products").insertOne(productData);
      console.log("Product inserted successfully with ID:", result.insertedId);

      // Return success with product data
      return res.status(200).json({ 
        success: true, 
        productId: result.insertedId,
        message: "Product added successfully!"
      });
    } catch (mongoError) {
      console.error("MongoDB error:", mongoError);
      return res.status(500).json({ 
        success: false, 
        message: "Failed to save product to database" 
      });
    } finally {
      if (client) {
        await client.close();
      }
    }
  } catch (error) {
    console.error("Server error:", error);
    console.error("Error stack:", error.stack);
    return res.status(500).json({ 
      success: false, 
      message: "Internal server error",
      error: error.message 
    });
  }
}