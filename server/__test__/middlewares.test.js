const authMiddleware = require('../middlewares/authentication');
const errorHandler = require('../middlewares/errorHandler');
const { User } = require('../models');
const { verifyToken } = require('../helpers/jwt');

jest.mock('../models');
jest.mock('../helpers/jwt');

describe('Middlewares Testing', () => {
    let req, res, next;

    beforeEach(() => {
        req = { headers: {} };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
        next = jest.fn();
        jest.clearAllMocks();
    });

    describe('Authentication Middleware', () => {
        it('should call next() if token is valid', async () => {
            req.headers.authorization = 'Bearer validtoken';
            verifyToken.mockReturnValue({ id: 1 });
            User.findByPk.mockResolvedValue({ id: 1, role: 'admin' });

            await authMiddleware(req, res, next);

            expect(req.user).toEqual({ id: 1, role: 'admin' });
            expect(next).toHaveBeenCalled();
        });

        it('should throw Unauthorized if no authorization header', async () => {
            await authMiddleware(req, res, next);
            expect(next).toHaveBeenCalledWith(expect.objectContaining({ name: 'Unauthorized' }));
        });

        it('should throw Unauthorized if token format is invalid', async () => {
            req.headers.authorization = 'InvalidFormat token';
            await authMiddleware(req, res, next);
            expect(next).toHaveBeenCalledWith(expect.objectContaining({ name: 'Unauthorized' }));
        });

        it('should throw Unauthorized if user not found', async () => {
            req.headers.authorization = 'Bearer token';
            verifyToken.mockReturnValue({ id: 99 });
            User.findByPk.mockResolvedValue(null);

            await authMiddleware(req, res, next);
            expect(next).toHaveBeenCalledWith(expect.objectContaining({ name: 'Unauthorized' }));
        });
    });

    describe('Error Handler Middleware', () => {
        it('should handle Unauthorized error', () => {
            const err = { name: 'Unauthorized', message: 'Invalid token' };
            errorHandler(err, req, res, next);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: 'Invalid token' });
        });

        it('should handle JsonWebTokenError', () => {
            const err = { name: 'JsonWebTokenError' };
            errorHandler(err, req, res, next);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: 'Invalid token' });
        });

        it('should handle BadRequest error', () => {
            const err = { name: 'BadRequest', message: 'Bad request message' };
            errorHandler(err, req, res, next);
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should handle NotFound error', () => {
            const err = { name: 'NotFound', message: 'Not found message' };
            errorHandler(err, req, res, next);
            expect(res.status).toHaveBeenCalledWith(404);
        });

        it('should handle SequelizeValidationError', () => {
            const err = { 
                name: 'SequelizeValidationError', 
                errors: [{ message: 'Validation failed' }] 
            };
            errorHandler(err, req, res, next);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Validation failed' });
        });

        it('should handle 500 Internal Server Error', () => {
            const err = { name: 'UnknownError' };
            errorHandler(err, req, res, next);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: 'Internal Server Error' });
        });
    });
});