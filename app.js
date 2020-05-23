const express = require("express");
const axios = require("axios");
const app = express();
require("express-async-errors");
const openpgp = require("openpgp");
const CryptoJS = require("crypto-js");
const moment = require("moment");

const router = express.Router();

app.use(express.json());

// !!! KHÔNG CHỈNH SỬA
const fixedData = {
  secret_key: "H8PIBP9MPMOM",
  email: "info@mpbank.com"
}
// !!! KHÔNG CHỈNH SỬA

// begin !!! CHỈNH ĐƯỢC, thông tin này dùng để generate key pair
const configPartner = {
  passphrase: "Parner Bank",
  name: "Parner Bank",
}
// end !!! CHỈNH ĐƯỢC, thông tin này dùng để generate key pair


router.post("/request", async (req, res) => {
  // headers = {
  //   partner_code: "vpbank",
  //   timestamp: 873643,
  //   api_signature: hash(data, timestamp, secret_key)
  // }

  const partner_code = req.headers["partner_code"];
  const timestamp = moment().toString(); // timestamp in seconds
  const data = req.body; // data = { transaction_type: '+/-/?', source_account: '26348364', target_account: '87234934', amount_money: 293234424}
  const secret_key = fixedData.secret_key;
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
  var signed_data = null;

  if (data.transaction_type === "+" || data.transaction_type === "-") {
    // generate key pair

    const passphrase = configPartner.passphrase;
    const { privateKeyArmored, publicKeyArmored } = await openpgp.generateKey({
      userIds: [{ name: configPartner.name, email: fixedData.email }],
      curve: "ed25519", // ECC curve name
      passphrase: passphrase, // protects the private key
    });

    console.log(publicKeyArmored);

    // upload public key to HKP server
    var hkp = new openpgp.HKP();
    const ret = await hkp.upload(publicKeyArmored);

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

  // POST to NKLBank server
  axios
    .post(
      "https://nklbank.herokuapp.com/api/partnerbank/request",
      { data, signed_data },
      { headers: _headers }
    )
    .then(function (response) {
      res.status(200).json(response.data);
      // Phần xử lý dữ liệu của nhóm sẽ nằm ở đây
      // Ví dụ, sau khỏi gửi gói tin data = { "transaction_type": "-", "source_account": "3234", "target_account": "12345", "amount_money": 2000000 }
      // Nghĩa là bạn muốn: target_account -2000000 (NKLBank), source_account +2000000 (MPBank)
      // Đây là khi NKLBank -2000000 của target_account, bạn cần viết code phần MPBank +2000000 vào source_account, kiểu:
      // const rows = await accountModel.update(`update table_account set account_balance = account_balance + data.amount_money where account_number = data.target_account`)

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

const PORT = 5000;
app.listen(PORT, (_) => {
  console.log(`API is running at http://localhost:${PORT}`);
});
