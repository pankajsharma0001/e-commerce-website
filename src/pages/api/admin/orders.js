import { MongoClient, ObjectId } from "mongodb";
import nodemailer from "nodemailer";

export default async function handler(req, res) {
  if (!process.env.MONGODB_URI) {
    return res.status(500).json({ 
      success: false, 
      message: "Server configuration error: MONGODB_URI not set" 
    });
  }

  let client;

  try {
    client = await MongoClient.connect(process.env.MONGODB_URI);
    const db = client.db("store");

    // Helper function to format address
    const formatAddress = (address) => {
      if (typeof address === 'object' && address !== null) {
        return `${address.street}, ${address.city}, ${address.province}${address.postalCode ? `, ${address.postalCode}` : ''}`;
      }
      return address || '';
    };

    // EMAIL FUNCTION FOR STATUS UPDATES
    const sendStatusUpdateEmail = async (order, newStatus) => {
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS || !order.email) {
        console.log("Email configuration missing or no customer email, skipping status update email");
        return;
      }

      const statusMessages = {
        pending: "has been received and is pending",
        accepted: "has been accepted and is being prepared",
        processing: "is being processed",
        delivering: "is out for delivery",
        done: "has been delivered successfully",
        rejected: "has been rejected"
      };

      const statusColors = {
        pending: "#F59E0B", // yellow
        accepted: "#3B82F6", // blue
        processing: "#8B5CF6", // purple
        delivering: "#F97316", // orange
        done: "#10B981", // green
        rejected: "#EF4444" // red
      };

      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || "smtp.gmail.com",
          port: parseInt(process.env.SMTP_PORT) || 587,
          secure: process.env.SMTP_SECURE === "true",
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        // Get items array (new) or cart array (old) for backward compatibility
        const items = order.items || order.cart || [];
        
        const customerMessage = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: ${statusColors[newStatus] || '#3B82F6'}; margin-bottom: 10px;">
                Order Status Updated
              </h1>
              <div style="display: inline-block; background-color: ${statusColors[newStatus] || '#3B82F6'}; color: white; padding: 10px 20px; border-radius: 20px; font-weight: bold;">
                ${newStatus.toUpperCase()}
              </div>
            </div>
            
            <div style="background-color: #f9fafb; padding: 25px; border-radius: 10px; margin-bottom: 20px;">
              <p style="font-size: 18px; color: #374151; margin-bottom: 20px;">
                Hello <strong>${order.name}</strong>,<br>
                Your order ${statusMessages[newStatus] || "status has been updated"}.
              </p>
              
              <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h3 style="color: #1f2937; margin-top: 0; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
                  Order Information
                </h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                  <div>
                    <p style="margin: 8px 0;"><strong>Tracking ID:</strong><br>${order.trackingId}</p>
                    <p style="margin: 8px 0;"><strong>Order Date:</strong><br>${new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p style="margin: 8px 0;"><strong>Total Amount:</strong><br>Rs. ${order.total?.toLocaleString() || order.total}</p>
                    <p style="margin: 8px 0;"><strong>Payment Method:</strong><br>${order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}</p>
                  </div>
                </div>
              </div>
              
              <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h3 style="color: #1f2937; margin-top: 0; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
                  Delivery Address
                </h3>
                <p style="margin: 10px 0;">${formatAddress(order.address)}</p>
                <p style="margin: 10px 0;"><strong>Phone:</strong> ${order.phone}</p>
              </div>
              
              ${items.length > 0 ? `
                <div style="background: white; padding: 20px; border-radius: 8px;">
                  <h3 style="color: #1f2937; margin-top: 0; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
                    Order Items (${items.length})
                  </h3>
                  <div style="max-height: 200px; overflow-y: auto;">
                    ${items.slice(0, 5).map(item => `
                      <div style="display: flex; align-items: center; padding: 10px; border-bottom: 1px solid #e5e7eb;">
                        <img src="${item.image}" alt="${item.name}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 5px; margin-right: 15px;">
                        <div style="flex: 1;">
                          <p style="margin: 0; font-weight: 500;">${item.name}</p>
                          <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">
                            Qty: ${item.quantity || item.qty || 1} × Rs. ${item.price}
                            ${item.color ? ` • Color: ${item.color}` : ''}
                          </p>
                        </div>
                      </div>
                    `).join('')}
                  </div>
                  ${items.length > 5 ? `<p style="text-align: center; color: #6b7280; margin-top: 10px;">... and ${items.length - 5} more items</p>` : ''}
                </div>
              ` : ''}
            </div>
            
            <div style="text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p>You can track your order anytime using your Tracking ID on our website.</p>
              <p>If you have any questions, please contact our support team.</p>
              <p>Best regards,<br><strong>MyStore Team</strong></p>
            </div>
          </div>
        `;

        await transporter.sendMail({
          from: `"My Store" <${process.env.SMTP_USER}>`,
          to: order.email,
          subject: `Order Status Update: ${newStatus.toUpperCase()} - ${order.trackingId}`,
          html: customerMessage,
        });

        console.log(`Status update email sent for order ${order.trackingId}`);
      } catch (emailErr) {
        console.error("Status update email send failed:", emailErr);
      }
    };

    // GET - Fetch all non-deleted orders with filtering options
    if (req.method === "GET") {
      const { status, startDate, endDate, search } = req.query;
      
      // Build filter object
      let filter = { deletedByAdmin: { $ne: true } };
      
      // Status filter
      if (status && status !== 'all') {
        filter.status = status;
      }
      
      // Date range filter
      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) {
          filter.createdAt.$gte = new Date(startDate);
        }
        if (endDate) {
          filter.createdAt.$lte = new Date(endDate);
        }
      }
      
      // Search filter (by name, phone, email, trackingId)
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { trackingId: { $regex: search, $options: 'i' } },
          { 'address.street': { $regex: search, $options: 'i' } },
          { 'address.city': { $regex: search, $options: 'i' } }
        ];
      }

      const orders = await db
        .collection("orders")
        .find(filter)
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
        subtotal: order.subtotal,
        shippingFee: order.shippingFee,
        total: order.total,
        paymentMethod: order.paymentMethod,
        notes: order.notes,
        status: order.status || "pending",
        trackingId: order.trackingId,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        deletedByAdmin: order.deletedByAdmin || false
      }));

      // Get order statistics
      const stats = await db.collection("orders").aggregate([
        { $match: { deletedByAdmin: { $ne: true } } },
        { 
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            totalAmount: { $sum: "$total" }
          }
        }
      ]).toArray();

      const totalOrders = await db.collection("orders").countDocuments({ deletedByAdmin: { $ne: true } });
      const totalRevenue = await db.collection("orders").aggregate([
        { $match: { deletedByAdmin: { $ne: true }, status: { $ne: "rejected" } } },
        { $group: { _id: null, total: { $sum: "$total" } } }
      ]).toArray();

      return res.status(200).json({
        success: true,
        orders: formattedOrders,
        stats: {
          totalOrders,
          totalRevenue: totalRevenue[0]?.total || 0,
          byStatus: stats
        }
      });
    }

    // PUT - Update order status
    else if (req.method === "PUT") {
      const { id, status } = req.body;
      
      if (!id || !status) {
        return res.status(400).json({ 
          success: false, 
          message: "Missing id or status" 
        });
      }

      // Validate status
      const validStatuses = ["pending", "accepted", "processing", "delivering", "done", "rejected"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid status" 
        });
      }

      // Get the order first for email notification
      const order = await db.collection("orders").findOne({ 
        _id: new ObjectId(id),
        deletedByAdmin: { $ne: true }
      });

      if (!order) {
        return res.status(404).json({ 
          success: false, 
          message: "Order not found" 
        });
      }

      // Update order status
      const result = await db.collection("orders").updateOne(
        { _id: new ObjectId(id) },
        { 
          $set: { 
            status, 
            updatedAt: new Date() 
          } 
        }
      );

      if (result.modifiedCount === 0) {
        return res.status(500).json({ 
          success: false, 
          message: "Failed to update order" 
        });
      }

      // Send status update email to customer
      try {
        await sendStatusUpdateEmail(order, status);
      } catch (emailErr) {
        console.error("Failed to send status update email:", emailErr);
        // Don't fail the request if email fails
      }

      // If order is rejected or cancelled, restore product stock
      if (status === "rejected") {
        const items = order.items || order.cart || [];
        if (items.length > 0) {
          const bulkOps = items.map(item => ({
            updateOne: {
              filter: { _id: new ObjectId(item.productId || item.id) },
              update: { 
                $inc: { stock: item.quantity || item.qty || 1 },
                $set: { updatedAt: new Date() }
              },
            },
          }));
          
          await db.collection("products").bulkWrite(bulkOps);
        }
      }

      // If order is delivered, send delivery confirmation
      if (status === "done") {
        console.log(`Order ${order.trackingId} marked as delivered`);
      }

      return res.status(200).json({ 
        success: true, 
        message: `Order status updated to ${status}` 
      });
    }

    // DELETE - Soft delete order
    else if (req.method === "DELETE") {
      const { id } = req.query;
      
      if (!id) {
        return res.status(400).json({ 
          success: false, 
          message: "Missing id" 
        });
      }

      // Check if order exists and is not already deleted
      const order = await db.collection("orders").findOne({ 
        _id: new ObjectId(id),
        deletedByAdmin: { $ne: true }
      });

      if (!order) {
        return res.status(404).json({ 
          success: false, 
          message: "Order not found or already deleted" 
        });
      }

      // Soft delete by setting deletedByAdmin flag
      const result = await db.collection("orders").updateOne(
        { _id: new ObjectId(id) },
        { 
          $set: { 
            deletedByAdmin: true, 
            updatedAt: new Date() 
          } 
        }
      );

      if (result.modifiedCount === 0) {
        return res.status(500).json({ 
          success: false, 
          message: "Failed to delete order" 
        });
      }

      // If order was not already cancelled/rejected, restore product stock
      if (order.status !== "rejected" && order.status !== "cancelled") {
        const items = order.items || order.cart || [];
        if (items.length > 0) {
          const bulkOps = items.map(item => ({
            updateOne: {
              filter: { _id: new ObjectId(item.productId || item.id) },
              update: { 
                $inc: { stock: item.quantity || item.qty || 1 },
                $set: { updatedAt: new Date() }
              },
            },
          }));
          
          await db.collection("products").bulkWrite(bulkOps);
        }
      }

      return res.status(200).json({ 
        success: true, 
        message: "Order deleted successfully" 
      });
    }

    // POST - Create new order (admin only, for manual orders)
    else if (req.method === "POST") {
      const orderData = req.body;
      
      // Validation
      if (!orderData.name || !orderData.phone || !orderData.address) {
        return res.status(400).json({ 
          success: false, 
          message: "Missing required fields: name, phone, or address" 
        });
      }

      // Generate tracking ID if not provided
      const generateTrackingId = () => {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 9).toUpperCase();
        return `ADM${timestamp.toString(36).toUpperCase()}${random}`;
      };

      const trackingId = orderData.trackingId || generateTrackingId();
      
      // Prepare order object
      const order = {
        ...orderData,
        trackingId,
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
        createdByAdmin: true,
        items: orderData.items || [],
        cart: orderData.items || [] // For backward compatibility
      };

      // Insert order
      const result = await db.collection("orders").insertOne(order);

      // Update product stock
      const items = orderData.items || [];
      if (items.length > 0) {
        const bulkOps = items.map(item => ({
          updateOne: {
            filter: { _id: new ObjectId(item.productId || item.id) },
            update: { 
              $inc: { stock: -(item.quantity || 1) },
              $set: { updatedAt: new Date() }
            },
          },
        }));
        
        await db.collection("products").bulkWrite(bulkOps);
      }

      return res.status(201).json({
        success: true,
        orderId: result.insertedId,
        trackingId: order.trackingId,
        message: "Order created successfully"
      });
    }

    // Unsupported method
    else {
      return res.status(405).json({ 
        success: false, 
        message: "Method not allowed" 
      });
    }

  } catch (error) {
    console.error("Admin Orders API error:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Internal server error",
      error: error.message 
    });
  } finally {
    if (client) await client.close();
  }
}
