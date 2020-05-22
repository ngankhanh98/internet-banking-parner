const express = require("express");
const axios = require("axios");
const app = express();
require("express-async-errors");
const openpgp = require("openpgp");
const CryptoJS = require("crypto-js");
const moment = require("moment");

const router = express.Router();

app.use(express.json());

router.post("/request", async (req, res) => {
  // headers = {
  //   partner_code: "vpbank",
  //   timestamp: 873643,
  //   api_signature: hash(data, timestamp, secret_key)
  // }

  const partner_code = req.headers["partner_code"];
  const timestamp = moment().toString(); // timestamp in seconds
  const data = req.body; // data = { transaction_type: '+/-/?', source_account: '26348364', target_account: '87234934', amount_money: 293234424}
  const secret_key = "647582139505";
  let publicKeyArmored;
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

  // You will need to change:
  // passphrase: This is a super secret string to generate public key and private key. You should not share it to anyone, even us NKL Bank
  // userIds: [{ name: "Parner Bank", email: "it_deparment@parnerbank.com" }]
  // You are to change userIds.name and userIds.email. It's ok if it's leak

  var signed_data = null;

  if (data.transaction_type === "+" || data.transaction_type === "-") {
    // generate key pair

    const passphrase = "Parner Bank";
    const { privateKeyArmored, publicKeyArmored } = await openpgp.generateKey({
      userIds: [{ name: "Parner Bank", email: "it_deparment@partnerbank.com" }],
      curve: "ed25519", // ECC curve name
      passphrase: passphrase, // protects the private key
    });

    console.log(publicKeyArmored);

    // upload public key to HKP server
      var hkp = new openpgp.HKP();
      const ret = await hkp.upload(publicKeyArmored);
      console.log("ret: ");
      console.log(ret);

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
  }
  // POST to our server
  axios
    .post(
      "http://localhost:3000/api/partnerbank/request",
      { data, signed_data },
      { headers: _headers }
    )
    .then(function (response) {
      res.status(200).json(response.data);
    })
    .catch(function (error) {
      console.log(error.response);
      res.status(error.response.status).send(error.response.data);
    });
});

app.use("/", router);

app.use((req, res, next) => {
  res.status(404).send("NOT FOUND");
});

app.use(function (err, req, res, next) {
  const code = err.code || 500;
  console.log(code, err.message);
  res.status(code).send(err.message);
});

const PORT = 8080;
app.listen(PORT, (_) => {
  console.log(`API is running at http://localhost:${PORT}`);
});
