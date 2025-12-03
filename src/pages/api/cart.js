import { MongoClient, ObjectId } from "mongodb";

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

    // GET - Get cart for a user
    if (req.method === "GET") {
      const { email } = req.query;
      
      if (!email) {
        return res.status(400).json({ 
          success: false, 
          message: "Email is required" 
        });
      }

      // Find cart for the user
      let cart = await db.collection("carts").findOne({ email });
      
      if (!cart) {
        // If no cart exists, create an empty one
        cart = { 
          email, 
          items: [], 
          createdAt: new Date(), 
          updatedAt: new Date() 
        };
        await db.collection("carts").insertOne(cart);
      }

      // Enrich cart items with current product data (prices, stock, etc.)
      const enrichedItems = await Promise.all(
        (cart.items || []).map(async (item) => {
          try {
            // Get current product data
            const product = await db.collection("products").findOne({ 
              _id: new ObjectId(item.productId || item.id.split('_')[0]) 
            });

            if (!product) {
              // Product no longer exists, mark for removal
              return { ...item, unavailable: true };
            }

            // Update item with current product data
            return {
              ...item,
              name: product.name,
              price: product.price,
              // Use first image if no specific image stored
              image: item.image || product.images?.[0] || product.image,
              // Update stock information
              stock: product.stock,
              hasColors: product.hasColors,
              // Ensure quantity doesn't exceed stock
              qty: Math.min(item.qty, product.stock || 99)
            };
          } catch (err) {
            console.error("Error enriching cart item:", err);
            return { ...item, unavailable: true };
          }
        })
      );

      // Filter out unavailable items
      const availableItems = enrichedItems.filter(item => !item.unavailable);
      
      // If some items were filtered out, update the cart
      if (availableItems.length !== (cart.items || []).length) {
        await db.collection("carts").updateOne(
          { email },
          { 
            $set: { 
              items: availableItems,
              updatedAt: new Date() 
            } 
          }
        );
      }

      return res.status(200).json({ 
        success: true, 
        cart: availableItems,
        totalItems: availableItems.length,
        totalQuantity: availableItems.reduce((sum, item) => sum + item.qty, 0),
        totalPrice: availableItems.reduce((sum, item) => sum + (item.price * item.qty), 0)
      });
    }

    // POST - Save/update cart for a user
    else if (req.method === "POST") {
      const { email, items } = req.body;
      
      if (!email) {
        return res.status(400).json({ 
          success: false, 
          message: "Email is required" 
        });
      }

      if (!Array.isArray(items)) {
        return res.status(400).json({ 
          success: false, 
          message: "Items must be an array" 
        });
      }

      // Validate and clean items
      const validItems = await Promise.all(
        items.map(async (item) => {
          // Basic validation
          if (!item.id || !item.name || !item.price) {
            return null;
          }

          try {
            // Get current product data
            const product = await db.collection("products").findOne({ 
              _id: new ObjectId(item.productId || item.id.split('_')[0]) 
            });

            if (!product) {
              return null; // Skip items with invalid product IDs
            }

            // Ensure quantity doesn't exceed stock
            const maxQty = product.stock || 99;
            const qty = Math.min(item.qty || 1, maxQty);

            return {
              id: item.id, // Unique ID (productId_color)
              productId: item.productId || item.id.split('_')[0],
              name: item.name,
              price: item.price,
              image: item.image || product.images?.[0] || product.image,
              qty: qty,
              selectedColor: item.selectedColor,
              colorName: item.colorName,
              stock: product.stock,
              hasColors: product.hasColors,
              addedAt: item.addedAt || new Date()
            };
          } catch (err) {
            console.error("Error validating cart item:", err);
            return null;
          }
        })
      );

      // Filter out null items
      const filteredItems = validItems.filter(item => item !== null);

      // Update or create cart
      const result = await db.collection("carts").updateOne(
        { email },
        { 
          $set: { 
            email, 
            items: filteredItems,
            updatedAt: new Date() 
          },
          $setOnInsert: {
            createdAt: new Date()
          }
        },
        { upsert: true }
      );

      return res.status(200).json({ 
        success: true, 
        message: "Cart saved",
        cartSize: filteredItems.length,
        totalQuantity: filteredItems.reduce((sum, item) => sum + item.qty, 0)
      });
    }

    // DELETE - Clear or partially delete cart
    else if (req.method === "DELETE") {
      const { email, itemId } = req.query;
      
      if (!email) {
        return res.status(400).json({ 
          success: false, 
          message: "Email is required" 
        });
      }

      // Find the cart
      const cart = await db.collection("carts").findOne({ email });
      
      if (!cart) {
        return res.status(404).json({ 
          success: false, 
          message: "Cart not found" 
        });
      }

      let updateOperation;
      
      if (itemId) {
        // Remove specific item from cart
        const updatedItems = (cart.items || []).filter(item => item.id !== itemId);
        updateOperation = {
          $set: { 
            items: updatedItems,
            updatedAt: new Date() 
          }
        };
      } else {
        // Clear entire cart
        updateOperation = {
          $set: { 
            items: [],
            updatedAt: new Date() 
          }
        };
      }

      const result = await db.collection("carts").updateOne(
        { email },
        updateOperation
      );

      if (result.modifiedCount === 0) {
        return res.status(404).json({ 
          success: false, 
          message: "Cart not found or no changes made" 
        });
      }

      return res.status(200).json({ 
        success: true, 
        message: itemId ? "Item removed from cart" : "Cart cleared"
      });
    }

    // PUT - Update cart item quantity
    else if (req.method === "PUT") {
      const { email, itemId, quantity } = req.body;
      
      if (!email || !itemId || quantity === undefined) {
        return res.status(400).json({ 
          success: false, 
          message: "Email, itemId, and quantity are required" 
        });
      }

      if (quantity < 1) {
        return res.status(400).json({ 
          success: false, 
          message: "Quantity must be at least 1" 
        });
      }

      // Find the cart
      const cart = await db.collection("carts").findOne({ email });
      
      if (!cart) {
        return res.status(404).json({ 
          success: false, 
          message: "Cart not found" 
        });
      }

      // Find the item
      const itemIndex = (cart.items || []).findIndex(item => item.id === itemId);
      
      if (itemIndex === -1) {
        return res.status(404).json({ 
          success: false, 
          message: "Item not found in cart" 
        });
      }

      // Check product stock
      const item = cart.items[itemIndex];
      const product = await db.collection("products").findOne({ 
        _id: new ObjectId(item.productId || item.id.split('_')[0]) 
      });

      if (!product) {
        return res.status(404).json({ 
          success: false, 
          message: "Product not found" 
        });
      }

      // Ensure quantity doesn't exceed stock
      const maxQty = product.stock || 99;
      const newQty = Math.min(quantity, maxQty);

      if (newQty < quantity) {
        return res.status(400).json({ 
          success: false, 
          message: `Maximum available quantity is ${maxQty}` 
        });
      }

      // Update the item quantity
      const updatedItems = [...cart.items];
      updatedItems[itemIndex] = {
        ...updatedItems[itemIndex],
        qty: newQty
      };

      const result = await db.collection("carts").updateOne(
        { email },
        { 
          $set: { 
            items: updatedItems,
            updatedAt: new Date() 
          }
        }
      );

      if (result.modifiedCount === 0) {
        return res.status(500).json({ 
          success: false, 
          message: "Failed to update cart" 
        });
      }

      return res.status(200).json({ 
        success: true, 
        message: "Quantity updated",
        quantity: newQty
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
    console.error("Cart API error:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Internal server error",
      error: error.message 
    });
  } finally {
    if (client) await client.close();
  }
}