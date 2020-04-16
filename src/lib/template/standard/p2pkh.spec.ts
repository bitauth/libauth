/* eslint-disable functional/no-expression-statement */
import test from 'ava';

import {
  authenticationTemplateP2pkh,
  authenticationTemplateP2pkhHd,
  validateAuthenticationTemplate,
} from '../../lib';

test('authenticationTemplateP2pkh is valid', (t) => {
  const template = validateAuthenticationTemplate(authenticationTemplateP2pkh);
  t.true(typeof template !== 'string');
});

test('authenticationTemplateP2pkh is mostly equivalent to authenticationTemplateP2pkhHd', (t) => {
  t.deepEqual(
    authenticationTemplateP2pkh.$schema,
    authenticationTemplateP2pkhHd.$schema
  );
  t.deepEqual(
    authenticationTemplateP2pkh.scripts,
    authenticationTemplateP2pkhHd.scripts
  );
  t.deepEqual(
    authenticationTemplateP2pkh.supported,
    authenticationTemplateP2pkhHd.supported
  );
  t.deepEqual(
    authenticationTemplateP2pkh.version,
    authenticationTemplateP2pkhHd.version
  );
});

test('authenticationTemplateP2pkhHd is valid', (t) => {
  const template = validateAuthenticationTemplate(
    authenticationTemplateP2pkhHd
  );
  t.true(typeof template !== 'string');
});
