import { Range, ResolvedScript } from './resolve';

export interface ErrorInformation {
  error: string;
  range: Range;
}

export const getResolutionErrors = (
  compiledScript: ResolvedScript
): ErrorInformation[] =>
  compiledScript.reduce<ErrorInformation[]>((errors, segment) => {
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
