const Validators = require('./validators');

class LightClient {
  /**
   * @param {Object} [options]
   */
  constructor(options = {}) {
    this.options = {
      network: 'evonet',
      timeout: 10000,
      retries: 3,
      ...options,
    };
  }
}

module.exports = LightClient;
module.exports = Validators;
