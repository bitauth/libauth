import { binToHex } from './hex';

export const stringify = (object: object, spacing = 2) =>
  JSON.stringify(
    object,
    // tslint:disable-next-line:cyclomatic-complexity
    (_, value) => {
      const type = typeof value;
      const name =
        type === 'object' ? value.constructor && value.constructor.name : type;
      switch (name) {
        case 'Uint8Array':
          return `<Uint8Array: 0x${binToHex(value)}>`;
        case 'bigint':
          return `<bigint: ${value.toString()}n>`;
        case 'function':
        case 'symbol':
          return `<${name}: ${value.toString()}>`;

        default:
          return value;
      }
    },
    spacing
  );
