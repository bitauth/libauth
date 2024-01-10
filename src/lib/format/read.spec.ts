import test from 'ava';

import { readItemCount, readMultiple } from '../lib.js';
import { readBytes } from '../message/read-components.js';

test('readMultiple', (t) => {
  t.deepEqual(
    readMultiple({ bin: Uint8Array.from([0, 1, 2, 3, 4]), index: 0 }, [
      readBytes(0),
      readBytes(1),
      readBytes(3),
    ]),
    {
      position: { bin: Uint8Array.from([0, 1, 2, 3, 4]), index: 4 },
      result: [
        Uint8Array.from([]),
        Uint8Array.from([0]),
        Uint8Array.from([1, 2, 3]),
      ],
    },
  );
  t.deepEqual(
    readMultiple({ bin: Uint8Array.from([0, 1, 2, 3, 4]), index: 0 }, [
      readBytes(0),
      readBytes(1),
      readBytes(3),
      readBytes(2),
    ]),
    'Error reading bytes: insufficient length. Provided length: 1',
  );
});

test('readItemCount', (t) => {
  t.deepEqual(
    readItemCount(
      { bin: Uint8Array.from([0, 1, 2, 3, 4]), index: 0 },
      readBytes(2),
    ),
    {
      position: { bin: Uint8Array.from([0, 1, 2, 3, 4]), index: 1 },
      result: [],
    },
  );
  t.deepEqual(
    readItemCount(
      { bin: Uint8Array.from([1, 1, 2, 3, 4]), index: 0 },
      readBytes(2),
    ),
    {
      position: { bin: Uint8Array.from([1, 1, 2, 3, 4]), index: 3 },
      result: [Uint8Array.from([1, 2])],
    },
  );
  t.deepEqual(
    readItemCount(
      { bin: Uint8Array.from([2, 1, 2, 3, 4]), index: 0 },
      readBytes(2),
    ),
    {
      position: { bin: Uint8Array.from([2, 1, 2, 3, 4]), index: 5 },
      result: [Uint8Array.from([1, 2]), Uint8Array.from([3, 4])],
    },
  );
  t.deepEqual(
    readItemCount({ bin: Uint8Array.from([0xfd, 1]), index: 0 }, readBytes(2)),
    'Error reading item count. Error reading CompactUint: insufficient bytes. CompactUint prefix 253 requires at least 3 bytes. Remaining bytes: 2',
  );
  t.deepEqual(
    readItemCount({ bin: Uint8Array.from([1, 1]), index: 0 }, readBytes(2)),
    'Error reading item. Error reading bytes: insufficient length. Provided length: 1',
  );
});
