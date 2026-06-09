const session = require('express-session');
const path = require("path");
const express = require("express");
const dotenv = require("dotenv");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const nodemailer = require("nodemailer");

dotenv.config();

const productsRoutes = require("./routes/products.routes");
const ordersRoutes = require("./routes/orders.routes");
const adminRoutes = require('./routes/admin.routes');

const app = express();
const PORT = process.env.PORT || 3000;

const isProduction = process.env.NODE_ENV === 'production';
const adminPagesPath = path.join(__dirname, 'admin-pages');

const mailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 465,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

app.set("trust proxy", 1);
app.disable("x-powered-by");
if (!process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET не задан в .env');
}

app.use(
  session({
    name: 'secretOfTaste.sid',
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProduction,
      maxAge: 1000 * 60 * 60 * 24,
    },
  }),
);

app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

// app.use(cors());

app.use(express.json({ limit: "50kb" }));
app.use(express.urlencoded({ extended: true, limit: "50kb" }));

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);


app.use("/site", express.static(path.join(__dirname, "site")));

function requireAdminPage(req, res, next) {
  if (req.session && req.session.isAdmin) {
    return next();
  }

  return res.redirect('/admin/login.html');
}

function redirectLoggedAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) {
    return res.redirect('/admin/products.html');
  }

  return next();
}

app.get('/admin', (req, res) => {
  if (req.session && req.session.isAdmin) {
    return res.redirect('/admin/products.html');
  }

  return res.redirect('/admin/login.html');
});

app.get('/admin/login.html', redirectLoggedAdmin, (req, res) => {
  res.sendFile(path.join(adminPagesPath, 'login.html'));
});

app.get('/admin/products.html', requireAdminPage, (req, res) => {
  res.sendFile(path.join(adminPagesPath, 'products.html'));
});

app.get('/admin/product-edit.html', requireAdminPage, (req, res) => {
  res.sendFile(path.join(adminPagesPath, 'product-edit.html'));
});

app.get('/admin/orders.html', requireAdminPage, (req, res) => {
  res.sendFile(path.join(adminPagesPath, 'orders.html'));
});

app.use("/api/products", productsRoutes);
app.use("/api/orders", ordersRoutes);
app.use('/api/admin', adminRoutes);

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/catalog.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "catalog.html"));
});

app.get("/product.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "product.html"));
});

app.get("/product/:slug", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "product.html"));
});

app.get("/cart.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "cart.html"));
});

app.get("/contacts.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "contacts.html"));
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    project: "Тайна вкуса",
  });
});

app.listen(PORT, () => {
  console.log(`Тайна вкуса запущен: http://localhost:${PORT}`);

  if (
    !process.env.SMTP_HOST ||
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASS
  ) {
    console.warn("SMTP не настроен. Проверь .env");
    return;
  }

  mailTransporter.verify((error) => {
    if (error) {
      console.error("SMTP ошибка:", error.message);
      return;
    }

    console.log("SMTP готов к отправке писем");
  });
});
