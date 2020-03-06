import { instantiateSha256, Sha256 } from '../lib';

import { benchmarkHashingFunction } from './hash.bench.helper';

// eslint-disable-next-line functional/no-expression-statement
benchmarkHashingFunction<Sha256>('sha256', instantiateSha256(), 'sha256');
