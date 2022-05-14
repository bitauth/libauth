import { instantiateRipemd160 } from './ripemd160.js';
import { instantiateSecp256k1 } from './secp256k1.js';
import { instantiateSha1 } from './sha1.js';
import { instantiateSha256 } from './sha256.js';
import { instantiateSha512 } from './sha512.js';

const [sha1, sha256, sha512, ripemd160, secp256k1] = await Promise.all([
  instantiateSha1(),
  instantiateSha256(),
  instantiateSha512(),
  instantiateRipemd160(),
  instantiateSecp256k1(),
]);

export { ripemd160, secp256k1, sha1, sha256, sha512 };
