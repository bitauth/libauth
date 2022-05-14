import type { Ripemd160 } from '../lib';
import {
  getEmbeddedRipemd160Binary,
  instantiateRipemd160,
  instantiateRipemd160Bytes,
} from '../lib.js';

import { testHashFunction } from './hash.spec.helper.js';

// prettier-ignore
const abcHash = new Uint8Array([142, 178, 8, 247, 224, 93, 152, 122, 155, 4, 74, 142, 152, 198, 176, 135, 241, 90, 11, 252]);

// prettier-ignore
const testHash = new Uint8Array([94, 82, 254, 228, 126, 107, 7, 5, 101, 247, 67, 114, 70, 140, 220, 105, 157, 232, 145, 7]);

// prettier-ignore
const libauthHash = new Uint8Array([110, 49, 102, 23, 96, 92, 29, 1, 244, 107, 255, 233, 7,  87, 156, 120, 131, 157, 28, 239]);

testHashFunction<Ripemd160>({
  abcHash,
  getEmbeddedBinary: getEmbeddedRipemd160Binary,
  hashFunctionName: 'ripemd160',
  instantiate: instantiateRipemd160,
  instantiateBytes: instantiateRipemd160Bytes,
  libauthHash,
  nodeJsAlgorithm: 'ripemd160',
  testHash,
});
