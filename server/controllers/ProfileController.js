const { Profile } = require('../models');
const cloudinary = require('cloudinary').v2;

module.exports = class ProfileController {

    static async createProfile(req, res, next) {
        try {
            const { name, age, gender, citizen } = req.body;

            if (!req.file) {
                return res.status(400).json({ message: "Image is required" });
            }

            const base64Image = req.file.buffer.toString('base64');
            const dataURI = `data:${req.file.mimetype};base64,${base64Image}`;

            const uploadResponse = await cloudinary.uploader.upload(dataURI, {
                folder: "p3-garuda",
            });


            const profile = await Profile.create({
                name,
                age,
                gender,
                citizen,
                profilePict: uploadResponse.secure_url,
                userId: req.user.id
            })

            res.status(201).json({
                message: "Success make a profile",
                data: profile
            })
        } catch (error) {
            console.log(error)
            next(error);

        }
    }


    static async getProfile(req, res, next) {
        try {
            const profile = await Profile.findOne({
                where: {
                    userId: req.user.id
                }
            })

            if (!profile) {
                throw { name: "NotFound", message: "Profile not found" }
            }

            res.status(200).json(profile)

        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async editById(req, res, next) {
        try {
            const { id } = req.params
            const profileFound = await Profile.findOne({
                where: {
                    userId: req.user.id
                }
            })

            if (!profileFound) {
                throw { name: "NotFound", message: `Profile with id ${id} not found` }
            }
            const {
                name,
                age,
                gender,
                citizen,
                profilePict
            } = req.body

            await profileFound.update({
                name,
                age,
                gender,
                citizen,
                profilePict,
                userId: req.user.id
            })

            res.status(200).json({ message: "Success update profile", profileFound })
        } catch (error) {
            console.log(error, '<<<<<<<<');
            next(error)
        }
    }

    static async editColumnUrl(req, res, next) {
        try {
            const profileId = +req.params.id;
            const profile = await Profile.findByPk(profileId);
            if (!profile) {
                throw { name: 'NotFound', message: `Profile id ${profileId} not found` };
            }

            console.log(req.file)
            if (!req.file) {
                throw { name: "BadRequest", message: "Profile picture is required" }
            }

            // convert data gambar yg dimemory ke dalam bentuk base64 text, seperti dibawah
            const base64Image = req.file.buffer.toString('base64')
            // console.log(base64Image)
            // data:[<media-type>][;base64],<data>
            const dataURI = `data:${req.file.mimetype};base64,${base64Image}`
            // console.log(dataURI)

            const result = await cloudinary.uploader.upload(dataURI)

            console.log(result, "<<<<");

            await profile.update({
                profilePict: result.secure_url
            });

            res.json({
                "message": `Profile picture has been updated`,
            });
        } catch (error) {
            console.log(error, '<<<<<<<<');
            next(error)
        }
    }

}