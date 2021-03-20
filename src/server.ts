import { ErrorRequestHandler } from 'express';
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

receiver.app.get('/chain', async (req, res, next) => {
  try {
    const chain = await getBlocks();
    res.send({
      data: chain
    });
  } catch (err) {
    next(err);
  }
});

receiver.app.get('/unconfirmed-transactions', async (req, res, next) => {
  try {
    const transactions = await getUnconfirmedTransactions();
    res.send({
      data: transactions
    });
  } catch (err) {
    next(err)
  }
})

receiver.app.post('/create-wallet', function(req, res, next) {
  const { name, password } = req.body;
  createWallet({ name, password }).then(newWallet => {
    res.json({
      name,
      publicKey: newWallet.publicKey
    });
  });
});

receiver.app.post('/authenticate', function (req, res) {
  const { name, password } = req.body;
  getToken(name, password).then(token => {
    if (token) {
      res.json({ token });
    } else {
      res.json({ error: 'Invalid username or password' })
    }
  });
});

receiver.app.post('/mine-block', async function (req, res, next) {
  console.log('Received new block', req.body);
  try {
    await addBlock(req.body);
    res.send({ data: 'success' });
  } catch (err) {
    next(err);
  }
})

receiver.app.use('/authenticated', function (req, res, next) {
  const authorizationHeader = req.headers['authorization'];
  const token = authorizationHeader?.replace('Bearer ', '');
  authenticate(token).then(wallet => {
    if (wallet) {
      req.wallet = wallet;
      return next();
    }
    console.error('Unauthorized');
    return next(new Error('Unauthorized'));
  });
});

receiver.app.post('/authenticated/send-coins', function (req, res, next) {
  const { target, amount, message } = req.body;
  if (target === req.wallet.publicKey) {
    return next(new Error('Can\'t send coins to yourself'));
  }

  if (amount === 0) {
    return next(new Error('Can\'t send 0 coins'));
  }
  createTransaction(req.wallet.publicKey, target, message || null, amount)
    .then(transaction => {
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
  console.log(err);
  res.status(400);
  res.send({
    data: null,
    error: err.message
  });
}

receiver.app.use('*', errorHandler)
