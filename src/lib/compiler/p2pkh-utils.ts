import { lockingBytecodeToCashAddress } from '../address/address.js';
import { formatError } from '../format/format.js';
import { stringifyErrors } from '../language/language.js';
import type {
  CashAddressNetworkPrefix,
  CashAddressResult,
  deriveHdPublicKey,
  WalletTemplateHdKey,
} from '../lib.js';

import { walletTemplateToCompilerBCH } from './compiler-bch/compiler-bch.js';
import {
  walletTemplateP2pkh,
  walletTemplateP2pkhNonHd,
} from './standard/standard.js';

export enum P2pkhUtilityError {
  hdPrivateKeyToP2pkhLockingBytecodeCompilation = 'P2PKH utility error: could not derive P2PKH locking bytecode from the provided HD private key.',
  hdPublicKeyToP2pkhLockingBytecodeCompilation = 'P2PKH utility error: could not derive P2PKH locking bytecode from the provided HD public key.',
  privateKeyToP2pkhLockingBytecodeCompilation = 'P2PKH utility error: could not derive P2PKH locking bytecode from the provided private key.',
  publicKeyToP2pkhLockingBytecodeCompilation = 'P2PKH utility error: could not derive P2PKH locking bytecode from the provided public key.',
}

/**
 * Derive the P2PKH locking bytecode of the provided private key.
 *
 * Note that this function defaults to throwing an error if provided with an
 * invalid private key. To handle errors in a type-safe way, set `throwErrors`
 * to `false`.
 *
 * To derive the resulting CashAddress, use
 * {@link privateKeyToP2pkhCashAddress}. For HD private keys, use
 * {@link hdPrivateKeyToP2pkhLockingBytecode}. For the public key equivalent,
 * see {@link publicKeyToP2pkhLockingBytecode}.
 */
export const privateKeyToP2pkhLockingBytecode = <
  ThrowErrors extends boolean = true,
>({
  privateKey,
  throwErrors = true as ThrowErrors,
}: {
  /**
   * The private key from which to derive the P2PKH locking bytecode.
   */
  privateKey: Uint8Array;
  /**
   * If `true`, this function will throw an `Error` if the provided `privateKey`
   * is invalid rather than returning the error as a string (defaults
   * to `true`).
   */
  throwErrors?: ThrowErrors;
}): ThrowErrors extends true ? Uint8Array : Uint8Array | string => {
  const compiler = walletTemplateToCompilerBCH(walletTemplateP2pkhNonHd);
  const lockingBytecode = compiler.generateBytecode({
    data: { keys: { privateKeys: { key: privateKey } } },
    scriptId: 'lock',
  });
  if (!lockingBytecode.success) {
    return formatError(
      P2pkhUtilityError.privateKeyToP2pkhLockingBytecodeCompilation,
      stringifyErrors(lockingBytecode.errors),
      throwErrors,
    );
  }
  return lockingBytecode.bytecode;
};

/**
 * Derive the P2PKH locking bytecode of the provided public key.
 *
 * Note that this function defaults to throwing an error if provided with an
 * invalid public key. To handle errors in a type-safe way, set `throwErrors`
 * to `false`.
 *
 * To derive the resulting CashAddress, use {@link publicKeyToP2pkhCashAddress}.
 * For HD public keys, use {@link hdPublicKeyToP2pkhLockingBytecode}. For the
 * private key equivalent, see {@link privateKeyToP2pkhLockingBytecode}.
 */
export const publicKeyToP2pkhLockingBytecode = <
  ThrowErrors extends boolean = true,
>({
  publicKey,
  throwErrors = true as ThrowErrors,
}: {
  /**
   * The public key from which to derive the P2PKH locking bytecode.
   */
  publicKey: Uint8Array;
  /**
   * If `true`, this function will throw an `Error` if the provided `publicKey`
   * is invalid rather than returning the error as a string (defaults
   * to `true`).
   */
  throwErrors?: ThrowErrors;
}): ThrowErrors extends true ? Uint8Array : Uint8Array | string => {
  const compiler = walletTemplateToCompilerBCH(walletTemplateP2pkhNonHd);
  const lockingBytecode = compiler.generateBytecode({
    // eslint-disable-next-line @typescript-eslint/naming-convention
    data: { bytecode: { 'key.public_key': publicKey } },
    scriptId: 'lock',
  });
  if (!lockingBytecode.success) {
    return formatError(
      P2pkhUtilityError.publicKeyToP2pkhLockingBytecodeCompilation,
      stringifyErrors(lockingBytecode.errors),
      throwErrors,
    );
  }
  return lockingBytecode.bytecode;
};

