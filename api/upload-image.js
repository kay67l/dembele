const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const router = express.Router();

// Create uploads folder automatically
const uploadDir = path.join(__dirname, "public", "uploads");

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage configuration
const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, uploadDir);
    },
    filename(req, file, cb) {
        const unique =
            Date.now() + "-" + Math.round(Math.random() * 1e9);

        cb(
            null,
            unique + path.extname(file.originalname)
        );
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    },
    fileFilter(req, file, cb) {
        const allowed = /\.(jpg|jpeg|png|gif|webp)$/i;

        if (!allowed.test(file.originalname)) {
            return cb(new Error("Only image files are allowed."));
        }

        cb(null, true);
    }
});

router.post(
    "/api/upload-image",
    upload.single("image"),
    (req, res) => {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No image uploaded."
            });
        }

        res.json({
            success: true,
            imageUrl: `/uploads/${req.file.filename}`
        });
    }
);

module.exports = router;