"use strict";

const express = require("express");
const crypto = require("crypto");
const mongoose = require("mongoose");
const Listing = require("../models/Listing");

const router = express.Router();

const TOKEN_DURATION = 8 * 60 * 60 * 1000;

function safeCompare(a, b) {
    const first = Buffer.from(String(a));
    const second = Buffer.from(String(b));

    return first.length === second.length &&
        crypto.timingSafeEqual(first, second);
}

function createToken() {
    const payload = Buffer.from(JSON.stringify({
        role: "admin",
        expires: Date.now() + TOKEN_DURATION
    })).toString("base64url");

    const signature = crypto
        .createHmac("sha256", process.env.ADMIN_TOKEN_SECRET)
        .update(payload)
        .digest("base64url");

    return `${payload}.${signature}`;
}

function requireAdmin(req, res, next) {
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");

    if (!token || !process.env.ADMIN_TOKEN_SECRET) {
        return res.status(401).json({
            success: false,
            message: "Admin authentication required."
        });
    }

    try {
        const [payload, signature] = token.split(".");

        if (!payload || !signature) {
            throw new Error("Invalid token");
        }

        const expected = crypto
            .createHmac("sha256", process.env.ADMIN_TOKEN_SECRET)
            .update(payload)
            .digest("base64url");

        if (!safeCompare(signature, expected)) {
            throw new Error("Invalid signature");
        }

        const data = JSON.parse(
            Buffer.from(payload, "base64url").toString()
        );

        if (data.role !== "admin" || data.expires < Date.now()) {
            throw new Error("Expired token");
        }

        next();

    } catch {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired admin session."
        });
    }
}

// Admin login
router.post("/login", (req, res) => {
    const { password } = req.body;

    if (!process.env.ADMIN_PASSWORD ||
        !process.env.ADMIN_TOKEN_SECRET) {
        return res.status(503).json({
            success: false,
            message: "Admin authentication is not configured."
        });
    }

    if (!password || !safeCompare(password, process.env.ADMIN_PASSWORD)) {
        return res.status(401).json({
            success: false,
            message: "Incorrect password."
        });
    }

    res.json({
        success: true,
        token: createToken(),
        expiresIn: TOKEN_DURATION
    });
});

// Get listings
router.get("/listings", requireAdmin, async (req, res) => {
    try {
        const status = req.query.status || "PENDING";
        const allowed = ["PENDING", "APPROVED", "REJECTED", "ALL"];

        if (!allowed.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status."
            });
        }

        const filter = status === "ALL" ? {} : { status };

        const listings = await Listing.find(filter)
            .sort({ createdAt: -1 });

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

// Approve or reject listing
router.patch("/listings/:id/status", requireAdmin, async (req, res) => {
    try {
        const { status } = req.body;

        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid listing ID."
            });
        }

        if (!["APPROVED", "REJECTED"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid listing status."
            });
        }

        const listing = await Listing.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true, runValidators: true }
        );

        if (!listing) {
            return res.status(404).json({
                success: false,
                message: "Listing not found."
            });
        }

        res.json({
            success: true,
            message: `Listing ${status.toLowerCase()} successfully.`,
            listing
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Could not update listing."
        });
    }
});

// Delete listing
router.delete("/listings/:id", requireAdmin, async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid listing ID."
            });
        }

        const listing = await Listing.findByIdAndDelete(req.params.id);

        if (!listing) {
            return res.status(404).json({
                success: false,
                message: "Listing not found."
            });
        }

        res.json({
            success: true,
            message: "Listing deleted successfully."
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Could not delete listing."
        });
    }
});

module.exports = router;
