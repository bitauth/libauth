import type { Ripemd160 } from '../lib';
import { instantiateRipemd160 } from '../lib.js';

import { benchmarkHashingFunction } from './hash.bench.helper.js';

benchmarkHashingFunction<Ripemd160>(
  'ripemd160',
  instantiateRipemd160(),
  'ripemd160'
);
