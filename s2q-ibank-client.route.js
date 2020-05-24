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
  secret_key: "s2qbanking",
  email: "info@s2q-ibank.com"
}
// !!! KHÔNG CHỈNH SỬA

// 1. Được phép chỉnh. Chỉnh chỗ này không thay đổi bất kỳ thông tin cố định nào, bạn có thể yên tâm na
// begin !!! CHỈNH ĐƯỢC, thông tin này dùng để generate key pair
const configPartner = {
  passphrase: "Parner Bank",
  name: "Parner Bank",
}
// end !!! CHỈNH ĐƯỢC, thông tin này dùng để generate key pair


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
      // Đây là chỗ thứ 2. Được chỉnh
      // Phần xử lý dữ liệu của nhóm sẽ nằm ở đây
      // Ví dụ, nhóm  gửi gói tin data = { "transaction_type": "-", "source_account": "3234", "target_account": "12345", "amount_money": 2000000 }
      // Nghĩa là bạn muốn: target_account -2000000 (NKLBank), source_account +2000000 (MPBank), kiểu kêu NKL chuyển tiền đi á

      // Vô hàm này là res thành công rồi, nghĩa là bên NKL đã trừ tiền cho target_account,
      // Bây giờ bạn cần viết vài dòng code để cộng tiền vào source_account 

      // tụi tui lưu thông tin gói tin lại ở biến data

      // Bạn có thể code kiểu
      // const rows = await accountModel.update(`update table_account set account_balance = account_balance + data.amount_money where account_number = data.target_account`)

    })
  .catch(function (error) {
    console.log(error.response);
    res.status(error.response.status).send(error.response.data);
  });
});

module.exports = router;


// Xong, giờ bạn chỉ cần gắn file này vô app.js nữa
