import test from 'ava';

import type {
  AuthenticationInstruction,
  AuthenticationInstructionPush,
  AuthenticationInstructionsMaybeMalformed,
} from '../../../lib.js';
import {
  assembleBytecode,
  assembleBytecodeBCH,
  assembleBytecodeBTC,
  authenticationInstructionsAreMalformed,
  decodeAuthenticationInstructions,
  disassembleAuthenticationInstructionsMaybeMalformed,
  disassembleBytecode,
  disassembleBytecodeBCH,
  disassembleBytecodeBTC,
  encodeAuthenticationInstruction,
  encodeAuthenticationInstructions,
  encodeAuthenticationInstructionsMaybeMalformed,
  generateBytecodeMap,
  hexToBin,
  OpcodesBCH2022,
  OpcodesBTC,
  range,
} from '../../../lib.js';

import { fc, testProp } from '@fast-check/ava';

test('Each Opcodes enum contains a single instruction for 0-255', (t) => {
  const expected = range(256);
  const names = (keys: string[]) => keys.filter((k) => isNaN(parseInt(k, 10)));
  const numbers = (keys: string[]) =>
    keys.map((k) => parseInt(k, 10)).filter((k) => !isNaN(k));

  const bch = Object.keys(OpcodesBCH2022);
  t.deepEqual(numbers(bch), expected);
  t.deepEqual(names(bch).length, expected.length);

  const btc = Object.keys(OpcodesBTC);
  t.deepEqual(numbers(btc), expected);
  t.deepEqual(names(btc).length, expected.length);
});

/**
 * `scriptHex` - the hex-encoded script prepended with `0x`
 * `asm` - the proper ASM result from disassembling the script
 * `parse` - an array representing the parsed authentication instructions:
 *  - element 0 - `opcode`
 *  - element 1 - `data`, hex-encoded (if present)
 *    - if the array is longer than this, `malformed` is `true`
 *  - element 2 - `expectedDataBytes`, (if present)
 *  - element 3 - `length`, hex-encoded (if present)
 *  - element 4 - `expectedLengthBytes`, hex-encoded (if present)
 */
type CommonScriptParseAndAsmTests = {
  [scriptHex: string]: {
    asm: string;
    parse: (
      | [number, string, number, string, number]
      | [number, string, number]
      | [number, string]
      | [number, undefined, undefined, string, number]
      | [number]
    )[];
  };
};

const defToFixtures = (tests: CommonScriptParseAndAsmTests) =>
  Object.entries(tests).map((entry) => {
    const [fullHex, { asm }] = entry;
    const hex = fullHex.replace('0x', '');
    const script = hexToBin(hex);
    // eslint-disable-next-line complexity
    const object = entry[1].parse.map((set) => ({
      opcode: set[0],
      ...(set.length > 2 ? { malformed: true } : undefined),
      ...(set[1] === undefined ? undefined : { data: hexToBin(set[1]) }),
      ...(set[2] === undefined ? undefined : { expectedDataBytes: set[2] }),
      ...(set[3] === undefined ? undefined : { length: hexToBin(set[3]) }),
      ...(set[4] === undefined ? undefined : { expectedLengthBytes: set[4] }),
    })) as AuthenticationInstructionsMaybeMalformed;
    return { asm, hex, object, script };
  });

const wellFormedScripts: CommonScriptParseAndAsmTests = {
  '0x00': {
    asm: 'OP_0',
    parse: [[0, '']],
  },
  '0x0001010202020303030376': {
    asm: 'OP_0 OP_PUSHBYTES_1 0x01 OP_PUSHBYTES_2 0x0202 OP_PUSHBYTES_3 0x030303 OP_DUP',
    parse: [[0, ''], [1, '01'], [2, '0202'], [3, '030303'], [118]],
  },
  '0x410411db93e1dcdb8a016b49840f8c53bc1eb68a382e97b1482ecad7b148a6909a5cb2e0eaddfb84ccf9744464f82e160bfa9b8b64f9d4c03f999b8643f656b412a3ac':
    {
      asm: 'OP_PUSHBYTES_65 0x0411db93e1dcdb8a016b49840f8c53bc1eb68a382e97b1482ecad7b148a6909a5cb2e0eaddfb84ccf9744464f82e160bfa9b8b64f9d4c03f999b8643f656b412a3 OP_CHECKSIG',
      parse: [
        [
          0x41,
          '0411db93e1dcdb8a016b49840f8c53bc1eb68a382e97b1482ecad7b148a6909a5cb2e0eaddfb84ccf9744464f82e160bfa9b8b64f9d4c03f999b8643f656b412a3',
        ],
        [0xac],
      ],
    },
  '0x4c020304': {
    asm: 'OP_PUSHDATA_1 2 0x0304',
    parse: [[0x4c, '0304']],
  },
  '0x76a91411b366edfc0a8b66feebae5c2e25a7b6a5d1cf3188ac': {
    asm: 'OP_DUP OP_HASH160 OP_PUSHBYTES_20 0x11b366edfc0a8b66feebae5c2e25a7b6a5d1cf31 OP_EQUALVERIFY OP_CHECKSIG',
    parse: [
      [0x76],
      [0xa9],
      [0x14, '11b366edfc0a8b66feebae5c2e25a7b6a5d1cf31'],
      [0x88],
      [0xac],
    ],
  },
};

