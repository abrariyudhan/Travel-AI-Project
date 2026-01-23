const express = require('express');
const router = express.Router();
const TripController = require('../controllers/TripController');
const authentication = require('../middlewares/authentication');

router.use(authentication);

router.post('/', TripController.createTrip);
router.get('/', TripController.getAllTrip);
router.get('/:id', TripController.getTripById);
// router.get('/:id/export', TripController.exportItinerary); // NEW
router.put('/:id', TripController.editTrip);
router.delete('/:id', TripController.deleteTrip);

module.exports = router;