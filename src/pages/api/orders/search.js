import { MongoClient } from "mongodb";

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { q } = req.query;
  
  if (!q) {
    return res.status(400).json({ 
      success: false, 
      message: 'Search query is required' 
    });
  }

  let client;

  try {
    client = await MongoClient.connect(process.env.MONGODB_URI);
    const db = client.db("store");

    // Search for orders by trackingId, phone, name, or email
    const orders = await db.collection("orders")
      .find({
        $or: [
          { trackingId: { $regex: q, $options: 'i' } },
          { phone: { $regex: q, $options: 'i' } },
          { name: { $regex: q, $options: 'i' } },
          { email: { $regex: q, $options: 'i' } }
        ]
      })
      .sort({ createdAt: -1 })
      .toArray();

    // Format orders for response
    const formattedOrders = orders.map(order => ({
      _id: order._id.toString(),
      name: order.name,
      phone: order.phone,
      email: order.email,
      address: order.address,
      items: order.items || order.cart || [],
      total: order.total,
      subtotal: order.subtotal,
      shippingFee: order.shippingFee,
      paymentMethod: order.paymentMethod,
      notes: order.notes,
      status: order.status || "pending",
      trackingId: order.trackingId,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    }));

    return res.status(200).json({ 
      success: true, 
      orders: formattedOrders,
      count: formattedOrders.length 
    });
    
  } catch (error) {
    console.error("Search API error:", error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  } finally {
    if (client) await client.close();
  }
}