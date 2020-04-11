import { ErrorInformation, ResolvedScript } from './language-types';

/**
 * Extract a list of the errors which occurred while resolving a script.
 *
 * @param resolvedScript - the result of `resolveScript` from which to extract
 * errors
 */
export const getResolutionErrors = (
  resolvedScript: ResolvedScript
): ErrorInformation[] =>
  resolvedScript.reduce<ErrorInformation[]>((errors, segment) => {
    switch (segment.type) {
      case 'error':
        return [
          ...errors,
          {
            error: segment.value,
            range: segment.range,
          },
        ];
      case 'push':
      case 'evaluation':
        return [...errors, ...getResolutionErrors(segment.value)];
      default:
        return errors;
    }
  }, []);

// export const getReductionErrors = () => {};
