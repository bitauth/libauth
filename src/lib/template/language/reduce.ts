import { flattenBinArray } from '../../format/format';
import {
  AuthenticationErrorCommon,
  encodeDataPush,
} from '../../vm/instruction-sets/instruction-sets';
import { AuthenticationVirtualMachine } from '../../vm/virtual-machine';
import {
  AuthenticationProgramStateError,
  AuthenticationProgramStateExecutionStack,
  AuthenticationProgramStateStack,
} from '../../vm/vm-types';

import {
  CompilationError,
  Range,
  ResolvedScript,
  ScriptReductionTraceChildNode,
  ScriptReductionTraceScriptNode,
} from './language-types';
import { mergeRanges } from './language-utils';

const emptyReductionTraceNode = (range: Range) => ({
  bytecode: Uint8Array.of(),
  range,
});

/**
 * Perform the standard verification of BTL evaluation results. This ensures
 * that evaluations complete as expected: if an error occurs while computing an
 * evaluation, script compilation should fail.
 *
 * Three requirements are enforced:
 * - the evaluation may not produce an `error`
 * - the resulting stack must contain exactly 1 item
 * - the resulting execution stack must be empty (no missing `OP_ENDIF`s)
 *
 * This differs from the virtual machine's built-in `vm.verify` in that it is
 * often more lenient, for example, evaluations can succeed with an non-truthy
 * value on top of the stack.
 *
 * @param state - the final program state to verify
 */
export const verifyBtlEvaluationState = <
  ProgramState extends AuthenticationProgramStateStack &
    AuthenticationProgramStateExecutionStack &
    AuthenticationProgramStateError<unknown>
>(
  state: ProgramState
) => {
  if (state.error !== undefined) {
    return state.error;
  }
  if (state.executionStack.length !== 0) {
    return AuthenticationErrorCommon.nonEmptyExecutionStack;
  }
  if (state.stack.length !== 1) {
    return AuthenticationErrorCommon.requiresCleanStack;
  }
  return true;
};

/**
 * Reduce a resolved script, returning the resulting bytecode and a trace of the
 * reduction process.
 *
 * This method will return an error if provided a `resolvedScript` with
 * resolution errors. To check for resolution errors, use `getResolutionErrors`.
 *
 * @param resolvedScript - the `CompiledScript` to reduce
 * @param vm - the `AuthenticationVirtualMachine` to use for evaluations
 * @param createEvaluationProgram - a method which accepts the compiled bytecode
 * of an evaluation and returns the authentication program used to evaluate it
 */
export const reduceScript = <
  ProgramState extends AuthenticationProgramStateStack &
    AuthenticationProgramStateExecutionStack &
    AuthenticationProgramStateError<unknown>,
  AuthenticationProgram
>(
  resolvedScript: ResolvedScript,
  vm?: AuthenticationVirtualMachine<AuthenticationProgram, ProgramState>,
  createEvaluationProgram?: (instructions: Uint8Array) => AuthenticationProgram
): ScriptReductionTraceScriptNode<ProgramState> => {
  const script = resolvedScript.map<
    ScriptReductionTraceChildNode<ProgramState>
    // eslint-disable-next-line complexity
  >((segment) => {
    switch (segment.type) {
      case 'bytecode':
        return { bytecode: segment.value, range: segment.range };
      case 'push': {
        const push = reduceScript(segment.value, vm, createEvaluationProgram);
        const bytecode = encodeDataPush(push.bytecode);
        return {
          bytecode,
          ...(push.errors === undefined ? undefined : { errors: push.errors }),
          push,
          range: segment.range,
        };
      }
      case 'evaluation': {
        if (
          typeof vm === 'undefined' ||
          typeof createEvaluationProgram === 'undefined'
        ) {
          return {
            errors: [
              {
                error:
                  'Both a VM and a createState method are required to reduce evaluations.',
                range: segment.range,
              },
            ],
            ...emptyReductionTraceNode(segment.range),
          };
        }
        const reductionTrace = reduceScript(
          segment.value,
          vm,
          createEvaluationProgram
        );
        if (reductionTrace.errors !== undefined) {
          return {
            ...emptyReductionTraceNode(segment.range),
            errors: reductionTrace.errors,
            source: reductionTrace,
            trace: [],
          };
        }
        const trace = vm.debug(
          createEvaluationProgram(reductionTrace.bytecode)
        );

        /**
         * `vm.debug` should always return at least one state.
         */
        const lastState = trace[trace.length - 1];
        const result = verifyBtlEvaluationState(lastState);
        const bytecode = lastState.stack[lastState.stack.length - 1];

        return {
          ...(typeof result === 'string'
            ? {
                bytecode: Uint8Array.of(),
                errors: [
                  {
                    error: `Failed to reduce evaluation: ${result}`,
                    range: segment.range,
                  },
                ],
              }
            : {
                bytecode,
              }),
          range: segment.range,
          source: reductionTrace,
          trace,
        };
      }
      case 'comment':
        return emptyReductionTraceNode(segment.range);
      case 'error':
        return {
          errors: [
            {
              error: `Tried to reduce a BTL script with resolution errors: ${segment.value}`,
              range: segment.range,
            },
          ],
          ...emptyReductionTraceNode(segment.range),
        };
      // eslint-disable-next-line functional/no-conditional-statement
      default:
        // eslint-disable-next-line functional/no-throw-statement, @typescript-eslint/no-throw-literal, no-throw-literal
        throw new Error(
          `"${(segment as { type: string }).type}" is not a known segment type.`
        ) as never;
    }
  });
  const reduction = script.reduce<{
    bytecode: Uint8Array[];
    errors?: CompilationError[] | undefined;
    ranges: Range[];
  }>(
    (all, segment) => ({
      bytecode: [...all.bytecode, segment.bytecode],
      ranges: [...all.ranges, segment.range],
      ...(all.errors !== undefined || segment.errors !== undefined
        ? {
            errors: [
              ...(all.errors === undefined ? [] : all.errors),
              ...(segment.errors === undefined ? [] : segment.errors),
            ],
          }
        : undefined),
    }),
    { bytecode: [], ranges: [] }
  );

  return {
    ...(reduction.errors === undefined
      ? undefined
      : { errors: reduction.errors }),
    bytecode: flattenBinArray(reduction.bytecode),
    range: mergeRanges(
      reduction.ranges,
      resolvedScript.length === 0 ? undefined : resolvedScript[0].range
    ),
    script,
  };
};
