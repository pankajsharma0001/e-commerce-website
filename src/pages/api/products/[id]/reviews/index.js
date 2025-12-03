import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]";
import { ObjectId } from 'mongodb';
import clientPromise from '../../../../../lib/mongodb';

export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Product ID is required' });
  }

  // Get user session
  const session = await getServerSession(req, res, authOptions);

  if (req.method === 'GET') {
    try {
      const client = await clientPromise;
      const db = client.db('store');
      
      // Fetch reviews for the product
      const reviews = await db.collection('reviews')
        .find({ productId: id })
        .sort({ createdAt: -1 })
        .toArray();

      // Don't expose user emails in response
      const sanitizedReviews = reviews.map(review => {
        const { userEmail, ...rest } = review;
        return rest;
      });

      res.status(200).json(sanitizedReviews);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      res.status(500).json({ error: 'Failed to fetch reviews' });
    }
  } else if (req.method === 'POST') {
    // Check if user is authenticated
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized. Please login to submit a review.' });
    }

    try {
      const client = await clientPromise;
      const db = client.db('store');

      const { rating, comment, images = [] } = req.body;

      // Validate input
      if (!rating || !comment) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Check if user already reviewed this product
      const existingReview = await db.collection('reviews').findOne({
        productId: id,
        userId: session.user.id
      });

      if (existingReview) {
        return res.status(400).json({ error: 'You have already reviewed this product' });
      }

      // Create new review using session data
      const newReview = {
        productId: id,
        userId: session.user.id,
        userName: session.user.name,
        userEmail: session.user.email,
        userAvatar: session.user.image || '/avatar-default.jpg', // Use session image
        rating: parseInt(rating),
        comment: comment.trim(),
        images: images || [],
        helpful: 0,
        verifiedPurchase: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Insert review
      const result = await db.collection('reviews').insertOne(newReview);

      // Update product's average rating
      await updateProductRating(db, id);

      // Return the review with ID (without email)
      const createdReview = {
        _id: result.insertedId,
        ...newReview
      };

      // Remove email from response
      delete createdReview.userEmail;

      res.status(201).json(createdReview);
    } catch (error) {
      console.error('Error creating review:', error);
      res.status(500).json({ error: 'Failed to create review' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
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