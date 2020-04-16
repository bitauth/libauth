import { AuthenticationTemplate } from './template-types';

/**
 * TODO: finish implementing
 * - validate all types
 * - enforce no duplicate IDs (all must be unique among entities, variables, and scripts)
 *
 * Parse and validate an authentication template, returning either an error
 * message or the validated `AuthenticationTemplate`.
 * @param maybeTemplate - object to validate as an authentication template
 */
export const validateAuthenticationTemplate = (
  maybeTemplate: unknown
): string | AuthenticationTemplate => {
  if (typeof maybeTemplate !== 'object' || maybeTemplate === null) {
    return 'A valid AuthenticationTemplate must be an object.';
  }
  if ((maybeTemplate as { version?: unknown }).version !== 0) {
    return 'Only version 0 authentication templates are currently supported.';
  }
  // TODO: finish
  return maybeTemplate as AuthenticationTemplate;
};
