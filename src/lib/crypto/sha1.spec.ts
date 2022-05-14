import type { Sha1 } from '../lib';
import {
  getEmbeddedSha1Binary,
  instantiateSha1,
  instantiateSha1Bytes,
} from '../lib.js';

import { testHashFunction } from './hash.spec.helper.js';

// prettier-ignore
const abcHash = new Uint8Array([169, 153, 62, 54, 71, 6, 129, 106, 186, 62, 37, 113, 120, 80, 194, 108, 156, 208, 216, 157]);

// prettier-ignore
const testHash = new Uint8Array([169, 74, 143, 229, 204, 177, 155, 166, 28, 76, 8, 115, 211, 145, 233, 135, 152, 47, 187, 211]);

// prettier-ignore
const libauthHash = new Uint8Array([0, 53, 165, 162, 96, 82, 50, 137, 170, 76, 156, 212, 51, 123, 185, 71, 205, 18, 93, 14]);

testHashFunction<Sha1>({
  abcHash,
  getEmbeddedBinary: getEmbeddedSha1Binary,
  hashFunctionName: 'sha1',
  instantiate: instantiateSha1,
  instantiateBytes: instantiateSha1Bytes,
  libauthHash,
  nodeJsAlgorithm: 'sha1',
  testHash,
});
