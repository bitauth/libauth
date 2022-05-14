import type { AuthenticationTemplate } from '../../lib';

import type { AjvValidator } from './ajv-types';

declare const validator: AjvValidator<AuthenticationTemplate>;
// eslint-disable-next-line import/no-default-export
export default validator;
