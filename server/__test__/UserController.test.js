const UserController = require('../controllers/UserController');
const { User } = require('../models');
const { comparePassword } = require('../helpers/bcrypt');
const { signToken } = require('../helpers/jwt');
const { OAuth2Client } = require('google-auth-library');

// Mock dependencies
jest.mock('../models');
jest.mock('../helpers/bcrypt');
jest.mock('../helpers/jwt');
jest.mock('google-auth-library');

describe('UserController', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            body: {},
            headers: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();
        jest.clearAllMocks();
    });

    describe('register', () => {
        it('should successfully register a new user', async () => {
            const mockUser = {
                id: 1,
                email: 'test@example.com'
            };

            req.body = {
                email: 'test@example.com',
                password: 'password123'
            };

            User.create.mockResolvedValue(mockUser);

            await UserController.register(req, res, next);

            expect(User.create).toHaveBeenCalledWith({
                email: 'test@example.com',
                password: 'password123'
            });
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Successfully created account with email test@example.com'
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('should handle registration errors', async () => {
            const error = new Error('Database error');
            req.body = {
                email: 'test@example.com',
                password: 'password123'
            };

            User.create.mockRejectedValue(error);

            await UserController.register(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
            expect(res.status).not.toHaveBeenCalled();
        });
    });

    describe('login', () => {
        it('should successfully login with valid credentials', async () => {
            const mockUser = {
                id: 1,
                email: 'test@example.com',
                password: 'hashedPassword'
            };

            req.body = {
                email: 'test@example.com',
                password: 'password123'
            };

            User.findOne.mockResolvedValue(mockUser);
            comparePassword.mockReturnValue(true);
            signToken.mockReturnValue('mock-token');

            await UserController.login(req, res, next);

            expect(User.findOne).toHaveBeenCalledWith({
                where: { email: 'test@example.com' }
            });
            expect(comparePassword).toHaveBeenCalledWith('password123', 'hashedPassword');
            expect(signToken).toHaveBeenCalledWith({ id: 1 });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                access_token: 'mock-token',
                user: {
                    id: 1,
                    email: 'test@example.com'
                }
            });
        });

        it('should throw error if email is not provided', async () => {
            req.body = {
                password: 'password123'
            };

            await UserController.login(req, res, next);

            expect(next).toHaveBeenCalledWith({
                name: 'BadRequest',
                message: 'Email is required'
            });
        });

        it('should throw error if password is not provided', async () => {
            req.body = {
                email: 'test@example.com'
            };

            await UserController.login(req, res, next);

            expect(next).toHaveBeenCalledWith({
                name: 'BadRequest',
                message: 'Password is required'
            });
        });

        it('should throw error if user is not found', async () => {
            req.body = {
                email: 'nonexistent@example.com',
                password: 'password123'
            };

            User.findOne.mockResolvedValue(null);

            await UserController.login(req, res, next);

            expect(next).toHaveBeenCalledWith({
                name: 'Unauthorized',
                message: 'Invalid email/password'
            });
        });

        it('should throw error if password is invalid', async () => {
            const mockUser = {
                id: 1,
                email: 'test@example.com',
                password: 'hashedPassword'
            };

            req.body = {
                email: 'test@example.com',
                password: 'wrongpassword'
            };

            User.findOne.mockResolvedValue(mockUser);
            comparePassword.mockReturnValue(false);

            await UserController.login(req, res, next);

            expect(next).toHaveBeenCalledWith({
                name: 'Unauthorized',
                message: 'Invalid email/password'
            });
        });
    });

    describe('googleLogin', () => {
        let mockClient;

        beforeEach(() => {
            mockClient = {
                verifyIdToken: jest.fn()
            };
            OAuth2Client.mockImplementation(() => mockClient);
        });

        it('should successfully login with valid Google token', async () => {
            const mockGooglePayload = {
                email: 'google@example.com',
                email_verified: true
            };

            const mockUser = {
                id: 1,
                email: 'google@example.com'
            };

            req.headers = {
                token: 'valid-google-token'
            };

            mockClient.verifyIdToken.mockResolvedValue({
                getPayload: () => mockGooglePayload
            });

            User.findOrCreate.mockResolvedValue([mockUser, false]);
            signToken.mockReturnValue('mock-access-token');

            await UserController.googleLogin(req, res, next);

            expect(mockClient.verifyIdToken).toHaveBeenCalledWith({
                idToken: 'valid-google-token',
                audience: process.env.GOOGLE_CLIENT_ID
            });
            expect(User.findOrCreate).toHaveBeenCalledWith({
                where: { email: 'google@example.com' },
                defaults: {
                    email: 'google@example.com',
                    password: expect.stringContaining('google_password_')
                },
                hooks: false
            });
            expect(signToken).toHaveBeenCalledWith({ id: 1 });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                access_token: 'mock-access-token',
                user: {
                    id: 1,
                    email: 'google@example.com',
                    isNewUser: false
                }
            });
        });

        it('should create new user if not exists (findOrCreate returns created=true)', async () => {
            const mockGooglePayload = {
                email: 'newgoogle@example.com',
                email_verified: true
            };

            const mockUser = {
                id: 2,
                email: 'newgoogle@example.com'
            };

            req.headers = {
                token: 'valid-google-token'
            };

            mockClient.verifyIdToken.mockResolvedValue({
                getPayload: () => mockGooglePayload
            });

            User.findOrCreate.mockResolvedValue([mockUser, true]);
            signToken.mockReturnValue('mock-access-token');

            await UserController.googleLogin(req, res, next);

            expect(res.json).toHaveBeenCalledWith({
                access_token: 'mock-access-token',
                user: {
                    id: 2,
                    email: 'newgoogle@example.com',
                    isNewUser: true
                }
            });
        });

        it('should throw error if token is not provided', async () => {
            req.headers = {};

            await UserController.googleLogin(req, res, next);

            expect(next).toHaveBeenCalledWith({
                name: 'BadRequest',
                message: 'Token is required'
            });
        });

        it('should throw error if email is not verified', async () => {
            const mockGooglePayload = {
                email: 'google@example.com',
                email_verified: false
            };

            req.headers = {
                token: 'valid-google-token'
            };

            mockClient.verifyIdToken.mockResolvedValue({
                getPayload: () => mockGooglePayload
            });

            await UserController.googleLogin(req, res, next);

            expect(next).toHaveBeenCalledWith({
                name: 'Unauthorized',
                message: 'Email not verified'
            });
        });

        it('should handle Google verification errors', async () => {
            const error = new Error('Invalid token');

            req.headers = {
                token: 'invalid-token'
            };

            mockClient.verifyIdToken.mockRejectedValue(error);

            await UserController.googleLogin(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });
});
