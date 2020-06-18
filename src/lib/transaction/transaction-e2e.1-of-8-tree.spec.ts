/* eslint-disable functional/no-expression-statement, camelcase, @typescript-eslint/naming-convention */

import test from 'ava';

import {
  authenticationTemplateToCompilerBCH,
  CompilationData,
  stringify,
  validateAuthenticationTemplate,
} from '../lib';

import {
  hdPublicKey0H,
  hdPublicKey1H,
  hdPublicKey2H,
  hdPublicKey3H,
  hdPublicKey4H,
  hdPublicKey5H,
  hdPublicKey6H,
  hdPublicKey7H,
  oneOfEightTreeJson,
} from './transaction-e2e.spec.helper';

test('transaction e2e tests: 1-of-8 Tree Signature (fails)', async (t) => {
  const template = validateAuthenticationTemplate(oneOfEightTreeJson);
  if (typeof template === 'string') {
    t.fail(stringify(template));
    return;
  }

  /**
   * The HD public keys shared between the entities at wallet creation time
   */
  const hdPublicKeys = {
    signer_1: hdPublicKey0H,
    signer_2: hdPublicKey1H,
    signer_3: hdPublicKey2H,
    signer_4: hdPublicKey3H,
    signer_5: hdPublicKey4H,
    signer_6: hdPublicKey5H,
    signer_7: hdPublicKey6H,
    signer_8: hdPublicKey7H,
  };

  const lockingData: CompilationData<never> = {
    hdKeys: { addressIndex: 0, hdPublicKeys },
  };

  const lockingScript = 'lock';
  const compiler = await authenticationTemplateToCompilerBCH(template);
  const lockingBytecode = compiler.generateBytecode(lockingScript, lockingData);

  t.false(lockingBytecode.success, stringify(lockingBytecode));
});
