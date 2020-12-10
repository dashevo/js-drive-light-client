const { SimplifiedMNListStore } = require('@dashevo/dashcore-lib');
const Validators = require('../../../lib/validators');
const validatorFixtures = require('../fixtures/validators');

describe('Validators', () => {

  let smlMock;
  let smlStoreMock;
  let validators;
  let quorumFixtures;
  const rotationSignatureString = '0afe29b3c969b3ceeadc1b6224b27b2696d24f0afd0fee5e7135854c6e0789fd5abc15e7108eb9ac8a512954c8851163032c424c610a357e5acc712c459f3924e529f3d9476977417bdb64e1cabf978086bdf455c727c4012ef85ef793793839';
  let rotationSignature;
  let platformBlockHeight;
  let coreBlockHeight;
  const fixedValidatorSet = {
      version: 1,
      llmqType: 4,
      quorumHash: '0000000001e48ae85c4554329f3432f384d1bda5031e503a8065331bb5475902',
      signersCount: 50,
      signers: 'ffffffffffff03',
      validMembersCount: 50,
      validMembers: 'ffffffffffff03',
      quorumPublicKey: '0e448ce49a3b1a89dae293d9566862e6815438ffd2d03e54bec4167e8db7770b8da8bbbf0dbd256206c35bca4bd0d524',
      quorumVvecHash: 'ce6a3f0367c8300161bd45a20a394fbf4c8332d0c6e10c0ddb1675fb49a13031',
      quorumSig: '81b212eb1107c9a8685a8d20c80b110e8e43333382838b17bda474d81d0028dee64974d9faf8ba5f2260b286ec9e0cef047e2e0cf1a52f6359d6ddc2237818ecfcda84de389aeaa3da232cd396bc65c5d1c8c25d8df4364a60ee0587b03f3f5a',
      membersSig: '0509f9bae9ab601a4436db306aaeb57a70ae14b1ec18e0a80f4c3434295a7045b1f50f5b8a315ee068f182d3f728097911472087ccfcfb5d2f6154f6c6860e6d2d2e06bb4b7eb8239c1d17b0462df2a19132feed479286a9971b29c57809a78e'
    };

  beforeEach(function beforeEach() {
    quorumFixtures = validatorFixtures.getQuorumFixtures();
    smlMock = {
      getVerifiedQuorums: this.sinon.stub().returns(quorumFixtures),
      getQuorums: this.sinon.stub().returns(quorumFixtures.reverse()),
      getValidatorLLMQType: this.sinon.stub().returns(4),
    };
    smlStoreMock = {
      getSMLbyHeight: this.sinon.stub().returns(smlMock),
      getCurrentSML: this.sinon.stub().returns(smlMock),
    };
    //const diffArray = new Array(17);
    //smlStoreMock = SimplifiedMNListStore(diffArray);
    rotationSignature = Buffer.from(rotationSignatureString, 'hex')
    platformBlockHeight = 111;
    coreBlockHeight = 2222;
    validators = new Validators(smlStoreMock);
  });

  describe('#constructor', () => {
    it('should instantiate', () => {
      expect(validators.smlStore).to.deep.equal(smlStoreMock);
    });
    it('should throw an error if smlStore is not passed', () => {
      expect(function () {
        validators = new Validators(undefined);
      }).to.throw('Validators class requires smlStore as a parameter');
    });
  });
  describe('#getValidatorSet', () => {
    it('should get the latest validator set', async () => {
      const validatorSet = await validators.getValidatorSet(rotationSignature, platformBlockHeight);
      expect(validatorSet).to.deep.equal(fixedValidatorSet);
    });
    it('should get the latest validator set with only verified quorums', async () => {
      const validatorSet = await validators.getValidatorSet(rotationSignature, platformBlockHeight, true);
      expect(validatorSet).to.deep.equal(fixedValidatorSet);
    });
  });
  describe('#getValidatorSetForCoreHeight', () => {
    it('should get the validator set for a specific core height ', async () => {
      const validatorSetForHeight = await validators.getValidatorSetForCoreHeight(rotationSignature, platformBlockHeight, coreBlockHeight);
      expect(validatorSetForHeight).to.deep.equal(fixedValidatorSet);
    });
    it('should get the validator set for a specific core height with only verified quorums', async () => {
      const validatorSetForHeight = await validators.getValidatorSetForCoreHeight(rotationSignature, platformBlockHeight, coreBlockHeight, true);
      expect(validatorSetForHeight).to.deep.equal(fixedValidatorSet);
    });
  });
});
