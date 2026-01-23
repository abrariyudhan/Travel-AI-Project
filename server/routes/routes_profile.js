const express = require('express');
const router = express.Router();
const ProfileController = require('../controllers/ProfileController');
const upload = require('../helpers/upload');

// Get profile
router.get('/', ProfileController.getProfile);

// Create profile
router.post('/', ProfileController.createProfile);

// Update profile
router.put('/:id', ProfileController.editById);

// Upload/Update profile picture
router.patch('/:id/profilePict', upload.single('profilePict'), ProfileController.editColumnUrl);

// Delete profile
router.delete('/:id', ProfileController.deleteProfile);

module.exports = router;