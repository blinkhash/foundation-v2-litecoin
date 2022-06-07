const Algorithms = require('../../stratum/main/algorithms');
const Daemon = require('../../daemon/main/daemon');
const Pool = require('../../stratum/main/pool');
const Text = require('../../locales/index');

////////////////////////////////////////////////////////////////////////////////

// Main Stratum Function
const Stratum = function (logger, config, configMain) {

  const _this = this;
  this.logger = logger;
  this.config = config;
  this.configMain = configMain;
  this.text = Text[configMain.language];

  // Stratum Variables
  process.setMaxListeners(0);
  this.forkId = process.env.forkId;

  // Build Stratum Daemons
  this.handleDaemons = function(callback) {

    // Load Daemons from Configuration
    const primaryDaemons = _this.config.primary.daemons;
    const auxiliaryEnabled = _this.config.auxiliary && _this.config.auxiliary.enabled;
    const auxiliaryDaemons = auxiliaryEnabled ? _this.config.auxiliary.daemons : [];

    // Build Daemon Instances
    const primary = new Daemon(primaryDaemons);
    const auxiliary = new Daemon(auxiliaryDaemons);

    // Initialize Daemons and Load Settings
    primary.checkInstances(() => {
      auxiliary.checkInstances(() => {
        callback(primary, auxiliary);
      });
    });
  };

  // Build Stratum from Configuration
  this.handleStratum = function(primary, auxiliary) {

    // Build Stratum Server
    _this.stratum = new Pool(_this.config, _this.configMain, primary, auxiliary, () => {});

    // Handle Stratum Main Events
    _this.stratum.on('pool.started', () => {});
    _this.stratum.on('pool.log', (severity, text) => {
      _this.logger[severity]("Pool", _this.config.name, [text]);
    });

    // Handle Stratum Share Events
    _this.stratum.on('pool.share', (shareData, shareType, blockValid, callback) => {});
  };

  // Output Stratum Data on Startup
  this.outputStratum = function() {

    // Build Pool Starting Message
    const output = [
      _this.text.startingMessageText1(_this.config.name),
      _this.text.startingMessageText2(_this.config.coins),
      _this.text.startingMessageText3(_this.config.settings.testnet ? 'Testnet' : 'Mainnet'),
      _this.text.startingMessageText4(_this.stratum.statistics.ports.join(', ')),
      _this.text.startingMessageText5(_this.stratum.statistics.feePercentage * 100),
      _this.text.startingMessageText6(_this.stratum.manager.currentJob.rpcData.height),
      _this.text.startingMessageText7(_this.stratum.manager.currentJob.difficulty * Algorithms.sha256d.multiplier),
      _this.text.startingMessageText8(_this.stratum.statistics.difficulty),
      _this.text.startingMessageText9(_this.stratum.statistics.connections),
      _this.text.startingMessageText10()];

    // Send Starting Message to Logger
    if (_this.forkId === "0") {
      _this.logger["log"]("Pool", null, output, true);
    }
  }

  // Setup Pool Stratum Capabilities
  this.setupStratum = function(callback) {

    // Build Daemon/Stratum Functionality
    _this.handleDaemons((primary, auxiliary) => {
    _this.handleStratum(primary, auxiliary);
    _this.stratum.setupPorts();
    _this.stratum.setupSettings(() => {
    _this.stratum.setupRecipients();
    _this.stratum.setupManager();
    _this.stratum.setupPrimaryBlockchain(() => {
    _this.stratum.setupAuxiliaryBlockchain(() => {
    _this.stratum.setupFirstJob(() => {
    _this.stratum.setupBlockPolling();
    _this.stratum.setupNetwork(() => {
      _this.outputStratum()
      callback()
    })

    // Too Much Indentation
    })})})})});
  }
};

module.exports = Stratum;
