// WAJIB: Set env di baris paling atas
process.env.GEMINI_API_KEY = 'dummy_key';
process.env.JWT_SECRET = 'secret_key_testing';

const request = require('supertest');
const express = require('express');
const router = require('../routes/index');
const errorHandler = require('../middlewares/errorHandler');
const { User, Profile, Trip } = require('../models');
const { signToken } = require('../helpers/jwt');
const cloudinary = require('cloudinary').v2;

// 1. Mocking External Services & Models
jest.mock('../models'); // Mock semua model
jest.mock('cloudinary');
jest.mock('@google/genai', () => ({
    GoogleGenAI: jest.fn().mockImplementation(() => ({
        getGenerativeModel: jest.fn().mockReturnValue({
            generateContent: jest.fn().mockResolvedValue({
                response: { text: () => "Mocked Gemini Content" }
            })
        })
    }))
}));

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/', router);
app.use(errorHandler);

describe('Integration Testing - Full Flow', () => {
    let access_token;
    const mockUser = { id: 1, email: 'test@mail.com', role: 'User' };

    beforeAll(() => {
        // Token dibuat menggunakan secret yang sama dengan process.env di atas
        access_token = signToken({ id: mockUser.id, role: mockUser.role });
    });

    beforeEach(() => {
        jest.clearAllMocks();
        // 2. SOLUSI ERROR 401: Mock findByPk agar middleware authentication berhasil
        User.findByPk = jest.fn().mockResolvedValue(mockUser);
    });

    describe('User & Auth Flow', () => {
        it('POST /register - success', async () => {
            User.create = jest.fn().mockResolvedValue({ email: 'new@mail.com' });
            const res = await request(app)
                .post('/register')
                .send({ email: 'new@mail.com', password: 'password123' });

            expect(res.status).toBe(201);
        });

        it('POST /login - error (missing email)', async () => {
            const res = await request(app).post('/login').send({ password: '123' });
            expect(res.status).toBe(400);
        });
    });

    describe('Profile Flow', () => {
        it('POST /profile/profiles - success', async () => {
            cloudinary.uploader.upload.mockResolvedValue({ secure_url: 'http://image.com' });
            Profile.create = jest.fn().mockResolvedValue({ name: 'Test User' });

            const res = await request(app)
                .post('/profile/profiles')
                .set('Authorization', `Bearer ${access_token}`)
                .attach('profilePic', Buffer.from('fake-image'), 'test.jpg'); 

            expect(res.status).toBe(201);
        });

        it('PATCH /profile/:id/profilePic - success', async () => {
            Profile.findByPk = jest.fn().mockResolvedValue({ 
                update: jest.fn().mockResolvedValue(true) 
            });
            cloudinary.uploader.upload.mockResolvedValue({ secure_url: 'http://new-image.com' });

            const res = await request(app)
                .patch('/profile/1/profilePic')
                .set('Authorization', `Bearer ${access_token}`)
                .attach('profilePic', Buffer.from('new-image'), 'new.jpg');

            expect(res.status).toBe(200);
        });
    });

    describe('Trip Flow', () => {
        it('POST /trips - success', async () => {
            Trip.create = jest.fn().mockResolvedValue({ id: 1, title: 'Bali' });

            const res = await request(app)
                .post('/trips')
                .set('Authorization', `Bearer ${access_token}`)
                .send({
                    title: 'Bali Holiday',
                    country: 'Indonesia',
                    city: 'Denpasar',
                    duration: 3,
                    budgetLevel: 'medium'
                });

            expect(res.status).toBe(201);
        });
    });
});