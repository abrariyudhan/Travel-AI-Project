const express = require('express')
const router = express.Router()
const UserController = require('../controllers/UserController')
const tripRouter = require('./routes_trip')
const profileRouter = require('./routes_profile')
const authentication = require('../middlewares/authentication');


router.post('/register', UserController.register); 
router.post('/login', UserController.login);

router.use(authentication)

router.use('/profile', profileRouter)
router.use('/trips', tripRouter)

module.exports = router