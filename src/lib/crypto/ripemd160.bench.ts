import { benchmarkHashingFunction } from './hash.bench';
import { instantiateRipemd160, Ripemd160 } from './ripemd160';

// tslint:disable:no-expression-statement

benchmarkHashingFunction<Ripemd160>(
  'ripemd160',
  instantiateRipemd160(),
  'ripemd160'
);
