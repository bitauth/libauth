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
              : {
                  missingIdentifier: segment.missingIdentifier,
                  owningEntity: segment.owningEntity,
                }),
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
 * Note, errors are only recoverable if the "entity ownership" of each missing
 * identifier is known (specified in `CompilationData`'s `entityOwnership`).
 *
 * @param errors - an array of compilation errors
 */
export const allErrorsAreRecoverable = (
  errors: CompilationError[]
): errors is CompilationErrorRecoverable[] =>
  errors.every(
    (error) =>
      (error as CompilationErrorRecoverable).missingIdentifier !== undefined &&
      (error as CompilationErrorRecoverable).owningEntity !== undefined
  );

/**
 * A single resolution for a `ResolvedSegment`. The `variable`, `script`, or
 * `opcode` property contains the full identifier which resolved to `bytecode`.
 */
export type BtlResolution =
  | { bytecode: Uint8Array; variable: string }
  | { bytecode: Uint8Array; script: string }
  | { bytecode: Uint8Array; opcode: string };

/**
 * Get an array of all resolutions used in a `ResolvedScript`.
 * @param resolvedScript - the resolved script to search
 */
export const getResolutions = (
  resolvedScript: ResolvedScript
): BtlResolution[] =>
  // eslint-disable-next-line complexity
  resolvedScript.reduce<BtlResolution[]>((all, segment) => {
    switch (segment.type) {
      case 'push':
      case 'evaluation':
        return [...all, ...getResolutions(segment.value)];
      case 'bytecode':
        if ('variable' in segment) {
          return [
            ...all,
            {
              bytecode: segment.value,
              variable: segment.variable,
            },
          ];
        }
        if ('script' in segment) {
          return [
            ...all,
            ...getResolutions(segment.source),
            {
              bytecode: segment.value,
              script: segment.script,
            },
          ];
        }
        if ('opcode' in segment) {
          return [
            ...all,
            {
              bytecode: segment.value,
              opcode: segment.opcode,
            },
          ];
        }
        return all;
      default:
        return all;
    }
  }, []);

/**
 * Get a map of the variable identifiers used in a `ResolvedScript` to their
 * resolved bytecode.
 *
 * @param resolvedScript - the resolved script to search
 */
export const getResolvedVariableBytecode = (resolvedScript: ResolvedScript) =>
  getResolutions(resolvedScript).reduce<{
    [fullIdentifier: string]: Uint8Array;
  }>(
    (all, resolution) =>
      'variable' in resolution
        ? {
            ...all,
            [resolution.variable]: resolution.bytecode,
          }
        : all,
    {}
  );
