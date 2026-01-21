const { User } = require('../models')
const { verifyToken } = require("../helpers/jwt")

module.exports = async function authMiddleware(req, res, next) {
  try {
    console.log(req.headers)

    // ambil authorization value
    const { authorization } = req.headers

    // step 1, cek bawa konci ga?
    if (!authorization) throw { name: "Unauthorized", message: "Invalid token" }

    // step 2, olah authorization
    const rawToken = authorization.split(' ')
    const tokenType = rawToken[0]
    const tokenValue = rawToken[1]

    // step 3, cek format token sesuai?
    if (tokenType !== 'Bearer' || !tokenValue) {
      throw { name: "Unauthorized", message: "Invalid token" }
    }

    // step 4, verify pake helper jwt
    const result = verifyToken(tokenValue)

    // step 5, cek usernya masih ada ga?
    const user = await User.findByPk(result.id)
    if (!user) {
      throw { name: "Unauthorized", message: "Invalid token" }
    }

    // 6. sisipkan user info ke dalam request
    req.user = {
      id: user.id,
      role: user.role
    }

    next()
  } catch (error) {
    console.log(error, "<<< error");
    
    next(error)
  }
}
