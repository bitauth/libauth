/* eslint-disable functional/no-expression-statement, @typescript-eslint/no-magic-numbers, functional/immutable-data */
import test, { Macro } from 'ava';

import {
  AuthenticationInstruction,
  disassembleParsedAuthenticationInstructions,
  generateBytecodeMap,
  hexToBin,
  OpcodesBCH,
  OpcodesBTC,
  parseBytecode,
  ParsedAuthenticationInstruction,
  range,
  serializeAuthenticationInstructions,
  serializeParsedAuthenticationInstructions
} from '../../lib';

test('Each Opcodes enum contains a single instruction for 0-255', t => {
  const expected = range(256);
  const names = (keys: readonly string[]) =>
    keys.filter(k => isNaN(parseInt(k, 10)));
  const numbers = (keys: readonly string[]) =>
    keys.map(k => parseInt(k, 10)).filter(k => !isNaN(k));

  const bch = Object.keys(OpcodesBCH);
  t.deepEqual(numbers(bch), expected);
  t.deepEqual(names(bch).length, expected.length);

  const btc = Object.keys(OpcodesBTC);
  t.deepEqual(numbers(btc), expected);
  t.deepEqual(names(btc).length, expected.length);
});

/**
 * `scriptHex` - the hex-encoded script prepended with `0x`
 * `asm` – the proper ASM result from disassembling the script
 * `parse` – an array representing the parsed authentication instructions:
 *  - element 0 – `opcode`
 *  - element 1 – `data`, hex-encoded (if present)
 *    - if the array is longer than this, `malformed` is `true`
 *  - element 2 – `expectedDataBytes`, (if present)
 *  - element 3 – `length`, hex-encoded (if present)
 *  - element 4 – `expectedLengthBytes`, hex-encoded (if present)
 */
interface CommonScriptParseAndAsmTests {
  readonly [scriptHex: string]: {
    readonly asm: string;
    readonly parse: [number, string?, number?, string?, number?][];
  };
}

const defToFixtures = (tests: CommonScriptParseAndAsmTests) =>
  Object.entries(tests).map(entry => {
    const [fullHex, { asm }] = entry;
    const [, hex] = fullHex.split('0x');
    const script = hexToBin(hex);
    // eslint-disable-next-line complexity
    const object = entry[1].parse.map(set => ({
      opcode: set[0],
      ...(set.length > 2 ? { malformed: true } : undefined),
      ...(set[1] === undefined ? undefined : { data: hexToBin(set[1]) }),
      ...(set[2] === undefined ? undefined : { expectedDataBytes: set[2] }),
      ...(set[3] === undefined ? undefined : { length: hexToBin(set[3]) }),
      ...(set[4] === undefined ? undefined : { expectedLengthBytes: set[4] })
    }));
    return { asm, hex, object, script };
  });

const wellFormedScripts: CommonScriptParseAndAsmTests = {
  '0x00': {
    asm: 'OP_0',
    parse: [[0, '']]
  },
  '0x0001010202020303030376': {
    asm:
      'OP_0 OP_PUSHBYTES_1 0x01 OP_PUSHBYTES_2 0x0202 OP_PUSHBYTES_3 0x030303 OP_DUP',
    parse: [[0, ''], [1, '01'], [2, '0202'], [3, '030303'], [118]]
  },
  '0x410411db93e1dcdb8a016b49840f8c53bc1eb68a382e97b1482ecad7b148a6909a5cb2e0eaddfb84ccf9744464f82e160bfa9b8b64f9d4c03f999b8643f656b412a3ac': {
    asm:
      'OP_PUSHBYTES_65 0x0411db93e1dcdb8a016b49840f8c53bc1eb68a382e97b1482ecad7b148a6909a5cb2e0eaddfb84ccf9744464f82e160bfa9b8b64f9d4c03f999b8643f656b412a3 OP_CHECKSIG',
    parse: [
      [
        0x41,
        '0411db93e1dcdb8a016b49840f8c53bc1eb68a382e97b1482ecad7b148a6909a5cb2e0eaddfb84ccf9744464f82e160bfa9b8b64f9d4c03f999b8643f656b412a3'
      ],
      [0xac]
    ]
  },
  '0x4c020304': {
    asm: 'OP_PUSHDATA_1 2 0x0304',
    parse: [[0x4c, '0304']]
  },
  '0x76a91411b366edfc0a8b66feebae5c2e25a7b6a5d1cf3188ac': {
    asm:
      'OP_DUP OP_HASH160 OP_PUSHBYTES_20 0x11b366edfc0a8b66feebae5c2e25a7b6a5d1cf31 OP_EQUALVERIFY OP_CHECKSIG',
    parse: [
      [0x76],
      [0xa9],
      [0x14, '11b366edfc0a8b66feebae5c2e25a7b6a5d1cf31'],
      [0x88],
      [0xac]
    ]
  }
};