/**
 * Derive the P2PKH locking bytecode at the provided path and address index of
 * the provided HD private key.
 *
 * Note that this function defaults to throwing an error if provided with an
 * invalid HD private key or derivation path. To handle errors in a type-safe
 * way, set `throwErrors` to `false`.
 *
 * To derive the resulting CashAddress, use
 * {@link hdPrivateKeyToP2pkhCashAddress}. For non-HD private keys, use
 * {@link privateKeyToP2pkhLockingBytecode}. For the HD public key equivalent,
 * see {@link hdPublicKeyToP2pkhLockingBytecode}.
 */
export const hdPrivateKeyToP2pkhLockingBytecode = <
  ThrowErrors extends boolean = true,
>({
  addressIndex,
  hdPrivateKey,
  privateDerivationPath = 'i',
  throwErrors = true as ThrowErrors,
}: {
  /**
   * The address index within the BIP32 account specified by
   * `privateDerivationPath` at which to derive the P2PKH  locking bytecode.
   *
   * Address indexes must be positive integers between `0` and `4294967295`
   * (`0xffffffff`), inclusive. An error will be thrown or returned (in
   * accordance with `throwErrors`) for address indexes outside of this range.
   *
   * As standardized by BIP32, address indexes less than `2147483648`
   * (`0x80000000`) use standard derivation, while indexes equal to or greater
   * than `2147483648` use the "hardened" derivation algorithm. Note that this
   * prevents the HD public key derived from the provided HD private key
   * ({@link deriveHdPublicKey}) from deriving any address indexes beyond
   * `2147483647`. (In these cases, {@link hdPublicKeyToP2pkhLockingBytecode}
   * and {@link hdPublicKeyToP2pkhCashAddress} will produce an error.)
   */
  addressIndex: number;
  /**
   * An encoded HD private key, e.g.
   * `xprv9s21ZrQH143K3GJpoapnV8SFfukcVBSfeCficPSGfubmSFDxo1kuHnLisriDvSnRRuL2Qrg5ggqHKNVpxR86QEC8w35uxmGoggxtQTPvfUu`.
   *
   * HD private keys may be encoded for either mainnet or testnet (the network
   * information is ignored).
   */
  hdPrivateKey: string;
  /**
   * The private derivation path for the BIP32 account to use in deriving the
   * P2PKH address. By default, `i`.
   *
   * This path uses the notation specified in BIP32 and the `i`
   * character to represent the `addressIndex`.
   *
   * For example, for the first external P2PKH address of the first BCH account
   * as standardized by SLIP44, `privateDerivationPath` should be
   * `m/44'/145'/0'/0/i`, while `addressIndex` is set to `0`. (For "change"
   * addresses, `privateDerivationPath` should be `m/44'/145'/0'/1/i`.)
   *
   * This path may be relative or absolute, see
   * {@link WalletTemplateHdKey.privateDerivationPath} for details.
   */
  privateDerivationPath?: string;
  /**
   * If `true`, this function will throw an `Error` if the provided
   * `hdPrivateKey` is invalid rather than returning the error as a string
   * (defaults to `true`).
   */
  throwErrors?: ThrowErrors;
}): ThrowErrors extends true ? Uint8Array : Uint8Array | string => {
  const template = structuredClone(walletTemplateP2pkh);
  // eslint-disable-next-line functional/no-expression-statements, functional/immutable-data, @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
  (template as any).entities.owner!.variables.key!.privateDerivationPath =
    privateDerivationPath;
  const compiler = walletTemplateToCompilerBCH(template);
  const lockingBytecode = compiler.generateBytecode({
    data: { hdKeys: { addressIndex, hdPrivateKeys: { owner: hdPrivateKey } } },
    scriptId: 'lock',
  });
  if (!lockingBytecode.success) {
    return formatError(
      P2pkhUtilityError.hdPrivateKeyToP2pkhLockingBytecodeCompilation,
      stringifyErrors(lockingBytecode.errors),
      throwErrors,
    );
  }
  return lockingBytecode.bytecode;
};

