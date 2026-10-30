"use strict";

const express = require("express");
const Listing = require("../models/Listing");

const router = express.Router();

// Submit a new listing
router.post("/", async (req, res) => {
    try {
        const {
            title,
            price,
            category,
            description,
            sellerName,
            contactMethod,
            contactDetails,
            imageUrl
        } = req.body;

        const listing = await Listing.create({
            title,
            price,
            category,
            description,
            sellerName,
            contactMethod,
            contactDetails,
            imageUrl: imageUrl || "",
            status: "PENDING"
        });

        res.status(201).json({
            success: true,
            message: "Listing submitted for review.",
            listing
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Invalid listing data.",
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
        res.status(500).json({
            success: false,
            message: "Could not load listings."
        });
    }
});

module.exports = router;
