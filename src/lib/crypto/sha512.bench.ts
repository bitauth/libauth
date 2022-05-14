import type { Sha512 } from '../lib';
import { instantiateSha512 } from '../lib.js';

import { benchmarkHashingFunction } from './hash.bench.helper.js';

benchmarkHashingFunction<Sha512>('sha512', instantiateSha512(), 'sha512');
