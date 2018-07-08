import { benchmarkHashingFunction } from './hash.bench.helper';
import { instantiateSha512, Sha512 } from './sha512';

// tslint:disable:no-expression-statement

benchmarkHashingFunction<Sha512>('sha512', instantiateSha512(), 'sha512');