/**
 * Derive the P2PKH locking bytecode at the provided index of the provided HD
 * public key.
 *
 * Note that this function defaults to throwing an error if provided with an
 * invalid HD public key. To handle errors in a type-safe way, set `throwErrors`
 * to `false`.
 *
 * To derive the resulting CashAddress, use
 * {@link hdPublicKeyToP2pkhCashAddress}. For non-HD public keys, use
 * {@link publicKeyToP2pkhLockingBytecode}. For the HD private key equivalent,
 * see {@link hdPrivateKeyToP2pkhLockingBytecode}.
 */
export const hdPublicKeyToP2pkhLockingBytecode = <
  ThrowErrors extends boolean = true,
>({
  addressIndex,
  hdPublicKey,
  hdPublicKeyDerivationPath = '',
  throwErrors = true as ThrowErrors,
  publicDerivationPath = 'i',
}: {
  /**
   * The non-hardened address index within the BIP32 account specified by
   * `publicDerivationPath` at which to derive the P2PKH locking bytecode.
   *
   * Non-hardened address indexes must be positive integers between `0` and
   * `2147483647`, inclusive. An error will be thrown or returned (in
   * accordance with `throwErrors`) for address indexes outside of this range.
   *
   * As standardized by BIP32, address indexes less than `2147483648`
   * (`0x80000000`) use standard derivation, while indexes equal to or greater
   * than `2147483648` use the "hardened" derivation algorithm. Note that this
   * prevents the HD public key derived from the provided HD private key
   * ({@link deriveHdPublicKey}) from deriving any address indexes beyond
   * `2147483647`. (In these cases, {@link hdPublicKeyToP2pkhLockingBytecode}
   * and {@link hdPublicKeyToP2pkhCashAddress} will produce an error.)
   */
  addressIndex: number;
  /**
   * An encoded HD public key, e.g.
   * `xpub661MyMwAqRbcFkPHucMnrGNzDwb6teAX1RbKQmqtEF8kK3Z7LZ59qafCjB9eCRLiTVG3uxBxgKvRgbubRhqSKXnGGb1aoaqLrpMBDrVxga8`
   *
   * HD private keys may be encoded for either mainnet or testnet (the network
   * information is ignored).
   */
  hdPublicKey: string;
  /**
   * The path at which the provided `hdPublicKey` should have been derived from
   * it's master HD private key. This is used only to verify that the depth
   * encoded in the provided `hdPublicKey` is equal to the expected depth. This
   * verification can help to detect software incompatibility or HD public key
   * transmission errors which might otherwise result in derivation of addresses
   * at unexpected derivation paths.
   *
   * Defaults to an empty string (`""`), which disables depth verification.
   */
  hdPublicKeyDerivationPath?: string;
  /**
   * The public derivation path for the BIP32 account to use in deriving the
   * P2PKH address. By default, `i`.
   *
   * This path uses the notation specified in BIP32 and the `i`
   * character to represent the `addressIndex`.
   *
   * For example, for the first external P2PKH address of the first BCH account
   * as standardized by SLIP44, `hdPublicKeyDerivationPath` should be
   * `m/44'/145'/0'`, `publicDerivationPath` should be `0/i`, while
   * `addressIndex` is set to `0`. (For "change" addresses,
   * `publicDerivationPath` should be `1/i`.)
   *
   * This path must be relative, see
   * {@link WalletTemplateHdKey.publicDerivationPath} for details.
   */
  publicDerivationPath?: string;
  /**
   * If `true`, this function will throw an `Error` if the provided
   * `hdPublicKey` is invalid rather than returning the error as a string
   * (defaults to `true`).
   */
  throwErrors?: ThrowErrors;
}): ThrowErrors extends true ? Uint8Array : Uint8Array | string => {
  const template = structuredClone(walletTemplateP2pkh);
  /* eslint-disable functional/no-expression-statements, functional/immutable-data, @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access */
  (template as any).entities.owner!.variables.key!.publicDerivationPath =
    publicDerivationPath;
  (template as any).entities.owner!.variables.key!.hdPublicKeyDerivationPath =
    hdPublicKeyDerivationPath;
  (template as any).entities.owner!.variables.key!.privateDerivationPath =
    hdPublicKeyDerivationPath === ''
      ? publicDerivationPath
      : `${hdPublicKeyDerivationPath}/${publicDerivationPath}`;
  /* eslint-enable functional/no-expression-statements, functional/immutable-data, @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access */

  const compiler = walletTemplateToCompilerBCH(template);
  const lockingBytecode = compiler.generateBytecode({
    data: { hdKeys: { addressIndex, hdPublicKeys: { owner: hdPublicKey } } },
    scriptId: 'lock',
  });
  if (!lockingBytecode.success) {
    return formatError(
      P2pkhUtilityError.hdPublicKeyToP2pkhLockingBytecodeCompilation,
      stringifyErrors(lockingBytecode.errors),
      throwErrors,
    );
  }
  return lockingBytecode.bytecode;
};

