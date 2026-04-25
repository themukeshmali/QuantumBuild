# ⚡ QuantumBuild

> A full-stack e-commerce platform for Gaming PCs and PC Parts — built with Node.js, Express, MongoDB, and Vanilla JavaScript.

![Platform](https://img.shields.io/badge/Platform-Web-blue?style=flat-square)
![Node](https://img.shields.io/badge/Node.js-%3E%3D18.0.0-green?style=flat-square&logo=node.js)
![MongoDB](https://img.shields.io/badge/Database-MongoDB-green?style=flat-square&logo=mongodb)
![License](https://img.shields.io/badge/License-ISC-lightgrey?style=flat-square)
![Deployment](https://img.shields.io/badge/Deploy-Render-purple?style=flat-square&logo=render)

---

## 📸 Overview

QuantumBuild is a premium e-commerce store where users can browse and purchase high-performance **Gaming PCs** and individual **PC Parts**. It includes a full authentication system, Razorpay payment integration, order tracking, wishlist, coupon system, and an admin dashboard.

---

## ✨ Features

### 🛍️ Storefront
- 🖥️ Gaming PC catalog with detailed product pages
- 🔧 PC Parts catalog with category filtering
- 🔍 Product search and sorting
- 🛒 Add to Cart with persistent state
- ❤️ Wishlist (MongoDB-synced)
- ⭐ Product reviews and ratings

### 🔐 Authentication
- Register / Login with JWT
- Password hashing with bcrypt
- Forgot Password with OTP via email
- Reset Password flow

### 💳 Payments
- Razorpay payment gateway integration
- UPI, Card, Net Banking support
- Order confirmation after payment

### 📦 Orders
- Full order lifecycle tracking
- Order status history & audit trail
- Order detail page per purchase

### 🏷️ Discounts
- Coupon / promo code system
- Server-side validation for security

### 🛠️ Admin Dashboard
- Product management (Create / Edit / Delete)
- Order management with status updates
- User management
- Coupon management
- Analytics overview
- CSV export

### 🔒 Security
- Helmet.js HTTP headers
- Rate limiting (express-rate-limit)
- MongoDB sanitization (express-mongo-sanitize)
- XSS protection
- Input validation (express-validator)

---

## 🗂️ Project Structure

```
QuantumBuild/
├── backend/                   # Node.js + Express API
│   ├── config/                # Database connection
│   ├── controllers/           # Route logic
│   ├── data/                  # Seed data
│   ├── middleware/            # Auth, error, validation
│   ├── models/                # Mongoose schemas
│   ├── routes/                # API routes
│   ├── utils/                 # Email, token, cloudinary
│   └── server.js              # Entry point
├── frontend/                  # Vanilla HTML/CSS/JS
│   ├── css/                   # Page stylesheets
│   ├── js/                    # Page scripts
│   ├── assets/images/         # Product images
│   └── index.html             # Home page
├── dashboard/                 # Admin panel
│   ├── css/
│   ├── js/
│   └── dashboard.html
├── render.yaml                # Render deployment config
├── Procfile                   # Process file
└── .gitignore
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | HTML5, CSS3, Vanilla JavaScript |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB Atlas + Mongoose |
| **Authentication** | JWT + bcryptjs |
| **Payments** | Razorpay |
| **Image Storage** | Cloudinary |
| **Email** | Nodemailer (Gmail SMTP) |
| **Deployment** | Render |

---

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.0.0
- MongoDB Atlas account
- Razorpay account (for payments)
- Cloudinary account (for image uploads)

### 1. Clone the Repository

```bash
git clone https://github.com/themukeshmali/QuantumBuild.git
cd QuantumBuild
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Configure Environment Variables

Create a `backend/.env` file:

```env
NODE_ENV=development
PORT=5000

# MongoDB
MONGO_URI=your_mongodb_atlas_uri

# JWT
JWT_SECRET=your_jwt_secret_key

# Email (Gmail SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
EMAIL_FROM=noreply@quantumbuild.com

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Razorpay
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Frontend URL
FRONTEND_URL=http://localhost:5000
```

### 4. Seed the Database (Optional)

```bash
# Import sample data
npm run data:import

# Remove all data
npm run data:destroy
```

### 5. Run the Development Server

```bash
npm run dev
```

API will be running at: `http://localhost:5000`

---

## 📡 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/users/register` | Register new user |
| POST | `/api/users/login` | Login user |
| POST | `/api/users/forgot-password` | Send OTP to email |
| POST | `/api/users/reset-password` | Reset password with OTP |

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | Get all products |
| GET | `/api/products/:id` | Get single product |
| POST | `/api/products` | Create product (Admin) |
| PUT | `/api/products/:id` | Update product (Admin) |
| DELETE | `/api/products/:id` | Delete product (Admin) |

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/orders` | Place new order |
| GET | `/api/orders/myorders` | Get user orders |
| GET | `/api/orders/:id` | Get order by ID |
| PUT | `/api/orders/:id/status` | Update order status (Admin) |

### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payment/create-order` | Create Razorpay order |
| POST | `/api/payment/verify` | Verify payment signature |

### Coupons
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/coupons/validate` | Validate coupon code |
| POST | `/api/coupons` | Create coupon (Admin) |

---

## ☁️ Deployment on Render

This project includes a `render.yaml` for one-click deployment.

1. Push your code to GitHub
2. Go to [render.com](https://render.com) → **New Web Service**
3. Connect your GitHub repository
4. Set the following **Environment Variables** in Render dashboard:

| Variable | Value |
|----------|-------|
| `MONGO_URI` | Your MongoDB Atlas URI |
| `JWT_SECRET` | A long random string |
| `RAZORPAY_KEY_ID` | From Razorpay dashboard |
| `RAZORPAY_KEY_SECRET` | From Razorpay dashboard |
| `CLOUDINARY_CLOUD_NAME` | From Cloudinary dashboard |
| `CLOUDINARY_API_KEY` | From Cloudinary dashboard |
| `CLOUDINARY_API_SECRET` | From Cloudinary dashboard |
| `EMAIL_USER` | Your Gmail address |
| `EMAIL_PASS` | Gmail App Password |
| `FRONTEND_URL` | Your deployed frontend URL |

5. Click **Deploy** — Render will automatically build and start the server.

---

## 🔄 Development Workflow

```bash
# Make your changes, then:
git add .
git commit -m "feat: describe your change"
git push
```

---

## 👤 Author

**Mukesh Mali**
- GitHub: [@themukeshmali](https://github.com/themukeshmali)

---

## 📄 License

This project is licensed under the **ISC License**.

---

<p align="center">Built with ❤️ for the gaming community</p>
