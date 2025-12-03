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
    const form = new IncomingForm({ keepExtensions: true, multiples: true });
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });

const extractField = (fields, fieldName) => {
  if (!fields || !fields[fieldName]) return null;
  return Array.isArray(fields[fieldName]) ? fields[fieldName][0] : fields[fieldName];
};

const extractArrayField = (fields, fieldName) => {
  if (!fields || !fields[fieldName]) return [];
  const value = fields[fieldName];
  if (Array.isArray(value)) return value;
  return [value];
};

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
      
      const fileStream = fs.createReadStream(file.filepath);
      fileStream.pipe(uploadStream);
    });
  });

  return Promise.all(uploadPromises);
};

export default async function handler(req, res) {
  if (req.method !== "PUT") {
    return res.status(405).json({ success: false, message: "Only PUT allowed" });
  }

  if (!process.env.MONGODB_URI) {
    return res.status(500).json({ success: false, message: "Server configuration error" });
  }

  try {
    const { fields, files } = await parseForm(req);

    // Extract fields
    const productId = extractField(fields, "id");
    const name = extractField(fields, "name");
    const price = extractField(fields, "price");
    const stock = extractField(fields, "stock");
    const desc = extractField(fields, "desc");
    const category = extractField(fields, "category");
    const hasColors = extractField(fields, "hasColors") === "true";
    
    // Parse existing images (sent as JSON string)
    let existingImages = [];
    const existingImagesField = extractField(fields, "existingImages");
    if (existingImagesField) {
      try {
        existingImages = JSON.parse(existingImagesField);
      } catch (error) {
        console.warn("Failed to parse existingImages:", error);
      }
    }
    
    // Parse colors and features
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
        message: "Invalid data format" 
      });
    }

    // Handle new images
    let newImageUrls = [];
    let newImagesArray = [];
    
    if (files.newImages) {
      if (Array.isArray(files.newImages)) {
        newImagesArray = files.newImages;
      } else {
        newImagesArray = [files.newImages];
      }
      
      if (newImagesArray.length > 0) {
        try {
          newImageUrls = await uploadImagesToCloudinary(newImagesArray);
          console.log("Uploaded", newImageUrls.length, "new images");
        } catch (error) {
          console.error("Error uploading new images:", error);
          return res.status(500).json({ 
            success: false, 
            message: "Failed to upload new images" 
          });
        }
      }
    }

    // Clean up temporary files
    newImagesArray.forEach((file) => {
      try {
        fs.unlinkSync(file.filepath);
      } catch (unlinkError) {
        console.warn("Failed to delete temp file:", unlinkError);
      }
    });

    // Combine existing and new images
    const allImages = [...existingImages, ...newImageUrls];
    
    // Validation
    if (!productId || !name || !price || !stock || !desc || !category) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing required fields" 
      });
    }

    if (features.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Please add at least one feature" 
      });
    }

    if (allImages.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Product must have at least one image" 
      });
    }

    // Update product in MongoDB
    let client;
    try {
      client = await MongoClient.connect(process.env.MONGODB_URI);
      const db = client.db("store");

      const updateData = {
        name,
        price: Number(price),
        stock: Number(stock),
        desc,
        category,
        images: allImages,
        features,
        hasColors,
        colors: hasColors ? colors : [],
        updatedAt: new Date(),
      };

      // Set main image as first image
      if (allImages.length > 0) {
        updateData.image = allImages[0];
      }

      const result = await db.collection("products").updateOne(
        { _id: new ObjectId(productId) },
        { $set: updateData }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ 
          success: false, 
          message: "Product not found" 
        });
      }

      console.log("Product updated successfully");
      return res.status(200).json({ 
        success: true, 
        message: "Product updated successfully!"
      });
    } catch (mongoError) {
      console.error("MongoDB error:", mongoError);
      return res.status(500).json({ 
        success: false, 
        message: "Failed to update product" 
      });
    } finally {
      if (client) {
        await client.close();
      }
    }
  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Internal server error" 
    });
  }
}