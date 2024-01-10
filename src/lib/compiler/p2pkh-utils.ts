import { lockingBytecodeToCashAddress } from '../address/address.js';
import type { CashAddressNetworkPrefix, WalletTemplate } from '../lib.js';
import { importWalletTemplate } from '../schema/schema.js';

import { walletTemplateToCompilerBCH } from './compiler-bch/compiler-bch.js';
import { walletTemplateP2pkh } from './standard/standard.js';

/**
 * Derive the P2PKH locking bytecode at the provided index of the provided HD
 * private key.
 */
export const hdPrivateKeyToP2pkhLockingBytecode = ({
  addressIndex,
  hdKey,
}: {
  /**
   * An encoded HD private key, e.g.
   * `xprv9s21ZrQH143K2JbpEjGU94NcdKSASB7LuXvJCTsxuENcGN1nVG7QjMnBZ6zZNcJaiJogsRaLaYFFjs48qt4Fg7y1GnmrchQt1zFNu6QVnta`
   *
   * HD private keys may be encoded for either mainnet or testnet (the network
   * information is ignored).
   */
  hdKey: string;
  /**
   * The address index at which to derive the address.
   */
  addressIndex: number;
}) => {
  const compiler = walletTemplateToCompilerBCH(
    importWalletTemplate(walletTemplateP2pkh) as WalletTemplate,
  );
  const lockingBytecode = compiler.generateBytecode({
    data: { hdKeys: { addressIndex, hdPrivateKeys: { owner: hdKey } } },
    scriptId: 'lock',
  }) as { bytecode: Uint8Array; success: true };
  return lockingBytecode.bytecode;
};

/**
 * Derive the P2PKH address at the provided index of the provided HD
 * private key.
 */
export const hdPrivateKeyToP2pkhAddress = ({
  addressIndex,
  hdKey,
  prefix = 'bitcoincash',
}: {
  /**
   * An encoded HD private key, e.g.
   * `xprv9s21ZrQH143K2JbpEjGU94NcdKSASB7LuXvJCTsxuENcGN1nVG7QjMnBZ6zZNcJaiJogsRaLaYFFjs48qt4Fg7y1GnmrchQt1zFNu6QVnta`
   *
   * HD private keys may be encoded for either mainnet or testnet (the network
   * information is ignored).
   */
  hdKey: string;
  /**
   * The address index at which to derive the address.
   */
  addressIndex: number;
  /**
   * The {@link CashAddressNetworkPrefix} to use when encoding the address.
   * (Default: `bitcoincash`)
   */
  prefix?: `${CashAddressNetworkPrefix}`;
}) =>
  lockingBytecodeToCashAddress(
    hdPrivateKeyToP2pkhLockingBytecode({ addressIndex, hdKey }),
    prefix,
  ) as string;
