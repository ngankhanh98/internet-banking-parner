const express = require("express");
const axios = require("axios");
const app = express();
require("express-async-errors");
const openpgp = require("openpgp");
const CryptoJS = require("crypto-js");
const moment = require("moment");

app.use(express.json());


// app.use('<tùy ý em nha>', , require('./PGPpartnerbankClient.route'))
app.use('/pgp-request', require('./PGPpartnerbankClient.route'));

app.use((req, res, next) => {
  res.status(404).send("NOT FOUND");
});

app.use(function (err, req, res, next) {
  const code = err.code || 500;
  console.log(code, err.message);
  res.status(code).send(err.message);
});

const PORT = 5000;
app.listen(PORT, (_) => {
  console.log(`API is running at http://localhost:${PORT}`);
});
