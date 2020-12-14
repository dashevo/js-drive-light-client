const Validators = require('./validators/Validators');

class LightClient {
  /**
   * @param {Object} [options]
   */
  constructor(smlStore, options = {}) {
    if (!smlStore) {
      throw new Error('LightClient requires smlStore as a parameter');
    }
    this.options = {
      network: 'evonet',
      timeout: 10000,
      retries: 3,
      ...options,
    };

    this.validators = new Validators(smlStore);
  }
}

module.exports = LightClient;
