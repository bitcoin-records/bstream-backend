module.exports = {
  network: 'simnet',
  nodes: ['10.7.64.88', '10.7.64.53'],
  publicHost: '10.6.64.117',
  host: '::',
  useWorkers: true,
  coinCache: 30000000,
  query: true,
  pruned: true,
  db: 'leveldb',
  logLevel: 'info',
  logFile: true,
  listen: true,
};
