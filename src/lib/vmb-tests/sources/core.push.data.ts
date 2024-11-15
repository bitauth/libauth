import type { PossibleTestValue, VmbTestDefinitionGroup } from '../../lib.js';
import { generateTestCases, setExpectedResults } from '../bch-vmb-test-utils.js';

const pushDataOps: PossibleTestValue[] = [
  ['OP_PUSHDATA_1', 'OP_PUSHDATA_1'],
  ['OP_PUSHDATA_2', 'OP_PUSHDATA_2'],
  ['OP_PUSHDATA_4', 'OP_PUSHDATA_4'],
];

const oneByteLengths: PossibleTestValue[] = [
  ['1 (1-byte)', '0x01'],
  ['76', '76'],
  ['127', '127'],
  ['128', '0x80'],
  ['129', '0x81'],
  ['255', '0xff'],
];
const twoByteLengths: PossibleTestValue[] = [
  ['1 (2-byte)', '0x0100'],
  ['256', '0x0001'],
  ['65535', '0xffff'],
];
const fourByteLengths: PossibleTestValue[] = [
  ['1 (4-byte)', '0x01000000'],
  ['65536', '0x00000100'],
  ['99990', '0x96860100'],
];

export default [
  [
    'Push data operations',
    [
      ...setExpectedResults(generateTestCases(['$0 $1', '', '$0 with length $1, no data'], [pushDataOps, [['(missing length)', ''], ...oneByteLengths, ...twoByteLengths, ...fourByteLengths]]), {
        'OP_PUSHDATA_1 with length (missing length), no data': ['invalid'],
        'OP_PUSHDATA_1 with length 1 (1-byte), no data': ['invalid'],
        'OP_PUSHDATA_1 with length 1 (2-byte), no data': ['invalid'],
        'OP_PUSHDATA_1 with length 1 (4-byte), no data': ['invalid'],
        'OP_PUSHDATA_1 with length 127, no data': ['invalid'],
        'OP_PUSHDATA_1 with length 128, no data': ['invalid'],
        'OP_PUSHDATA_1 with length 129, no data': ['invalid'],
        'OP_PUSHDATA_1 with length 255, no data': ['invalid'],
        'OP_PUSHDATA_1 with length 256, no data': ['invalid'],
        'OP_PUSHDATA_1 with length 65535, no data': ['invalid'],
        'OP_PUSHDATA_1 with length 65536, no data': ['invalid'],
        'OP_PUSHDATA_1 with length 76, no data': ['invalid'],
        'OP_PUSHDATA_1 with length 99990, no data': ['invalid'],
        'OP_PUSHDATA_2 with length (missing length), no data': ['invalid'],
        'OP_PUSHDATA_2 with length 1 (1-byte), no data': ['invalid'],
        'OP_PUSHDATA_2 with length 1 (2-byte), no data': ['invalid'],
        'OP_PUSHDATA_2 with length 1 (4-byte), no data': ['invalid'],
        'OP_PUSHDATA_2 with length 127, no data': ['invalid'],
        'OP_PUSHDATA_2 with length 128, no data': ['invalid'],
        'OP_PUSHDATA_2 with length 129, no data': ['invalid'],
        'OP_PUSHDATA_2 with length 255, no data': ['invalid'],
        'OP_PUSHDATA_2 with length 256, no data': ['invalid'],
        'OP_PUSHDATA_2 with length 65535, no data': ['invalid'],
        'OP_PUSHDATA_2 with length 65536, no data': ['invalid'],
        'OP_PUSHDATA_2 with length 76, no data': ['invalid'],
        'OP_PUSHDATA_2 with length 99990, no data': ['invalid'],
        'OP_PUSHDATA_4 with length (missing length), no data': ['invalid'],
        'OP_PUSHDATA_4 with length 1 (1-byte), no data': ['invalid'],
        'OP_PUSHDATA_4 with length 1 (2-byte), no data': ['invalid'],
        'OP_PUSHDATA_4 with length 1 (4-byte), no data': ['invalid'],
        'OP_PUSHDATA_4 with length 127, no data': ['invalid'],
        'OP_PUSHDATA_4 with length 128, no data': ['invalid'],
        'OP_PUSHDATA_4 with length 129, no data': ['invalid'],
        'OP_PUSHDATA_4 with length 255, no data': ['invalid'],
        'OP_PUSHDATA_4 with length 256, no data': ['invalid'],
        'OP_PUSHDATA_4 with length 65535, no data': ['invalid'],
        'OP_PUSHDATA_4 with length 65536, no data': ['invalid'],
        'OP_PUSHDATA_4 with length 76, no data': ['invalid'],
        'OP_PUSHDATA_4 with length 99990, no data': ['invalid'],
      }),
      ...setExpectedResults(generateTestCases(['$0 $1', 'OP_NOT', '$0 with length $1, no data, OP_NOT'], [pushDataOps, [['(missing length)', ''], ...oneByteLengths, ...twoByteLengths, ...fourByteLengths]]), {
        'OP_PUSHDATA_1 with length (missing length), no data, OP_NOT': ['invalid'],
        'OP_PUSHDATA_1 with length 1 (1-byte), no data, OP_NOT': ['invalid'],
        'OP_PUSHDATA_1 with length 1 (2-byte), no data, OP_NOT': ['invalid'],
        'OP_PUSHDATA_1 with length 1 (4-byte), no data, OP_NOT': ['invalid'],
        'OP_PUSHDATA_1 with length 127, no data, OP_NOT': ['invalid'],
        'OP_PUSHDATA_1 with length 128, no data, OP_NOT': ['invalid'],
        'OP_PUSHDATA_1 with length 129, no data, OP_NOT': ['invalid'],
        'OP_PUSHDATA_1 with length 255, no data, OP_NOT': ['invalid'],
        'OP_PUSHDATA_1 with length 256, no data, OP_NOT': ['invalid'],
        'OP_PUSHDATA_1 with length 65535, no data, OP_NOT': ['invalid'],
        'OP_PUSHDATA_1 with length 65536, no data, OP_NOT': ['invalid'],
        'OP_PUSHDATA_1 with length 76, no data, OP_NOT': ['invalid'],
        'OP_PUSHDATA_1 with length 99990, no data, OP_NOT': ['invalid'],
        'OP_PUSHDATA_2 with length (missing length), no data, OP_NOT': ['invalid'],
        'OP_PUSHDATA_2 with length 1 (1-byte), no data, OP_NOT': ['invalid'],
        'OP_PUSHDATA_2 with length 1 (2-byte), no data, OP_NOT': ['invalid'],
        'OP_PUSHDATA_2 with length 1 (4-byte), no data, OP_NOT': ['invalid'],
        'OP_PUSHDATA_2 with length 127, no data, OP_NOT': ['invalid'],
        'OP_PUSHDATA_2 with length 128, no data, OP_NOT': ['invalid'],
        'OP_PUSHDATA_2 with length 129, no data, OP_NOT': ['invalid'],
        'OP_PUSHDATA_2 with length 255, no data, OP_NOT': ['invalid'],
        'OP_PUSHDATA_2 with length 256, no data, OP_NOT': ['invalid'],
        'OP_PUSHDATA_2 with length 65535, no data, OP_NOT': ['invalid'],
        'OP_PUSHDATA_2 with length 65536, no data, OP_NOT': ['invalid'],
        'OP_PUSHDATA_2 with length 76, no data, OP_NOT': ['invalid'],
        'OP_PUSHDATA_2 with length 99990, no data, OP_NOT': ['invalid'],
        'OP_PUSHDATA_4 with length (missing length), no data, OP_NOT': ['invalid'],
        'OP_PUSHDATA_4 with length 1 (1-byte), no data, OP_NOT': ['invalid'],
        'OP_PUSHDATA_4 with length 1 (2-byte), no data, OP_NOT': ['invalid'],
        'OP_PUSHDATA_4 with length 1 (4-byte), no data, OP_NOT': ['invalid'],
        'OP_PUSHDATA_4 with length 127, no data, OP_NOT': ['invalid'],
        'OP_PUSHDATA_4 with length 128, no data, OP_NOT': ['invalid'],
        'OP_PUSHDATA_4 with length 129, no data, OP_NOT': ['invalid'],
        'OP_PUSHDATA_4 with length 255, no data, OP_NOT': ['invalid'],
        'OP_PUSHDATA_4 with length 256, no data, OP_NOT': ['invalid'],
        'OP_PUSHDATA_4 with length 65535, no data, OP_NOT': ['invalid'],
        'OP_PUSHDATA_4 with length 65536, no data, OP_NOT': ['invalid'],
        'OP_PUSHDATA_4 with length 76, no data, OP_NOT': ['invalid'],
        'OP_PUSHDATA_4 with length 99990, no data, OP_NOT': ['invalid'],
      }),

      ...setExpectedResults(generateTestCases(['$0 $1 <0x01>', '', '$0 with length $1, partial data'], [pushDataOps, [...oneByteLengths, ...twoByteLengths, ...fourByteLengths]]), {
        'OP_PUSHDATA_1 with length 1 (1-byte), partial data': ['invalid'],
        'OP_PUSHDATA_1 with length 1 (2-byte), partial data': ['invalid'],
        'OP_PUSHDATA_1 with length 1 (4-byte), partial data': ['invalid'],
        'OP_PUSHDATA_1 with length 127, partial data': ['invalid'],
        'OP_PUSHDATA_1 with length 128, partial data': ['invalid'],
        'OP_PUSHDATA_1 with length 129, partial data': ['invalid'],
        'OP_PUSHDATA_1 with length 255, partial data': ['invalid'],
        'OP_PUSHDATA_1 with length 256, partial data': ['invalid'],
        'OP_PUSHDATA_1 with length 65535, partial data': ['invalid'],
        'OP_PUSHDATA_1 with length 65536, partial data': ['invalid'],
        'OP_PUSHDATA_1 with length 76, partial data': ['invalid'],
        'OP_PUSHDATA_1 with length 99990, partial data': ['invalid'],
        'OP_PUSHDATA_2 with length 1 (1-byte), partial data': ['invalid'],
        'OP_PUSHDATA_2 with length 1 (2-byte), partial data': ['invalid'],
        'OP_PUSHDATA_2 with length 1 (4-byte), partial data': ['invalid'],
        'OP_PUSHDATA_2 with length 127, partial data': ['invalid'],
        'OP_PUSHDATA_2 with length 128, partial data': ['invalid'],
        'OP_PUSHDATA_2 with length 129, partial data': ['invalid'],
        'OP_PUSHDATA_2 with length 255, partial data': ['invalid'],
        'OP_PUSHDATA_2 with length 256, partial data': ['invalid'],
        'OP_PUSHDATA_2 with length 65535, partial data': ['invalid'],
        'OP_PUSHDATA_2 with length 65536, partial data': ['invalid'],
        'OP_PUSHDATA_2 with length 76, partial data': ['invalid'],
        'OP_PUSHDATA_2 with length 99990, partial data': ['invalid'],
        'OP_PUSHDATA_4 with length 1 (1-byte), partial data': ['invalid'],
        'OP_PUSHDATA_4 with length 1 (2-byte), partial data': ['invalid'],
        'OP_PUSHDATA_4 with length 1 (4-byte), partial data': ['invalid'],
        'OP_PUSHDATA_4 with length 127, partial data': ['invalid'],
        'OP_PUSHDATA_4 with length 128, partial data': ['invalid'],
        'OP_PUSHDATA_4 with length 129, partial data': ['invalid'],
        'OP_PUSHDATA_4 with length 255, partial data': ['invalid'],
        'OP_PUSHDATA_4 with length 256, partial data': ['invalid'],
        'OP_PUSHDATA_4 with length 65535, partial data': ['invalid'],
        'OP_PUSHDATA_4 with length 65536, partial data': ['invalid'],
        'OP_PUSHDATA_4 with length 76, partial data': ['invalid'],
        'OP_PUSHDATA_4 with length 99990, partial data': ['invalid'],
      }),
      ...setExpectedResults(generateTestCases(['$0 $1 <0x01>', 'OP_NOT', '$0 with length $1, partial data, OP_NOT'], [pushDataOps, [...oneByteLengths, ...twoByteLengths, ...fourByteLengths]]), {
        'OP_PUSHDATA_1 with length 1 (1-byte), partial data, OP_NOT': ['invalid'],
        'OP_PUSHDATA_1 with length 1 (2-byte), partial data, OP_NOT': ['invalid'],
        'OP_PUSHDATA_1 with length 1 (4-byte), partial data, OP_NOT': ['invalid'],
        'OP_PUSHDATA_1 with length 127, partial data, OP_NOT': ['invalid'],
        'OP_PUSHDATA_1 with length 128, partial data, OP_NOT': ['invalid'],
        'OP_PUSHDATA_1 with length 129, partial data, OP_NOT': ['invalid'],
        'OP_PUSHDATA_1 with length 255, partial data, OP_NOT': ['invalid'],
        'OP_PUSHDATA_1 with length 256, partial data, OP_NOT': ['invalid'],
        'OP_PUSHDATA_1 with length 65535, partial data, OP_NOT': ['invalid'],
        'OP_PUSHDATA_1 with length 65536, partial data, OP_NOT': ['invalid'],
        'OP_PUSHDATA_1 with length 76, partial data, OP_NOT': ['invalid'],
        'OP_PUSHDATA_1 with length 99990, partial data, OP_NOT': ['invalid'],
        'OP_PUSHDATA_2 with length 1 (1-byte), partial data, OP_NOT': ['invalid'],
        'OP_PUSHDATA_2 with length 1 (2-byte), partial data, OP_NOT': ['invalid'],
        'OP_PUSHDATA_2 with length 1 (4-byte), partial data, OP_NOT': ['invalid'],
        'OP_PUSHDATA_2 with length 127, partial data, OP_NOT': ['invalid'],
        'OP_PUSHDATA_2 with length 128, partial data, OP_NOT': ['invalid'],
        'OP_PUSHDATA_2 with length 129, partial data, OP_NOT': ['invalid'],
        'OP_PUSHDATA_2 with length 255, partial data, OP_NOT': ['invalid'],
        'OP_PUSHDATA_2 with length 256, partial data, OP_NOT': ['invalid'],
        'OP_PUSHDATA_2 with length 65535, partial data, OP_NOT': ['invalid'],
        'OP_PUSHDATA_2 with length 65536, partial data, OP_NOT': ['invalid'],
        'OP_PUSHDATA_2 with length 76, partial data, OP_NOT': ['invalid'],
        'OP_PUSHDATA_2 with length 99990, partial data, OP_NOT': ['invalid'],
        'OP_PUSHDATA_4 with length 1 (1-byte), partial data, OP_NOT': ['invalid'],
        'OP_PUSHDATA_4 with length 1 (2-byte), partial data, OP_NOT': ['invalid'],
        'OP_PUSHDATA_4 with length 1 (4-byte), partial data, OP_NOT': ['invalid'],
        'OP_PUSHDATA_4 with length 127, partial data, OP_NOT': ['invalid'],
        'OP_PUSHDATA_4 with length 128, partial data, OP_NOT': ['invalid'],
        'OP_PUSHDATA_4 with length 129, partial data, OP_NOT': ['invalid'],
        'OP_PUSHDATA_4 with length 255, partial data, OP_NOT': ['invalid'],
        'OP_PUSHDATA_4 with length 256, partial data, OP_NOT': ['invalid'],
        'OP_PUSHDATA_4 with length 65535, partial data, OP_NOT': ['invalid'],
        'OP_PUSHDATA_4 with length 65536, partial data, OP_NOT': ['invalid'],
        'OP_PUSHDATA_4 with length 76, partial data, OP_NOT': ['invalid'],
        'OP_PUSHDATA_4 with length 99990, partial data, OP_NOT': ['invalid'],
      }),

      ...setExpectedResults(
        generateTestCases(
          ['$0', '$1', '$0 of $1 split across unlocking and locking bytecode'],
          [
            [
              ['OP_PUSHBYTES_1', 'OP_PUSHBYTES_1'],
              ['OP_PUSHBYTES_2', 'OP_PUSHBYTES_2'],
              ['OP_PUSHDATA_1 1', 'OP_PUSHDATA_1 0x01'],
              ['OP_PUSHDATA_2 1', 'OP_PUSHDATA_2 0x0100'],
              ['OP_PUSHDATA_4 1', 'OP_PUSHDATA_4 0x01000000'],
            ],
            [
              ['-1', '0x81'],
              ['0x00', '0x00'],
              ['1', '1'],
              ['2', '2'],
              ['3', '3'],
              ['4', '4'],
              ['5', '5'],
              ['6', '6'],
              ['7', '7'],
              ['8', '8'],
              ['9', '9'],
              ['10', '10'],
              ['11', '11'],
              ['12', '12'],
              ['13', '13'],
              ['14', '14'],
              ['15', '15'],
              ['16', '16'],
              ['17', '17'],
              ['76', '76'],
              ['127', '127'],
              ['128', '128'],
              ['255', '255'],
              ['0x0000', '0x0000'],
            ],
          ],
        ),
        {
          'OP_PUSHBYTES_1 of -1 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHBYTES_1 of 0x00 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHBYTES_1 of 0x0000 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHBYTES_1 of 1 split across unlocking and locking bytecode': ['skip'],
          'OP_PUSHBYTES_1 of 10 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHBYTES_1 of 11 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHBYTES_1 of 12 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHBYTES_1 of 127 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHBYTES_1 of 128 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHBYTES_1 of 13 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHBYTES_1 of 14 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHBYTES_1 of 15 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHBYTES_1 of 16 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHBYTES_1 of 17 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHBYTES_1 of 2 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHBYTES_1 of 255 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHBYTES_1 of 3 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHBYTES_1 of 4 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHBYTES_1 of 5 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHBYTES_1 of 6 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHBYTES_1 of 7 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHBYTES_1 of 76 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHBYTES_1 of 8 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHBYTES_1 of 9 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHBYTES_2 of -1 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHBYTES_2 of 0x00 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHBYTES_2 of 0x0000 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHBYTES_2 of 1 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHBYTES_2 of 10 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHBYTES_2 of 11 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHBYTES_2 of 12 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHBYTES_2 of 127 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHBYTES_2 of 128 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHBYTES_2 of 13 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHBYTES_2 of 14 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHBYTES_2 of 15 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHBYTES_2 of 16 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHBYTES_2 of 17 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHBYTES_2 of 2 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHBYTES_2 of 255 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHBYTES_2 of 3 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHBYTES_2 of 4 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHBYTES_2 of 5 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHBYTES_2 of 6 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHBYTES_2 of 7 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHBYTES_2 of 76 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHBYTES_2 of 8 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHBYTES_2 of 9 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHDATA_1 1 of -1 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHDATA_1 1 of 0x00 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHDATA_1 1 of 0x0000 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHDATA_1 1 of 1 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHDATA_1 1 of 10 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHDATA_1 1 of 11 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHDATA_1 1 of 12 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHDATA_1 1 of 127 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHDATA_1 1 of 128 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHDATA_1 1 of 13 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHDATA_1 1 of 14 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHDATA_1 1 of 15 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHDATA_1 1 of 16 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHDATA_1 1 of 17 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHDATA_1 1 of 2 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHDATA_1 1 of 255 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHDATA_1 1 of 3 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHDATA_1 1 of 4 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHDATA_1 1 of 5 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHDATA_1 1 of 6 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHDATA_1 1 of 7 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHDATA_1 1 of 76 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHDATA_1 1 of 8 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHDATA_1 1 of 9 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHDATA_2 1 of -1 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHDATA_2 1 of 0x00 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHDATA_2 1 of 0x0000 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHDATA_2 1 of 1 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHDATA_2 1 of 10 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHDATA_2 1 of 11 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHDATA_2 1 of 12 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHDATA_2 1 of 127 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHDATA_2 1 of 128 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHDATA_2 1 of 13 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHDATA_2 1 of 14 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHDATA_2 1 of 15 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHDATA_2 1 of 16 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHDATA_2 1 of 17 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHDATA_2 1 of 2 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHDATA_2 1 of 255 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHDATA_2 1 of 3 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHDATA_2 1 of 4 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHDATA_2 1 of 5 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHDATA_2 1 of 6 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHDATA_2 1 of 7 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHDATA_2 1 of 76 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHDATA_2 1 of 8 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHDATA_2 1 of 9 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHDATA_4 1 of -1 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHDATA_4 1 of 0x00 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHDATA_4 1 of 0x0000 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHDATA_4 1 of 1 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHDATA_4 1 of 10 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHDATA_4 1 of 11 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHDATA_4 1 of 12 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHDATA_4 1 of 127 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHDATA_4 1 of 128 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHDATA_4 1 of 13 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHDATA_4 1 of 14 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHDATA_4 1 of 15 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHDATA_4 1 of 16 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHDATA_4 1 of 17 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHDATA_4 1 of 2 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHDATA_4 1 of 255 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHDATA_4 1 of 3 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHDATA_4 1 of 4 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHDATA_4 1 of 5 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHDATA_4 1 of 6 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHDATA_4 1 of 7 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHDATA_4 1 of 76 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHDATA_4 1 of 8 split across unlocking and locking bytecode': ['invalid'],
          'OP_PUSHDATA_4 1 of 9 split across unlocking and locking bytecode': ['invalid'],
        },
      ),

      ...setExpectedResults(
        generateTestCases(
          ['$0 $1', '', '$0 of $1'],
          [
            [
              ['OP_PUSHDATA_1', 'OP_PUSHDATA_1'],
              ['OP_PUSHDATA_2', 'OP_PUSHDATA_2'],
              ['OP_PUSHDATA_4', 'OP_PUSHDATA_4'],
            ],
            [
              ['76 non-zero bytes', '76 $(<1> <76> OP_NUM2BIN)'],
              ['76 zero bytes', '76 $(<0> <76> OP_NUM2BIN)'],
              ['255 non-zero bytes', '0xff $(<1> <255> OP_NUM2BIN)'],
              ['255 zero bytes', '0xff $(<0> <255> OP_NUM2BIN)'],
              ['256 non-zero bytes', '0x0001 $(<1> <256> OP_NUM2BIN)'],
              ['256 zero bytes', '0x0001 $(<0> <256> OP_NUM2BIN)'],
            ],
          ],
        ),
        {
          'OP_PUSHDATA_1 of 255 non-zero bytes': [],
          'OP_PUSHDATA_1 of 255 zero bytes': ['invalid'],
          'OP_PUSHDATA_1 of 256 non-zero bytes': ['invalid'],
          'OP_PUSHDATA_1 of 256 zero bytes': ['invalid'],
          'OP_PUSHDATA_1 of 76 non-zero bytes': [],
          'OP_PUSHDATA_1 of 76 zero bytes': ['invalid'],
          'OP_PUSHDATA_2 of 255 non-zero bytes': ['invalid'],
          'OP_PUSHDATA_2 of 255 zero bytes': ['invalid'],
          'OP_PUSHDATA_2 of 256 non-zero bytes': [],
          'OP_PUSHDATA_2 of 256 zero bytes': ['invalid'],
          'OP_PUSHDATA_2 of 76 non-zero bytes': ['invalid'],
          'OP_PUSHDATA_2 of 76 zero bytes': ['invalid'],
          'OP_PUSHDATA_4 of 255 non-zero bytes': ['invalid'],
          'OP_PUSHDATA_4 of 255 zero bytes': ['invalid'],
          'OP_PUSHDATA_4 of 256 non-zero bytes': ['invalid'],
          'OP_PUSHDATA_4 of 256 zero bytes': ['invalid'],
          'OP_PUSHDATA_4 of 76 non-zero bytes': ['invalid'],
          'OP_PUSHDATA_4 of 76 zero bytes': ['invalid'],
        },
      ),

      ...setExpectedResults(
        generateTestCases(
          ['', '$0 $1', '$0 of $1 produces expected stack item'],
          [
            [
              ['OP_PUSHDATA_1', 'OP_PUSHDATA_1'],
              ['OP_PUSHDATA_2', 'OP_PUSHDATA_2'],
              ['OP_PUSHDATA_4', 'OP_PUSHDATA_4'],
            ],
            [
              ['76 non-zero bytes', '76 $(<1> <76> OP_NUM2BIN) OP_SIZE <76> OP_EQUAL OP_NIP'],
              ['76 zero bytes', '76 $(<0> <76> OP_NUM2BIN) OP_SIZE <76> OP_EQUAL OP_NIP'],
              ['255 non-zero bytes', '0xff $(<1> <255> OP_NUM2BIN) OP_SIZE <255> OP_EQUAL OP_NIP'],
              ['255 zero bytes', '0xff $(<0> <255> OP_NUM2BIN) OP_SIZE <255> OP_EQUAL OP_NIP'],
              ['256 non-zero bytes', '0x0001 $(<1> <256> OP_NUM2BIN) OP_SIZE <256> OP_EQUAL OP_NIP'],
              ['256 zero bytes', '0x0001 $(<0> <256> OP_NUM2BIN) OP_SIZE <256> OP_EQUAL OP_NIP'],
            ],
          ],
        ),
        {
          'OP_PUSHDATA_1 of 255 non-zero bytes produces expected stack item': [],
          'OP_PUSHDATA_1 of 255 zero bytes produces expected stack item': [],
          'OP_PUSHDATA_1 of 256 non-zero bytes produces expected stack item': ['invalid'],
          'OP_PUSHDATA_1 of 256 zero bytes produces expected stack item': ['invalid'],
          'OP_PUSHDATA_1 of 76 non-zero bytes produces expected stack item': [],
          'OP_PUSHDATA_1 of 76 zero bytes produces expected stack item': [],
          'OP_PUSHDATA_2 of 255 non-zero bytes produces expected stack item': ['invalid'],
          'OP_PUSHDATA_2 of 255 zero bytes produces expected stack item': ['invalid'],
          'OP_PUSHDATA_2 of 256 non-zero bytes produces expected stack item': [],
          'OP_PUSHDATA_2 of 256 zero bytes produces expected stack item': [],
          'OP_PUSHDATA_2 of 76 non-zero bytes produces expected stack item': ['invalid'],
          'OP_PUSHDATA_2 of 76 zero bytes produces expected stack item': ['invalid'],
          'OP_PUSHDATA_4 of 255 non-zero bytes produces expected stack item': ['invalid'],
          'OP_PUSHDATA_4 of 255 zero bytes produces expected stack item': ['invalid'],
          'OP_PUSHDATA_4 of 256 non-zero bytes produces expected stack item': ['invalid'],
          'OP_PUSHDATA_4 of 256 zero bytes produces expected stack item': ['invalid'],
          'OP_PUSHDATA_4 of 76 non-zero bytes produces expected stack item': ['invalid'],
          'OP_PUSHDATA_4 of 76 zero bytes produces expected stack item': ['invalid'],
        },
      ),

      ...setExpectedResults(
        generateTestCases(
          ['<$1> OP_IF $0 OP_ENDIF', '', '<$1> OP_IF $0 OP_ENDIF in unlocking bytecode'],
          [
            [
              ['OP_PUSHDATA_1 ...', 'OP_PUSHDATA_1 76 $(<1> <76> OP_NUM2BIN) OP_SIZE <76> OP_EQUAL OP_NIP'],
              ['OP_PUSHDATA_2 ...', 'OP_PUSHDATA_2 0x0001 $(<1> <256> OP_NUM2BIN) OP_SIZE <256> OP_EQUAL OP_NIP'],
            ],
            [
              ['0', '0'],
              ['1', '1'],
            ],
          ],
        ),
        {
          '<0> OP_IF OP_PUSHDATA_1 ... OP_ENDIF in unlocking bytecode': ['invalid'],
          '<0> OP_IF OP_PUSHDATA_2 ... OP_ENDIF in unlocking bytecode': ['invalid'],
          '<1> OP_IF OP_PUSHDATA_1 ... OP_ENDIF in unlocking bytecode': ['invalid'],
          '<1> OP_IF OP_PUSHDATA_2 ... OP_ENDIF in unlocking bytecode': ['invalid'],
        },
      ),
      ...setExpectedResults(
        generateTestCases(
          ['', '<$1> OP_IF $0 OP_ENDIF', '<$1> OP_IF $0 OP_ENDIF in locking bytecode'],
          [
            [
              ['OP_PUSHDATA_1 ...', 'OP_PUSHDATA_1 76 $(<1> <76> OP_NUM2BIN) OP_SIZE <76> OP_EQUAL OP_NIP'],
              ['OP_PUSHDATA_2 ...', 'OP_PUSHDATA_2 0x0001 $(<1> <256> OP_NUM2BIN) OP_SIZE <256> OP_EQUAL OP_NIP'],
            ],
            [
              ['0', '0'],
              ['1', '1'],
            ],
          ],
        ),
        {
          '<0> OP_IF OP_PUSHDATA_1 ... OP_ENDIF in locking bytecode': ['invalid'],
          '<0> OP_IF OP_PUSHDATA_2 ... OP_ENDIF in locking bytecode': ['invalid'],
          '<1> OP_IF OP_PUSHDATA_1 ... OP_ENDIF in locking bytecode': [],
          '<1> OP_IF OP_PUSHDATA_2 ... OP_ENDIF in locking bytecode': [],
        },
      ),
    ],
  ],
] as const satisfies VmbTestDefinitionGroup[];