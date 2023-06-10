import test from 'ava';

import { hexToBin, hmacSha256, hmacSha512, pbkdf2, utf8ToBin } from '../lib.js';
import type { Pbkdf2Parameters } from '../lib.js';

const pbkdf2HmacSha256 = {
  hmacFunction: hmacSha256,
  hmacLength: 32,
};

const pbkdf2HmacSha512 = {
  hmacFunction: hmacSha512,
  hmacLength: 64,
};

const vectors = test.macro<
  [
    {
      parameters: Pbkdf2Parameters;
      expectedSha256: Uint8Array;
      expectedSha512: Uint8Array;
    }
  ]
>({
  exec: (t, vector) => {
    t.deepEqual(
      pbkdf2(vector.parameters, pbkdf2HmacSha256),
      vector.expectedSha256
    );
    t.deepEqual(
      pbkdf2(vector.parameters, pbkdf2HmacSha512),
      vector.expectedSha512
    );
  },
  title: (title) => `[crypto] PBKDF2 Test Vector #${title ?? '?'} (RFC 2898)`,
});

/*
 * NOTE: RFC 2898 does NOT provide test vectors for SHA2 hash functions.
 * The following have been used instead: https://github.com/brycx/Test-Vector-Generation/blob/master/PBKDF2/pbkdf2-hmac-sha2-test-vectors.md
 */

test('1', vectors, {
  expectedSha256: hexToBin('120fb6cffcf8b32c43e7225256c4f837a86548c9'),
  expectedSha512: hexToBin('867f70cf1ade02cff3752599a3a53dc4af34c7a6'),
  parameters: {
    derivedKeyLength: 20,
    iterations: 1,
    password: utf8ToBin('password'),
    salt: utf8ToBin('salt'),
  },
});

test('2', vectors, {
  expectedSha256: hexToBin('ae4d0c95af6b46d32d0adff928f06dd02a303f8e'),
  expectedSha512: hexToBin('e1d9c16aa681708a45f5c7c4e215ceb66e011a2e'),
  parameters: {
    derivedKeyLength: 20,
    iterations: 2,
    password: utf8ToBin('password'),
    salt: utf8ToBin('salt'),
  },
});

test('3', vectors, {
  expectedSha256: hexToBin('c5e478d59288c841aa530db6845c4c8d962893a0'),
  expectedSha512: hexToBin('d197b1b33db0143e018b12f3d1d1479e6cdebdcc'),
  parameters: {
    derivedKeyLength: 20,
    iterations: 4096,
    password: utf8ToBin('password'),
    salt: utf8ToBin('salt'),
  },
});

// NOTE: Skipped due to high iteration count.
test.skip('4', vectors, {
  expectedSha256: hexToBin('cf81c66fe8cfc04d1f31ecb65dab4089f7f179e8'),
  expectedSha512: hexToBin('6180a3ceabab45cc3964112c811e0131bca93a35'),
  parameters: {
    derivedKeyLength: 20,
    iterations: 16777216,
    password: utf8ToBin('password'),
    salt: utf8ToBin('salt'),
  },
});

test('5', vectors, {
  expectedSha256: hexToBin(
    '348c89dbcbd32b2f32d814b8116e84cf2b17347ebc1800181c'
  ),
  expectedSha512: hexToBin(
    '8c0511f4c6e597c6ac6315d8f0362e225f3c501495ba23b868'
  ),
  parameters: {
    derivedKeyLength: 25,
    iterations: 4096,
    password: utf8ToBin('passwordPASSWORDpassword'),
    salt: utf8ToBin('saltSALTsaltSALTsaltSALTsaltSALTsalt'),
  },
});

test('6', vectors, {
  expectedSha256: hexToBin('89b69d0516f829893c696226650a8687'),
  expectedSha512: hexToBin('9d9e9c4cd21fe4be24d5b8244c759665'),
  parameters: {
    derivedKeyLength: 16,
    iterations: 4096,
    password: utf8ToBin('pass\0word'),
    salt: utf8ToBin('sa\0lt'),
  },
});

