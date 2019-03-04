/* istanbul ignore file */ // TODO: stabilize & test

import { binToHex } from './hex';

export const stringify = (object: object, spacing = 2) =>
  JSON.stringify(
    object,
    // tslint:disable-next-line:cyclomatic-complexity
    (_, value) => {
      const type = typeof value;
      const name =
        // tslint:disable-next-line: no-unsafe-any
        type === 'object' ? value.constructor && value.constructor.name : type;
      switch (name) {
        case 'Uint8Array':
          return `<Uint8Array: 0x${binToHex(value as Uint8Array)}>`;
        case 'bigint':
          return `<bigint: ${(value as bigint).toString()}n>`;
        case 'function':
        case 'symbol':
          // tslint:disable-next-line: ban-types
          return `<${name}: ${(value as symbol | Function).toString()}>`;

        default:
          return value;
      }
    },
    spacing
  );
