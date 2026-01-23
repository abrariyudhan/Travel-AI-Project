const express = require("express");
const app = express();
const port = 3000;
const cors = require('cors')
const errorHandler = require('./middlewares/errorHandler')

const router = require('./routes')



app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors())
app.use(router)
app.use(errorHandler)

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
  });
}

module.exports = app