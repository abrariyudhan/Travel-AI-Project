// Set required environment variable
process.env.GEMINI_API_KEY = 'test-api-key';

// Mock dependencies
jest.mock('../models');

// Mock GoogleGenerativeAI before requiring the controller
const mockGenerateContent = jest.fn();
const mockGetGenerativeModel = jest.fn(() => {
    return { generateContent: mockGenerateContent };
});

jest.mock("@google/generative-ai", () => {
    return {
        GoogleGenerativeAI: jest.fn().mockImplementation(() => {
            return { getGenerativeModel: mockGetGenerativeModel };
        })
    };
});

const TripController = require('../controllers/TripController');
const { Trip } = require('../models');

describe('TripController', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            body: {},
            params: {},
            user: { id: 1 }
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();

        jest.clearAllMocks();
    });

    describe('generateItinerary', () => {
        it('should successfully generate itinerary with Gemini AI', async () => {
            const mockAIResponse = {
                response: {
                    text: () => '# 5-Day Trip to Paris\n\nDay 1: Eiffel Tower...'
                }
            };

            mockGenerateContent.mockResolvedValue(mockAIResponse);

            const result = await TripController.generateItinerary(
                'France',
                'Paris',
                5,
                'medium',
                '2026-06-01'
            );

            expect(mockGenerateContent).toHaveBeenCalledWith(
                expect.stringContaining('Create a detailed 5-day travel itinerary for Paris, France')
            );
            expect(result).toBe('# 5-Day Trip to Paris\n\nDay 1: Eiffel Tower...');
        });

        it('should return fallback itinerary if AI fails', async () => {
            mockGenerateContent.mockRejectedValue(new Error('AI service unavailable'));

            const result = await TripController.generateItinerary(
                'France',
                'Paris',
                5,
                'medium',
                '2026-06-01'
            );

            expect(result).toContain('AI-generated itinerary will be available soon');
            expect(result).toContain('Paris, France');
        });
    });

    describe('createTrip', () => {
        it('should successfully create a trip with AI-generated itinerary', async () => {
            const mockAIResponse = {
                response: {
                    text: () => '# 5-Day Trip to Paris\n\nDetailed itinerary...'
                }
            };

            const mockTrip = {
                id: 1,
                title: 'Paris Adventure',
                country: 'France',
                city: 'Paris',
                duration: 5,
                budgetLevel: 'medium',
                departureDate: '2026-06-01',
                itinerary: '# 5-Day Trip to Paris\n\nDetailed itinerary...',
                status: 'draft',
                userId: 1
            };

            req.body = {
                title: 'Paris Adventure',
                country: 'France',
                city: 'Paris',
                duration: '5',
                budgetLevel: 'medium',
                departureDate: '2026-06-01'
            };

            mockGenerateContent.mockResolvedValue(mockAIResponse);
            Trip.create.mockResolvedValue(mockTrip);

            await TripController.createTrip(req, res, next);

            expect(Trip.create).toHaveBeenCalledWith({
                title: 'Paris Adventure',
                country: 'France',
                city: 'Paris',
                duration: 5,
                budgetLevel: 'medium',
                departureDate: '2026-06-01',
                itinerary: expect.any(String),
                status: 'draft',
                userId: 1
            });
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Success create a trip: Paris Adventure',
                trip: mockTrip
            });
        });

        it('should create trip with custom status', async () => {
            const mockAIResponse = {
                response: {
                    text: () => 'Itinerary...'
                }
            };

            const mockTrip = {
                id: 1,
                status: 'published',
                userId: 1
            };

            req.body = {
                title: 'Trip',
                country: 'France',
                city: 'Paris',
                duration: '3',
                budgetLevel: 'low',
                departureDate: '2026-07-01',
                status: 'published'
            };

            mockGenerateContent.mockResolvedValue(mockAIResponse);
            Trip.create.mockResolvedValue(mockTrip);

            await TripController.createTrip(req, res, next);

            expect(Trip.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    status: 'published'
                })
            );
        });

        it('should throw error if required fields are missing - no title', async () => {
            req.body = {
                country: 'France',
                city: 'Paris',
                duration: '5',
                budgetLevel: 'medium',
                departureDate: '2026-06-01'
            };

            await TripController.createTrip(req, res, next);

            expect(next).toHaveBeenCalledWith({
                name: 'BadRequest',
                message: 'All fields (title, country, city, duration, budgetLevel, departureDate) are required'
            });
        });

        it('should throw error if country is missing', async () => {
            req.body = {
                title: 'Trip',
                city: 'Paris',
                duration: '5',
                budgetLevel: 'medium',
                departureDate: '2026-06-01'
            };

            await TripController.createTrip(req, res, next);

            expect(next).toHaveBeenCalledWith({
                name: 'BadRequest',
                message: 'All fields (title, country, city, duration, budgetLevel, departureDate) are required'
            });
        });

        it('should handle database errors', async () => {
            const mockAIResponse = {
                response: {
                    text: () => 'Itinerary...'
                }
            };

            req.body = {
                title: 'Trip',
                country: 'France',
                city: 'Paris',
                duration: '5',
                budgetLevel: 'medium',
                departureDate: '2026-06-01'
            };

            const dbError = new Error('Database connection failed');
            mockGenerateContent.mockResolvedValue(mockAIResponse);
            Trip.create.mockRejectedValue(dbError);

            await TripController.createTrip(req, res, next);

            expect(next).toHaveBeenCalledWith(dbError);
        });
    });

    describe('getAllTrip', () => {
        it('should successfully get all trips for user', async () => {
            const mockTrips = [
                {
                    id: 1,
                    title: 'Paris Trip',
                    userId: 1
                },
                {
                    id: 2,
                    title: 'London Trip',
                    userId: 1
                }
            ];

            Trip.findAll.mockResolvedValue(mockTrips);

            await TripController.getAllTrip(req, res, next);

            expect(Trip.findAll).toHaveBeenCalledWith({
                where: { userId: 1 },
                order: [['createdAt', 'DESC']]
            });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockTrips);
        });

        it('should return empty array if no trips found', async () => {
            Trip.findAll.mockResolvedValue([]);

            await TripController.getAllTrip(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith([]);
        });

        it('should handle errors', async () => {
            const error = new Error('Database error');
            Trip.findAll.mockRejectedValue(error);

            await TripController.getAllTrip(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe('getTripById', () => {
        it('should successfully get trip by id', async () => {
            const mockTrip = {
                id: 1,
                title: 'Paris Trip',
                userId: 1
            };

            req.params = { id: '1' };

            Trip.findOne.mockResolvedValue(mockTrip);

            await TripController.getTripById(req, res, next);

            expect(Trip.findOne).toHaveBeenCalledWith({
                where: { id: '1', userId: 1 }
            });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockTrip);
        });

        it('should throw NotFound error if trip does not exist', async () => {
            req.params = { id: '999' };

            Trip.findOne.mockResolvedValue(null);

            await TripController.getTripById(req, res, next);

            expect(next).toHaveBeenCalledWith({
                name: 'NotFound',
                message: 'Trip with id 999 not found'
            });
        });

        it('should handle errors', async () => {
            req.params = { id: '1' };

            const error = new Error('Database error');
            Trip.findOne.mockRejectedValue(error);

            await TripController.getTripById(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe('editTrip', () => {
        it('should successfully update trip', async () => {
            const mockTrip = {
                id: 1,
                title: 'Paris Trip',
                country: 'France',
                city: 'Paris',
                duration: 5,
                budgetLevel: 'medium',
                departureDate: '2026-06-01',
                status: 'draft',
                userId: 1,
                update: jest.fn().mockResolvedValue(true)
            };

            req.params = { id: '1' };
            req.body = {
                title: 'Updated Paris Trip',
                duration: '7'
            };

            Trip.findOne.mockResolvedValue(mockTrip);

            await TripController.editTrip(req, res, next);

            expect(Trip.findOne).toHaveBeenCalledWith({
                where: { id: '1', userId: 1 }
            });
            expect(mockTrip.update).toHaveBeenCalledWith({
                title: 'Updated Paris Trip',
                country: 'France',
                city: 'Paris',
                duration: 7,
                budgetLevel: 'medium',
                departureDate: '2026-06-01',
                status: 'draft'
            });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Success update trip',
                trip: mockTrip
            });
        });

        it('should keep existing values if not provided in update', async () => {
            const mockTrip = {
                id: 1,
                title: 'Paris Trip',
                country: 'France',
                city: 'Paris',
                duration: 5,
                budgetLevel: 'medium',
                departureDate: '2026-06-01',
                status: 'draft',
                userId: 1,
                update: jest.fn().mockResolvedValue(true)
            };

            req.params = { id: '1' };
            req.body = {};

            Trip.findOne.mockResolvedValue(mockTrip);

            await TripController.editTrip(req, res, next);

            expect(mockTrip.update).toHaveBeenCalledWith({
                title: 'Paris Trip',
                country: 'France',
                city: 'Paris',
                duration: 5,
                budgetLevel: 'medium',
                departureDate: '2026-06-01',
                status: 'draft'
            });
        });

        it('should throw NotFound error if trip does not exist', async () => {
            req.params = { id: '999' };
            req.body = { title: 'Updated Trip' };

            Trip.findOne.mockResolvedValue(null);

            await TripController.editTrip(req, res, next);

            expect(next).toHaveBeenCalledWith({
                name: 'NotFound',
                message: 'Trip with id 999 not found'
            });
        });

        it('should handle errors', async () => {
            req.params = { id: '1' };
            req.body = { title: 'Updated Trip' };

            const error = new Error('Database error');
            Trip.findOne.mockRejectedValue(error);

            await TripController.editTrip(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe('deleteTrip', () => {
        it('should successfully delete trip', async () => {
            const mockTrip = {
                id: 1,
                title: 'Paris Trip',
                userId: 1,
                destroy: jest.fn().mockResolvedValue(true)
            };

            req.params = { id: '1' };

            Trip.findOne.mockResolvedValue(mockTrip);

            await TripController.deleteTrip(req, res, next);

            expect(Trip.findOne).toHaveBeenCalledWith({
                where: { id: '1', userId: 1 }
            });
            expect(mockTrip.destroy).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Delete trip success'
            });
        });

        it('should throw NotFound error if trip does not exist', async () => {
            req.params = { id: '999' };

            Trip.findOne.mockResolvedValue(null);

            await TripController.deleteTrip(req, res, next);

            expect(next).toHaveBeenCalledWith({
                name: 'NotFound',
                message: 'Trip with id 999 not found'
            });
        });

        it('should handle errors', async () => {
            req.params = { id: '1' };

            const error = new Error('Database error');
            Trip.findOne.mockRejectedValue(error);

            await TripController.deleteTrip(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });
});
