import { instantiateSha1, Sha1 } from '../lib';

import { benchmarkHashingFunction } from './hash.bench.helper';

// eslint-disable-next-line functional/no-expression-statement
benchmarkHashingFunction<Sha1>('sha1', instantiateSha1(), 'sha1');
