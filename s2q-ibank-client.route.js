const express = require("express");
const axios = require("axios");
const app = express();
require("express-async-errors");
const openpgp = require("openpgp");
const CryptoJS = require("crypto-js");
const moment = require("moment");

const router = express.Router();
const { secret_key, privateKeyArmored, passphrase } = require("./config.json");

router.post("/", async (req, res) => {
  // headers = {
  //   partner_code: "vpbank",
  //   timestamp: 873643,
  //   api_signature: hash(data, timestamp, secret_key)
  // }

  const partner_code = req.headers["partner_code"];
  const timestamp = moment().toString(); // timestamp in seconds

  const data = req.body; // data = { transaction_type: '+/-/?', source_account: '26348364', target_account: '87234934', amount_money: 293234424}
  const hash = CryptoJS.AES.encrypt(
    JSON.stringify({ data, timestamp, secret_key }),
    secret_key
  ).toString();

  const _headers = {
    partner_code: partner_code,
    timestamp: timestamp,
    api_signature: hash,
  };

  // if data.transaction_type === '+' || '-'
  // pgp signature needed

  if (data.transaction_type === "+" || data.transaction_type === "-") {
    (async () => {
      // sign with privatekey
      const {
        keys: [privateKey],
      } = await openpgp.key.readArmored(privateKeyArmored);
      await privateKey.decrypt(passphrase);

      const { data: cleartext } = await openpgp.sign({
        message: openpgp.cleartext.fromText(JSON.stringify(data)), // CleartextMessage or Message object
        privateKeys: [privateKey], // for signing
      });

      request(data, cleartext, _headers, res);
    })();
  } else request(data, null, _headers, res);
});

const request = (data, signed_data, _headers, res) =>
  axios
    .post(
      "https://nklbank.herokuapp.com/api/partnerbank/request",
      { data, signed_data },
      { headers: _headers }
    )
    .then(function (response) {
      res.status(200).json(response.data);
      console.log(response.data);
    })
    .catch(function (error) {
      console.log(error.response);
      res.status(error.response.status).send(error.response.data);
    });

module.exports = router;
