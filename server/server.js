require("dotenv").config();
require("express-async-errors");
const express = require("express");
const app = express();
const path = require("path");
const { logger, logEvents } = require("./middleware/logger");
const errorHandler = require("./middleware/errorHandler");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const corsOptions = require("./config/corsOptions");
const connectDB = require("./config/dbConn");
const mongoose = require("mongoose");
const helmet = require("helmet");
const compression = require("compression");
const PORT = process.env.PORT || 3500;

console.log(process.env.NODE_ENV);

connectDB();

// Security middleware - more flexible for development
if (process.env.NODE_ENV === 'production') {
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'", process.env.FRONTEND_URL || "http://localhost:3000"]
      }
    }
  }));
} else {
  // Basic helmet for development
  app.use(helmet({
    contentSecurityPolicy: false
  }));
}

// Compression middleware
app.use(compression());

app.use(logger);

app.use(cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(cookieParser());

// Serve static files
app.use("/", express.static(path.join(__dirname, "public")));

// API routes
app.use("/", require("./routes/root"));
app.use("/dashboard", require("./routes/dashRoutes"));
app.use("/auth", require("./routes/authRoutes"));
app.use("/users", require("./routes/userRoutes"));
app.use("/posts", require("./routes/postRoutes"));
app.use("/countries", require("./routes/countryRoutes"));
app.use("/floptions", require("./routes/flOptionsRoutes"));
app.use("/categories", require("./routes/categoryRoute"));
app.use("/dependencies", require("./routes/dependenciesRoutes"));
app.use("/reports", require("./routes/reportRoutes"));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Health check endpoint for deployment monitoring
app.get("/health", (req, res) => {
  res.status(200).json({ 
    status: "OK", 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    version: process.env.npm_package_version || "1.0.0"
  });
});

// Serve React app for client-side routing
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
  });
} else {
  app.all("*", (req, res) => {
    res.status(404);
    if (req.accepts("html")) {
      res.sendFile(path.join(__dirname, "views", "404.html"));
    } else if (req.accepts("json")) {
      res.json({ message: "404 Not Found" });
    } else {
      res.type("txt").send("404 Not Found");
    }
  });
}

app.use(errorHandler);

mongoose.connection.once("open", () => {
  console.log("Connected to MongoDB");
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});

mongoose.connection.on("error", (err) => {
  console.log(err);
  logEvents(
    `${err.no}: ${err.code}\t${err.syscall}\t${err.hostname}`,
    "mongoErrLog.log"
  );
});
