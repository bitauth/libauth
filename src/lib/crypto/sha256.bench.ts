import { benchmarkHashingFunction } from './hash.bench.helper';
import { instantiateSha256, Sha256 } from './sha256';

// tslint:disable:no-expression-statement

benchmarkHashingFunction<Sha256>('sha256', instantiateSha256(), 'sha256');