const malFormedPushes: CommonScriptParseAndAsmTests = {
  '0x01': {
    asm: 'OP_PUSHBYTES_1 [missing 1 byte]',
    parse: [[0x01, '', 1]],
  },
  '0x0201': {
    asm: 'OP_PUSHBYTES_2 0x01[missing 1 byte]',
    parse: [[0x02, '01', 2]],
  },
  '0x4b': {
    asm: 'OP_PUSHBYTES_75 [missing 75 bytes]',
    parse: [[0x4b, '', 75]],
  },
  '0x4c': {
    asm: 'OP_PUSHDATA_1 [missing 1 byte]',
    parse: [[0x4c, undefined, undefined, '', 1]],
  },
  '0x4c02': {
    asm: 'OP_PUSHDATA_1 2 [missing 2 bytes]',
    parse: [[0x4c, '', 2]],
  },
  '0x4d': {
    asm: 'OP_PUSHDATA_2 [missing 2 bytes]',
    parse: [[0x4d, undefined, undefined, '', 2]],
  },
  '0x4d01': {
    asm: 'OP_PUSHDATA_2 0x01[missing 1 byte]',
    parse: [[0x4d, undefined, undefined, '01', 2]],
  },
  '0x4d0101': {
    asm: 'OP_PUSHDATA_2 257 [missing 257 bytes]',
    parse: [[0x4d, '', 257]],
  },
  '0x4d010101': {
    asm: 'OP_PUSHDATA_2 257 0x01[missing 256 bytes]',
    parse: [[0x4d, '01', 257]],
  },
  '0x4e': {
    asm: 'OP_PUSHDATA_4 [missing 4 bytes]',
    parse: [[0x4e, undefined, undefined, '', 4]],
  },
  '0x4e01': {
    asm: 'OP_PUSHDATA_4 0x01[missing 3 bytes]',
    parse: [[0x4e, undefined, undefined, '01', 4]],
  },
  '0x4e01000001': {
    asm: 'OP_PUSHDATA_4 16777217 [missing 16777217 bytes]',
    parse: [[0x4e, '', 16777217]],
  },
  '0x4e0100000101': {
    asm: 'OP_PUSHDATA_4 16777217 0x01[missing 16777216 bytes]',
    parse: [[0x4e, '01', 16777217]],
  },
};

const parse = test.macro<
  [Uint8Array, AuthenticationInstructionsMaybeMalformed]
>({
  exec: (t, input, expected) => {
    t.deepEqual(decodeAuthenticationInstructions(input), expected);
  },
  title: (title) => `parse script: ${title ?? ''}`.trim(),
});

const disassemble = test.macro<
  [AuthenticationInstructionsMaybeMalformed, string]
>({
  exec: (t, input, expected) => {
    t.deepEqual(
      disassembleAuthenticationInstructionsMaybeMalformed(
        OpcodesBCH2022,
        input,
      ),
      expected,
    );
  },
  title: (title) => `disassemble script: ${title ?? ''}`.trim(),
});

const encode = test.macro<[AuthenticationInstruction[], Uint8Array]>({
  exec: (t, input, expected) => {
    t.deepEqual(encodeAuthenticationInstructions(input), expected);
  },
  title: (title) => `encode script: ${title ?? ''}`.trim(),
});

const reEncode = test.macro<
  [AuthenticationInstructionsMaybeMalformed, Uint8Array]
