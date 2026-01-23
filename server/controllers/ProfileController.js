const { Profile } = require('../models');
const fs = require('fs').promises;

module.exports = class ProfileController {

    static async getProfile(req, res, next) {
        try {
            const profile = await Profile.findOne({
                where: { userId: req.user.id }
            });

            if (!profile) {
                throw { name: "NotFound", message: "Profile not found" };
            }

            res.status(200).json(profile);
        } catch (error) {
            next(error);
        }
    }

    static async createProfile(req, res, next) {
        try {
            const { name, age, gender, citizen } = req.body;

            if (!name || !age || !gender || !citizen) {
                throw { 
                    name: "BadRequest", 
                    message: "All fields (name, age, gender, citizen) are required" 
                };
            }

            const existingProfile = await Profile.findOne({
                where: { userId: req.user.id }
            });

            if (existingProfile) {
                throw { 
                    name: "BadRequest", 
                    message: "Profile already exists" 
                };
            }

            const profile = await Profile.create({
                name,
                age: Number(age),
                gender,
                citizen,
                userId: req.user.id
            });

            res.status(201).json({
                message: "Profile created successfully",
                profile
            });
        } catch (error) {
            next(error);
        }
    }

    static async editById(req, res, next) {
        try {
            const { id } = req.params;
            const { name, age, gender, citizen } = req.body;

            const profileFound = await Profile.findOne({
                where: {
                    id: id,
                    userId: req.user.id
                }
            });

            if (!profileFound) {
                throw { name: "NotFound", message: "Profile not found" };
            }

            await profileFound.update({
                name: name || profileFound.name,
                age: age ? Number(age) : profileFound.age,
                gender: gender || profileFound.gender,
                citizen: citizen || profileFound.citizen
            });

            res.status(200).json({
                message: "Profile updated successfully",
                profileFound
            });
        } catch (error) {
            next(error);
        }
    }

    static async editColumnUrl(req, res, next) {
        console.log('=== UPLOAD START ===');
        console.log('Request params:', req.params);
        console.log('Request user:', req.user);
        console.log('Request file:', req.file);

        try {
            const { id } = req.params;

            // Check if file exists
            if (!req.file) {
                console.error('❌ No file uploaded');
                throw { 
                    name: "BadRequest", 
                    message: "No file uploaded. Please select an image file." 
                };
            }

            console.log('✅ File received:', {
                filename: req.file.filename,
                mimetype: req.file.mimetype,
                size: req.file.size,
                path: req.file.path
            });

            // Find profile
            const profileFound = await Profile.findOne({
                where: {
                    id: id,
                    userId: req.user.id
                }
            });

            if (!profileFound) {
                console.error('❌ Profile not found');
                await fs.unlink(req.file.path).catch(() => {});
                throw { name: "NotFound", message: "Profile not found" };
            }

            console.log('✅ Profile found:', profileFound.id);

            // Check if cloudinary is configured
            const cloudinaryConfigured = 
                process.env.CLOUDINARY_CLOUD_NAME && 
                process.env.CLOUDINARY_API_KEY && 
                process.env.CLOUDINARY_API_SECRET;

            let profilePictUrl;

            if (cloudinaryConfigured) {
                console.log('📤 Uploading to Cloudinary...');
                
                try {
                    const { uploadToCloudinary, deleteFromCloudinary, extractPublicId } = require('../helpers/cloudinary');

                    // Delete old image
                    if (profileFound.profilePict) {
                        console.log('🗑️ Deleting old image:', profileFound.profilePict);
                        const oldPublicId = extractPublicId(profileFound.profilePict);
                        if (oldPublicId) {
                            await deleteFromCloudinary(oldPublicId);
                        }
                    }

                    // Upload new image
                    profilePictUrl = await uploadToCloudinary(
                        req.file.path,
                        'travel-ai/profiles'
                    );
                    
                    console.log('✅ Cloudinary upload success:', profilePictUrl);

                    // Delete temp file
                    await fs.unlink(req.file.path).catch(() => {});

                } catch (cloudinaryError) {
                    console.error('❌ Cloudinary error:', cloudinaryError);
                    await fs.unlink(req.file.path).catch(() => {});
                    throw {
                        name: "BadRequest",
                        message: `Cloudinary upload failed: ${cloudinaryError.message}`
                    };
                }

            } else {
                // Fallback: Use local storage
                console.log('⚠️ Cloudinary not configured, using local storage');
                profilePictUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
                console.log('✅ Local URL:', profilePictUrl);
            }

            // Update profile
            await profileFound.update({
                profilePict: profilePictUrl
            });

            console.log('✅ Profile updated successfully');
            console.log('=== UPLOAD END ===');

            res.status(200).json({
                message: "Profile picture updated successfully",
                profilePictUrl: profilePictUrl
            });

        } catch (error) {
            console.error('❌ Upload error:', error);
            
            // Clean up temp file
            if (req.file?.path) {
                await fs.unlink(req.file.path).catch(() => {});
            }
            
            console.log('=== UPLOAD FAILED ===');
            next(error);
        }
    }

    static async deleteProfile(req, res, next) {
        try {
            const { id } = req.params;

            const profileFound = await Profile.findOne({
                where: {
                    id: id,
                    userId: req.user.id
                }
            });

            if (!profileFound) {
                throw { name: "NotFound", message: "Profile not found" };
            }

            // Delete image if exists
            if (profileFound.profilePict) {
                const cloudinaryConfigured = 
                    process.env.CLOUDINARY_CLOUD_NAME && 
                    process.env.CLOUDINARY_API_KEY && 
                    process.env.CLOUDINARY_API_SECRET;

                if (cloudinaryConfigured) {
                    const { deleteFromCloudinary, extractPublicId } = require('../helpers/cloudinary');
                    const publicId = extractPublicId(profileFound.profilePict);
                    if (publicId) {
                        await deleteFromCloudinary(publicId);
                    }
                }
            }

            await profileFound.destroy();

            res.status(200).json({
                message: "Profile deleted successfully"
            });
        } catch (error) {
            next(error);
        }
    }
}