export default validate20;
const schema22 = {
  $ref: '#/definitions/MetadataRegistry',
  $schema: 'http://json-schema.org/draft-07/schema#',
  definitions: {
    ChainHistory: {
      $ref: '#/definitions/RegistryTimestampKeyedValues<ChainSnapshot>',
      description:
        "A block height-keyed map of  {@link  ChainSnapshot } s documenting the evolution of a particular chain/network's identity. Like  {@link  IdentityHistory } , this structure allows wallets and other user interfaces to offer better experiences when a chain identity is rebranded, redenominated, or other important metadata is modified in a coordinated update.",
    },
    ChainSnapshot: {
      additionalProperties: false,
      description:
        "A snapshot of the metadata for a particular chain/network at a specific time. This allows for registries to provide similar metadata for each chain's native currency unit (name, description, symbol, icon, etc.) as can be provided for other registered tokens.",
      properties: {
        description: {
          description:
            'A string describing this identity for use in user interfaces.\n\nIn user interfaces with limited space, descriptions should be hidden beyond the first newline character or `140` characters until revealed by the user.\n\nE.g.:\n- `The common stock issued by ACME, Inc.`\n- `A metadata registry maintained by Company Name, the embedded registry for Wallet Name.`\n- `Software developer and lead maintainer of Wallet Name.`',
          type: 'string',
        },
        extensions: {
          $ref: '#/definitions/Extensions',
          description:
            'A mapping of `IdentitySnapshot` extension identifiers to extension definitions.  {@link  Extensions }  may be widely standardized or application-specific.\n\nStandardized extensions for `IdentitySnapshot`s include the `authchain` extension. See https://github.com/bitjson/chip-bcmr#authchain-extension for details.',
        },
        name: {
          description:
            'The name of this identity for use in interfaces.\n\nIn user interfaces with limited space, names should be hidden beyond the first newline character or `20` characters until revealed by the user.\n\nE.g. `ACME Class A Shares`, `ACME Registry`, `Satoshi Nakamoto`, etc.',
          type: 'string',
        },
        splitId: {
          description:
            "The split ID of this identity's chain of record.\n\nIf undefined, defaults to  {@link  MetadataRegistry.defaultChain } .",
          type: 'string',
        },
        status: {
          description:
            'The status of this identity, must be `active`, `inactive`, or `burned`. If omitted, defaults to `active`.\n- Identities with an `active` status should be actively tracked by clients.\n- Identities with an `inactive` status may be considered for archival by clients and may be removed in future registry versions.\n- Identities with a `burned` status have been destroyed by setting the latest identity output to a data-carrier output (`OP_RETURN`), permanently terminating the authchain. Clients should archive burned identities and – if the burned identity represented a token type – consider burning any remaining tokens of that category to reclaim funds from those outputs.',
          enum: ['active', 'burned', 'inactive'],
          type: 'string',
        },
        tags: {
          description:
            "An array of `Tag` identifiers marking the `Tag`s associated with this identity. All specified tag identifiers must be defined in the registry's `tags` mapping.",
          items: { type: 'string' },
          type: 'array',
        },
        token: {
          additionalProperties: false,
          description:
            "A data structure indicating how the chain's native currency units should be displayed in user interfaces.",
          properties: {
            decimals: {
              description:
                'An integer between `0` and `18` (inclusive) indicating the divisibility of the primary unit of this native currency.\n\nThis is the number of digits that can appear after the decimal separator in currency amounts. For a currency with a `symbol` of `SYMBOL` and a `decimals` of `2`, an amount of `12345` should be displayed as `123.45 SYMBOL`.\n\nIf omitted, defaults to `0`.',
              type: 'number',
            },
            symbol: {
              description:
                'An abbreviation used to uniquely identity this native currency unit.\n\nSymbols must be comprised only of capital letters, numbers, and dashes (`-`). This can be validated with the regular expression: `/^[-A-Z0-9]+$/`.',
              type: 'string',
            },
          },
          required: ['symbol'],
          type: 'object',
        },
        uris: {
          $ref: '#/definitions/URIs',
          description:
            'A mapping of identifiers to URIs associated with this identity. URI identifiers may be widely-standardized or registry-specific. Values must be valid URIs, including a protocol prefix (e.g. `https://` or `ipfs://`). Clients are only required to support `https` and `ipfs` URIs, but any scheme may be specified.\n\nThe following identifiers are recommended for all identities:\n- `icon`\n- `web`\n\nThe following optional identifiers are standardized:\n- `blog`\n- `chat`\n- `forum`\n- `icon-intro`\n- `image`\n- `migrate`\n- `registry`\n- `support`\n\nFor details on these standard identifiers, see: https://github.com/bitjson/chip-bcmr#uri-identifiers\n\nCustom URI identifiers allow for sharing social networking profiles, p2p connection information, and other application-specific URIs. Identifiers must be lowercase, alphanumeric strings, with no whitespace or special characters other than dashes (as a regular expression: `/^[-a-z0-9]+$/`).\n\nFor example, some common identifiers include: `discord`, `docker`, `facebook`, `git`, `github`, `gitter`, `instagram`, `linkedin`, `matrix`, `npm`, `reddit`, `slack`, `substack`, `telegram`, `twitter`, `wechat`, `youtube`.',
        },
      },
      required: ['name', 'token'],
      type: 'object',
    },
    Extensions: {
      additionalProperties: {
        anyOf: [
          { type: 'string' },
          { additionalProperties: { type: 'string' }, type: 'object' },
          {
            additionalProperties: {
              additionalProperties: { type: 'string' },
              type: 'object',
            },
            type: 'object',
          },
        ],
      },
      description:
        "A mapping of extension identifiers to extension definitions. Extensions may be widely standardized or application-specific, and extension definitions must be either:\n\n- `string`s,\n- key-value mappings of `string`s, or\n- two-dimensional, key-value mappings of `string`s.\n\nThis limitation encourages safety and wider compatibility across implementations.\n\nTo encode an array, it is recommended that each value be assigned to a numeric key indicating the item's index (beginning at `0`). Numerically-indexed objects are often a more useful and resilient data-transfer format than simple arrays because they simplify difference-only transmission: only modified indexes need to be transferred, and shifts in item order must be explicit, simplifying merges of conflicting updates.\n\nFor encoding of more complex data, consider using base64 and/or string-encoded JSON.",
      type: 'object',
    },
    IdentityHistory: {
      $ref: '#/definitions/RegistryTimestampKeyedValues<IdentitySnapshot>',
      description:
        "A timestamp-keyed map of  {@link  IdentitySnapshot } s documenting the evolution of a particular identity. The current identity information is the snapshot associated with the latest timestamp reached. If no timestamp has yet been reached, the snapshot of the oldest timestamp is considered current. Future-dated timestamps indicate planned migrations.\n\nThis strategy allows wallets and other user interfaces to offer better experiences when an identity is rebranded, a token redenominated, or other important metadata is modified in a coordinated update. For example, a wallet may warn token holders of a forthcoming rebranding of fungible tokens they hold; after the change, the wallet may continue to offer prominent interface hints that the rebranded token identity was recently updated.\n\nTimestamps may be order by time via lexicographical sort. For determinism, it is recommended that implementations sort from newest to oldest in exported registry JSON files.\n\nIf the current snapshot's  {@link  IdentitySnapshot.migrated }  isn't specified, the snapshot's index is a precise time at which the snapshot takes effect and clients should begin using the new information. If `migrated` is specified, the snapshot's index is the timestamp at which the transition is considered to begin, see  {@link  IdentitySnapshot.migrated }  for details.\n\nEach timestamp must be provided in simplified extended ISO 8601 format, a 24-character string of format `YYYY-MM-DDTHH:mm:ss.sssZ` where timezone is zero UTC (denoted by `Z`). Note, this is the format returned by ECMAScript `Date.toISOString()`.\n\nIn the case that an identity change occurs due to on-chain activity (e.g. an on-chain migration that is set to complete at a particular locktime value), registry-recorded timestamps reflect the real-world time at which the maintainer of the registry believes the on-chain activity to have actually occurred. Likewise, future-dated timestamps indicate a precise real-world time at which a snapshot is estimated to take effect, rather than the Median Time Past (BIP113) UNIX timestamp or another on-chain measurement of time.",
    },
    IdentitySnapshot: {
      additionalProperties: false,
      description:
        'A snapshot of the metadata for a particular identity at a specific time.',
      properties: {
        description: {
          description:
            'A string describing this identity for use in user interfaces.\n\nIn user interfaces with limited space, descriptions should be hidden beyond the first newline character or `140` characters until revealed by the user.\n\nE.g.:\n- `The common stock issued by ACME, Inc.`\n- `A metadata registry maintained by Company Name, the embedded registry for Wallet Name.`\n- `Software developer and lead maintainer of Wallet Name.`',
          type: 'string',
        },
        extensions: {
          $ref: '#/definitions/Extensions',
          description:
            'A mapping of `IdentitySnapshot` extension identifiers to extension definitions.  {@link  Extensions }  may be widely standardized or application-specific.\n\nStandardized extensions for `IdentitySnapshot`s include the `authchain` extension. See https://github.com/bitjson/chip-bcmr#authchain-extension for details.',
        },
        migrated: {
          description:
            "The timestamp at which this identity snapshot is fully in effect. This value should only be provided if the snapshot takes effect over a period of time (e.g. an in-circulation token identity is gradually migrating to a new category). In these cases, clients should gradually migrate to using the new information beginning after the identity snapshot's timestamp and the `migrated` time.\n\nThis timestamp must be provided in simplified extended ISO 8601 format, a 24-character string of format `YYYY-MM-DDTHH:mm:ss.sssZ` where timezone is zero UTC (denoted by `Z`). Note, this is the format returned by ECMAScript `Date.toISOString()`.",
          type: 'string',
        },
        name: {
          description:
            'The name of this identity for use in interfaces.\n\nIn user interfaces with limited space, names should be hidden beyond the first newline character or `20` characters until revealed by the user.\n\nE.g. `ACME Class A Shares`, `ACME Registry`, `Satoshi Nakamoto`, etc.',
          type: 'string',
        },
        splitId: {
          description:
            "The split ID of this identity's chain of record.\n\nIf undefined, defaults to  {@link  MetadataRegistry.defaultChain } .",
          type: 'string',
        },
        status: {
          description:
            'The status of this identity, must be `active`, `inactive`, or `burned`. If omitted, defaults to `active`.\n- Identities with an `active` status should be actively tracked by clients.\n- Identities with an `inactive` status may be considered for archival by clients and may be removed in future registry versions.\n- Identities with a `burned` status have been destroyed by setting the latest identity output to a data-carrier output (`OP_RETURN`), permanently terminating the authchain. Clients should archive burned identities and – if the burned identity represented a token type – consider burning any remaining tokens of that category to reclaim funds from those outputs.',
          enum: ['active', 'burned', 'inactive'],
          type: 'string',
        },
        tags: {
          description:
            "An array of `Tag` identifiers marking the `Tag`s associated with this identity. All specified tag identifiers must be defined in the registry's `tags` mapping.",
          items: { type: 'string' },
          type: 'array',
        },
        token: {
          $ref: '#/definitions/TokenCategory',
          description:
            'If this identity is a type of token, a data structure indicating how tokens should be understood and displayed in user interfaces. Omitted for non-token identities.',
        },
        uris: {
          $ref: '#/definitions/URIs',
          description:
            'A mapping of identifiers to URIs associated with this identity. URI identifiers may be widely-standardized or registry-specific. Values must be valid URIs, including a protocol prefix (e.g. `https://` or `ipfs://`). Clients are only required to support `https` and `ipfs` URIs, but any scheme may be specified.\n\nThe following identifiers are recommended for all identities:\n- `icon`\n- `web`\n\nThe following optional identifiers are standardized:\n- `blog`\n- `chat`\n- `forum`\n- `icon-intro`\n- `image`\n- `migrate`\n- `registry`\n- `support`\n\nFor details on these standard identifiers, see: https://github.com/bitjson/chip-bcmr#uri-identifiers\n\nCustom URI identifiers allow for sharing social networking profiles, p2p connection information, and other application-specific URIs. Identifiers must be lowercase, alphanumeric strings, with no whitespace or special characters other than dashes (as a regular expression: `/^[-a-z0-9]+$/`).\n\nFor example, some common identifiers include: `discord`, `docker`, `facebook`, `git`, `github`, `gitter`, `instagram`, `linkedin`, `matrix`, `npm`, `reddit`, `slack`, `substack`, `telegram`, `twitter`, `wechat`, `youtube`.',
        },
      },
      required: ['name'],
      type: 'object',
    },
    MetadataRegistry: {
      additionalProperties: false,
      description:
        'A Bitcoin Cash Metadata Registry is an authenticated JSON file containing metadata about tokens, identities, contract applications, and other on-chain artifacts. BCMRs conform to the Bitcoin Cash Metadata Registry JSON Schema, and they can be published and maintained by any entity or individual.',
      properties: {
        $schema: {
          description:
            'The schema used by this registry. Many JSON editors can automatically provide inline documentation and autocomplete support using the `$schema` property, so it is recommended that registries include it. E.g.: `https://cashtokens.org/bcmr-v2.schema.json`',
          type: 'string',
        },
        chains: {
          additionalProperties: { $ref: '#/definitions/ChainHistory' },
          description:
            'A map of split IDs tracked by this registry to the  {@link  ChainHistory }  for that chain/network.\n\nThe split ID of a chain is the block header hash (A.K.A. block ID) of the first unique block after the most recent tracked split – a split after which both resulting chains are considered notable or tracked by the registry. (For chains with no such splits, this is the ID of the genesis block.)\n\nNote, split ID is inherently a "relative" identifier. After a tracked split, both resulting chains will have a new split ID. However, if a wallet has not yet heard about a particular split, that wallet will continue to reference one of the resulting chains by its previous split ID, and the split-unaware wallet may create transactions that are valid on both chains (losing claimable value if the receivers of their transactions don\'t acknowledge transfers on both chains). When a registry trusted by the wallet notes the split in it\'s `chains` map, the wallet can represent the split in the user interface using the the latest  {@link  ChainSnapshot }  for each chain and splitting coins prior to spending (by introducing post-split coins in each transaction).\n\nThis map may exclude the following well-known split IDs (all clients supporting any of these chains should build-in  {@link  ChainHistory }  for those chains):\n\n- `0000000000000000029e471c41818d24b8b74c911071c4ef0b4a0509f9b5a8ce`:   A.K.A. mainnet – the BCH side of the BCH/XEC split.\n- `00000000ae25e85d9e22cd6c8d72c2f5d4b0222289d801b7f633aeae3f8c6367`:   A.K.A testnet4 – the test network on which CHIPs are activated   simultaneously with mainnet (May 15 at 12 UTC).\n- `00000000040ba9641ba98a37b2e5ceead38e4e2930ac8f145c8094f94c708727`:   A.K.A. chipnet – the test network on which CHIPs are activated 6 months   before mainnet (November 15 at 12 UTC).\n\nAll other split IDs referenced by this registry should be included in this map.',
          type: 'object',
        },
        defaultChain: {
          description:
            'The split ID of the chain/network considered the "default" chain for this registry. Identities that do not specify a  {@link  IdentitySnapshot.splitId }  are assumed to be set to this split ID. For a description of split IDs, see  {@link  MetadataRegistry.chains } .\n\nIf not provided, the `defaultChain` is `0000000000000000029e471c41818d24b8b74c911071c4ef0b4a0509f9b5a8ce`, the BCH side of the BCH/XEC split (mainnet). Common values include:\n- `00000000ae25e85d9e22cd6c8d72c2f5d4b0222289d801b7f633aeae3f8c6367` (testnet4)\n- `00000000040ba9641ba98a37b2e5ceead38e4e2930ac8f145c8094f94c708727` (chipnet)',
          type: 'string',
        },
        extensions: {
          $ref: '#/definitions/Extensions',
          description:
            'A mapping of `Registry` extension identifiers to extension definitions.  {@link  Extensions }  may be widely standardized or application-specific.\n\nStandardized extensions for `Registry`s include the `locale` extension. See https://github.com/bitjson/chip-bcmr#locales-extension for details.',
        },
        identities: {
          additionalProperties: { $ref: '#/definitions/IdentityHistory' },
          description:
            "A mapping of authbases to the `IdentityHistory` for that identity.\n\nAn authbase is a 32-byte, hex-encoded transaction hash (A.K.A. TXID) for which the zeroth-descendant transaction chain (ZDTC) authenticates and publishes an identity's claimed metadata.\n\nIdentities may represent metadata registries, specific types of tokens, companies, organizations, individuals, or other on-chain entities.",
          type: 'object',
        },
        latestRevision: {
          description:
            'The timestamp of the latest revision made to this registry version. The timestamp must be provided in simplified extended ISO 8601 format, a 24-character string of format `YYYY-MM-DDTHH:mm:ss.sssZ` where timezone is zero UTC (denoted by `Z`). Note, this is the format returned by ECMAScript `Date.toISOString()`.',
          type: 'string',
        },
        license: {
          description:
            'The license under which this registry is published. This may be specified as either a SPDX short identifier (https://spdx.org/licenses/) or by including the full text of the license.\n\nCommon values include:  - `CC0-1.0`: https://creativecommons.org/publicdomain/zero/1.0/  - `MIT`: https://opensource.org/licenses/MIT',
          type: 'string',
        },
        registryIdentity: {
          anyOf: [
            { $ref: '#/definitions/OffChainRegistryIdentity' },
            { type: 'string' },
          ],
          description:
            "The identity information of this particular registry, provided as either an authbase (recommended) or an `IdentitySnapshot`.\n\nAn authbase is a 32-byte, hex-encoded transaction hash (A.K.A. TXID) for which the zeroth-descendant transaction chain (ZDTC) authenticates and publishes all registry updates. If an authbase is provided, the registry's identity information can be found in `identities[authbase]`, and clients should immediately attempt to verify the registry's identity on-chain. (See https://github.com/bitjson/chip-bcmr#chain-resolved-registries)\n\nIf an `IdentitySnapshot` is provided directly, this registry does not support on-chain resolution/authentication, and the contained `IdentitySnapshot` can only be authenticated via DNS/HTTPS.",
        },
        tags: {
          additionalProperties: { $ref: '#/definitions/Tag' },
          description:
            'A map of registry-specific `Tag`s used by this registry to convey information about identities it tracks.\n\nTags allow registries to group identities into collections of related identities, marking characteristics or those identities. Tags are standardized within a registry and may represent either labels applied by that registry (e.g. `individual`, `organization`, `token`, `wallet`, `exchange`, `staking`, `utility-token`, `security-token`, `stablecoin`, `wrapped`, `collectable`, `deflationary`, `governance`, `decentralized-exchange`, `liquidity-provider`, `sidechain`, `sidechain-bridge`, etc.) or designations by external authorities (certification, membership, ownership, etc.) that are tracked by that registry.\n\nTags may be used by clients in search, discover, and filtering of identities, and they can also convey information like accreditation from investor protection organizations, public certifications by security or financial auditors, and other designations that signal legitimacy and value to users.',
          type: 'object',
        },
        version: {
          additionalProperties: false,
          description:
            'The version of this registry. Versioning adheres to Semantic Versioning (https://semver.org/).',
          properties: {
            major: {
              description:
                'The major version is incremented when an identity is removed.',
              type: 'number',
            },
            minor: {
              description:
                'The minor version is incremented when an identity is added or a new identity snapshot is added.',
              type: 'number',
            },
            patch: {
              description:
                'The patch version is incremented when an existing identity or identity snapshot is modified (e.g. to correct an error or add a missing piece of information) or when other registry properties (e.g. registry `name`, `description`, `uris`, etc.) are modified.\n\nGenerally, substantive changes to an existing identity should be made using a new identity snapshot in a minor version upgrade – this allows clients to provide a better user experience by noting the change in relevant user interfaces.\n\nFor example, patch upgrades might include spelling corrections in an existing snapshot or the addition of an `icon` containing a higher-resolution version of an existing `icon` image. On the other hand, a rebranding in which the icon is substantially changed may warrant a new identity snapshot to be added in a minor version upgrade.',
              type: 'number',
            },
          },
          required: ['major', 'minor', 'patch'],
          type: 'object',
        },
      },
      required: ['version', 'latestRevision', 'registryIdentity'],
      type: 'object',
    },
    NftCategory: {
      additionalProperties: false,
      description:
        'A definition specifying the non-fungible token information for a token category.',
      properties: {
        description: {
          description:
            'A string describing how this identity uses NFTs (for use in user interfaces). Descriptions longer than `160` characters may be elided in some interfaces.\n\nE.g.:\n- "ACME DEX NFT order receipts are issued when you place orders on the decentralized exchange. After orders are processed, order receipts can be redeemed for purchased tokens or sales proceeds.";\n- "ACME Game collectable NFTs unlock unique playable content, user avatars, and item skins in ACME Game Online."; etc.',
          type: 'string',
        },
        fields: {
          $ref: '#/definitions/NftCategoryField',
          description:
            'A mapping of field identifier to field definitions for the data fields that can appear in NFT commitments of this category.\n\nCategories including only sequential NFTs (where `parse.bytecode` is undefined) should omit `fields` (or set to `undefined`).',
        },
        parse: {
          anyOf: [
            { $ref: '#/definitions/ParsableNftCollection' },
            { $ref: '#/definitions/SequentialNftCollection' },
          ],
          description:
            'Parsing and interpretation information for all NFTs of this category; this enables generalized wallets to parse and display detailed information about all NFTs held by the wallet, e.g. `BCH Pledged`, `Order Price`, `Seat Number`, `Asset Number`, `IPFS Content Identifier`, `HTTPS URL`, etc.\n\nParsing instructions are provided in the `bytecode` property, and the results are interpreted using the `types` property.',
        },
      },
      required: ['parse'],
      type: 'object',
    },
    NftCategoryField: {
      additionalProperties: {
        additionalProperties: false,
        properties: {
          description: {
            description:
              'A string describing how this identity uses NFTs (for use in user interfaces). Descriptions longer than `160` characters may be elided in some interfaces.\n\nE.g.:\n- `The BCH value pledged at the time this receipt was issued.`\n- `The number of tokens sold in this order.`\n- `The seat number associated with this ticket.`',
            type: 'string',
          },
          encoding: {
            anyOf: [
              {
                additionalProperties: false,
                properties: {
                  type: {
                    enum: [
                      'binary',
                      'boolean',
                      'hex',
                      'https-url',
                      'ipfs-cid',
                      'utf8',
                      'locktime',
                    ],
                    type: 'string',
                  },
                },
                required: ['type'],
                type: 'object',
              },
              {
                additionalProperties: false,
                properties: {
                  aggregate: {
                    const: 'add',
                    description:
                      "The `aggregate` property indicates that aggregating this field from multiple NFTs is desirable in user interfaces. For example, for a field named `BCH Pledged` where `aggregate` is `add`, the client can display a `Total BCH Pledged` in any user interface listing more than one NFT.\n\nIf specified, clients should aggregate the field from all NFTs, of all NFT types within the category, within a particular view (e.g. NFTs held by a single wallet, NFTs existing in a single transaction's outputs, etc.) using the specified operation.\n\nNote, while aggregation could be performed using any commutative operation – multiplication, bitwise AND, bitwise OR, bitwise XOR, etc. – only `add` is currently supported.",
                    type: 'string',
                  },
                  decimals: {
                    description:
                      'An integer between `0` and `18` (inclusive) indicating the divisibility of the primary unit of this token field.\n\nThis is the number of digits that can appear after the decimal separator in amounts. For a field with a `decimals` of `2`, a value of `123456` should be displayed as `1234.56`.\n\nIf omitted, defaults to `0`.',
                    type: 'number',
                  },
                  type: { const: 'number', type: 'string' },
                  unit: {
                    description:
                      "The unit in which this field is denominated, taking the `decimals` value into account. If representing fungible token amount, this will often be the symbol of the represented token category.\n\nE.g. `BCH`, `sats`, `AcmeUSD`, etc.\n\nIf not provided, clients should not represent this field as having a unit beyond the field's `name`.",
                    type: 'string',
                  },
                },
                required: ['type'],
                type: 'object',
              },
            ],
            description:
              'The expected encoding of this field when read from the parsing altstack (see  {@link  ParsableNftCollection } ). All encoding definitions must have a `type`, and some encoding definitions allow for additional hinting about display strategies in clients.\n\nEncoding types may be set to `binary`, `boolean`, `hex`, `number`, or `utf8`:\n\n- `binary` types should be displayed as binary literals (e.g. `0b0101`)\n- `boolean` types should be displayed as `true` if exactly `0x01` or `false` if exactly `0x00`. If a boolean value does not match one of these values, clients should represent the NFT as unable to be parsed (e.g. simply display the full `commitment`).\n- `hex` types should be displayed as hex literals (e.g.`0xabcd`).\n- `https-url` types are percent encoded with the `https://` prefix omitted; they may be displayed as URIs or as activatable links.\n- `ipfs-cid` types are binary-encoded IPFS Content Identifiers; they may be displayed as URIs or as activatable links.\n- `locktime` types are `OP_TXLOCKTIME` results: integers from `0` to `4294967295` (inclusive) where values less than `500000000` are understood to be a block height (the current block number in the chain, beginning from block `0`), and values greater than or equal to `500000000` are understood to be a Median Time Past (BIP113) UNIX timestamp. (Note, sequence age is not currently supported.)\n- `number` types should be displayed according the their configured `decimals` and `unit` values.\n- `utf8` types should be displayed as utf8 strings.',
          },
          extensions: {
            $ref: '#/definitions/Extensions',
            description:
              'A mapping of NFT field extension identifiers to extension definitions.  {@link  Extensions }  may be widely standardized or application-specific.',
          },
          name: {
            description:
              'The name of this field for use in interfaces. Names longer than `20` characters may be elided in some interfaces.\n\nE.g.:\n- `BCH Pledged`\n- `Tokens Sold`\n- `Settlement Locktime`\n- `Seat Number`,\n- `IPFS Content Identifier`\n- `HTTPS URL`',
            type: 'string',
          },
          uris: {
            $ref: '#/definitions/URIs',
            description:
              'A mapping of identifiers to URIs associated with this NFT field. URI identifiers may be widely-standardized or registry-specific. Values must be valid URIs, including a protocol prefix (e.g. `https://` or `ipfs://`). Clients are only required to support `https` and `ipfs` URIs, but any scheme may be specified.',
          },
        },
        required: ['encoding'],
        type: 'object',
      },
      description:
        'A definition specifying a field that can be encoded in non-fungible tokens of a token category.',
      type: 'object',
    },
    NftType: {
      additionalProperties: false,
      description: 'A definition for one type of NFT within a token category.',
      properties: {
        description: {
          description:
            'A string describing this NFT type for use in user interfaces.\n\nIn user interfaces with limited space, names should be hidden beyond the first newline character or `140` characters until revealed by the user.\n\nE.g.:\n- "Receipts issued by the exchange to record details about purchases. After settlement, these receipts are redeemed for the purchased tokens.";\n- "Receipts issued by the crowdfunding campaign to document the value of funds pledged. If the user decides to cancel their pledge before the campaign completes, these receipts can be redeemed for a full refund.";\n- "Tickets issued for events at ACME Stadium.";\n- Sealed ballots certified by ACME decentralized organization during the voting period. After the voting period ends, these ballots must be revealed to reclaim the tokens used for voting."',
          type: 'string',
        },
        extensions: {
          $ref: '#/definitions/Extensions',
          description:
            'A mapping of NFT type extension identifiers to extension definitions.  {@link  Extensions }  may be widely standardized or application-specific.',
        },
        fields: {
          description:
            "A list of identifiers for fields contained in NFTs of this type. On successful parsing evaluations, the bottom item on the altstack indicates the matched NFT type, and the remaining altstack items represent NFT field contents in the order listed (where `fields[0]` is the second-to-bottom item, and the final item in `fields` is the top of the altstack).\n\nFields should be ordered by recommended importance from most important to least important; in user interfaces, clients should display fields at lower indexes more prominently than those at higher indexes, e.g. if some fields cannot be displayed in minimized interfaces, higher-importance fields can still be represented. (Note, this ordering is controlled by the bytecode specified in `token.nft.parse.bytecode`.)\n\nIf this is a sequential NFT, (the category's `parse.bytecode` is undefined), `fields` should be omitted or set to `undefined`.",
          items: { type: 'string' },
          type: 'array',
        },
        name: {
          description:
            'The name of this NFT type for use in interfaces. Names longer than `20` characters may be elided in some interfaces.\n\nE.g. `Market Order Buys`, `Limit Order Sales`, `Pledge Receipts`, `ACME Stadium Tickets`, `Sealed Votes`, etc.',
          type: 'string',
        },
        uris: {
          $ref: '#/definitions/URIs',
          description:
            'A mapping of identifiers to URIs associated with this NFT type. URI identifiers may be widely-standardized or registry-specific. Values must be valid URIs, including a protocol prefix (e.g. `https://` or `ipfs://`). Clients are only required to support `https` and `ipfs` URIs, but any scheme may be specified.',
        },
      },
      required: ['name'],
      type: 'object',
    },
    OffChainRegistryIdentity: {
      additionalProperties: false,
      description:
        'An identity representing a metadata registry that is not published on-chain and therefore has no authbase or trackable authchain.',
      properties: {
        description: {
          description:
            'A string describing this identity for use in user interfaces.\n\nIn user interfaces with limited space, descriptions should be hidden beyond the first newline character or `140` characters until revealed by the user.\n\nE.g.:\n- `The common stock issued by ACME, Inc.`\n- `A metadata registry maintained by Company Name, the embedded registry for Wallet Name.`\n- `Software developer and lead maintainer of Wallet Name.`',
          type: 'string',
        },
        extensions: {
          $ref: '#/definitions/Extensions',
          description:
            'A mapping of `IdentitySnapshot` extension identifiers to extension definitions.  {@link  Extensions }  may be widely standardized or application-specific.\n\nStandardized extensions for `IdentitySnapshot`s include the `authchain` extension. See https://github.com/bitjson/chip-bcmr#authchain-extension for details.',
        },
        name: {
          description:
            'The name of this identity for use in interfaces.\n\nIn user interfaces with limited space, names should be hidden beyond the first newline character or `20` characters until revealed by the user.\n\nE.g. `ACME Class A Shares`, `ACME Registry`, `Satoshi Nakamoto`, etc.',
          type: 'string',
        },
        tags: {
          description:
            "An array of `Tag` identifiers marking the `Tag`s associated with this identity. All specified tag identifiers must be defined in the registry's `tags` mapping.",
          items: { type: 'string' },
          type: 'array',
        },
        uris: {
          $ref: '#/definitions/URIs',
          description:
            'A mapping of identifiers to URIs associated with this identity. URI identifiers may be widely-standardized or registry-specific. Values must be valid URIs, including a protocol prefix (e.g. `https://` or `ipfs://`). Clients are only required to support `https` and `ipfs` URIs, but any scheme may be specified.\n\nThe following identifiers are recommended for all identities:\n- `icon`\n- `web`\n\nThe following optional identifiers are standardized:\n- `blog`\n- `chat`\n- `forum`\n- `icon-intro`\n- `image`\n- `migrate`\n- `registry`\n- `support`\n\nFor details on these standard identifiers, see: https://github.com/bitjson/chip-bcmr#uri-identifiers\n\nCustom URI identifiers allow for sharing social networking profiles, p2p connection information, and other application-specific URIs. Identifiers must be lowercase, alphanumeric strings, with no whitespace or special characters other than dashes (as a regular expression: `/^[-a-z0-9]+$/`).\n\nFor example, some common identifiers include: `discord`, `docker`, `facebook`, `git`, `github`, `gitter`, `instagram`, `linkedin`, `matrix`, `npm`, `reddit`, `slack`, `substack`, `telegram`, `twitter`, `wechat`, `youtube`.',
        },
      },
      required: ['name'],
      type: 'object',
    },
    ParsableNftCollection: {
      additionalProperties: false,
      description:
        'Interpretation information for a collection of parsable NFTs, a collection in which each NFT may include additional metadata fields beyond a sequential identifier within its on-chain commitment. Note that  {@link  ParsableNftCollection } s differ from  {@link  SequentialNftCollection } s in that parsable collections require a parsing `bytecode` with which to inspect each NFT commitment: the type of each NFT is indexed by the hex-encoded contents the bottom item on the altstack following the evaluation of the parsing bytecode.',
      properties: {
        bytecode: {
          description:
            "A segment of hex-encoded Bitcoin Cash VM bytecode that parses UTXOs holding NFTs of this category, identifies the NFT's type within the category, and returns a list of the NFT's field values via the altstack. If undefined, this NFT Category includes only sequential NFTs, with only an identifier and no NFT fields encoded in each NFT's on-chain commitment.\n\nThe parse `bytecode` is evaluated by instantiating and partially verifying a standardized NFT parsing transaction:\n- version: `2`\n- inputs:   - 0: Spends the UTXO containing the NFT with an empty   unlocking bytecode and sequence number of `0`.   - 1: Spends index `0` of the empty hash outpoint, with locking   bytecode set to `parse.bytecode`, unlocking bytecode `OP_1`   (`0x51`) and sequence number `0`.\n- outputs:   - 0: A locking bytecode of OP_RETURN (`0x6a`) and value of `0`.\n- locktime: `0`\n\nAfter input 1 of this NFT parsing transaction is evaluated, if the resulting stack is not valid (a single \"truthy\" element remaining on the stack) – or if the altstack is empty – parsing has failed and clients should represent the NFT as unable to be parsed (e.g. simply display the full `commitment` as a hex-encoded value in the user interface).\n\nOn successful parsing evaluations, the bottom item on the altstack indicates the type of the NFT according to the matching definition in `types`. If no match is found, clients should represent the NFT as unable to be parsed.\n\nFor example: `00d2517f7c6b` (OP_0 OP_UTXOTOKENCOMMITMENT OP_1 OP_SPLIT OP_SWAP OP_TOALTSTACK OP_TOALTSTACK) splits the commitment after 1 byte, pushing the first byte to the altstack as an NFT type identifier and the remaining segment of the commitment as the first NFT field value.\n\nIf undefined (in a  {@link  SequentialNftCollection } ), this field could be considered to have a default value of `00d26b` (OP_0 OP_UTXOTOKENCOMMITMENT OP_TOALTSTACK), which takes the full contents of the commitment as a fixed type index. As such, each index of the NFT category's `types` maps a precise commitment value to the metadata for NFTs with that particular commitment. E.g. an NFT with an empty commitment (VM number 0) maps to `types['']`, a commitment of `01` (hex) maps to `types['01']`, etc. This pattern is used for collections of sequential NFTs.",
          type: 'string',
        },
        types: {
          additionalProperties: {
            $ref: '#/definitions/NftType',
            description:
              'A definitions for each type of NFT within the token category. Parsable NFT types are indexed by the hex-encoded value of the bottom altstack item following evaluation of `NftCategory.parse.bytecode`. The remaining altstack items are mapped to NFT fields according to the `fields` property of the matching NFT type.',
          },
          description:
            'A mapping of hex-encoded values to definitions of possible NFT types in this category.',
          type: 'object',
        },
      },
      required: ['bytecode', 'types'],
      type: 'object',
    },
    'RegistryTimestampKeyedValues<ChainSnapshot>': {
      additionalProperties: { $ref: '#/definitions/ChainSnapshot' },
      description:
        'A field keyed by timestamps to document the evolution of the field. Each timestamp must be provided in simplified extended ISO 8601 format, a 24-character string of format `YYYY-MM-DDTHH:mm:ss.sssZ` where timezone is zero UTC (denoted by `Z`). Note, this is the format returned by ECMAScript `Date.toISOString()`.\n\nFor example, to insert a new value: ```ts const result = { ...previousValue, [(new Date()).toISOString()]: newValue }; ```',
      type: 'object',
    },
    'RegistryTimestampKeyedValues<IdentitySnapshot>': {
      additionalProperties: { $ref: '#/definitions/IdentitySnapshot' },
      description:
        'A field keyed by timestamps to document the evolution of the field. Each timestamp must be provided in simplified extended ISO 8601 format, a 24-character string of format `YYYY-MM-DDTHH:mm:ss.sssZ` where timezone is zero UTC (denoted by `Z`). Note, this is the format returned by ECMAScript `Date.toISOString()`.\n\nFor example, to insert a new value: ```ts const result = { ...previousValue, [(new Date()).toISOString()]: newValue }; ```',
      type: 'object',
    },
    SequentialNftCollection: {
      additionalProperties: false,
      description:
        'Interpretation information for a collection of sequential NFTs, a collection in which each NFT includes only a sequential identifier within its on-chain commitment. Note that  {@link  SequentialNftCollection } s differ from  {@link  ParsableNftCollection } s in that sequential collections lack a parsing `bytecode` with which to inspect each NFT commitment: the type of each NFT is indexed by the full contents its commitment (interpreted as a positive VM integer in user interfaces).',
      properties: {
        types: {
          additionalProperties: {
            $ref: '#/definitions/NftType',
            description:
              'Interpretation information for each type of NFT within the token category, indexed by commitment hex. For sequential NFTs, the on-chain commitment of each NFT is interpreted as a VM number to reference its particular NFT type in user interfaces. Issuing a sequential NFT with a negative or invalid VM number is discouraged, but clients may render the commitment of such NFTs in hex-encoded form, prefixed with `X`.',
          },
          description:
            'A mapping of each NFT commitment (typically, a positive integer encoded as a VM number) to metadata for that NFT type in this category.',
          type: 'object',
        },
      },
      required: ['types'],
      type: 'object',
    },
    Tag: {
      additionalProperties: false,
      description:
        'Tags allow registries to classify and group identities by a variety of characteristics. Tags are standardized within a registry and may represent either labels applied by that registry or designations by external authorities (certification, membership, ownership, etc.) that are tracked by that registry.\n\nExamples of possible tags include: `individual`, `organization`, `token`, `wallet`, `exchange`, `staking`, `utility-token`, `security-token`, `stablecoin`, `wrapped`, `collectable`, `deflationary`, `governance`, `decentralized-exchange`, `liquidity-provider`, `sidechain`, `sidechain-bridge`, `acme-audited`, `acme-endorsed`, etc.\n\nTags may be used by clients in search, discovery, and filtering of identities, and they can also convey information like accreditation from investor protection organizations, public certifications by security or financial auditors, and other designations that signal integrity and value to users.',
      properties: {
        description: {
          description:
            'A string describing this tag for use in user interfaces.\n\nIn user interfaces with limited space, descriptions should be hidden beyond the first newline character or `140` characters until revealed by the user.\n\nE.g.:\n- `An identity maintained by a single individual.`\n- `An identity representing a type of token.`\n- `An on-chain application that has passed security audits by ACME, Inc.`',
          type: 'string',
        },
        extensions: {
          $ref: '#/definitions/Extensions',
          description:
            'A mapping of `Tag` extension identifiers to extension definitions.  {@link  Extensions }  may be widely standardized or application-specific.',
        },
        name: {
          description:
            'The name of this tag for use in interfaces.\n\nIn user interfaces with limited space, names should be hidden beyond the first newline character or `20` characters until revealed by the user.\n\nE.g.:\n- `Individual`\n- `Token`\n- `Audited by ACME, Inc.`',
          type: 'string',
        },
        uris: {
          $ref: '#/definitions/URIs',
          description:
            'A mapping of identifiers to URIs associated with this tag. URI identifiers may be widely-standardized or registry-specific. Values must be valid URIs, including a protocol prefix (e.g. `https://` or `ipfs://`). Clients are only required to support `https` and `ipfs` URIs, but any scheme may be specified.\n\nThe following identifiers are recommended for all tags:\n- `icon`\n- `web`\n\nThe following optional identifiers are standardized:\n- `blog`\n- `chat`\n- `forum`\n- `icon-intro`\n- `registry`\n- `support`\n\nFor details on these standard identifiers, see: https://github.com/bitjson/chip-bcmr#uri-identifiers\n\nCustom URI identifiers allow for sharing social networking profiles, p2p connection information, and other application-specific URIs. Identifiers must be lowercase, alphanumeric strings, with no whitespace or special characters other than dashes (as a regular expression: `/^[-a-z0-9]+$/`).\n\nFor example, some common identifiers include: `discord`, `docker`, `facebook`, `git`, `github`, `gitter`, `instagram`, `linkedin`, `matrix`, `npm`, `reddit`, `slack`, `substack`, `telegram`, `twitter`, `wechat`, `youtube`.',
        },
      },
      required: ['name'],
      type: 'object',
    },
    TokenCategory: {
      additionalProperties: false,
      description:
        "A definition specifying information about an identity's token category.",
      properties: {
        category: {
          description:
            "The current token category used by this identity. Often, this will be equal to the identity's authbase, but some token identities must migrate to new categories for technical reasons.",
          type: 'string',
        },
        decimals: {
          description:
            'An integer between `0` and `18` (inclusive) indicating the divisibility of the primary unit of this token category.\n\nThis is the number of digits that can appear after the decimal separator in fungible token amounts. For a token category with a `symbol` of `SYMBOL` and a `decimals` of `2`, a fungible token amount of `12345` should be displayed as `123.45 SYMBOL`.\n\nIf omitted, defaults to `0`.',
          type: 'number',
        },
        nfts: {
          $ref: '#/definitions/NftCategory',
          description:
            'Display information for non-fungible tokens (NFTs) of this identity. Omitted for token categories without NFTs.',
        },
        symbol: {
          description:
            'An abbreviation used to uniquely identity this token category.\n\nSymbols must be comprised only of capital letters, numbers, and dashes (`-`). This can be validated with the regular expression: `/^[-A-Z0-9]+$/`.',
          type: 'string',
        },
      },
      required: ['category', 'symbol'],
      type: 'object',
    },
    URIs: {
      additionalProperties: { type: 'string' },
      description:
        'A mapping of identifiers to URIs associated with an entity. URI identifiers may be widely-standardized or registry-specific. Values must be valid URIs, including a protocol prefix – e.g. `https://` or `ipfs://`., Clients are only required to support `https` and `ipfs` URIs, but any scheme may be specified.',
      type: 'object',
    },
  },
};
const schema23 = {
  additionalProperties: false,
  description:
    'A Bitcoin Cash Metadata Registry is an authenticated JSON file containing metadata about tokens, identities, contract applications, and other on-chain artifacts. BCMRs conform to the Bitcoin Cash Metadata Registry JSON Schema, and they can be published and maintained by any entity or individual.',
  properties: {
    $schema: {
      description:
        'The schema used by this registry. Many JSON editors can automatically provide inline documentation and autocomplete support using the `$schema` property, so it is recommended that registries include it. E.g.: `https://cashtokens.org/bcmr-v2.schema.json`',
      type: 'string',
    },
    chains: {
      additionalProperties: { $ref: '#/definitions/ChainHistory' },
      description:
        'A map of split IDs tracked by this registry to the  {@link  ChainHistory }  for that chain/network.\n\nThe split ID of a chain is the block header hash (A.K.A. block ID) of the first unique block after the most recent tracked split – a split after which both resulting chains are considered notable or tracked by the registry. (For chains with no such splits, this is the ID of the genesis block.)\n\nNote, split ID is inherently a "relative" identifier. After a tracked split, both resulting chains will have a new split ID. However, if a wallet has not yet heard about a particular split, that wallet will continue to reference one of the resulting chains by its previous split ID, and the split-unaware wallet may create transactions that are valid on both chains (losing claimable value if the receivers of their transactions don\'t acknowledge transfers on both chains). When a registry trusted by the wallet notes the split in it\'s `chains` map, the wallet can represent the split in the user interface using the the latest  {@link  ChainSnapshot }  for each chain and splitting coins prior to spending (by introducing post-split coins in each transaction).\n\nThis map may exclude the following well-known split IDs (all clients supporting any of these chains should build-in  {@link  ChainHistory }  for those chains):\n\n- `0000000000000000029e471c41818d24b8b74c911071c4ef0b4a0509f9b5a8ce`:   A.K.A. mainnet – the BCH side of the BCH/XEC split.\n- `00000000ae25e85d9e22cd6c8d72c2f5d4b0222289d801b7f633aeae3f8c6367`:   A.K.A testnet4 – the test network on which CHIPs are activated   simultaneously with mainnet (May 15 at 12 UTC).\n- `00000000040ba9641ba98a37b2e5ceead38e4e2930ac8f145c8094f94c708727`:   A.K.A. chipnet – the test network on which CHIPs are activated 6 months   before mainnet (November 15 at 12 UTC).\n\nAll other split IDs referenced by this registry should be included in this map.',
      type: 'object',
    },
    defaultChain: {
      description:
        'The split ID of the chain/network considered the "default" chain for this registry. Identities that do not specify a  {@link  IdentitySnapshot.splitId }  are assumed to be set to this split ID. For a description of split IDs, see  {@link  MetadataRegistry.chains } .\n\nIf not provided, the `defaultChain` is `0000000000000000029e471c41818d24b8b74c911071c4ef0b4a0509f9b5a8ce`, the BCH side of the BCH/XEC split (mainnet). Common values include:\n- `00000000ae25e85d9e22cd6c8d72c2f5d4b0222289d801b7f633aeae3f8c6367` (testnet4)\n- `00000000040ba9641ba98a37b2e5ceead38e4e2930ac8f145c8094f94c708727` (chipnet)',
      type: 'string',
    },
    extensions: {
      $ref: '#/definitions/Extensions',
      description:
        'A mapping of `Registry` extension identifiers to extension definitions.  {@link  Extensions }  may be widely standardized or application-specific.\n\nStandardized extensions for `Registry`s include the `locale` extension. See https://github.com/bitjson/chip-bcmr#locales-extension for details.',
    },
    identities: {
      additionalProperties: { $ref: '#/definitions/IdentityHistory' },
      description:
        "A mapping of authbases to the `IdentityHistory` for that identity.\n\nAn authbase is a 32-byte, hex-encoded transaction hash (A.K.A. TXID) for which the zeroth-descendant transaction chain (ZDTC) authenticates and publishes an identity's claimed metadata.\n\nIdentities may represent metadata registries, specific types of tokens, companies, organizations, individuals, or other on-chain entities.",
      type: 'object',
    },
    latestRevision: {
      description:
        'The timestamp of the latest revision made to this registry version. The timestamp must be provided in simplified extended ISO 8601 format, a 24-character string of format `YYYY-MM-DDTHH:mm:ss.sssZ` where timezone is zero UTC (denoted by `Z`). Note, this is the format returned by ECMAScript `Date.toISOString()`.',
      type: 'string',
    },
    license: {
      description:
        'The license under which this registry is published. This may be specified as either a SPDX short identifier (https://spdx.org/licenses/) or by including the full text of the license.\n\nCommon values include:  - `CC0-1.0`: https://creativecommons.org/publicdomain/zero/1.0/  - `MIT`: https://opensource.org/licenses/MIT',
      type: 'string',
    },
    registryIdentity: {
      anyOf: [
        { $ref: '#/definitions/OffChainRegistryIdentity' },
        { type: 'string' },
      ],
      description:
        "The identity information of this particular registry, provided as either an authbase (recommended) or an `IdentitySnapshot`.\n\nAn authbase is a 32-byte, hex-encoded transaction hash (A.K.A. TXID) for which the zeroth-descendant transaction chain (ZDTC) authenticates and publishes all registry updates. If an authbase is provided, the registry's identity information can be found in `identities[authbase]`, and clients should immediately attempt to verify the registry's identity on-chain. (See https://github.com/bitjson/chip-bcmr#chain-resolved-registries)\n\nIf an `IdentitySnapshot` is provided directly, this registry does not support on-chain resolution/authentication, and the contained `IdentitySnapshot` can only be authenticated via DNS/HTTPS.",
    },
    tags: {
      additionalProperties: { $ref: '#/definitions/Tag' },
      description:
        'A map of registry-specific `Tag`s used by this registry to convey information about identities it tracks.\n\nTags allow registries to group identities into collections of related identities, marking characteristics or those identities. Tags are standardized within a registry and may represent either labels applied by that registry (e.g. `individual`, `organization`, `token`, `wallet`, `exchange`, `staking`, `utility-token`, `security-token`, `stablecoin`, `wrapped`, `collectable`, `deflationary`, `governance`, `decentralized-exchange`, `liquidity-provider`, `sidechain`, `sidechain-bridge`, etc.) or designations by external authorities (certification, membership, ownership, etc.) that are tracked by that registry.\n\nTags may be used by clients in search, discover, and filtering of identities, and they can also convey information like accreditation from investor protection organizations, public certifications by security or financial auditors, and other designations that signal legitimacy and value to users.',
      type: 'object',
    },
    version: {
      additionalProperties: false,
      description:
        'The version of this registry. Versioning adheres to Semantic Versioning (https://semver.org/).',
      properties: {
        major: {
          description:
            'The major version is incremented when an identity is removed.',
          type: 'number',
        },
        minor: {
          description:
            'The minor version is incremented when an identity is added or a new identity snapshot is added.',
          type: 'number',
        },
        patch: {
          description:
            'The patch version is incremented when an existing identity or identity snapshot is modified (e.g. to correct an error or add a missing piece of information) or when other registry properties (e.g. registry `name`, `description`, `uris`, etc.) are modified.\n\nGenerally, substantive changes to an existing identity should be made using a new identity snapshot in a minor version upgrade – this allows clients to provide a better user experience by noting the change in relevant user interfaces.\n\nFor example, patch upgrades might include spelling corrections in an existing snapshot or the addition of an `icon` containing a higher-resolution version of an existing `icon` image. On the other hand, a rebranding in which the icon is substantially changed may warrant a new identity snapshot to be added in a minor version upgrade.',
          type: 'number',
        },
      },
      required: ['major', 'minor', 'patch'],
      type: 'object',
    },
  },
  required: ['version', 'latestRevision', 'registryIdentity'],
  type: 'object',
};
const schema26 = {
  additionalProperties: {
    anyOf: [
      { type: 'string' },
      { additionalProperties: { type: 'string' }, type: 'object' },
      {
        additionalProperties: {
          additionalProperties: { type: 'string' },
          type: 'object',
        },
        type: 'object',
      },
    ],
  },
  description:
    "A mapping of extension identifiers to extension definitions. Extensions may be widely standardized or application-specific, and extension definitions must be either:\n\n- `string`s,\n- key-value mappings of `string`s, or\n- two-dimensional, key-value mappings of `string`s.\n\nThis limitation encourages safety and wider compatibility across implementations.\n\nTo encode an array, it is recommended that each value be assigned to a numeric key indicating the item's index (beginning at `0`). Numerically-indexed objects are often a more useful and resilient data-transfer format than simple arrays because they simplify difference-only transmission: only modified indexes need to be transferred, and shifts in item order must be explicit, simplifying merges of conflicting updates.\n\nFor encoding of more complex data, consider using base64 and/or string-encoded JSON.",
  type: 'object',
};
const func4 = Object.prototype.hasOwnProperty;
const schema24 = {
  additionalProperties: { $ref: '#/definitions/ChainSnapshot' },
  description:
    'A field keyed by timestamps to document the evolution of the field. Each timestamp must be provided in simplified extended ISO 8601 format, a 24-character string of format `YYYY-MM-DDTHH:mm:ss.sssZ` where timezone is zero UTC (denoted by `Z`). Note, this is the format returned by ECMAScript `Date.toISOString()`.\n\nFor example, to insert a new value: ```ts const result = { ...previousValue, [(new Date()).toISOString()]: newValue }; ```',
  type: 'object',
};
const schema25 = {
  additionalProperties: false,
  description:
    "A snapshot of the metadata for a particular chain/network at a specific time. This allows for registries to provide similar metadata for each chain's native currency unit (name, description, symbol, icon, etc.) as can be provided for other registered tokens.",
  properties: {
    description: {
      description:
        'A string describing this identity for use in user interfaces.\n\nIn user interfaces with limited space, descriptions should be hidden beyond the first newline character or `140` characters until revealed by the user.\n\nE.g.:\n- `The common stock issued by ACME, Inc.`\n- `A metadata registry maintained by Company Name, the embedded registry for Wallet Name.`\n- `Software developer and lead maintainer of Wallet Name.`',
      type: 'string',
    },
    extensions: {
      $ref: '#/definitions/Extensions',
      description:
        'A mapping of `IdentitySnapshot` extension identifiers to extension definitions.  {@link  Extensions }  may be widely standardized or application-specific.\n\nStandardized extensions for `IdentitySnapshot`s include the `authchain` extension. See https://github.com/bitjson/chip-bcmr#authchain-extension for details.',
    },
    name: {
      description:
        'The name of this identity for use in interfaces.\n\nIn user interfaces with limited space, names should be hidden beyond the first newline character or `20` characters until revealed by the user.\n\nE.g. `ACME Class A Shares`, `ACME Registry`, `Satoshi Nakamoto`, etc.',
      type: 'string',
    },
    splitId: {
      description:
        "The split ID of this identity's chain of record.\n\nIf undefined, defaults to  {@link  MetadataRegistry.defaultChain } .",
      type: 'string',
    },
    status: {
      description:
        'The status of this identity, must be `active`, `inactive`, or `burned`. If omitted, defaults to `active`.\n- Identities with an `active` status should be actively tracked by clients.\n- Identities with an `inactive` status may be considered for archival by clients and may be removed in future registry versions.\n- Identities with a `burned` status have been destroyed by setting the latest identity output to a data-carrier output (`OP_RETURN`), permanently terminating the authchain. Clients should archive burned identities and – if the burned identity represented a token type – consider burning any remaining tokens of that category to reclaim funds from those outputs.',
      enum: ['active', 'burned', 'inactive'],
      type: 'string',
    },
    tags: {
      description:
        "An array of `Tag` identifiers marking the `Tag`s associated with this identity. All specified tag identifiers must be defined in the registry's `tags` mapping.",
      items: { type: 'string' },
      type: 'array',
    },
    token: {
      additionalProperties: false,
      description:
        "A data structure indicating how the chain's native currency units should be displayed in user interfaces.",
      properties: {
        decimals: {
          description:
            'An integer between `0` and `18` (inclusive) indicating the divisibility of the primary unit of this native currency.\n\nThis is the number of digits that can appear after the decimal separator in currency amounts. For a currency with a `symbol` of `SYMBOL` and a `decimals` of `2`, an amount of `12345` should be displayed as `123.45 SYMBOL`.\n\nIf omitted, defaults to `0`.',
          type: 'number',
        },
        symbol: {
          description:
            'An abbreviation used to uniquely identity this native currency unit.\n\nSymbols must be comprised only of capital letters, numbers, and dashes (`-`). This can be validated with the regular expression: `/^[-A-Z0-9]+$/`.',
          type: 'string',
        },
      },
      required: ['symbol'],
      type: 'object',
    },
    uris: {
      $ref: '#/definitions/URIs',
      description:
        'A mapping of identifiers to URIs associated with this identity. URI identifiers may be widely-standardized or registry-specific. Values must be valid URIs, including a protocol prefix (e.g. `https://` or `ipfs://`). Clients are only required to support `https` and `ipfs` URIs, but any scheme may be specified.\n\nThe following identifiers are recommended for all identities:\n- `icon`\n- `web`\n\nThe following optional identifiers are standardized:\n- `blog`\n- `chat`\n- `forum`\n- `icon-intro`\n- `image`\n- `migrate`\n- `registry`\n- `support`\n\nFor details on these standard identifiers, see: https://github.com/bitjson/chip-bcmr#uri-identifiers\n\nCustom URI identifiers allow for sharing social networking profiles, p2p connection information, and other application-specific URIs. Identifiers must be lowercase, alphanumeric strings, with no whitespace or special characters other than dashes (as a regular expression: `/^[-a-z0-9]+$/`).\n\nFor example, some common identifiers include: `discord`, `docker`, `facebook`, `git`, `github`, `gitter`, `instagram`, `linkedin`, `matrix`, `npm`, `reddit`, `slack`, `substack`, `telegram`, `twitter`, `wechat`, `youtube`.',
    },
  },
  required: ['name', 'token'],
  type: 'object',
};
const schema27 = {
  additionalProperties: { type: 'string' },
  description:
    'A mapping of identifiers to URIs associated with an entity. URI identifiers may be widely-standardized or registry-specific. Values must be valid URIs, including a protocol prefix – e.g. `https://` or `ipfs://`., Clients are only required to support `https` and `ipfs` URIs, but any scheme may be specified.',
  type: 'object',
};
function validate23(
  data,
  { instancePath = '', parentData, parentDataProperty, rootData = data } = {},
) {
  let vErrors = null;
  let errors = 0;
  if (errors === 0) {
    if (data && typeof data == 'object' && !Array.isArray(data)) {
      let missing0;
      if (
        (data.name === undefined && (missing0 = 'name')) ||
        (data.token === undefined && (missing0 = 'token'))
      ) {
        validate23.errors = [
          {
            instancePath,
            schemaPath: '#/required',
            keyword: 'required',
            params: { missingProperty: missing0 },
            message: "must have required property '" + missing0 + "'",
          },
        ];
        return false;
      } else {
        const _errs1 = errors;
        for (const key0 in data) {
          if (
            !(
              key0 === 'description' ||
              key0 === 'extensions' ||
              key0 === 'name' ||
              key0 === 'splitId' ||
              key0 === 'status' ||
              key0 === 'tags' ||
              key0 === 'token' ||
              key0 === 'uris'
            )
          ) {
            validate23.errors = [
              {
                instancePath,
                schemaPath: '#/additionalProperties',
                keyword: 'additionalProperties',
                params: { additionalProperty: key0 },
                message: 'must NOT have additional properties',
              },
            ];
            return false;
            break;
          }
        }
        if (_errs1 === errors) {
          if (data.description !== undefined) {
            const _errs2 = errors;
            if (typeof data.description !== 'string') {
              validate23.errors = [
                {
                  instancePath: instancePath + '/description',
                  schemaPath: '#/properties/description/type',
                  keyword: 'type',
                  params: { type: 'string' },
                  message: 'must be string',
                },
              ];
              return false;
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.extensions !== undefined) {
              let data1 = data.extensions;
              const _errs4 = errors;
              const _errs5 = errors;
              if (errors === _errs5) {
                if (
                  data1 &&
                  typeof data1 == 'object' &&
                  !Array.isArray(data1)
                ) {
                  for (const key1 in data1) {
                    let data2 = data1[key1];
                    const _errs8 = errors;
                    const _errs9 = errors;
                    let valid3 = false;
                    const _errs10 = errors;
                    if (typeof data2 !== 'string') {
                      const err0 = {
                        instancePath:
                          instancePath +
                          '/extensions/' +
                          key1.replace(/~/g, '~0').replace(/\//g, '~1'),
                        schemaPath:
                          '#/definitions/Extensions/additionalProperties/anyOf/0/type',
                        keyword: 'type',
                        params: { type: 'string' },
                        message: 'must be string',
                      };
                      if (vErrors === null) {
                        vErrors = [err0];
                      } else {
                        vErrors.push(err0);
                      }
                      errors++;
                    }
                    var _valid0 = _errs10 === errors;
                    valid3 = valid3 || _valid0;
                    if (!valid3) {
                      const _errs12 = errors;
                      if (errors === _errs12) {
                        if (
                          data2 &&
                          typeof data2 == 'object' &&
                          !Array.isArray(data2)
                        ) {
                          for (const key2 in data2) {
                            const _errs15 = errors;
                            if (typeof data2[key2] !== 'string') {
                              const err1 = {
                                instancePath:
                                  instancePath +
                                  '/extensions/' +
                                  key1
                                    .replace(/~/g, '~0')
                                    .replace(/\//g, '~1') +
                                  '/' +
                                  key2.replace(/~/g, '~0').replace(/\//g, '~1'),
                                schemaPath:
                                  '#/definitions/Extensions/additionalProperties/anyOf/1/additionalProperties/type',
                                keyword: 'type',
                                params: { type: 'string' },
                                message: 'must be string',
                              };
                              if (vErrors === null) {
                                vErrors = [err1];
                              } else {
                                vErrors.push(err1);
                              }
                              errors++;
                            }
                            var valid4 = _errs15 === errors;
                            if (!valid4) {
                              break;
                            }
                          }
                        } else {
                          const err2 = {
                            instancePath:
                              instancePath +
                              '/extensions/' +
                              key1.replace(/~/g, '~0').replace(/\//g, '~1'),
                            schemaPath:
                              '#/definitions/Extensions/additionalProperties/anyOf/1/type',
                            keyword: 'type',
                            params: { type: 'object' },
                            message: 'must be object',
                          };
                          if (vErrors === null) {
                            vErrors = [err2];
                          } else {
                            vErrors.push(err2);
                          }
                          errors++;
                        }
                      }
                      var _valid0 = _errs12 === errors;
                      valid3 = valid3 || _valid0;
                      if (!valid3) {
                        const _errs17 = errors;
                        if (errors === _errs17) {
                          if (
                            data2 &&
                            typeof data2 == 'object' &&
                            !Array.isArray(data2)
                          ) {
                            for (const key3 in data2) {
                              let data4 = data2[key3];
                              const _errs20 = errors;
                              if (errors === _errs20) {
                                if (
                                  data4 &&
                                  typeof data4 == 'object' &&
                                  !Array.isArray(data4)
                                ) {
                                  for (const key4 in data4) {
                                    const _errs23 = errors;
                                    if (typeof data4[key4] !== 'string') {
                                      const err3 = {
                                        instancePath:
                                          instancePath +
                                          '/extensions/' +
                                          key1
                                            .replace(/~/g, '~0')
                                            .replace(/\//g, '~1') +
                                          '/' +
                                          key3
                                            .replace(/~/g, '~0')
                                            .replace(/\//g, '~1') +
                                          '/' +
                                          key4
                                            .replace(/~/g, '~0')
                                            .replace(/\//g, '~1'),
                                        schemaPath:
                                          '#/definitions/Extensions/additionalProperties/anyOf/2/additionalProperties/additionalProperties/type',
                                        keyword: 'type',
                                        params: { type: 'string' },
                                        message: 'must be string',
                                      };
                                      if (vErrors === null) {
                                        vErrors = [err3];
                                      } else {
                                        vErrors.push(err3);
                                      }
                                      errors++;
                                    }
                                    var valid6 = _errs23 === errors;
                                    if (!valid6) {
                                      break;
                                    }
                                  }
                                } else {
                                  const err4 = {
                                    instancePath:
                                      instancePath +
                                      '/extensions/' +
                                      key1
                                        .replace(/~/g, '~0')
                                        .replace(/\//g, '~1') +
                                      '/' +
                                      key3
                                        .replace(/~/g, '~0')
                                        .replace(/\//g, '~1'),
                                    schemaPath:
                                      '#/definitions/Extensions/additionalProperties/anyOf/2/additionalProperties/type',
                                    keyword: 'type',
                                    params: { type: 'object' },
                                    message: 'must be object',
                                  };
                                  if (vErrors === null) {
                                    vErrors = [err4];
                                  } else {
                                    vErrors.push(err4);
                                  }
                                  errors++;
                                }
                              }
                              var valid5 = _errs20 === errors;
                              if (!valid5) {
                                break;
                              }
                            }
                          } else {
                            const err5 = {
                              instancePath:
                                instancePath +
                                '/extensions/' +
                                key1.replace(/~/g, '~0').replace(/\//g, '~1'),
                              schemaPath:
                                '#/definitions/Extensions/additionalProperties/anyOf/2/type',
                              keyword: 'type',
                              params: { type: 'object' },
                              message: 'must be object',
                            };
                            if (vErrors === null) {
                              vErrors = [err5];
                            } else {
                              vErrors.push(err5);
                            }
                            errors++;
                          }
                        }
                        var _valid0 = _errs17 === errors;
                        valid3 = valid3 || _valid0;
                      }
                    }
                    if (!valid3) {
                      const err6 = {
                        instancePath:
                          instancePath +
                          '/extensions/' +
                          key1.replace(/~/g, '~0').replace(/\//g, '~1'),
                        schemaPath:
                          '#/definitions/Extensions/additionalProperties/anyOf',
                        keyword: 'anyOf',
                        params: {},
                        message: 'must match a schema in anyOf',
                      };
                      if (vErrors === null) {
                        vErrors = [err6];
                      } else {
                        vErrors.push(err6);
                      }
                      errors++;
                      validate23.errors = vErrors;
                      return false;
                    } else {
                      errors = _errs9;
                      if (vErrors !== null) {
                        if (_errs9) {
                          vErrors.length = _errs9;
                        } else {
                          vErrors = null;
                        }
                      }
                    }
                    var valid2 = _errs8 === errors;
                    if (!valid2) {
                      break;
                    }
                  }
                } else {
                  validate23.errors = [
                    {
                      instancePath: instancePath + '/extensions',
                      schemaPath: '#/definitions/Extensions/type',
                      keyword: 'type',
                      params: { type: 'object' },
                      message: 'must be object',
                    },
                  ];
                  return false;
                }
              }
              var valid0 = _errs4 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.name !== undefined) {
                const _errs25 = errors;
                if (typeof data.name !== 'string') {
                  validate23.errors = [
                    {
                      instancePath: instancePath + '/name',
                      schemaPath: '#/properties/name/type',
                      keyword: 'type',
                      params: { type: 'string' },
                      message: 'must be string',
                    },
                  ];
                  return false;
                }
                var valid0 = _errs25 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.splitId !== undefined) {
                  const _errs27 = errors;
                  if (typeof data.splitId !== 'string') {
                    validate23.errors = [
                      {
                        instancePath: instancePath + '/splitId',
                        schemaPath: '#/properties/splitId/type',
                        keyword: 'type',
                        params: { type: 'string' },
                        message: 'must be string',
                      },
                    ];
                    return false;
                  }
                  var valid0 = _errs27 === errors;
                } else {
                  var valid0 = true;
                }
                if (valid0) {
                  if (data.status !== undefined) {
                    let data8 = data.status;
                    const _errs29 = errors;
                    if (typeof data8 !== 'string') {
                      validate23.errors = [
                        {
                          instancePath: instancePath + '/status',
                          schemaPath: '#/properties/status/type',
                          keyword: 'type',
                          params: { type: 'string' },
                          message: 'must be string',
                        },
                      ];
                      return false;
                    }
                    if (
                      !(
                        data8 === 'active' ||
                        data8 === 'burned' ||
                        data8 === 'inactive'
                      )
                    ) {
                      validate23.errors = [
                        {
                          instancePath: instancePath + '/status',
                          schemaPath: '#/properties/status/enum',
                          keyword: 'enum',
                          params: {
                            allowedValues: schema25.properties.status.enum,
                          },
                          message: 'must be equal to one of the allowed values',
                        },
                      ];
                      return false;
                    }
                    var valid0 = _errs29 === errors;
                  } else {
                    var valid0 = true;
                  }
                  if (valid0) {
                    if (data.tags !== undefined) {
                      let data9 = data.tags;
                      const _errs31 = errors;
                      if (errors === _errs31) {
                        if (Array.isArray(data9)) {
                          var valid7 = true;
                          const len0 = data9.length;
                          for (let i0 = 0; i0 < len0; i0++) {
                            const _errs33 = errors;
                            if (typeof data9[i0] !== 'string') {
                              validate23.errors = [
                                {
                                  instancePath: instancePath + '/tags/' + i0,
                                  schemaPath: '#/properties/tags/items/type',
                                  keyword: 'type',
                                  params: { type: 'string' },
                                  message: 'must be string',
                                },
                              ];
                              return false;
                            }
                            var valid7 = _errs33 === errors;
                            if (!valid7) {
                              break;
                            }
                          }
                        } else {
                          validate23.errors = [
                            {
                              instancePath: instancePath + '/tags',
                              schemaPath: '#/properties/tags/type',
                              keyword: 'type',
                              params: { type: 'array' },
                              message: 'must be array',
                            },
                          ];
                          return false;
                        }
                      }
                      var valid0 = _errs31 === errors;
                    } else {
                      var valid0 = true;
                    }
                    if (valid0) {
                      if (data.token !== undefined) {
                        let data11 = data.token;
                        const _errs35 = errors;
                        if (errors === _errs35) {
                          if (
                            data11 &&
                            typeof data11 == 'object' &&
                            !Array.isArray(data11)
                          ) {
                            let missing1;
                            if (
                              data11.symbol === undefined &&
                              (missing1 = 'symbol')
                            ) {
                              validate23.errors = [
                                {
                                  instancePath: instancePath + '/token',
                                  schemaPath: '#/properties/token/required',
                                  keyword: 'required',
                                  params: { missingProperty: missing1 },
                                  message:
                                    "must have required property '" +
                                    missing1 +
                                    "'",
                                },
                              ];
                              return false;
                            } else {
                              const _errs37 = errors;
                              for (const key5 in data11) {
                                if (
                                  !(key5 === 'decimals' || key5 === 'symbol')
                                ) {
                                  validate23.errors = [
                                    {
                                      instancePath: instancePath + '/token',
                                      schemaPath:
                                        '#/properties/token/additionalProperties',
                                      keyword: 'additionalProperties',
                                      params: { additionalProperty: key5 },
                                      message:
                                        'must NOT have additional properties',
                                    },
                                  ];
                                  return false;
                                  break;
                                }
                              }
                              if (_errs37 === errors) {
                                if (data11.decimals !== undefined) {
                                  let data12 = data11.decimals;
                                  const _errs38 = errors;
                                  if (
                                    !(
                                      typeof data12 == 'number' &&
                                      isFinite(data12)
                                    )
                                  ) {
                                    validate23.errors = [
                                      {
                                        instancePath:
                                          instancePath + '/token/decimals',
                                        schemaPath:
                                          '#/properties/token/properties/decimals/type',
                                        keyword: 'type',
                                        params: { type: 'number' },
                                        message: 'must be number',
                                      },
                                    ];
                                    return false;
                                  }
                                  var valid8 = _errs38 === errors;
                                } else {
                                  var valid8 = true;
                                }
                                if (valid8) {
                                  if (data11.symbol !== undefined) {
                                    const _errs40 = errors;
                                    if (typeof data11.symbol !== 'string') {
                                      validate23.errors = [
                                        {
                                          instancePath:
                                            instancePath + '/token/symbol',
                                          schemaPath:
                                            '#/properties/token/properties/symbol/type',
                                          keyword: 'type',
                                          params: { type: 'string' },
                                          message: 'must be string',
                                        },
                                      ];
                                      return false;
                                    }
                                    var valid8 = _errs40 === errors;
                                  } else {
                                    var valid8 = true;
                                  }
                                }
                              }
                            }
                          } else {
                            validate23.errors = [
                              {
                                instancePath: instancePath + '/token',
                                schemaPath: '#/properties/token/type',
                                keyword: 'type',
                                params: { type: 'object' },
                                message: 'must be object',
                              },
                            ];
                            return false;
                          }
                        }
                        var valid0 = _errs35 === errors;
                      } else {
                        var valid0 = true;
                      }
                      if (valid0) {
                        if (data.uris !== undefined) {
                          let data14 = data.uris;
                          const _errs42 = errors;
                          const _errs43 = errors;
                          if (errors === _errs43) {
                            if (
                              data14 &&
                              typeof data14 == 'object' &&
                              !Array.isArray(data14)
                            ) {
                              for (const key6 in data14) {
                                const _errs46 = errors;
                                if (typeof data14[key6] !== 'string') {
                                  validate23.errors = [
                                    {
                                      instancePath:
                                        instancePath +
                                        '/uris/' +
                                        key6
                                          .replace(/~/g, '~0')
                                          .replace(/\//g, '~1'),
                                      schemaPath:
                                        '#/definitions/URIs/additionalProperties/type',
                                      keyword: 'type',
                                      params: { type: 'string' },
                                      message: 'must be string',
                                    },
                                  ];
                                  return false;
                                }
                                var valid10 = _errs46 === errors;
                                if (!valid10) {
                                  break;
                                }
                              }
                            } else {
                              validate23.errors = [
                                {
                                  instancePath: instancePath + '/uris',
                                  schemaPath: '#/definitions/URIs/type',
                                  keyword: 'type',
                                  params: { type: 'object' },
                                  message: 'must be object',
                                },
                              ];
                              return false;
                            }
                          }
                          var valid0 = _errs42 === errors;
                        } else {
                          var valid0 = true;
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    } else {
      validate23.errors = [
        {
          instancePath,
          schemaPath: '#/type',
          keyword: 'type',
          params: { type: 'object' },
          message: 'must be object',
        },
      ];
      return false;
    }
  }
  validate23.errors = vErrors;
  return errors === 0;
}
function validate22(
  data,
  { instancePath = '', parentData, parentDataProperty, rootData = data } = {},
) {
  let vErrors = null;
  let errors = 0;
  if (errors === 0) {
    if (data && typeof data == 'object' && !Array.isArray(data)) {
      for (const key0 in data) {
        const _errs2 = errors;
        if (
          !validate23(data[key0], {
            instancePath:
              instancePath +
              '/' +
              key0.replace(/~/g, '~0').replace(/\//g, '~1'),
            parentData: data,
            parentDataProperty: key0,
            rootData,
          })
        ) {
          vErrors =
            vErrors === null
              ? validate23.errors
              : vErrors.concat(validate23.errors);
          errors = vErrors.length;
        }
        var valid0 = _errs2 === errors;
        if (!valid0) {
          break;
        }
      }
    } else {
      validate22.errors = [
        {
          instancePath,
          schemaPath: '#/type',
          keyword: 'type',
          params: { type: 'object' },
          message: 'must be object',
        },
      ];
      return false;
    }
  }
  validate22.errors = vErrors;
  return errors === 0;
}
const schema29 = {
  additionalProperties: { $ref: '#/definitions/IdentitySnapshot' },
  description:
    'A field keyed by timestamps to document the evolution of the field. Each timestamp must be provided in simplified extended ISO 8601 format, a 24-character string of format `YYYY-MM-DDTHH:mm:ss.sssZ` where timezone is zero UTC (denoted by `Z`). Note, this is the format returned by ECMAScript `Date.toISOString()`.\n\nFor example, to insert a new value: ```ts const result = { ...previousValue, [(new Date()).toISOString()]: newValue }; ```',
  type: 'object',
};
const schema30 = {
  additionalProperties: false,
  description:
    'A snapshot of the metadata for a particular identity at a specific time.',
  properties: {
    description: {
      description:
        'A string describing this identity for use in user interfaces.\n\nIn user interfaces with limited space, descriptions should be hidden beyond the first newline character or `140` characters until revealed by the user.\n\nE.g.:\n- `The common stock issued by ACME, Inc.`\n- `A metadata registry maintained by Company Name, the embedded registry for Wallet Name.`\n- `Software developer and lead maintainer of Wallet Name.`',
      type: 'string',
    },
    extensions: {
      $ref: '#/definitions/Extensions',
      description:
        'A mapping of `IdentitySnapshot` extension identifiers to extension definitions.  {@link  Extensions }  may be widely standardized or application-specific.\n\nStandardized extensions for `IdentitySnapshot`s include the `authchain` extension. See https://github.com/bitjson/chip-bcmr#authchain-extension for details.',
    },
    migrated: {
      description:
        "The timestamp at which this identity snapshot is fully in effect. This value should only be provided if the snapshot takes effect over a period of time (e.g. an in-circulation token identity is gradually migrating to a new category). In these cases, clients should gradually migrate to using the new information beginning after the identity snapshot's timestamp and the `migrated` time.\n\nThis timestamp must be provided in simplified extended ISO 8601 format, a 24-character string of format `YYYY-MM-DDTHH:mm:ss.sssZ` where timezone is zero UTC (denoted by `Z`). Note, this is the format returned by ECMAScript `Date.toISOString()`.",
      type: 'string',
    },
    name: {
      description:
        'The name of this identity for use in interfaces.\n\nIn user interfaces with limited space, names should be hidden beyond the first newline character or `20` characters until revealed by the user.\n\nE.g. `ACME Class A Shares`, `ACME Registry`, `Satoshi Nakamoto`, etc.',
      type: 'string',
    },
    splitId: {
      description:
        "The split ID of this identity's chain of record.\n\nIf undefined, defaults to  {@link  MetadataRegistry.defaultChain } .",
      type: 'string',
    },
    status: {
      description:
        'The status of this identity, must be `active`, `inactive`, or `burned`. If omitted, defaults to `active`.\n- Identities with an `active` status should be actively tracked by clients.\n- Identities with an `inactive` status may be considered for archival by clients and may be removed in future registry versions.\n- Identities with a `burned` status have been destroyed by setting the latest identity output to a data-carrier output (`OP_RETURN`), permanently terminating the authchain. Clients should archive burned identities and – if the burned identity represented a token type – consider burning any remaining tokens of that category to reclaim funds from those outputs.',
      enum: ['active', 'burned', 'inactive'],
      type: 'string',
    },
    tags: {
      description:
        "An array of `Tag` identifiers marking the `Tag`s associated with this identity. All specified tag identifiers must be defined in the registry's `tags` mapping.",
      items: { type: 'string' },
      type: 'array',
    },
    token: {
      $ref: '#/definitions/TokenCategory',
      description:
        'If this identity is a type of token, a data structure indicating how tokens should be understood and displayed in user interfaces. Omitted for non-token identities.',
    },
    uris: {
      $ref: '#/definitions/URIs',
      description:
        'A mapping of identifiers to URIs associated with this identity. URI identifiers may be widely-standardized or registry-specific. Values must be valid URIs, including a protocol prefix (e.g. `https://` or `ipfs://`). Clients are only required to support `https` and `ipfs` URIs, but any scheme may be specified.\n\nThe following identifiers are recommended for all identities:\n- `icon`\n- `web`\n\nThe following optional identifiers are standardized:\n- `blog`\n- `chat`\n- `forum`\n- `icon-intro`\n- `image`\n- `migrate`\n- `registry`\n- `support`\n\nFor details on these standard identifiers, see: https://github.com/bitjson/chip-bcmr#uri-identifiers\n\nCustom URI identifiers allow for sharing social networking profiles, p2p connection information, and other application-specific URIs. Identifiers must be lowercase, alphanumeric strings, with no whitespace or special characters other than dashes (as a regular expression: `/^[-a-z0-9]+$/`).\n\nFor example, some common identifiers include: `discord`, `docker`, `facebook`, `git`, `github`, `gitter`, `instagram`, `linkedin`, `matrix`, `npm`, `reddit`, `slack`, `substack`, `telegram`, `twitter`, `wechat`, `youtube`.',
    },
  },
  required: ['name'],
  type: 'object',
};
const schema32 = {
  additionalProperties: false,
  description:
    "A definition specifying information about an identity's token category.",
  properties: {
    category: {
      description:
        "The current token category used by this identity. Often, this will be equal to the identity's authbase, but some token identities must migrate to new categories for technical reasons.",
      type: 'string',
    },
    decimals: {
      description:
        'An integer between `0` and `18` (inclusive) indicating the divisibility of the primary unit of this token category.\n\nThis is the number of digits that can appear after the decimal separator in fungible token amounts. For a token category with a `symbol` of `SYMBOL` and a `decimals` of `2`, a fungible token amount of `12345` should be displayed as `123.45 SYMBOL`.\n\nIf omitted, defaults to `0`.',
      type: 'number',
    },
    nfts: {
      $ref: '#/definitions/NftCategory',
      description:
        'Display information for non-fungible tokens (NFTs) of this identity. Omitted for token categories without NFTs.',
    },
    symbol: {
      description:
        'An abbreviation used to uniquely identity this token category.\n\nSymbols must be comprised only of capital letters, numbers, and dashes (`-`). This can be validated with the regular expression: `/^[-A-Z0-9]+$/`.',
      type: 'string',
    },
  },
  required: ['category', 'symbol'],
  type: 'object',
};
const schema33 = {
  additionalProperties: false,
  description:
    'A definition specifying the non-fungible token information for a token category.',
  properties: {
    description: {
      description:
        'A string describing how this identity uses NFTs (for use in user interfaces). Descriptions longer than `160` characters may be elided in some interfaces.\n\nE.g.:\n- "ACME DEX NFT order receipts are issued when you place orders on the decentralized exchange. After orders are processed, order receipts can be redeemed for purchased tokens or sales proceeds.";\n- "ACME Game collectable NFTs unlock unique playable content, user avatars, and item skins in ACME Game Online."; etc.',
      type: 'string',
    },
    fields: {
      $ref: '#/definitions/NftCategoryField',
      description:
        'A mapping of field identifier to field definitions for the data fields that can appear in NFT commitments of this category.\n\nCategories including only sequential NFTs (where `parse.bytecode` is undefined) should omit `fields` (or set to `undefined`).',
    },
    parse: {
      anyOf: [
        { $ref: '#/definitions/ParsableNftCollection' },
        { $ref: '#/definitions/SequentialNftCollection' },
      ],
      description:
        'Parsing and interpretation information for all NFTs of this category; this enables generalized wallets to parse and display detailed information about all NFTs held by the wallet, e.g. `BCH Pledged`, `Order Price`, `Seat Number`, `Asset Number`, `IPFS Content Identifier`, `HTTPS URL`, etc.\n\nParsing instructions are provided in the `bytecode` property, and the results are interpreted using the `types` property.',
    },
  },
  required: ['parse'],
  type: 'object',
};
const schema34 = {
  additionalProperties: {
    additionalProperties: false,
    properties: {
      description: {
        description:
          'A string describing how this identity uses NFTs (for use in user interfaces). Descriptions longer than `160` characters may be elided in some interfaces.\n\nE.g.:\n- `The BCH value pledged at the time this receipt was issued.`\n- `The number of tokens sold in this order.`\n- `The seat number associated with this ticket.`',
        type: 'string',
      },
      encoding: {
        anyOf: [
          {
            additionalProperties: false,
            properties: {
              type: {
                enum: [
                  'binary',
                  'boolean',
                  'hex',
                  'https-url',
                  'ipfs-cid',
                  'utf8',
                  'locktime',
                ],
                type: 'string',
              },
            },
            required: ['type'],
            type: 'object',
          },
          {
            additionalProperties: false,
            properties: {
              aggregate: {
                const: 'add',
                description:
                  "The `aggregate` property indicates that aggregating this field from multiple NFTs is desirable in user interfaces. For example, for a field named `BCH Pledged` where `aggregate` is `add`, the client can display a `Total BCH Pledged` in any user interface listing more than one NFT.\n\nIf specified, clients should aggregate the field from all NFTs, of all NFT types within the category, within a particular view (e.g. NFTs held by a single wallet, NFTs existing in a single transaction's outputs, etc.) using the specified operation.\n\nNote, while aggregation could be performed using any commutative operation – multiplication, bitwise AND, bitwise OR, bitwise XOR, etc. – only `add` is currently supported.",
                type: 'string',
              },
              decimals: {
                description:
                  'An integer between `0` and `18` (inclusive) indicating the divisibility of the primary unit of this token field.\n\nThis is the number of digits that can appear after the decimal separator in amounts. For a field with a `decimals` of `2`, a value of `123456` should be displayed as `1234.56`.\n\nIf omitted, defaults to `0`.',
                type: 'number',
              },
              type: { const: 'number', type: 'string' },
              unit: {
                description:
                  "The unit in which this field is denominated, taking the `decimals` value into account. If representing fungible token amount, this will often be the symbol of the represented token category.\n\nE.g. `BCH`, `sats`, `AcmeUSD`, etc.\n\nIf not provided, clients should not represent this field as having a unit beyond the field's `name`.",
                type: 'string',
              },
            },
            required: ['type'],
            type: 'object',
          },
        ],
        description:
          'The expected encoding of this field when read from the parsing altstack (see  {@link  ParsableNftCollection } ). All encoding definitions must have a `type`, and some encoding definitions allow for additional hinting about display strategies in clients.\n\nEncoding types may be set to `binary`, `boolean`, `hex`, `number`, or `utf8`:\n\n- `binary` types should be displayed as binary literals (e.g. `0b0101`)\n- `boolean` types should be displayed as `true` if exactly `0x01` or `false` if exactly `0x00`. If a boolean value does not match one of these values, clients should represent the NFT as unable to be parsed (e.g. simply display the full `commitment`).\n- `hex` types should be displayed as hex literals (e.g.`0xabcd`).\n- `https-url` types are percent encoded with the `https://` prefix omitted; they may be displayed as URIs or as activatable links.\n- `ipfs-cid` types are binary-encoded IPFS Content Identifiers; they may be displayed as URIs or as activatable links.\n- `locktime` types are `OP_TXLOCKTIME` results: integers from `0` to `4294967295` (inclusive) where values less than `500000000` are understood to be a block height (the current block number in the chain, beginning from block `0`), and values greater than or equal to `500000000` are understood to be a Median Time Past (BIP113) UNIX timestamp. (Note, sequence age is not currently supported.)\n- `number` types should be displayed according the their configured `decimals` and `unit` values.\n- `utf8` types should be displayed as utf8 strings.',
      },
      extensions: {
        $ref: '#/definitions/Extensions',
        description:
          'A mapping of NFT field extension identifiers to extension definitions.  {@link  Extensions }  may be widely standardized or application-specific.',
      },
      name: {
        description:
          'The name of this field for use in interfaces. Names longer than `20` characters may be elided in some interfaces.\n\nE.g.:\n- `BCH Pledged`\n- `Tokens Sold`\n- `Settlement Locktime`\n- `Seat Number`,\n- `IPFS Content Identifier`\n- `HTTPS URL`',
        type: 'string',
      },
      uris: {
        $ref: '#/definitions/URIs',
        description:
          'A mapping of identifiers to URIs associated with this NFT field. URI identifiers may be widely-standardized or registry-specific. Values must be valid URIs, including a protocol prefix (e.g. `https://` or `ipfs://`). Clients are only required to support `https` and `ipfs` URIs, but any scheme may be specified.',
      },
    },
    required: ['encoding'],
    type: 'object',
  },
  description:
    'A definition specifying a field that can be encoded in non-fungible tokens of a token category.',
  type: 'object',
};
function validate30(
  data,
  { instancePath = '', parentData, parentDataProperty, rootData = data } = {},
) {
  let vErrors = null;
  let errors = 0;
  if (errors === 0) {
    if (data && typeof data == 'object' && !Array.isArray(data)) {
      for (const key0 in data) {
        let data0 = data[key0];
        const _errs2 = errors;
        if (errors === _errs2) {
          if (data0 && typeof data0 == 'object' && !Array.isArray(data0)) {
            let missing0;
            if (data0.encoding === undefined && (missing0 = 'encoding')) {
              validate30.errors = [
                {
                  instancePath:
                    instancePath +
                    '/' +
                    key0.replace(/~/g, '~0').replace(/\//g, '~1'),
                  schemaPath: '#/additionalProperties/required',
                  keyword: 'required',
                  params: { missingProperty: missing0 },
                  message: "must have required property '" + missing0 + "'",
                },
              ];
              return false;
            } else {
              const _errs4 = errors;
              for (const key1 in data0) {
                if (
                  !(
                    key1 === 'description' ||
                    key1 === 'encoding' ||
                    key1 === 'extensions' ||
                    key1 === 'name' ||
                    key1 === 'uris'
                  )
                ) {
                  validate30.errors = [
                    {
                      instancePath:
                        instancePath +
                        '/' +
                        key0.replace(/~/g, '~0').replace(/\//g, '~1'),
                      schemaPath: '#/additionalProperties/additionalProperties',
                      keyword: 'additionalProperties',
                      params: { additionalProperty: key1 },
                      message: 'must NOT have additional properties',
                    },
                  ];
                  return false;
                  break;
                }
              }
              if (_errs4 === errors) {
                if (data0.description !== undefined) {
                  const _errs5 = errors;
                  if (typeof data0.description !== 'string') {
                    validate30.errors = [
                      {
                        instancePath:
                          instancePath +
                          '/' +
                          key0.replace(/~/g, '~0').replace(/\//g, '~1') +
                          '/description',
                        schemaPath:
                          '#/additionalProperties/properties/description/type',
                        keyword: 'type',
                        params: { type: 'string' },
                        message: 'must be string',
                      },
                    ];
                    return false;
                  }
                  var valid1 = _errs5 === errors;
                } else {
                  var valid1 = true;
                }
                if (valid1) {
                  if (data0.encoding !== undefined) {
                    let data2 = data0.encoding;
                    const _errs7 = errors;
                    const _errs8 = errors;
                    let valid2 = false;
                    const _errs9 = errors;
                    if (errors === _errs9) {
                      if (
                        data2 &&
                        typeof data2 == 'object' &&
                        !Array.isArray(data2)
                      ) {
                        let missing1;
                        if (data2.type === undefined && (missing1 = 'type')) {
                          const err0 = {
                            instancePath:
                              instancePath +
                              '/' +
                              key0.replace(/~/g, '~0').replace(/\//g, '~1') +
                              '/encoding',
                            schemaPath:
                              '#/additionalProperties/properties/encoding/anyOf/0/required',
                            keyword: 'required',
                            params: { missingProperty: missing1 },
                            message:
                              "must have required property '" + missing1 + "'",
                          };
                          if (vErrors === null) {
                            vErrors = [err0];
                          } else {
                            vErrors.push(err0);
                          }
                          errors++;
                        } else {
                          const _errs11 = errors;
                          for (const key2 in data2) {
                            if (!(key2 === 'type')) {
                              const err1 = {
                                instancePath:
                                  instancePath +
                                  '/' +
                                  key0
                                    .replace(/~/g, '~0')
                                    .replace(/\//g, '~1') +
                                  '/encoding',
                                schemaPath:
                                  '#/additionalProperties/properties/encoding/anyOf/0/additionalProperties',
                                keyword: 'additionalProperties',
                                params: { additionalProperty: key2 },
                                message: 'must NOT have additional properties',
                              };
                              if (vErrors === null) {
                                vErrors = [err1];
                              } else {
                                vErrors.push(err1);
                              }
                              errors++;
                              break;
                            }
                          }
                          if (_errs11 === errors) {
                            if (data2.type !== undefined) {
                              let data3 = data2.type;
                              if (typeof data3 !== 'string') {
                                const err2 = {
                                  instancePath:
                                    instancePath +
                                    '/' +
                                    key0
                                      .replace(/~/g, '~0')
                                      .replace(/\//g, '~1') +
                                    '/encoding/type',
                                  schemaPath:
                                    '#/additionalProperties/properties/encoding/anyOf/0/properties/type/type',
                                  keyword: 'type',
                                  params: { type: 'string' },
                                  message: 'must be string',
                                };
                                if (vErrors === null) {
                                  vErrors = [err2];
                                } else {
                                  vErrors.push(err2);
                                }
                                errors++;
                              }
                              if (
                                !(
                                  data3 === 'binary' ||
                                  data3 === 'boolean' ||
                                  data3 === 'hex' ||
                                  data3 === 'https-url' ||
                                  data3 === 'ipfs-cid' ||
                                  data3 === 'utf8' ||
                                  data3 === 'locktime'
                                )
                              ) {
                                const err3 = {
                                  instancePath:
                                    instancePath +
                                    '/' +
                                    key0
                                      .replace(/~/g, '~0')
                                      .replace(/\//g, '~1') +
                                    '/encoding/type',
                                  schemaPath:
                                    '#/additionalProperties/properties/encoding/anyOf/0/properties/type/enum',
                                  keyword: 'enum',
                                  params: {
                                    allowedValues:
                                      schema34.additionalProperties.properties
                                        .encoding.anyOf[0].properties.type.enum,
                                  },
                                  message:
                                    'must be equal to one of the allowed values',
                                };
                                if (vErrors === null) {
                                  vErrors = [err3];
                                } else {
                                  vErrors.push(err3);
                                }
                                errors++;
                              }
                            }
                          }
                        }
                      } else {
                        const err4 = {
                          instancePath:
                            instancePath +
                            '/' +
                            key0.replace(/~/g, '~0').replace(/\//g, '~1') +
                            '/encoding',
                          schemaPath:
                            '#/additionalProperties/properties/encoding/anyOf/0/type',
                          keyword: 'type',
                          params: { type: 'object' },
                          message: 'must be object',
                        };
                        if (vErrors === null) {
                          vErrors = [err4];
                        } else {
                          vErrors.push(err4);
                        }
                        errors++;
                      }
                    }
                    var _valid0 = _errs9 === errors;
                    valid2 = valid2 || _valid0;
                    if (!valid2) {
                      const _errs14 = errors;
                      if (errors === _errs14) {
                        if (
                          data2 &&
                          typeof data2 == 'object' &&
                          !Array.isArray(data2)
                        ) {
                          let missing2;
                          if (data2.type === undefined && (missing2 = 'type')) {
                            const err5 = {
                              instancePath:
                                instancePath +
                                '/' +
                                key0.replace(/~/g, '~0').replace(/\//g, '~1') +
                                '/encoding',
                              schemaPath:
                                '#/additionalProperties/properties/encoding/anyOf/1/required',
                              keyword: 'required',
                              params: { missingProperty: missing2 },
                              message:
                                "must have required property '" +
                                missing2 +
                                "'",
                            };
                            if (vErrors === null) {
                              vErrors = [err5];
                            } else {
                              vErrors.push(err5);
                            }
                            errors++;
                          } else {
                            const _errs16 = errors;
                            for (const key3 in data2) {
                              if (
                                !(
                                  key3 === 'aggregate' ||
                                  key3 === 'decimals' ||
                                  key3 === 'type' ||
                                  key3 === 'unit'
                                )
                              ) {
                                const err6 = {
                                  instancePath:
                                    instancePath +
                                    '/' +
                                    key0
                                      .replace(/~/g, '~0')
                                      .replace(/\//g, '~1') +
                                    '/encoding',
                                  schemaPath:
                                    '#/additionalProperties/properties/encoding/anyOf/1/additionalProperties',
                                  keyword: 'additionalProperties',
                                  params: { additionalProperty: key3 },
                                  message:
                                    'must NOT have additional properties',
                                };
                                if (vErrors === null) {
                                  vErrors = [err6];
                                } else {
                                  vErrors.push(err6);
                                }
                                errors++;
                                break;
                              }
                            }
                            if (_errs16 === errors) {
                              if (data2.aggregate !== undefined) {
                                let data4 = data2.aggregate;
                                const _errs17 = errors;
                                if (typeof data4 !== 'string') {
                                  const err7 = {
                                    instancePath:
                                      instancePath +
                                      '/' +
                                      key0
                                        .replace(/~/g, '~0')
                                        .replace(/\//g, '~1') +
                                      '/encoding/aggregate',
                                    schemaPath:
                                      '#/additionalProperties/properties/encoding/anyOf/1/properties/aggregate/type',
                                    keyword: 'type',
                                    params: { type: 'string' },
                                    message: 'must be string',
                                  };
                                  if (vErrors === null) {
                                    vErrors = [err7];
                                  } else {
                                    vErrors.push(err7);
                                  }
                                  errors++;
                                }
                                if ('add' !== data4) {
                                  const err8 = {
                                    instancePath:
                                      instancePath +
                                      '/' +
                                      key0
                                        .replace(/~/g, '~0')
                                        .replace(/\//g, '~1') +
                                      '/encoding/aggregate',
                                    schemaPath:
                                      '#/additionalProperties/properties/encoding/anyOf/1/properties/aggregate/const',
                                    keyword: 'const',
                                    params: { allowedValue: 'add' },
                                    message: 'must be equal to constant',
                                  };
                                  if (vErrors === null) {
                                    vErrors = [err8];
                                  } else {
                                    vErrors.push(err8);
                                  }
                                  errors++;
                                }
                                var valid4 = _errs17 === errors;
                              } else {
                                var valid4 = true;
                              }
                              if (valid4) {
                                if (data2.decimals !== undefined) {
                                  let data5 = data2.decimals;
                                  const _errs19 = errors;
                                  if (
                                    !(
                                      typeof data5 == 'number' &&
                                      isFinite(data5)
                                    )
                                  ) {
                                    const err9 = {
                                      instancePath:
                                        instancePath +
                                        '/' +
                                        key0
                                          .replace(/~/g, '~0')
                                          .replace(/\//g, '~1') +
                                        '/encoding/decimals',
                                      schemaPath:
                                        '#/additionalProperties/properties/encoding/anyOf/1/properties/decimals/type',
                                      keyword: 'type',
                                      params: { type: 'number' },
                                      message: 'must be number',
                                    };
                                    if (vErrors === null) {
                                      vErrors = [err9];
                                    } else {
                                      vErrors.push(err9);
                                    }
                                    errors++;
                                  }
                                  var valid4 = _errs19 === errors;
                                } else {
                                  var valid4 = true;
                                }
                                if (valid4) {
                                  if (data2.type !== undefined) {
                                    let data6 = data2.type;
                                    const _errs21 = errors;
                                    if (typeof data6 !== 'string') {
                                      const err10 = {
                                        instancePath:
                                          instancePath +
                                          '/' +
                                          key0
                                            .replace(/~/g, '~0')
                                            .replace(/\//g, '~1') +
                                          '/encoding/type',
                                        schemaPath:
                                          '#/additionalProperties/properties/encoding/anyOf/1/properties/type/type',
                                        keyword: 'type',
                                        params: { type: 'string' },
                                        message: 'must be string',
                                      };
                                      if (vErrors === null) {
                                        vErrors = [err10];
                                      } else {
                                        vErrors.push(err10);
                                      }
                                      errors++;
                                    }
                                    if ('number' !== data6) {
                                      const err11 = {
                                        instancePath:
                                          instancePath +
                                          '/' +
                                          key0
                                            .replace(/~/g, '~0')
                                            .replace(/\//g, '~1') +
                                          '/encoding/type',
                                        schemaPath:
                                          '#/additionalProperties/properties/encoding/anyOf/1/properties/type/const',
                                        keyword: 'const',
                                        params: { allowedValue: 'number' },
                                        message: 'must be equal to constant',
                                      };
                                      if (vErrors === null) {
                                        vErrors = [err11];
                                      } else {
                                        vErrors.push(err11);
                                      }
                                      errors++;
                                    }
                                    var valid4 = _errs21 === errors;
                                  } else {
                                    var valid4 = true;
                                  }
                                  if (valid4) {
                                    if (data2.unit !== undefined) {
                                      const _errs23 = errors;
                                      if (typeof data2.unit !== 'string') {
                                        const err12 = {
                                          instancePath:
                                            instancePath +
                                            '/' +
                                            key0
                                              .replace(/~/g, '~0')
                                              .replace(/\//g, '~1') +
                                            '/encoding/unit',
                                          schemaPath:
                                            '#/additionalProperties/properties/encoding/anyOf/1/properties/unit/type',
                                          keyword: 'type',
                                          params: { type: 'string' },
                                          message: 'must be string',
                                        };
                                        if (vErrors === null) {
                                          vErrors = [err12];
                                        } else {
                                          vErrors.push(err12);
                                        }
                                        errors++;
                                      }
                                      var valid4 = _errs23 === errors;
                                    } else {
                                      var valid4 = true;
                                    }
                                  }
                                }
                              }
                            }
                          }
                        } else {
                          const err13 = {
                            instancePath:
                              instancePath +
                              '/' +
                              key0.replace(/~/g, '~0').replace(/\//g, '~1') +
                              '/encoding',
                            schemaPath:
                              '#/additionalProperties/properties/encoding/anyOf/1/type',
                            keyword: 'type',
                            params: { type: 'object' },
                            message: 'must be object',
                          };
                          if (vErrors === null) {
                            vErrors = [err13];
                          } else {
                            vErrors.push(err13);
                          }
                          errors++;
                        }
                      }
                      var _valid0 = _errs14 === errors;
                      valid2 = valid2 || _valid0;
                    }
                    if (!valid2) {
                      const err14 = {
                        instancePath:
                          instancePath +
                          '/' +
                          key0.replace(/~/g, '~0').replace(/\//g, '~1') +
                          '/encoding',
                        schemaPath:
                          '#/additionalProperties/properties/encoding/anyOf',
                        keyword: 'anyOf',
                        params: {},
                        message: 'must match a schema in anyOf',
                      };
                      if (vErrors === null) {
                        vErrors = [err14];
                      } else {
                        vErrors.push(err14);
                      }
                      errors++;
                      validate30.errors = vErrors;
                      return false;
                    } else {
                      errors = _errs8;
                      if (vErrors !== null) {
                        if (_errs8) {
                          vErrors.length = _errs8;
                        } else {
                          vErrors = null;
                        }
                      }
                    }
                    var valid1 = _errs7 === errors;
                  } else {
                    var valid1 = true;
                  }
                  if (valid1) {
                    if (data0.extensions !== undefined) {
                      let data8 = data0.extensions;
                      const _errs25 = errors;
                      const _errs26 = errors;
                      if (errors === _errs26) {
                        if (
                          data8 &&
                          typeof data8 == 'object' &&
                          !Array.isArray(data8)
                        ) {
                          for (const key4 in data8) {
                            let data9 = data8[key4];
                            const _errs29 = errors;
                            const _errs30 = errors;
                            let valid7 = false;
                            const _errs31 = errors;
                            if (typeof data9 !== 'string') {
                              const err15 = {
                                instancePath:
                                  instancePath +
                                  '/' +
                                  key0
                                    .replace(/~/g, '~0')
                                    .replace(/\//g, '~1') +
                                  '/extensions/' +
                                  key4.replace(/~/g, '~0').replace(/\//g, '~1'),
                                schemaPath:
                                  '#/definitions/Extensions/additionalProperties/anyOf/0/type',
                                keyword: 'type',
                                params: { type: 'string' },
                                message: 'must be string',
                              };
                              if (vErrors === null) {
                                vErrors = [err15];
                              } else {
                                vErrors.push(err15);
                              }
                              errors++;
                            }
                            var _valid1 = _errs31 === errors;
                            valid7 = valid7 || _valid1;
                            if (!valid7) {
                              const _errs33 = errors;
                              if (errors === _errs33) {
                                if (
                                  data9 &&
                                  typeof data9 == 'object' &&
                                  !Array.isArray(data9)
                                ) {
                                  for (const key5 in data9) {
                                    const _errs36 = errors;
                                    if (typeof data9[key5] !== 'string') {
                                      const err16 = {
                                        instancePath:
                                          instancePath +
                                          '/' +
                                          key0
                                            .replace(/~/g, '~0')
                                            .replace(/\//g, '~1') +
                                          '/extensions/' +
                                          key4
                                            .replace(/~/g, '~0')
                                            .replace(/\//g, '~1') +
                                          '/' +
                                          key5
                                            .replace(/~/g, '~0')
                                            .replace(/\//g, '~1'),
                                        schemaPath:
                                          '#/definitions/Extensions/additionalProperties/anyOf/1/additionalProperties/type',
                                        keyword: 'type',
                                        params: { type: 'string' },
                                        message: 'must be string',
                                      };
                                      if (vErrors === null) {
                                        vErrors = [err16];
                                      } else {
                                        vErrors.push(err16);
                                      }
                                      errors++;
                                    }
                                    var valid8 = _errs36 === errors;
                                    if (!valid8) {
                                      break;
                                    }
                                  }
                                } else {
                                  const err17 = {
                                    instancePath:
                                      instancePath +
                                      '/' +
                                      key0
                                        .replace(/~/g, '~0')
                                        .replace(/\//g, '~1') +
                                      '/extensions/' +
                                      key4
                                        .replace(/~/g, '~0')
                                        .replace(/\//g, '~1'),
                                    schemaPath:
                                      '#/definitions/Extensions/additionalProperties/anyOf/1/type',
                                    keyword: 'type',
                                    params: { type: 'object' },
                                    message: 'must be object',
                                  };
                                  if (vErrors === null) {
                                    vErrors = [err17];
                                  } else {
                                    vErrors.push(err17);
                                  }
                                  errors++;
                                }
                              }
                              var _valid1 = _errs33 === errors;
                              valid7 = valid7 || _valid1;
                              if (!valid7) {
                                const _errs38 = errors;
                                if (errors === _errs38) {
                                  if (
                                    data9 &&
                                    typeof data9 == 'object' &&
                                    !Array.isArray(data9)
                                  ) {
                                    for (const key6 in data9) {
                                      let data11 = data9[key6];
                                      const _errs41 = errors;
                                      if (errors === _errs41) {
                                        if (
                                          data11 &&
                                          typeof data11 == 'object' &&
                                          !Array.isArray(data11)
                                        ) {
                                          for (const key7 in data11) {
                                            const _errs44 = errors;
                                            if (
                                              typeof data11[key7] !== 'string'
                                            ) {
                                              const err18 = {
                                                instancePath:
                                                  instancePath +
                                                  '/' +
                                                  key0
                                                    .replace(/~/g, '~0')
                                                    .replace(/\//g, '~1') +
                                                  '/extensions/' +
                                                  key4
                                                    .replace(/~/g, '~0')
                                                    .replace(/\//g, '~1') +
                                                  '/' +
                                                  key6
                                                    .replace(/~/g, '~0')
                                                    .replace(/\//g, '~1') +
                                                  '/' +
                                                  key7
                                                    .replace(/~/g, '~0')
                                                    .replace(/\//g, '~1'),
                                                schemaPath:
                                                  '#/definitions/Extensions/additionalProperties/anyOf/2/additionalProperties/additionalProperties/type',
                                                keyword: 'type',
                                                params: { type: 'string' },
                                                message: 'must be string',
                                              };
                                              if (vErrors === null) {
                                                vErrors = [err18];
                                              } else {
                                                vErrors.push(err18);
                                              }
                                              errors++;
                                            }
                                            var valid10 = _errs44 === errors;
                                            if (!valid10) {
                                              break;
                                            }
                                          }
                                        } else {
                                          const err19 = {
                                            instancePath:
                                              instancePath +
                                              '/' +
                                              key0
                                                .replace(/~/g, '~0')
                                                .replace(/\//g, '~1') +
                                              '/extensions/' +
                                              key4
                                                .replace(/~/g, '~0')
                                                .replace(/\//g, '~1') +
                                              '/' +
                                              key6
                                                .replace(/~/g, '~0')
                                                .replace(/\//g, '~1'),
                                            schemaPath:
                                              '#/definitions/Extensions/additionalProperties/anyOf/2/additionalProperties/type',
                                            keyword: 'type',
                                            params: { type: 'object' },
                                            message: 'must be object',
                                          };
                                          if (vErrors === null) {
                                            vErrors = [err19];
                                          } else {
                                            vErrors.push(err19);
                                          }
                                          errors++;
                                        }
                                      }
                                      var valid9 = _errs41 === errors;
                                      if (!valid9) {
                                        break;
                                      }
                                    }
                                  } else {
                                    const err20 = {
                                      instancePath:
                                        instancePath +
                                        '/' +
                                        key0
                                          .replace(/~/g, '~0')
                                          .replace(/\//g, '~1') +
                                        '/extensions/' +
                                        key4
                                          .replace(/~/g, '~0')
                                          .replace(/\//g, '~1'),
                                      schemaPath:
                                        '#/definitions/Extensions/additionalProperties/anyOf/2/type',
                                      keyword: 'type',
                                      params: { type: 'object' },
                                      message: 'must be object',
                                    };
                                    if (vErrors === null) {
                                      vErrors = [err20];
                                    } else {
                                      vErrors.push(err20);
                                    }
                                    errors++;
                                  }
                                }
                                var _valid1 = _errs38 === errors;
                                valid7 = valid7 || _valid1;
                              }
                            }
                            if (!valid7) {
                              const err21 = {
                                instancePath:
                                  instancePath +
                                  '/' +
                                  key0
                                    .replace(/~/g, '~0')
                                    .replace(/\//g, '~1') +
                                  '/extensions/' +
                                  key4.replace(/~/g, '~0').replace(/\//g, '~1'),
                                schemaPath:
                                  '#/definitions/Extensions/additionalProperties/anyOf',
                                keyword: 'anyOf',
                                params: {},
                                message: 'must match a schema in anyOf',
                              };
                              if (vErrors === null) {
                                vErrors = [err21];
                              } else {
                                vErrors.push(err21);
                              }
                              errors++;
                              validate30.errors = vErrors;
                              return false;
                            } else {
                              errors = _errs30;
                              if (vErrors !== null) {
                                if (_errs30) {
                                  vErrors.length = _errs30;
                                } else {
                                  vErrors = null;
                                }
                              }
                            }
                            var valid6 = _errs29 === errors;
                            if (!valid6) {
                              break;
                            }
                          }
                        } else {
                          validate30.errors = [
                            {
                              instancePath:
                                instancePath +
                                '/' +
                                key0.replace(/~/g, '~0').replace(/\//g, '~1') +
                                '/extensions',
                              schemaPath: '#/definitions/Extensions/type',
                              keyword: 'type',
                              params: { type: 'object' },
                              message: 'must be object',
                            },
                          ];
                          return false;
                        }
                      }
                      var valid1 = _errs25 === errors;
                    } else {
                      var valid1 = true;
                    }
                    if (valid1) {
                      if (data0.name !== undefined) {
                        const _errs46 = errors;
                        if (typeof data0.name !== 'string') {
                          validate30.errors = [
                            {
                              instancePath:
                                instancePath +
                                '/' +
                                key0.replace(/~/g, '~0').replace(/\//g, '~1') +
                                '/name',
                              schemaPath:
                                '#/additionalProperties/properties/name/type',
                              keyword: 'type',
                              params: { type: 'string' },
                              message: 'must be string',
                            },
                          ];
                          return false;
                        }
                        var valid1 = _errs46 === errors;
                      } else {
                        var valid1 = true;
                      }
                      if (valid1) {
                        if (data0.uris !== undefined) {
                          let data14 = data0.uris;
                          const _errs48 = errors;
                          const _errs49 = errors;
                          if (errors === _errs49) {
                            if (
                              data14 &&
                              typeof data14 == 'object' &&
                              !Array.isArray(data14)
                            ) {
                              for (const key8 in data14) {
                                const _errs52 = errors;
                                if (typeof data14[key8] !== 'string') {
                                  validate30.errors = [
                                    {
                                      instancePath:
                                        instancePath +
                                        '/' +
                                        key0
                                          .replace(/~/g, '~0')
                                          .replace(/\//g, '~1') +
                                        '/uris/' +
                                        key8
                                          .replace(/~/g, '~0')
                                          .replace(/\//g, '~1'),
                                      schemaPath:
                                        '#/definitions/URIs/additionalProperties/type',
                                      keyword: 'type',
                                      params: { type: 'string' },
                                      message: 'must be string',
                                    },
                                  ];
                                  return false;
                                }
                                var valid12 = _errs52 === errors;
                                if (!valid12) {
                                  break;
                                }
                              }
                            } else {
                              validate30.errors = [
                                {
                                  instancePath:
                                    instancePath +
                                    '/' +
                                    key0
                                      .replace(/~/g, '~0')
                                      .replace(/\//g, '~1') +
                                    '/uris',
                                  schemaPath: '#/definitions/URIs/type',
                                  keyword: 'type',
                                  params: { type: 'object' },
                                  message: 'must be object',
                                },
                              ];
                              return false;
                            }
                          }
                          var valid1 = _errs48 === errors;
                        } else {
                          var valid1 = true;
                        }
                      }
                    }
                  }
                }
              }
            }
          } else {
            validate30.errors = [
              {
                instancePath:
                  instancePath +
                  '/' +
                  key0.replace(/~/g, '~0').replace(/\//g, '~1'),
                schemaPath: '#/additionalProperties/type',
                keyword: 'type',
                params: { type: 'object' },
                message: 'must be object',
              },
            ];
            return false;
          }
        }
        var valid0 = _errs2 === errors;
        if (!valid0) {
          break;
        }
      }
    } else {
      validate30.errors = [
        {
          instancePath,
          schemaPath: '#/type',
          keyword: 'type',
          params: { type: 'object' },
          message: 'must be object',
        },
      ];
      return false;
    }
  }
  validate30.errors = vErrors;
  return errors === 0;
}
const schema37 = {
  additionalProperties: false,
  description:
    'Interpretation information for a collection of parsable NFTs, a collection in which each NFT may include additional metadata fields beyond a sequential identifier within its on-chain commitment. Note that  {@link  ParsableNftCollection } s differ from  {@link  SequentialNftCollection } s in that parsable collections require a parsing `bytecode` with which to inspect each NFT commitment: the type of each NFT is indexed by the hex-encoded contents the bottom item on the altstack following the evaluation of the parsing bytecode.',
  properties: {
    bytecode: {
      description:
        "A segment of hex-encoded Bitcoin Cash VM bytecode that parses UTXOs holding NFTs of this category, identifies the NFT's type within the category, and returns a list of the NFT's field values via the altstack. If undefined, this NFT Category includes only sequential NFTs, with only an identifier and no NFT fields encoded in each NFT's on-chain commitment.\n\nThe parse `bytecode` is evaluated by instantiating and partially verifying a standardized NFT parsing transaction:\n- version: `2`\n- inputs:   - 0: Spends the UTXO containing the NFT with an empty   unlocking bytecode and sequence number of `0`.   - 1: Spends index `0` of the empty hash outpoint, with locking   bytecode set to `parse.bytecode`, unlocking bytecode `OP_1`   (`0x51`) and sequence number `0`.\n- outputs:   - 0: A locking bytecode of OP_RETURN (`0x6a`) and value of `0`.\n- locktime: `0`\n\nAfter input 1 of this NFT parsing transaction is evaluated, if the resulting stack is not valid (a single \"truthy\" element remaining on the stack) – or if the altstack is empty – parsing has failed and clients should represent the NFT as unable to be parsed (e.g. simply display the full `commitment` as a hex-encoded value in the user interface).\n\nOn successful parsing evaluations, the bottom item on the altstack indicates the type of the NFT according to the matching definition in `types`. If no match is found, clients should represent the NFT as unable to be parsed.\n\nFor example: `00d2517f7c6b` (OP_0 OP_UTXOTOKENCOMMITMENT OP_1 OP_SPLIT OP_SWAP OP_TOALTSTACK OP_TOALTSTACK) splits the commitment after 1 byte, pushing the first byte to the altstack as an NFT type identifier and the remaining segment of the commitment as the first NFT field value.\n\nIf undefined (in a  {@link  SequentialNftCollection } ), this field could be considered to have a default value of `00d26b` (OP_0 OP_UTXOTOKENCOMMITMENT OP_TOALTSTACK), which takes the full contents of the commitment as a fixed type index. As such, each index of the NFT category's `types` maps a precise commitment value to the metadata for NFTs with that particular commitment. E.g. an NFT with an empty commitment (VM number 0) maps to `types['']`, a commitment of `01` (hex) maps to `types['01']`, etc. This pattern is used for collections of sequential NFTs.",
      type: 'string',
    },
    types: {
      additionalProperties: {
        $ref: '#/definitions/NftType',
        description:
          'A definitions for each type of NFT within the token category. Parsable NFT types are indexed by the hex-encoded value of the bottom altstack item following evaluation of `NftCategory.parse.bytecode`. The remaining altstack items are mapped to NFT fields according to the `fields` property of the matching NFT type.',
      },
      description:
        'A mapping of hex-encoded values to definitions of possible NFT types in this category.',
      type: 'object',
    },
  },
  required: ['bytecode', 'types'],
  type: 'object',
};
const schema38 = {
  additionalProperties: false,
  description: 'A definition for one type of NFT within a token category.',
  properties: {
    description: {
      description:
        'A string describing this NFT type for use in user interfaces.\n\nIn user interfaces with limited space, names should be hidden beyond the first newline character or `140` characters until revealed by the user.\n\nE.g.:\n- "Receipts issued by the exchange to record details about purchases. After settlement, these receipts are redeemed for the purchased tokens.";\n- "Receipts issued by the crowdfunding campaign to document the value of funds pledged. If the user decides to cancel their pledge before the campaign completes, these receipts can be redeemed for a full refund.";\n- "Tickets issued for events at ACME Stadium.";\n- Sealed ballots certified by ACME decentralized organization during the voting period. After the voting period ends, these ballots must be revealed to reclaim the tokens used for voting."',
      type: 'string',
    },
    extensions: {
      $ref: '#/definitions/Extensions',
      description:
        'A mapping of NFT type extension identifiers to extension definitions.  {@link  Extensions }  may be widely standardized or application-specific.',
    },
    fields: {
      description:
        "A list of identifiers for fields contained in NFTs of this type. On successful parsing evaluations, the bottom item on the altstack indicates the matched NFT type, and the remaining altstack items represent NFT field contents in the order listed (where `fields[0]` is the second-to-bottom item, and the final item in `fields` is the top of the altstack).\n\nFields should be ordered by recommended importance from most important to least important; in user interfaces, clients should display fields at lower indexes more prominently than those at higher indexes, e.g. if some fields cannot be displayed in minimized interfaces, higher-importance fields can still be represented. (Note, this ordering is controlled by the bytecode specified in `token.nft.parse.bytecode`.)\n\nIf this is a sequential NFT, (the category's `parse.bytecode` is undefined), `fields` should be omitted or set to `undefined`.",
      items: { type: 'string' },
      type: 'array',
    },
    name: {
      description:
        'The name of this NFT type for use in interfaces. Names longer than `20` characters may be elided in some interfaces.\n\nE.g. `Market Order Buys`, `Limit Order Sales`, `Pledge Receipts`, `ACME Stadium Tickets`, `Sealed Votes`, etc.',
      type: 'string',
    },
    uris: {
      $ref: '#/definitions/URIs',
      description:
        'A mapping of identifiers to URIs associated with this NFT type. URI identifiers may be widely-standardized or registry-specific. Values must be valid URIs, including a protocol prefix (e.g. `https://` or `ipfs://`). Clients are only required to support `https` and `ipfs` URIs, but any scheme may be specified.',
    },
  },
  required: ['name'],
  type: 'object',
};
function validate33(
  data,
  { instancePath = '', parentData, parentDataProperty, rootData = data } = {},
) {
  let vErrors = null;
  let errors = 0;
  if (errors === 0) {
    if (data && typeof data == 'object' && !Array.isArray(data)) {
      let missing0;
      if (data.name === undefined && (missing0 = 'name')) {
        validate33.errors = [
          {
            instancePath,
            schemaPath: '#/required',
            keyword: 'required',
            params: { missingProperty: missing0 },
            message: "must have required property '" + missing0 + "'",
          },
        ];
        return false;
      } else {
        const _errs1 = errors;
        for (const key0 in data) {
          if (
            !(
              key0 === 'description' ||
              key0 === 'extensions' ||
              key0 === 'fields' ||
              key0 === 'name' ||
              key0 === 'uris'
            )
          ) {
            validate33.errors = [
              {
                instancePath,
                schemaPath: '#/additionalProperties',
                keyword: 'additionalProperties',
                params: { additionalProperty: key0 },
                message: 'must NOT have additional properties',
              },
            ];
            return false;
            break;
          }
        }
        if (_errs1 === errors) {
          if (data.description !== undefined) {
            const _errs2 = errors;
            if (typeof data.description !== 'string') {
              validate33.errors = [
                {
                  instancePath: instancePath + '/description',
                  schemaPath: '#/properties/description/type',
                  keyword: 'type',
                  params: { type: 'string' },
                  message: 'must be string',
                },
              ];
              return false;
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.extensions !== undefined) {
              let data1 = data.extensions;
              const _errs4 = errors;
              const _errs5 = errors;
              if (errors === _errs5) {
                if (
                  data1 &&
                  typeof data1 == 'object' &&
                  !Array.isArray(data1)
                ) {
                  for (const key1 in data1) {
                    let data2 = data1[key1];
                    const _errs8 = errors;
                    const _errs9 = errors;
                    let valid3 = false;
                    const _errs10 = errors;
                    if (typeof data2 !== 'string') {
                      const err0 = {
                        instancePath:
                          instancePath +
                          '/extensions/' +
                          key1.replace(/~/g, '~0').replace(/\//g, '~1'),
                        schemaPath:
                          '#/definitions/Extensions/additionalProperties/anyOf/0/type',
                        keyword: 'type',
                        params: { type: 'string' },
                        message: 'must be string',
                      };
                      if (vErrors === null) {
                        vErrors = [err0];
                      } else {
                        vErrors.push(err0);
                      }
                      errors++;
                    }
                    var _valid0 = _errs10 === errors;
                    valid3 = valid3 || _valid0;
                    if (!valid3) {
                      const _errs12 = errors;
                      if (errors === _errs12) {
                        if (
                          data2 &&
                          typeof data2 == 'object' &&
                          !Array.isArray(data2)
                        ) {
                          for (const key2 in data2) {
                            const _errs15 = errors;
                            if (typeof data2[key2] !== 'string') {
                              const err1 = {
                                instancePath:
                                  instancePath +
                                  '/extensions/' +
                                  key1
                                    .replace(/~/g, '~0')
                                    .replace(/\//g, '~1') +
                                  '/' +
                                  key2.replace(/~/g, '~0').replace(/\//g, '~1'),
                                schemaPath:
                                  '#/definitions/Extensions/additionalProperties/anyOf/1/additionalProperties/type',
                                keyword: 'type',
                                params: { type: 'string' },
                                message: 'must be string',
                              };
                              if (vErrors === null) {
                                vErrors = [err1];
                              } else {
                                vErrors.push(err1);
                              }
                              errors++;
                            }
                            var valid4 = _errs15 === errors;
                            if (!valid4) {
                              break;
                            }
                          }
                        } else {
                          const err2 = {
                            instancePath:
                              instancePath +
                              '/extensions/' +
                              key1.replace(/~/g, '~0').replace(/\//g, '~1'),
                            schemaPath:
                              '#/definitions/Extensions/additionalProperties/anyOf/1/type',
                            keyword: 'type',
                            params: { type: 'object' },
                            message: 'must be object',
                          };
                          if (vErrors === null) {
                            vErrors = [err2];
                          } else {
                            vErrors.push(err2);
                          }
                          errors++;
                        }
                      }
                      var _valid0 = _errs12 === errors;
                      valid3 = valid3 || _valid0;
                      if (!valid3) {
                        const _errs17 = errors;
                        if (errors === _errs17) {
                          if (
                            data2 &&
                            typeof data2 == 'object' &&
                            !Array.isArray(data2)
                          ) {
                            for (const key3 in data2) {
                              let data4 = data2[key3];
                              const _errs20 = errors;
                              if (errors === _errs20) {
                                if (
                                  data4 &&
                                  typeof data4 == 'object' &&
                                  !Array.isArray(data4)
                                ) {
                                  for (const key4 in data4) {
                                    const _errs23 = errors;
                                    if (typeof data4[key4] !== 'string') {
                                      const err3 = {
                                        instancePath:
                                          instancePath +
                                          '/extensions/' +
                                          key1
                                            .replace(/~/g, '~0')
                                            .replace(/\//g, '~1') +
                                          '/' +
                                          key3
                                            .replace(/~/g, '~0')
                                            .replace(/\//g, '~1') +
                                          '/' +
                                          key4
                                            .replace(/~/g, '~0')
                                            .replace(/\//g, '~1'),
                                        schemaPath:
                                          '#/definitions/Extensions/additionalProperties/anyOf/2/additionalProperties/additionalProperties/type',
                                        keyword: 'type',
                                        params: { type: 'string' },
                                        message: 'must be string',
                                      };
                                      if (vErrors === null) {
                                        vErrors = [err3];
                                      } else {
                                        vErrors.push(err3);
                                      }
                                      errors++;
                                    }
                                    var valid6 = _errs23 === errors;
                                    if (!valid6) {
                                      break;
                                    }
                                  }
                                } else {
                                  const err4 = {
                                    instancePath:
                                      instancePath +
                                      '/extensions/' +
                                      key1
                                        .replace(/~/g, '~0')
                                        .replace(/\//g, '~1') +
                                      '/' +
                                      key3
                                        .replace(/~/g, '~0')
                                        .replace(/\//g, '~1'),
                                    schemaPath:
                                      '#/definitions/Extensions/additionalProperties/anyOf/2/additionalProperties/type',
                                    keyword: 'type',
                                    params: { type: 'object' },
                                    message: 'must be object',
                                  };
                                  if (vErrors === null) {
                                    vErrors = [err4];
                                  } else {
                                    vErrors.push(err4);
                                  }
                                  errors++;
                                }
                              }
                              var valid5 = _errs20 === errors;
                              if (!valid5) {
                                break;
                              }
                            }
                          } else {
                            const err5 = {
                              instancePath:
                                instancePath +
                                '/extensions/' +
                                key1.replace(/~/g, '~0').replace(/\//g, '~1'),
                              schemaPath:
                                '#/definitions/Extensions/additionalProperties/anyOf/2/type',
                              keyword: 'type',
                              params: { type: 'object' },
                              message: 'must be object',
                            };
                            if (vErrors === null) {
                              vErrors = [err5];
                            } else {
                              vErrors.push(err5);
                            }
                            errors++;
                          }
                        }
                        var _valid0 = _errs17 === errors;
                        valid3 = valid3 || _valid0;
                      }
                    }
                    if (!valid3) {
                      const err6 = {
                        instancePath:
                          instancePath +
                          '/extensions/' +
                          key1.replace(/~/g, '~0').replace(/\//g, '~1'),
                        schemaPath:
                          '#/definitions/Extensions/additionalProperties/anyOf',
                        keyword: 'anyOf',
                        params: {},
                        message: 'must match a schema in anyOf',
                      };
                      if (vErrors === null) {
                        vErrors = [err6];
                      } else {
                        vErrors.push(err6);
                      }
                      errors++;
                      validate33.errors = vErrors;
                      return false;
                    } else {
                      errors = _errs9;
                      if (vErrors !== null) {
                        if (_errs9) {
                          vErrors.length = _errs9;
                        } else {
                          vErrors = null;
                        }
                      }
                    }
                    var valid2 = _errs8 === errors;
                    if (!valid2) {
                      break;
                    }
                  }
                } else {
                  validate33.errors = [
                    {
                      instancePath: instancePath + '/extensions',
                      schemaPath: '#/definitions/Extensions/type',
                      keyword: 'type',
                      params: { type: 'object' },
                      message: 'must be object',
                    },
                  ];
                  return false;
                }
              }
              var valid0 = _errs4 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.fields !== undefined) {
                let data6 = data.fields;
                const _errs25 = errors;
                if (errors === _errs25) {
                  if (Array.isArray(data6)) {
                    var valid7 = true;
                    const len0 = data6.length;
                    for (let i0 = 0; i0 < len0; i0++) {
                      const _errs27 = errors;
                      if (typeof data6[i0] !== 'string') {
                        validate33.errors = [
                          {
                            instancePath: instancePath + '/fields/' + i0,
                            schemaPath: '#/properties/fields/items/type',
                            keyword: 'type',
                            params: { type: 'string' },
                            message: 'must be string',
                          },
                        ];
                        return false;
                      }
                      var valid7 = _errs27 === errors;
                      if (!valid7) {
                        break;
                      }
                    }
                  } else {
                    validate33.errors = [
                      {
                        instancePath: instancePath + '/fields',
                        schemaPath: '#/properties/fields/type',
                        keyword: 'type',
                        params: { type: 'array' },
                        message: 'must be array',
                      },
                    ];
                    return false;
                  }
                }
                var valid0 = _errs25 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.name !== undefined) {
                  const _errs29 = errors;
                  if (typeof data.name !== 'string') {
                    validate33.errors = [
                      {
                        instancePath: instancePath + '/name',
                        schemaPath: '#/properties/name/type',
                        keyword: 'type',
                        params: { type: 'string' },
                        message: 'must be string',
                      },
                    ];
                    return false;
                  }
                  var valid0 = _errs29 === errors;
                } else {
                  var valid0 = true;
                }
                if (valid0) {
                  if (data.uris !== undefined) {
                    let data9 = data.uris;
                    const _errs31 = errors;
                    const _errs32 = errors;
                    if (errors === _errs32) {
                      if (
                        data9 &&
                        typeof data9 == 'object' &&
                        !Array.isArray(data9)
                      ) {
                        for (const key5 in data9) {
                          const _errs35 = errors;
                          if (typeof data9[key5] !== 'string') {
                            validate33.errors = [
                              {
                                instancePath:
                                  instancePath +
                                  '/uris/' +
                                  key5.replace(/~/g, '~0').replace(/\//g, '~1'),
                                schemaPath:
                                  '#/definitions/URIs/additionalProperties/type',
                                keyword: 'type',
                                params: { type: 'string' },
                                message: 'must be string',
                              },
                            ];
                            return false;
                          }
                          var valid9 = _errs35 === errors;
                          if (!valid9) {
                            break;
                          }
                        }
                      } else {
                        validate33.errors = [
                          {
                            instancePath: instancePath + '/uris',
                            schemaPath: '#/definitions/URIs/type',
                            keyword: 'type',
                            params: { type: 'object' },
                            message: 'must be object',
                          },
                        ];
                        return false;
                      }
                    }
                    var valid0 = _errs31 === errors;
                  } else {
                    var valid0 = true;
                  }
                }
              }
            }
          }
        }
      }
    } else {
      validate33.errors = [
        {
          instancePath,
          schemaPath: '#/type',
          keyword: 'type',
          params: { type: 'object' },
          message: 'must be object',
        },
      ];
      return false;
    }
  }
  validate33.errors = vErrors;
  return errors === 0;
}
function validate32(
  data,
  { instancePath = '', parentData, parentDataProperty, rootData = data } = {},
) {
  let vErrors = null;
  let errors = 0;
  if (errors === 0) {
    if (data && typeof data == 'object' && !Array.isArray(data)) {
      let missing0;
      if (
        (data.bytecode === undefined && (missing0 = 'bytecode')) ||
        (data.types === undefined && (missing0 = 'types'))
      ) {
        validate32.errors = [
          {
            instancePath,
            schemaPath: '#/required',
            keyword: 'required',
            params: { missingProperty: missing0 },
            message: "must have required property '" + missing0 + "'",
          },
        ];
        return false;
      } else {
        const _errs1 = errors;
        for (const key0 in data) {
          if (!(key0 === 'bytecode' || key0 === 'types')) {
            validate32.errors = [
              {
                instancePath,
                schemaPath: '#/additionalProperties',
                keyword: 'additionalProperties',
                params: { additionalProperty: key0 },
                message: 'must NOT have additional properties',
              },
            ];
            return false;
            break;
          }
        }
        if (_errs1 === errors) {
          if (data.bytecode !== undefined) {
            const _errs2 = errors;
            if (typeof data.bytecode !== 'string') {
              validate32.errors = [
                {
                  instancePath: instancePath + '/bytecode',
                  schemaPath: '#/properties/bytecode/type',
                  keyword: 'type',
                  params: { type: 'string' },
                  message: 'must be string',
                },
              ];
              return false;
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.types !== undefined) {
              let data1 = data.types;
              const _errs4 = errors;
              if (errors === _errs4) {
                if (
                  data1 &&
                  typeof data1 == 'object' &&
                  !Array.isArray(data1)
                ) {
                  for (const key1 in data1) {
                    const _errs7 = errors;
                    if (
                      !validate33(data1[key1], {
                        instancePath:
                          instancePath +
                          '/types/' +
                          key1.replace(/~/g, '~0').replace(/\//g, '~1'),
                        parentData: data1,
                        parentDataProperty: key1,
                        rootData,
                      })
                    ) {
                      vErrors =
                        vErrors === null
                          ? validate33.errors
                          : vErrors.concat(validate33.errors);
                      errors = vErrors.length;
                    }
                    var valid1 = _errs7 === errors;
                    if (!valid1) {
                      break;
                    }
                  }
                } else {
                  validate32.errors = [
                    {
                      instancePath: instancePath + '/types',
                      schemaPath: '#/properties/types/type',
                      keyword: 'type',
                      params: { type: 'object' },
                      message: 'must be object',
                    },
                  ];
                  return false;
                }
              }
              var valid0 = _errs4 === errors;
            } else {
              var valid0 = true;
            }
          }
        }
      }
    } else {
      validate32.errors = [
        {
          instancePath,
          schemaPath: '#/type',
          keyword: 'type',
          params: { type: 'object' },
          message: 'must be object',
        },
      ];
      return false;
    }
  }
  validate32.errors = vErrors;
  return errors === 0;
}
const schema41 = {
  additionalProperties: false,
  description:
    'Interpretation information for a collection of sequential NFTs, a collection in which each NFT includes only a sequential identifier within its on-chain commitment. Note that  {@link  SequentialNftCollection } s differ from  {@link  ParsableNftCollection } s in that sequential collections lack a parsing `bytecode` with which to inspect each NFT commitment: the type of each NFT is indexed by the full contents its commitment (interpreted as a positive VM integer in user interfaces).',
  properties: {
    types: {
      additionalProperties: {
        $ref: '#/definitions/NftType',
        description:
          'Interpretation information for each type of NFT within the token category, indexed by commitment hex. For sequential NFTs, the on-chain commitment of each NFT is interpreted as a VM number to reference its particular NFT type in user interfaces. Issuing a sequential NFT with a negative or invalid VM number is discouraged, but clients may render the commitment of such NFTs in hex-encoded form, prefixed with `X`.',
      },
      description:
        'A mapping of each NFT commitment (typically, a positive integer encoded as a VM number) to metadata for that NFT type in this category.',
      type: 'object',
    },
  },
  required: ['types'],
  type: 'object',
};
function validate36(
  data,
  { instancePath = '', parentData, parentDataProperty, rootData = data } = {},
) {
  let vErrors = null;
  let errors = 0;
  if (errors === 0) {
    if (data && typeof data == 'object' && !Array.isArray(data)) {
      let missing0;
      if (data.types === undefined && (missing0 = 'types')) {
        validate36.errors = [
          {
            instancePath,
            schemaPath: '#/required',
            keyword: 'required',
            params: { missingProperty: missing0 },
            message: "must have required property '" + missing0 + "'",
          },
        ];
        return false;
      } else {
        const _errs1 = errors;
        for (const key0 in data) {
          if (!(key0 === 'types')) {
            validate36.errors = [
              {
                instancePath,
                schemaPath: '#/additionalProperties',
                keyword: 'additionalProperties',
                params: { additionalProperty: key0 },
                message: 'must NOT have additional properties',
              },
            ];
            return false;
            break;
          }
        }
        if (_errs1 === errors) {
          if (data.types !== undefined) {
            let data0 = data.types;
            const _errs2 = errors;
            if (errors === _errs2) {
              if (data0 && typeof data0 == 'object' && !Array.isArray(data0)) {
                for (const key1 in data0) {
                  const _errs5 = errors;
                  if (
                    !validate33(data0[key1], {
                      instancePath:
                        instancePath +
                        '/types/' +
                        key1.replace(/~/g, '~0').replace(/\//g, '~1'),
                      parentData: data0,
                      parentDataProperty: key1,
                      rootData,
                    })
                  ) {
                    vErrors =
                      vErrors === null
                        ? validate33.errors
                        : vErrors.concat(validate33.errors);
                    errors = vErrors.length;
                  }
                  var valid1 = _errs5 === errors;
                  if (!valid1) {
                    break;
                  }
                }
              } else {
                validate36.errors = [
                  {
                    instancePath: instancePath + '/types',
                    schemaPath: '#/properties/types/type',
                    keyword: 'type',
                    params: { type: 'object' },
                    message: 'must be object',
                  },
                ];
                return false;
              }
            }
          }
        }
      }
    } else {
      validate36.errors = [
        {
          instancePath,
          schemaPath: '#/type',
          keyword: 'type',
          params: { type: 'object' },
          message: 'must be object',
        },
      ];
      return false;
    }
  }
  validate36.errors = vErrors;
  return errors === 0;
}
function validate29(
  data,
  { instancePath = '', parentData, parentDataProperty, rootData = data } = {},
) {
  let vErrors = null;
  let errors = 0;
  if (errors === 0) {
    if (data && typeof data == 'object' && !Array.isArray(data)) {
      let missing0;
      if (data.parse === undefined && (missing0 = 'parse')) {
        validate29.errors = [
          {
            instancePath,
            schemaPath: '#/required',
            keyword: 'required',
            params: { missingProperty: missing0 },
            message: "must have required property '" + missing0 + "'",
          },
        ];
        return false;
      } else {
        const _errs1 = errors;
        for (const key0 in data) {
          if (
            !(key0 === 'description' || key0 === 'fields' || key0 === 'parse')
          ) {
            validate29.errors = [
              {
                instancePath,
                schemaPath: '#/additionalProperties',
                keyword: 'additionalProperties',
                params: { additionalProperty: key0 },
                message: 'must NOT have additional properties',
              },
            ];
            return false;
            break;
          }
        }
        if (_errs1 === errors) {
          if (data.description !== undefined) {
            const _errs2 = errors;
            if (typeof data.description !== 'string') {
              validate29.errors = [
                {
                  instancePath: instancePath + '/description',
                  schemaPath: '#/properties/description/type',
                  keyword: 'type',
                  params: { type: 'string' },
                  message: 'must be string',
                },
              ];
              return false;
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.fields !== undefined) {
              const _errs4 = errors;
              if (
                !validate30(data.fields, {
                  instancePath: instancePath + '/fields',
                  parentData: data,
                  parentDataProperty: 'fields',
                  rootData,
                })
              ) {
                vErrors =
                  vErrors === null
                    ? validate30.errors
                    : vErrors.concat(validate30.errors);
                errors = vErrors.length;
              }
              var valid0 = _errs4 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.parse !== undefined) {
                let data2 = data.parse;
                const _errs5 = errors;
                const _errs6 = errors;
                let valid1 = false;
                const _errs7 = errors;
                if (
                  !validate32(data2, {
                    instancePath: instancePath + '/parse',
                    parentData: data,
                    parentDataProperty: 'parse',
                    rootData,
                  })
                ) {
                  vErrors =
                    vErrors === null
                      ? validate32.errors
                      : vErrors.concat(validate32.errors);
                  errors = vErrors.length;
                }
                var _valid0 = _errs7 === errors;
                valid1 = valid1 || _valid0;
                if (!valid1) {
                  const _errs8 = errors;
                  if (
                    !validate36(data2, {
                      instancePath: instancePath + '/parse',
                      parentData: data,
                      parentDataProperty: 'parse',
                      rootData,
                    })
                  ) {
                    vErrors =
                      vErrors === null
                        ? validate36.errors
                        : vErrors.concat(validate36.errors);
                    errors = vErrors.length;
                  }
                  var _valid0 = _errs8 === errors;
                  valid1 = valid1 || _valid0;
                }
                if (!valid1) {
                  const err0 = {
                    instancePath: instancePath + '/parse',
                    schemaPath: '#/properties/parse/anyOf',
                    keyword: 'anyOf',
                    params: {},
                    message: 'must match a schema in anyOf',
                  };
                  if (vErrors === null) {
                    vErrors = [err0];
                  } else {
                    vErrors.push(err0);
                  }
                  errors++;
                  validate29.errors = vErrors;
                  return false;
                } else {
                  errors = _errs6;
                  if (vErrors !== null) {
                    if (_errs6) {
                      vErrors.length = _errs6;
                    } else {
                      vErrors = null;
                    }
                  }
                }
                var valid0 = _errs5 === errors;
              } else {
                var valid0 = true;
              }
            }
          }
        }
      }
    } else {
      validate29.errors = [
        {
          instancePath,
          schemaPath: '#/type',
          keyword: 'type',
          params: { type: 'object' },
          message: 'must be object',
        },
      ];
      return false;
    }
  }
  validate29.errors = vErrors;
  return errors === 0;
}
function validate28(
  data,
  { instancePath = '', parentData, parentDataProperty, rootData = data } = {},
) {
  let vErrors = null;
  let errors = 0;
  if (errors === 0) {
    if (data && typeof data == 'object' && !Array.isArray(data)) {
      let missing0;
      if (
        (data.category === undefined && (missing0 = 'category')) ||
        (data.symbol === undefined && (missing0 = 'symbol'))
      ) {
        validate28.errors = [
          {
            instancePath,
            schemaPath: '#/required',
            keyword: 'required',
            params: { missingProperty: missing0 },
            message: "must have required property '" + missing0 + "'",
          },
        ];
        return false;
      } else {
        const _errs1 = errors;
        for (const key0 in data) {
          if (
            !(
              key0 === 'category' ||
              key0 === 'decimals' ||
              key0 === 'nfts' ||
              key0 === 'symbol'
            )
          ) {
            validate28.errors = [
              {
                instancePath,
                schemaPath: '#/additionalProperties',
                keyword: 'additionalProperties',
                params: { additionalProperty: key0 },
                message: 'must NOT have additional properties',
              },
            ];
            return false;
            break;
          }
        }
        if (_errs1 === errors) {
          if (data.category !== undefined) {
            const _errs2 = errors;
            if (typeof data.category !== 'string') {
              validate28.errors = [
                {
                  instancePath: instancePath + '/category',
                  schemaPath: '#/properties/category/type',
                  keyword: 'type',
                  params: { type: 'string' },
                  message: 'must be string',
                },
              ];
              return false;
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.decimals !== undefined) {
              let data1 = data.decimals;
              const _errs4 = errors;
              if (!(typeof data1 == 'number' && isFinite(data1))) {
                validate28.errors = [
                  {
                    instancePath: instancePath + '/decimals',
                    schemaPath: '#/properties/decimals/type',
                    keyword: 'type',
                    params: { type: 'number' },
                    message: 'must be number',
                  },
                ];
                return false;
              }
              var valid0 = _errs4 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.nfts !== undefined) {
                const _errs6 = errors;
                if (
                  !validate29(data.nfts, {
                    instancePath: instancePath + '/nfts',
                    parentData: data,
                    parentDataProperty: 'nfts',
                    rootData,
                  })
                ) {
                  vErrors =
                    vErrors === null
                      ? validate29.errors
                      : vErrors.concat(validate29.errors);
                  errors = vErrors.length;
                }
                var valid0 = _errs6 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.symbol !== undefined) {
                  const _errs7 = errors;
                  if (typeof data.symbol !== 'string') {
                    validate28.errors = [
                      {
                        instancePath: instancePath + '/symbol',
                        schemaPath: '#/properties/symbol/type',
                        keyword: 'type',
                        params: { type: 'string' },
                        message: 'must be string',
                      },
                    ];
                    return false;
                  }
                  var valid0 = _errs7 === errors;
                } else {
                  var valid0 = true;
                }
              }
            }
          }
        }
      }
    } else {
      validate28.errors = [
        {
          instancePath,
          schemaPath: '#/type',
          keyword: 'type',
          params: { type: 'object' },
          message: 'must be object',
        },
      ];
      return false;
    }
  }
  validate28.errors = vErrors;
  return errors === 0;
}
function validate27(
  data,
  { instancePath = '', parentData, parentDataProperty, rootData = data } = {},
) {
  let vErrors = null;
  let errors = 0;
  if (errors === 0) {
    if (data && typeof data == 'object' && !Array.isArray(data)) {
      let missing0;
      if (data.name === undefined && (missing0 = 'name')) {
        validate27.errors = [
          {
            instancePath,
            schemaPath: '#/required',
            keyword: 'required',
            params: { missingProperty: missing0 },
            message: "must have required property '" + missing0 + "'",
          },
        ];
        return false;
      } else {
        const _errs1 = errors;
        for (const key0 in data) {
          if (!func4.call(schema30.properties, key0)) {
            validate27.errors = [
              {
                instancePath,
                schemaPath: '#/additionalProperties',
                keyword: 'additionalProperties',
                params: { additionalProperty: key0 },
                message: 'must NOT have additional properties',
              },
            ];
            return false;
            break;
          }
        }
        if (_errs1 === errors) {
          if (data.description !== undefined) {
            const _errs2 = errors;
            if (typeof data.description !== 'string') {
              validate27.errors = [
                {
                  instancePath: instancePath + '/description',
                  schemaPath: '#/properties/description/type',
                  keyword: 'type',
                  params: { type: 'string' },
                  message: 'must be string',
                },
              ];
              return false;
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.extensions !== undefined) {
              let data1 = data.extensions;
              const _errs4 = errors;
              const _errs5 = errors;
              if (errors === _errs5) {
                if (
                  data1 &&
                  typeof data1 == 'object' &&
                  !Array.isArray(data1)
                ) {
                  for (const key1 in data1) {
                    let data2 = data1[key1];
                    const _errs8 = errors;
                    const _errs9 = errors;
                    let valid3 = false;
                    const _errs10 = errors;
                    if (typeof data2 !== 'string') {
                      const err0 = {
                        instancePath:
                          instancePath +
                          '/extensions/' +
                          key1.replace(/~/g, '~0').replace(/\//g, '~1'),
                        schemaPath:
                          '#/definitions/Extensions/additionalProperties/anyOf/0/type',
                        keyword: 'type',
                        params: { type: 'string' },
                        message: 'must be string',
                      };
                      if (vErrors === null) {
                        vErrors = [err0];
                      } else {
                        vErrors.push(err0);
                      }
                      errors++;
                    }
                    var _valid0 = _errs10 === errors;
                    valid3 = valid3 || _valid0;
                    if (!valid3) {
                      const _errs12 = errors;
                      if (errors === _errs12) {
                        if (
                          data2 &&
                          typeof data2 == 'object' &&
                          !Array.isArray(data2)
                        ) {
                          for (const key2 in data2) {
                            const _errs15 = errors;
                            if (typeof data2[key2] !== 'string') {
                              const err1 = {
                                instancePath:
                                  instancePath +
                                  '/extensions/' +
                                  key1
                                    .replace(/~/g, '~0')
                                    .replace(/\//g, '~1') +
                                  '/' +
                                  key2.replace(/~/g, '~0').replace(/\//g, '~1'),
                                schemaPath:
                                  '#/definitions/Extensions/additionalProperties/anyOf/1/additionalProperties/type',
                                keyword: 'type',
                                params: { type: 'string' },
                                message: 'must be string',
                              };
                              if (vErrors === null) {
                                vErrors = [err1];
                              } else {
                                vErrors.push(err1);
                              }
                              errors++;
                            }
                            var valid4 = _errs15 === errors;
                            if (!valid4) {
                              break;
                            }
                          }
                        } else {
                          const err2 = {
                            instancePath:
                              instancePath +
                              '/extensions/' +
                              key1.replace(/~/g, '~0').replace(/\//g, '~1'),
                            schemaPath:
                              '#/definitions/Extensions/additionalProperties/anyOf/1/type',
                            keyword: 'type',
                            params: { type: 'object' },
                            message: 'must be object',
                          };
                          if (vErrors === null) {
                            vErrors = [err2];
                          } else {
                            vErrors.push(err2);
                          }
                          errors++;
                        }
                      }
                      var _valid0 = _errs12 === errors;
                      valid3 = valid3 || _valid0;
                      if (!valid3) {
                        const _errs17 = errors;
                        if (errors === _errs17) {
                          if (
                            data2 &&
                            typeof data2 == 'object' &&
                            !Array.isArray(data2)
                          ) {
                            for (const key3 in data2) {
                              let data4 = data2[key3];
                              const _errs20 = errors;
                              if (errors === _errs20) {
                                if (
                                  data4 &&
                                  typeof data4 == 'object' &&
                                  !Array.isArray(data4)
                                ) {
                                  for (const key4 in data4) {
                                    const _errs23 = errors;
                                    if (typeof data4[key4] !== 'string') {
                                      const err3 = {
                                        instancePath:
                                          instancePath +
                                          '/extensions/' +
                                          key1
                                            .replace(/~/g, '~0')
                                            .replace(/\//g, '~1') +
                                          '/' +
                                          key3
                                            .replace(/~/g, '~0')
                                            .replace(/\//g, '~1') +
                                          '/' +
                                          key4
                                            .replace(/~/g, '~0')
                                            .replace(/\//g, '~1'),
                                        schemaPath:
                                          '#/definitions/Extensions/additionalProperties/anyOf/2/additionalProperties/additionalProperties/type',
                                        keyword: 'type',
                                        params: { type: 'string' },
                                        message: 'must be string',
                                      };
                                      if (vErrors === null) {
                                        vErrors = [err3];
                                      } else {
                                        vErrors.push(err3);
                                      }
                                      errors++;
                                    }
                                    var valid6 = _errs23 === errors;
                                    if (!valid6) {
                                      break;
                                    }
                                  }
                                } else {
                                  const err4 = {
                                    instancePath:
                                      instancePath +
                                      '/extensions/' +
                                      key1
                                        .replace(/~/g, '~0')
                                        .replace(/\//g, '~1') +
                                      '/' +
                                      key3
                                        .replace(/~/g, '~0')
                                        .replace(/\//g, '~1'),
                                    schemaPath:
                                      '#/definitions/Extensions/additionalProperties/anyOf/2/additionalProperties/type',
                                    keyword: 'type',
                                    params: { type: 'object' },
                                    message: 'must be object',
                                  };
                                  if (vErrors === null) {
                                    vErrors = [err4];
                                  } else {
                                    vErrors.push(err4);
                                  }
                                  errors++;
                                }
                              }
                              var valid5 = _errs20 === errors;
                              if (!valid5) {
                                break;
                              }
                            }
                          } else {
                            const err5 = {
                              instancePath:
                                instancePath +
                                '/extensions/' +
                                key1.replace(/~/g, '~0').replace(/\//g, '~1'),
                              schemaPath:
                                '#/definitions/Extensions/additionalProperties/anyOf/2/type',
                              keyword: 'type',
                              params: { type: 'object' },
                              message: 'must be object',
                            };
                            if (vErrors === null) {
                              vErrors = [err5];
                            } else {
                              vErrors.push(err5);
                            }
                            errors++;
                          }
                        }
                        var _valid0 = _errs17 === errors;
                        valid3 = valid3 || _valid0;
                      }
                    }
                    if (!valid3) {
                      const err6 = {
                        instancePath:
                          instancePath +
                          '/extensions/' +
                          key1.replace(/~/g, '~0').replace(/\//g, '~1'),
                        schemaPath:
                          '#/definitions/Extensions/additionalProperties/anyOf',
                        keyword: 'anyOf',
                        params: {},
                        message: 'must match a schema in anyOf',
                      };
                      if (vErrors === null) {
                        vErrors = [err6];
                      } else {
                        vErrors.push(err6);
                      }
                      errors++;
                      validate27.errors = vErrors;
                      return false;
                    } else {
                      errors = _errs9;
                      if (vErrors !== null) {
                        if (_errs9) {
                          vErrors.length = _errs9;
                        } else {
                          vErrors = null;
                        }
                      }
                    }
                    var valid2 = _errs8 === errors;
                    if (!valid2) {
                      break;
                    }
                  }
                } else {
                  validate27.errors = [
                    {
                      instancePath: instancePath + '/extensions',
                      schemaPath: '#/definitions/Extensions/type',
                      keyword: 'type',
                      params: { type: 'object' },
                      message: 'must be object',
                    },
                  ];
                  return false;
                }
              }
              var valid0 = _errs4 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.migrated !== undefined) {
                const _errs25 = errors;
                if (typeof data.migrated !== 'string') {
                  validate27.errors = [
                    {
                      instancePath: instancePath + '/migrated',
                      schemaPath: '#/properties/migrated/type',
                      keyword: 'type',
                      params: { type: 'string' },
                      message: 'must be string',
                    },
                  ];
                  return false;
                }
                var valid0 = _errs25 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.name !== undefined) {
                  const _errs27 = errors;
                  if (typeof data.name !== 'string') {
                    validate27.errors = [
                      {
                        instancePath: instancePath + '/name',
                        schemaPath: '#/properties/name/type',
                        keyword: 'type',
                        params: { type: 'string' },
                        message: 'must be string',
                      },
                    ];
                    return false;
                  }
                  var valid0 = _errs27 === errors;
                } else {
                  var valid0 = true;
                }
                if (valid0) {
                  if (data.splitId !== undefined) {
                    const _errs29 = errors;
                    if (typeof data.splitId !== 'string') {
                      validate27.errors = [
                        {
                          instancePath: instancePath + '/splitId',
                          schemaPath: '#/properties/splitId/type',
                          keyword: 'type',
                          params: { type: 'string' },
                          message: 'must be string',
                        },
                      ];
                      return false;
                    }
                    var valid0 = _errs29 === errors;
                  } else {
                    var valid0 = true;
                  }
                  if (valid0) {
                    if (data.status !== undefined) {
                      let data9 = data.status;
                      const _errs31 = errors;
                      if (typeof data9 !== 'string') {
                        validate27.errors = [
                          {
                            instancePath: instancePath + '/status',
                            schemaPath: '#/properties/status/type',
                            keyword: 'type',
                            params: { type: 'string' },
                            message: 'must be string',
                          },
                        ];
                        return false;
                      }
                      if (
                        !(
                          data9 === 'active' ||
                          data9 === 'burned' ||
                          data9 === 'inactive'
                        )
                      ) {
                        validate27.errors = [
                          {
                            instancePath: instancePath + '/status',
                            schemaPath: '#/properties/status/enum',
                            keyword: 'enum',
                            params: {
                              allowedValues: schema30.properties.status.enum,
                            },
                            message:
                              'must be equal to one of the allowed values',
                          },
                        ];
                        return false;
                      }
                      var valid0 = _errs31 === errors;
                    } else {
                      var valid0 = true;
                    }
                    if (valid0) {
                      if (data.tags !== undefined) {
                        let data10 = data.tags;
                        const _errs33 = errors;
                        if (errors === _errs33) {
                          if (Array.isArray(data10)) {
                            var valid7 = true;
                            const len0 = data10.length;
                            for (let i0 = 0; i0 < len0; i0++) {
                              const _errs35 = errors;
                              if (typeof data10[i0] !== 'string') {
                                validate27.errors = [
                                  {
                                    instancePath: instancePath + '/tags/' + i0,
                                    schemaPath: '#/properties/tags/items/type',
                                    keyword: 'type',
                                    params: { type: 'string' },
                                    message: 'must be string',
                                  },
                                ];
                                return false;
                              }
                              var valid7 = _errs35 === errors;
                              if (!valid7) {
                                break;
                              }
                            }
                          } else {
                            validate27.errors = [
                              {
                                instancePath: instancePath + '/tags',
                                schemaPath: '#/properties/tags/type',
                                keyword: 'type',
                                params: { type: 'array' },
                                message: 'must be array',
                              },
                            ];
                            return false;
                          }
                        }
                        var valid0 = _errs33 === errors;
                      } else {
                        var valid0 = true;
                      }
                      if (valid0) {
                        if (data.token !== undefined) {
                          const _errs37 = errors;
                          if (
                            !validate28(data.token, {
                              instancePath: instancePath + '/token',
                              parentData: data,
                              parentDataProperty: 'token',
                              rootData,
                            })
                          ) {
                            vErrors =
                              vErrors === null
                                ? validate28.errors
                                : vErrors.concat(validate28.errors);
                            errors = vErrors.length;
                          }
                          var valid0 = _errs37 === errors;
                        } else {
                          var valid0 = true;
                        }
                        if (valid0) {
                          if (data.uris !== undefined) {
                            let data13 = data.uris;
                            const _errs38 = errors;
                            const _errs39 = errors;
                            if (errors === _errs39) {
                              if (
                                data13 &&
                                typeof data13 == 'object' &&
                                !Array.isArray(data13)
                              ) {
                                for (const key5 in data13) {
                                  const _errs42 = errors;
                                  if (typeof data13[key5] !== 'string') {
                                    validate27.errors = [
                                      {
                                        instancePath:
                                          instancePath +
                                          '/uris/' +
                                          key5
                                            .replace(/~/g, '~0')
                                            .replace(/\//g, '~1'),
                                        schemaPath:
                                          '#/definitions/URIs/additionalProperties/type',
                                        keyword: 'type',
                                        params: { type: 'string' },
                                        message: 'must be string',
                                      },
                                    ];
                                    return false;
                                  }
                                  var valid9 = _errs42 === errors;
                                  if (!valid9) {
                                    break;
                                  }
                                }
                              } else {
                                validate27.errors = [
                                  {
                                    instancePath: instancePath + '/uris',
                                    schemaPath: '#/definitions/URIs/type',
                                    keyword: 'type',
                                    params: { type: 'object' },
                                    message: 'must be object',
                                  },
                                ];
                                return false;
                              }
                            }
                            var valid0 = _errs38 === errors;
                          } else {
                            var valid0 = true;
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    } else {
      validate27.errors = [
        {
          instancePath,
          schemaPath: '#/type',
          keyword: 'type',
          params: { type: 'object' },
          message: 'must be object',
        },
      ];
      return false;
    }
  }
  validate27.errors = vErrors;
  return errors === 0;
}
function validate26(
  data,
  { instancePath = '', parentData, parentDataProperty, rootData = data } = {},
) {
  let vErrors = null;
  let errors = 0;
  if (errors === 0) {
    if (data && typeof data == 'object' && !Array.isArray(data)) {
      for (const key0 in data) {
        const _errs2 = errors;
        if (
          !validate27(data[key0], {
            instancePath:
              instancePath +
              '/' +
              key0.replace(/~/g, '~0').replace(/\//g, '~1'),
            parentData: data,
            parentDataProperty: key0,
            rootData,
          })
        ) {
          vErrors =
            vErrors === null
              ? validate27.errors
              : vErrors.concat(validate27.errors);
          errors = vErrors.length;
        }
        var valid0 = _errs2 === errors;
        if (!valid0) {
          break;
        }
      }
    } else {
      validate26.errors = [
        {
          instancePath,
          schemaPath: '#/type',
          keyword: 'type',
          params: { type: 'object' },
          message: 'must be object',
        },
      ];
      return false;
    }
  }
  validate26.errors = vErrors;
  return errors === 0;
}
const schema43 = {
  additionalProperties: false,
  description:
    'An identity representing a metadata registry that is not published on-chain and therefore has no authbase or trackable authchain.',
  properties: {
    description: {
      description:
        'A string describing this identity for use in user interfaces.\n\nIn user interfaces with limited space, descriptions should be hidden beyond the first newline character or `140` characters until revealed by the user.\n\nE.g.:\n- `The common stock issued by ACME, Inc.`\n- `A metadata registry maintained by Company Name, the embedded registry for Wallet Name.`\n- `Software developer and lead maintainer of Wallet Name.`',
      type: 'string',
    },
    extensions: {
      $ref: '#/definitions/Extensions',
      description:
        'A mapping of `IdentitySnapshot` extension identifiers to extension definitions.  {@link  Extensions }  may be widely standardized or application-specific.\n\nStandardized extensions for `IdentitySnapshot`s include the `authchain` extension. See https://github.com/bitjson/chip-bcmr#authchain-extension for details.',
    },
    name: {
      description:
        'The name of this identity for use in interfaces.\n\nIn user interfaces with limited space, names should be hidden beyond the first newline character or `20` characters until revealed by the user.\n\nE.g. `ACME Class A Shares`, `ACME Registry`, `Satoshi Nakamoto`, etc.',
      type: 'string',
    },
    tags: {
      description:
        "An array of `Tag` identifiers marking the `Tag`s associated with this identity. All specified tag identifiers must be defined in the registry's `tags` mapping.",
      items: { type: 'string' },
      type: 'array',
    },
    uris: {
      $ref: '#/definitions/URIs',
      description:
        'A mapping of identifiers to URIs associated with this identity. URI identifiers may be widely-standardized or registry-specific. Values must be valid URIs, including a protocol prefix (e.g. `https://` or `ipfs://`). Clients are only required to support `https` and `ipfs` URIs, but any scheme may be specified.\n\nThe following identifiers are recommended for all identities:\n- `icon`\n- `web`\n\nThe following optional identifiers are standardized:\n- `blog`\n- `chat`\n- `forum`\n- `icon-intro`\n- `image`\n- `migrate`\n- `registry`\n- `support`\n\nFor details on these standard identifiers, see: https://github.com/bitjson/chip-bcmr#uri-identifiers\n\nCustom URI identifiers allow for sharing social networking profiles, p2p connection information, and other application-specific URIs. Identifiers must be lowercase, alphanumeric strings, with no whitespace or special characters other than dashes (as a regular expression: `/^[-a-z0-9]+$/`).\n\nFor example, some common identifiers include: `discord`, `docker`, `facebook`, `git`, `github`, `gitter`, `instagram`, `linkedin`, `matrix`, `npm`, `reddit`, `slack`, `substack`, `telegram`, `twitter`, `wechat`, `youtube`.',
    },
  },
  required: ['name'],
  type: 'object',
};
function validate43(
  data,
  { instancePath = '', parentData, parentDataProperty, rootData = data } = {},
) {
  let vErrors = null;
  let errors = 0;
  if (errors === 0) {
    if (data && typeof data == 'object' && !Array.isArray(data)) {
      let missing0;
      if (data.name === undefined && (missing0 = 'name')) {
        validate43.errors = [
          {
            instancePath,
            schemaPath: '#/required',
            keyword: 'required',
            params: { missingProperty: missing0 },
            message: "must have required property '" + missing0 + "'",
          },
        ];
        return false;
      } else {
        const _errs1 = errors;
        for (const key0 in data) {
          if (
            !(
              key0 === 'description' ||
              key0 === 'extensions' ||
              key0 === 'name' ||
              key0 === 'tags' ||
              key0 === 'uris'
            )
          ) {
            validate43.errors = [
              {
                instancePath,
                schemaPath: '#/additionalProperties',
                keyword: 'additionalProperties',
                params: { additionalProperty: key0 },
                message: 'must NOT have additional properties',
              },
            ];
            return false;
            break;
          }
        }
        if (_errs1 === errors) {
          if (data.description !== undefined) {
            const _errs2 = errors;
            if (typeof data.description !== 'string') {
              validate43.errors = [
                {
                  instancePath: instancePath + '/description',
                  schemaPath: '#/properties/description/type',
                  keyword: 'type',
                  params: { type: 'string' },
                  message: 'must be string',
                },
              ];
              return false;
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.extensions !== undefined) {
              let data1 = data.extensions;
              const _errs4 = errors;
              const _errs5 = errors;
              if (errors === _errs5) {
                if (
                  data1 &&
                  typeof data1 == 'object' &&
                  !Array.isArray(data1)
                ) {
                  for (const key1 in data1) {
                    let data2 = data1[key1];
                    const _errs8 = errors;
                    const _errs9 = errors;
                    let valid3 = false;
                    const _errs10 = errors;
                    if (typeof data2 !== 'string') {
                      const err0 = {
                        instancePath:
                          instancePath +
                          '/extensions/' +
                          key1.replace(/~/g, '~0').replace(/\//g, '~1'),
                        schemaPath:
                          '#/definitions/Extensions/additionalProperties/anyOf/0/type',
                        keyword: 'type',
                        params: { type: 'string' },
                        message: 'must be string',
                      };
                      if (vErrors === null) {
                        vErrors = [err0];
                      } else {
                        vErrors.push(err0);
                      }
                      errors++;
                    }
                    var _valid0 = _errs10 === errors;
                    valid3 = valid3 || _valid0;
                    if (!valid3) {
                      const _errs12 = errors;
                      if (errors === _errs12) {
                        if (
                          data2 &&
                          typeof data2 == 'object' &&
                          !Array.isArray(data2)
                        ) {
                          for (const key2 in data2) {
                            const _errs15 = errors;
                            if (typeof data2[key2] !== 'string') {
                              const err1 = {
                                instancePath:
                                  instancePath +
                                  '/extensions/' +
                                  key1
                                    .replace(/~/g, '~0')
                                    .replace(/\//g, '~1') +
                                  '/' +
                                  key2.replace(/~/g, '~0').replace(/\//g, '~1'),
                                schemaPath:
                                  '#/definitions/Extensions/additionalProperties/anyOf/1/additionalProperties/type',
                                keyword: 'type',
                                params: { type: 'string' },
                                message: 'must be string',
                              };
                              if (vErrors === null) {
                                vErrors = [err1];
                              } else {
                                vErrors.push(err1);
                              }
                              errors++;
                            }
                            var valid4 = _errs15 === errors;
                            if (!valid4) {
                              break;
                            }
                          }
                        } else {
                          const err2 = {
                            instancePath:
                              instancePath +
                              '/extensions/' +
                              key1.replace(/~/g, '~0').replace(/\//g, '~1'),
                            schemaPath:
                              '#/definitions/Extensions/additionalProperties/anyOf/1/type',
                            keyword: 'type',
                            params: { type: 'object' },
                            message: 'must be object',
                          };
                          if (vErrors === null) {
                            vErrors = [err2];
                          } else {
                            vErrors.push(err2);
                          }
                          errors++;
                        }
                      }
                      var _valid0 = _errs12 === errors;
                      valid3 = valid3 || _valid0;
                      if (!valid3) {
                        const _errs17 = errors;
                        if (errors === _errs17) {
                          if (
                            data2 &&
                            typeof data2 == 'object' &&
                            !Array.isArray(data2)
                          ) {
                            for (const key3 in data2) {
                              let data4 = data2[key3];
                              const _errs20 = errors;
                              if (errors === _errs20) {
                                if (
                                  data4 &&
                                  typeof data4 == 'object' &&
                                  !Array.isArray(data4)
                                ) {
                                  for (const key4 in data4) {
                                    const _errs23 = errors;
                                    if (typeof data4[key4] !== 'string') {
                                      const err3 = {
                                        instancePath:
                                          instancePath +
                                          '/extensions/' +
                                          key1
                                            .replace(/~/g, '~0')
                                            .replace(/\//g, '~1') +
                                          '/' +
                                          key3
                                            .replace(/~/g, '~0')
                                            .replace(/\//g, '~1') +
                                          '/' +
                                          key4
                                            .replace(/~/g, '~0')
                                            .replace(/\//g, '~1'),
                                        schemaPath:
                                          '#/definitions/Extensions/additionalProperties/anyOf/2/additionalProperties/additionalProperties/type',
                                        keyword: 'type',
                                        params: { type: 'string' },
                                        message: 'must be string',
                                      };
                                      if (vErrors === null) {
                                        vErrors = [err3];
                                      } else {
                                        vErrors.push(err3);
                                      }
                                      errors++;
                                    }
                                    var valid6 = _errs23 === errors;
                                    if (!valid6) {
                                      break;
                                    }
                                  }
                                } else {
                                  const err4 = {
                                    instancePath:
                                      instancePath +
                                      '/extensions/' +
                                      key1
                                        .replace(/~/g, '~0')
                                        .replace(/\//g, '~1') +
                                      '/' +
                                      key3
                                        .replace(/~/g, '~0')
                                        .replace(/\//g, '~1'),
                                    schemaPath:
                                      '#/definitions/Extensions/additionalProperties/anyOf/2/additionalProperties/type',
                                    keyword: 'type',
                                    params: { type: 'object' },
                                    message: 'must be object',
                                  };
                                  if (vErrors === null) {
                                    vErrors = [err4];
                                  } else {
                                    vErrors.push(err4);
                                  }
                                  errors++;
                                }
                              }
                              var valid5 = _errs20 === errors;
                              if (!valid5) {
                                break;
                              }
                            }
                          } else {
                            const err5 = {
                              instancePath:
                                instancePath +
                                '/extensions/' +
                                key1.replace(/~/g, '~0').replace(/\//g, '~1'),
                              schemaPath:
                                '#/definitions/Extensions/additionalProperties/anyOf/2/type',
                              keyword: 'type',
                              params: { type: 'object' },
                              message: 'must be object',
                            };
                            if (vErrors === null) {
                              vErrors = [err5];
                            } else {
                              vErrors.push(err5);
                            }
                            errors++;
                          }
                        }
                        var _valid0 = _errs17 === errors;
                        valid3 = valid3 || _valid0;
                      }
                    }
                    if (!valid3) {
                      const err6 = {
                        instancePath:
                          instancePath +
                          '/extensions/' +
                          key1.replace(/~/g, '~0').replace(/\//g, '~1'),
                        schemaPath:
                          '#/definitions/Extensions/additionalProperties/anyOf',
                        keyword: 'anyOf',
                        params: {},
                        message: 'must match a schema in anyOf',
                      };
                      if (vErrors === null) {
                        vErrors = [err6];
                      } else {
                        vErrors.push(err6);
                      }
                      errors++;
                      validate43.errors = vErrors;
                      return false;
                    } else {
                      errors = _errs9;
                      if (vErrors !== null) {
                        if (_errs9) {
                          vErrors.length = _errs9;
                        } else {
                          vErrors = null;
                        }
                      }
                    }
                    var valid2 = _errs8 === errors;
                    if (!valid2) {
                      break;
                    }
                  }
                } else {
                  validate43.errors = [
                    {
                      instancePath: instancePath + '/extensions',
                      schemaPath: '#/definitions/Extensions/type',
                      keyword: 'type',
                      params: { type: 'object' },
                      message: 'must be object',
                    },
                  ];
                  return false;
                }
              }
              var valid0 = _errs4 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.name !== undefined) {
                const _errs25 = errors;
                if (typeof data.name !== 'string') {
                  validate43.errors = [
                    {
                      instancePath: instancePath + '/name',
                      schemaPath: '#/properties/name/type',
                      keyword: 'type',
                      params: { type: 'string' },
                      message: 'must be string',
                    },
                  ];
                  return false;
                }
                var valid0 = _errs25 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.tags !== undefined) {
                  let data7 = data.tags;
                  const _errs27 = errors;
                  if (errors === _errs27) {
                    if (Array.isArray(data7)) {
                      var valid7 = true;
                      const len0 = data7.length;
                      for (let i0 = 0; i0 < len0; i0++) {
                        const _errs29 = errors;
                        if (typeof data7[i0] !== 'string') {
                          validate43.errors = [
                            {
                              instancePath: instancePath + '/tags/' + i0,
                              schemaPath: '#/properties/tags/items/type',
                              keyword: 'type',
                              params: { type: 'string' },
                              message: 'must be string',
                            },
                          ];
                          return false;
                        }
                        var valid7 = _errs29 === errors;
                        if (!valid7) {
                          break;
                        }
                      }
                    } else {
                      validate43.errors = [
                        {
                          instancePath: instancePath + '/tags',
                          schemaPath: '#/properties/tags/type',
                          keyword: 'type',
                          params: { type: 'array' },
                          message: 'must be array',
                        },
                      ];
                      return false;
                    }
                  }
                  var valid0 = _errs27 === errors;
                } else {
                  var valid0 = true;
                }
                if (valid0) {
                  if (data.uris !== undefined) {
                    let data9 = data.uris;
                    const _errs31 = errors;
                    const _errs32 = errors;
                    if (errors === _errs32) {
                      if (
                        data9 &&
                        typeof data9 == 'object' &&
                        !Array.isArray(data9)
                      ) {
                        for (const key5 in data9) {
                          const _errs35 = errors;
                          if (typeof data9[key5] !== 'string') {
                            validate43.errors = [
                              {
                                instancePath:
                                  instancePath +
                                  '/uris/' +
                                  key5.replace(/~/g, '~0').replace(/\//g, '~1'),
                                schemaPath:
                                  '#/definitions/URIs/additionalProperties/type',
                                keyword: 'type',
                                params: { type: 'string' },
                                message: 'must be string',
                              },
                            ];
                            return false;
                          }
                          var valid9 = _errs35 === errors;
                          if (!valid9) {
                            break;
                          }
                        }
                      } else {
                        validate43.errors = [
                          {
                            instancePath: instancePath + '/uris',
                            schemaPath: '#/definitions/URIs/type',
                            keyword: 'type',
                            params: { type: 'object' },
                            message: 'must be object',
                          },
                        ];
                        return false;
                      }
                    }
                    var valid0 = _errs31 === errors;
                  } else {
                    var valid0 = true;
                  }
                }
              }
            }
          }
        }
      }
    } else {
      validate43.errors = [
        {
          instancePath,
          schemaPath: '#/type',
          keyword: 'type',
          params: { type: 'object' },
          message: 'must be object',
        },
      ];
      return false;
    }
  }
  validate43.errors = vErrors;
  return errors === 0;
}
const schema46 = {
  additionalProperties: false,
  description:
    'Tags allow registries to classify and group identities by a variety of characteristics. Tags are standardized within a registry and may represent either labels applied by that registry or designations by external authorities (certification, membership, ownership, etc.) that are tracked by that registry.\n\nExamples of possible tags include: `individual`, `organization`, `token`, `wallet`, `exchange`, `staking`, `utility-token`, `security-token`, `stablecoin`, `wrapped`, `collectable`, `deflationary`, `governance`, `decentralized-exchange`, `liquidity-provider`, `sidechain`, `sidechain-bridge`, `acme-audited`, `acme-endorsed`, etc.\n\nTags may be used by clients in search, discovery, and filtering of identities, and they can also convey information like accreditation from investor protection organizations, public certifications by security or financial auditors, and other designations that signal integrity and value to users.',
  properties: {
    description: {
      description:
        'A string describing this tag for use in user interfaces.\n\nIn user interfaces with limited space, descriptions should be hidden beyond the first newline character or `140` characters until revealed by the user.\n\nE.g.:\n- `An identity maintained by a single individual.`\n- `An identity representing a type of token.`\n- `An on-chain application that has passed security audits by ACME, Inc.`',
      type: 'string',
    },
    extensions: {
      $ref: '#/definitions/Extensions',
      description:
        'A mapping of `Tag` extension identifiers to extension definitions.  {@link  Extensions }  may be widely standardized or application-specific.',
    },
    name: {
      description:
        'The name of this tag for use in interfaces.\n\nIn user interfaces with limited space, names should be hidden beyond the first newline character or `20` characters until revealed by the user.\n\nE.g.:\n- `Individual`\n- `Token`\n- `Audited by ACME, Inc.`',
      type: 'string',
    },
    uris: {
      $ref: '#/definitions/URIs',
      description:
        'A mapping of identifiers to URIs associated with this tag. URI identifiers may be widely-standardized or registry-specific. Values must be valid URIs, including a protocol prefix (e.g. `https://` or `ipfs://`). Clients are only required to support `https` and `ipfs` URIs, but any scheme may be specified.\n\nThe following identifiers are recommended for all tags:\n- `icon`\n- `web`\n\nThe following optional identifiers are standardized:\n- `blog`\n- `chat`\n- `forum`\n- `icon-intro`\n- `registry`\n- `support`\n\nFor details on these standard identifiers, see: https://github.com/bitjson/chip-bcmr#uri-identifiers\n\nCustom URI identifiers allow for sharing social networking profiles, p2p connection information, and other application-specific URIs. Identifiers must be lowercase, alphanumeric strings, with no whitespace or special characters other than dashes (as a regular expression: `/^[-a-z0-9]+$/`).\n\nFor example, some common identifiers include: `discord`, `docker`, `facebook`, `git`, `github`, `gitter`, `instagram`, `linkedin`, `matrix`, `npm`, `reddit`, `slack`, `substack`, `telegram`, `twitter`, `wechat`, `youtube`.',
    },
  },
  required: ['name'],
  type: 'object',
};
function validate45(
  data,
  { instancePath = '', parentData, parentDataProperty, rootData = data } = {},
) {
  let vErrors = null;
  let errors = 0;
  if (errors === 0) {
    if (data && typeof data == 'object' && !Array.isArray(data)) {
      let missing0;
      if (data.name === undefined && (missing0 = 'name')) {
        validate45.errors = [
          {
            instancePath,
            schemaPath: '#/required',
            keyword: 'required',
            params: { missingProperty: missing0 },
            message: "must have required property '" + missing0 + "'",
          },
        ];
        return false;
      } else {
        const _errs1 = errors;
        for (const key0 in data) {
          if (
            !(
              key0 === 'description' ||
              key0 === 'extensions' ||
              key0 === 'name' ||
              key0 === 'uris'
            )
          ) {
            validate45.errors = [
              {
                instancePath,
                schemaPath: '#/additionalProperties',
                keyword: 'additionalProperties',
                params: { additionalProperty: key0 },
                message: 'must NOT have additional properties',
              },
            ];
            return false;
            break;
          }
        }
        if (_errs1 === errors) {
          if (data.description !== undefined) {
            const _errs2 = errors;
            if (typeof data.description !== 'string') {
              validate45.errors = [
                {
                  instancePath: instancePath + '/description',
                  schemaPath: '#/properties/description/type',
                  keyword: 'type',
                  params: { type: 'string' },
                  message: 'must be string',
                },
              ];
              return false;
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.extensions !== undefined) {
              let data1 = data.extensions;
              const _errs4 = errors;
              const _errs5 = errors;
              if (errors === _errs5) {
                if (
                  data1 &&
                  typeof data1 == 'object' &&
                  !Array.isArray(data1)
                ) {
                  for (const key1 in data1) {
                    let data2 = data1[key1];
                    const _errs8 = errors;
                    const _errs9 = errors;
                    let valid3 = false;
                    const _errs10 = errors;
                    if (typeof data2 !== 'string') {
                      const err0 = {
                        instancePath:
                          instancePath +
                          '/extensions/' +
                          key1.replace(/~/g, '~0').replace(/\//g, '~1'),
                        schemaPath:
                          '#/definitions/Extensions/additionalProperties/anyOf/0/type',
                        keyword: 'type',
                        params: { type: 'string' },
                        message: 'must be string',
                      };
                      if (vErrors === null) {
                        vErrors = [err0];
                      } else {
                        vErrors.push(err0);
                      }
                      errors++;
                    }
                    var _valid0 = _errs10 === errors;
                    valid3 = valid3 || _valid0;
                    if (!valid3) {
                      const _errs12 = errors;
                      if (errors === _errs12) {
                        if (
                          data2 &&
                          typeof data2 == 'object' &&
                          !Array.isArray(data2)
                        ) {
                          for (const key2 in data2) {
                            const _errs15 = errors;
                            if (typeof data2[key2] !== 'string') {
                              const err1 = {
                                instancePath:
                                  instancePath +
                                  '/extensions/' +
                                  key1
                                    .replace(/~/g, '~0')
                                    .replace(/\//g, '~1') +
                                  '/' +
                                  key2.replace(/~/g, '~0').replace(/\//g, '~1'),
                                schemaPath:
                                  '#/definitions/Extensions/additionalProperties/anyOf/1/additionalProperties/type',
                                keyword: 'type',
                                params: { type: 'string' },
                                message: 'must be string',
                              };
                              if (vErrors === null) {
                                vErrors = [err1];
                              } else {
                                vErrors.push(err1);
                              }
                              errors++;
                            }
                            var valid4 = _errs15 === errors;
                            if (!valid4) {
                              break;
                            }
                          }
                        } else {
                          const err2 = {
                            instancePath:
                              instancePath +
                              '/extensions/' +
                              key1.replace(/~/g, '~0').replace(/\//g, '~1'),
                            schemaPath:
                              '#/definitions/Extensions/additionalProperties/anyOf/1/type',
                            keyword: 'type',
                            params: { type: 'object' },
                            message: 'must be object',
                          };
                          if (vErrors === null) {
                            vErrors = [err2];
                          } else {
                            vErrors.push(err2);
                          }
                          errors++;
                        }
                      }
                      var _valid0 = _errs12 === errors;
                      valid3 = valid3 || _valid0;
                      if (!valid3) {
                        const _errs17 = errors;
                        if (errors === _errs17) {
                          if (
                            data2 &&
                            typeof data2 == 'object' &&
                            !Array.isArray(data2)
                          ) {
                            for (const key3 in data2) {
                              let data4 = data2[key3];
                              const _errs20 = errors;
                              if (errors === _errs20) {
                                if (
                                  data4 &&
                                  typeof data4 == 'object' &&
                                  !Array.isArray(data4)
                                ) {
                                  for (const key4 in data4) {
                                    const _errs23 = errors;
                                    if (typeof data4[key4] !== 'string') {
                                      const err3 = {
                                        instancePath:
                                          instancePath +
                                          '/extensions/' +
                                          key1
                                            .replace(/~/g, '~0')
                                            .replace(/\//g, '~1') +
                                          '/' +
                                          key3
                                            .replace(/~/g, '~0')
                                            .replace(/\//g, '~1') +
                                          '/' +
                                          key4
                                            .replace(/~/g, '~0')
                                            .replace(/\//g, '~1'),
                                        schemaPath:
                                          '#/definitions/Extensions/additionalProperties/anyOf/2/additionalProperties/additionalProperties/type',
                                        keyword: 'type',
                                        params: { type: 'string' },
                                        message: 'must be string',
                                      };
                                      if (vErrors === null) {
                                        vErrors = [err3];
                                      } else {
                                        vErrors.push(err3);
                                      }
                                      errors++;
                                    }
                                    var valid6 = _errs23 === errors;
                                    if (!valid6) {
                                      break;
                                    }
                                  }
                                } else {
                                  const err4 = {
                                    instancePath:
                                      instancePath +
                                      '/extensions/' +
                                      key1
                                        .replace(/~/g, '~0')
                                        .replace(/\//g, '~1') +
                                      '/' +
                                      key3
                                        .replace(/~/g, '~0')
                                        .replace(/\//g, '~1'),
                                    schemaPath:
                                      '#/definitions/Extensions/additionalProperties/anyOf/2/additionalProperties/type',
                                    keyword: 'type',
                                    params: { type: 'object' },
                                    message: 'must be object',
                                  };
                                  if (vErrors === null) {
                                    vErrors = [err4];
                                  } else {
                                    vErrors.push(err4);
                                  }
                                  errors++;
                                }
                              }
                              var valid5 = _errs20 === errors;
                              if (!valid5) {
                                break;
                              }
                            }
                          } else {
                            const err5 = {
                              instancePath:
                                instancePath +
                                '/extensions/' +
                                key1.replace(/~/g, '~0').replace(/\//g, '~1'),
                              schemaPath:
                                '#/definitions/Extensions/additionalProperties/anyOf/2/type',
                              keyword: 'type',
                              params: { type: 'object' },
                              message: 'must be object',
                            };
                            if (vErrors === null) {
                              vErrors = [err5];
                            } else {
                              vErrors.push(err5);
                            }
                            errors++;
                          }
                        }
                        var _valid0 = _errs17 === errors;
                        valid3 = valid3 || _valid0;
                      }
                    }
                    if (!valid3) {
                      const err6 = {
                        instancePath:
                          instancePath +
                          '/extensions/' +
                          key1.replace(/~/g, '~0').replace(/\//g, '~1'),
                        schemaPath:
                          '#/definitions/Extensions/additionalProperties/anyOf',
                        keyword: 'anyOf',
                        params: {},
                        message: 'must match a schema in anyOf',
                      };
                      if (vErrors === null) {
                        vErrors = [err6];
                      } else {
                        vErrors.push(err6);
                      }
                      errors++;
                      validate45.errors = vErrors;
                      return false;
                    } else {
                      errors = _errs9;
                      if (vErrors !== null) {
                        if (_errs9) {
                          vErrors.length = _errs9;
                        } else {
                          vErrors = null;
                        }
                      }
                    }
                    var valid2 = _errs8 === errors;
                    if (!valid2) {
                      break;
                    }
                  }
                } else {
                  validate45.errors = [
                    {
                      instancePath: instancePath + '/extensions',
                      schemaPath: '#/definitions/Extensions/type',
                      keyword: 'type',
                      params: { type: 'object' },
                      message: 'must be object',
                    },
                  ];
                  return false;
                }
              }
              var valid0 = _errs4 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.name !== undefined) {
                const _errs25 = errors;
                if (typeof data.name !== 'string') {
                  validate45.errors = [
                    {
                      instancePath: instancePath + '/name',
                      schemaPath: '#/properties/name/type',
                      keyword: 'type',
                      params: { type: 'string' },
                      message: 'must be string',
                    },
                  ];
                  return false;
                }
                var valid0 = _errs25 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.uris !== undefined) {
                  let data7 = data.uris;
                  const _errs27 = errors;
                  const _errs28 = errors;
                  if (errors === _errs28) {
                    if (
                      data7 &&
                      typeof data7 == 'object' &&
                      !Array.isArray(data7)
                    ) {
                      for (const key5 in data7) {
                        const _errs31 = errors;
                        if (typeof data7[key5] !== 'string') {
                          validate45.errors = [
                            {
                              instancePath:
                                instancePath +
                                '/uris/' +
                                key5.replace(/~/g, '~0').replace(/\//g, '~1'),
                              schemaPath:
                                '#/definitions/URIs/additionalProperties/type',
                              keyword: 'type',
                              params: { type: 'string' },
                              message: 'must be string',
                            },
                          ];
                          return false;
                        }
                        var valid8 = _errs31 === errors;
                        if (!valid8) {
                          break;
                        }
                      }
                    } else {
                      validate45.errors = [
                        {
                          instancePath: instancePath + '/uris',
                          schemaPath: '#/definitions/URIs/type',
                          keyword: 'type',
                          params: { type: 'object' },
                          message: 'must be object',
                        },
                      ];
                      return false;
                    }
                  }
                  var valid0 = _errs27 === errors;
                } else {
                  var valid0 = true;
                }
              }
            }
          }
        }
      }
    } else {
      validate45.errors = [
        {
          instancePath,
          schemaPath: '#/type',
          keyword: 'type',
          params: { type: 'object' },
          message: 'must be object',
        },
      ];
      return false;
    }
  }
  validate45.errors = vErrors;
  return errors === 0;
}
function validate21(
  data,
  { instancePath = '', parentData, parentDataProperty, rootData = data } = {},
) {
  let vErrors = null;
  let errors = 0;
  if (errors === 0) {
    if (data && typeof data == 'object' && !Array.isArray(data)) {
      let missing0;
      if (
        (data.version === undefined && (missing0 = 'version')) ||
        (data.latestRevision === undefined && (missing0 = 'latestRevision')) ||
        (data.registryIdentity === undefined && (missing0 = 'registryIdentity'))
      ) {
        validate21.errors = [
          {
            instancePath,
            schemaPath: '#/required',
            keyword: 'required',
            params: { missingProperty: missing0 },
            message: "must have required property '" + missing0 + "'",
          },
        ];
        return false;
      } else {
        const _errs1 = errors;
        for (const key0 in data) {
          if (!func4.call(schema23.properties, key0)) {
            validate21.errors = [
              {
                instancePath,
                schemaPath: '#/additionalProperties',
                keyword: 'additionalProperties',
                params: { additionalProperty: key0 },
                message: 'must NOT have additional properties',
              },
            ];
            return false;
            break;
          }
        }
        if (_errs1 === errors) {
          if (data.$schema !== undefined) {
            const _errs2 = errors;
            if (typeof data.$schema !== 'string') {
              validate21.errors = [
                {
                  instancePath: instancePath + '/$schema',
                  schemaPath: '#/properties/%24schema/type',
                  keyword: 'type',
                  params: { type: 'string' },
                  message: 'must be string',
                },
              ];
              return false;
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.chains !== undefined) {
              let data1 = data.chains;
              const _errs4 = errors;
              if (errors === _errs4) {
                if (
                  data1 &&
                  typeof data1 == 'object' &&
                  !Array.isArray(data1)
                ) {
                  for (const key1 in data1) {
                    const _errs7 = errors;
                    if (
                      !validate22(data1[key1], {
                        instancePath:
                          instancePath +
                          '/chains/' +
                          key1.replace(/~/g, '~0').replace(/\//g, '~1'),
                        parentData: data1,
                        parentDataProperty: key1,
                        rootData,
                      })
                    ) {
                      vErrors =
                        vErrors === null
                          ? validate22.errors
                          : vErrors.concat(validate22.errors);
                      errors = vErrors.length;
                    }
                    var valid1 = _errs7 === errors;
                    if (!valid1) {
                      break;
                    }
                  }
                } else {
                  validate21.errors = [
                    {
                      instancePath: instancePath + '/chains',
                      schemaPath: '#/properties/chains/type',
                      keyword: 'type',
                      params: { type: 'object' },
                      message: 'must be object',
                    },
                  ];
                  return false;
                }
              }
              var valid0 = _errs4 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.defaultChain !== undefined) {
                const _errs8 = errors;
                if (typeof data.defaultChain !== 'string') {
                  validate21.errors = [
                    {
                      instancePath: instancePath + '/defaultChain',
                      schemaPath: '#/properties/defaultChain/type',
                      keyword: 'type',
                      params: { type: 'string' },
                      message: 'must be string',
                    },
                  ];
                  return false;
                }
                var valid0 = _errs8 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.extensions !== undefined) {
                  let data4 = data.extensions;
                  const _errs10 = errors;
                  const _errs11 = errors;
                  if (errors === _errs11) {
                    if (
                      data4 &&
                      typeof data4 == 'object' &&
                      !Array.isArray(data4)
                    ) {
                      for (const key2 in data4) {
                        let data5 = data4[key2];
                        const _errs14 = errors;
                        const _errs15 = errors;
                        let valid4 = false;
                        const _errs16 = errors;
                        if (typeof data5 !== 'string') {
                          const err0 = {
                            instancePath:
                              instancePath +
                              '/extensions/' +
                              key2.replace(/~/g, '~0').replace(/\//g, '~1'),
                            schemaPath:
                              '#/definitions/Extensions/additionalProperties/anyOf/0/type',
                            keyword: 'type',
                            params: { type: 'string' },
                            message: 'must be string',
                          };
                          if (vErrors === null) {
                            vErrors = [err0];
                          } else {
                            vErrors.push(err0);
                          }
                          errors++;
                        }
                        var _valid0 = _errs16 === errors;
                        valid4 = valid4 || _valid0;
                        if (!valid4) {
                          const _errs18 = errors;
                          if (errors === _errs18) {
                            if (
                              data5 &&
                              typeof data5 == 'object' &&
                              !Array.isArray(data5)
                            ) {
                              for (const key3 in data5) {
                                const _errs21 = errors;
                                if (typeof data5[key3] !== 'string') {
                                  const err1 = {
                                    instancePath:
                                      instancePath +
                                      '/extensions/' +
                                      key2
                                        .replace(/~/g, '~0')
                                        .replace(/\//g, '~1') +
                                      '/' +
                                      key3
                                        .replace(/~/g, '~0')
                                        .replace(/\//g, '~1'),
                                    schemaPath:
                                      '#/definitions/Extensions/additionalProperties/anyOf/1/additionalProperties/type',
                                    keyword: 'type',
                                    params: { type: 'string' },
                                    message: 'must be string',
                                  };
                                  if (vErrors === null) {
                                    vErrors = [err1];
                                  } else {
                                    vErrors.push(err1);
                                  }
                                  errors++;
                                }
                                var valid5 = _errs21 === errors;
                                if (!valid5) {
                                  break;
                                }
                              }
                            } else {
                              const err2 = {
                                instancePath:
                                  instancePath +
                                  '/extensions/' +
                                  key2.replace(/~/g, '~0').replace(/\//g, '~1'),
                                schemaPath:
                                  '#/definitions/Extensions/additionalProperties/anyOf/1/type',
                                keyword: 'type',
                                params: { type: 'object' },
                                message: 'must be object',
                              };
                              if (vErrors === null) {
                                vErrors = [err2];
                              } else {
                                vErrors.push(err2);
                              }
                              errors++;
                            }
                          }
                          var _valid0 = _errs18 === errors;
                          valid4 = valid4 || _valid0;
                          if (!valid4) {
                            const _errs23 = errors;
                            if (errors === _errs23) {
                              if (
                                data5 &&
                                typeof data5 == 'object' &&
                                !Array.isArray(data5)
                              ) {
                                for (const key4 in data5) {
                                  let data7 = data5[key4];
                                  const _errs26 = errors;
                                  if (errors === _errs26) {
                                    if (
                                      data7 &&
                                      typeof data7 == 'object' &&
                                      !Array.isArray(data7)
                                    ) {
                                      for (const key5 in data7) {
                                        const _errs29 = errors;
                                        if (typeof data7[key5] !== 'string') {
                                          const err3 = {
                                            instancePath:
                                              instancePath +
                                              '/extensions/' +
                                              key2
                                                .replace(/~/g, '~0')
                                                .replace(/\//g, '~1') +
                                              '/' +
                                              key4
                                                .replace(/~/g, '~0')
                                                .replace(/\//g, '~1') +
                                              '/' +
                                              key5
                                                .replace(/~/g, '~0')
                                                .replace(/\//g, '~1'),
                                            schemaPath:
                                              '#/definitions/Extensions/additionalProperties/anyOf/2/additionalProperties/additionalProperties/type',
                                            keyword: 'type',
                                            params: { type: 'string' },
                                            message: 'must be string',
                                          };
                                          if (vErrors === null) {
                                            vErrors = [err3];
                                          } else {
                                            vErrors.push(err3);
                                          }
                                          errors++;
                                        }
                                        var valid7 = _errs29 === errors;
                                        if (!valid7) {
                                          break;
                                        }
                                      }
                                    } else {
                                      const err4 = {
                                        instancePath:
                                          instancePath +
                                          '/extensions/' +
                                          key2
                                            .replace(/~/g, '~0')
                                            .replace(/\//g, '~1') +
                                          '/' +
                                          key4
                                            .replace(/~/g, '~0')
                                            .replace(/\//g, '~1'),
                                        schemaPath:
                                          '#/definitions/Extensions/additionalProperties/anyOf/2/additionalProperties/type',
                                        keyword: 'type',
                                        params: { type: 'object' },
                                        message: 'must be object',
                                      };
                                      if (vErrors === null) {
                                        vErrors = [err4];
                                      } else {
                                        vErrors.push(err4);
                                      }
                                      errors++;
                                    }
                                  }
                                  var valid6 = _errs26 === errors;
                                  if (!valid6) {
                                    break;
                                  }
                                }
                              } else {
                                const err5 = {
                                  instancePath:
                                    instancePath +
                                    '/extensions/' +
                                    key2
                                      .replace(/~/g, '~0')
                                      .replace(/\//g, '~1'),
                                  schemaPath:
                                    '#/definitions/Extensions/additionalProperties/anyOf/2/type',
                                  keyword: 'type',
                                  params: { type: 'object' },
                                  message: 'must be object',
                                };
                                if (vErrors === null) {
                                  vErrors = [err5];
                                } else {
                                  vErrors.push(err5);
                                }
                                errors++;
                              }
                            }
                            var _valid0 = _errs23 === errors;
                            valid4 = valid4 || _valid0;
                          }
                        }
                        if (!valid4) {
                          const err6 = {
                            instancePath:
                              instancePath +
                              '/extensions/' +
                              key2.replace(/~/g, '~0').replace(/\//g, '~1'),
                            schemaPath:
                              '#/definitions/Extensions/additionalProperties/anyOf',
                            keyword: 'anyOf',
                            params: {},
                            message: 'must match a schema in anyOf',
                          };
                          if (vErrors === null) {
                            vErrors = [err6];
                          } else {
                            vErrors.push(err6);
                          }
                          errors++;
                          validate21.errors = vErrors;
                          return false;
                        } else {
                          errors = _errs15;
                          if (vErrors !== null) {
                            if (_errs15) {
                              vErrors.length = _errs15;
                            } else {
                              vErrors = null;
                            }
                          }
                        }
                        var valid3 = _errs14 === errors;
                        if (!valid3) {
                          break;
                        }
                      }
                    } else {
                      validate21.errors = [
                        {
                          instancePath: instancePath + '/extensions',
                          schemaPath: '#/definitions/Extensions/type',
                          keyword: 'type',
                          params: { type: 'object' },
                          message: 'must be object',
                        },
                      ];
                      return false;
                    }
                  }
                  var valid0 = _errs10 === errors;
                } else {
                  var valid0 = true;
                }
                if (valid0) {
                  if (data.identities !== undefined) {
                    let data9 = data.identities;
                    const _errs31 = errors;
                    if (errors === _errs31) {
                      if (
                        data9 &&
                        typeof data9 == 'object' &&
                        !Array.isArray(data9)
                      ) {
                        for (const key6 in data9) {
                          const _errs34 = errors;
                          if (
                            !validate26(data9[key6], {
                              instancePath:
                                instancePath +
                                '/identities/' +
                                key6.replace(/~/g, '~0').replace(/\//g, '~1'),
                              parentData: data9,
                              parentDataProperty: key6,
                              rootData,
                            })
                          ) {
                            vErrors =
                              vErrors === null
                                ? validate26.errors
                                : vErrors.concat(validate26.errors);
                            errors = vErrors.length;
                          }
                          var valid8 = _errs34 === errors;
                          if (!valid8) {
                            break;
                          }
                        }
                      } else {
                        validate21.errors = [
                          {
                            instancePath: instancePath + '/identities',
                            schemaPath: '#/properties/identities/type',
                            keyword: 'type',
                            params: { type: 'object' },
                            message: 'must be object',
                          },
                        ];
                        return false;
                      }
                    }
                    var valid0 = _errs31 === errors;
                  } else {
                    var valid0 = true;
                  }
                  if (valid0) {
                    if (data.latestRevision !== undefined) {
                      const _errs35 = errors;
                      if (typeof data.latestRevision !== 'string') {
                        validate21.errors = [
                          {
                            instancePath: instancePath + '/latestRevision',
                            schemaPath: '#/properties/latestRevision/type',
                            keyword: 'type',
                            params: { type: 'string' },
                            message: 'must be string',
                          },
                        ];
                        return false;
                      }
                      var valid0 = _errs35 === errors;
                    } else {
                      var valid0 = true;
                    }
                    if (valid0) {
                      if (data.license !== undefined) {
                        const _errs37 = errors;
                        if (typeof data.license !== 'string') {
                          validate21.errors = [
                            {
                              instancePath: instancePath + '/license',
                              schemaPath: '#/properties/license/type',
                              keyword: 'type',
                              params: { type: 'string' },
                              message: 'must be string',
                            },
                          ];
                          return false;
                        }
                        var valid0 = _errs37 === errors;
                      } else {
                        var valid0 = true;
                      }
                      if (valid0) {
                        if (data.registryIdentity !== undefined) {
                          let data13 = data.registryIdentity;
                          const _errs39 = errors;
                          const _errs40 = errors;
                          let valid9 = false;
                          const _errs41 = errors;
                          if (
                            !validate43(data13, {
                              instancePath: instancePath + '/registryIdentity',
                              parentData: data,
                              parentDataProperty: 'registryIdentity',
                              rootData,
                            })
                          ) {
                            vErrors =
                              vErrors === null
                                ? validate43.errors
                                : vErrors.concat(validate43.errors);
                            errors = vErrors.length;
                          }
                          var _valid1 = _errs41 === errors;
                          valid9 = valid9 || _valid1;
                          if (!valid9) {
                            const _errs42 = errors;
                            if (typeof data13 !== 'string') {
                              const err7 = {
                                instancePath:
                                  instancePath + '/registryIdentity',
                                schemaPath:
                                  '#/properties/registryIdentity/anyOf/1/type',
                                keyword: 'type',
                                params: { type: 'string' },
                                message: 'must be string',
                              };
                              if (vErrors === null) {
                                vErrors = [err7];
                              } else {
                                vErrors.push(err7);
                              }
                              errors++;
                            }
                            var _valid1 = _errs42 === errors;
                            valid9 = valid9 || _valid1;
                          }
                          if (!valid9) {
                            const err8 = {
                              instancePath: instancePath + '/registryIdentity',
                              schemaPath: '#/properties/registryIdentity/anyOf',
                              keyword: 'anyOf',
                              params: {},
                              message: 'must match a schema in anyOf',
                            };
                            if (vErrors === null) {
                              vErrors = [err8];
                            } else {
                              vErrors.push(err8);
                            }
                            errors++;
                            validate21.errors = vErrors;
                            return false;
                          } else {
                            errors = _errs40;
                            if (vErrors !== null) {
                              if (_errs40) {
                                vErrors.length = _errs40;
                              } else {
                                vErrors = null;
                              }
                            }
                          }
                          var valid0 = _errs39 === errors;
                        } else {
                          var valid0 = true;
                        }
                        if (valid0) {
                          if (data.tags !== undefined) {
                            let data14 = data.tags;
                            const _errs44 = errors;
                            if (errors === _errs44) {
                              if (
                                data14 &&
                                typeof data14 == 'object' &&
                                !Array.isArray(data14)
                              ) {
                                for (const key7 in data14) {
                                  const _errs47 = errors;
                                  if (
                                    !validate45(data14[key7], {
                                      instancePath:
                                        instancePath +
                                        '/tags/' +
                                        key7
                                          .replace(/~/g, '~0')
                                          .replace(/\//g, '~1'),
                                      parentData: data14,
                                      parentDataProperty: key7,
                                      rootData,
                                    })
                                  ) {
                                    vErrors =
                                      vErrors === null
                                        ? validate45.errors
                                        : vErrors.concat(validate45.errors);
                                    errors = vErrors.length;
                                  }
                                  var valid10 = _errs47 === errors;
                                  if (!valid10) {
                                    break;
                                  }
                                }
                              } else {
                                validate21.errors = [
                                  {
                                    instancePath: instancePath + '/tags',
                                    schemaPath: '#/properties/tags/type',
                                    keyword: 'type',
                                    params: { type: 'object' },
                                    message: 'must be object',
                                  },
                                ];
                                return false;
                              }
                            }
                            var valid0 = _errs44 === errors;
                          } else {
                            var valid0 = true;
                          }
                          if (valid0) {
                            if (data.version !== undefined) {
                              let data16 = data.version;
                              const _errs48 = errors;
                              if (errors === _errs48) {
                                if (
                                  data16 &&
                                  typeof data16 == 'object' &&
                                  !Array.isArray(data16)
                                ) {
                                  let missing1;
                                  if (
                                    (data16.major === undefined &&
                                      (missing1 = 'major')) ||
                                    (data16.minor === undefined &&
                                      (missing1 = 'minor')) ||
                                    (data16.patch === undefined &&
                                      (missing1 = 'patch'))
                                  ) {
                                    validate21.errors = [
                                      {
                                        instancePath: instancePath + '/version',
                                        schemaPath:
                                          '#/properties/version/required',
                                        keyword: 'required',
                                        params: { missingProperty: missing1 },
                                        message:
                                          "must have required property '" +
                                          missing1 +
                                          "'",
                                      },
                                    ];
                                    return false;
                                  } else {
                                    const _errs50 = errors;
                                    for (const key8 in data16) {
                                      if (
                                        !(
                                          key8 === 'major' ||
                                          key8 === 'minor' ||
                                          key8 === 'patch'
                                        )
                                      ) {
                                        validate21.errors = [
                                          {
                                            instancePath:
                                              instancePath + '/version',
                                            schemaPath:
                                              '#/properties/version/additionalProperties',
                                            keyword: 'additionalProperties',
                                            params: {
                                              additionalProperty: key8,
                                            },
                                            message:
                                              'must NOT have additional properties',
                                          },
                                        ];
                                        return false;
                                        break;
                                      }
                                    }
                                    if (_errs50 === errors) {
                                      if (data16.major !== undefined) {
                                        let data17 = data16.major;
                                        const _errs51 = errors;
                                        if (
                                          !(
                                            typeof data17 == 'number' &&
                                            isFinite(data17)
                                          )
                                        ) {
                                          validate21.errors = [
                                            {
                                              instancePath:
                                                instancePath + '/version/major',
                                              schemaPath:
                                                '#/properties/version/properties/major/type',
                                              keyword: 'type',
                                              params: { type: 'number' },
                                              message: 'must be number',
                                            },
                                          ];
                                          return false;
                                        }
                                        var valid11 = _errs51 === errors;
                                      } else {
                                        var valid11 = true;
                                      }
                                      if (valid11) {
                                        if (data16.minor !== undefined) {
                                          let data18 = data16.minor;
                                          const _errs53 = errors;
                                          if (
                                            !(
                                              typeof data18 == 'number' &&
                                              isFinite(data18)
                                            )
                                          ) {
                                            validate21.errors = [
                                              {
                                                instancePath:
                                                  instancePath +
                                                  '/version/minor',
                                                schemaPath:
                                                  '#/properties/version/properties/minor/type',
                                                keyword: 'type',
                                                params: { type: 'number' },
                                                message: 'must be number',
                                              },
                                            ];
                                            return false;
                                          }
                                          var valid11 = _errs53 === errors;
                                        } else {
                                          var valid11 = true;
                                        }
                                        if (valid11) {
                                          if (data16.patch !== undefined) {
                                            let data19 = data16.patch;
                                            const _errs55 = errors;
                                            if (
                                              !(
                                                typeof data19 == 'number' &&
                                                isFinite(data19)
                                              )
                                            ) {
                                              validate21.errors = [
                                                {
                                                  instancePath:
                                                    instancePath +
                                                    '/version/patch',
                                                  schemaPath:
                                                    '#/properties/version/properties/patch/type',
                                                  keyword: 'type',
                                                  params: { type: 'number' },
                                                  message: 'must be number',
                                                },
                                              ];
                                              return false;
                                            }
                                            var valid11 = _errs55 === errors;
                                          } else {
                                            var valid11 = true;
                                          }
                                        }
                                      }
                                    }
                                  }
                                } else {
                                  validate21.errors = [
                                    {
                                      instancePath: instancePath + '/version',
                                      schemaPath: '#/properties/version/type',
                                      keyword: 'type',
                                      params: { type: 'object' },
                                      message: 'must be object',
                                    },
                                  ];
                                  return false;
                                }
                              }
                              var valid0 = _errs48 === errors;
                            } else {
                              var valid0 = true;
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    } else {
      validate21.errors = [
        {
          instancePath,
          schemaPath: '#/type',
          keyword: 'type',
          params: { type: 'object' },
          message: 'must be object',
        },
      ];
      return false;
    }
  }
  validate21.errors = vErrors;
  return errors === 0;
}
function validate20(
  data,
  { instancePath = '', parentData, parentDataProperty, rootData = data } = {},
) {
  let vErrors = null;
  let errors = 0;
  if (
    !validate21(data, {
      instancePath,
      parentData,
      parentDataProperty,
      rootData,
    })
  ) {
    vErrors =
      vErrors === null ? validate21.errors : vErrors.concat(validate21.errors);
    errors = vErrors.length;
  }
  validate20.errors = vErrors;
  return errors === 0;
}
