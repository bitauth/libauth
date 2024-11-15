/* eslint-disable @typescript-eslint/no-magic-numbers */

import { binToHex, hexToBin, range } from '../format/format.js';
import {
  bigIntToVmNumber,
  ConsensusBch2025,
  generateCombinations,
  type PossibleTestValue,
  type TestValues,
  vmNumberToBigInt,
} from '../lib.js';

import { repeat } from './bch-vmb-test-mixins.js';

export const positiveZeros: PossibleTestValue[] = [
  ['zero', '0'],
  ['padded zero', '0x00'],
];
export const zeros: PossibleTestValue[] = [
  ...positiveZeros,
  ['negative zero', '0x80'],
  ['padded negative zero', '0x0080'],
];
export const giantZeros: PossibleTestValue[] = [
  ['padded zero (520 bytes)', repeat('0x00', 520)],
  ['padded negative zero (520 bytes)', `${repeat('0x00', 519)} 0x80`],
  ['padded zero (521 bytes)', repeat('0x00', 521)],
  ['padded negative zero (521 bytes)', `${repeat('0x00', 520)} 0x80`],
];
export const allZeros = [...zeros, ...giantZeros];
export const ones: PossibleTestValue[] = [
  ['one', '1'],
  ['padded one', '0x0100'],
  ['negative one', '-1'],
  ['padded negative one', '0x0180'],
];
export const giantOnes: PossibleTestValue[] = [
  ['padded one (520 bytes)', `0x01 ${repeat('0x00', 519)}`],
  ['padded negative one (520 bytes)', `0x01 ${repeat('0x00', 518)} 0x80`],
  ['padded one (521 bytes)', `0x01 ${repeat('0x00', 520)}`],
  ['padded negative one (521 bytes)', `0x01 ${repeat('0x00', 519)} 0x80`],
];
export const smallZerosAndOnes = [...zeros, ...ones];
export const zerosAndOnes = [...smallZerosAndOnes, ...giantZeros, ...giantOnes];
export const justZeroAndOne: PossibleTestValue[] = [
  ['zero', '0'],
  ['one', '1'],
];
export const unaryOpcodes: PossibleTestValue[] = [
  'OP_BIN2NUM',
  'OP_1ADD',
  'OP_1SUB',
  'OP_NEGATE',
  'OP_ABS',
  'OP_NOT',
  'OP_0NOTEQUAL',
].map((value) => [value, value]);
export const binaryOpcodes: PossibleTestValue[] = [
  'OP_NUM2BIN',
  'OP_ADD',
  'OP_SUB',
  'OP_BOOLAND',
  'OP_BOOLOR',
  'OP_NUMEQUAL',
  'OP_NUMEQUALVERIFY',
  'OP_NUMNOTEQUAL',
  'OP_LESSTHAN',
  'OP_LESSTHANOREQUAL',
  'OP_GREATERTHAN',
  'OP_GREATERTHANOREQUAL',
  'OP_MIN',
  'OP_MAX',
  'OP_MUL',
  'OP_DIV',
  'OP_MOD',
].map((value) => [value, value]);
export const ternaryOpcodes: PossibleTestValue[] = [['OP_WITHIN', 'OP_WITHIN']];

/**
 * Excludes `10000` because a 10,000 byte number can't be pushed directly given the maximum bytecode length of 10,000. Other tests instead construct a 10,000 byte item on the stack.
 */
export const bigintNumberLengths = [1, 8, 64, 512, 4096, 8192];
export const generateBenchmarkNumbers = (
  fill: [fillDescription: string, fillHex: string],
  setHighBit = false,
) =>
  bigintNumberLengths.map<PossibleTestValue>((length) => {
    const value = range(length)
      .map(() => fill[1])
      .join('');
    const valid = setHighBit ? `${value.slice(0, -2)}01` : value;
    return [`${length}-byte number (${fill[0]})`, valid];
  });
export const benchmarkNumberPossibilities = {
  allBits: generateBenchmarkNumbers(['all bits set', 'ff']),
  alternatingBits: generateBenchmarkNumbers(['alternating bits set', '55']),
  highestBit: generateBenchmarkNumbers(['highest-bit set', '00'], true),
  oneBitPerByte: generateBenchmarkNumbers(['one bit set per byte', '01']),
};
export const benchmarkNumberPossibilitiesAll = Object.values(
  benchmarkNumberPossibilities,
)
  .flat()
  .map((testCase) => [testCase]);

export const appendNumericResult = (
  testValues: TestValues[],
  operation: (...args: bigint[]) => bigint,
  expectedLength: number,
) =>
  testValues.map<TestValues>((possibilities) => {
    if (possibilities.length !== expectedLength) {
      // eslint-disable-next-line functional/no-throw-statements
      throw new Error(
        `Libauth VMB test generation error: Expected ${expectedLength} values, but got ${possibilities.length}`,
      );
    }
    const values = possibilities.map(([description, value]) => {
      const num = vmNumberToBigInt(hexToBin(value), {
        maximumVmNumberByteLength: ConsensusBch2025.maximumVmNumberByteLength,
      });
      if (typeof num === 'string')
        // eslint-disable-next-line functional/no-throw-statements
        throw new Error(
          `Libauth VMB test generation error while parsing number: "${description}". Error: ${num}`,
        );
      return num;
    });
    const result = operation(...values);
    return [...possibilities, ['result', binToHex(bigIntToVmNumber(result))]];
  });
