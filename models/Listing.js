"use strict";

const mongoose = require("mongoose");

const listingSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },

    price: {
        type: Number,
        required: true,
        min: 1
    },

    category: {
        type: String,
        required: true,
        enum: [
            "JERSEYS",
            "ACCESSORIES",
            "COLLECTIBLES",
            "OTHER"
        ]
    },

    description: {
        type: String,
        required: true,
        trim: true,
        maxlength: 2000
    },

    sellerName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 80
    },

    contactMethod: {
        type: String,
        required: true,
        enum: ["WHATSAPP", "PHONE", "FACEBOOK"]
    },

    contactDetails: {
        type: String,
        required: true,
        trim: true,
        maxlength: 150
    },

    imageUrl: {
        type: String,
        default: ""
    },

    status: {
        type: String,
        enum: ["PENDING", "APPROVED", "REJECTED"],
        default: "PENDING"
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Listing", listingSchema);
