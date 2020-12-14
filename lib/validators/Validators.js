const BufferWriter = require('@dashevo/dashcore-lib/lib/encoding/bufferwriter');
const Hash = require('@dashevo/dashcore-lib/lib/crypto/hash');

class Validators {
  /**
   * @param {SimplifiedMNListStore} smlStore
   */
  constructor(smlStore) {
    if (!smlStore) {
      throw new Error('Validators class requires smlStore as a parameter');
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
  calculateScores(quorums, modifier) {
    return quorums.map((quorum) => {
      const bufferWriter = new BufferWriter();
      bufferWriter.writeReverse(Buffer.from(quorum.quorumHash, 'hex'));
      bufferWriter.writeReverse(modifier);
      return { score: Hash.sha256(bufferWriter.toBuffer()).reverse(), quorum };
    });
  }

  /**
   * Gets all validator quorums.
   * @private
   * @param {SimplifiedMNList} sml - a simplified masternode list\
   * @param {boolean} [verified] - optional flag if quorums should be verified or not
   * @return {QuorumEntry[]} - array of all active validator quorums
   */
  getValidatorQuorums(sml, verified = false) {
    if (verified) {
      return sml.getVerifiedQuorums().filter(
        (quorum) => quorum.llmqType === sml.getValidatorLLMQType(),
      );
    }
    return sml.getQuorums().filter((quorum) => quorum.llmqType === sml.getValidatorLLMQType());
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
    scoredQuorums.sort(
      (a, b) => Buffer.compare(Buffer.from(a.quorum.quorumHash, 'hex').reverse(),
        Buffer.from(b.quorum.quorumHash, 'hex').reverse()),
    );
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
