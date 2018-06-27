// tslint:disable:no-expression-statement
import { testHashFunction } from './hash.spec';
import {
  getEmbeddedRipemd160Binary,
  instantiateRipemd160,
  instantiateRipemd160Bytes,
  Ripemd160
} from './ripemd160';

// prettier-ignore
const abcHash = new Uint8Array([142, 178, 8, 247, 224, 93, 152, 122, 155, 4, 74, 142, 152, 198, 176, 135, 241, 90, 11, 252]);

// prettier-ignore
const testHash = new Uint8Array([94, 82, 254, 228, 126, 107, 7, 5, 101, 247, 67, 114, 70, 140, 220, 105, 157, 232, 145, 7]);

// prettier-ignore
const bitcoinTsHash = new Uint8Array([114, 23, 190, 127, 93, 117, 57, 29, 77, 27, 233, 75, 218, 102, 121, 213, 45, 101, 210, 199]);

testHashFunction<Ripemd160>(
  'ripemd160',
  getEmbeddedRipemd160Binary,
  instantiateRipemd160,
  instantiateRipemd160Bytes,
  abcHash,
  testHash,
  bitcoinTsHash,
  'ripemd160'
);
