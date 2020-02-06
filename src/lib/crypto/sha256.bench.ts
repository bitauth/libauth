import { benchmarkHashingFunction } from './hash.bench.helper';
import { instantiateSha256, Sha256 } from './sha256';

// eslint-disable-next-line functional/no-expression-statement
benchmarkHashingFunction<Sha256>('sha256', instantiateSha256(), 'sha256');
