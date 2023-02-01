import test from 'ava';

import {
  authenticationTemplateP2pkh,
  authenticationTemplateP2pkhNonHd,
  importAuthenticationTemplate,
} from '../../lib.js';

test('authenticationTemplateP2pkh is valid', (t) => {
  const template = importAuthenticationTemplate(
    authenticationTemplateP2pkhNonHd
  );
  t.true(typeof template !== 'string');
});

test('authenticationTemplateP2pkh is mostly equivalent to authenticationTemplateP2pkhHd', (t) => {
  t.deepEqual(
    authenticationTemplateP2pkhNonHd.$schema,
    authenticationTemplateP2pkh.$schema
  );
  t.deepEqual(
    authenticationTemplateP2pkhNonHd.scripts,
    authenticationTemplateP2pkh.scripts
  );
  t.deepEqual(
    authenticationTemplateP2pkhNonHd.supported,
    authenticationTemplateP2pkh.supported
  );
  t.deepEqual(
    authenticationTemplateP2pkhNonHd.version,
    authenticationTemplateP2pkh.version
  );
});

test('authenticationTemplateP2pkhHd is valid', (t) => {
  const template = importAuthenticationTemplate(authenticationTemplateP2pkh);
  t.true(typeof template !== 'string');
});
