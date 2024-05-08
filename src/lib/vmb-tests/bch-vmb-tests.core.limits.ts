/**
 * See `bch-vmb-tests.ts` for details about modifying this file.
 */

import type { VmbTestDefinitionGroup } from '../lib.js';
import { binToHex, cashAssemblyToBin } from '../lib.js';

export const limitsTestDefinitionsBch: VmbTestDefinitionGroup = [
  'Transaction structure and limits',
  [
    ['', '<1>', 'Empty unlocking bytecode is supported'],
    ['<1>', '<1>', 'Requires empty unlocking bytecode', ['invalid']],
    ['', '<1>', '(Nonstandard) outputs may be malformed', ['nonstandard'], { transaction: { outputs: [{ lockingBytecode: binToHex(cashAssemblyToBin('OP_PUSHBYTES_13') as Uint8Array) }] } }],
    ['<1>', '', 'Empty locking bytecode is supported'],
    ['<0>', '', 'Empty locking bytecode requires truthy result', ['invalid']],
    ['<0>', 'OP_DROP <1>', 'Drop item and succeed'],
    ['', 'OP_DROP <1>', 'Drop non-existent item', ['invalid']],
    ['OP_PUSHDATA_2 520 $(<0> <520> OP_NUM2BIN)', 'OP_SIZE <520> OP_EQUAL OP_NIP', 'Allow 520 byte push'],
    ['OP_PUSHDATA_2 521 $(<0> <520> OP_NUM2BIN) 0xff', 'OP_SIZE <521> OP_EQUAL OP_NIP', 'Disallow 521 byte push', ['invalid']],
    [
      '',
      'OP_NOP <1> OP_IF OP_ELSE OP_ENDIF <0> OP_NOTIF <1> OP_ENDIF OP_VERIFY <1> OP_TOALTSTACK OP_FROMALTSTACK <2> OP_2DUP OP_2DROP <3> OP_3DUP OP_2OVER OP_2DROP OP_2ROT OP_2SWAP OP_IFDUP OP_DEPTH <7> OP_EQUALVERIFY OP_DROP OP_DUP OP_EQUALVERIFY OP_NIP OP_OVER <4> OP_PICK <5> OP_ROLL OP_EQUAL OP_ROT OP_NUMNOTEQUAL OP_TUCK OP_CAT OP_SWAP OP_SPLIT OP_EQUAL OP_NUM2BIN OP_BIN2NUM OP_SIZE <0x80> OP_OR <0x0f> OP_AND <0b11> OP_XOR OP_1ADD OP_1SUB OP_NEGATE OP_ABS OP_NOT OP_0NOTEQUAL OP_ADD OP_SUB OP_DUP OP_MUL <1> OP_DIV <1> OP_MOD <1> OP_BOOLAND <1> OP_BOOLOR <2> OP_NUMEQUAL <0> OP_NUMEQUALVERIFY <1> <2> OP_LESSTHAN <1> OP_GREATERTHAN <1> OP_LESSTHANOREQUAL <1> OP_GREATERTHANOREQUAL <2> OP_MIN <2> OP_MAX <4> <3> OP_WITHIN OP_RIPEMD160 OP_SHA1 OP_SHA256 OP_HASH160 OP_HASH256 OP_REVERSEBYTES OP_CODESEPARATOR <0> OP_CHECKLOCKTIMEVERIFY OP_CHECKSEQUENCEVERIFY OP_2DROP OP_INPUTINDEX OP_ACTIVEBYTECODE OP_2DROP OP_TXVERSION OP_TXINPUTCOUNT OP_TXOUTPUTCOUNT OP_TXLOCKTIME OP_OUTPOINTINDEX OP_INPUTSEQUENCENUMBER OP_UTXOVALUE <0> OP_OUTPUTVALUE <0> OP_UTXOBYTECODE <0> OP_OUTPOINTTXHASH <0> OP_OUTPUTBYTECODE OP_2DROP OP_2DROP OP_2DROP OP_2DROP /* 91 operations here */ <$(<201> <91> OP_SUB <1> OP_ADD)> OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB /* 201 operations here */',
      'Allows up to 201 operations (non-signature operations)',
    ],
    [
      '',
      'OP_NOP <1> OP_IF OP_ELSE OP_ENDIF <0> OP_NOTIF <1> OP_ENDIF OP_VERIFY <1> OP_TOALTSTACK OP_FROMALTSTACK <2> OP_2DUP OP_2DROP <3> OP_3DUP OP_2OVER OP_2DROP OP_2ROT OP_2SWAP OP_IFDUP OP_DEPTH <7> OP_EQUALVERIFY OP_DROP OP_DUP OP_EQUALVERIFY OP_NIP OP_OVER <4> OP_PICK <5> OP_ROLL OP_EQUAL OP_ROT OP_NUMNOTEQUAL OP_TUCK OP_CAT OP_SWAP OP_SPLIT OP_EQUAL OP_NUM2BIN OP_BIN2NUM OP_SIZE <0x80> OP_OR <0x0f> OP_AND <0b11> OP_XOR OP_1ADD OP_1SUB OP_NEGATE OP_ABS OP_NOT OP_0NOTEQUAL OP_ADD OP_SUB OP_DUP OP_MUL <1> OP_DIV <1> OP_MOD <1> OP_BOOLAND <1> OP_BOOLOR <2> OP_NUMEQUAL <0> OP_NUMEQUALVERIFY <1> <2> OP_LESSTHAN <1> OP_GREATERTHAN <1> OP_LESSTHANOREQUAL <1> OP_GREATERTHANOREQUAL <2> OP_MIN <2> OP_MAX <4> <3> OP_WITHIN OP_RIPEMD160 OP_SHA1 OP_SHA256 OP_HASH160 OP_HASH256 OP_REVERSEBYTES OP_CODESEPARATOR <0> OP_CHECKLOCKTIMEVERIFY OP_CHECKSEQUENCEVERIFY OP_2DROP OP_INPUTINDEX OP_ACTIVEBYTECODE OP_2DROP OP_TXVERSION OP_TXINPUTCOUNT OP_TXOUTPUTCOUNT OP_TXLOCKTIME OP_OUTPOINTINDEX OP_INPUTSEQUENCENUMBER OP_UTXOVALUE <0> OP_OUTPUTVALUE <0> OP_UTXOBYTECODE <0> OP_OUTPOINTTXHASH <0> OP_OUTPUTBYTECODE OP_2DROP OP_2DROP OP_2DROP OP_2DROP /* 91 operations here */ <$(<201> <91> OP_SUB <1> OP_ADD)> OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB /* 201 operations here */ OP_NOP',
      'Fails at 202 operations (non-signature operations)',
      ['invalid'],
    ],
    [
      '',
      'OP_NOP <1> OP_IF OP_ELSE OP_ENDIF <0> OP_NOTIF <1> OP_ENDIF OP_VERIFY <1> OP_TOALTSTACK OP_FROMALTSTACK <2> OP_2DUP OP_2DROP <3> OP_3DUP OP_2OVER OP_2DROP OP_2ROT OP_2SWAP OP_IFDUP OP_DEPTH <7> OP_EQUALVERIFY OP_DROP OP_DUP OP_EQUALVERIFY OP_NIP OP_OVER <4> OP_PICK <5> OP_ROLL OP_EQUAL OP_ROT OP_NUMNOTEQUAL OP_TUCK OP_CAT OP_SWAP OP_SPLIT OP_EQUAL OP_NUM2BIN OP_BIN2NUM OP_SIZE <0x80> OP_OR <0x0f> OP_AND <0b11> OP_XOR OP_1ADD OP_1SUB OP_NEGATE OP_ABS OP_NOT OP_0NOTEQUAL OP_ADD OP_SUB OP_DUP OP_MUL <1> OP_DIV <1> OP_MOD <1> OP_BOOLAND <1> OP_BOOLOR <2> OP_NUMEQUAL <0> OP_NUMEQUALVERIFY <1> <2> OP_LESSTHAN <1> OP_GREATERTHAN <1> OP_LESSTHANOREQUAL <1> OP_GREATERTHANOREQUAL <2> OP_MIN <2> OP_MAX <4> <3> OP_WITHIN OP_RIPEMD160 OP_SHA1 OP_SHA256 OP_HASH160 OP_HASH256 OP_REVERSEBYTES OP_CODESEPARATOR <0> OP_CHECKLOCKTIMEVERIFY OP_CHECKSEQUENCEVERIFY OP_2DROP OP_INPUTINDEX OP_ACTIVEBYTECODE OP_2DROP OP_TXVERSION OP_TXINPUTCOUNT OP_TXOUTPUTCOUNT OP_TXLOCKTIME OP_OUTPOINTINDEX OP_INPUTSEQUENCENUMBER OP_UTXOTOKENCATEGORY OP_OUTPUTTOKENCATEGORY OP_UTXOTOKENCOMMITMENT OP_OUTPUTTOKENCOMMITMENT OP_UTXOTOKENAMOUNT OP_UTXOTOKENAMOUNT OP_UTXOVALUE <0> OP_OUTPUTVALUE <0> OP_UTXOBYTECODE <0> OP_OUTPOINTTXHASH <0> OP_OUTPUTBYTECODE OP_2DROP OP_2DROP OP_2DROP OP_2DROP /* 97 operations here */ <$(<201> <97> OP_SUB <1> OP_ADD)> OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB /* 201 operations here */',
      'Allows up to 201 operations (non-signature operations, CashToken operations)',
      [],
    ],
    [
      '',
      'OP_NOP <1> OP_IF OP_ELSE OP_ENDIF <0> OP_NOTIF <1> OP_ENDIF OP_VERIFY <1> OP_TOALTSTACK OP_FROMALTSTACK <2> OP_2DUP OP_2DROP <3> OP_3DUP OP_2OVER OP_2DROP OP_2ROT OP_2SWAP OP_IFDUP OP_DEPTH <7> OP_EQUALVERIFY OP_DROP OP_DUP OP_EQUALVERIFY OP_NIP OP_OVER <4> OP_PICK <5> OP_ROLL OP_EQUAL OP_ROT OP_NUMNOTEQUAL OP_TUCK OP_CAT OP_SWAP OP_SPLIT OP_EQUAL OP_NUM2BIN OP_BIN2NUM OP_SIZE <0x80> OP_OR <0x0f> OP_AND <0b11> OP_XOR OP_1ADD OP_1SUB OP_NEGATE OP_ABS OP_NOT OP_0NOTEQUAL OP_ADD OP_SUB OP_DUP OP_MUL <1> OP_DIV <1> OP_MOD <1> OP_BOOLAND <1> OP_BOOLOR <2> OP_NUMEQUAL <0> OP_NUMEQUALVERIFY <1> <2> OP_LESSTHAN <1> OP_GREATERTHAN <1> OP_LESSTHANOREQUAL <1> OP_GREATERTHANOREQUAL <2> OP_MIN <2> OP_MAX <4> <3> OP_WITHIN OP_RIPEMD160 OP_SHA1 OP_SHA256 OP_HASH160 OP_HASH256 OP_REVERSEBYTES OP_CODESEPARATOR <0> OP_CHECKLOCKTIMEVERIFY OP_CHECKSEQUENCEVERIFY OP_2DROP OP_INPUTINDEX OP_ACTIVEBYTECODE OP_2DROP OP_TXVERSION OP_TXINPUTCOUNT OP_TXOUTPUTCOUNT OP_TXLOCKTIME OP_OUTPOINTINDEX OP_INPUTSEQUENCENUMBER OP_UTXOTOKENCATEGORY OP_OUTPUTTOKENCATEGORY OP_UTXOTOKENCOMMITMENT OP_OUTPUTTOKENCOMMITMENT OP_UTXOTOKENAMOUNT OP_UTXOTOKENAMOUNT OP_UTXOVALUE <0> OP_OUTPUTVALUE <0> OP_UTXOBYTECODE <0> OP_OUTPOINTTXHASH <0> OP_OUTPUTBYTECODE OP_2DROP OP_2DROP OP_2DROP OP_2DROP /* 97 operations here */ <$(<201> <97> OP_SUB <1> OP_ADD)> OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB OP_1SUB /* 201 operations here */ OP_NOP',
      'Fails at 202 operations (non-signature operations, CashToken operations)',
      ['invalid'],
    ],
  ],
];