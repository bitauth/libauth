import type { WalletTemplate } from '../../lib.js';

import type { AjvValidator } from './ajv-types.js';

declare const validator: AjvValidator<WalletTemplate>;
// eslint-disable-next-line import/no-default-export
export default validator;
