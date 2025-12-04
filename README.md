# 🛍️ E-commerce Website - JK Mega Mart

A modern, full-featured e-commerce platform built with Next.js, featuring user authentication, product management, shopping cart, admin dashboard, and email notifications.


## 🚀 Live Demo

🔗 Live Site URL  
🔗 Admin Panel


# ✨ Features

## 👤 User Features

- User Authentication – Secure login/registration with NextAuth.js
- Product Browsing – Filter/search by category, price, ratings
- Product Details – Detailed product pages with images & descriptions
- Shopping Cart – Add/remove items, update quantity
- Checkout System – Place orders, manage address
- Order Tracking – View order status & order history
- Product Reviews – Add reviews with images
- Wishlist – Save items for later
- Email Notifications – Order confirmation + status updates


## 👑 Admin Features

- Admin Dashboard – Full management interface
- Product Management – Add/edit/delete with multiple images
- Order Management – Update order status (Pending → Delivered)
- Inventory Management – Track stock levels
- Customer Orders – View all customers and orders
- Email Automation – Automatic emails for orders & status updates


## 🛠️ Technical Features

- Responsive UI – Tailwind CSS
- Next.js SSR – Lightning fast
- MongoDB Atlas – Cloud database
- Cloudinary – Image storage
- Nodemailer – Email notifications
- React Context API – Cart & user state
- Form Validation – Client-side protection
- Security – Protected routes, JWT, sanitization


## 📁 Project Structure
```bash
src/
├── components/          # Reusable UI components
├── context/             # Cart & User Context
├── lib/                 # DB config & utilities
├── pages/               # Next.js pages
│   ├── api/             # API routes
│   │   ├── auth/        # Auth endpoints
│   │   ├── products/    # Product CRUD
│   │   ├── orders/      # Order API
│   │   └── admin/       # Admin endpoints
│   ├── products/        # Product pages
│   ├── cart/            # Shopping cart
│   ├── checkout/        # Checkout
│   ├── admin/           # Admin Dashboard
│   └── admin-login/     # Admin Login
├── public/              # Static assets
└── styles/              # Global CSS
```

## 🛒 Product Features

- Multiple product images
- Color variations
- Real-time stock management
- Price filtering
- Category & rating filters
- Search by name / description / category


## 📧 Email Notifications

### Automatically Sent Emails

- Order Confirmation
- Order Status Updates
- Admin New Order Alerts

### Email Features

- Custom HTML templates
- Fast delivery with Nodemailer
- Supports Gmail / SendGrid / SMTP
- Email retry system


## 🎨 Design & UI

- Clean modern interface
- Optional dark mode
- Skeleton loaders
- Toast notifications
- Product hover effects
- Image zoom & gallery


## 🔒 Security

- JWT Authentication
- Bcrypt password hashing
- Protected admin routes
- XSS-safe input validation
- CORS restrictions
- API rate limiting


# 🚀 Getting Started

## Prerequisites

- Node.js 16+
- MongoDB Atlas
- Cloudinary
- Gmail/SMTP credentials
- Git


## Installation

1. Clone the repo
   ```bash
     git clone https://github.com/yourusername/e-commerce-website.git
     cd e-commerce-website
2. Install dependencies
   ```bash
     npm install

   
## Environment Setup
  Create .env.local:
  ```bash
    MONGODB_URI=your_mongodb_connection_string
    NEXTAUTH_URL=http://localhost:3000
    NEXTAUTH_SECRET=your_nextauth_secret
    
    # Cloudinary
    CLOUDINARY_CLOUD_NAME=your_cloudinary_name
    CLOUDINARY_API_KEY=your_cloudinary_key
    CLOUDINARY_API_SECRET=your_cloudinary_secret
    
    # Email Config (Gmail Example)
    EMAIL_SERVER=smtp.gmail.com
    EMAIL_PORT=587
    EMAIL_USER=your-email@gmail.com
    EMAIL_PASSWORD=your-app-password
    EMAIL_FROM=noreply@jkmegamart.com
  ```

## Run Development Server
  ```bash
    npm run dev
  ```
  Visit: http://localhost:3000
  

## 📦 Build for Production
  ```bash
    npm run build
    npm start
  ```

## 🧪 Testing
  ```bash
    npm test
  ```

## 🌐 Deployment

  Supported platforms:
  - Vercel (Recommended)
  - Netlify
  - AWS Amplify
  - Heroku


## Deploying on Vercel:

- Push code to GitHub
- Import repo in Vercel
- Add all environment variables
- Deploy 🚀


# 📊 Database Schema

## Products Collection
  ```bash
    {
      _id: ObjectId,
      name: String,
      price: Number,
      stock: Number,
      desc: String,
      category: String,
      images: [String],
      features: [String],
      hasColors: Boolean,
      colors: [String],
      averageRating: Number,
      reviewCount: Number,
      createdAt: Date,
      updatedAt: Date
    }
```

## Orders Collection
  ```bash
      {
      _id: ObjectId,
      userId: String,
      name: String,
      phone: String,
      address: Object,
      cart: [Object],
      total: Number,
      status: String,
      createdAt: Date
    }
```

## Reviews Collection
  ```bash
    {
    _id: ObjectId,
    productId: String,
    userId: String,
    userName: String,
    rating: Number,
    comment: String,
    images: [String],
    createdAt: Date
  }
```


# 🔧 API Endpoints

## Public Endpoints

- GET /api/products
- GET /api/products/[id]
- GET /api/products/[id]/reviews

## Protected Endpoints

- POST /api/cart/add
- POST /api/checkout (sends email)
- POST /api/products/[id]/reviews

## Admin Endpoints

- POST /api/admin/add-product
- PUT /api/admin/edit-product
- DELETE /api/admin/delete-product
- GET /api/admin/orders
- PUT /api/admin/orders (sends email)
- POST /api/admin/send-email

## Email Endpoints

- POST /api/email/order-confirmation
- POST /api/email/status-update
- POST /api/email/admin-notification


# 🎯 Future Enhancements

- Stripe/Razorpay payments
- SMS notifications
- Advanced analytics dashboard
- Multi-language support
- PWA support
- Social login
- CSV bulk upload
- Abandoned cart recovery emails


# 🤝 Contributing
  ```bash
    Fork → Create Branch → Commit → Push → Pull Request
```


# 📝 License

Licensed under the MIT License.


# 👥 Author

Pankaj Sharma – @pankajsharma0001


# 🙏 Acknowledgments

- Next.js
- Tailwind CSS
- MongoDB
- NextAuth.js
- Cloudinary
- Nodemailer


# 📞 Support

- 📧 Email: pankajsharma001@gmail.com
- 🐛 Create an issue in the GitHub repo


# ⭐ If you like this project, give it a star!


# 📊 Project Status

- Version: 1.1.0
- Last Updated: December 2024
- Active Development: Yes
- Production Ready: Yes


# 🗺️ Roadmap

✔ E-commerce core  
✔ Admin dashboard  
✔ Authentication  
✔ Reviews  
✔ Email notifications  
🚧 Payment integration  
🚧 Analytics  
🚧 SMS notifications  

