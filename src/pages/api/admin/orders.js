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

    // EMAIL FUNCTION
    const sendEmail = async (order) => {
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
      // Fetch all non-deleted orders
      const orders = await db
        .collection("orders")
        .find({ deletedByAdmin: { $ne: true } })
        .sort({ createdAt: -1 })
        .toArray();

      return res.status(200).json(orders);
    }

    else if (req.method === "POST") {
      // Create new order
      const order = {
        ...req.body,
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await db.collection("orders").insertOne(order);

      // Send Admin Notification Email
      try {
        await sendEmail(order);
      } catch (emailErr) {
        console.error("Email send failed:", emailErr);
      }

      return res.status(201).json({
        success: true,
        orderId: result.insertedId,
      });
    }

    else if (req.method === "PUT") {
      // Update order status
      const { id, status } = req.body;
      if (!id || !status) {
        return res.status(400).json({ success: false, message: "Missing id or status" });
      }

      // Get the order first to send email when delivered
      const order = await db.collection("orders").findOne({ _id: new ObjectId(id) });

      const result = await db.collection("orders").updateOne(
        { _id: new ObjectId(id) },
        { $set: { status, updatedAt: new Date() } }
      );

      // Send customer delivery confirmation email
      if (result.modifiedCount > 0 && status === "done" && order) {
        try {
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
            <h2>Your Order Has Been Delivered! 🎉</h2>
            <p>Hello <strong>${order.name}</strong>,</p>
            <p>Great news! Your order has been successfully delivered.</p>
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
            <p>Thank you for your purchase! If you have any questions, please don't hesitate to contact us.</p>
            <br/>
            <p>Best regards,<br/><strong>MyStore Team</strong></p>
          `;

          await transporter.sendMail({
            from: `"My Store" <${process.env.SMTP_USER}>`,
            to: order.email,
            subject: `Your Order Delivered - ${order.trackingId}`,
            html: customerMessage,
          });
        } catch (emailErr) {
          console.error("Customer email send failed:", emailErr);
          // Don't return error, as order status was already updated
        }
      }

      if (result.modifiedCount > 0) {
        return res.status(200).json({ success: true, message: "Order updated" });
      }
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    else if (req.method === "DELETE") {
      // Soft delete order
      const { id } = req.query;
      if (!id) {
        return res.status(400).json({ success: false, message: "Missing id" });
      }

      const result = await db.collection("orders").updateOne(
        { _id: new ObjectId(id) },
        { $set: { deletedByAdmin: true, updatedAt: new Date() } }
      );

      if (result.modifiedCount > 0) {
        return res.status(200).json({ success: true, message: "Order removed" });
      }
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    res.status(405).json({ success: false, message: "Method not allowed" });

  } catch (error) {
    console.error("Orders API error:", error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    if (client) client.close();
  }
}
