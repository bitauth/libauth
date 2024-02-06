import type { MetadataRegistry } from '../../lib.js';

import type { AjvValidator } from './ajv-types.js';

declare const validator: AjvValidator<MetadataRegistry>;
// eslint-disable-next-line import/no-default-export
export default validator;
