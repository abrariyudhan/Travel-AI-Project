const express = require('express')
const router = express.Router()
const TripController = require('../controllers/TripController')

router.get('/', TripController.getAllTrip)
router.get('/:id', TripController.getTripById)
router.post('/', TripController.createTrip)
router.put('/:id', TripController.editTrip)
router.delete('/:id', TripController.deleteTrip)

module.exports = router