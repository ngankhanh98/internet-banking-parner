const express = require("express");
const axios = require("axios");
const app = express();
require("express-async-errors");
const openpgp = require("openpgp");
const CryptoJS = require("crypto-js");
const moment = require("moment");

const router = express.Router();

// !!! KHÔNG CHỈNH SỬA
const fixedData = {
  secret_key: "H8PIBP9MPMOM",
  email: "info@mpbank.com",
};
// !!! KHÔNG CHỈNH SỬA

// 1. Được phép chỉnh. Chỉnh chỗ này không thay đổi bất kỳ thông tin cố định nào, bạn có thể yên tâm na
// begin !!! CHỈNH ĐƯỢC, thông tin này dùng để generate key pair
const configPartner = {
  passphrase: "MPBank",
  name: "MPBank",
};
// end !!! CHỈNH ĐƯỢC, thông tin này dùng để generate key pair

const privateKeyArmored = `-----BEGIN PGP PRIVATE KEY BLOCK-----
Version: OpenPGP.js v4.10.4
Comment: https://openpgpjs.org

xYYEXsxrMxYJKwYBBAHaRw8BAQdAnkVAb7MbgQMx3Rwr6Tzir5cI6EOgpkVa
aicplOY7Vif+CQMIFDsi0owsudrgTd4MfFhupLXsqd4UQPiSscO6SVsoniyu
flzioNzaQtcrHg9ATcDZF5JJNcBQdrUcNchldquechLd6OoR784r/RnVZVW2
KM0YTVBCYW5rIDxpbmZvQG1wYmFuay5jb20+wngEEBYKACAFAl7MazMGCwkH
CAMCBBUICgIEFgIBAAIZAQIbAwIeAQAKCRBAzq1DaLpL70rPAQCetsWr31Uo
3R7KU5hIJv2y45g6zpXnbqI5z/4n9KftxwD9EZ9f5KHhnWhoMjkvadODn0aB
YNtPnMc5Y7kXb67oTALHiwRezGszEgorBgEEAZdVAQUBAQdAbQbvRgnRoa5R
XVXpkgfy8YhUAzB25zzvtQCRJIRn7A0DAQgH/gkDCOLELn/DzZoS4JfPsVnj
m/mgyCm6Q/3jrFmh3bhnQYteCF/7vdbwbvPU3ENBvwXIpdvXkW2e+MYIoOsx
qkEfjtR4vZBIsKnYnZoFIL+1z0jCYQQYFggACQUCXsxrMwIbDAAKCRBAzq1D
aLpL70VlAQDhxB+vPL3cmV1QcmNgwO1ab+0ZW4r8xIO3W0KDB5QpSwEAt2tk
hqIa5p8C0ZYnlB8lotVS+kyVhfgQ4Ep+cQyERQ4=
=is0B
-----END PGP PRIVATE KEY BLOCK-----`;

router.post("/", async (req, res) => {
  // headers = {
  //   partner_code: "vpbank",
  //   timestamp: 873643,
  //   api_signature: hash(data, timestamp, secret_key)
  // }

  const partner_code = req.headers["partner_code"];
  const timestamp = moment().toString(); // timestamp in seconds

  // đây, biến data đây
  const data = req.body; // data = { transaction_type: '+/-/?', source_account: '26348364', target_account: '87234934', amount_money: 293234424}
  const secret_key = fixedData.secret_key;
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
  var signed_data = null;

  if (data.transaction_type === "+" || data.transaction_type === "-") {
    // generate key pair

    const passphrase = configPartner.passphrase;

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
      signed_data = cleartext;
      
      request(data, signed_data, _headers, res);
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