test('7', vectors, {
  expectedSha256: hexToBin(
    '55ac046e56e3089fec1691c22544b605f94185216dde0465e68b9d57c20dacbc49ca9cccf179b645991664b39d77ef317c71b845b1e30bd509112041d3a19783c294e850150390e1160c34d62e9665d659ae49d314510fc98274cc79681968104b8f89237e69b2d549111868658be62f59bd715cac44a1147ed5317c9bae6b2a'
  ),
  expectedSha512: hexToBin(
    'c74319d99499fc3e9013acff597c23c5baf0a0bec5634c46b8352b793e324723d55caa76b2b25c43402dcfdc06cdcf66f95b7d0429420b39520006749c51a04ef3eb99e576617395a178ba33214793e48045132928a9e9bf2661769fdc668f31798597aaf6da70dd996a81019726084d70f152baed8aafe2227c07636c6ddece'
  ),
  parameters: {
    derivedKeyLength: 128,
    iterations: 1,
    password: utf8ToBin('passwd'),
    salt: utf8ToBin('salt'),
  },
});

// NOTE: Skipped due to high iteration count.
test.skip('8', vectors, {
  expectedSha256: hexToBin(
    '4ddcd8f60b98be21830cee5ef22701f9641a4418d04c0414aeff08876b34ab56a1d425a1225833549adb841b51c9b3176a272bdebba1d078478f62b397f33c8d62aae85a11cdde829d89cb6ffd1ab0e63a981f8747d2f2f9fe5874165c83c168d2eed1d2d5ca4052dec2be5715623da019b8c0ec87dc36aa751c38f9893d15c3'
  ),
  expectedSha512: hexToBin(
    'e6337d6fbeb645c794d4a9b5b75b7b30dac9ac50376a91df1f4460f6060d5addb2c1fd1f84409abacc67de7eb4056e6bb06c2d82c3ef4ccd1bded0f675ed97c65c33d39f81248454327aa6d03fd049fc5cbb2b5e6dac08e8ace996cdc960b1bd4530b7e754773d75f67a733fdb99baf6470e42ffcb753c15c352d4800fb6f9d6'
  ),
  parameters: {
    derivedKeyLength: 128,
    iterations: 80000,
    password: utf8ToBin('Password'),
    salt: utf8ToBin('NaCl'),
  },
});

test('9', vectors, {
  expectedSha256: hexToBin(
    '436c82c6af9010bb0fdb274791934ac7dee21745dd11fb57bb90112ab187c495ad82df776ad7cefb606f34fedca59baa5922a57f3e91bc0e11960da7ec87ed0471b456a0808b60dff757b7d313d4068bf8d337a99caede24f3248f87d1bf16892b70b076a07dd163a8a09db788ae34300ff2f2d0a92c9e678186183622a636f4cbce15680dfea46f6d224e51c299d4946aa2471133a649288eef3e4227b609cf203dba65e9fa69e63d35b6ff435ff51664cbd6773d72ebc341d239f0084b004388d6afa504eee6719a7ae1bb9daf6b7628d851fab335f1d13948e8ee6f7ab033a32df447f8d0950809a70066605d6960847ed436fa52cdfbcf261b44d2a87061'
  ),
  expectedSha512: hexToBin(
    '10176fb32cb98cd7bb31e2bb5c8f6e425c103333a2e496058e3fd2bd88f657485c89ef92daa0668316bc23ebd1ef88f6dd14157b2320b5d54b5f26377c5dc279b1dcdec044bd6f91b166917c80e1e99ef861b1d2c7bce1b961178125fb86867f6db489a2eae0022e7bc9cf421f044319fac765d70cb89b45c214590e2ffb2c2b565ab3b9d07571fde0027b1dc57f8fd25afa842c1056dd459af4074d7510a0c020b914a5e202445d4d3f151070589dd6a2554fc506018c4f001df6239643dc86771286ae4910769d8385531bba57544d63c3640b90c98f1445ebdd129475e02086b600f0beb5b05cc6ca9b3633b452b7dad634e9336f56ec4c3ac0b4fe54ced8'
  ),
  parameters: {
    derivedKeyLength: 256,
    iterations: 4096,
    password: utf8ToBin('Password'),
    salt: utf8ToBin('sa\0lt'),
  },
});
