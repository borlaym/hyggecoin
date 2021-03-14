import express, { ErrorRequestHandler } from 'express';
import { authenticate, createWallet, getToken } from './wallet';
import bodyParser from 'body-parser';
import { addBlock, addTransaction, createTransaction, getBlocks, getUnconfirmedTransactions } from './db';
import { signTransaction } from './transaction';
import { receiver } from './slack-server';

receiver.app.use(bodyParser.urlencoded({
  extended: false
}));

receiver.app.use(bodyParser.json());

receiver.app.use('*', (req, res, next) => {
  res.setHeader('access-control-allow-origin', '*');
  next();
})

receiver.app.get('/', (req, res) => res.send('Hyggecoin Exchange'));

receiver.app.get('/chain', async (req, res) => {
  const chain = await getBlocks();
  res.send({
    data: chain
  });
});

receiver.app.get('/unconfirmed-transactions', async (req, res) => {
  const transactions = await getUnconfirmedTransactions();
  res.send({
    data: transactions
  });
})

receiver.app.post('/create-wallet', function(req, res, next) {
  const { name, password } = req.body;
  const newWallet = createWallet({ name, password });
  res.json({
    name,
    publicKey: newWallet.publicKey
  });
});

receiver.app.post('/authenticate', function (req, res) {
  const { name, password } = req.body;
  const token = getToken(name, password);
  if (token) {
    res.json({ token });
  } else {
    res.json({ error: 'Invalid username or password' })
  }
});

receiver.app.post('/mine-block', function (req, res) {
  if (addBlock(req.body)) {
    res.send({ data: 'success' });
  } else {
    res.send({ error: 'something went wrong '});
  }
})

receiver.app.use('/authenticated', function (req, res, next) {
  const authorizationHeader = req.headers['authorization'];
  const token = authorizationHeader?.replace('Bearer ', '');
  const wallet = authenticate(token);
  if (wallet) {
    req.wallet = wallet;
    return next();
  }
  console.error('Unauthorized');
  return next(new Error('Unauthorized'));
});

receiver.app.post('/authenticated/send-coins', function (req, res, next) {
  const { target, amount } = req.body;
  if (target === req.wallet.publicKey) {
    return next(new Error('Can\'t send coins to yourself'));
  }

  if (amount === 0) {
    return next(new Error('Can\'t send 0 coins'));
  }
  createTransaction(req.wallet.publicKey, target, amount)
    .then(transaction => {
      console.log(req.wallet.secretKey);
      const signedTransaction = signTransaction(transaction, req.wallet.secretKey);
      addTransaction(signedTransaction)
      .then(() => {
        console.log(signedTransaction);
        res.send({
          data: 'success'
        })
      })
      .catch(err => next(err));
    })
    .catch(err => next(err));
})

const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  res.send({
    data: null,
    error: err.message
  });
}

receiver.app.use('*', errorHandler)
