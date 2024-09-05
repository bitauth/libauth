import { instantiateRipemd160 } from './ripemd160.js';
import { instantiateSecp256k1 } from './secp256k1.js';
import { instantiateSha1 } from './sha1.js';
import { instantiateSha256 } from './sha256.js';
import { instantiateSha512 } from './sha512.js';
let ripemd160,secp256k1,sha1,sha256, sha512;
instantiateRipemd160()  .then(a => ripemd160 = a);
instantiateSecp256k1()  .then(b => secp256k1 = b);
instantiateSha1()       .then(c => sha1 = c);
instantiateSha256()     .then(d => sha256 = d);
instantiateSha512()     .then(e => sha512 = e);

export { ripemd160, secp256k1, sha1, sha256, sha512 };
