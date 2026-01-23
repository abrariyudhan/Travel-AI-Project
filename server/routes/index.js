const express = require('express');
const router = express.Router();

const UserController = require('../controllers/UserController');
const profileRouter = require('./routes_profile');
const tripRouter = require('./routes_trip');

// Health check
router.get('/', (req, res) => {
    res.json({ message: 'Server is running' });
});

// Public routes
router.post('/register', UserController.register);
router.post('/login', UserController.login);
router.post('/google-login', UserController.googleLogin); // ✅ Tambahkan ini

// Protected routes
router.use('/profiles', profileRouter);
router.use('/trips', tripRouter);

module.exports = router;