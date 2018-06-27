// tslint:disable:no-expression-statement no-magic-numbers
import { testHashFunction } from './hash.spec';
import {
  getEmbeddedSha1Binary,
  instantiateSha1,
  instantiateSha1Bytes,
  Sha1
} from './sha1';

// prettier-ignore
const abcHash = new Uint8Array([169, 153, 62, 54, 71, 6, 129, 106, 186, 62, 37, 113, 120, 80, 194, 108, 156, 208, 216, 157]);

// prettier-ignore
const testHash = new Uint8Array([169, 74, 143, 229, 204, 177, 155, 166, 28, 76, 8, 115, 211, 145, 233, 135, 152, 47, 187, 211]);

// prettier-ignore
const bitcoinTsHash = new Uint8Array([172, 243, 119, 55, 165, 187, 137, 56, 129, 102, 231, 172, 37, 23, 43, 80, 241, 124, 241, 186]);

testHashFunction<Sha1>(
  'sha1',
  getEmbeddedSha1Binary,
  instantiateSha1,
  instantiateSha1Bytes,
  abcHash,
  testHash,
  bitcoinTsHash,
  'sha1'
);
