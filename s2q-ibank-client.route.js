const express = require("express");
const axios = require("axios");
const app = express();
require("express-async-errors");
const openpgp = require("openpgp");
const CryptoJS = require("crypto-js");
const moment = require("moment");

const router = express.Router();

// begin KHÔNG CHỈNH
const fixedData = {
  secret_key: "s2qbanking",
  email: "info@s2q-ibank.com",
};

const configPartner = {
  passphrase: "S2QBank",
  name: "S2QBank",
};
// end KHÔNG CHỈNH

const privateKeyArmored = `-----BEGIN PGP PRIVATE KEY BLOCK-----
Version: OpenPGP.js v4.10.4
Comment: https://openpgpjs.org

xYYEXsx/txYJKwYBBAHaRw8BAQdATEOObz/yGkg+mEe22ro6gz8Cw4anGaYZ
imhBB665tiP+CQMIpDw1JulmWKvgInxQBbOfcZ/6mVWFjZdpNZdimWYrt7Qa
7OSffWJR9O4DR47X4o61fOUQedDt8Tcu4396oeLZ3CZQu5uJ5zer5VhxmUfQ
f80cUzJRQmFuayA8aW5mb0BzMnEtaWJhbmsuY29tPsJ4BBAWCgAgBQJezH+3
BgsJBwgDAgQVCAoCBBYCAQACGQECGwMCHgEACgkQ6/VZuEjzBn3yVwEA2YAq
vqb4rGXRiQR4Y8hnKm2/V0DE8z7/ti7F7csX/XsBAIZU8h+/VrgjQW8f9oPs
RyqC/uHe46HmppIrgkMPtsQDx4sEXsx/txIKKwYBBAGXVQEFAQEHQJbmM0ye
TOIo8wY5/L5c98Re5BpxU8wyJXKzZVplznl/AwEIB/4JAwgZNopXq68CfOCf
EMH2TMxJxlkCz4RFrXYxCzefG2rI3WscVW5Vd4I2V33mKF6tCbIQE+nb6PwW
bc1Vpnp4rcqV3dz74JaZvXxlAR+mwcfLwmEEGBYIAAkFAl7Mf7cCGwwACgkQ
6/VZuEjzBn3WogD8DkmSqCl+AOgyCSLZkS5ECP5d6SGs1Pclr5faSFrjqAcA
/1NUueSpYqXjtEdKIELPScLPFyLymv85J245XdQGj7sC
=V0gS
-----END PGP PRIVATE KEY BLOCK-----`;
const publicKeyArmored = `-----BEGIN PGP PUBLIC KEY BLOCK-----
Version: OpenPGP.js v4.10.4
Comment: https://openpgpjs.org

xjMEXsx/txYJKwYBBAHaRw8BAQdATEOObz/yGkg+mEe22ro6gz8Cw4anGaYZ
imhBB665tiPNHFMyUUJhbmsgPGluZm9AczJxLWliYW5rLmNvbT7CeAQQFgoA
IAUCXsx/twYLCQcIAwIEFQgKAgQWAgEAAhkBAhsDAh4BAAoJEOv1WbhI8wZ9
8lcBANmAKr6m+Kxl0YkEeGPIZyptv1dAxPM+/7Yuxe3LF/17AQCGVPIfv1a4
I0FvH/aD7Ecqgv7h3uOh5qaSK4JDD7bEA844BF7Mf7cSCisGAQQBl1UBBQEB
B0CW5jNMnkziKPMGOfy+XPfEXuQacVPMMiVys2VaZc55fwMBCAfCYQQYFggA
CQUCXsx/twIbDAAKCRDr9Vm4SPMGfdaiAPwOSZKoKX4A6DIJItmRLkQI/l3p
IazU9yWvl9pIWuOoBwD/U1S55KlipeO0R0ogQs9Jws8XIvKa/zknbjld1AaP
uwI=
=gyOv
-----END PGP PUBLIC KEY BLOCK-----`

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
      console.log(signed_data);
      
      // POST to NKLBank server
      axios
        .post(
          "https://nklbank.herokuapp.com/api/partnerbank/request",
          { data, signed_data },
          { headers: _headers }
        )
        .then(function (response) {
          res.status(200).json(response.data);
          console.log(response.data)
        })
        .catch(function (error) {
          console.log(error.response);
          //res.status(error.response.status).send(error.response.data);
        });
    })();
  }
});

module.exports = router;
