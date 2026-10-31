"use strict";

const express = require("express");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { Readable } = require("stream");
const Listing = require("../models/Listing");

const router = express.Router();

cloudinary.config({
cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
api_key: process.env.CLOUDINARY_API_KEY,
api_secret: process.env.CLOUDINARY_API_SECRET
});

const upload = multer({
storage: multer.memoryStorage(),
limits: {
fileSize: 5 * 1024 * 1024
},
fileFilter: (req, file, cb) => {
const allowed = ["image/jpeg", "image/png", "image/webp"];

    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Only JPG, PNG and WebP images are allowed."));
    }
}

});

function uploadToCloudinary(buffer) {
return new Promise((resolve, reject) => {
const stream = cloudinary.uploader.upload_stream(
{
folder: "usma-marketplace",
resource_type: "image"
},
(error, result) => {
if (error) return reject(error);
resolve(result);
}
);

    Readable.from(buffer).pipe(stream);
});

}

// Submit a new listing
router.post("/", upload.single("image"), async (req, res) => {
try {
const {
title,
price,
category,
description,
sellerName,
contactMethod,
contactDetails
} = req.body;

    let imageUrl = "";

    if (req.file) {
        const result = await uploadToCloudinary(req.file.buffer);
        imageUrl = result.secure_url;
    }

    const listing = await Listing.create({
        title,
        price,
        category,
        description,
        sellerName,
        contactMethod,
        contactDetails,
        imageUrl,
        status: "PENDING"
    });

    res.status(201).json({
        success: true,
        message: "Listing submitted for review.",
        listing
    });

} catch (error) {
    console.error("Listing submission error:", error);

    res.status(400).json({
        success: false,
        message: "Could not submit listing.",
        error: error.message
    });
}

});

// Get approved listings only
router.get("/", async (req, res) => {
try {
const listings = await Listing.find({
status: "APPROVED"
}).sort({ createdAt: -1 });

    res.json({
        success: true,
        count: listings.length,
        listings
    });

} catch (error) {
    console.error("Listings fetch error:", error);

    res.status(500).json({
        success: false,
        message: "Could not load listings."
    });
}

});

module.exports = router;
