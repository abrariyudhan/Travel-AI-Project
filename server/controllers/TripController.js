const { Trip } = require('../models')
const { GoogleGenAI } = require("@google/genai");

// Inisialisasi Gemini AI
const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set in environment variables");
}

module.exports = class TripController {

    static async generateItinerary(country, city, duration, budgetLevel, departureDate) {
        try {
            const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });

            const prompt = `Create a detailed ${duration}-day travel itinerary for ${city}, ${country} with a ${budgetLevel} budget level. 
            The trip starts on ${departureDate}.
            
            Please provide:
            1. Daily activities and attractions
            2. Recommended restaurants for each meal
            3. Estimated budget for each day
            4. Transportation tips
            5. Important travel tips
            
            Format the response in a clear, structured way with day-by-day breakdown.`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const itinerary = response.text();
            
            return itinerary;
        } catch (error) {
            console.log("Error generating itinerary:", error);
            throw error;
        }
    }

    static async createTrip(req, res, next) {
        try {
            const { title, country, city, duration, budgetLevel, departureDate, status } = req.body

            // Generate itinerary menggunakan Gemini AI
            const itinerary = await TripController.generateItinerary(
                country, 
                city, 
                duration, 
                budgetLevel,
                departureDate
            );

            const trip = await Trip.create({
                title,
                country,
                city,
                duration,
                budgetLevel,
                departureDate,
                itinerary,
                status,
                userId: req.user.id
            })

            res.status(201).json({
                message: `Success create a trip ${trip.title}`,
                trip: {
                    id: trip.id,
                    title: trip.title,
                    country: trip.country,
                    city: trip.city,
                    duration: trip.duration,
                    budgetLevel: trip.budgetLevel,
                    departureDate: trip.departureDate,
                    itinerary: trip.itinerary,
                    status: trip.status
                }
            })
        } catch (error) {
            console.log(error);
            next(error)

        }
    }

    static async getAllTrip(req, res, next) {
        try {
            const trips = await Trip.findAll({
                where: {
                    userId: req.user.id
                },
                order: [['createdAt', 'DESC']]
            })

            if (!trips) {
                throw { name: "NotFound", message: "No trips found" }
            }
            res.status(200).json(trips)
        } catch (error) {
            console.log(error);
            next(error)

        }
    }

    static async getTripById(req, res, next) {
        try {
            const { id } = req.params
            const trip = await Trip.findOne({
                where: {
                    id: id,
                    userId: req.user.id
                }
            })

            if (!trip) {
                throw { name: "NotFound", message: `Trip with id ${id} not found` }
            }

            res.status(200).json(trip)
        } catch (error) {
            console.log(error);
            next(error)

        }
    }

    static async editTrip(req, res, next) {
        try {
            const { id } = req.params
            const tripFound = await Trip.findOne({
                where: {
                    id: id,
                    userId: req.user.id
                }
            })

            if (!tripFound) {
                throw { name: "NotFound", message: `Trip not found` }
            }

            const { title, country, city, duration, budgetLevel, departureDate, itinerary, status } = req.body

            await tripFound.update({
                title, 
                country, 
                city, 
                duration, 
                budgetLevel, 
                departureDate, 
                itinerary, 
                status, 
                userId: req.user.id
            })

            res.status(200).json({ message: `Success update trip` })
        } catch (error) {
            console.log(error);
            next(error)

        }
    }

    static async deleteTrip(req, res, next) {
        try {

            const { id } = req.params
            const tripFound = await Trip.findOne({
                where: {
                    id: id,
                    userId: req.user.id
                }
            })

            if (!tripFound) {
                throw { name: "NotFound", message: `Trip with id ${id} not found` }
            }

            await tripFound.destroy()
            res.status(200).json({ message: "Delete trip success" })

        } catch (error) {
            console.log(error);
            next(error)

        }
    }
}