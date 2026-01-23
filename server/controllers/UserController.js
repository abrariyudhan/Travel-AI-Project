require('dotenv').config();
const { User } = require('../models')
const { comparePassword } = require('../helpers/bcrypt')
const { signToken } = require('../helpers/jwt')
const { OAuth2Client } = require('google-auth-library');

module.exports = class UserController {

    static async register(req, res, next) {
        try {
            const { email, password } = req.body
            const user = await User.create({ email, password })
            res.status(201).json({
                message: `Successfully created account with email ${user.email}`
            })
        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async login(req, res, next) {
        try {
            const { email, password } = req.body

            if (!email) {
                throw { name: "BadRequest", message: "Email is required" }
            }

            if (!password) {
                throw { name: "BadRequest", message: "Password is required" }
            }

            const user = await User.findOne({
                where: { email }
            })
            
            if (!user) {
                throw { name: "Unauthorized", message: "Invalid email/password" }
            }

            const isValidPassword = comparePassword(password, user.password)
            if (!isValidPassword) {
                throw { name: "Unauthorized", message: "Invalid email/password" }
            }

            const access_token = signToken({ id: user.id })

            res.status(200).json({ 
                access_token,
                user: {
                    id: user.id,
                    email: user.email
                }
            })
        } catch (error) {
            console.log(error);
            next(error)
        }
    }

    static async googleLogin(req, res, next) {
        try {
            const { token } = req.headers

            if (!token) {
                throw { name: "BadRequest", message: "Token is required" }
            }

            const client = new OAuth2Client();

            const ticket = await client.verifyIdToken({
                idToken: token,
                audience: process.env.GOOGLE_CLIENT_ID
            });

            const gPayload = ticket.getPayload();
            console.log('Google Payload:', gPayload);

            if (!gPayload.email_verified) {
                throw { name: "Unauthorized", message: "Email not verified" }
            }

            const [user, created] = await User.findOrCreate({
                where: {
                    email: gPayload.email
                },
                defaults: {
                    email: gPayload.email,
                    password: "google_password_" + Math.random().toString(36)
                },
                hooks: false // Skip password hashing for Google users
            });

            const access_token = signToken({ 
                id: user.id 
            })

            res.status(200).json({ 
                access_token,
                user: {
                    id: user.id,
                    email: user.email,
                    isNewUser: created
                }
            });
        } catch (err) {
            console.log('Google login error:', err);
            next(err)
        }
    }
}