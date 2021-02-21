import express from 'express';
import { createWallet, getToken } from './wallet';
import bodyParser from 'body-parser';
const app = express();

app.use(bodyParser.urlencoded({
  extended: false
}));

app.use(bodyParser.json());

app.get('/', (req, res) => res.send('Hyggecoin Exchange'));

app.post('/create-wallet', function(req, res, next) {
  const { name, password } = req.body;
  const newWallet = createWallet(name, password);
  res.json({
    name,
    publicKey: newWallet.publicKey
  });
});

app.post('/authenticate', function (req, res) {
  const { name, password } = req.body;
  const token = getToken(name, password);
  if (token) {
    res.json({ token });
  } else {
    res.json({ error: 'Invalid username or password' })
  }
});

app.listen(9000);