"use strict";

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const listingsRouter = require("./routes/listings");
const adminRouter = require("./routes/admin");

const app = express();
const PORT = process.env.PORT || 3000;

/* =========================================
   CORS CONFIGURATION
========================================= */

const allowedOrigins = [
    "https://usmahistory37.netlify.app",
    "http://localhost:7700",
    ...(process.env.FRONTEND_URL || "")
        .split(",")
        .map(url => url.trim().replace(/\/$/, ""))
        .filter(Boolean)
];

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        console.log("CORS blocked origin:", origin);
        return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

/* =========================================
   MIDDLEWARE
========================================= */

app.use(express.json({ limit: "1mb" }));

/* =========================================
   MARKETPLACE ROUTES
========================================= */

app.use("/api/listings", listingsRouter);
app.use("/api/admin", adminRouter);

/* =========================================
   HOMEPAGE
========================================= */

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "USMA Marketplace API is running.",
        version: "1.0.0"
    });
});

/* =========================================
   HEALTH CHECK
========================================= */

app.get("/api/health", (req, res) => {
    const connected = mongoose.connection.readyState === 1;

    res.status(connected ? 200 : 503).json({
        success: connected,
        status: connected ? "ONLINE" : "DATABASE_DISCONNECTED",
        database: connected ? "CONNECTED" : "DISCONNECTED",
        service: "USMA Marketplace Backend"
    });
});

/* =========================================
   404 HANDLER
========================================= */

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found."
    });
});

/* =========================================
   ERROR HANDLER
========================================= */

app.use((err, req, res, next) => {
    console.error("Server error:", err.message);

    if (err.message === "Not allowed by CORS") {
        return res.status(403).json({
            success: false,
            message: "Origin not allowed by CORS."
        });
    }

    res.status(500).json({
        success: false,
        message: "Internal server error."
    });
});

/* =========================================
   DATABASE CONNECTION & SERVER START
========================================= */

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
            console.log(
                `USMA Marketplace API running without database on port ${PORT}`
            );
        });
    });
