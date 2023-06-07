import test from 'ava';

import { hexToBin, hmacSha256, hmacSha512, pbkdf2, utf8ToBin } from '../lib.js';

// NOTE: The RFC does not provide test vectors for SHA2 hash functions.
// The following have been used: https://github.com/brycx/Test-Vector-Generation/blob/master/PBKDF2/pbkdf2-hmac-sha2-test-vectors.md

// Test Case 1
test('[crypto] pbkdf2 - 1 iteration, 20 byte key length', (t) => {
  const parameters = {
    password: utf8ToBin('password'),
    salt: utf8ToBin('salt'),
    iterations: 1,
    derivedKeyLength: 20,
  };

  const expectedSha256 = hexToBin('120fb6cffcf8b32c43e7225256c4f837a86548c9');
  const expectedSha512 = hexToBin('867f70cf1ade02cff3752599a3a53dc4af34c7a6');

  t.deepEqual(pbkdf2(parameters, hmacSha256, 32), expectedSha256);
  t.deepEqual(pbkdf2(parameters, hmacSha512, 64), expectedSha512);
});

// Test Case 2
test('[crypto] pbkdf2 - 2 iterations, 20 byte key length', (t) => {
  const parameters = {
    password: utf8ToBin('password'),
    salt: utf8ToBin('salt'),
    iterations: 2,
    derivedKeyLength: 20,
  };

  const expectedSha256 = hexToBin('ae4d0c95af6b46d32d0adff928f06dd02a303f8e');
  const expectedSha512 = hexToBin('e1d9c16aa681708a45f5c7c4e215ceb66e011a2e');

  t.deepEqual(pbkdf2(parameters, hmacSha256, 32), expectedSha256);
  t.deepEqual(pbkdf2(parameters, hmacSha512, 64), expectedSha512);
});

// Test Case 3
test('[crypto] pbkdf2 - 4096 iterations, 20 byte key length', (t) => {
  const parameters = {
    password: utf8ToBin('password'),
    salt: utf8ToBin('salt'),
    iterations: 4096,
    derivedKeyLength: 20,
  };

  const expectedSha256 = hexToBin('c5e478d59288c841aa530db6845c4c8d962893a0');
  const expectedSha512 = hexToBin('d197b1b33db0143e018b12f3d1d1479e6cdebdcc');

  t.deepEqual(pbkdf2(parameters, hmacSha256, 32), expectedSha256);
  t.deepEqual(pbkdf2(parameters, hmacSha512, 64), expectedSha512);
});

test('[crypto] pbkdf2 - 4096 iterations, 20 byte key length', (t) => {
  const parameters = {
    password: utf8ToBin('password'),
    salt: utf8ToBin('salt'),
    iterations: 0,
    derivedKeyLength: 20,
  };

  const expectedSha256 = hexToBin('c5e478d59288c841aa530db6845c4c8d962893a0');
  const expectedSha512 = hexToBin('d197b1b33db0143e018b12f3d1d1479e6cdebdcc');

  t.deepEqual(pbkdf2(parameters, hmacSha256, 32), expectedSha256);
  t.deepEqual(pbkdf2(parameters, hmacSha512, 64), expectedSha512);
});

