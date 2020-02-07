import { benchmarkHashingFunction } from './hash.bench.helper';
import { instantiateSha512, Sha512 } from './sha512';

// eslint-disable-next-line functional/no-expression-statement
benchmarkHashingFunction<Sha512>('sha512', instantiateSha512(), 'sha512');
