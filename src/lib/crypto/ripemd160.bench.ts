import { benchmarkHashingFunction } from './hash.bench.helper';
import { instantiateRipemd160, Ripemd160 } from './ripemd160';

// eslint-disable-next-line functional/no-expression-statement
benchmarkHashingFunction<Ripemd160>(
  'ripemd160',
  instantiateRipemd160(),
  'ripemd160'
);
