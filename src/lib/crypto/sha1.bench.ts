import { benchmarkHashingFunction } from './hash.bench.helper';
import { instantiateSha1, Sha1 } from './sha1';

// eslint-disable-next-line functional/no-expression-statement
benchmarkHashingFunction<Sha1>('sha1', instantiateSha1(), 'sha1');
