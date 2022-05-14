/* eslint-disable no-console, functional/no-expression-statement */
import { authenticationTemplateP2pkh, stringify } from '../../lib.js';

import { twoOfTwoRecoverable } from './template.2-of-2-recoverable.spec.helper.js';
import { twoOfThree } from './template.2-of-3.spec.helper.js';
import { cashChannels } from './template.cash-channels.spec.helper.js';
import { sigOfSig } from './template.sig-of-sig.spec.helper.js';

// eslint-disable-next-line complexity, functional/no-return-void
const printTemplate = (template: string) => {
  switch (template) {
    case 'p2pkh':
      console.log(stringify(authenticationTemplateP2pkh));
      return;
    case '2-of-3':
      console.log(stringify(twoOfThree));
      return;
    case '2-of-2-recoverable':
      console.log(stringify(twoOfTwoRecoverable));
      return;
    case 'sig-of-sig':
      console.log(stringify(sigOfSig));
      return;
    case 'cash-channels':
      console.log(stringify(cashChannels));
      return;

    default:
      console.error('unknown template');
      process.exit(1);
  }
};

const [, , arg] = process.argv;
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
printTemplate(arg!);
