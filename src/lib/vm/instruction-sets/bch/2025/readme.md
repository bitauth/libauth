# `BCH_2025_05` Virtual Machine

This draft version of the Bitcoin Cash Virtual Machine integrates proposals that might activate on mainnet on May 15, 2025.

Note: this VM retains tracking of the `operationCount` and `signatureOperationsCount` resource limits from `BCH_2023_05`, though it does not restrict evaluation based on the counters. If these limits are removed by the eventual activation of this VM version, tracking can be fully discontinued once Libauth drops support for `BCH_2023_05`.
