
module.exports = function errorHandler(err, req, res, next) {
  console.log(err)

  if (err.name === 'Unauthorized') {
    return res.status(401).json({ message: err.message })
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ message: "Invalid token" })
  }

  if (err.name === 'BadRequest') {
    return res.status(400).json({ message: err.message })
  }
  if (err.name === "NotFound") {
    return res.status(404).json({ message: err.message })
  }

  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({ message: err.errors[0].message })
  }

  res.status(500).json({ message: "Internal Server Error" })
}