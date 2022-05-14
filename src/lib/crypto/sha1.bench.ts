import type { Sha1 } from '../lib';
import { instantiateSha1 } from '../lib.js';

import { benchmarkHashingFunction } from './hash.bench.helper.js';

benchmarkHashingFunction<Sha1>('sha1', instantiateSha1(), 'sha1');
