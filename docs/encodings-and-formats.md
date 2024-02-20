# Encodings and Formats

Libauth includes functions for encoding, decoding, and converting data between a variety of data formats.

# Format Utility Functions

Libauth includes utility functions to convert data between a variety of data formats. These functions accept an input in the original format and produce an output in the requested format; if the conversion can fail, error messages are returned as strings.

These functions include:

- **Binary**:
  - `binToBase58`/`base58ToBin`
  - `binToBase64`/`base64ToBin`
  - `binToBech32Padded`/`bech32PaddedToBin`
  - `binToBigIntUint256BE`/`bigIntToBinUint256BEClamped`
  - `binToBigIntUint64LE`/`bigIntToBinUint64LE` (`bigIntToBinUint64LEClamped`)
  - `binToBigIntUintBE`
  - `binToBigIntUintLE`/`bigIntToBinUintLE`
  - `binToBinString`/`binStringToBin`
  - `binToFixedLength`
  - `binToHex`/`hexToBin`
  - `binToNumberInt16LE`
  - `binToNumberInt32LE`
  - `binToNumberUint16LE`
  - `binToNumberUint32LE`
  - `binToNumberUintLE`
  - `binToUtf8`/`utf8ToBin`
  - `binToValueSatoshis`/`valueSatoshisToBin`
- **Number Formats**:
  - `bigIntToCompactUint`/`compactUintToBigInt`
  - `bigIntToVmNumber`/`vmNumberToBigInt`
- **Locking Bytecode**:
  - `lockingBytecodeToAddressContents`/`addressContentsToLockingBytecode`
  - `lockingBytecodeToCashAddress`/`cashAddressToLockingBytecode`
  - `lockingBytecodeToBase58Address`/`base58AddressToLockingBytecode`
- **Time**:
  - `locktimeToDate` (`decodeLocktime`)/`dateToLocktime` (`dateToLocktimeBin`)
- Miscellaneous mappings (not functions):
  - `cashAddressTypeToTypeBits`/`cashAddressTypeBitsToType`
  - `cashAddressSizeBitsToLength`/`cashAddressLengthToSizeBits`
  - `nftCapabilityNumberToLabel`/`nftCapabilityLabelToNumber`

# Encoding

All message and data formats supported by Libauth have a matching `encode*` function. Encoding functions accept the data to encode and return either the encoded data or – if encoding can fail – an error message (`string`).

These functions include:

- `encodeAuthenticationInstruction`
- `encodeAuthenticationInstructionMalformed`
- `encodeAuthenticationInstructionMaybeMalformed`
- `encodeAuthenticationInstructions`
- `encodeAuthenticationInstructionsMaybeMalformed`
- `encodeBase58Address`
- `encodeBase58AddressFormat`
- `encodeBech32`
- `encodeBip39Mnemonic`
- `encodeCashAddress`
- `encodeCashAddressFormat`
- `encodeCashAddressNonStandard`
- `encodeCashAddressVersionByte`
- `encodeDataPush`
- `encodeHdPrivateKey`
- `encodeHdPublicKey`
- `encodeLockingBytecodeP2pk`
- `encodeLockingBytecodeP2pkh`
- `encodeLockingBytecodeP2sh20`
- `encodePrivateKeyWif`
- `encodeSigningSerializationBCH`
- `encodeTokenPrefix`
- `encodeTransaction`
- `encodeTransactionBCH`
- `encodeTransactionCommon`
- `encodeTransactionInput`
- `encodeTransactionInputSequenceNumbersForSigning`
- `encodeTransactionInputs`
- `encodeTransactionOutpoints`
- `encodeTransactionOutput`
- `encodeTransactionOutputs`
- `encodeTransactionOutputsForSigning`

# Decoding

Libauth decoding functions can follow two patterns, a high-level `decode*` pattern, or a lower-level `read*` pattern.

# `decode` Utility Functions

Often, self-contained formats and message types have a simple `decode*` message to fully-decode the input in a single pass. These functions typically behave similarly to their matching `encode*` functions: they accept the data to decode (as a `Uint8Array`) and return either the decoded data/object or an error message (a `string`).

The `decode*` utility functions include:

- `decodeAuthenticationInstruction`
- `decodeAuthenticationInstructions`
- `decodeBase58Address`
- `decodeBase58AddressFormat`
- `decodeBech32`
- `decodeBip39Mnemonic`
- `decodeBitcoinSignature`
- `decodeCashAddress`
- `decodeCashAddressFormat`
- `decodeCashAddressFormatWithoutPrefix`
- `decodeCashAddressNonStandard`
- `decodeCashAddressVersionByte`
- `decodeHdKey`
- `decodeHdPrivateKey`
- `decodeHdPublicKey`
- `decodeLittleEndianNumber`
- `decodeLocktime`
- `decodePrivateKeyWif`
- `decodeTransaction`
- `decodeTransactionBCH`
- `decodeTransactionCommon`
- `decodeTransactionUnsafe`
- `decodeTransactionUnsafeBCH`
- `decodeTransactionUnsafeCommon`

# `read` Utility Functions

For lower-level control of decoding behavior, Libauth includes a variety of `read*` functions that accept a `ReadPosition` – an object containing a `Uint8Array` (`bin`) and a `number` indicating the index of the next character to be read (`nextIndex`) – and return either an error message (a `string`) or a result object with the decoded value and the next `ReadPosition`. These `read*` functions allow data to be read from a specific location in a longer `Uint8Array` and are used to build up the higher-level `decode*` functions.

The `read*` utility functions include:

- `readBytes`
- `readCompactUint`
- `readCompactUintMinimal`
- `readCompactUintPrefixedBin`
- `readItemCount`
- `readLockingBytecodeWithPrefix`
- `readMultiple`
- `readRemainingBytes`
- `readTokenAmount`
- `readTokenPrefix`
- `readTransactionCommon`
- `readTransactionInput`
- `readTransactionInputs`
- `readTransactionOutput`
- `readTransactionOutputs`
- `readUint32LE`
- `readUint64LE`