/**
 * Derive the P2PKH address of the provided private key.
 *
 * Note that this function defaults to throwing an error if provided with an
 * invalid private key. To handle errors in a type-safe way, set `throwErrors`
 * to `false`.
 *
 * To derive only the locking bytecode, use
 * {@link privateKeyToP2pkhLockingBytecode}. For HD private keys, use
 * {@link hdPrivateKeyToP2pkhCashAddress}. For the public key equivalent,
 * see {@link publicKeyToP2pkhCashAddress}.
 */
export const privateKeyToP2pkhCashAddress = <
  ThrowErrors extends boolean = true,
>({
  privateKey,
  prefix = 'bitcoincash',
  throwErrors = true as ThrowErrors,
  tokenSupport = false,
}: {
  /**
   * The private key from which to derive the P2PKH address.
   */
  privateKey: Uint8Array;
  /**
   * The {@link CashAddressNetworkPrefix} to use when encoding the address.
   * (Default: `bitcoincash`)
   */
  prefix?: `${CashAddressNetworkPrefix}`;
  /**
   * If `true`, this function will throw an `Error` if the provided `privateKey`
   * is invalid rather than returning the error as a string (defaults
   * to `true`).
   */
  throwErrors?: ThrowErrors;
  /**
   * If `true`, the address will indicate that the receiver accepts CashTokens;
   * defaults to `false`.
   */
  tokenSupport?: boolean;
}): ThrowErrors extends true
  ? CashAddressResult
  : CashAddressResult | string => {
  const bytecode = privateKeyToP2pkhLockingBytecode({
    privateKey,
    throwErrors,
  });
  if (typeof bytecode === 'string') {
    return formatError(bytecode, undefined, throwErrors);
  }
  return lockingBytecodeToCashAddress({
    bytecode,
    prefix,
    tokenSupport,
  }) as CashAddressResult;
};

/**
 * Derive the P2PKH address of the provided public key.
 *
 * Note that this function defaults to throwing an error if provided with an
 * invalid public key. To handle errors in a type-safe way, set `throwErrors`
 * to `false`.
 *
 * To derive only the locking bytecode, use
 * {@link publicKeyToP2pkhLockingBytecode}. For HD public keys, use
 * {@link hdPublicKeyToP2pkhCashAddress}. For the private key equivalent,
 * see {@link privateKeyToP2pkhCashAddress}.
 */
export const publicKeyToP2pkhCashAddress = <
  ThrowErrors extends boolean = true,
>({
  publicKey,
  prefix = 'bitcoincash',
  throwErrors = true as ThrowErrors,
  tokenSupport = false,
}: {
  /**
   * The public key from which to derive the P2PKH address.
   */
  publicKey: Uint8Array;
  /**
   * The {@link CashAddressNetworkPrefix} to use when encoding the address.
   * (Default: `bitcoincash`)
   */
  prefix?: `${CashAddressNetworkPrefix}`;
  /**
   * If `true`, this function will throw an `Error` if the provided `publicKey`
   * is invalid rather than returning the error as a string (defaults
   * to `true`).
   */
  throwErrors?: ThrowErrors;
  /**
   * If `true`, the address will indicate that the receiver accepts CashTokens;
   * defaults to `false`.
   */
  tokenSupport?: boolean;
}): ThrowErrors extends true
  ? CashAddressResult
  : CashAddressResult | string => {
  const bytecode = publicKeyToP2pkhLockingBytecode({
    publicKey,
    throwErrors,
  });
  if (typeof bytecode === 'string') {
    return formatError(bytecode, undefined, throwErrors);
  }
  return lockingBytecodeToCashAddress({
    bytecode,
    prefix,
    tokenSupport,
  }) as CashAddressResult;
};

