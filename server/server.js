const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const nodeRouter = require('./nodeRouter.js');
const cookieParser = require('cookie-parser');
var cors = require('cors')

const app = express();
app.set('port', (process.env.PORT || 5000));

const userDb = {
  Billy: {
    userWalletId: '1234',
    balance: 100,
  },
};
const artistsToPay = {
  NOFX: {
    artistWalletId: '5678',
    btcEarned: 0,
  },
};

app.use(cors());
app.use(cookieParser());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../client/dist')));

app.use('/node', nodeRouter);
app.get('/', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../client/index.html'));
});

// Endpoint to register a new user
app.post('/register', (req, res) => {
  const userData = req.body;

  // Initialize user
  userDb[userData.username] = {
    userWalletId: userData.userWalletId,
    balance: userData.balance,
  };

  res.status(200).json({
    username: userData.username,
    userWalletId: userDb[userData.username].userWalletId,
    balance: userDb[userData.username].balance,
  });
});

// Endpoint to track user stream activity
app.post('/track-stream', (req, res) => {
  const data = req.body;

  if ((userDb[data.username].balance - data.trackPrice) < 0) {
    res.status(400).json({ error: "User's balance is too low :(" });
  } else {
    // Substract btc amount from user balance
    userDb[data.username].balance -= data.trackPrice;

    // Add btc ammount to artist btcEarned
    artistsToPay[data.artist].btcEarned += data.trackPrice;

    res.status(200).json({ userBalanceData: userDb[data.username].balance });
  }
});

app.listen(app.get('port'), '127.0.0.1', () => {
  console.log('Node app is running on port', app.get('port')); // eslint-disable-line no-console
});
