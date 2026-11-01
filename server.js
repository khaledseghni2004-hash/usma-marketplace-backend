"use strict";

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const listingsRouter = require("./routes/listings");
const adminRouter = require("./routes/admin");

const app = express();
const PORT = process.env.PORT || 3000;

// CORS
app.use(cors({
origin: process.env.FRONTEND_URL
? process.env.FRONTEND_URL.split(",").map(url => url.trim())
: true
}));

// Middleware
app.use(express.json({ limit: "1mb" }));

// Marketplace routes
app.use("/api/listings", listingsRouter);
app.use("/api/admin", adminRouter);

// Homepage
app.get("/", (req, res) => {
res.json({
success: true,
message: "USMA Marketplace API is running.",
version: "1.0.0"
});
});

// Health check
app.get("/api/health", (req, res) => {
const connected = mongoose.connection.readyState === 1;

res.status(connected ? 200 : 503).json({
    success: connected,
    status: connected ? "ONLINE" : "DATABASE_DISCONNECTED",
    database: connected ? "CONNECTED" : "DISCONNECTED",
    service: "USMA Marketplace Backend"
});

});

// 404
app.use((req, res) => {
res.status(404).json({
success: false,
message: "Route not found."
});
});

// Error handler
app.use((err, req, res, next) => {
console.error(err);

res.status(500).json({
    success: false,
    message: "Internal server error."
});

});

// Database connection
mongoose.connect(process.env.MONGODB_URI)
.then(() => {
console.log("MongoDB connected successfully.");

    app.listen(PORT, () => {
        console.log(`USMA Marketplace API running on port ${PORT}`);
    });
})
.catch((error) => {
    console.error("MongoDB connection failed:", error.message);

    app.listen(PORT, () => {
        console.log(`USMA Marketplace API running without database on port ${PORT}`);
    });
});
