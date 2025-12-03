import { MongoClient, ObjectId } from "mongodb";

export default async function handler(req, res) {
  if (!process.env.MONGODB_URI) {
    return res.status(500).json({ 
      success: false, 
      message: "Server configuration error" 
    });
  }

  const { id } = req.query;
  
  if (!id) {
    return res.status(400).json({ 
      success: false, 
      message: "Order ID is required" 
    });
  }

  let client;

  try {
    client = await MongoClient.connect(process.env.MONGODB_URI);
    const db = client.db("store");

    // Validate ObjectId format
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid order ID format" 
      });
    }

    // Find the order
    const order = await db.collection("orders").findOne({ 
      _id: new ObjectId(id),
      deletedByAdmin: { $ne: true } // Exclude deleted orders
    });

    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: "Order not found" 
      });
    }

    // Format response
    const formattedOrder = {
      _id: order._id.toString(),
      name: order.name,
      phone: order.phone,
      email: order.email,
      address: order.address,
      items: order.items || order.cart || [],
      total: order.total || 0,
      subtotal: order.subtotal,
      shippingFee: order.shippingFee,
      paymentMethod: order.paymentMethod,
      notes: order.notes,
      status: order.status || "pending",
      trackingId: order.trackingId,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      deletedByAdmin: order.deletedByAdmin || false
    };

    return res.status(200).json(formattedOrder);

  } catch (error) {
    console.error("Error fetching order:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Internal server error" 
    });
  } finally {
    if (client) await client.close();
  }
}