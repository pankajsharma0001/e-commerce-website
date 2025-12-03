import { ObjectId } from 'mongodb';
import clientPromise from '../../../../lib/mongodb';

export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Product ID is required' });
  }

  // Validate ObjectId format
  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid product ID format' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const client = await clientPromise;
    const db = client.db('store');

    // First, get the current product
    const currentProduct = await db.collection('products').findOne({
      _id: new ObjectId(id)
    });

    if (!currentProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Find related products by category
    let relatedProducts = await db.collection('products')
      .find({
        _id: { $ne: new ObjectId(id) },
        category: currentProduct.category,
        stock: { $gt: 0 }
      })
      .project({
        _id: 1,
        name: 1,
        price: 1,
        images: 1,
        category: 1,
        stock: 1,
        averageRating: 1,
        reviewCount: 1
      })
      .limit(4)
      .sort({ averageRating: -1, createdAt: -1 })
      .toArray();

    // If not enough related products, get random popular products
    if (relatedProducts.length < 4) {
      const additionalProducts = await db.collection('products')
        .find({
          _id: { 
            $ne: new ObjectId(id),
            $nin: relatedProducts.map(p => p._id)
          },
          stock: { $gt: 0 }
        })
        .project({
          _id: 1,
          name: 1,
          price: 1,
          images: 1,
          category: 1,
          stock: 1,
          averageRating: 1,
          reviewCount: 1
        })
        .limit(4 - relatedProducts.length)
        .sort({ averageRating: -1, reviewCount: -1 })
        .toArray();

      relatedProducts = [...relatedProducts, ...additionalProducts];
    }

    // Format the response
    const formattedProducts = relatedProducts.map(product => ({
      id: product._id.toString(),
      name: product.name,
      price: product.price,
      image: product.images?.[0] || '/placeholder.jpg',
      category: product.category,
      stock: product.stock,
      averageRating: product.averageRating || 0,
      reviewCount: product.reviewCount || 0
    }));

    res.status(200).json(formattedProducts);
  } catch (error) {
    console.error('Error fetching related products:', error);
    res.status(500).json({ error: 'Failed to fetch related products' });
  }
}