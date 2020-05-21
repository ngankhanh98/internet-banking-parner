const express = require("express");
const axios = require('axios');
const app = express();
require("express-async-errors");
const openpgp = require('openpgp');

const router = express.Router();

app.use(express.json());

router.post('/', async (req, res)=>{
    const msg = req.body['msg'];

    // generate key pair
    const passphrase = 'Parner Bank';
    const {
        privateKeyArmored,
        publicKeyArmored,
        revocationCertificate,
      } = await openpgp.generateKey({
        userIds: [
          { name: "Parner Bank", email: "it_deparment@parnerbank.com" },
        ],
        curve: "ed25519", // ECC curve name
        passphrase: passphrase, // protects the private key
      });

      // upload public key to HKP server
    var hkp = new openpgp.HKP();
    await hkp.upload(publicKeyArmored);

    // sign with privatekey 
    const { keys: [privateKey] } = await openpgp.key.readArmored(privateKeyArmored);
    await privateKey.decrypt(passphrase);
 
    const { data: cleartext } = await openpgp.sign({
        message: openpgp.cleartext.fromText(msg), // CleartextMessage or Message object
        privateKeys: [privateKey]                             // for signing
    });
    console.log(cleartext); // '-----BEGIN PGP SIGNED MESSAGE ... END PGP SIGNATURE-----'


    axios.post('http://localhost:3000/api/openpgp', {
        cleartext: cleartext
      })
      .then(function (response) {
        res.status(200).json(response.data);
      })
      .catch(function (error) {
        console.log(error);
      });
})

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
  