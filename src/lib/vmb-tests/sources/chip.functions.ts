import { range } from '../../format/format.js';
import type { VmbTestDefinitionGroup } from '../../lib.js';
import { packedTransactionScenario } from '../bch-vmb-test-mixins.js';
import { generateTestCases, setExpectedResults } from '../bch-vmb-test-utils.js';

export default [
  [
    'Transaction validation benchmarks',
    [
      [``, `<<1> OP_INVOKE> <1> OP_DEFINE <1> OP_INVOKE`, 'infinite OP_INVOKE', ['chip_functions_invalid']],
      [``, `<<1> OP_INVOKE> <1> OP_DEFINE <1> OP_INVOKE`, 'infinite OP_INVOKE, packed inputs', ['chip_functions_invalid', 'p2sh_ignore'], packedTransactionScenario('p2s', 2437)],
    ],
  ],
  [
    'OP_DEFINE/OP_INVOKE',
    [
      ...setExpectedResults(
        generateTestCases(
          ['', '<$1> <$0> OP_DEFINE <$0> OP_INVOKE $2', 'Define $0 to $1; invoke $0, check $2'],
          [
            [
              ['empty id', '""'],
              ['id', '"id"'],
              ['max-length id', '"id34567"'],
              ['excessive-length id', '"id345678"'],
            ],
            [
              ['push 0', 'OP_0'],
              ['push 3', 'OP_3'],
              ['push 13', 'OP_13'],
              ['push 0, push 1', 'OP_0 OP_1'],
              ['define 1 as OP_2 then push 1', '<OP_2> OP_1 OP_DEFINE OP_1'],
            ],
            [
              ['equals 0', '<0> OP_EQUAL'],
              ['equals 3', '<3> OP_EQUAL'],
              ['equals 13', '<13> OP_EQUAL'],
              ['stack has 1 then 0', '<1> OP_EQUALVERIFY <0> OP_EQUAL'],
              ['internal invoke produces 2', 'OP_INVOKE <2> OP_EQUAL'],
            ],
          ],
        ),
        {
          'Define empty id to define 1 as OP_2 then push 1; invoke empty id, check equals 0': ['chip_functions_invalid'],
          'Define empty id to define 1 as OP_2 then push 1; invoke empty id, check equals 13': ['chip_functions_invalid'],
          'Define empty id to define 1 as OP_2 then push 1; invoke empty id, check equals 3': ['chip_functions_invalid'],
          'Define empty id to define 1 as OP_2 then push 1; invoke empty id, check internal invoke produces 2': ['chip_functions'],
          'Define empty id to define 1 as OP_2 then push 1; invoke empty id, check stack has 1 then 0': ['chip_functions_invalid'],
          'Define empty id to push 0, push 1; invoke empty id, check equals 0': ['chip_functions_invalid'],
          'Define empty id to push 0, push 1; invoke empty id, check equals 13': ['chip_functions_invalid'],
          'Define empty id to push 0, push 1; invoke empty id, check equals 3': ['chip_functions_invalid'],
          'Define empty id to push 0, push 1; invoke empty id, check internal invoke produces 2': ['chip_functions_invalid'],
          'Define empty id to push 0, push 1; invoke empty id, check stack has 1 then 0': ['chip_functions'],
          'Define empty id to push 0; invoke empty id, check equals 0': ['chip_functions'],
          'Define empty id to push 0; invoke empty id, check equals 13': ['chip_functions_invalid'],
          'Define empty id to push 0; invoke empty id, check equals 3': ['chip_functions_invalid'],
          'Define empty id to push 0; invoke empty id, check internal invoke produces 2': ['chip_functions_invalid'],
          'Define empty id to push 0; invoke empty id, check stack has 1 then 0': ['chip_functions_invalid'],
          'Define empty id to push 13; invoke empty id, check equals 0': ['chip_functions_invalid'],
          'Define empty id to push 13; invoke empty id, check equals 13': ['chip_functions'],
          'Define empty id to push 13; invoke empty id, check equals 3': ['chip_functions_invalid'],
          'Define empty id to push 13; invoke empty id, check internal invoke produces 2': ['chip_functions_invalid'],
          'Define empty id to push 13; invoke empty id, check stack has 1 then 0': ['chip_functions_invalid'],
          'Define empty id to push 3; invoke empty id, check equals 0': ['chip_functions_invalid'],
          'Define empty id to push 3; invoke empty id, check equals 13': ['chip_functions_invalid'],
          'Define empty id to push 3; invoke empty id, check equals 3': ['chip_functions'],
          'Define empty id to push 3; invoke empty id, check internal invoke produces 2': ['chip_functions_invalid'],
          'Define empty id to push 3; invoke empty id, check stack has 1 then 0': ['chip_functions_invalid'],
          'Define excessive-length id to define 1 as OP_2 then push 1; invoke excessive-length id, check equals 0': ['chip_functions_invalid'],
          'Define excessive-length id to define 1 as OP_2 then push 1; invoke excessive-length id, check equals 13': ['chip_functions_invalid'],
          'Define excessive-length id to define 1 as OP_2 then push 1; invoke excessive-length id, check equals 3': ['chip_functions_invalid'],
          'Define excessive-length id to define 1 as OP_2 then push 1; invoke excessive-length id, check internal invoke produces 2': ['chip_functions_invalid'],
          'Define excessive-length id to define 1 as OP_2 then push 1; invoke excessive-length id, check stack has 1 then 0': ['chip_functions_invalid'],
          'Define excessive-length id to push 0, push 1; invoke excessive-length id, check equals 0': ['chip_functions_invalid'],
          'Define excessive-length id to push 0, push 1; invoke excessive-length id, check equals 13': ['chip_functions_invalid'],
          'Define excessive-length id to push 0, push 1; invoke excessive-length id, check equals 3': ['chip_functions_invalid'],
          'Define excessive-length id to push 0, push 1; invoke excessive-length id, check internal invoke produces 2': ['chip_functions_invalid'],
          'Define excessive-length id to push 0, push 1; invoke excessive-length id, check stack has 1 then 0': ['chip_functions_invalid'],
          'Define excessive-length id to push 0; invoke excessive-length id, check equals 0': ['chip_functions_invalid'],
          'Define excessive-length id to push 0; invoke excessive-length id, check equals 13': ['chip_functions_invalid'],
          'Define excessive-length id to push 0; invoke excessive-length id, check equals 3': ['chip_functions_invalid'],
          'Define excessive-length id to push 0; invoke excessive-length id, check internal invoke produces 2': ['chip_functions_invalid'],
          'Define excessive-length id to push 0; invoke excessive-length id, check stack has 1 then 0': ['chip_functions_invalid'],
          'Define excessive-length id to push 13; invoke excessive-length id, check equals 0': ['chip_functions_invalid'],
          'Define excessive-length id to push 13; invoke excessive-length id, check equals 13': ['chip_functions_invalid'],
          'Define excessive-length id to push 13; invoke excessive-length id, check equals 3': ['chip_functions_invalid'],
          'Define excessive-length id to push 13; invoke excessive-length id, check internal invoke produces 2': ['chip_functions_invalid'],
          'Define excessive-length id to push 13; invoke excessive-length id, check stack has 1 then 0': ['chip_functions_invalid'],
          'Define excessive-length id to push 3; invoke excessive-length id, check equals 0': ['chip_functions_invalid'],
          'Define excessive-length id to push 3; invoke excessive-length id, check equals 13': ['chip_functions_invalid'],
          'Define excessive-length id to push 3; invoke excessive-length id, check equals 3': ['chip_functions_invalid'],
          'Define excessive-length id to push 3; invoke excessive-length id, check internal invoke produces 2': ['chip_functions_invalid'],
          'Define excessive-length id to push 3; invoke excessive-length id, check stack has 1 then 0': ['chip_functions_invalid'],
          'Define id to define 1 as OP_2 then push 1; invoke id, check equals 0': ['chip_functions_invalid'],
          'Define id to define 1 as OP_2 then push 1; invoke id, check equals 13': ['chip_functions_invalid'],
          'Define id to define 1 as OP_2 then push 1; invoke id, check equals 3': ['chip_functions_invalid'],
          'Define id to define 1 as OP_2 then push 1; invoke id, check internal invoke produces 2': ['chip_functions'],
          'Define id to define 1 as OP_2 then push 1; invoke id, check stack has 1 then 0': ['chip_functions_invalid'],
          'Define id to push 0, push 1; invoke id, check equals 0': ['chip_functions_invalid'],
          'Define id to push 0, push 1; invoke id, check equals 13': ['chip_functions_invalid'],
          'Define id to push 0, push 1; invoke id, check equals 3': ['chip_functions_invalid'],
          'Define id to push 0, push 1; invoke id, check internal invoke produces 2': ['chip_functions_invalid'],
          'Define id to push 0, push 1; invoke id, check stack has 1 then 0': ['chip_functions'],
          'Define id to push 0; invoke id, check equals 0': ['chip_functions'],
          'Define id to push 0; invoke id, check equals 13': ['chip_functions_invalid'],
          'Define id to push 0; invoke id, check equals 3': ['chip_functions_invalid'],
          'Define id to push 0; invoke id, check internal invoke produces 2': ['chip_functions_invalid'],
          'Define id to push 0; invoke id, check stack has 1 then 0': ['chip_functions_invalid'],
          'Define id to push 13; invoke id, check equals 0': ['chip_functions_invalid'],
          'Define id to push 13; invoke id, check equals 13': ['chip_functions'],
          'Define id to push 13; invoke id, check equals 3': ['chip_functions_invalid'],
          'Define id to push 13; invoke id, check internal invoke produces 2': ['chip_functions_invalid'],
          'Define id to push 13; invoke id, check stack has 1 then 0': ['chip_functions_invalid'],
          'Define id to push 3; invoke id, check equals 0': ['chip_functions_invalid'],
          'Define id to push 3; invoke id, check equals 13': ['chip_functions_invalid'],
          'Define id to push 3; invoke id, check equals 3': ['chip_functions'],
          'Define id to push 3; invoke id, check internal invoke produces 2': ['chip_functions_invalid'],
          'Define id to push 3; invoke id, check stack has 1 then 0': ['chip_functions_invalid'],
          'Define max-length id to define 1 as OP_2 then push 1; invoke max-length id, check equals 0': ['chip_functions_invalid'],
          'Define max-length id to define 1 as OP_2 then push 1; invoke max-length id, check equals 13': ['chip_functions_invalid'],
          'Define max-length id to define 1 as OP_2 then push 1; invoke max-length id, check equals 3': ['chip_functions_invalid'],
          'Define max-length id to define 1 as OP_2 then push 1; invoke max-length id, check internal invoke produces 2': ['chip_functions'],
          'Define max-length id to define 1 as OP_2 then push 1; invoke max-length id, check stack has 1 then 0': ['chip_functions_invalid'],
          'Define max-length id to push 0, push 1; invoke max-length id, check equals 0': ['chip_functions_invalid'],
          'Define max-length id to push 0, push 1; invoke max-length id, check equals 13': ['chip_functions_invalid'],
          'Define max-length id to push 0, push 1; invoke max-length id, check equals 3': ['chip_functions_invalid'],
          'Define max-length id to push 0, push 1; invoke max-length id, check internal invoke produces 2': ['chip_functions_invalid'],
          'Define max-length id to push 0, push 1; invoke max-length id, check stack has 1 then 0': ['chip_functions'],
          'Define max-length id to push 0; invoke max-length id, check equals 0': ['chip_functions'],
          'Define max-length id to push 0; invoke max-length id, check equals 13': ['chip_functions_invalid'],
          'Define max-length id to push 0; invoke max-length id, check equals 3': ['chip_functions_invalid'],
          'Define max-length id to push 0; invoke max-length id, check internal invoke produces 2': ['chip_functions_invalid'],
          'Define max-length id to push 0; invoke max-length id, check stack has 1 then 0': ['chip_functions_invalid'],
          'Define max-length id to push 13; invoke max-length id, check equals 0': ['chip_functions_invalid'],
          'Define max-length id to push 13; invoke max-length id, check equals 13': ['chip_functions'],
          'Define max-length id to push 13; invoke max-length id, check equals 3': ['chip_functions_invalid'],
          'Define max-length id to push 13; invoke max-length id, check internal invoke produces 2': ['chip_functions_invalid'],
          'Define max-length id to push 13; invoke max-length id, check stack has 1 then 0': ['chip_functions_invalid'],
          'Define max-length id to push 3; invoke max-length id, check equals 0': ['chip_functions_invalid'],
          'Define max-length id to push 3; invoke max-length id, check equals 13': ['chip_functions_invalid'],
          'Define max-length id to push 3; invoke max-length id, check equals 3': ['chip_functions'],
          'Define max-length id to push 3; invoke max-length id, check internal invoke produces 2': ['chip_functions_invalid'],
          'Define max-length id to push 3; invoke max-length id, check stack has 1 then 0': ['chip_functions_invalid'],
        },
      ),
      ['<<3>>', '<0x00010203040506> OP_TUCK OP_DEFINE OP_INVOKE <3> OP_EQUAL', 'Define 0x00010203040506 to push 3, invoke returns 3', ['chip_functions']],
      ['<>', '<0x00010203040506> OP_TUCK OP_DEFINE OP_INVOKE <3> OP_EQUAL', 'Define 0x00010203040506 to do nothing, invoke does not return 3', ['chip_functions_invalid']],
      ['', '<0> OP_INVOKE <1>', 'Error on invocation of undefined function identifier (zero-byte id)', ['chip_functions_invalid']],
      ['', '<"unknown"> OP_INVOKE <1>', 'Error on invocation of undefined function identifier (max-length id)', ['chip_functions_invalid']],
      ['<1>', '<> <"empty"> OP_DEFINE <1> <"empty"> OP_INVOKE OP_EQUAL', 'Empty definition does nothing, stack preserved (accept)', ['chip_functions']],
      ['<0>', '<> <"empty"> OP_DEFINE <1> <"empty"> OP_INVOKE OP_EQUAL', 'Empty definition does nothing, stack preserved (reject)', ['chip_functions_invalid']],
      ['<13>', '<"reverse"> <<13>> OP_DEFINE <13> OP_EQUAL', 'Reversed parameters: function bodies are not parsed on definition', ['chip_functions']],
      ['<1>', 'OP_TOALTSTACK <> <"empty"> OP_DEFINE <1> <"empty"> OP_INVOKE OP_FROMALTSTACK OP_EQUAL', 'Empty definition does nothing, altstack preserved (accept)', ['chip_functions']],
      ['<0>', 'OP_TOALTSTACK <> <"empty"> OP_DEFINE <1> <"empty"> OP_INVOKE OP_FROMALTSTACK OP_EQUAL', 'Empty definition does nothing, altstack preserved (reject)', ['chip_functions_invalid']],
      ['', '<<3>> <"dup"> OP_DEFINE <<13>> <"dup"> OP_DEFINE', 'Attempted redefinition of "dup" rejects', ['chip_functions_invalid']],
      ['<1>', '<<3>> <"a"> OP_DEFINE <<13>> <"b"> OP_DEFINE <"a"> OP_INVOKE <3> OP_EQUALVERIFY <"b"> OP_INVOKE <13> OP_EQUALVERIFY', 'Two definitions behave as expected', ['chip_functions']],
      ['<1>', '<<3>> <"a"> OP_DEFINE <<13>> <"b"> OP_DEFINE', 'Two definitions accepted', ['chip_functions']],
      ['<1>', '<<3>> <"a"> OP_DEFINE <<13>> <"a"> OP_DEFINE', 'Shadowed definition rejected', ['chip_functions_invalid']],
      ['<1>', 'OP_IF <<3>> <"id_if"> OP_DEFINE OP_ENDIF <"id_if"> OP_INVOKE <3> OP_EQUAL', 'Define "id_if" to push 3 in taken OP_IF branch, invoke returns 3', ['chip_functions']],
      ['<0>', 'OP_IF <<3>> <"id_if"> OP_DEFINE OP_ENDIF <"id_if"> OP_INVOKE <3> OP_EQUAL', 'Define "id_if" to push 3 in skipped OP_IF branch, invoke fails', ['chip_functions_invalid']],
      ['<0>', 'OP_NOTIF <<3>> <"id_if"> OP_DEFINE OP_ENDIF <"id_if"> OP_INVOKE <3> OP_EQUAL', 'Define "id_if" to push 3 in taken OP_NOTIF branch, invoke returns 3', ['chip_functions']],
      ['<1>', 'OP_NOTIF <<3>> <"id_if"> OP_DEFINE OP_ENDIF <"id_if"> OP_INVOKE <3> OP_EQUAL', 'Define "id_if" to push 3 in skipped OP_NOTIF branch, invoke fails', ['chip_functions_invalid']],
      ['', 'OP_BEGIN <<3>> <"id_loop"> OP_DEFINE <1> OP_UNTIL <"id_loop"> OP_INVOKE <3> OP_EQUAL', 'Define "id_loop" to push 12 in one-iteration loop, invoke returns 12', ['chip_functions']],
      ['<<8>>', '<1> OP_DEFINE <<9>> <2> OP_DEFINE <2> OP_INVOKE <9> OP_EQUALVERIFY <1> OP_INVOKE <8> OP_EQUAL', 'Define 1 to push 8 and 2 to push 9, invocations return 9 then 8', ['chip_functions']],
      ['<1> <OP_PUSHBYTES_1>', '<1> OP_DEFINE', 'Define malformed bytecode without invoking', ['chip_functions']],
      ['<1> <OP_PUSHBYTES_1>', '<1> OP_DEFINE OP_INVOKE', 'Define malformed bytecode, attempt invoke', ['chip_functions_invalid']],
      ['<1> <1> <OP_PUSHBYTES_1>', '<1> OP_DEFINE OP_INVOKE', 'Define malformed bytecode, attempt invoke (fails despite next byte completing malformed instruction)', ['chip_functions_invalid']],
      ['<OP_3> <0> OP_DEFINE <0> OP_INVOKE', '<3> OP_EQUAL', 'Future-proofing: unlock defines 0 to push 3, then invokes 0, lock checks 3 (invalid if non-push unlocking bytecode is prohibited)', ['chip_functions_invalid']],
      ['<OP_3> <0> OP_DEFINE', '<0> OP_INVOKE <3> OP_EQUAL', 'Future-proofing: unlock defines 0 to push 3, lock invokes 0, checks 3 (remains invalid due to cross-phase function table reset)', ['chip_functions_invalid']],
      [`<1>`, `OP_DEFINE`, 'OP_DEFINE fails on single stack item', ['chip_functions_invalid']],
      [``, `OP_DEFINE`, 'OP_DEFINE fails on empty stack', ['chip_functions_invalid']],
      [`<1>`, `OP_INVOKE`, 'OP_INVOKE fails on single stack item', ['chip_functions_invalid']],
      [``, `OP_INVOKE`, 'OP_INVOKE fails on empty stack', ['chip_functions_invalid']],
      [`<1>`, `<<2> OP_ADD OP_TOALTSTACK OP_ACTIVEBYTECODE> <0> OP_DEFINE <0> OP_INVOKE <0x52936bc1> OP_EQUALVERIFY OP_FROMALTSTACK <4> OP_EQUAL`, 'Does not clear altstack, expected OP_ACTIVEBYTECODE (with 2 + 1 = 4)', ['chip_functions_invalid']],
      [`<2>`, `<<2> OP_ADD OP_TOALTSTACK OP_ACTIVEBYTECODE> <0> OP_DEFINE <0> OP_INVOKE <0x52936bc1> OP_EQUALVERIFY OP_FROMALTSTACK <4> OP_EQUAL`, 'Does not clear altstack, expected OP_ACTIVEBYTECODE (with 2 + 2 = 4)', ['chip_functions']],
      [`<2>`, `<<2> OP_ADD OP_TOALTSTACK OP_ACTIVEBYTECODE <OP_ACTIVEBYTECODE> <1> OP_DEFINE> <0> OP_DEFINE <0> OP_INVOKE <0x52936bc101c15189> OP_EQUALVERIFY <1> OP_INVOKE <0xc1> OP_EQUALVERIFY OP_FROMALTSTACK <4> OP_EQUAL`, 'Does not clear altstack, expected OP_ACTIVEBYTECODE for nested definition', ['chip_functions']],
      [`<2>`, `<<2> OP_ADD OP_TOALTSTACK OP_ACTIVEBYTECODE <OP_ACTIVEBYTECODE OP_CODESEPARATOR OP_ACTIVEBYTECODE> <1> OP_DEFINE> <0> OP_DEFINE <0> OP_INVOKE <0x52936bc103c1abc15189> OP_EQUALVERIFY <1> OP_INVOKE <0xc1> OP_EQUALVERIFY <0xc1abc1> OP_EQUALVERIFY OP_FROMALTSTACK <4> OP_EQUAL`, 'Expected OP_ACTIVEBYTECODE inside nested definition, one truncated at OP_CODESEPARATOR', ['chip_functions']],
      [
        ``,
        `<OP_ACTIVEBYTECODE OP_CODESEPARATOR OP_ACTIVEBYTECODE OP_CODESEPARATOR OP_ACTIVEBYTECODE OP_CODESEPARATOR OP_ACTIVEBYTECODE OP_CODESEPARATOR OP_ACTIVEBYTECODE OP_CODESEPARATOR OP_ACTIVEBYTECODE> <0> OP_DEFINE <<0> OP_INVOKE> <1> OP_DEFINE <1> OP_INVOKE OP_ADD OP_ADD OP_ADD OP_ADD OP_ADD <0x065b48af8603c55703acc1> OP_EQUAL`,
        'Multiple "OP_ACTIVEBYTECODE OP_CODESEPARATOR" produce expected result from nested invoke',
        ['chip_functions'],
      ],
      ['', '<OP_RETURN> <"panic"> OP_DEFINE <1>', 'Definition with OP_RETURN does not end evaluation', ['chip_functions']],
      ['', '<OP_RETURN> <"panic"> OP_DEFINE <"panic"> OP_INVOKE <1>', 'Invoke with OP_RETURN ends evaluation', ['chip_functions_invalid']],
      [``, `<< <<>> <'out'> OP_DEFINE> <'of'> OP_DEFINE> <'order'> OP_DEFINE <'order'> OP_INVOKE <'of'> OP_INVOKE <'out'> OP_INVOKE <0> OP_EQUAL`, 'Nested definition, any order', ['chip_functions']],
      [``, `<< <<>> <'out'> OP_DEFINE> <'of'> OP_DEFINE> <'order'> OP_DEFINE <'order'> OP_INVOKE <'out'> OP_INVOKE <0> OP_EQUAL`, 'Nested definition, any order (missing definition)', ['chip_functions_invalid']],
      [`<50> <$(<0> <9> OP_NUM2BIN)>`, `OP_DROP <OP_1SUB OP_IFDUP OP_IF <0> OP_INVOKE OP_ELSE <1> OP_ENDIF> <0> OP_DEFINE <0> OP_INVOKE`, 'Nesting with OP_IF/OP_ENDIF to depth 100, "OP_1" at 100', ['chip_functions']],
      [`<50> <$(<0> <9> OP_NUM2BIN)>`, `OP_DROP <OP_1SUB OP_IFDUP OP_IF <0> OP_INVOKE OP_ELSE OP_1 OP_IF OP_1 OP_ENDIF OP_ENDIF> <0> OP_DEFINE <0> OP_INVOKE`, 'Nesting with OP_IF/OP_ENDIF to depth 101, "OP_1 OP_IF OP_1 OP_ENDIF" at 100', ['chip_functions_invalid']],
      [`<<OP_2 OP_2 OP_ADD> <0> OP_TUCK OP_DEFINE OP_INVOKE>`, `<1> OP_TUCK OP_DEFINE OP_INVOKE OP_4 OP_EQUAL`, '((2 2 +)) 4 =', ['chip_functions']],
      [`<<OP_2 OP_2 OP_SUB> <0> OP_TUCK OP_DEFINE OP_INVOKE>`, `<1> OP_TUCK OP_DEFINE OP_INVOKE OP_0 OP_EQUAL`, '((2 2 -)) 0 =', ['chip_functions']],
      [`<<OP_2 OP_2 OP_ADD> <0> OP_TUCK OP_DEFINE OP_INVOKE>`, `<1> OP_TUCK OP_DEFINE OP_INVOKE OP_0 OP_EQUAL`, '((2 2 +)) 0 = (reject)', ['chip_functions_invalid']],
      [`<<OP_2 OP_2 OP_SUB> <0> OP_TUCK OP_DEFINE OP_INVOKE>`, `<1> OP_TUCK OP_DEFINE OP_INVOKE OP_4 OP_EQUAL`, '((2 2 -)) 4 = (reject)', ['chip_functions_invalid']],
      [`<<OP_2> <0> OP_TUCK OP_DEFINE OP_INVOKE OP_2 OP_ADD>`, `<1> OP_TUCK OP_DEFINE OP_INVOKE OP_4 OP_EQUAL`, '((2) 2 +) 4 =', ['chip_functions']],
      [`<OP_2 <OP_2> <0> OP_TUCK OP_DEFINE OP_INVOKE OP_ADD>`, `<1> OP_TUCK OP_DEFINE OP_INVOKE OP_4 OP_EQUAL`, '(2 (2) +) 4 =', ['chip_functions']],
      [`<OP_2 OP_2 <OP_ADD> <0> OP_TUCK OP_DEFINE OP_INVOKE>`, `<1> OP_TUCK OP_DEFINE OP_INVOKE OP_4 OP_EQUAL`, '(2 2 (+)) 4 =', ['chip_functions']],
      [`<OP_2 OP_2 <OP_ADD> <0> OP_TUCK OP_DEFINE OP_INVOKE>`, `<1> OP_TUCK OP_DEFINE OP_INVOKE OP_4 <OP_EQUAL> <2> OP_TUCK OP_DEFINE OP_INVOKE`, '(2 2 (+)) 4 (=)', ['chip_functions']],
      [`<OP_2>`, `<OP_2 OP_ADD> OP_CAT <0> OP_TUCK OP_DEFINE OP_INVOKE OP_4 OP_EQUAL`, 'Concatenated instructions', ['chip_functions']],
      [`<OP_ACTIVEBYTECODE>`, `OP_DUP <0> OP_TUCK OP_DEFINE OP_INVOKE OP_EQUAL`, 'Exposes evaluated instructions to OP_ACTIVEBYTECODE', ['chip_functions']],
      [`<13>`, `<OP_1SUB OP_TOALTSTACK OP_SWAP OP_OVER OP_ADD OP_FROMALTSTACK OP_IFDUP OP_IF <16> OP_INVOKE OP_ENDIF> <16> OP_DEFINE <<0> <1> OP_ROT <16> OP_INVOKE OP_NIP> <15> OP_DEFINE <6> <15> OP_INVOKE OP_EQUAL`, 'Fibonacci to 13', ['chip_functions']],
      [`<21>`, `<OP_1SUB OP_TOALTSTACK OP_SWAP OP_OVER OP_ADD OP_FROMALTSTACK OP_IFDUP OP_IF <16> OP_INVOKE OP_ENDIF> <16> OP_DEFINE <<0> <1> OP_ROT <16> OP_INVOKE OP_NIP> <15> OP_DEFINE <7> <15> OP_INVOKE OP_EQUAL`, 'Fibonacci to 21', ['chip_functions']],
      [`<144>`, `<OP_1SUB OP_TOALTSTACK OP_SWAP OP_OVER OP_ADD OP_FROMALTSTACK OP_IFDUP OP_IF <16> OP_INVOKE OP_ENDIF> <16> OP_DEFINE <<0> <1> OP_ROT <16> OP_INVOKE OP_NIP> <15> OP_DEFINE <11> <15> OP_INVOKE OP_EQUAL`, 'Fibonacci to 144', ['chip_functions']],
      [`<1>`, `<OP_IF <1> OP_ENDIF> <0> OP_TUCK OP_DEFINE OP_INVOKE`, 'OP_IF inside invoked definition', ['chip_functions']],
      [`<0>`, `<OP_IF <1> OP_ENDIF> <0> OP_TUCK OP_DEFINE OP_INVOKE`, 'OP_IF inside invoked definition (reject)', ['chip_functions_invalid']],
      [`<0>`, `<OP_IF <0> OP_ELSE <1> OP_ENDIF> <0> OP_TUCK OP_DEFINE OP_INVOKE`, 'OP_IF + OP_ELSE inside invoked definition', ['chip_functions']],
      [`<1>`, `<OP_IF <0> OP_ELSE <1> OP_ENDIF> <0> OP_TUCK OP_DEFINE OP_INVOKE`, 'OP_IF + OP_ELSE inside invoked definition (reject)', ['chip_functions_invalid']],
      [`<0>`, `<OP_NOTIF <1> OP_ENDIF> <0> OP_TUCK OP_DEFINE OP_INVOKE`, 'OP_NOTIF inside invoked definition', ['chip_functions']],
      [`<1>`, `<OP_NOTIF <1> OP_ENDIF> <0> OP_TUCK OP_DEFINE OP_INVOKE`, 'OP_NOTIF inside invoked definition (reject)', ['chip_functions_invalid']],
      [`<1>`, `<OP_NOTIF <0> OP_ELSE <1> OP_ENDIF> <0> OP_TUCK OP_DEFINE OP_INVOKE`, 'OP_NOTIF + OP_ELSE inside invoked definition', ['chip_functions']],
      [`<0>`, `<OP_NOTIF <0> OP_ELSE <1> OP_ENDIF> <0> OP_TUCK OP_DEFINE OP_INVOKE`, 'OP_NOTIF + OP_ELSE inside invoked definition (reject)', ['chip_functions_invalid']],
      [`<1>`, `<OP_IF <1>> <0> OP_TUCK OP_DEFINE OP_INVOKE`, 'Unclosed OP_IF inside invoked definition', ['chip_functions_invalid']],
      [`<1>`, `<OP_IF <1>> <0> OP_TUCK OP_DEFINE OP_INVOKE OP_ENDIF`, 'Unclosed OP_IF inside invoked definition, attempt outer close', ['chip_functions_invalid']],
      [`<1> <1>`, `<OP_IF> <0> OP_TUCK OP_DEFINE OP_INVOKE`, 'Single OP_IF inside invoked definition', ['chip_functions_invalid']],
      [`<1> <1>`, `<OP_IF> <0> OP_TUCK OP_DEFINE OP_INVOKE OP_ENDIF`, 'Single OP_IF inside invoked definition, attempt outer close', ['chip_functions_invalid']],
      [
        `<${range(99)
          .map(() => '<')
          .join('')} <13> ${range(99)
          .map((i) => `> <${i}> OP_TUCK OP_DEFINE OP_INVOKE`)
          .join('')}>`,
        `<99> OP_TUCK OP_DEFINE OP_INVOKE <13> OP_EQUAL`,
        'Can be nested (99x)',
        ['chip_functions'],
      ],
      [
        `<${range(99)
          .map(() => '<')
          .join('')} <13> <1> OP_IF OP_ENDIF ${range(99)
          .map((i) => `> <${i}> OP_TUCK OP_DEFINE OP_INVOKE`)
          .join('')}>`,
        `<99> OP_TUCK OP_DEFINE OP_INVOKE <13> OP_EQUAL`,
        '99-deep nested invoke, excessively-nested OP_IF (taken, reject)',
        ['chip_functions_invalid'],
      ],
      [
        `<${range(99)
          .map(() => '<')
          .join('')} <13> <0> OP_IF OP_ENDIF ${range(99)
          .map((i) => `> <${i}> OP_TUCK OP_DEFINE OP_INVOKE`)
          .join('')}>`,
        `<99> OP_TUCK OP_DEFINE OP_INVOKE <13> OP_EQUAL`,
        '99-deep nested invoke, excessively-nested OP_IF (skipped, also reject)',
        ['chip_functions_invalid'],
      ],
      [
        `<${range(99)
          .map(() => '<')
          .join('')} <13> <0> OP_NOTIF OP_ENDIF ${range(99)
          .map((i) => `> <${i}> OP_TUCK OP_DEFINE OP_INVOKE`)
          .join('')}>`,
        `<99> OP_TUCK OP_DEFINE OP_INVOKE <13> OP_EQUAL`,
        '99-deep nested invoke, excessively-nested OP_NOTIF (taken, reject)',
        ['chip_functions_invalid'],
      ],
      [
        `<${range(99)
          .map(() => '<')
          .join('')} <13> <1> OP_NOTIF OP_ENDIF ${range(99)
          .map((i) => `> <${i}> OP_TUCK OP_DEFINE OP_INVOKE`)
          .join('')}>`,
        `<99> OP_TUCK OP_DEFINE OP_INVOKE <13> OP_EQUAL`,
        '99-deep nested invoke, excessively-nested OP_NOTIF (skipped, also reject)',
        ['chip_functions_invalid'],
      ],
      [
        `<${range(98)
          .map(() => '<')
          .join('')} <13> <1> OP_IF OP_ENDIF ${range(98)
          .map((i) => `> <${i}> OP_TUCK OP_DEFINE OP_INVOKE`)
          .join('')}>`,
        `<98> OP_TUCK OP_DEFINE OP_INVOKE <13> OP_EQUAL`,
        '98-deep nested invoke, max-nested OP_IF (taken)',
        ['chip_functions'],
      ],
      [
        `<${range(98)
          .map(() => '<')
          .join('')} <13> <0> OP_IF OP_ENDIF ${range(98)
          .map((i) => `> <${i}> OP_TUCK OP_DEFINE OP_INVOKE`)
          .join('')}>`,
        `<98> OP_TUCK OP_DEFINE OP_INVOKE <13> OP_EQUAL`,
        '98-deep nested invoke, max-nested OP_IF (skipped)',
        ['chip_functions'],
      ],
      [
        `<${range(98)
          .map(() => '<')
          .join('')} <13> <0> OP_NOTIF OP_ENDIF ${range(98)
          .map((i) => `> <${i}> OP_TUCK OP_DEFINE OP_INVOKE`)
          .join('')}>`,
        `<98> OP_TUCK OP_DEFINE OP_INVOKE <13> OP_EQUAL`,
        '98-deep nested invoke, max-nested OP_NOTIF (taken)',
        ['chip_functions'],
      ],
      [
        `<${range(98)
          .map(() => '<')
          .join('')} <13> <1> OP_NOTIF OP_ENDIF ${range(98)
          .map((i) => `> <${i}> OP_TUCK OP_DEFINE OP_INVOKE`)
          .join('')}>`,
        `<98> OP_TUCK OP_DEFINE OP_INVOKE <13> OP_EQUAL`,
        '98-deep nested invoke, max-nested OP_NOTIF (skipped)',
        ['chip_functions'],
      ],
      [
        `<${range(100)
          .map(() => '<')
          .join('')} <13> ${range(100)
          .map((i) => `> <${i}> OP_TUCK OP_DEFINE OP_INVOKE`)
          .join('')}>`,
        `<100> OP_TUCK OP_DEFINE OP_INVOKE <13> OP_EQUAL`,
        'Control stack limited to depth of 100',
        ['chip_functions_invalid'],
      ],
      [
        `<${range(99)
          .map(() => '<')
          .join('')} <13> ${range(99)
          .map((i) => `> <${i}> OP_TUCK OP_DEFINE OP_INVOKE`)
          .join('')}>`,
        `<<13>> <100> OP_DEFINE <99> OP_TUCK OP_DEFINE OP_INVOKE <13> OP_EQUAL`,
        'Can be nested (99x) after unused definition',
        ['chip_functions'],
      ],
      [
        `<${range(99)
          .map(() => '<')
          .join('')} <100> OP_INVOKE ${range(99)
          .map((i) => `> <${i}> OP_TUCK OP_DEFINE OP_INVOKE`)
          .join('')}>`,
        `<<13>> <100> OP_DEFINE <99> OP_TUCK OP_DEFINE OP_INVOKE <13> OP_EQUAL`,
        'Fails on final OP_INVOKE when definition is used',
        ['chip_functions_invalid'],
      ],
      [
        `<${range(99)
          .map(() => '<')
          .join('')} <100> OP_INVOKE ${range(99)
          .map((i) => `> <${i}> OP_TUCK OP_DEFINE OP_INVOKE`)
          .join('')}>`,
        `<> <100> OP_DEFINE <99> OP_TUCK OP_DEFINE OP_INVOKE <1>`,
        'Fails on 100-deep OP_INVOKE, even with empty definition',
        ['chip_functions_invalid'],
      ],
      [
        `<${range(98)
          .map(() => '<')
          .join('')} <100> OP_INVOKE ${range(98)
          .map((i) => `> <${i}> OP_TUCK OP_DEFINE OP_INVOKE`)
          .join('')}>`,
        `<> <100> OP_DEFINE <98> OP_TUCK OP_DEFINE OP_INVOKE <1>`,
        'Succeeds on 99-deep OP_INVOKE (empty definition)',
        ['chip_functions'],
      ],
      [
        `<1> ${range(998)
          .map(() => '<0>')
          .join(' ')}`,
        `<0> OP_DEFINE OP_BEGIN OP_UNTIL <1>`,
        'Fill stack to 999 via unlocking bytecode, push again and attempt define (reject p2sh)',
        ['chip_functions', 'p2sh_invalid'],
      ],
      [
        `<1> ${range(998)
          .map(() => '<0>')
          .join(' ')}`,
        `<0> OP_DEFINE <0> <1> OP_DEFINE OP_BEGIN OP_UNTIL <1>`,
        'Fill stack to 999 via unlocking bytecode, push again and attempt two defines',
        ['chip_functions_invalid'],
      ],
      [
        `<1> ${range(999)
          .map(() => '<0>')
          .join(' ')}`,
        `OP_DEFINE OP_BEGIN OP_UNTIL <1>`,
        'Fill stack to 1000 via unlocking bytecode, attempt define',
        ['chip_functions', 'p2sh_invalid'],
      ],
      [
        `<1> ${range(1000)
          .map(() => '<0>')
          .join(' ')}`,
        `OP_DEFINE OP_BEGIN OP_UNTIL <1>`,
        'Fill stack to 1001 via unlocking bytecode, attempt define',
        ['chip_functions_invalid'],
      ],
      [
        `<1> ${range(997)
          .map(() => '<0>')
          .join(' ')}`,
        `OP_BEGIN <1> OP_TOALTSTACK OP_UNTIL <0> <0> OP_DEFINE <1>`,
        'Fill altstack to 998, attempt define (empty definition)',
        ['chip_functions'],
      ],
      [
        `<1> ${range(997)
          .map(() => '<0>')
          .join(' ')}`,
        `OP_BEGIN <1> OP_TOALTSTACK OP_UNTIL <0> <0> OP_DEFINE <0> <1> OP_DEFINE <1>`,
        'Fill altstack to 998, attempt two defines (empty definition)',
        ['chip_functions_invalid'],
      ],
    ],
  ],
] as const satisfies VmbTestDefinitionGroup[];
