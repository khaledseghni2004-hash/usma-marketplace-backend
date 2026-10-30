"use strict";

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
    origin: process.env.FRONTEND_URL
        ? process.env.FRONTEND_URL.split(",").map(url => url.trim())
        : true
}));

app.use(express.json({ limit: "1mb" }));

// الصفحة الرئيسية
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "USMA Marketplace API is running.",
        version: "1.0.0"
    });
});

// اختبار الخادم واتصال قاعدة البيانات
app.get("/api/health", (req, res) => {
    const connected = mongoose.connection.readyState === 1;

    res.status(connected ? 200 : 503).json({
        success: connected,
        status: connected ? "ONLINE" : "DATABASE_DISCONNECTED",
        database: connected ? "CONNECTED" : "DISCONNECTED",
        service: "USMA Marketplace Backend"
    });
});

// المسارات غير الموجودة
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found."
    });
});

// معالجة الأخطاء
app.use((err, req, res, next) => {
    console.error(err);

    res.status(500).json({
        success: false,
        message: "Internal server error."
    });
});

// الاتصال بقاعدة البيانات
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
