const utils = require('./utils');

////////////////////////////////////////////////////////////////////////////////

// Main Transactions Function
const Transactions = function(config) {

  const _this = this;
  this.config = config;

  // Mainnet Configuration
  this.configMainnet = {
    bech32: 'ltc',
    bip32: {
      public: Buffer.from('0488B21E', 'hex').readUInt32LE(0),
      private: Buffer.from('0488ADE4', 'hex').readUInt32LE(0),
    },
    peerMagic: 'fbc0b6db',
    pubKeyHash: Buffer.from('30', 'hex').readUInt8(0),
    scriptHash: Buffer.from('32', 'hex').readUInt8(0),
    wif: Buffer.from('b0', 'hex').readUInt8(0),
    coin: 'ltc',
  };

  // Testnet Configuration
  this.configTestnet = {
    bech32: 'tltc',
    bip32: {
      public: Buffer.from('043587CF', 'hex').readUInt32LE(0),
      private: Buffer.from('04358394', 'hex').readUInt32LE(0),
    },
    peerMagic: 'fcc1b7dc',
    pubKeyHash: Buffer.from('6F', 'hex').readUInt8(0),
    scriptHash: Buffer.from('C4', 'hex').readUInt8(0),
    wif: Buffer.from('EF', 'hex').readUInt8(0),
    coin: 'ltc',
  };

  // Calculate Generation Transaction
  this.handleGeneration = function(rpcData, placeholder) {

    const txLockTime = 0;
    const txInSequence = 0;
    const txInPrevOutHash = '';
    const txInPrevOutIndex = Math.pow(2, 32) - 1;
    const txOutputBuffers = [];

    let txVersion = 1;
    const network = !_this.config.settings.testnet ?
      _this.configMainnet :
      _this.configTestnet;

    // Use Version Found in CoinbaseTxn
    if (rpcData.coinbasetxn && rpcData.coinbasetxn.data) {
      txVersion = parseInt(utils.reverseHex(rpcData.coinbasetxn.data.slice(0, 8)), 16);
    }

    // Calculate Coin Block Reward
    let reward = rpcData.coinbasevalue;

    // Handle Pool/Coinbase Addr/Flags
    const poolAddressScript = utils.addressToScript(_this.config.primary.address, network);
    const coinbaseAux = rpcData.coinbaseaux && rpcData.coinbaseaux.flags ?
      Buffer.from(rpcData.coinbaseaux.flags, 'hex') :
      Buffer.from([]);

    // Build Initial ScriptSig
    let scriptSig = Buffer.concat([
      utils.serializeNumber(rpcData.height),
      coinbaseAux,
      utils.serializeNumber(Date.now() / 1000 | 0),
      Buffer.from([placeholder.length]),
    ]);

    // Add Auxiliary Data to ScriptSig
    if (_this.config.auxiliary && _this.config.auxiliary.enabled && rpcData.auxData) {
      scriptSig = Buffer.concat([
        scriptSig,
        Buffer.from(_this.config.auxiliary.coin.header, 'hex'),
        Buffer.from(rpcData.auxData.hash, 'hex'),
        utils.packUInt32LE(1),
        utils.packUInt32LE(0)
      ]);
    }

    // Build First Part of Generation Transaction
    const p1 = Buffer.concat([
      utils.packUInt32LE(txVersion),
      utils.varIntBuffer(1),
      utils.uint256BufferFromHash(txInPrevOutHash),
      utils.packUInt32LE(txInPrevOutIndex),
      utils.varIntBuffer(scriptSig.length + placeholder.length),
      scriptSig,
    ]);

    // Handle Recipient Transactions
    let recipientTotal = 0;
    _this.config.primary.recipients.forEach(recipient => {
      const recipientReward = Math.floor(recipient.percentage * reward);
      const recipientScript = utils.addressToScript(recipient.address, network);
      recipientTotal += recipientReward;
      txOutputBuffers.push(Buffer.concat([
        utils.packUInt64LE(recipientReward),
        utils.varIntBuffer(recipientScript.length),
        recipientScript,
      ]));
    });

    // Handle Pool Transaction
    reward -= recipientTotal;
    txOutputBuffers.unshift(Buffer.concat([
      utils.packUInt64LE(reward),
      utils.varIntBuffer(poolAddressScript.length),
      poolAddressScript
    ]));

    // Handle Witness Commitment
    if (rpcData.default_witness_commitment !== undefined) {
      const witness_commitment = Buffer.from(rpcData.default_witness_commitment, 'hex');
      txOutputBuffers.push(Buffer.concat([
        utils.packUInt64LE(0),
        utils.varIntBuffer(witness_commitment.length),
        witness_commitment
      ]));
    }

    // Build Second Part of Generation Transaction
    const p2 = Buffer.concat([
      utils.packUInt32LE(txInSequence),
      utils.varIntBuffer(txOutputBuffers.length),
      Buffer.concat(txOutputBuffers),
      utils.packUInt32LE(txLockTime),
    ]);

    return [p1, p2];
  };
};

module.exports = Transactions;
