import type { WalletTemplate } from '../lib.js';

import { ajvStandaloneJsonParse } from './ajv/ajv-utils.js';
// eslint-disable-next-line import/no-internal-modules
import walletTemplateValidator from './ajv/validate-wallet-template.js';

/**
 * Safely parse and validate a wallet template, returning either an
 * error message as a string or a valid {@link WalletTemplate}. The
 * template may be provided either as an untrusted JSON string or as a
 * pre-parsed object.
 *
 * This method validates both the structure and the contents of a template:
 * - All properties and sub-properties are verified to be of the expected type.
 * - The template contains no unknown properties.
 * - The ID of each entity, script, and scenario is confirmed to be unique.
 * - Script IDs referenced by entities and other scripts (via `unlocks`) are
 * confirmed to exist.
 * - The derivation paths of each HdKey are validated against each other.
 *
 * This method does not validate the CashAssembly contents of scripts (by
 * attempting compilation, evaluating {@link WalletTemplateScriptTest}s,
 * or testing scenario generation).
 *
 * @param untrustedJsonOrObject - the JSON string or object to validate as a
 * wallet template
 */
export const importWalletTemplate = (
  untrustedJsonOrObject: unknown,
): WalletTemplate | string => {
  const errorPrefix = `Wallet template import failed:`;
  const template = ajvStandaloneJsonParse<WalletTemplate>(
    untrustedJsonOrObject,
    walletTemplateValidator,
  );
  if (typeof template === 'string') {
    return `${errorPrefix}${template}`;
  }

  // TODO: add back other validation
  return template;
};
