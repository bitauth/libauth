import test from 'ava';

import {
  importWalletTemplate,
  walletTemplateP2pkh,
  walletTemplateP2pkhNonHd,
} from '../../lib.js';

test('walletTemplateP2pkh is valid', (t) => {
  const template = importWalletTemplate(walletTemplateP2pkhNonHd);
  t.true(typeof template !== 'string');
});

test('walletTemplateP2pkh is mostly equivalent to walletTemplateP2pkhHd', (t) => {
  t.deepEqual(walletTemplateP2pkhNonHd.$schema, walletTemplateP2pkh.$schema);
  t.deepEqual(walletTemplateP2pkhNonHd.scripts, walletTemplateP2pkh.scripts);
  t.deepEqual(
    walletTemplateP2pkhNonHd.supported,
    walletTemplateP2pkh.supported,
  );
  t.deepEqual(walletTemplateP2pkhNonHd.version, walletTemplateP2pkh.version);
});

test('walletTemplateP2pkhHd is valid', (t) => {
  const template = importWalletTemplate(walletTemplateP2pkh);
  t.true(typeof template !== 'string');
});