>({
  exec: (t, input, expected) => {
    t.deepEqual(
      encodeAuthenticationInstructionsMaybeMalformed(input),
      expected,
    );
  },
  title: (title) => `re-encode parsed script: ${title ?? ''}`.trim(),
});

defToFixtures(wellFormedScripts).map(({ asm, hex, script, object }) => {
  test(`0x${hex}`, parse, script, object);
  test(`0x${hex}`, disassemble, object, asm);
  test(`0x${hex}`, encode, object, script);
  test(`0x${hex}`, reEncode, object, script);
  return undefined;
});

defToFixtures(malFormedPushes).map(({ asm, hex, script, object }) => {
  test(`0x${hex}`, parse, script, object);
  test(`0x${hex}`, disassemble, object, asm);
  test(`0x${hex}`, reEncode, object, script);
  return undefined;
});

test('generateBytecodeMap', (t) => {
  enum TestOpcodes {
    OP_A = 1,
    OP_B = 2,
    OP_C = 3,
  }
  t.deepEqual(generateBytecodeMap(TestOpcodes), {
    OP_A: Uint8Array.of(1),
    OP_B: Uint8Array.of(2),
    OP_C: Uint8Array.of(3),
  });
});

test('encodeAuthenticationInstruction', (t) => {
  const OP_PUSHDATA_1 = 0x4c;
  const pushData1Expected = new Uint8Array(102);
  pushData1Expected.set([OP_PUSHDATA_1, 100]);
  const pushData1Encoded = encodeAuthenticationInstruction({
    data: new Uint8Array(100),
    opcode: OP_PUSHDATA_1,
  });
  t.deepEqual(pushData1Encoded, pushData1Expected);

  const OP_PUSHDATA_2 = 0x4d;
  const pushData2Expected = new Uint8Array(259);
  pushData2Expected.set([OP_PUSHDATA_2, 0, 1]);
  const pushData2Encoded = encodeAuthenticationInstruction({
    data: new Uint8Array(256),
    opcode: OP_PUSHDATA_2,
  });
  t.deepEqual(pushData2Encoded, pushData2Expected);

  const OP_PUSHDATA_4 = 0x4e;
  const pushData4Expected = new Uint8Array(65541);
  pushData4Expected.set([OP_PUSHDATA_4, 0, 0, 1, 0]);
  const pushData4Encoded = encodeAuthenticationInstruction({
    data: new Uint8Array(65536),
    opcode: OP_PUSHDATA_4,
  });
  t.deepEqual(pushData4Encoded, pushData4Expected);
});

enum TestOpcodes {
  OP_PUSH_EMPTY = 0,
  OP_A = 81,
  OP_B = 82,
  OP_C = 83,
}
test('disassembleBytecode', (t) => {
  t.deepEqual(
    disassembleBytecode(
      TestOpcodes,
      Uint8Array.from([0, 81, 82, 83, 81, 82, 83]),
    ),
    'OP_PUSH_EMPTY OP_A OP_B OP_C OP_A OP_B OP_C',
  );
});

test('assembleBytecode', (t) => {
  t.deepEqual(
    assembleBytecode(
      generateBytecodeMap(TestOpcodes),
      'OP_PUSH_EMPTY OP_A OP_B OP_C OP_A OP_B OP_C',
    ),
    { bytecode: Uint8Array.from([0, 81, 82, 83, 81, 82, 83]), success: true },
  );
});

const zcfHex =
  '76a9148b139a5274cc85e2d36d4f97922a15ae5d7f68af8763ac6776a914f127e6b53e2005930718681d245fe5a2b22f2b9f8763785479879169766bbb6cba676a6868';

test('disassembleBytecodeBCH & assembleBytecodeBCH', (t) => {
  const zcfAsm =
    'OP_DUP OP_HASH160 OP_PUSHBYTES_20 0x8b139a5274cc85e2d36d4f97922a15ae5d7f68af OP_EQUAL OP_IF OP_CHECKSIG OP_ELSE OP_DUP OP_HASH160 OP_PUSHBYTES_20 0xf127e6b53e2005930718681d245fe5a2b22f2b9f OP_EQUAL OP_IF OP_OVER OP_4 OP_PICK OP_EQUAL OP_NOT OP_VERIFY OP_DUP OP_TOALTSTACK OP_CHECKDATASIGVERIFY OP_FROMALTSTACK OP_CHECKDATASIG OP_ELSE OP_RETURN OP_ENDIF OP_ENDIF';
  t.deepEqual(disassembleBytecodeBCH(hexToBin(zcfHex)), zcfAsm);
  t.deepEqual(assembleBytecodeBCH(zcfAsm), {
    bytecode: hexToBin(zcfHex),
    success: true,
  });
});

