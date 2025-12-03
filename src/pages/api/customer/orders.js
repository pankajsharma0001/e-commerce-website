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

    // EMAIL FUNCTION FOR CUSTOMER
    const sendCustomerOrderEmail = async (order) => {
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.log("Email configuration missing, skipping email sending");
        return;
      }

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
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
            <div style="text-align: center; background-color: #10b981; color: white; padding: 20px; border-radius: 10px 10px 0 0;">
              <h1 style="margin: 0; font-size: 28px;">🎉 Order Confirmed!</h1>
              <p style="font-size: 16px; margin-top: 10px;">Thank you for your purchase!</p>
            </div>
            
            <div style="padding: 25px; background-color: #f9fafb;">
              <h2 style="color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Order Summary</h2>
              
              <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <h3 style="color: #1f2937; margin-top: 0;">Tracking Information</h3>
                <div style="background-color: #d1fae5; padding: 15px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
                  <p style="margin: 0; color: #065f46; font-weight: bold; font-size: 18px;">Tracking ID: ${order.trackingId}</p>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                  <div>
                    <p style="margin: 5px 0;"><strong>Order Date:</strong><br>${new Date(order.createdAt).toLocaleDateString()}</p>
                    <p style="margin: 5px 0;"><strong>Payment Method:</strong><br>${order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}</p>
                  </div>
                  <div>
                    <p style="margin: 5px 0;"><strong>Status:</strong><br>Pending</p>
                    <p style="margin: 5px 0;"><strong>Total Amount:</strong><br>Rs. ${order.total?.toLocaleString() || order.total}</p>
                  </div>
                </div>
              </div>
              
              <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <h3 style="color: #1f2937; margin-top: 0;">Delivery Address</h3>
                <p style="margin: 10px 0;"><strong>Name:</strong> ${order.name}</p>
                <p style="margin: 10px 0;"><strong>Phone:</strong> ${order.phone}</p>
                <p style="margin: 10px 0;"><strong>Address:</strong><br>${formatAddress(order.address)}</p>
              </div>
              
              <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <h3 style="color: #1f2937; margin-top: 0;">Order Items</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <thead>
                    <tr style="background-color: #f3f4f6;">
                      <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Item</th>
                      <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Color</th>
                      <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Qty</th>
                      <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Price</th>
                      <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${items.map(item => `
                      <tr style="border-bottom: 1px solid #e5e7eb;">
                        <td style="padding: 12px; vertical-align: top;">
                          <div style="display: flex; align-items: center; gap: 10px;">
                            <img src="${item.image}" alt="${item.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px;">
                            <div>
                              <strong>${item.name}</strong>
                            </div>
                          </div>
                        </td>
                        <td style="padding: 12px; vertical-align: top;">
                          ${item.color ? `<div style="display: flex; align-items: center; gap: 5px;">
                            <div style="width: 15px; height: 15px; border-radius: 50%; background-color: ${getColorHex(item.color)}; border: 1px solid #ccc;"></div>
                            <span>${getColorName(item.color)}</span>
                          </div>` : '-'}
                        </td>
                        <td style="padding: 12px; vertical-align: top;">${item.quantity || item.qty || 1}</td>
                        <td style="padding: 12px; vertical-align: top;">Rs. ${item.price}</td>
                        <td style="padding: 12px; vertical-align: top;">
                          <strong>Rs. ${(item.price * (item.quantity || item.qty || 1)).toLocaleString()}</strong>
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
                
                <div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #e5e7eb;">
                  <div style="display: flex; justify-content: space-between; font-size: 18px;">
                    <span><strong>Subtotal:</strong></span>
                    <span>Rs. ${order.subtotal?.toLocaleString() || order.total}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; font-size: 18px;">
                    <span><strong>Shipping:</strong></span>
                    <span>${order.shippingFee === 0 ? 'FREE' : `Rs. ${order.shippingFee}`}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; font-size: 22px; font-weight: bold; color: #7c3aed; margin-top: 10px;">
                    <span>Total:</span>
                    <span>Rs. ${order.total?.toLocaleString() || order.total}</span>
                  </div>
                </div>
              </div>
              
              ${order.notes ? `
                <div style="background: white; padding: 20px; border-radius: 8px; margin-top: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                  <h3 style="color: #1f2937; margin-top: 0;">Additional Notes</h3>
                  <p style="margin: 0; color: #4b5563;">${order.notes}</p>
                </div>
              ` : ''}
              
              <div style="background-color: #e0f2fe; padding: 20px; border-radius: 8px; margin-top: 25px; text-align: center;">
                <h3 style="color: #0369a1; margin-top: 0;">Next Steps</h3>
                <p style="color: #0c4a6e; margin-bottom: 10px;">✅ Save your Tracking ID: <strong>${order.trackingId}</strong></p>
                <p style="color: #0c4a6e; margin-bottom: 10px;">📞 We'll contact you on ${order.phone} for delivery updates</p>
                <p style="color: #0c4a6e; margin-bottom: 0;">📦 Estimated delivery: 3-5 business days</p>
              </div>
              
              <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280;">
                <p>If you have any questions, please contact our support team.</p>
                <p><strong>Thank you for shopping with us!</strong></p>
                <p>Best regards,<br><strong>MyStore Team</strong></p>
              </div>
            </div>
          </div>
        `;

        await transporter.sendMail({
          from: `"My Store" <${process.env.SMTP_USER}>`,
          to: order.email || process.env.ADMIN_EMAIL, // Fallback to admin email if customer email not provided
          subject: `Order Confirmation - ${order.trackingId}`,
          html: customerMessage,
        });

        console.log("Customer confirmation email sent successfully");
      } catch (emailErr) {
        console.error("Customer email send failed:", emailErr);
        // Don't throw error, just log
      }
    };

    // EMAIL FUNCTION FOR ADMIN
    const sendAdminOrderEmail = async (order) => {
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS || !process.env.ADMIN_EMAIL) {
        console.log("Admin email configuration missing, skipping admin email");
        return;
      }

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
        
        const adminMessage = `
          <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px; background-color: #f8fafc; border-radius: 10px;">
            <div style="background-color: #3b82f6; color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">🛒 New Order Received!</h1>
              <p style="font-size: 16px; margin-top: 10px;">A new order has been placed on the store</p>
            </div>
            
            <div style="padding: 25px;">
              <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h2 style="color: #1f2937; margin-top: 0; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Order Information</h2>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                  <div>
                    <p style="margin: 8px 0;"><strong>Tracking ID:</strong><br><span style="color: #3b82f6; font-weight: bold;">${order.trackingId}</span></p>
                    <p style="margin: 8px 0;"><strong>Order Date:</strong><br>${new Date(order.createdAt).toLocaleString()}</p>
                    <p style="margin: 8px 0;"><strong>Payment Method:</strong><br>${order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}</p>
                  </div>
                  <div>
                    <p style="margin: 8px 0;"><strong>Order Status:</strong><br><span style="color: #f59e0b; font-weight: bold;">${order.status || 'pending'}</span></p>
                    <p style="margin: 8px 0;"><strong>Total Amount:</strong><br><span style="color: #10b981; font-weight: bold;">Rs. ${order.total?.toLocaleString() || order.total}</span></p>
                  </div>
                </div>
              </div>
              
              <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h2 style="color: #1f2937; margin-top: 0; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Customer Information</h2>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                  <div>
                    <p style="margin: 8px 0;"><strong>Name:</strong><br>${order.name}</p>
                    <p style="margin: 8px 0;"><strong>Email:</strong><br>${order.email || 'N/A'}</p>
                    <p style="margin: 8px 0;"><strong>Phone:</strong><br>${order.phone}</p>
                  </div>
                  <div>
                    <p style="margin: 8px 0;"><strong>Delivery Address:</strong><br>${formatAddress(order.address)}</p>
                    ${order.notes ? `<p style="margin: 8px 0;"><strong>Customer Notes:</strong><br>${order.notes}</p>` : ''}
                  </div>
                </div>
              </div>
              
              <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h2 style="color: #1f2937; margin-top: 0; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Order Items</h2>
                
                <table style="width: 100%; border-collapse: collapse;">
                  <thead>
                    <tr style="background-color: #f1f5f9;">
                      <th style="padding: 12px; text-align: left; border-bottom: 2px solid #cbd5e1;">Product</th>
                      <th style="padding: 12px; text-align: left; border-bottom: 2px solid #cbd5e1;">Color</th>
                      <th style="padding: 12px; text-align: left; border-bottom: 2px solid #cbd5e1;">Quantity</th>
                      <th style="padding: 12px; text-align: left; border-bottom: 2px solid #cbd5e1;">Price</th>
                      <th style="padding: 12px; text-align: left; border-bottom: 2px solid #cbd5e1;">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${items.map(item => `
                      <tr style="border-bottom: 1px solid #e2e8f0;">
                        <td style="padding: 12px; vertical-align: top;">
                          <div style="display: flex; align-items: center; gap: 10px;">
                            <img src="${item.image}" alt="${item.name}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px;">
                            <div>
                              <strong>${item.name}</strong><br>
                              <small style="color: #64748b;">ID: ${item.productId || item.id}</small>
                            </div>
                          </div>
                        </td>
                        <td style="padding: 12px; vertical-align: top;">
                          ${item.color ? `<div style="display: flex; align-items: center; gap: 5px;">
                            <div style="width: 12px; height: 12px; border-radius: 50%; background-color: ${getColorHex(item.color)}; border: 1px solid #94a3b8;"></div>
                            <span>${getColorName(item.color)}</span>
                          </div>` : '-'}
                        </td>
                        <td style="padding: 12px; vertical-align: top;">${item.quantity || item.qty || 1}</td>
                        <td style="padding: 12px; vertical-align: top;">Rs. ${item.price}</td>
                        <td style="padding: 12px; vertical-align: top;">
                          <strong>Rs. ${(item.price * (item.quantity || item.qty || 1)).toLocaleString()}</strong>
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
                
                <div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #e2e8f0; text-align: right;">
                  <div style="display: inline-block; text-align: left; background-color: #f8fafc; padding: 15px 25px; border-radius: 8px;">
                    <p style="margin: 8px 0; font-size: 16px;"><strong>Subtotal:</strong> Rs. ${order.subtotal?.toLocaleString() || order.total}</p>
                    <p style="margin: 8px 0; font-size: 16px;"><strong>Shipping:</strong> ${order.shippingFee === 0 ? 'FREE' : `Rs. ${order.shippingFee}`}</p>
                    <p style="margin: 8px 0; font-size: 18px; color: #3b82f6; font-weight: bold;">Total: Rs. ${order.total?.toLocaleString() || order.total}</p>
                  </div>
                </div>
              </div>
              
              <div style="text-align: center; margin-top: 25px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #475569;">
                <p>This order is now available in the admin panel for processing.</p>
                <p><a href="${process.env.SITE_URL || 'http://localhost:3000'}/admin" style="display: inline-block; background-color: #3b82f6; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; font-weight: bold; margin-top: 10px;">View Order in Admin Panel</a></p>
              </div>
            </div>
          </div>
        `;

        await transporter.sendMail({
          from: `"My Store" <${process.env.SMTP_USER}>`,
          to: process.env.ADMIN_EMAIL,
          subject: `[URGENT] New Order - ${order.trackingId} - Rs. ${order.total}`,
          html: adminMessage,
        });

        console.log("Admin notification email sent successfully");
      } catch (emailErr) {
        console.error("Admin email send failed:", emailErr);
        // Don't throw error, just log
      }
    };

    // GET - Get customer orders
    if (req.method === "GET") {
      const { email } = req.query;
      
      if (!email) {
        return res.status(400).json({ 
          success: false, 
          message: "Email parameter is required" 
        });
      }

      // Get customer's orders (excluding deleted ones)
      const orders = await db
        .collection("orders")
        .find({ 
          email: email,
          deleted: { $ne: true } // Exclude soft-deleted orders
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
    }

    // POST - Create new order
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
      const trackingId = orderData.trackingId || generateTrackingId();
      
      // Prepare order object with both old and new structure support
      const order = {
        ...orderData,
        trackingId,
        status: orderData.paymentMethod === "cod" ? "pending" : "processing",
        createdAt: new Date(),
        updatedAt: new Date(),
        // For backward compatibility, keep cart field if items is provided
        cart: orderData.items || orderData.cart || []
      };

      // Insert order
      const result = await db.collection("orders").insertOne(order);

      // Update product stock (support both old and new item structure)
      const items = orderData.items || orderData.cart || [];
      
      if (items.length > 0) {
        const bulkOps = items.map(item => ({
          updateOne: {
            filter: { _id: new ObjectId(item.productId || item.id) },
            update: { 
              $inc: { stock: -(item.quantity || item.qty || 1) },
              $set: { updatedAt: new Date() }
            },
          },
        }));
        
        await db.collection("products").bulkWrite(bulkOps);
      }

      // Send emails (async, don't wait for them)
      try {
        await Promise.all([
          sendCustomerOrderEmail(order),
          sendAdminOrderEmail(order)
        ]);
      } catch (emailErr) {
        console.error("Email sending error (non-blocking):", emailErr);
        // Continue even if email fails
      }

      return res.status(201).json({
        success: true,
        orderId: result.insertedId,
        trackingId: order.trackingId,
        message: "Order placed successfully"
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
    console.error("Customer Orders API error:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Internal server error",
      error: error.message 
    });
  } finally {
    if (client) await client.close();
  }
}

// Helper function to generate tracking ID
function generateTrackingId() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9).toUpperCase();
  return `TRK${timestamp.toString(36).toUpperCase()}${random}`;
}

// Helper function to get color name
function getColorName(colorValue) {
  const colorMap = {
    "red": "Red",
    "blue": "Blue",
    "green": "Green",
    "black": "Black",
    "white": "White",
    "yellow": "Yellow",
    "purple": "Purple",
    "pink": "Pink",
    "gray": "Gray",
    "brown": "Brown"
  };
  return colorMap[colorValue] || colorValue;
}