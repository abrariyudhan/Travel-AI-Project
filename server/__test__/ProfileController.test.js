const ProfileController = require('../controllers/ProfileController');
const { Profile } = require('../models');
const cloudinary = require('cloudinary').v2;

jest.mock('../models');
jest.mock('cloudinary');

describe('ProfileController', () => {
    let req, res, next;

    beforeEach(() => {
        req = { 
            body: {}, 
            user: { id: 1 },
            file: { buffer: Buffer.from('test'), mimetype: 'image/jpeg' },
            params: { id: 1 }
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
        next = jest.fn();
    });

    describe('createProfile', () => {
        it('should upload to cloudinary and create profile', async () => {
            cloudinary.uploader.upload.mockResolvedValue({ secure_url: 'http://image.url' });
            Profile.create.mockResolvedValue({ name: 'John' });

            await ProfileController.createProfile(req, res, next);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(Profile.create).toHaveBeenCalled();
        });

        it('should return 400 if no file uploaded', async () => {
            req.file = null;
            await ProfileController.createProfile(req, res, next);
            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    describe('getProfile', () => {
        it('should return profile data', async () => {
            Profile.findOne.mockResolvedValue({ name: 'John' });
            await ProfileController.getProfile(req, res, next);
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should throw NotFound if profile doesnt exist', async () => {
            Profile.findOne.mockResolvedValue(null);
            await ProfileController.getProfile(req, res, next);
            expect(next).toHaveBeenCalledWith(expect.objectContaining({ name: 'NotFound' }));
        });
    });
});