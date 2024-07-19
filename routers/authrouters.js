// routes/authRoutes.js
const express = require("express");
const authController = require("../controllers/authControllers");

const router = express.Router();

// Route to initiate Google login
router.get("/google", authController.googleAuth);

// Callback route for Google to redirect to after authentication
router.get("/google/callback", authController.googleAuthCallback);

module.exports = router;
