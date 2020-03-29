/* eslint-disable functional/no-expression-statement, @typescript-eslint/no-magic-numbers */
import {
  getEmbeddedRipemd160Binary,
  instantiateRipemd160,
  instantiateRipemd160Bytes,
  Ripemd160,
} from '../lib';

import { testHashFunction } from './hash.spec.helper';

// prettier-ignore
const abcHash = new Uint8Array([142, 178, 8, 247, 224, 93, 152, 122, 155, 4, 74, 142, 152, 198, 176, 135, 241, 90, 11, 252]);

// prettier-ignore
const testHash = new Uint8Array([94, 82, 254, 228, 126, 107, 7, 5, 101, 247, 67, 114, 70, 140, 220, 105, 157, 232, 145, 7]);

// prettier-ignore
const bitcoinTsHash = new Uint8Array([114, 23, 190, 127, 93, 117, 57, 29, 77, 27, 233, 75, 218, 102, 121, 213, 45, 101, 210, 199]);

testHashFunction<Ripemd160>({
  abcHash,
  bitcoinTsHash,
  getEmbeddedBinary: getEmbeddedRipemd160Binary,
  hashFunctionName: 'ripemd160',
  instantiate: instantiateRipemd160,
  instantiateBytes: instantiateRipemd160Bytes,
  nodeJsAlgorithm: 'ripemd160',
  testHash,
});