test('disassembleBytecodeBTC & assembleBytecodeBTC', (t) => {
  const zcfAsm =
    'OP_DUP OP_HASH160 OP_PUSHBYTES_20 0x8b139a5274cc85e2d36d4f97922a15ae5d7f68af OP_EQUAL OP_IF OP_CHECKSIG OP_ELSE OP_DUP OP_HASH160 OP_PUSHBYTES_20 0xf127e6b53e2005930718681d245fe5a2b22f2b9f OP_EQUAL OP_IF OP_OVER OP_4 OP_PICK OP_EQUAL OP_NOT OP_VERIFY OP_DUP OP_TOALTSTACK OP_UNKNOWN187 OP_FROMALTSTACK OP_UNKNOWN186 OP_ELSE OP_RETURN OP_ENDIF OP_ENDIF';
  t.deepEqual(disassembleBytecodeBTC(hexToBin(zcfHex)), zcfAsm);
  t.deepEqual(assembleBytecodeBTC(zcfAsm), {
    bytecode: hexToBin(zcfHex),
    success: true,
  });
});

const maxBinLength = 100;

testProp(
  '[fast-check] disassembleBytecodeBCH <-> assembleBytecodeBCH',
  [fc.uint8Array({ maxLength: maxBinLength, minLength: 0 })],
  (t, randomBytecode: Uint8Array) => {
    const parsed = decodeAuthenticationInstructions(randomBytecode);
    const instructions = (
      authenticationInstructionsAreMalformed(parsed)
        ? parsed.slice(0, -1)
        : parsed
    ) as AuthenticationInstruction[];
    const minimalPush = instructions.map((instruction) =>
      [OpcodesBCH2022.OP_PUSHDATA_2, OpcodesBCH2022.OP_PUSHDATA_4].includes(
        instruction.opcode,
      )
        ? { opcode: OpcodesBCH2022.OP_1 }
        : instruction.opcode === OpcodesBCH2022.OP_PUSHDATA_1 &&
            (instruction as AuthenticationInstructionPush).data.length < 76
          ? {
              data: new Uint8Array(76),
              opcode: OpcodesBCH2022.OP_PUSHDATA_1,
            }
          : instruction,
    );
    const encoded = encodeAuthenticationInstructions(minimalPush);

    const disassembled = disassembleBytecodeBCH(encoded);
    const reassembled = assembleBytecodeBCH(disassembled);
    if (!reassembled.success) {
      t.fail();
      return;
    }
    t.deepEqual(encoded, reassembled.bytecode);
  },
);

testProp(
  '[fast-check] disassembleBytecodeBTC <-> assembleBytecodeBTC',
  [fc.uint8Array({ maxLength: maxBinLength, minLength: 0 })],
  (t, randomBytecode: Uint8Array) => {
    const parsed = decodeAuthenticationInstructions(randomBytecode);
    const instructions = (
      authenticationInstructionsAreMalformed(parsed)
        ? parsed.slice(0, -1)
        : parsed
    ) as AuthenticationInstruction[];
    const minimalPush = instructions.map((instruction) =>
      [OpcodesBTC.OP_PUSHDATA_2, OpcodesBTC.OP_PUSHDATA_4].includes(
        instruction.opcode,
      )
        ? { opcode: OpcodesBTC.OP_1 }
        : instruction.opcode === OpcodesBTC.OP_PUSHDATA_1 &&
            (instruction as AuthenticationInstructionPush).data.length < 76
          ? {
              data: new Uint8Array(76),
              opcode: OpcodesBTC.OP_PUSHDATA_1,
            }
          : instruction,
    );
    const encoded = encodeAuthenticationInstructions(minimalPush);

    const disassembled = disassembleBytecodeBTC(encoded);
    const reassembled = assembleBytecodeBTC(disassembled);
    if (!reassembled.success) {
      t.fail();
      return;
    }
    t.deepEqual(encoded, reassembled.bytecode);
  },
);
