require('dotenv').config();
const { User } = require('../models')
const { comparePassword } = require('../helpers/bcrypt')
const { signToken } = require('../helpers/jwt')

module.exports = class UserController {

    static async register(req, res, next) {
        try {
            //Ambil data dari req.body
            const { email, password } = req.body
            //Buat user baru
            const user = await User.create({ email, password })
            //kirim response dan data yang tidak sensitif
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
            //1. ambil email, password
            const { email, password } = req.body

            if (!email) {
                throw { name: "BadRequest", message: "Email is required" }
            }

            if (!password) {
                throw { name: "BadRequest", message: "Password is required" }
            }

            // 2. cek apakah emailnya ada?
            const user = await User.findOne({
                where: {
                    email
                }
            })
            if (!user) {
                throw { name: "Unauthorized", message: "Invalid email/password" }
            }

            // 3. check password valid atau engga
            const isValidPassword = comparePassword(password, user.password)
            if (!isValidPassword) {
                throw { name: "Unauthorized", message: "Invalid email/password" }
            }

            // 4. create (token -> kartu akses untuk pake api di aplikasi ini)
            const access_token = signToken({ id: user.id, role: user.role })

            // 5. response
            res.status(200).json({ access_token })
        } catch (error) {
            console.log(error);
            next(error)
            
        }
    }
}