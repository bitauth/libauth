import {
  CompilationError,
  CompilationErrorRecoverable,
  ResolvedScript,
} from './language-types';

/**
 * Extract a list of the errors which occurred while resolving a script.
 *
 * @param resolvedScript - the result of `resolveScript` from which to extract
 * errors
 */
export const getResolutionErrors = (
  resolvedScript: ResolvedScript
): CompilationError[] =>
  resolvedScript.reduce<CompilationError[]>((errors, segment) => {
    switch (segment.type) {
      case 'error':
        return [
          ...errors,
          {
            error: segment.value,
            ...(segment.missingIdentifier === undefined
              ? {}
              : { missingIdentifier: segment.missingIdentifier }),
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

/**
 * Verify that every error in the provided array can be resolved by providing
 * additional variables in the compilation data (rather than deeper issues, like
 * problems with the authentication template or wallet implementation).
 *
 * @param errors - an array of compilation errors
 */
export const allErrorsAreRecoverable = (
  errors: CompilationError[]
): errors is CompilationErrorRecoverable[] =>
  errors.every((error) => 'missingIdentifier' in error);
