import {
  flattenBinArray,
  hexToBin,
  utf8ToBin,
} from '../../../../../format/format';
import { bigIntToScriptNumber, encodeDataPush } from '../../../common/common';
import { generateBytecodeMap } from '../../../instruction-sets-utils';
import { OpcodesBCH } from '../../bch-opcodes';

export const bitcoinABCOpcodes = Object.entries(
  generateBytecodeMap(OpcodesBCH)
).reduce<{
  readonly [opcode: string]: Uint8Array;
}>((acc, cur) => ({ ...acc, [cur[0].slice('OP_'.length)]: cur[1] }), {
  PUSHDATA1: Uint8Array.of(OpcodesBCH.OP_PUSHDATA_1), // eslint-disable-line @typescript-eslint/naming-convention
  PUSHDATA2: Uint8Array.of(OpcodesBCH.OP_PUSHDATA_2), // eslint-disable-line @typescript-eslint/naming-convention
  PUSHDATA4: Uint8Array.of(OpcodesBCH.OP_PUSHDATA_4), // eslint-disable-line @typescript-eslint/naming-convention
});

/**
 * Convert a string from Bitcoin ABC's `script_tests.json` text-format to
 * bytecode. The string must be valid – this method attempts to convert all
 * unmatched tokens to `BigInt`s.
 *
 * @privateRemarks
 * This method doesn't use {@link compileScript} because of a slight
 * incompatibility in the languages. In BTL, BigIntLiterals are a primitive
 * type, and must be surrounded by a push statement (e.g. `<100>`) to push a
 * number to the stack. In the `script_tests.json` text-format, numbers are
 * assumed to be pushed. We could implement a transformation after the
 * compiler's parse step, but because this format doesn't require any other
 * features of the compiler, we opt to implement this as a simple method.
 * @param abcScript - the script in Bitcoin ABC's `script_tests.json` text
 * format
 */
export const assembleBitcoinABCScript = (abcScript: string) =>
  flattenBinArray(
    abcScript
      .split(' ')
      .filter((token) => token !== '')
      .map((token) =>
        token.startsWith('0x')
          ? hexToBin(token.slice('0x'.length))
          : token.startsWith("'")
          ? encodeDataPush(utf8ToBin(token.slice(1, token.length - 1)))
          : (bitcoinABCOpcodes[token] as Uint8Array | undefined) === undefined
          ? encodeDataPush(bigIntToScriptNumber(BigInt(token)))
          : bitcoinABCOpcodes[token]
      )
  );
