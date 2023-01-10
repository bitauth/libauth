import type { AuthenticationTemplate } from '../../lib.js';

import type { AjvValidator } from './ajv-types.js';

declare const validator: AjvValidator<AuthenticationTemplate>;
// eslint-disable-next-line import/no-default-export
export default validator;
