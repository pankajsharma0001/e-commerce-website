import { ObjectId } from 'mongodb';
import clientPromise from '../../../../../../lib/mongodb';
import { deleteImagesFromCloudinary } from '../../../../../../lib/cloudinary';

export default async function handler(req, res) {
  const { id, reviewId } = req.query;

  if (!id || !reviewId) {
    return res.status(400).json({ error: 'Product ID and Review ID are required' });
  }

  const client = await clientPromise;
  const db = client.db('store');

  if (req.method === 'PUT') {
    try {
      const { rating, comment, images } = req.body;
      
      // Find the existing review
      const existingReview = await db.collection('reviews').findOne({
        _id: new ObjectId(reviewId),
        productId: id
      });

      if (!existingReview) {
        return res.status(404).json({ error: 'Review not found' });
      }

      // Delete old images from Cloudinary if new ones are uploaded
      if (images && images.length > 0 && existingReview.images.length > 0) {
        await deleteImagesFromCloudinary(existingReview.images);
      }

      const updateData = {
        rating: rating || existingReview.rating,
        comment: comment || existingReview.comment,
        images: images || existingReview.images,
        updatedAt: new Date()
      };

      // Update review
      const result = await db.collection('reviews').updateOne(
        { _id: new ObjectId(reviewId), productId: id },
        { $set: updateData }
      );

      if (result.modifiedCount === 0) {
        return res.status(404).json({ error: 'Review not found or no changes made' });
      }

      // Update product rating
      await updateProductRating(db, id);

      res.status(200).json({ 
        message: 'Review updated successfully',
        reviewId: reviewId 
      });
    } catch (error) {
      console.error('Error updating review:', error);
      res.status(500).json({ error: 'Failed to update review' });
    }
  } else if (req.method === 'DELETE') {
    try {
      // Find the review to get images
      const review = await db.collection('reviews').findOne({
        _id: new ObjectId(reviewId),
        productId: id
      });

      if (!review) {
        return res.status(404).json({ error: 'Review not found' });
      }

      // Delete images from Cloudinary
      if (review.images && review.images.length > 0) {
        await deleteImagesFromCloudinary(review.images);
      }

      // Delete review from database
      const result = await db.collection('reviews').deleteOne({
        _id: new ObjectId(reviewId),
        productId: id
      });

      if (result.deletedCount === 0) {
        return res.status(404).json({ error: 'Review not found' });
      }

      // Update product rating
      await updateProductRating(db, id);

      res.status(200).json({ message: 'Review deleted successfully' });
    } catch (error) {
      console.error('Error deleting review:', error);
      res.status(500).json({ error: 'Failed to delete review' });
    }
  } else {
    res.setHeader('Allow', ['PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

// Helper function to update product rating
async function updateProductRating(db, productId) {
  try {
    const reviews = await db.collection('reviews')
      .find({ productId: productId })
      .toArray();

    if (reviews.length > 0) {
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = totalRating / reviews.length;
      const reviewCount = reviews.length;

      await db.collection('products').updateOne(
        { _id: new ObjectId(productId) },
        {
          $set: {
            averageRating: parseFloat(averageRating.toFixed(1)),
            reviewCount: reviewCount,
            updatedAt: new Date()
          }
        }
      );
    } else {
      await db.collection('products').updateOne(
        { _id: new ObjectId(productId) },
        {
          $set: {
            averageRating: 0,
            reviewCount: 0,
            updatedAt: new Date()
          }
        }
      );
    }
  } catch (error) {
    console.error('Error updating product rating:', error);
  }
}