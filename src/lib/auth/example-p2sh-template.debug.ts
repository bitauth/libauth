// tslint:disable-next-line:no-implicit-dependencies
// import AuthenticationScriptParser from 'parse-atl';
// import { binToHex } from '../..';
import { twoOfThree } from './templates/templates.spec.debug';

/*

// tslint:disable-next-line:no-any
const stringifyBinAndBigInt = (jsonObject: any) =>
  JSON.stringify(
    jsonObject,
    // tslint:disable-next-line:cyclomatic-complexity
    (_, value) =>
      value && value.constructor && value.constructor.name === 'Uint8Array'
        ? `<Uint8Array: 0x${binToHex(value)}>`
        : value && value.constructor && value.constructor.name === 'BigInt'
        ? `<BigInt: ${value.toString()}>`
        : value,
    1
  );
  

const ast = AuthenticationScriptParser.script.parse(text);
console.log(stringifyBinAndBigInt(ast));

*/

// walk through: 2 of 3

// each client has a copy of the Bitauth template
// tslint:disable-next-line:no-console
console.log(JSON.stringify(twoOfThree, undefined, 1));

// parseAuthenticationTemplate(twoOfThree)
// - check template version
// - confirm there are no conflicting ids (scripts or variables)
// - parse all scripts
// - assemble dependency DAG
// - check for unknown identifiers
// - check for unused dependencies
// - user defined identifiers may not begin with `OP_` (those are reserved for built-in operators)
// - run all available tests; if `testValues` can fill any unlocking scripts, test those too
// - return resolved graphs:

// const parseResult = {
//   error: false,
//   result: {
//     checksum: {},
//     entities: {
//       'Cosigner 1': {
//         '1 & 2': [],
//         '1 & 3': []
//       }
//       // 'Cosigner 2': {}
//       // etc.
//     },
//     lock: []
//   }
// };

// things that would be useful to know:
// what is an optimal order for the entities to createWallet? Should one entity createWallet first? Does it matter? (Most important: this entity createWallet now? Or can I save a round-trip by waiting for input from another entity) – each locking and unlocking script may have a different optimal order
// ^ so, for each script, report both a list of dependencies and a pre-calculated optimal construction order (e.g. A and B can be created at the same time, but C relies on B: [[A, B][C, D]])
// implementations may need to use either/both to determine what to do/tell the user
//

// inline: [
//   {
//     id: 'checksum',
//     script:
//       '$(<key1.public> OP_SHA256 <key2.public> OP_SHA256 OP_CAT OP_SHA256 <key3.public> OP_SHA256 OP_CAT OP_SHA256 OP_HASH160)',
//     tests: [
//       {
//         check: '<TODO:checksum> OP_EQUAL'
//       }
//     ]
//   },
//   {
//     id: 'redeem_script',
//     script:
//       'OP_2 <key2.public> <key2.public> <key3.public> OP_3 OP_CHECKMULTISIG'
//   }
// ],
// lock: {
//   id: 'lock',
//   script: 'OP_HASH160 <$(<redeem_script> OP_HASH160)> OP_EQUAL'
// {
//   name: '1 & 2',
//   script: 'OP_0 <key1.signature.all> <key2.signature.all> <redeem_script>'
// },
// {
//   name: '1 & 3',
//   script: 'OP_0 <key1.signature.all> <key3.signature.all> <redeem_script>'
// },
// {
//   name: '2 & 3',
//   script: 'OP_0 <key2.signature.all> <key3.signature.all> <redeem_script>'
// }
// ]

//
//

// const entityChoices = twoOfThree.entities.reduce<ReadonlyArray<string>>(
//   (list, entity) => [...list, entity.name],
//   []
// );

// client does something like: promptUserForEntity(entityChoices)

// const initialAddresses = 10;
// createWallet(template, 'Cosigner 1', initialAddresses)
