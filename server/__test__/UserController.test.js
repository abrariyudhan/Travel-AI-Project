const UserController = require('../controllers/UserController');
const { User } = require('../models');
const { signToken } = require('../helpers/jwt');
const { comparePassword } = require('../helpers/bcrypt');

jest.mock('../models');
jest.mock('../helpers/jwt');
jest.mock('../helpers/bcrypt');

describe('UserController', () => {
    let req, res, next;

    beforeEach(() => {
        req = { body: {} };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
        next = jest.fn();
        jest.clearAllMocks();
    });

    describe('register', () => {
        it('should create user and return 201', async () => {
            req.body = { email: 'test@mail.com', password: 'password123' };
            User.create.mockResolvedValue({ email: 'test@mail.com' });

            await UserController.register(req, res, next);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                message: "Successfully created account with email test@mail.com"
            });
        });

        it('should call next on error', async () => {
            User.create.mockRejectedValue(new Error('DB Error'));
            await UserController.register(req, res, next);
            expect(next).toHaveBeenCalled();
        });
    });

    describe('login', () => {
        it('should return access_token on success', async () => {
            req.body = { email: 'test@mail.com', password: 'password123' };
            const mockUser = { id: 1, email: 'test@mail.com', password: 'hashedpassword' };
            
            User.findOne.mockResolvedValue(mockUser);
            comparePassword.mockReturnValue(true);
            signToken.mockReturnValue('mock_token');

            await UserController.login(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ access_token: 'mock_token' });
        });

        it('should throw error if email/password missing', async () => {
            req.body = { email: '' };
            await UserController.login(req, res, next);
            expect(next).toHaveBeenCalledWith(expect.objectContaining({ name: "BadRequest" }));
        });
    });
});