export const appendUnaryNumericResult = (
  testValues: TestValues[],
  operation: (value: bigint) => bigint,
) => appendNumericResult(testValues, operation, 1);
export const appendBinaryNumericResult = (
  testValues: TestValues[],
  operation: (value1: bigint, value2: bigint) => bigint,
) => appendNumericResult(testValues, operation, 2);
export const appendTernaryNumericResult = (
  testValues: TestValues[],
  operation: (value1: bigint, value2: bigint, value3: bigint) => bigint,
) => appendNumericResult(testValues, operation, 3);

export const add1Tests = appendUnaryNumericResult(
  benchmarkNumberPossibilitiesAll,
  (value) => value + 1n,
);
export const sub1Tests = appendUnaryNumericResult(
  benchmarkNumberPossibilitiesAll,
  (value) => value - 1n,
);
export const negateTests = appendUnaryNumericResult(
  benchmarkNumberPossibilitiesAll,
  (value) => -value,
);
export const absTests = appendUnaryNumericResult(
  benchmarkNumberPossibilitiesAll,
  (value) => (value < 0n ? -value : value),
);
export const notTests = appendUnaryNumericResult(
  benchmarkNumberPossibilitiesAll,
  (value) => (value === 0n ? 1n : 0n),
);
export const zeroNotEqualTests = appendUnaryNumericResult(
  benchmarkNumberPossibilitiesAll,
  // eslint-disable-next-line no-negated-condition
  (value) => (value !== 0n ? 1n : 0n),
);

/**
 * To reduce the size of the resulting test sets, we only generate combinations from each size of like-filled numbers.
 */
export const numberCombinationsAllBits = generateCombinations([
  benchmarkNumberPossibilities.allBits,
  benchmarkNumberPossibilities.allBits,
]);
export const numberCombinationsAlternatingBits = generateCombinations([
  benchmarkNumberPossibilities.alternatingBits,
  benchmarkNumberPossibilities.alternatingBits,
]);
export const numberCombinationsHighestBit = generateCombinations([
  benchmarkNumberPossibilities.highestBit,
  benchmarkNumberPossibilities.highestBit,
]);
export const numberCombinationsOneBitPerByte = generateCombinations([
  benchmarkNumberPossibilities.oneBitPerByte,
  benchmarkNumberPossibilities.oneBitPerByte,
]);
export const allBinaryNumberCombinations = [
  ...numberCombinationsAllBits,
  ...numberCombinationsAlternatingBits,
  ...numberCombinationsHighestBit,
  ...numberCombinationsOneBitPerByte,
];

export const allTernaryNumberCombinations = [
  ...generateCombinations([
    benchmarkNumberPossibilities.allBits,
    benchmarkNumberPossibilities.allBits,
    benchmarkNumberPossibilities.allBits,
  ]),
  ...generateCombinations([
    benchmarkNumberPossibilities.alternatingBits,
    benchmarkNumberPossibilities.alternatingBits,
    benchmarkNumberPossibilities.alternatingBits,
  ]),
  ...generateCombinations([
    benchmarkNumberPossibilities.highestBit,
    benchmarkNumberPossibilities.highestBit,
    benchmarkNumberPossibilities.highestBit,
  ]),
  ...generateCombinations([
    benchmarkNumberPossibilities.oneBitPerByte,
    benchmarkNumberPossibilities.oneBitPerByte,
    benchmarkNumberPossibilities.oneBitPerByte,
  ]),
];

export const addTests = appendBinaryNumericResult(
  allBinaryNumberCombinations,
  (a, b) => a + b,
);
export const subTests = appendBinaryNumericResult(
  allBinaryNumberCombinations,
  (a, b) => a - b,
);

export const boolAndTests = appendBinaryNumericResult(
  allBinaryNumberCombinations,
  (a, b) => (a !== 0n && b !== 0n ? 1n : 0n),
);
export const boolOrTests = appendBinaryNumericResult(
  allBinaryNumberCombinations,
  (a, b) => (a !== 0n || b !== 0n ? 1n : 0n),
);
export const numEqualTests = appendBinaryNumericResult(
  allBinaryNumberCombinations,
  (a, b) => (a === b ? 1n : 0n),
);
export const numNotEqualTests = appendBinaryNumericResult(
  allBinaryNumberCombinations,
  (a, b) => (a === b ? 0n : 1n),
);
export const lessThanTests = appendBinaryNumericResult(
  allBinaryNumberCombinations,
  (a, b) => (a < b ? 1n : 0n),
);
export const greaterThanTests = appendBinaryNumericResult(
  allBinaryNumberCombinations,
  (a, b) => (a > b ? 1n : 0n),
);
export const lessThanOrEqualTests = appendBinaryNumericResult(
  allBinaryNumberCombinations,
  (a, b) => (a <= b ? 1n : 0n),
);
export const greaterThanOrEqualTests = appendBinaryNumericResult(
  allBinaryNumberCombinations,
  (a, b) => (a >= b ? 1n : 0n),
);
export const minTests = appendBinaryNumericResult(
  allBinaryNumberCombinations,
  (a, b) => (a < b ? a : b),
);
export const maxTests = appendBinaryNumericResult(
  allBinaryNumberCombinations,
  (a, b) => (a > b ? a : b),
);
export const withinTests = appendTernaryNumericResult(
  allTernaryNumberCombinations,
  (a, b, c) => (b <= a && a < c ? 1n : 0n),
);
export const mulTests = appendBinaryNumericResult(
  allBinaryNumberCombinations,
  (a, b) => a * b,
);
export const divTests = appendBinaryNumericResult(
  allBinaryNumberCombinations,
  (a, b) => a / b,
);
export const modTests = appendBinaryNumericResult(
  allBinaryNumberCombinations,
  (a, b) => a % b,
);