const malFormedPushes: CommonScriptParseAndAsmTests = {
  '0x01': {
    asm: 'OP_PUSHBYTES_1 [missing 1 byte]',
    parse: [[0x01, '', 1]]
  },
  '0x0201': {
    asm: 'OP_PUSHBYTES_2 0x01[missing 1 byte]',
    parse: [[0x02, '01', 2]]
  },
  '0x4b': {
    asm: 'OP_PUSHBYTES_75 [missing 75 bytes]',
    parse: [[0x4b, '', 75]]
  },
  '0x4c': {
    asm: 'OP_PUSHDATA_1 [missing 1 byte]',
    parse: [[0x4c, undefined, undefined, '', 1]]
  },
  '0x4c02': {
    asm: 'OP_PUSHDATA_1 2 [missing 2 bytes]',
    parse: [[0x4c, '', 2]]
  },
  '0x4d': {
    asm: 'OP_PUSHDATA_2 [missing 2 bytes]',
    parse: [[0x4d, undefined, undefined, '', 2]]
  },
  '0x4d01': {
    asm: 'OP_PUSHDATA_2 0x01[missing 1 byte]',
    parse: [[0x4d, undefined, undefined, '01', 2]]
  },
  '0x4d0101': {
    asm: 'OP_PUSHDATA_2 257 [missing 257 bytes]',
    parse: [[0x4d, '', 257]]
  },
  '0x4d010101': {
    asm: 'OP_PUSHDATA_2 257 0x01[missing 256 bytes]',
    parse: [[0x4d, '01', 257]]
  },
  '0x4e': {
    asm: 'OP_PUSHDATA_4 [missing 4 bytes]',
    parse: [[0x4e, undefined, undefined, '', 4]]
  },
  '0x4e01': {
    asm: 'OP_PUSHDATA_4 0x01[missing 3 bytes]',
    parse: [[0x4e, undefined, undefined, '01', 4]]
  },
  '0x4e01000001': {
    asm: 'OP_PUSHDATA_4 16777217 [missing 16777217 bytes]',
    parse: [[0x4e, '', 16777217]]
  },
  '0x4e0100000101': {
    asm: 'OP_PUSHDATA_4 16777217 0x01[missing 16777216 bytes]',
    parse: [[0x4e, '01', 16777217]]
  }
};

const parse: Macro<[Uint8Array, readonly ParsedAuthenticationInstruction[]]> = (
  t,
  input,
  expected
) => {
  t.deepEqual(parseBytecode(input), expected);
};
parse.title = title => `parse script: ${title ?? ''}`.trim();

const disassemble: Macro<[
  readonly ParsedAuthenticationInstruction[],
  string
]> = (t, input, expected) => {
  t.deepEqual(
    disassembleParsedAuthenticationInstructions(OpcodesBCH, input),
    expected
  );
};
disassemble.title = title => `disassemble script: ${title ?? ''}`.trim();

const serialize: Macro<[readonly AuthenticationInstruction[], Uint8Array]> = (
  t,
  input,
  expected
) => {
  t.deepEqual(serializeAuthenticationInstructions(input), expected);
};
serialize.title = title => `serialize script: ${title ?? ''}`.trim();

const reSerialize: Macro<[
  readonly ParsedAuthenticationInstruction[],
  Uint8Array
]> = (t, input, expected) => {
  t.deepEqual(serializeParsedAuthenticationInstructions(input), expected);
};
reSerialize.title = title =>
  `re-serialize parsed script: ${title ?? ''}`.trim();

defToFixtures(wellFormedScripts).map(({ asm, hex, script, object }) => {
  test(`0x${hex}`, parse, script, object);
  test(`0x${hex}`, disassemble, object, asm);
  test(`0x${hex}`, serialize, object, script);
  test(`0x${hex}`, reSerialize, object, script);
  return undefined;
});

defToFixtures(malFormedPushes).map(({ asm, hex, script, object }) => {
  test(`0x${hex}`, parse, script, object);
  test(`0x${hex}`, disassemble, object, asm);
  test(`0x${hex}`, reSerialize, object, script);
  return undefined;
});

test('generateBytecodeMap', t => {
  enum TestOpcodes {
    OP_A = 1,
    OP_B = 2,
    OP_C = 3
  }
  t.deepEqual(generateBytecodeMap(TestOpcodes), {
    OP_A: Uint8Array.of(1),
    OP_B: Uint8Array.of(2),
    OP_C: Uint8Array.of(3)
  });
});
