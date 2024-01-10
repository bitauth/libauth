import test from 'ava';

import type { MetadataRegistry } from '../lib.js';
import { importMetadataRegistry } from '../lib.js';

test('importMetadataRegistry: accepts templates as either JSON strings or pre-parsed objects', (t) => {
  const registry: MetadataRegistry = {
    latestRevision: '',
    registryIdentity: { name: '' },
    version: { major: 0, minor: 0, patch: 0 },
  };
  t.deepEqual(registry, importMetadataRegistry(registry));
  t.deepEqual(registry, importMetadataRegistry(JSON.stringify(registry)));
});
