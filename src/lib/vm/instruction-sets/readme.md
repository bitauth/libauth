# Libauth Instruction Sets

This directory contains all of Libauth's supported instruction sets.

Functionality that is shared among multiple instruction sets is typically included in the `common` directory, and VM-specific functionality is included in each respective VM directory.

## Copy, Don't Complicate

**While most of Libauth attempts to be DRY (Don't Repeat Yourself), instruction sets need not follow this approach.**

If an upgrade proposal requires adding a new code path within a `common` operation, **resist the urge to add flags to the operation**. Instead, copy the operation into the instruction set's directory and modify it there. (Flags should only be added to `common` operations if the next expected Bitcoin Cash upgrade requires the flag; following the upgrade, the flag should be removed if no active VM versions require the old behavior.)

Libauth instruction sets should be as clearly defined and readable as possible, ideally within a single `TICKER-YEAR-instruction-set.ts` file. While short-lived instruction sets may be defined by slightly extending an existing, similar instruction set (e.g. a proposed network upgrade or a close relative from a recent network split), VMs intended for long-term support in Libauth should usually have a single-file definition for readability.

For active VM versions, these single-file instruction set files should generally only import operations from sibling files and the `common` directory. For proposed upgrades to active VM versions, instruction set files may import for other VM versions intended for the same main network.

For example, if two VM versions have permanently diverged due to a network split, Libauth's implementation of any logic unique to each VM should also diverge into distinct functions. Libauth contributions intended for one network's VM should not have to avoid impacting the other network's VM.

Conversely, contributions to a VM version representing a possible upgrade to an existing VM may introduce flags into that VM's network-specific operation implementations. In the event the upgrade is activated, the flags can simply be deprecated (and the gated logic made to unconditionally execute).

## Virtual Machine Support

Libauth aims to provide support for the Virtual Machine (VM) used by every public bitcoin-like network and for public upgrade proposals with stable technical specifications.

Where multiple VMs include similar functionality, **Libauth's exported utilities should prefer the configuration used by the latest version of the Bitcoin Cash VM**.

When a pending upgrade specification for Bitcoin Cash has wide consensus and a well-established activation date, Libauth utilities may be upgraded prior to the new specification's mainnet activation.

If a proposed upgrade seems likely to cause a network split, Libauth will attempt to support both sides and may wait to select the next default VM until after the split occurs (or the disagreement is resolved).

## Virtual Machine Deprecation

Generally, Libauth only maintains support for active VM versions. For example, `BCH_2019_05` was an upgrade that:

- enabled Schnorr signature support in `OP_CHECKSIG` and `OP_CHECKDATASIG`
- added a clean-stack exception for SegWit recovery

The `BCH_2019_05` VM version was replaced without a network split by the `BCH_2019_11` upgrade, meaning `BCH_2019_05` is no longer in use by any public network. As such, relevant code paths, flags, and other VM-specific functionality for `BCH_2019_05` have been removed to simplify Libauth's code. (Of course, historical implementations will always remain available in the Git history and previously-released versions of Libauth.)
