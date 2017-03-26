const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const nodeRouter = require('./nodeRouter.js');
const cookieParser = require('cookie-parser');
const request = require('superagent');
var cors = require('cors')

const app = express();
app.set('port', (process.env.PORT || 5000));
const BCOIN_REST_API = 'http://127.0.0.1:18556';

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
  artist1: {
    artistReceiveAddress: 'SRGZ8fto4yW8FXE2wVzR93nf55szP9FvM1',
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

    const url = `${BCOIN_REST_API}/wallet/${user.userWalletId}/send`;
    request
      .post(url)
      .send({
          rate: 0.0,
          outputs: [
            {
              value: ("" + data.trackPrice), 
              address: artist.artistReceiveAddress 
            }
          ]
        })
      .set('Accept', 'application/json')
      .end(function(err, response){
        if (err) {
          console.error(err);
          res.status(400).json({
            success: false,
            bcoinResponse: JSON.parse(response.text)
          });
        } else {
          console.log(response.statusCode);
          console.log(response);
          res.status(200).json({
            success: true,
            balance: userDb[data.username].balance,
            artist: artist,
            bcoinResponse: JSON.parse(response.text)
          });
        }
      });
  }
});

app.listen(app.get('port'), '127.0.0.1', () => {
  console.log('Node app is running on port', app.get('port')); // eslint-disable-line no-console
});