/**
 * Derive the P2PKH address at the provided index of the provided HD
 * private key.
 *
 * Note that this function defaults to throwing an error if provided with an
 * invalid HD private key or derivation path. To handle errors in a type-safe
 * way, set `throwErrors` to `false`.
 *
 * To derive only the locking bytecode, use
 * {@link hdPrivateKeyToP2pkhLockingBytecode}. For non-HD private keys, use
 * {@link privateKeyToP2pkhCashAddress}. For the HD public key equivalent,
 * see {@link hdPublicKeyToP2pkhCashAddress}.
 */
export const hdPrivateKeyToP2pkhCashAddress = <
  ThrowErrors extends boolean = true,
>({
  addressIndex,
  hdPrivateKey,
  prefix = 'bitcoincash',
  privateDerivationPath = 'i',
  throwErrors = true as ThrowErrors,
  tokenSupport = false,
}: {
  /**
   * The address index within the BIP32 account specified by
   * `privateDerivationPath` at which to derive the P2PKH address.
   *
   * Address indexes must be positive integers between `0` and `4294967295`
   * (`0xffffffff`), inclusive. An error will be thrown or returned (in
   * accordance with `throwErrors`) for address indexes outside of this range.
   *
   * As standardized by BIP32, address indexes less than `2147483648`
   * (`0x80000000`) use standard derivation, while indexes equal to or greater
   * than `2147483648` use the "hardened" derivation algorithm. Note that this
   * prevents the HD public key derived from the provided HD private key
   * ({@link deriveHdPublicKey}) from deriving any address indexes beyond
   * `2147483647`. (In these cases, {@link hdPublicKeyToP2pkhLockingBytecode}
   * and {@link hdPublicKeyToP2pkhCashAddress} will produce an error.)
   */
  addressIndex: number;
  /**
   * An encoded HD private key, e.g.
   * `xprv9s21ZrQH143K3GJpoapnV8SFfukcVBSfeCficPSGfubmSFDxo1kuHnLisriDvSnRRuL2Qrg5ggqHKNVpxR86QEC8w35uxmGoggxtQTPvfUu`.
   *
   * HD private keys may be encoded for either mainnet or testnet (the network
   * information is ignored in favor of `prefix`).
   */
  hdPrivateKey: string;
  /**
   * The {@link CashAddressNetworkPrefix} to use when encoding the address.
   * (Default: `bitcoincash`)
   */
  prefix?: `${CashAddressNetworkPrefix}`;
  /**
   * The private derivation path for the BIP32 account to use in deriving the
   * P2PKH address. By default, `i`.
   *
   * This path uses the notation specified in BIP32 and the `i`
   * character to represent the `addressIndex`.
   *
   * For example, for the first external P2PKH address of the first BCH account
   * as standardized by SLIP44, `privateDerivationPath` should be
   * `m/44'/145'/0'/0/i`, while `addressIndex` is set to `0`. (For "change"
   * addresses, `privateDerivationPath` should be `m/44'/145'/0'/1/i`.)
   *
   * This path may be relative or absolute, see
   * {@link WalletTemplateHdKey.privateDerivationPath} for details.
   */
  privateDerivationPath?: string;
  /**
   * If `true`, this function will throw an `Error` if the provided
   * `hdPrivateKey` is invalid rather than returning the error as a string
   * (defaults to `true`).
   */
  throwErrors?: ThrowErrors;
  /**
   * If `true`, the address will indicate that the receiver accepts CashTokens;
   * defaults to `false`.
   */
  tokenSupport?: boolean;
}): ThrowErrors extends true
  ? CashAddressResult
  : CashAddressResult | string => {
  const bytecode = hdPrivateKeyToP2pkhLockingBytecode({
    addressIndex,
    hdPrivateKey,
    privateDerivationPath,
    throwErrors,
  });
  if (typeof bytecode === 'string') {
    return formatError(bytecode, undefined, throwErrors);
  }
  return lockingBytecodeToCashAddress({
    bytecode,
    prefix,
    tokenSupport,
  }) as CashAddressResult;
};

/**
 * Derive the P2PKH address at the provided index of the provided HD
 * public key.
 *
 * Note that this function defaults to throwing an error if provided with an
 * invalid HD public key. To handle errors in a type-safe way, set `throwErrors`
 * to `false`.
 *
 * To derive only the locking bytecode, use
 * {@link hdPublicKeyToP2pkhLockingBytecode}. For non-HD public keys, use
 * {@link publicKeyToP2pkhCashAddress}. For the HD private key equivalent,
 * see {@link hdPrivateKeyToP2pkhCashAddress}.
 */
