import type { PossibleTestValue, VmbTestDefinitionGroup } from '../../lib.js';
import { generateTestCases, setExpectedResults } from '../bch-vmb-test-utils.js';

const nopOps: PossibleTestValue[] = [
  ['OP_NOP', 'OP_NOP'],
  ['OP_NOP1', 'OP_NOP1'],
  ['OP_NOP4', 'OP_NOP4'],
  ['OP_NOP5', 'OP_NOP5'],
  ['OP_NOP6', 'OP_NOP6'],
  ['OP_NOP7', 'OP_NOP7'],
  ['OP_NOP8', 'OP_NOP8'],
  ['OP_NOP9', 'OP_NOP9'],
  ['OP_NOP10', 'OP_NOP10'],
];

export default [
  [
    'OP_NOP1-OP_NOP10 expansion range',
    [
      ...setExpectedResults(generateTestCases(['<1>', '$0', '$0 in locking bytecode'], [nopOps]), {
        'OP_NOP in locking bytecode': [],
        'OP_NOP1 in locking bytecode': ['nonstandard'],
        'OP_NOP10 in locking bytecode': ['nonstandard'],
        'OP_NOP4 in locking bytecode': ['nonstandard'],
        'OP_NOP5 in locking bytecode': ['nonstandard'],
        'OP_NOP6 in locking bytecode': ['nonstandard'],
        'OP_NOP7 in locking bytecode': ['nonstandard'],
        'OP_NOP8 in locking bytecode': ['nonstandard'],
        'OP_NOP9 in locking bytecode': ['nonstandard'],
      }),
      ...setExpectedResults(generateTestCases(['<0>', 'OP_IF $0 OP_ENDIF <1>', 'Unexecuted $0 in locking bytecode'], [nopOps]), {
        'Unexecuted OP_NOP in locking bytecode': [],
        'Unexecuted OP_NOP1 in locking bytecode': [],
        'Unexecuted OP_NOP10 in locking bytecode': [],
        'Unexecuted OP_NOP4 in locking bytecode': [],
        'Unexecuted OP_NOP5 in locking bytecode': [],
        'Unexecuted OP_NOP6 in locking bytecode': [],
        'Unexecuted OP_NOP7 in locking bytecode': [],
        'Unexecuted OP_NOP8 in locking bytecode': [],
        'Unexecuted OP_NOP9 in locking bytecode': [],
      }),
      ...setExpectedResults(generateTestCases(['$0', '<1>', '$0 in unlocking bytecode'], [nopOps]), {
        'OP_NOP in unlocking bytecode': ['invalid'],
        'OP_NOP1 in unlocking bytecode': ['invalid'],
        'OP_NOP10 in unlocking bytecode': ['invalid'],
        'OP_NOP4 in unlocking bytecode': ['invalid'],
        'OP_NOP5 in unlocking bytecode': ['invalid'],
        'OP_NOP6 in unlocking bytecode': ['invalid'],
        'OP_NOP7 in unlocking bytecode': ['invalid'],
        'OP_NOP8 in unlocking bytecode': ['invalid'],
        'OP_NOP9 in unlocking bytecode': ['invalid'],
      }),
      ...setExpectedResults(generateTestCases(['<0> OP_IF $0 OP_ENDIF', '<1>', 'Unexecuted $0 in unlocking bytecode'], [nopOps]), {
        'Unexecuted OP_NOP in unlocking bytecode': ['invalid'],
        'Unexecuted OP_NOP1 in unlocking bytecode': ['invalid'],
        'Unexecuted OP_NOP10 in unlocking bytecode': ['invalid'],
        'Unexecuted OP_NOP4 in unlocking bytecode': ['invalid'],
        'Unexecuted OP_NOP5 in unlocking bytecode': ['invalid'],
        'Unexecuted OP_NOP6 in unlocking bytecode': ['invalid'],
        'Unexecuted OP_NOP7 in unlocking bytecode': ['invalid'],
        'Unexecuted OP_NOP8 in unlocking bytecode': ['invalid'],
        'Unexecuted OP_NOP9 in unlocking bytecode': ['invalid'],
      }),
    ],
  ],
] as const satisfies VmbTestDefinitionGroup[];
