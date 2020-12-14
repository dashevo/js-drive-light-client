const BufferWriter = require('@dashevo/dashcore-lib/lib/encoding/bufferwriter');
const Hash = require('@dashevo/dashcore-lib/lib/crypto/hash');
const { SimplifiedMNListStore, SimplifiedMNList } = require('@dashevo/dashcore-lib');

class Validators {
  /**
   * @param {SimplifiedMNListStore} smlStore
   @param {Object} options
   */
  constructor(smlStore, options = {}) {
    if (!smlStore) {
      throw ('Validators class requires smlStore as a parameter');
    }
    this.smlStore = smlStore;
  }

  /**
   * Calculates scores for MN selection
   * @private
   * it calculates sha256(sha256(proTxHash, confirmedHash), modifier) per MN
   * Please note that this is not a double-sha256 but a single-sha256
   * @param {QuorumEntry[]} quorums
   * @param {Buffer} modifier
   * @return {Object[]} scores
   */
  calculateScores (quorums, modifier) {
    return quorums.map((quorum) => {
      const bufferWriter = new BufferWriter();
      bufferWriter.writeReverse(Buffer.from(quorum.quorumHash, 'hex'));
      bufferWriter.writeReverse(modifier);
      return { score: Hash.sha256(bufferWriter.toBuffer()).reverse(), quorum };
    });
  };

  /**
   * Gets all validator quorums.
   * @private
   * @param {SimplifiedMNList} sml - a simplified masternode list\
   * @param {boolean} [verified] - optional flag if quorums should be verified or not
   * @return {QuorumEntry[]} - array of all active validator quorums
   */
  getValidatorQuorums(sml, verified = false) {
    if (verified) {
      return Validators.removePoseQuorum(sml.getVerifiedQuorums().filter(quorum => quorum.llmqType === sml.getValidatorLLMQType()));
    }
    return Validators.removePoseQuorum(sml.getQuorums().filter(quorum => quorum.llmqType === sml.getValidatorLLMQType()));
  }

  /**
   * Removes the PoSE quorum from the list of validator quorums.
   * The PoSE quorum is always the first quorum in the list and changes ~ every hour
   * @private
   * @param {QuorumEntry[]} validatorQuorums - an array of quorums
   * @return {QuorumEntry[]} - array of all active validator quorums
   */
  static removePoseQuorum(validatorQuorums) {
    validatorQuorums.shift();
    return validatorQuorums;
  }

  /**
   * Gets the PoSE quorum.
   * The PoSE quorum is always the first quorum in the list and changes ~ every hour
   * @param {SimplifiedMNList} sml - a simplified masternode list
   * @param {boolean} [verified] - optional flag if quorums should be verified or not
   * @return {QuorumEntry} - the PoSE quorum currently active
   */
  getPoseQuorum(sml, verified = false) {
    let poseQuorum;
    if (verified) {
      poseQuorum = sml.getVerifiedQuorums().filter(quorum => quorum.llmqType === sml.getValidatorLLMQType()).shift();
      return poseQuorum;
    }
    poseQuorum = sml.getQuorums().filter(quorum => quorum.llmqType === sml.getValidatorLLMQType()).shift();
    return poseQuorum;
  }

  /**
   * Gets all validator quorums.
   * @private
   * @param {QuorumEntry[]} validatorQuorums - an array of validator quorums
   * @param {Buffer} rotationSignature - the entropy to select the quorum
   * @return {QuorumEntry} - the current validator set
   */
  selectValidatorSet(validatorQuorums, rotationSignature) {
    const scoredQuorums = this.calculateScores(validatorQuorums, rotationSignature);
    scoredQuorums.sort((a, b) =>
      Buffer.compare(Buffer.from(a.quorum.quorumHash, 'hex').reverse(), Buffer.from(b.quorum.quorumHash, 'hex').reverse()));
    return scoredQuorums[0].quorum;
  }

  /**
   * Gets the current validator set for a particular core height
   * @param {Buffer} rotationSignature - the entropy to select the quorum
   * @param {number} coreBlockHeight
   * @param {boolean} [verified] - optional flag if quorums should be verified or not
   * @return {QuorumEntry} - the current validator set
   */
  async getValidatorSetForCoreHeight(rotationSignature, coreBlockHeight, verified = true) {
    const currentSML = this.smlStore.getSMLbyHeight(coreBlockHeight);
    const validatorQuorums = this.getValidatorQuorums(currentSML, verified);
    return this.selectValidatorSet(validatorQuorums, rotationSignature);
  }

  /**
   * Gets all validator quorums.
   * @param {Buffer} rotationSignature - the entropy to select the quorum
   * @param {boolean} [verified] - optional flag if quorums should be verified or not
   * @return {QuorumEntry} - the current validator set
   */
  async getValidatorSet(rotationSignature, verified = false) {
    const currentSML = this.smlStore.getCurrentSML();
    const validatorQuorums = this.getValidatorQuorums(currentSML, verified);
    return this.selectValidatorSet(validatorQuorums, rotationSignature);
  }
}

module.exports = Validators;
