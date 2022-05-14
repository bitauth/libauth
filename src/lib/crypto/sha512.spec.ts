import type { Sha512 } from '../lib';
import {
  getEmbeddedSha512Binary,
  instantiateSha512,
  instantiateSha512Bytes,
} from '../lib.js';

import { testHashFunction } from './hash.spec.helper.js';

// prettier-ignore
const abcHash = new Uint8Array([221, 175, 53, 161, 147, 97, 122, 186, 204, 65, 115, 73, 174, 32, 65, 49, 18, 230, 250, 78, 137, 169, 126, 162, 10, 158, 238, 230, 75, 85, 211, 154, 33, 146, 153, 42, 39, 79, 193, 168, 54, 186, 60, 35, 163, 254, 235, 189, 69, 77, 68, 35, 100, 60, 232, 14, 42, 154, 201, 79, 165, 76, 164, 159]);

// prettier-ignore
const testHash = new Uint8Array([238, 38, 176, 221, 74, 247, 231, 73, 170, 26, 142, 227, 193, 10, 233, 146, 63, 97, 137, 128, 119, 46, 71, 63, 136, 25, 165, 212, 148, 14, 13, 178, 122, 193, 133, 248, 160, 225, 213, 248, 79, 136, 188, 136, 127, 214, 123, 20, 55, 50, 195, 4, 204, 95, 169, 173, 142, 111, 87, 245, 0, 40, 168, 255]);

// prettier-ignore
const libauthHash = new Uint8Array([27, 119, 76, 47, 15, 63, 203, 10, 157, 198, 236, 115, 55, 254, 4, 166, 127, 194, 140, 208, 81, 198, 141, 31, 81, 27, 240, 215, 32, 131, 13, 206, 240, 192, 196, 5, 189, 226, 121, 119, 173, 141, 227, 101, 2, 146, 59, 6, 120, 5, 24, 222, 22, 230, 116, 153, 116, 205, 56, 40, 138, 26, 29, 230]);

testHashFunction<Sha512>({
  abcHash,
  getEmbeddedBinary: getEmbeddedSha512Binary,
  hashFunctionName: 'sha512',
  instantiate: instantiateSha512,
  instantiateBytes: instantiateSha512Bytes,
  libauthHash,
  nodeJsAlgorithm: 'sha512',
  testHash,
});
