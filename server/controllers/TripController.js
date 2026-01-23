const { Trip } = require('../models');
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Validasi API Key
if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set in environment variables");
}

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

module.exports = class TripController {

    static async generateItinerary(country, city, duration, budgetLevel, departureDate) {
        try {
            // Get the generative model
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

            const prompt = `Create a detailed ${duration}-day travel itinerary for ${city}, ${country} with a ${budgetLevel} budget level. 
            The trip starts on ${departureDate}.
            
            Please include:
            1. Day-by-day activities and attractions
            2. Estimated budget breakdown (accommodation, food, activities, transportation). Example:
               - Accommodation: $XX
               - Food: $XX  
                - Activities: $XX
                - Transportation: $XX
            3. Transportation tips between locations
            4. Best time to visit each attraction
            5. Local travel tips and cultural recommendations
            
            Format the response in clear, structured Markdown with proper headings and bullet points.`;

            // Generate content
            const result = await model.generateContent(prompt);
            const response = result.response;
            const text = response.text();
            
            return text;

        } catch (error) {
            console.error("Error generating itinerary with Gemini AI:", error);
            
            // Return fallback itinerary if AI fails
            return `# ${duration}-Day Trip to ${city}, ${country}\n\n**Budget Level:** ${budgetLevel}\n**Departure:** ${departureDate}\n\n*AI-generated itinerary will be available soon. Please try again later.*`;
        }
    }

    static async createTrip(req, res, next) {
        try {
            const { title, country, city, duration, budgetLevel, departureDate, status } = req.body;

            // Validate required fields
            if (!title || !country || !city || !duration || !budgetLevel || !departureDate) {
                throw { 
                    name: "BadRequest", 
                    message: "All fields (title, country, city, duration, budgetLevel, departureDate) are required" 
                };
            }

            // Generate AI itinerary
            console.log("Generating itinerary with AI...");
            const itinerary = await TripController.generateItinerary(
                country,
                city,
                duration,
                budgetLevel,
                departureDate
            );
            console.log("Itinerary generated successfully!");

            // Create trip in database
            const trip = await Trip.create({
                title,
                country,
                city,
                duration: Number(duration),
                budgetLevel,
                departureDate,
                itinerary,
                status: status || "draft",
                userId: req.user.id
            });

            res.status(201).json({
                message: `Success create a trip: ${trip.title}`,
                trip
            });
        } catch (error) {
            console.error("Error creating trip:", error);
            next(error);
        }
    }

    static async getAllTrip(req, res, next) {
        try {
            const trips = await Trip.findAll({
                where: {
                    userId: req.user.id
                },
                order: [['createdAt', 'DESC']]
            });

            res.status(200).json(trips);
        } catch (error) {
            console.error("Error fetching trips:", error);
            next(error);
        }
    }

    static async getTripById(req, res, next) {
        try {
            const { id } = req.params;
            
            const trip = await Trip.findOne({
                where: {
                    id: id,
                    userId: req.user.id
                }
            });

            if (!trip) {
                throw { name: "NotFound", message: `Trip with id ${id} not found` };
            }

            res.status(200).json(trip);
        } catch (error) {
            console.error("Error fetching trip:", error);
            next(error);
        }
    }

    static async editTrip(req, res, next) {
        try {
            const { id } = req.params;
            
            const tripFound = await Trip.findOne({
                where: {
                    id: id,
                    userId: req.user.id
                }
            });

            if (!tripFound) {
                throw { name: "NotFound", message: `Trip with id ${id} not found` };
            }

            const { title, country, city, duration, budgetLevel, departureDate, status } = req.body;

            // Update trip
            await tripFound.update({
                title: title || tripFound.title,
                country: country || tripFound.country,
                city: city || tripFound.city,
                duration: duration ? Number(duration) : tripFound.duration,
                budgetLevel: budgetLevel || tripFound.budgetLevel,
                departureDate: departureDate || tripFound.departureDate,
                status: status || tripFound.status
            });

            res.status(200).json({ 
                message: `Success update trip`,
                trip: tripFound
            });
        } catch (error) {
            console.error("Error updating trip:", error);
            next(error);
        }
    }

    static async deleteTrip(req, res, next) {
        try {
            const { id } = req.params;
            
            const tripFound = await Trip.findOne({
                where: {
                    id: id,
                    userId: req.user.id
                }
            });

            if (!tripFound) {
                throw { name: "NotFound", message: `Trip with id ${id} not found` };
            }

            await tripFound.destroy();
            
            res.status(200).json({ 
                message: "Delete trip success" 
            });
        } catch (error) {
            console.error("Error deleting trip:", error);
            next(error);
        }
    }
}