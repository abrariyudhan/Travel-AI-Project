const express = require('express');
const router = express.Router();
const ProfileController = require('../controllers/ProfileController')
const upload = require('../helpers/upload')


router.post('/profiles', ProfileController.createProfile)
router.get('/', ProfileController.getProfile); 
router.put('/:id' ,ProfileController.editById)
router.patch('/:id/profilePic', upload.single('profilePic'), ProfileController.editColumnUrl)



module.exports = router