/*
 * // Test Case 2
 *test('[crypto] pbkdf2 - Sha512, 2 iteration, 20 byte key length', (t) => {
 *  const password = utf8ToBin('password');
 *  const salt = utf8ToBin('salt');
 *  const iterations = 2;
 *  const dkLengthBits = 20;
 *  const expected = hexToBin('e1d9c16aa681708a45f5c7c4e215ceb66e011a2e');
 *
 *  t.deepEqual(pbkdf2(password, salt, iterations, dkLengthBits), expected);
 *});
 *
 * // Test Case 3
 *test('[crypto] pbkdf2 - Sha512, 4096 iteration, 20 byte key length', (t) => {
 *  const password = utf8ToBin('password');
 *  const salt = utf8ToBin('salt');
 *  const iterations = 4096;
 *  const dkLengthBits = 20;
 *  const expected = hexToBin('d197b1b33db0143e018b12f3d1d1479e6cdebdcc');
 *
 *  t.deepEqual(pbkdf2(password, salt, iterations, dkLengthBits), expected);
 *});
 *
 * // Test Case 4 (Omitted due to high iteration count)
 *
 * // Test Case 5
 *test('[crypto] pbkdf2 - Sha512, 4096 iteration, 25 byte key length', (t) => {
 *  const password = utf8ToBin('passwordPASSWORDpassword');
 *  const salt = utf8ToBin('saltSALTsaltSALTsaltSALTsaltSALTsalt');
 *  const iterations = 4096;
 *  const dkLengthBits = 25;
 *  const expected = hexToBin(
 *    '8c0511f4c6e597c6ac6315d8f0362e225f3c501495ba23b868'
 *  );
 *
 *  t.deepEqual(pbkdf2(password, salt, iterations, dkLengthBits), expected);
 *});
 *
 * // Test Case 6
 *test('[crypto] pbkdf2 - Sha512, 4096 iteration, 128 byte key length', (t) => {
 *  const password = utf8ToBin('pass\0word');
 *  const salt = utf8ToBin('sa\0lt');
 *  const iterations = 4096;
 *  const dkLengthBits = 16;
 *  const expected = hexToBin('9d9e9c4cd21fe4be24d5b8244c759665');
 *
 *  t.deepEqual(pbkdf2(password, salt, iterations, dkLengthBits), expected);
 *});
 *
 * // Test Case 7
 *test('[crypto] pbkdf2 - Sha512, 1 iteration, 16 byte key length', (t) => {
 *  const password = utf8ToBin('passwd');
 *  const salt = utf8ToBin('salt');
 *  const iterations = 1;
 *  const dkLengthBits = 128;
 *  const expected = hexToBin(
 *    'c74319d99499fc3e9013acff597c23c5baf0a0bec5634c46b8352b793e324723d55caa76b2b25c43402dcfdc06cdcf66f95b7d0429420b39520006749c51a04ef3eb99e576617395a178ba33214793e48045132928a9e9bf2661769fdc668f31798597aaf6da70dd996a81019726084d70f152baed8aafe2227c07636c6ddece'
 *  );
 *
 *  t.deepEqual(pbkdf2(password, salt, iterations, dkLengthBits), expected);
 *});
 *
 * // Test Case 8 (Omitted due to high iteration count).
 *
 * // Test Case 9
 *test('[crypto] pbkdf2 - Sha512, 4096 iteration, 256 byte key length', (t) => {
 *  const password = utf8ToBin('Password');
 *  const salt = utf8ToBin('sa\0lt');
 *  const iterations = 4096;
 *  const dkLengthBits = 256;
 *  const expected = hexToBin(
 *    '10176fb32cb98cd7bb31e2bb5c8f6e425c103333a2e496058e3fd2bd88f657485c89ef92daa0668316bc23ebd1ef88f6dd14157b2320b5d54b5f26377c5dc279b1dcdec044bd6f91b166917c80e1e99ef861b1d2c7bce1b961178125fb86867f6db489a2eae0022e7bc9cf421f044319fac765d70cb89b45c214590e2ffb2c2b565ab3b9d07571fde0027b1dc57f8fd25afa842c1056dd459af4074d7510a0c020b914a5e202445d4d3f151070589dd6a2554fc506018c4f001df6239643dc86771286ae4910769d8385531bba57544d63c3640b90c98f1445ebdd129475e02086b600f0beb5b05cc6ca9b3633b452b7dad634e9336f56ec4c3ac0b4fe54ced8'
 *  );
 *
 *  t.deepEqual(pbkdf2(password, salt, iterations, dkLengthBits), expected);
 *});
 */
