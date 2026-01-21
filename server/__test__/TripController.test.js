process.env.GEMINI_API_KEY = 'dummy_key_for_testing';
process.env.JWT_SECRET = 'secret_key_for_testing';

// Pastikan urutan require benar
const TripController = require('../controllers/TripController');
const { Trip } = require('../models');

jest.mock('../models');
// ... mock google genai ...

jest.mock('../models');
// Mocking the AI dependency
jest.mock('@google/genai', () => {
    return {
        GoogleGenAI: jest.fn().mockImplementation(() => ({
            getGenerativeModel: jest.fn().mockReturnValue({
                generateContent: jest.fn().mockResolvedValue({
                    response: { text: () => "Mocked Itinerary" }
                })
            })
        }))
    };
});

describe('TripController', () => {
    let req, res, next;

    beforeEach(() => {
        req = { 
            body: { title: 'Bali Trip', country: 'Indonesia', city: 'Bali' },
            user: { id: 1 },
            params: { id: 1 }
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
        next = jest.fn();
    });

    describe('createTrip', () => {
        it('should generate itinerary and save trip', async () => {
            Trip.create.mockResolvedValue({ id: 1, title: 'Bali Trip', itinerary: 'Mocked Itinerary' });

            await TripController.createTrip(req, res, next);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: expect.stringContaining('Success create a trip')
            }));
        });
    });

    describe('deleteTrip', () => {
        it('should delete trip successfully', async () => {
            const mockTrip = { destroy: jest.fn().mockResolvedValue() };
            Trip.findOne.mockResolvedValue(mockTrip);

            await TripController.deleteTrip(req, res, next);

            expect(mockTrip.destroy).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });
});