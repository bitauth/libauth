import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { AuthenticationErrorBchSpec } from '../../lib.js';

import {
  libauthErrorPrefixToBchnErrorNonstandard,
  libauthErrorPrefixToBchnErrorStandard,
} from './bchn-error-map.spec.helper.js';
import { vmbTestBchnErrorMessageIdOverrides } from './fail-reason-overrides.spec.helper.js';

const bchnDir = resolve('src/lib/vmb-tests/bchn');
const failReasonsFile = 'libauth_expected_test_fail_reasons.json';
const testMetricsFile = 'libauth_expected_test_metrics.json';
export const failReasonsPath = resolve(bchnDir, failReasonsFile);
export const testMetricsPath = resolve(bchnDir, testMetricsFile);

type BchnFailReasons = [
  packName: string,
  testId: string,
  testStandardness: 'I' | 'N' | 'S',
  evaluatedStandardness: 'N' | 'S',
  bchnError: string,
][];
export const bchnFailReasons = JSON.parse(
  readFileSync(failReasonsPath, 'utf8'),
) as BchnFailReasons;

/**
 * Return the error message produced by BCHN's evaluation of the given test ID
 * with the given VM (year + standardness). Returns `undefined` if no matching
 * result is available in {@link failReasonsPath} (either because the test
 * passed or the file needs to be updated).
 */
export const getBchnErrorMessage = ({
  isStandard,
  shortId,
  vmYear,
}: {
  vmYear: string;
  isStandard: boolean;
  shortId: string;
}) => {
  const result = bchnFailReasons.find(
    (entry) =>
      entry[0] === vmYear &&
      entry[1] === shortId &&
      entry[3] === (isStandard ? 'S' : 'N'),
  );
  if (result === undefined) {
    return undefined;
  }
  return result[4];
};

const libauthErrorPrefixes = Object.keys(
  libauthErrorPrefixToBchnErrorStandard,
) as (keyof typeof libauthErrorPrefixToBchnErrorStandard)[];

export const libauthErrorToBchnError = (
  libauthError: string,
  isStandard: boolean,
) => {
  const match = libauthErrorPrefixes.find((prefix) =>
    libauthError.includes(AuthenticationErrorBchSpec[prefix]),
  );
  return match === undefined
    ? false
    : {
        bchn: isStandard
          ? libauthErrorPrefixToBchnErrorStandard[match]
          : libauthErrorPrefixToBchnErrorNonstandard[match],
        match,
      };
};

/**
 * Returns `false` if the BCHN {@link failReasonsFile} is missing the expected
 * error message (and needs to be updated).
 *
 * Returns `true` if the `libauthResult` matches the expected result produced by
 * BCHN's evaluation of the given test ID with the given VM (year +
 * standardness).
 *
 * Unexpected results are returned as an error message (`string`)
 * describing the issue.
 *
 * Note that this method first checks for overrides in
 * {@link vmbTestBchnErrorMessageOverrides} before mapping all other
 * `libauthResult`s to expected BCHN results using
 * {@link libauthErrorToBchnError}.
 */
// eslint-disable-next-line complexity
export const verifyExpectedErrorMessage = ({
  isStandard,
  libauthResult,
  shortId,
  vmYear,
}: {
  libauthResult: string | true;
  isStandard: boolean;
  shortId: string;
  vmYear: string;
}): boolean | string => {
  const bchnResult = getBchnErrorMessage({ isStandard, shortId, vmYear });

  if (libauthResult === true) {
    if (bchnResult !== undefined) {
      return `The VMB test was accepted by Libauth, but BCHN rejected with the error: ${bchnResult}`;
    }
    return true;
  }

  if (bchnResult === undefined) {
    return false;
  }

  const expected = libauthErrorToBchnError(libauthResult, isStandard);
  if (expected === false) {
    return `BCHN rejected with the error: "${bchnResult}", but no known conversion was found in "libauthErrorPrefixToBchnError${
      isStandard ? 'Standard' : 'Nonstandard'
    }" for Libauth error: ${libauthResult}`;
  }

  const override = (
    vmbTestBchnErrorMessageIdOverrides as { [shortId: string]: string }
  )[shortId];

  if (override !== undefined) {
    if (bchnResult !== override) {
      return `The Libauth error "${expected.match}" is expected to map to the BCHN error, "${expected.bchn}", but has been overridden in "vmbTestBchnErrorMessageIdOverrides" for test ID "${shortId}" with another expected error: "${override}". BCHN rejected with the error: "${bchnResult}". Please review any relevant VM changes or correct "vmbTestBchnErrorMessageIdOverrides" to remove this unnecessary override. Full Libauth error: ${libauthResult}`;
    }
    return true;
  }

  if (bchnResult !== expected.bchn) {
    return `In ${
      isStandard ? 'standard' : 'nonstandard'
    } validation, the Libauth error "${
      expected.match
    }" is expected to map to the BCHN error, "${
      expected.bchn
    }", but BCHN rejected with the error: "${bchnResult}". Please either correct "libauthErrorPrefixToBchnError${
      isStandard ? 'Standard' : 'Nonstandard'
    }" or include a new exception in "vmbTestBchnErrorMessageIdOverrides". Full Libauth error: ${libauthResult}`;
  }
  return true;
};

type BchnTestMetrics = [
  packName: string,
  testId: string,
  testStandardness: 'I' | 'N' | 'S',
  evaluatedStandardness: 'N' | 'S',
  inputs: [
    inputIndex: number,
    operationCost: number,
    operationCostLimit: number | null,
    hashIterations: number,
    hashIterationsLimit: number | null,
    sigChecks: number,
    sigChecksLimit: number | null,
  ][],
][];
export const bchnTestMetrics = JSON.parse(
  readFileSync(testMetricsPath, 'utf8'),
) as BchnTestMetrics;

/**
 * Return an array of metrics produced by BCHN's evaluation of the given test ID
 * with the given VM (year + standardness). Returns `undefined` if no matching
 * result is available in {@link testMetricsPath}.
 */
export const getBchnMetrics = ({
  isStandard,
  shortId,
  vmYear,
}: {
  vmYear: string;
  isStandard: boolean;
  shortId: string;
}) => {
  const result = bchnTestMetrics.find(
    (entry) =>
      entry[0] === vmYear &&
      entry[1] === shortId &&
      entry[3] === (isStandard ? 'S' : 'N'),
  );
  if (result === undefined) {
    return undefined;
  }
  return result[4].map(
    ([
      inputIndex,
      operationCost,
      operationCostLimit,
      hashIterations,
      hashIterationsLimit,
      sigChecks,
      sigChecksLimit,
    ]) => ({
      hashIterations,
      hashIterationsLimit,
      inputIndex,
      operationCost,
      operationCostLimit,
      sigChecks,
      sigChecksLimit,
    }),
  );
};
