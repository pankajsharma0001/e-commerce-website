import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload multiple images to Cloudinary for reviews
export const uploadReviewImages = async (imageFiles) => {
  try {
    const uploadPromises = imageFiles.map((file) => {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { 
            folder: 'store-reviews',
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
        
        // Convert File to buffer
        const reader = new FileReader();
        reader.onload = () => {
          const buffer = Buffer.from(reader.result);
          uploadStream.end(buffer);
        };
        reader.readAsArrayBuffer(file);
      });
    });

    const imageUrls = await Promise.all(uploadPromises);
    return imageUrls;
  } catch (error) {
    console.error('Error uploading images to Cloudinary:', error);
    throw error;
  }
};

// Delete images from Cloudinary
export const deleteImagesFromCloudinary = async (imageUrls) => {
  try {
    const deletePromises = imageUrls.map(url => {
      const publicId = url.split('/').pop().split('.')[0];
      return cloudinary.uploader.destroy(`store-reviews/${publicId}`);
    });

    await Promise.all(deletePromises);
  } catch (error) {
    console.error('Error deleting images from Cloudinary:', error);
  }
};