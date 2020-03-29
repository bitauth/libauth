/* eslint-disable functional/no-expression-statement, @typescript-eslint/no-magic-numbers */
import {
  getEmbeddedSha256Binary,
  instantiateSha256,
  instantiateSha256Bytes,
  Sha256,
} from '../lib';

import { testHashFunction } from './hash.spec.helper';

// prettier-ignore
const abcHash = new Uint8Array([186, 120, 22, 191, 143, 1, 207, 234, 65, 65, 64, 222, 93, 174, 34, 35, 176, 3, 97, 163, 150, 23, 122, 156, 180, 16, 255, 97, 242, 0, 21, 173]);

// prettier-ignore
const testHash = new Uint8Array([159, 134, 208, 129, 136, 76, 125, 101, 154, 47, 234, 160, 197, 90, 208, 21, 163, 191, 79, 27, 43, 11, 130, 44, 209, 93, 108, 21, 176, 240, 10, 8]);

// prettier-ignore
const bitcoinTsHash = new Uint8Array([197, 172, 209, 87, 32, 54, 111, 116, 79, 74, 33, 12, 216, 172, 180, 55, 181, 8, 52, 10, 69, 75, 79, 77, 6, 145, 161, 201, 161, 182, 67, 158]);

testHashFunction<Sha256>({
  abcHash,
  bitcoinTsHash,
  getEmbeddedBinary: getEmbeddedSha256Binary,
  hashFunctionName: 'sha256',
  instantiate: instantiateSha256,
  instantiateBytes: instantiateSha256Bytes,
  nodeJsAlgorithm: 'sha256',
  testHash,
});
