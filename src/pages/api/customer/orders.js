import { MongoClient, ObjectId } from "mongodb";
import nodemailer from "nodemailer";

export default async function handler(req, res) {
  if (!process.env.MONGODB_URI) {
    return res.status(500).json({ success: false, message: "Server configuration error" });
  }

  let client;

  try {
    client = await MongoClient.connect(process.env.MONGODB_URI);
    const db = client.db("store");

    // EMAIL FUNCTION FOR CUSTOMER
    const sendCustomerOrderEmail = async (order) => {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: true,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const customerMessage = `
        <h2>Order Confirmation 🎉</h2>
        <p>Hello <strong>${order.name}</strong>,</p>
        <p>Thank you for your order! We've received your order and it will be processed shortly.</p>
        <p><strong>Tracking ID:</strong> ${order.trackingId}</p>
        <h3>Order Details:</h3>
        <ul>
          ${order.cart
            .map(
              (item) =>
                `<li>${item.name} — ${item.qty || 1} x Rs.${item.price}</li>`
            )
            .join("")}
        </ul>
        <p><strong>Total Amount:</strong> Rs.${order.total}</p>
        <p><strong>Delivery Address:</strong> ${order.address}</p>
        <p><strong>Status:</strong> Pending</p>
        <p>You can track your order using the Tracking ID above on our website.</p>
        <p>We'll send you updates as your order progresses through each stage.</p>
        <br/>
        <p>Best regards,<br/><strong>MyStore Team</strong></p>
      `;

      await transporter.sendMail({
        from: `"My Store" <${process.env.SMTP_USER}>`,
        to: order.email,
        subject: `Order Confirmation - ${order.trackingId}`,
        html: customerMessage,
      });
    };

    // EMAIL FUNCTION FOR ADMIN
    const sendAdminOrderEmail = async (order) => {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: true,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const adminMessage = `
        <h2>New Order Placed</h2>
        <p><strong>Name:</strong> ${order.name}</p>
        <p><strong>Email:</strong> ${order.email || "N/A"}</p>
        <p><strong>Phone:</strong> ${order.phone}</p>
        <p><strong>Address:</strong> ${order.address}</p>
        <p><strong>Tracking ID:</strong> ${order.trackingId}</p>
        <h3>Items:</h3>
        <ul>
          ${order.cart
            .map(
              (item) =>
                `<li>${item.name} — ${item.qty || 1} x Rs.${item.price}</li>`
            )
            .join("")}
        </ul>
        <p><strong>Total:</strong> Rs.${order.total}</p>
        <p><strong>Date:</strong> ${order.date}</p>
      `;

      await transporter.sendMail({
        from: `"My Store" <${process.env.SMTP_USER}>`,
        to: process.env.ADMIN_EMAIL,
        subject: `New Order Received - ${order.trackingId}`,
        html: adminMessage,
      });
    };

    if (req.method === "GET") {
      // Get all orders (including admin-deleted) for customer history
      const orders = await db
        .collection("orders")
        .find({})
        .sort({ createdAt: -1 })
        .toArray();
      res.status(200).json(orders);
    }

    else if (req.method === "POST") {
      // Create new order and send both customer and admin confirmation emails
      const order = {
        ...req.body,
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await db.collection("orders").insertOne(order);

      // Send Customer Confirmation Email
      try {
        await sendCustomerOrderEmail(order);
      } catch (emailErr) {
        console.error("Customer email send failed:", emailErr);
      }

      // Send Admin Notification Email
      try {
        await sendAdminOrderEmail(order);
      } catch (emailErr) {
        console.error("Admin email send failed:", emailErr);
      }

      return res.status(201).json({
        success: true,
        orderId: result.insertedId,
      });
    }

    client.close();
  } catch (error) {
    console.error("Customer Orders API error:", error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    if (client) client.close();
  }
}