export const hdPublicKeyToP2pkhCashAddress = <
  ThrowErrors extends boolean = true,
>({
  addressIndex,
  hdPublicKey,
  hdPublicKeyDerivationPath = '',
  prefix = 'bitcoincash',
  publicDerivationPath = 'i',
  throwErrors = true as ThrowErrors,
  tokenSupport = false,
}: {
  /**
   * The non-hardened address index within the BIP32 account specified by
   * `publicDerivationPath` at which to derive the P2PKH address.
   *
   * Non-hardened address indexes must be positive integers between `0` and
   * `2147483647`, inclusive. An error will be thrown or returned (in
   * accordance with `throwErrors`) for address indexes outside of this range.
   *
   * As standardized by BIP32, address indexes less than `2147483648`
   * (`0x80000000`) use standard derivation, while indexes equal to or greater
   * than `2147483648` use the "hardened" derivation algorithm. Note that this
   * prevents the HD public key derived from the provided HD private key
   * ({@link deriveHdPublicKey}) from deriving any address indexes beyond
   * `2147483647`. (In these cases, {@link hdPublicKeyToP2pkhLockingBytecode}
   * and {@link hdPublicKeyToP2pkhCashAddress} will produce an error.)
   */
  addressIndex: number;
  /**
   * An encoded HD public key, e.g.
   * `xpub661MyMwAqRbcFkPHucMnrGNzDwb6teAX1RbKQmqtEF8kK3Z7LZ59qafCjB9eCRLiTVG3uxBxgKvRgbubRhqSKXnGGb1aoaqLrpMBDrVxga8`
   *
   * HD public keys may be encoded for either mainnet or testnet (the network
   * information is ignored in favor of `prefix`).
   */
  hdPublicKey: string;
  /**
   * The path at which the provided `hdPublicKey` should have been derived from
   * it's master HD private key. This is used only to verify that the depth
   * encoded in the provided `hdPublicKey` is equal to the expected depth. This
   * verification can help to detect software incompatibility or HD public key
   * transmission errors which might otherwise result in derivation of addresses
   * at unexpected derivation paths.
   *
   * Defaults to an empty string (`""`), which disables depth verification.
   */
  hdPublicKeyDerivationPath?: string;
  /**
   * The {@link CashAddressNetworkPrefix} to use when encoding the address.
   * (Default: `bitcoincash`)
   */
  prefix?: `${CashAddressNetworkPrefix}`;
  /**
   * The public derivation path for the BIP32 account to use in deriving the
   * P2PKH address. By default, `i`.
   *
   * This path uses the notation specified in BIP32 and the `i`
   * character to represent the `addressIndex`.
   *
   * For example, for the first external P2PKH address of the first BCH account
   * as standardized by SLIP44, `hdPublicKeyDerivationPath` should be
   * `m/44'/145'/0'`, `publicDerivationPath` should be `0/i`, while
   * `addressIndex` is set to `0`. (For "change" addresses,
   * `publicDerivationPath` should be `1/i`.)
   *
   * This path must be relative, see
   * {@link WalletTemplateHdKey.publicDerivationPath} for details.
   */
  publicDerivationPath?: string;
  /**
   * If `true`, this function will throw an `Error` if the provided
   * `hdPublicKey` is invalid rather than returning the error as a string
   * (defaults to `true`).
   */
  throwErrors?: ThrowErrors;
  /**
   * If `true`, the address will indicate that the receiver accepts CashTokens;
   * defaults to `false`.
   */
  tokenSupport?: boolean;
}): ThrowErrors extends true
  ? CashAddressResult
  : CashAddressResult | string => {
  const bytecode = hdPublicKeyToP2pkhLockingBytecode({
    addressIndex,
    hdPublicKey,
    hdPublicKeyDerivationPath,
    publicDerivationPath,
    throwErrors,
  });
  if (typeof bytecode === 'string') {
    return formatError(bytecode, undefined, throwErrors);
  }
  return lockingBytecodeToCashAddress({
    bytecode,
    prefix,
    tokenSupport,
  }) as CashAddressResult;
};
