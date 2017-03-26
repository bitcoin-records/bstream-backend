const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const nodeRouter = require('./nodeRouter.js');
const cookieParser = require('cookie-parser');
const request = require('request');
var cors = require('cors')

const app = express();
app.set('port', (process.env.PORT || 5000));
const BCOIN_REST_API = 'http://localhost:5000/node';

var userDb = {
  Billy: {
    userWalletId: 'mediedtestwallet',
    balance: 100,
  },
};

var artistsToPay = {
  NOFX: {
    artistReceiveAddress: 'SVS5LCYh3XortwyqKdw8Bnd1dzBRrP3Sdk',
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
  var readyForPayment = false;
  const user = userDb[data.username];
  const artist = artistsToPay[data.artist];

  if (!user) {
    res.status(404).json({ error: "User not found" });
  }

  if (!artist) {
    res.status(404).json({ error: "Artist not found" });
  }

  if ((user.balance - data.trackPrice) < 0) {
    res.status(400).json({ error: "User's balance is too low :(" });
  } else {
    // Substract btc amount from user balance
    userDb[data.username].balance -= data.trackPrice;

    // Add btc ammount to artist btcEarned
    artistsToPay[data.artist].btcEarned += data.trackPrice;

    request
      .post(`${BCOIN_REST_API}/wallet/${user.userWalletId}/send`)
      .form({
        rate: '0.001',
        outputs: [{ value: '0.1', address: artist.artistReceiveAddress }],
      })
      .on('response', function(response) {
        res.status(200).json({
          balance: userDb[data.username].balance,
          artist: artist
        });
      })
      .on('error', function(err) {
        res.status(400).json(err);
        console.log(err)
      })
  }
});

app.listen(app.get('port'), '127.0.0.1', () => {
  console.log('Node app is running on port', app.get('port')); // eslint-disable-line no-console
});
