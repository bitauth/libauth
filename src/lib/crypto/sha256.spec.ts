import type { Sha256 } from '../lib';
import {
  getEmbeddedSha256Binary,
  instantiateSha256,
  instantiateSha256Bytes,
} from '../lib.js';

import { testHashFunction } from './hash.spec.helper.js';

// prettier-ignore
const abcHash = new Uint8Array([186, 120, 22, 191, 143, 1, 207, 234, 65, 65, 64, 222, 93, 174, 34, 35, 176, 3, 97, 163, 150, 23, 122, 156, 180, 16, 255, 97, 242, 0, 21, 173]);

// prettier-ignore
const testHash = new Uint8Array([159, 134, 208, 129, 136, 76, 125, 101, 154, 47, 234, 160, 197, 90, 208, 21, 163, 191, 79, 27, 43, 11, 130, 44, 209, 93, 108, 21, 176, 240, 10, 8]);

// prettier-ignore
const libauthHash = new Uint8Array([209, 125, 16, 114, 40, 162, 151, 83, 58, 228, 34, 240, 156, 140, 231, 64, 126, 178, 1, 161, 142, 172, 134, 169, 6, 119, 134, 200, 184, 30, 187, 120]);

testHashFunction<Sha256>({
  abcHash,
  getEmbeddedBinary: getEmbeddedSha256Binary,
  hashFunctionName: 'sha256',
  instantiate: instantiateSha256,
  instantiateBytes: instantiateSha256Bytes,
  libauthHash,
  nodeJsAlgorithm: 'sha256',
  testHash,
});
