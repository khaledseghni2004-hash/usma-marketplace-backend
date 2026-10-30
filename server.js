"use strict";

require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();

const PORT = process.env.PORT || 3000;

// Middleware
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

// اختبار حالة الخادم
app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        status: "ONLINE",
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

// تشغيل الخادم
app.listen(PORT, () => {
    console.log(`USMA Marketplace API running on port ${PORT}`);
});
