// Mock dependencies first before requiring
jest.mock('../models');
jest.mock('fs', () => {
    const actualFs = jest.requireActual('fs');
    return {
        ...actualFs,
        promises: {
            ...actualFs.promises,
            unlink: jest.fn()
        }
    };
});

// Mock cloudinary helper
jest.mock('../helpers/cloudinary', () => ({
    uploadToCloudinary: jest.fn(),
    deleteFromCloudinary: jest.fn(),
    extractPublicId: jest.fn()
}));

const ProfileController = require('../controllers/ProfileController');
const { Profile } = require('../models');
const fs = require('fs').promises;

describe('ProfileController', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            body: {},
            params: {},
            user: { id: 1 },
            file: null,
            protocol: 'http',
            get: jest.fn().mockReturnValue('localhost:3000')
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();
        jest.clearAllMocks();
        
        // Reset environment variables
        delete process.env.CLOUDINARY_CLOUD_NAME;
        delete process.env.CLOUDINARY_API_KEY;
        delete process.env.CLOUDINARY_API_SECRET;
    });

    describe('getProfile', () => {
        it('should successfully get user profile', async () => {
            const mockProfile = {
                id: 1,
                name: 'John Doe',
                age: 25,
                gender: 'male',
                citizen: 'USA',
                userId: 1
            };

            Profile.findOne.mockResolvedValue(mockProfile);

            await ProfileController.getProfile(req, res, next);

            expect(Profile.findOne).toHaveBeenCalledWith({
                where: { userId: 1 }
            });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockProfile);
        });

        it('should throw NotFound error if profile does not exist', async () => {
            Profile.findOne.mockResolvedValue(null);

            await ProfileController.getProfile(req, res, next);

            expect(next).toHaveBeenCalledWith({
                name: 'NotFound',
                message: 'Profile not found'
            });
        });

        it('should handle database errors', async () => {
            const error = new Error('Database error');
            Profile.findOne.mockRejectedValue(error);

            await ProfileController.getProfile(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe('createProfile', () => {
        it('should successfully create a new profile', async () => {
            const mockProfile = {
                id: 1,
                name: 'John Doe',
                age: 25,
                gender: 'male',
                citizen: 'USA',
                userId: 1
            };

            req.body = {
                name: 'John Doe',
                age: '25',
                gender: 'male',
                citizen: 'USA'
            };

            Profile.findOne.mockResolvedValue(null);
            Profile.create.mockResolvedValue(mockProfile);

            await ProfileController.createProfile(req, res, next);

            expect(Profile.findOne).toHaveBeenCalledWith({
                where: { userId: 1 }
            });
            expect(Profile.create).toHaveBeenCalledWith({
                name: 'John Doe',
                age: 25,
                gender: 'male',
                citizen: 'USA',
                userId: 1
            });
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Profile created successfully',
                profile: mockProfile
            });
        });

        it('should throw error if required fields are missing', async () => {
            req.body = {
                name: 'John Doe',
                age: '25'
                // missing gender and citizen
            };

            await ProfileController.createProfile(req, res, next);

            expect(next).toHaveBeenCalledWith({
                name: 'BadRequest',
                message: 'All fields (name, age, gender, citizen) are required'
            });
        });

        it('should throw error if profile already exists', async () => {
            const existingProfile = {
                id: 1,
                userId: 1
            };

            req.body = {
                name: 'John Doe',
                age: '25',
                gender: 'male',
                citizen: 'USA'
            };

            Profile.findOne.mockResolvedValue(existingProfile);

            await ProfileController.createProfile(req, res, next);

            expect(next).toHaveBeenCalledWith({
                name: 'BadRequest',
                message: 'Profile already exists'
            });
        });
    });

    describe('editById', () => {
        it('should successfully update profile', async () => {
            const mockProfile = {
                id: 1,
                name: 'John Doe',
                age: 25,
                gender: 'male',
                citizen: 'USA',
                userId: 1,
                update: jest.fn().mockResolvedValue(true)
            };

            req.params = { id: '1' };
            req.body = {
                name: 'Jane Doe',
                age: '30'
            };

            Profile.findOne.mockResolvedValue(mockProfile);

            await ProfileController.editById(req, res, next);

            expect(Profile.findOne).toHaveBeenCalledWith({
                where: { id: '1', userId: 1 }
            });
            expect(mockProfile.update).toHaveBeenCalledWith({
                name: 'Jane Doe',
                age: 30,
                gender: 'male',
                citizen: 'USA'
            });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Profile updated successfully',
                profileFound: mockProfile
            });
        });

        it('should throw NotFound error if profile does not exist', async () => {
            req.params = { id: '999' };
            req.body = { name: 'Jane Doe' };

            Profile.findOne.mockResolvedValue(null);

            await ProfileController.editById(req, res, next);

            expect(next).toHaveBeenCalledWith({
                name: 'NotFound',
                message: 'Profile not found'
            });
        });

        it('should keep existing values if not provided in update', async () => {
            const mockProfile = {
                id: 1,
                name: 'John Doe',
                age: 25,
                gender: 'male',
                citizen: 'USA',
                userId: 1,
                update: jest.fn().mockResolvedValue(true)
            };

            req.params = { id: '1' };
            req.body = { name: 'Jane Doe' };

            Profile.findOne.mockResolvedValue(mockProfile);

            await ProfileController.editById(req, res, next);

            expect(mockProfile.update).toHaveBeenCalledWith({
                name: 'Jane Doe',
                age: 25,
                gender: 'male',
                citizen: 'USA'
            });
        });
    });

    describe('editColumnUrl', () => {
        it('should successfully upload profile picture with Cloudinary', async () => {
            const { uploadToCloudinary, deleteFromCloudinary, extractPublicId } = require('../helpers/cloudinary');
            
            // Set Cloudinary environment
            process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
            process.env.CLOUDINARY_API_KEY = 'test-key';
            process.env.CLOUDINARY_API_SECRET = 'test-secret';

            const mockProfile = {
                id: 1,
                userId: 1,
                profilePict: 'old-url',
                update: jest.fn().mockResolvedValue(true)
            };

            req.params = { id: '1' };
            req.file = {
                filename: 'test.jpg',
                mimetype: 'image/jpeg',
                size: 1024,
                path: '/tmp/test.jpg'
            };

            Profile.findOne.mockResolvedValue(mockProfile);
            extractPublicId.mockReturnValue('old-public-id');
            deleteFromCloudinary.mockResolvedValue(true);
            uploadToCloudinary.mockResolvedValue('https://cloudinary.com/new-image.jpg');
            fs.unlink.mockResolvedValue(true);

            await ProfileController.editColumnUrl(req, res, next);

            expect(Profile.findOne).toHaveBeenCalledWith({
                where: { id: '1', userId: 1 }
            });
            expect(deleteFromCloudinary).toHaveBeenCalledWith('old-public-id');
            expect(uploadToCloudinary).toHaveBeenCalledWith('/tmp/test.jpg', 'travel-ai/profiles');
            expect(mockProfile.update).toHaveBeenCalledWith({
                profilePict: 'https://cloudinary.com/new-image.jpg'
            });
            expect(fs.unlink).toHaveBeenCalledWith('/tmp/test.jpg');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Profile picture updated successfully',
                profilePictUrl: 'https://cloudinary.com/new-image.jpg'
            });
        });

        it('should use local storage when Cloudinary is not configured', async () => {
            const mockProfile = {
                id: 1,
                userId: 1,
                profilePict: null,
                update: jest.fn().mockResolvedValue(true)
            };

            req.params = { id: '1' };
            req.file = {
                filename: 'test.jpg',
                mimetype: 'image/jpeg',
                size: 1024,
                path: '/tmp/test.jpg'
            };

            Profile.findOne.mockResolvedValue(mockProfile);

            await ProfileController.editColumnUrl(req, res, next);

            expect(mockProfile.update).toHaveBeenCalledWith({
                profilePict: 'http://localhost:3000/uploads/test.jpg'
            });
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should throw error if no file is uploaded', async () => {
            req.params = { id: '1' };
            req.file = null;

            await ProfileController.editColumnUrl(req, res, next);

            expect(next).toHaveBeenCalledWith({
                name: 'BadRequest',
                message: 'No file uploaded. Please select an image file.'
            });
        });

        it('should throw error if profile is not found', async () => {
            req.params = { id: '999' };
            req.file = {
                filename: 'test.jpg',
                path: '/tmp/test.jpg'
            };

            Profile.findOne.mockResolvedValue(null);
            fs.unlink.mockResolvedValue(true);

            await ProfileController.editColumnUrl(req, res, next);

            expect(fs.unlink).toHaveBeenCalledWith('/tmp/test.jpg');
            expect(next).toHaveBeenCalledWith({
                name: 'NotFound',
                message: 'Profile not found'
            });
        });

        it('should handle Cloudinary upload errors', async () => {
            const { uploadToCloudinary, extractPublicId } = require('../helpers/cloudinary');
            
            process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
            process.env.CLOUDINARY_API_KEY = 'test-key';
            process.env.CLOUDINARY_API_SECRET = 'test-secret';

            const mockProfile = {
                id: 1,
                userId: 1,
                profilePict: null
            };

            req.params = { id: '1' };
            req.file = {
                filename: 'test.jpg',
                path: '/tmp/test.jpg'
            };

            const cloudinaryError = new Error('Upload failed');
            Profile.findOne.mockResolvedValue(mockProfile);
            uploadToCloudinary.mockRejectedValue(cloudinaryError);
            fs.unlink.mockResolvedValue(true);

            await ProfileController.editColumnUrl(req, res, next);

            expect(fs.unlink).toHaveBeenCalledWith('/tmp/test.jpg');
            expect(next).toHaveBeenCalledWith({
                name: 'BadRequest',
                message: 'Cloudinary upload failed: Upload failed'
            });
        });

        it('should clean up temp file on error', async () => {
            req.params = { id: '1' };
            req.file = {
                path: '/tmp/test.jpg'
            };

            const error = new Error('Some error');
            Profile.findOne.mockRejectedValue(error);
            fs.unlink.mockResolvedValue(true);

            await ProfileController.editColumnUrl(req, res, next);

            expect(fs.unlink).toHaveBeenCalledWith('/tmp/test.jpg');
            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe('deleteProfile', () => {
        it('should successfully delete profile without image', async () => {
            const mockProfile = {
                id: 1,
                userId: 1,
                profilePict: null,
                destroy: jest.fn().mockResolvedValue(true)
            };

            req.params = { id: '1' };

            Profile.findOne.mockResolvedValue(mockProfile);

            await ProfileController.deleteProfile(req, res, next);

            expect(Profile.findOne).toHaveBeenCalledWith({
                where: { id: '1', userId: 1 }
            });
            expect(mockProfile.destroy).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Profile deleted successfully'
            });
        });

        it('should delete profile with Cloudinary image', async () => {
            const { deleteFromCloudinary, extractPublicId } = require('../helpers/cloudinary');
            
            process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
            process.env.CLOUDINARY_API_KEY = 'test-key';
            process.env.CLOUDINARY_API_SECRET = 'test-secret';

            const mockProfile = {
                id: 1,
                userId: 1,
                profilePict: 'https://cloudinary.com/image.jpg',
                destroy: jest.fn().mockResolvedValue(true)
            };

            req.params = { id: '1' };

            Profile.findOne.mockResolvedValue(mockProfile);
            extractPublicId.mockReturnValue('image-public-id');
            deleteFromCloudinary.mockResolvedValue(true);

            await ProfileController.deleteProfile(req, res, next);

            expect(extractPublicId).toHaveBeenCalledWith('https://cloudinary.com/image.jpg');
            expect(deleteFromCloudinary).toHaveBeenCalledWith('image-public-id');
            expect(mockProfile.destroy).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should throw error if profile is not found', async () => {
            req.params = { id: '999' };

            Profile.findOne.mockResolvedValue(null);

            await ProfileController.deleteProfile(req, res, next);

            expect(next).toHaveBeenCalledWith({
                name: 'NotFound',
                message: 'Profile not found'
            });
        });

        it('should handle errors during deletion', async () => {
            const mockProfile = {
                id: 1,
                userId: 1,
                destroy: jest.fn().mockRejectedValue(new Error('Delete failed'))
            };

            req.params = { id: '1' };

            Profile.findOne.mockResolvedValue(mockProfile);

            await ProfileController.deleteProfile(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(Error));
        });
    });
});
