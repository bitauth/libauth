import { instantiateSha512, Sha512 } from '../lib';

import { benchmarkHashingFunction } from './hash.bench.helper';

// eslint-disable-next-line functional/no-expression-statement
benchmarkHashingFunction<Sha512>('sha512', instantiateSha512(), 'sha512');
