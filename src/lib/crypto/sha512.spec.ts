/* eslint-disable functional/no-expression-statement, @typescript-eslint/no-magic-numbers */
import {
  getEmbeddedSha512Binary,
  instantiateSha512,
  instantiateSha512Bytes,
  Sha512,
} from '../lib';

import { testHashFunction } from './hash.spec.helper';

// prettier-ignore
const abcHash = new Uint8Array([221, 175, 53, 161, 147, 97, 122, 186, 204, 65, 115, 73, 174, 32, 65, 49, 18, 230, 250, 78, 137, 169, 126, 162, 10, 158, 238, 230, 75, 85, 211, 154, 33, 146, 153, 42, 39, 79, 193, 168, 54, 186, 60, 35, 163, 254, 235, 189, 69, 77, 68, 35, 100, 60, 232, 14, 42, 154, 201, 79, 165, 76, 164, 159]);

// prettier-ignore
const testHash = new Uint8Array([238, 38, 176, 221, 74, 247, 231, 73, 170, 26, 142, 227, 193, 10, 233, 146, 63, 97, 137, 128, 119, 46, 71, 63, 136, 25, 165, 212, 148, 14, 13, 178, 122, 193, 133, 248, 160, 225, 213, 248, 79, 136, 188, 136, 127, 214, 123, 20, 55, 50, 195, 4, 204, 95, 169, 173, 142, 111, 87, 245, 0, 40, 168, 255]);

// prettier-ignore
const bitcoinTsHash = new Uint8Array([199, 3, 62, 254, 211, 112, 236, 45, 153, 174, 172, 201, 56, 4, 81, 75, 63, 108, 8, 154, 220, 157, 74, 51, 3, 125, 152, 147, 138, 57, 239, 39, 144, 71, 255, 181, 173, 73, 150, 146, 149, 26, 151, 201, 54, 28, 80, 219, 128, 183, 24, 114, 55, 231, 4, 126, 200, 17, 11, 95, 50, 70, 85, 60]);

testHashFunction<Sha512>({
  abcHash,
  bitcoinTsHash,
  getEmbeddedBinary: getEmbeddedSha512Binary,
  hashFunctionName: 'sha512',
  instantiate: instantiateSha512,
  instantiateBytes: instantiateSha512Bytes,
  nodeJsAlgorithm: 'sha512',
  testHash,
});
