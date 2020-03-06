import { instantiateRipemd160, Ripemd160 } from '../lib';

import { benchmarkHashingFunction } from './hash.bench.helper';

// eslint-disable-next-line functional/no-expression-statement
benchmarkHashingFunction<Ripemd160>(
  'ripemd160',
  instantiateRipemd160(),
  'ripemd160'
);
