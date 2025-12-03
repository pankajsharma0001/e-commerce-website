import { IncomingForm } from "formidable";
import { v2 as cloudinary } from "cloudinary";
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

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Only POST allowed" });
  }

  try {
    const { files } = await parseForm(req);

    // Handle multiple images
    let imagesArray = [];
    if (files.images) {
      if (Array.isArray(files.images)) {
        imagesArray = files.images;
      } else {
        imagesArray = [files.images];
      }
    }

    if (imagesArray.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Please upload at least one image" 
      });
    }

    // Upload images to Cloudinary
    const uploadPromises = imagesArray.map((file) => {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { 
            folder: "store-reviews",
            transformation: [
              { width: 800, height: 600, crop: 'limit' },
              { quality: 'auto' },
              { format: 'webp' }
            ]
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result.secure_url);
          }
        );
        
        const fileStream = fs.createReadStream(file.filepath);
        fileStream.pipe(uploadStream);
      });
    });

    const imageUrls = await Promise.all(uploadPromises);

    // Clean up temporary files
    imagesArray.forEach((file) => {
      try {
        fs.unlinkSync(file.filepath);
      } catch (unlinkError) {
        console.warn("Failed to delete temp file:", unlinkError);
      }
    });

    return res.status(200).json({ 
      success: true, 
      imageUrls,
      message: "Images uploaded successfully!"
    });
  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Internal server error",
      error: error.message 
    });
  }
}