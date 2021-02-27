import express, { ErrorRequestHandler, NextFunction } from 'express';
import { authenticate, createWallet, getToken } from './wallet';
import bodyParser from 'body-parser';
import { addBlock, addTransaction, createTransaction, getBlocks } from './db';
const app = express();

app.use(bodyParser.urlencoded({
  extended: false
}));

app.use(bodyParser.json());

app.get('/', (req, res) => res.send('Hyggecoin Exchange'));

app.get('/chain', async (req, res) => {
  const chain = await getBlocks();
  res.send({
    data: chain
  });
});

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

app.post('/mine-block', function (req, res) {
  if (addBlock(req.body)) {
    res.send({ data: 'success' });
  } else {
    res.send({ error: 'something went wrong '});
  }
})

app.use('/authenticated', function (req, res, next) {
  const authorizationHeader = req.headers['authorization'];
  const token = authorizationHeader?.replace('Bearer ', '');
  const wallet = authenticate(token);
  if (wallet) {
    req.wallet = wallet;
    return next();
  }
  return next(new Error('Unauthorized'));
});

app.post('/authenticated/send-coins', function (req, res, next) {
  const { target, amount } = req.body;
  createTransaction(req.wallet.publicKey, target, amount)
    .then(transaction => {
      addTransaction(transaction);
      res.send({
        data: 'success'
      })
    })
    .catch(err => next(err));
})

const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  res.send({
    data: null,
    error: err
  });
}

app.use('*', errorHandler)

app.listen(9000);