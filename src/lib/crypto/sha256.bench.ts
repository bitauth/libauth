import type { Sha256 } from '../lib';
import { instantiateSha256 } from '../lib.js';

import { benchmarkHashingFunction } from './hash.bench.helper.js';

benchmarkHashingFunction<Sha256>('sha256', instantiateSha256(), 'sha256');
