/* eslint-disable functional/no-expression-statement, @typescript-eslint/no-magic-numbers */
import {
  getEmbeddedSha1Binary,
  instantiateSha1,
  instantiateSha1Bytes,
  Sha1,
} from '../lib';

import { testHashFunction } from './hash.spec.helper';

// prettier-ignore
const abcHash = new Uint8Array([169, 153, 62, 54, 71, 6, 129, 106, 186, 62, 37, 113, 120, 80, 194, 108, 156, 208, 216, 157]);

// prettier-ignore
const testHash = new Uint8Array([169, 74, 143, 229, 204, 177, 155, 166, 28, 76, 8, 115, 211, 145, 233, 135, 152, 47, 187, 211]);

// prettier-ignore
const bitcoinTsHash = new Uint8Array([172, 243, 119, 55, 165, 187, 137, 56, 129, 102, 231, 172, 37, 23, 43, 80, 241, 124, 241, 186]);

testHashFunction<Sha1>({
  abcHash,
  bitcoinTsHash,
  getEmbeddedBinary: getEmbeddedSha1Binary,
  hashFunctionName: 'sha1',
  instantiate: instantiateSha1,
  instantiateBytes: instantiateSha1Bytes,
  nodeJsAlgorithm: 'sha1',
  testHash,
});
