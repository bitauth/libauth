export default validate20;
const schema22 = {
  $ref: '#/definitions/WalletTemplate',
  $schema: 'http://json-schema.org/draft-07/schema#',
  definitions: {
    AuthenticationVirtualMachineIdentifier: {
      description:
        "Allowable identifiers for authentication virtual machine versions. The `BCH` prefix identifies the Bitcoin Cash network, the `XEC` prefix identifies the eCash network, the `BSV` prefix identifies the Bitcoin SV network, and the `BTC` prefix identifies the Bitcoin Core network. VM versions are named according to the date they were deployed on the indicated network.\n\nFor each network prefix, a `_SPEC` VM version is reserved to indicate that the template requires a custom, not-yet-deployed VM version (e.g. one or more CHIPs). By convention, templates marked for `_SPEC` VMs should indicate their requirements in the template description. After deployment of the `_SPEC` VM, when template compatibility is verified, the template's `supported` array should be updated to indicate compatibility with the live VM version.",
      enum: [
        'BCH_2020_05',
        'BCH_2021_05',
        'BCH_2022_05',
        'BCH_2023_05',
        'BCH_SPEC',
        'BSV_2020_02',
        'BSV_SPEC',
        'BTC_2017_08',
        'BTC_SPEC',
        'XEC_2020_05',
        'XEC_SPEC',
      ],
      type: 'string',
    },
    WalletTemplate: {
      additionalProperties: false,
      description:
        'A `WalletTemplate` specifies a set of locking scripts, unlocking scripts, and other information required to use a certain wallet protocol. Templates fully describe wallet protocols in a way that can be shared between software clients.',
      properties: {
        $schema: {
          description:
            'The URI that identifies the JSON Schema used by this template. Try: `https://libauth.org/schemas/wallet-template-v0.schema.json` to enable documentation, autocompletion, and validation in JSON documents.',
          type: 'string',
        },
        description: {
          description:
            'An optionally multi-line, free-form, human-readable description for this wallet template (for use in user interfaces). If displayed, this description should use a monospace font to properly render ASCII diagrams.\n\nDescriptions have no length limit, but in user interfaces with limited space, they should be hidden beyond the first newline character or `140` characters until revealed by the user (e.g. by hiding the remaining description until the user activates a "show more" link).',
          type: 'string',
        },
        entities: {
          additionalProperties: { $ref: '#/definitions/WalletTemplateEntity' },
          description:
            'A map of entities defined in this wallet template.\n\nObject keys are used as entity identifiers, and by convention, should use `snake_case`.',
          type: 'object',
        },
        name: {
          description:
            'A single-line, Title Case, human-readable name for this authentication template (for use in user interfaces).',
          type: 'string',
        },
        scenarios: {
          additionalProperties: {
            $ref: '#/definitions/WalletTemplateScenario',
          },
          description:
            'A scenario describes a context in which one or more scripts might be used. Scenarios are used for transaction estimation and as an integrated testing system for wallet templates.\n\nObject keys are used as scenario identifiers, and by convention, should use `snake_case`.',
          type: 'object',
        },
        scripts: {
          additionalProperties: {
            anyOf: [
              { $ref: '#/definitions/WalletTemplateScript' },
              { $ref: '#/definitions/WalletTemplateScriptLocking' },
              { $ref: '#/definitions/WalletTemplateScriptTested' },
              { $ref: '#/definitions/WalletTemplateScriptUnlocking' },
            ],
          },
          description:
            'A map of scripts used in this wallet template.\n\nObject keys are used as script identifiers, and by convention, should use `snake_case`.',
          type: 'object',
        },
        supported: {
          description:
            'A list of authentication virtual machine versions supported by this template.\n\nVirtual machine identifiers use the format `CODE_YYYY_MM`, where `CODE` is the currency code used to identify the network, and `YYYY_MM` is the year and month in which the specified VM version became active on the indicated network.\n\nIdentifiers with the `_SPEC` suffix indicate that this template is intended for compatibility with a future virtual machine version, but at the time the template was created, that virtual machine had not yet become active on the specified chain.',
          items: {
            $ref: '#/definitions/AuthenticationVirtualMachineIdentifier',
          },
          type: 'array',
        },
        version: {
          const: 0,
          description:
            'A number identifying the format of this WalletTemplate. Currently, this implementation requires `version` be set to `0`.',
          type: 'number',
        },
      },
      required: ['entities', 'scripts', 'supported', 'version'],
      type: 'object',
    },
    WalletTemplateAddressData: {
      additionalProperties: false,
      properties: {
        description: {
          description:
            'A single-line, human readable description for this variable (for use in user interfaces).',
          type: 'string',
        },
        name: {
          description:
            'A single-line, Title Case, human-readable name for this variable (for use in user interfaces).',
          type: 'string',
        },
        type: { const: 'AddressData', type: 'string' },
      },
      required: ['type'],
      type: 'object',
    },
    WalletTemplateEntity: {
      additionalProperties: false,
      description:
        'An object describing the configuration for a particular entity within an wallet template.',
      properties: {
        description: {
          description:
            'An optionally multi-line, free-form, human-readable description for this entity (for use in user interfaces). If displayed, this description should use a monospace font to properly render ASCII diagrams.',
          type: 'string',
        },
        name: {
          description:
            'A single-line, Title Case, human-readable name for this entity for use in user interfaces and error messages, e.g.: `Trusted Third-Party`.',
          type: 'string',
        },
        scripts: {
          description:
            'An array of the identifiers of each script the entity must be capable of generating, e.g. each of the unlocking scripts this entity might use.\n\nProvided the necessary variables, any entity can construct any script, but this option allows us to hint to more advanced wallets which scripts to recommend to users. (Especially when many scripts require inter-entity communication initiated by a user.)\n\nIf not provided, this property is assumed to include all scripts in the template.',
          items: { type: 'string' },
          type: 'array',
        },
        variables: {
          additionalProperties: {
            $ref: '#/definitions/WalletTemplateVariable',
          },
          description:
            "A map of variables that must be provided by this entity for use in the template's scripts. Some variables are required before locking script generation, while some variables can or must be resolved only before unlocking script generation.\n\nObject keys are used as variable identifiers, and by convention, should use `snake_case`.",
          type: 'object',
        },
      },
      type: 'object',
    },
    WalletTemplateHdKey: {
      additionalProperties: false,
      properties: {
        addressOffset: {
          description:
            'The offset by which to increment the `addressIndex` provided in the compilation data when deriving this `HdKey`. (Default: 0)\n\nThis is useful for deriving the "next" (`1`) or "previous" (`-1`) address to be used in the current compiler configuration.',
          type: 'number',
        },
        description: {
          description:
            'A single-line, human readable description for this variable (for use in user interfaces).',
          type: 'string',
        },
        hdPublicKeyDerivationPath: {
          description:
            "The path to derive the entity's HD public key from the entity's master HD private key. By default, `m` (i.e. the entity's HD public key represents the same node in the HD tree as its HD private key).\n\nThis can be used to specify another derivation path from which the `publicDerivationPath` begins, e.g. `m/0'/1'/2'`. See `publicDerivationPath` for details.\n\nThis path must begin with an `m` (private derivation) and be fixed – it cannot contain an `i` character to represent the address index, as a dynamic hardened path would require a new HD public key for each address.",
          type: 'string',
        },
        name: {
          description:
            'A single-line, Title Case, human-readable name for this variable (for use in user interfaces).',
          type: 'string',
        },
        neverSignTwice: {
          description:
            'If set to `true`, indicates that this key should never be used to sign two different messages.\n\nThis is useful for contracts that use zero-confirmation escrow systems to guarantee against double-spend attempts. By indicating that the user could be subjected to losses if a key were used in multiple signatures, templates can ensure that wallet implementations apply appropriate safeguards around use of the key.\n\nDefaults to `false`.',
          type: 'boolean',
        },
        privateDerivationPath: {
          description:
            "The derivation path used to derive this `HdKey` from the owning entity's HD private key. By default, `m/i`.\n\nThis path uses the notation specified in BIP32 and the `i` character to represent the location of the `addressIndex`:\n\nThe first character must be `m` (private derivation), followed by sets of `/` and a number representing the child index used in the derivation at that depth. Hardened derivation is represented by a trailing `'`, and hardened child indexes are represented with the hardened index offset (`2147483648`) subtracted. The `i` character is replaced with the value of `addressIndex` plus this `HdKey`'s `addressOffset`. If the `i` character is followed by `'`, the hardened index offset is added (`2147483648`) and hardened derivation is used.\n\nFor example, `m/0/1'/i'` uses 3 levels of derivation, with child indexes in the following order:\n\n`derive(derive(derive(node, 0), 2147483648 + 1), 2147483648 + addressIndex + addressOffset)`\n\nBecause hardened derivation requires knowledge of the private key, `HdKey` variables with `derivationPath`s that include hardened derivation cannot use HD public derivation (the `hdPublicKeys` property in `CompilationData`). Instead, compilation requires the respective HD private key (`CompilationData.hdKeys.hdPrivateKeys`) or the fully-derived public key (`CompilationData.hdKeys.derivedPublicKeys`).",
          type: 'string',
        },
        publicDerivationPath: {
          description:
            "The derivation path used to derive this `HdKey`'s public key from the owning entity's HD public key. If not set, the public equivalent of `privateDerivationPath` is used. For the `privateDerivationPath` default of `m/i`, this is `M/i`.\n\nIf `privateDerivationPath` uses hardened derivation for some levels, but later derivation levels use non-hardened derivation, `publicDerivationPath` can be used to specify a public derivation path beginning from `hdPublicKeyDerivationPath` (i.e. `publicDerivationPath` should always be a non-hardened segment of `privateDerivationPath` that follows `hdPublicKeyDerivationPath`).\n\nThe first character must be `M` (public derivation), followed by sets of `/` and a number representing the child index used in the non-hardened derivation at that depth.\n\nFor example, if `privateDerivationPath` is `m/0'/i`, it is not possible to derive the equivalent public key with only the HD public key `M`. (The path \"`M/0'/i`\" is impossible.) However, given the HD public key for `m/0'`, it is possible to derive the public key of `m/0'/i` for any `i`. In this case, `hdPublicKeyDerivationPath` would be `m/0'` and `publicDerivationPath` would be the remaining `M/i`.",
          type: 'string',
        },
        type: { const: 'HdKey', type: 'string' },
      },
      required: ['type'],
      type: 'object',
    },
    WalletTemplateKey: {
      additionalProperties: false,
      properties: {
        description: {
          description:
            'A single-line, human readable description for this variable (for use in user interfaces).',
          type: 'string',
        },
        name: {
          description:
            'A single-line, Title Case, human-readable name for this variable (for use in user interfaces).',
          type: 'string',
        },
        neverSignTwice: {
          description:
            'If set to `true`, indicates that this key should never be used to sign two different messages.\n\nThis is useful for contracts that use zero-confirmation escrow systems to guarantee against double-spend attempts. By indicating that the user could be subjected to losses if a key were used in multiple signatures, templates can ensure that wallet implementations apply appropriate safeguards around use of the key.\n\nDefaults to `false`.',
          type: 'boolean',
        },
        type: { const: 'Key', type: 'string' },
      },
      required: ['type'],
      type: 'object',
    },
    WalletTemplateScenario: {
      additionalProperties: false,
      description:
        'An object describing the configuration for a particular scenario within an wallet template.',
      properties: {
        data: {
          $ref: '#/definitions/WalletTemplateScenarioData',
          description:
            "An object defining the data to use while compiling this scenario. The properties specified here are used to extend the existing scenario data based on this scenario's `extends` property.\n\nEach property is extended individually – to unset a previously-set property, the property must be individually overridden in this object.",
        },
        description: {
          description:
            'An optionally multi-line, free-form, human-readable description for this scenario (for use in user interfaces). If displayed, this description should use a monospace font to properly render ASCII diagrams.',
          type: 'string',
        },
        extends: {
          description:
            "The identifier of the scenario that this scenario extends. Any `data` or `transaction` properties not defined in this scenario inherit from the extended parent scenario.\n\nIf undefined, this scenario is assumed to extend the default scenario:\n\n- The default values for `data` are set:   - The identifiers of all `Key` variables and entities in this template are lexicographically sorted, then each is assigned an incrementing positive integer – beginning with `1` – encoded as an unsigned, 256-bit, big-endian integer (i.e. `0x0000...0001` (32 bytes), `0x0000...0002`, `0x0000...0003`, etc.). For `Key`s, this assigned value is used as the private key; For entities, the assigned value is used as the master seed of that entity's `HdPrivateKey`. If `hdKey` is set, the `addressIndex` is set to `0`.   - `currentBlockHeight` is set to `2`. This is the height of the second mined block after the genesis block: `000000006a625f06636b8bb6ac7b960a8d03705d1ace08b1a19da3fdcc99ddbd`. This default value was chosen to be low enough to simplify the debugging of block height offsets while remaining differentiated from `0` and `1`, which are used both as boolean return values and for control flow.   - `currentBlockTime` is set to `1231469665`. This is the Median Time-Past block time (BIP113) of block `2`.\n\n- Then `transaction` is set based on use:   - if the scenario is being used for transaction estimation, all transaction properties are taken from the transaction being estimated.   - if the scenario is being used for script testing and validation, the default value for each `transaction` property is used.\n\nWhen a scenario is extended, each property of `data` and `transaction` is extended individually: if the extending scenario does not provide a new value for `data.bytecode.value` or `transaction.property`, the parent value is used. To avoid inheriting a parent value, each child value must be individually overridden.",
          type: 'string',
        },
        name: {
          description:
            'A single-line, Title Case, human-readable name for this scenario for use in user interfaces, e.g.: `Delayed Recovery`.',
          type: 'string',
        },
        sourceOutputs: {
          description:
            'The list of source outputs (a.k.a. UTXOs) to use when generating the compilation context for this scenario.\n\nThe `sourceOutputs` property must have the same length as `transaction.inputs`, and each source output must be ordered to match the index of the input that spends it.\n\nTo be valid the `sourceOutputs` property must have exactly one source output with `lockingBytecode` set to `["slot"]` – the output at the same index as the `["slot"]` input in `transaction.inputs`.\n\nIf undefined, defaults to `[{ "lockingBytecode": ["slot"] }]`.',
          items: { $ref: '#/definitions/WalletTemplateScenarioSourceOutput' },
          type: 'array',
        },
        transaction: {
          additionalProperties: false,
          description:
            'The transaction within which this scenario should be evaluated. This is used for script testing and validation.\n\nIf undefined, inherits the default value for each property: ```json {   "inputs": [{ "unlockingBytecode": [\'slot\'] }],   "locktime": 0,   "outputs": [{ "lockingBytecode": {} }],   "version": 2 } ```\n\nAny `transaction` property that is not set will be inherited from the scenario specified by `extends`. when specifying the `inputs` and `outputs` properties, each input and output extends the default values for inputs and outputs, respectively.\n\nFor example, an input of `{}` is interpreted as: ```json {   "outpointIndex": 0,   "outpointTransactionHash":     "0000000000000000000000000000000000000000000000000000000000000000",   "sequenceNumber": 0,   "unlockingBytecode": [\'slot\'] } ``` And an output of `{}` is interpreted as: ```json {   "lockingBytecode": {     "script": [\'copy\'],     "overrides": { "hdKeys": { "addressIndex": 1 } }   },   "valueSatoshis": 0 } ```',
          properties: {
            inputs: {
              description:
                'The list of inputs to use when generating the transaction for this scenario.\n\nTo be valid the `inputs` property must have exactly one input with `unlockingBytecode` set to `["slot"]`. This is the input in which the unlocking script under test will be placed.\n\nIf undefined, inherits the default scenario `inputs` value: `[{ "unlockingBytecode": ["slot"] }]`.',
              items: { $ref: '#/definitions/WalletTemplateScenarioInput' },
              type: 'array',
            },
            locktime: {
              description:
                'The locktime to use when generating the transaction for this scenario. A positive integer from `0` to a maximum of `4294967295` – if undefined, defaults to `0`.\n\nLocktime can be provided as either a timestamp or a block height. Values less than `500000000` are understood to be a block height (the current block number in the chain, beginning from block `0`). Values greater than or equal to `500000000` are understood to be a UNIX timestamp.\n\nFor validating timestamp values, the median timestamp of the last 11 blocks (Median Time-Past) is used. The precise behavior is defined in BIP113.\n\nIf the `sequenceNumber` of every transaction input is set to `0xffffffff` (`4294967295`), locktime is disabled, and the transaction may be added to a block even if the specified locktime has not yet been reached. When locktime is disabled, if an `OP_CHECKLOCKTIMEVERIFY` operation is encountered during the verification of any input, an error is produced, and the transaction is invalid.',
              type: 'number',
            },
            outputs: {
              description:
                'The list of outputs to use when generating the transaction for this scenario.\n\nIf undefined, defaults to `[{ "lockingBytecode": {} }]`.',
              items: {
                $ref: '#/definitions/WalletTemplateScenarioTransactionOutput',
              },
              type: 'array',
            },
            version: {
              description:
                'The version to use when generating the transaction for this scenario. A positive integer from `0` to a maximum of `4294967295` – if undefined, inherits the default scenario `version` value: `2`.',
              type: 'number',
            },
          },
          type: 'object',
        },
      },
      type: 'object',
    },
    WalletTemplateScenarioBytecode: {
      anyOf: [
        { type: 'string' },
        {
          additionalProperties: false,
          properties: {
            overrides: {
              $ref: '#/definitions/WalletTemplateScenarioData',
              description:
                'Scenario data that extends the scenario\'s top-level `data` during script compilation.\n\nEach property is extended individually – to modify a property set by the top-level scenario `data`, the new value must be listed here.\n\nDefaults to `{}` for `sourceOutputs` and `transaction.inputs`; defaults to `{ "hdKeys": { "addressIndex": 1 } }` for `transaction.outputs`.',
            },
            script: {
              anyOf: [
                { type: 'string' },
                {
                  items: { const: 'copy', type: 'string' },
                  maxItems: 1,
                  minItems: 1,
                  type: 'array',
                },
              ],
              description:
                'The identifier of the script to compile when generating this bytecode. May also be set to `["copy"]`, which is automatically replaced with the identifier of the locking or unlocking script under test, respectively.\n\nIf undefined, defaults to `["copy"]`.',
            },
          },
          type: 'object',
        },
      ],
      description:
        'A type that describes the configuration for a particular locking or unlocking bytecode within a wallet template scenario.\n\nBytecode may be specified as either a hexadecimal-encoded string or an object describing the required compilation.\n\nFor `sourceOutputs` and `transaction.inputs`, defaults to `{ script: ["copy"], overrides: {} }`. For `transaction.outputs`, defaults to `{ script: ["copy"], overrides: { "hdKeys": { "addressIndex": 1 } } }`.',
    },
    WalletTemplateScenarioData: {
      additionalProperties: false,
      description:
        'An object defining the data to use while compiling a scenario.',
      properties: {
        bytecode: {
          additionalProperties: { type: 'string' },
          description:
            "A map of full identifiers to CashAssembly scripts that compile to each identifier's value for this scenario. Allowing `bytecode` to be specified as scripts (rather than e.g. hex) offers greater power and flexibility.\n\nBytecode scripts have access to each other and all other template scripts and defined variables, however, cyclical references will produce an error at compile time. Also, because the results of these compilations will be used to generate the compilation context for this scenario, these scripts may not use compiler operations that themselves require access to compilation context (e.g. signatures).\n\nThe provided `fullIdentifier` should match the complete identifier for each item, e.g. `some_wallet_data`, `variable_id.public_key`, or `variable_id.signature.all_outputs`.\n\nAll `AddressData` and `WalletData` variables must be provided via `bytecode` (though the default scenario automatically includes reasonable values), and pre-computed results for operations of other variable types (e.g. `key.public_key`) may also be provided via this property.\n\nBecause each bytecode identifier may precisely match the identifier of the variable it defines for this scenario, references between these scripts must refer to the target script with a `_scenario.` prefix. E.g. to reference a sibling script `my_foo` from `my_bar`, the `my_bar` script must use the identifier `_scenario.my_foo`.",
          type: 'object',
        },
        currentBlockHeight: {
          description:
            'The current block height at the "address creation time" implied in this scenario.',
          type: 'number',
        },
        currentBlockTime: {
          description:
            'The current MTP block time as a UNIX timestamp at the "address creation time" implied in this scenario.\n\nNote, this is never a current timestamp, but rather the median timestamp of the last 11 blocks. It is therefore approximately one hour in the past.\n\nEvery block has a precise MTP block time, much like a block height. See BIP113 for details.',
          type: 'number',
        },
        hdKeys: {
          additionalProperties: false,
          description:
            'An object describing the settings used for `HdKey` variables in this scenario.',
          properties: {
            addressIndex: {
              description:
                'The current address index to be used for this scenario. The `addressIndex` gets added to each `HdKey`s `addressOffset` to calculate the dynamic index (`i`) used in each `privateDerivationPath` or `publicDerivationPath`.\n\nThis is required for any compiler operation that requires derivation. Typically, the value is incremented by one for each address in a wallet.\n\nDefaults to `0`.',
              type: 'number',
            },
            hdPrivateKeys: {
              additionalProperties: { type: 'string' },
              description:
                'A map of entity IDs to master HD private keys. These master HD private keys are used to derive each `HdKey` variable assigned to that entity according to its `privateDerivationPath`.\n\nHD private keys may be encoded for either mainnet or testnet (the network information is ignored).\n\nIf both an HD private key (in `hdPrivateKeys`) and HD public key (in `hdPublicKeys`) are provided for the same entity in the same scenario (not recommended), the HD private key is used.',
              type: 'object',
            },
            hdPublicKeys: {
              additionalProperties: { type: 'string' },
              description:
                'A map of entity IDs to HD public keys. These HD public keys are used to derive public keys for each `HdKey` variable assigned to that entity according to its `publicDerivationPath`.\n\nHD public keys may be encoded for either mainnet or testnet (the network information is ignored).\n\nIf both an HD private key (in `hdPrivateKeys`) and HD public key (in `hdPublicKeys`) are provided for the same entity in the same scenario (not recommended), the HD private key is used.',
              type: 'object',
            },
          },
          type: 'object',
        },
        keys: {
          additionalProperties: false,
          description:
            'An object describing the settings used for `Key` variables in this scenario.',
          properties: {
            privateKeys: {
              additionalProperties: { type: 'string' },
              description:
                'A map of `Key` variable IDs to their 32-byte, hexadecimal-encoded private key values.',
              type: 'object',
            },
          },
          type: 'object',
        },
      },
      type: 'object',
    },
    WalletTemplateScenarioInput: {
      additionalProperties: false,
      description:
        'An example input used to define a scenario for a wallet template.',
      properties: {
        outpointIndex: {
          description:
            'The index of the output in the transaction from which this input is spent.\n\nIf undefined, this defaults to the same index as the input itself (so that by default, every outpoint in the produced transaction is different, even if an empty `outpointTransactionHash` is used for each transaction).',
          type: 'number',
        },
        outpointTransactionHash: {
          description:
            'A 32-byte, hexadecimal-encoded hash of the transaction from which this input is spent in big-endian byte order. This is the byte order typically seen in block explorers and user interfaces (as opposed to little-endian byte order, which is used in standard P2P network messages).\n\nIf undefined, this defaults to the value: `0000000000000000000000000000000000000000000000000000000000000001`\n\nA.K.A. Outpoint `Transaction ID`',
          type: 'string',
        },
        sequenceNumber: {
          description:
            'The positive, 32-bit unsigned integer used as the "sequence number" for this input.\n\nIf undefined, this defaults to `0`.',
          type: 'number',
        },
        unlockingBytecode: {
          anyOf: [
            { $ref: '#/definitions/WalletTemplateScenarioBytecode' },
            {
              items: { const: 'slot', type: 'string' },
              maxItems: 1,
              minItems: 1,
              type: 'array',
            },
          ],
          description:
            'The `unlockingBytecode` value of this input for this scenario. This must be either `["slot"]`, indicating that this input contains the `unlockingBytecode` under test by the scenario, or an `WalletTemplateScenarioBytecode`.\n\nFor a scenario to be valid, `unlockingBytecode` must be `["slot"]` for exactly one input in the scenario.\n\nDefaults to `["slot"]`.',
        },
      },
      type: 'object',
    },
    'WalletTemplateScenarioOutput<false>': {
      additionalProperties: false,
      description:
        'An example output used to define a scenario for a wallet template.',
      properties: {
        lockingBytecode: {
          $ref: '#/definitions/WalletTemplateScenarioBytecode',
          description:
            'The locking bytecode used to encumber this output.\n\n`lockingBytecode` values may be provided as a hexadecimal-encoded string or as an object describing the required compilation. If undefined, defaults to  `{}`, which uses the default values for `script` and `overrides`, respectively.\n\nOnly source outputs may specify a `lockingBytecode` of `["slot"]`; this identifies the source output in which the locking script under test will be placed. (To be valid, every scenario\'s `sourceOutputs` property must have exactly one source output slot and one input slot at the same index.)',
        },
        token: {
          additionalProperties: false,
          description:
            'The CashToken contents of this output. This property is only defined if the output contains one or more tokens. For details, see `CHIP-2022-02-CashTokens`.',
          properties: {
            amount: {
              description:
                'The number of fungible tokens (of `category`) held in this output.\n\nBecause `Number.MAX_SAFE_INTEGER` (`9007199254740991`) is less than the maximum token amount (`9223372036854775807`), this value may also be provided as a string, e.g. `"9223372036854775807"`.\n\nIf undefined, this defaults to: `0`.',
              type: ['number', 'string'],
            },
            category: {
              description:
                'The 32-byte, hexadecimal-encoded token category ID to which the token(s) in this output belong in big-endian byte order. This is the byte order typically seen in block explorers and user interfaces (as opposed to little-endian byte order, which is used in standard P2P network messages).\n\nIf undefined, this defaults to the value: `0000000000000000000000000000000000000000000000000000000000000002`',
              type: 'string',
            },
            nft: {
              additionalProperties: false,
              description:
                'If present, the non-fungible token (NFT) held by this output. If the output does not include a non-fungible token, `undefined`.',
              properties: {
                capability: {
                  description:
                    'The capability of this non-fungible token, must be either `minting`, `mutable`, or `none`.\n\nIf undefined, this defaults to: `none`.',
                  enum: ['minting', 'mutable', 'none'],
                  type: 'string',
                },
                commitment: {
                  description:
                    'The hex-encoded commitment contents included in the non-fungible token held in this output.\n\nIf undefined, this defaults to: `""` (a zero-length commitment).',
                  type: 'string',
                },
              },
              type: 'object',
            },
          },
          type: 'object',
        },
        valueSatoshis: {
          description:
            'The value of the output in satoshis, the smallest unit of bitcoin.\n\nIn a valid transaction, this is a positive integer, from `0` to the maximum number of satoshis available to the transaction.\n\nThe maximum number of satoshis in existence is about 1/4 of `Number.MAX_SAFE_INTEGER` (`9007199254740991`), so typically, this value is defined using a `number`. However, this value may also be defined using a 16-character, hexadecimal-encoded `string`, to allow for the full range of the 64-bit unsigned, little-endian integer used to encode `valueSatoshis` in the encoded output format, e.g. `"ffffffffffffffff"`. This is useful for representing scenarios where intentionally excessive values are provided (to ensure an otherwise properly-signed transaction can never be included in the blockchain), e.g. transaction size estimations or off-chain Bitauth signatures.\n\nIf undefined, this defaults to: `0`.',
          type: ['number', 'string'],
        },
      },
      type: 'object',
    },
    'WalletTemplateScenarioOutput<true>': {
      additionalProperties: false,
      description:
        'An example output used to define a scenario for a wallet template.',
      properties: {
        lockingBytecode: {
          anyOf: [
            { $ref: '#/definitions/WalletTemplateScenarioBytecode' },
            {
              items: { const: 'slot', type: 'string' },
              maxItems: 1,
              minItems: 1,
              type: 'array',
            },
          ],
          description:
            'The locking bytecode used to encumber this output.\n\n`lockingBytecode` values may be provided as a hexadecimal-encoded string or as an object describing the required compilation. If undefined, defaults to  `{}`, which uses the default values for `script` and `overrides`, respectively.\n\nOnly source outputs may specify a `lockingBytecode` of `["slot"]`; this identifies the source output in which the locking script under test will be placed. (To be valid, every scenario\'s `sourceOutputs` property must have exactly one source output slot and one input slot at the same index.)',
        },
        token: {
          additionalProperties: false,
          description:
            'The CashToken contents of this output. This property is only defined if the output contains one or more tokens. For details, see `CHIP-2022-02-CashTokens`.',
          properties: {
            amount: {
              description:
                'The number of fungible tokens (of `category`) held in this output.\n\nBecause `Number.MAX_SAFE_INTEGER` (`9007199254740991`) is less than the maximum token amount (`9223372036854775807`), this value may also be provided as a string, e.g. `"9223372036854775807"`.\n\nIf undefined, this defaults to: `0`.',
              type: ['number', 'string'],
            },
            category: {
              description:
                'The 32-byte, hexadecimal-encoded token category ID to which the token(s) in this output belong in big-endian byte order. This is the byte order typically seen in block explorers and user interfaces (as opposed to little-endian byte order, which is used in standard P2P network messages).\n\nIf undefined, this defaults to the value: `0000000000000000000000000000000000000000000000000000000000000002`',
              type: 'string',
            },
            nft: {
              additionalProperties: false,
              description:
                'If present, the non-fungible token (NFT) held by this output. If the output does not include a non-fungible token, `undefined`.',
              properties: {
                capability: {
                  description:
                    'The capability of this non-fungible token, must be either `minting`, `mutable`, or `none`.\n\nIf undefined, this defaults to: `none`.',
                  enum: ['minting', 'mutable', 'none'],
                  type: 'string',
                },
                commitment: {
                  description:
                    'The hex-encoded commitment contents included in the non-fungible token held in this output.\n\nIf undefined, this defaults to: `""` (a zero-length commitment).',
                  type: 'string',
                },
              },
              type: 'object',
            },
          },
          type: 'object',
        },
        valueSatoshis: {
          description:
            'The value of the output in satoshis, the smallest unit of bitcoin.\n\nIn a valid transaction, this is a positive integer, from `0` to the maximum number of satoshis available to the transaction.\n\nThe maximum number of satoshis in existence is about 1/4 of `Number.MAX_SAFE_INTEGER` (`9007199254740991`), so typically, this value is defined using a `number`. However, this value may also be defined using a 16-character, hexadecimal-encoded `string`, to allow for the full range of the 64-bit unsigned, little-endian integer used to encode `valueSatoshis` in the encoded output format, e.g. `"ffffffffffffffff"`. This is useful for representing scenarios where intentionally excessive values are provided (to ensure an otherwise properly-signed transaction can never be included in the blockchain), e.g. transaction size estimations or off-chain Bitauth signatures.\n\nIf undefined, this defaults to: `0`.',
          type: ['number', 'string'],
        },
      },
      type: 'object',
    },
    WalletTemplateScenarioSourceOutput: {
      $ref: '#/definitions/WalletTemplateScenarioOutput<true>',
      description: 'A source output used by a wallet template scenario.',
    },
    WalletTemplateScenarioTransactionOutput: {
      $ref: '#/definitions/WalletTemplateScenarioOutput<false>',
      description:
        'A transaction output used to define a wallet template scenario transaction.',
    },
    WalletTemplateScript: {
      additionalProperties: false,
      description:
        'An object describing the configuration for a particular script within an wallet template.',
      properties: {
        name: {
          description:
            'A single-line, human-readable name for this script (for use in user interfaces).',
          type: 'string',
        },
        script: {
          description: 'The script definition in CashAssembly.',
          type: 'string',
        },
      },
      required: ['script'],
      type: 'object',
    },
    WalletTemplateScriptLocking: {
      additionalProperties: false,
      properties: {
        lockingType: {
          description:
            'Indicates if P2SH20 infrastructure should be used when producing bytecode related to this script. For more information on P2SH20, see BIP16.\n\nWhen compiling locking scripts of type `p2sh20`, the result will be placed in a P2SH20 "redeem script" format: `OP_HASH160 <$(<lockingBytecode> OP_HASH160)> OP_EQUAL`\n\nWhen compiling unlocking scripts that unlock locking scripts of type `p2sh20`, the result will be transformed into the P2SH20 unlocking format: `unlockingBytecode <lockingBytecode>` (where `lockingBytecode` is the compiled bytecode of the locking script, without the "redeem script" transformation.)\n\nThe presence of the `lockingType` property indicates that this script is a locking script. It must be present on any script referenced by the `unlocks` property of another script.',
          enum: ['p2sh20', 'p2sh32', 'standard'],
          type: 'string',
        },
        name: {
          description:
            'A single-line, human-readable name for this script (for use in user interfaces).',
          type: 'string',
        },
        script: {
          description: 'The script definition in CashAssembly.',
          type: 'string',
        },
      },
      required: ['lockingType', 'script'],
      type: 'object',
    },
    WalletTemplateScriptTest: {
      additionalProperties: false,
      properties: {
        check: {
          description:
            'The script to evaluate after the script being tested. This can be used to check that the tested script leaves the expected results on the stack. For example, if the tested script is expected to leave 3 items of a specific size on the stack, the `check` script could pop each resulting item from the stack and examine it for correctness.\n\nIn scenario testing, this script is appended to the script under test, and together they are treated as the locking script. Program evaluation is considered successful if the resulting program state can be verified by the virtual machine (e.g. the resulting stack contains a single `1`, no errors are produced, etc.).',
          type: 'string',
        },
        fails: {
          description:
            'A list of the scenario identifiers that – when used to compile this test and the script it tests – result in bytecode that fails program verification. The `setup` script is used in place of an unlocking script, and the concatenation of the script under test and the `check` script are used in place of a locking script.\n\nThese scenarios can be used to test this script in development and review.',
          items: { type: 'string' },
          type: 'array',
        },
        invalid: {
          description:
            'A list of the scenario identifiers that – when used to compile this test and the script it tests – result in a compilation error. The `setup` script is used in place of an unlocking script, and the concatenation of the script under test and the `check` script are used in place of a locking script.\n\nThese scenarios can be used to test this script in development and review.',
          items: { type: 'string' },
          type: 'array',
        },
        name: {
          description:
            'A single-line, Title Case, human-readable name for this test (for use in user interfaces).',
          type: 'string',
        },
        passes: {
          description:
            'A list of the scenario identifiers that – when used to compile this test and the script it tests – result in bytecode that passes program verification. The `setup` script is used in place of an unlocking script, and the concatenation of the script under test and the `check` script are used in place of a locking script.\n\nThese scenarios can be used to test this script in development and review.',
          items: { type: 'string' },
          type: 'array',
        },
        setup: {
          description:
            'A script to evaluate before the script being tested. This can be used to push values to the stack that are operated on by the tested script.\n\nIn scenario testing, this script is treated as the unlocking script.',
          type: 'string',
        },
      },
      required: ['check'],
      type: 'object',
    },
    WalletTemplateScriptTested: {
      additionalProperties: false,
      properties: {
        name: {
          description:
            'A single-line, human-readable name for this script (for use in user interfaces).',
          type: 'string',
        },
        pushed: {
          description:
            'If set to `true`, indicates that this script should be wrapped in a push statement for testing.\n\nThis is useful for scripts that serve as "bytecode templates" – e.g. formatted messages or signature preimages. These scripts are typically not evaluated as bytecode but appear within push statements elsewhere in the template.\n\nDefaults to `false`.',
          type: 'boolean',
        },
        script: {
          description: 'The script definition in CashAssembly.',
          type: 'string',
        },
        tests: {
          additionalProperties: {
            $ref: '#/definitions/WalletTemplateScriptTest',
          },
          description:
            'One or more tests that can be used during development and during template validation to confirm the correctness of this tested script.',
          type: 'object',
        },
      },
      required: ['script', 'tests'],
      type: 'object',
    },
    WalletTemplateScriptUnlocking: {
      additionalProperties: false,
      properties: {
        ageLock: {
          description:
            'TODO: not yet implemented\n\nThe minimum input age required for this unlocking script to become valid.\n\nThis value is provided as a CashAssembly script that must compile to the least significant 3 bytes of the minimum sequence number required for this unlocking script to be valid (the "type bit" and the 2-byte "value" – see BIP68 for details). This script has access to all other template scripts and variables, but cyclical references will produce an error at compile time.\n\nIn supporting wallets, this value can be computed at address creation time, and the remaining time for which any UTXO remains "age-locked" can be displayed in user interfaces (by parsing the "type bit" and "value" as described in BIP68).\n\nNote, because the precise value used by `OP_CHECKSEQUENCEVERIFY` can be provided in the unlocking script, it is trivial to create an unlocking script for which a proper value for `ageLock` is not possible to determine until the spending transaction is prepared. These cases are intentionally out-of-scope for this property. Instead, `ageLock` should only be used for unlocking scripts where the expected value can be compiled at address creation time.',
          type: 'string',
        },
        estimate: {
          description:
            'The identifier of the scenario to use for this unlocking script when compiling an estimated transaction.\n\nUsing estimate scenarios, it\'s possible for wallet software to compute an "estimated transaction", an invalid transaction that is guaranteed to be the same byte length as the final transaction. This length can be used to calculate the required transaction fee and assign values to the transaction\'s change output(s). Because estimate scenarios provide "estimated" values for all variables, this estimation can be done by a single entity without input from other entities.\n\nIf not provided, the default scenario will be used for estimation. The default scenario only provides values for each `Key` and `HdKey` variable, so compilations requiring other variables will produce errors. See `WalletTemplateScenario.extends` for details.',
          type: 'string',
        },
        fails: {
          description:
            'A list of the scenario identifiers that – when used to compile this unlocking script and the script it unlocks – result in bytecode that fails program verification.\n\nThese scenarios can be used to test this script in development and review.',
          items: { type: 'string' },
          type: 'array',
        },
        invalid: {
          description:
            'A list of the scenario identifiers that – when used to compile this unlocking script and the script it unlocks – result in a compilation error.\n\nThese scenarios can be used to test this script in development and review.',
          items: { type: 'string' },
          type: 'array',
        },
        name: {
          description:
            'A single-line, human-readable name for this script (for use in user interfaces).',
          type: 'string',
        },
        passes: {
          description:
            'A list of the scenario identifiers that – when used to compile this unlocking script and the script it unlocks – result in bytecode that passes program verification.\n\nThese scenarios can be used to test this script in development and review.',
          items: { type: 'string' },
          type: 'array',
        },
        script: {
          description: 'The script definition in CashAssembly.',
          type: 'string',
        },
        timeLockType: {
          description:
            "The expected type of time locks in this script.\n\nBecause `OP_CHECKLOCKTIMEVERIFY` reads from a transaction's `locktime` property, every input to a given transaction must share the same time lock type. This differs from `OP_CHECKSEQUENCEVERIFY` in that each input has its own `sequenceNumber`, so compatibility is not required.\n\nIf a transaction includes multiple inputs using scripts with `timeLockType` defined, and the types are not compatible, generation should fail.\n\nThe `timestamp` type indicates that the transaction's locktime is provided as a UNIX timestamp (the `locktime` value is greater than or equal to `500000000`).\n\nThe `height` type indicates that the transaction's locktime is provided as a block height (the `locktime` value is less than `500000000`).\n\nIf `timeLockType` is undefined, the script is assumed to have no reliance on absolute time locks.",
          enum: ['height', 'timestamp'],
          type: 'string',
        },
        unlocks: {
          description:
            'The identifier of the script that can be unlocked by this script.\n\nThe presence of the `unlocks` property indicates that this script is an unlocking script, and the script it unlocks must be a locking script.',
          type: 'string',
        },
      },
      required: ['script', 'unlocks'],
      type: 'object',
    },
    WalletTemplateVariable: {
      anyOf: [
        { $ref: '#/definitions/WalletTemplateAddressData' },
        { $ref: '#/definitions/WalletTemplateHdKey' },
        { $ref: '#/definitions/WalletTemplateKey' },
        { $ref: '#/definitions/WalletTemplateWalletData' },
      ],
    },
    WalletTemplateWalletData: {
      additionalProperties: false,
      properties: {
        description: {
          description:
            'A single-line, human readable description for this variable (for use in user interfaces).',
          type: 'string',
        },
        name: {
          description:
            'A single-line, Title Case, human-readable name for this variable (for use in user interfaces).',
          type: 'string',
        },
        type: { const: 'WalletData', type: 'string' },
      },
      required: ['type'],
      type: 'object',
    },
  },
};
const schema23 = {
  additionalProperties: false,
  description:
    'A `WalletTemplate` specifies a set of locking scripts, unlocking scripts, and other information required to use a certain wallet protocol. Templates fully describe wallet protocols in a way that can be shared between software clients.',
  properties: {
    $schema: {
      description:
        'The URI that identifies the JSON Schema used by this template. Try: `https://libauth.org/schemas/wallet-template-v0.schema.json` to enable documentation, autocompletion, and validation in JSON documents.',
      type: 'string',
    },
    description: {
      description:
        'An optionally multi-line, free-form, human-readable description for this wallet template (for use in user interfaces). If displayed, this description should use a monospace font to properly render ASCII diagrams.\n\nDescriptions have no length limit, but in user interfaces with limited space, they should be hidden beyond the first newline character or `140` characters until revealed by the user (e.g. by hiding the remaining description until the user activates a "show more" link).',
      type: 'string',
    },
    entities: {
      additionalProperties: { $ref: '#/definitions/WalletTemplateEntity' },
      description:
        'A map of entities defined in this wallet template.\n\nObject keys are used as entity identifiers, and by convention, should use `snake_case`.',
      type: 'object',
    },
    name: {
      description:
        'A single-line, Title Case, human-readable name for this authentication template (for use in user interfaces).',
      type: 'string',
    },
    scenarios: {
      additionalProperties: { $ref: '#/definitions/WalletTemplateScenario' },
      description:
        'A scenario describes a context in which one or more scripts might be used. Scenarios are used for transaction estimation and as an integrated testing system for wallet templates.\n\nObject keys are used as scenario identifiers, and by convention, should use `snake_case`.',
      type: 'object',
    },
    scripts: {
      additionalProperties: {
        anyOf: [
          { $ref: '#/definitions/WalletTemplateScript' },
          { $ref: '#/definitions/WalletTemplateScriptLocking' },
          { $ref: '#/definitions/WalletTemplateScriptTested' },
          { $ref: '#/definitions/WalletTemplateScriptUnlocking' },
        ],
      },
      description:
        'A map of scripts used in this wallet template.\n\nObject keys are used as script identifiers, and by convention, should use `snake_case`.',
      type: 'object',
    },
    supported: {
      description:
        'A list of authentication virtual machine versions supported by this template.\n\nVirtual machine identifiers use the format `CODE_YYYY_MM`, where `CODE` is the currency code used to identify the network, and `YYYY_MM` is the year and month in which the specified VM version became active on the indicated network.\n\nIdentifiers with the `_SPEC` suffix indicate that this template is intended for compatibility with a future virtual machine version, but at the time the template was created, that virtual machine had not yet become active on the specified chain.',
      items: { $ref: '#/definitions/AuthenticationVirtualMachineIdentifier' },
      type: 'array',
    },
    version: {
      const: 0,
      description:
        'A number identifying the format of this WalletTemplate. Currently, this implementation requires `version` be set to `0`.',
      type: 'number',
    },
  },
  required: ['entities', 'scripts', 'supported', 'version'],
  type: 'object',
};
const schema37 = {
  additionalProperties: false,
  description:
    'An object describing the configuration for a particular script within an wallet template.',
  properties: {
    name: {
      description:
        'A single-line, human-readable name for this script (for use in user interfaces).',
      type: 'string',
    },
    script: {
      description: 'The script definition in CashAssembly.',
      type: 'string',
    },
  },
  required: ['script'],
  type: 'object',
};
const schema38 = {
  additionalProperties: false,
  properties: {
    lockingType: {
      description:
        'Indicates if P2SH20 infrastructure should be used when producing bytecode related to this script. For more information on P2SH20, see BIP16.\n\nWhen compiling locking scripts of type `p2sh20`, the result will be placed in a P2SH20 "redeem script" format: `OP_HASH160 <$(<lockingBytecode> OP_HASH160)> OP_EQUAL`\n\nWhen compiling unlocking scripts that unlock locking scripts of type `p2sh20`, the result will be transformed into the P2SH20 unlocking format: `unlockingBytecode <lockingBytecode>` (where `lockingBytecode` is the compiled bytecode of the locking script, without the "redeem script" transformation.)\n\nThe presence of the `lockingType` property indicates that this script is a locking script. It must be present on any script referenced by the `unlocks` property of another script.',
      enum: ['p2sh20', 'p2sh32', 'standard'],
      type: 'string',
    },
    name: {
      description:
        'A single-line, human-readable name for this script (for use in user interfaces).',
      type: 'string',
    },
    script: {
      description: 'The script definition in CashAssembly.',
      type: 'string',
    },
  },
  required: ['lockingType', 'script'],
  type: 'object',
};
const schema41 = {
  additionalProperties: false,
  properties: {
    ageLock: {
      description:
        'TODO: not yet implemented\n\nThe minimum input age required for this unlocking script to become valid.\n\nThis value is provided as a CashAssembly script that must compile to the least significant 3 bytes of the minimum sequence number required for this unlocking script to be valid (the "type bit" and the 2-byte "value" – see BIP68 for details). This script has access to all other template scripts and variables, but cyclical references will produce an error at compile time.\n\nIn supporting wallets, this value can be computed at address creation time, and the remaining time for which any UTXO remains "age-locked" can be displayed in user interfaces (by parsing the "type bit" and "value" as described in BIP68).\n\nNote, because the precise value used by `OP_CHECKSEQUENCEVERIFY` can be provided in the unlocking script, it is trivial to create an unlocking script for which a proper value for `ageLock` is not possible to determine until the spending transaction is prepared. These cases are intentionally out-of-scope for this property. Instead, `ageLock` should only be used for unlocking scripts where the expected value can be compiled at address creation time.',
      type: 'string',
    },
    estimate: {
      description:
        'The identifier of the scenario to use for this unlocking script when compiling an estimated transaction.\n\nUsing estimate scenarios, it\'s possible for wallet software to compute an "estimated transaction", an invalid transaction that is guaranteed to be the same byte length as the final transaction. This length can be used to calculate the required transaction fee and assign values to the transaction\'s change output(s). Because estimate scenarios provide "estimated" values for all variables, this estimation can be done by a single entity without input from other entities.\n\nIf not provided, the default scenario will be used for estimation. The default scenario only provides values for each `Key` and `HdKey` variable, so compilations requiring other variables will produce errors. See `WalletTemplateScenario.extends` for details.',
      type: 'string',
    },
    fails: {
      description:
        'A list of the scenario identifiers that – when used to compile this unlocking script and the script it unlocks – result in bytecode that fails program verification.\n\nThese scenarios can be used to test this script in development and review.',
      items: { type: 'string' },
      type: 'array',
    },
    invalid: {
      description:
        'A list of the scenario identifiers that – when used to compile this unlocking script and the script it unlocks – result in a compilation error.\n\nThese scenarios can be used to test this script in development and review.',
      items: { type: 'string' },
      type: 'array',
    },
    name: {
      description:
        'A single-line, human-readable name for this script (for use in user interfaces).',
      type: 'string',
    },
    passes: {
      description:
        'A list of the scenario identifiers that – when used to compile this unlocking script and the script it unlocks – result in bytecode that passes program verification.\n\nThese scenarios can be used to test this script in development and review.',
      items: { type: 'string' },
      type: 'array',
    },
    script: {
      description: 'The script definition in CashAssembly.',
      type: 'string',
    },
    timeLockType: {
      description:
        "The expected type of time locks in this script.\n\nBecause `OP_CHECKLOCKTIMEVERIFY` reads from a transaction's `locktime` property, every input to a given transaction must share the same time lock type. This differs from `OP_CHECKSEQUENCEVERIFY` in that each input has its own `sequenceNumber`, so compatibility is not required.\n\nIf a transaction includes multiple inputs using scripts with `timeLockType` defined, and the types are not compatible, generation should fail.\n\nThe `timestamp` type indicates that the transaction's locktime is provided as a UNIX timestamp (the `locktime` value is greater than or equal to `500000000`).\n\nThe `height` type indicates that the transaction's locktime is provided as a block height (the `locktime` value is less than `500000000`).\n\nIf `timeLockType` is undefined, the script is assumed to have no reliance on absolute time locks.",
      enum: ['height', 'timestamp'],
      type: 'string',
    },
    unlocks: {
      description:
        'The identifier of the script that can be unlocked by this script.\n\nThe presence of the `unlocks` property indicates that this script is an unlocking script, and the script it unlocks must be a locking script.',
      type: 'string',
    },
  },
  required: ['script', 'unlocks'],
  type: 'object',
};
const schema42 = {
  description:
    "Allowable identifiers for authentication virtual machine versions. The `BCH` prefix identifies the Bitcoin Cash network, the `XEC` prefix identifies the eCash network, the `BSV` prefix identifies the Bitcoin SV network, and the `BTC` prefix identifies the Bitcoin Core network. VM versions are named according to the date they were deployed on the indicated network.\n\nFor each network prefix, a `_SPEC` VM version is reserved to indicate that the template requires a custom, not-yet-deployed VM version (e.g. one or more CHIPs). By convention, templates marked for `_SPEC` VMs should indicate their requirements in the template description. After deployment of the `_SPEC` VM, when template compatibility is verified, the template's `supported` array should be updated to indicate compatibility with the live VM version.",
  enum: [
    'BCH_2020_05',
    'BCH_2021_05',
    'BCH_2022_05',
    'BCH_2023_05',
    'BCH_SPEC',
    'BSV_2020_02',
    'BSV_SPEC',
    'BTC_2017_08',
    'BTC_SPEC',
    'XEC_2020_05',
    'XEC_SPEC',
  ],
  type: 'string',
};
const schema24 = {
  additionalProperties: false,
  description:
    'An object describing the configuration for a particular entity within an wallet template.',
  properties: {
    description: {
      description:
        'An optionally multi-line, free-form, human-readable description for this entity (for use in user interfaces). If displayed, this description should use a monospace font to properly render ASCII diagrams.',
      type: 'string',
    },
    name: {
      description:
        'A single-line, Title Case, human-readable name for this entity for use in user interfaces and error messages, e.g.: `Trusted Third-Party`.',
      type: 'string',
    },
    scripts: {
      description:
        'An array of the identifiers of each script the entity must be capable of generating, e.g. each of the unlocking scripts this entity might use.\n\nProvided the necessary variables, any entity can construct any script, but this option allows us to hint to more advanced wallets which scripts to recommend to users. (Especially when many scripts require inter-entity communication initiated by a user.)\n\nIf not provided, this property is assumed to include all scripts in the template.',
      items: { type: 'string' },
      type: 'array',
    },
    variables: {
      additionalProperties: { $ref: '#/definitions/WalletTemplateVariable' },
      description:
        "A map of variables that must be provided by this entity for use in the template's scripts. Some variables are required before locking script generation, while some variables can or must be resolved only before unlocking script generation.\n\nObject keys are used as variable identifiers, and by convention, should use `snake_case`.",
      type: 'object',
    },
  },
  type: 'object',
};
const schema25 = {
  anyOf: [
    { $ref: '#/definitions/WalletTemplateAddressData' },
    { $ref: '#/definitions/WalletTemplateHdKey' },
    { $ref: '#/definitions/WalletTemplateKey' },
    { $ref: '#/definitions/WalletTemplateWalletData' },
  ],
};
const schema26 = {
  additionalProperties: false,
  properties: {
    description: {
      description:
        'A single-line, human readable description for this variable (for use in user interfaces).',
      type: 'string',
    },
    name: {
      description:
        'A single-line, Title Case, human-readable name for this variable (for use in user interfaces).',
      type: 'string',
    },
    type: { const: 'AddressData', type: 'string' },
  },
  required: ['type'],
  type: 'object',
};
const schema27 = {
  additionalProperties: false,
  properties: {
    addressOffset: {
      description:
        'The offset by which to increment the `addressIndex` provided in the compilation data when deriving this `HdKey`. (Default: 0)\n\nThis is useful for deriving the "next" (`1`) or "previous" (`-1`) address to be used in the current compiler configuration.',
      type: 'number',
    },
    description: {
      description:
        'A single-line, human readable description for this variable (for use in user interfaces).',
      type: 'string',
    },
    hdPublicKeyDerivationPath: {
      description:
        "The path to derive the entity's HD public key from the entity's master HD private key. By default, `m` (i.e. the entity's HD public key represents the same node in the HD tree as its HD private key).\n\nThis can be used to specify another derivation path from which the `publicDerivationPath` begins, e.g. `m/0'/1'/2'`. See `publicDerivationPath` for details.\n\nThis path must begin with an `m` (private derivation) and be fixed – it cannot contain an `i` character to represent the address index, as a dynamic hardened path would require a new HD public key for each address.",
      type: 'string',
    },
    name: {
      description:
        'A single-line, Title Case, human-readable name for this variable (for use in user interfaces).',
      type: 'string',
    },
    neverSignTwice: {
      description:
        'If set to `true`, indicates that this key should never be used to sign two different messages.\n\nThis is useful for contracts that use zero-confirmation escrow systems to guarantee against double-spend attempts. By indicating that the user could be subjected to losses if a key were used in multiple signatures, templates can ensure that wallet implementations apply appropriate safeguards around use of the key.\n\nDefaults to `false`.',
      type: 'boolean',
    },
    privateDerivationPath: {
      description:
        "The derivation path used to derive this `HdKey` from the owning entity's HD private key. By default, `m/i`.\n\nThis path uses the notation specified in BIP32 and the `i` character to represent the location of the `addressIndex`:\n\nThe first character must be `m` (private derivation), followed by sets of `/` and a number representing the child index used in the derivation at that depth. Hardened derivation is represented by a trailing `'`, and hardened child indexes are represented with the hardened index offset (`2147483648`) subtracted. The `i` character is replaced with the value of `addressIndex` plus this `HdKey`'s `addressOffset`. If the `i` character is followed by `'`, the hardened index offset is added (`2147483648`) and hardened derivation is used.\n\nFor example, `m/0/1'/i'` uses 3 levels of derivation, with child indexes in the following order:\n\n`derive(derive(derive(node, 0), 2147483648 + 1), 2147483648 + addressIndex + addressOffset)`\n\nBecause hardened derivation requires knowledge of the private key, `HdKey` variables with `derivationPath`s that include hardened derivation cannot use HD public derivation (the `hdPublicKeys` property in `CompilationData`). Instead, compilation requires the respective HD private key (`CompilationData.hdKeys.hdPrivateKeys`) or the fully-derived public key (`CompilationData.hdKeys.derivedPublicKeys`).",
      type: 'string',
    },
    publicDerivationPath: {
      description:
        "The derivation path used to derive this `HdKey`'s public key from the owning entity's HD public key. If not set, the public equivalent of `privateDerivationPath` is used. For the `privateDerivationPath` default of `m/i`, this is `M/i`.\n\nIf `privateDerivationPath` uses hardened derivation for some levels, but later derivation levels use non-hardened derivation, `publicDerivationPath` can be used to specify a public derivation path beginning from `hdPublicKeyDerivationPath` (i.e. `publicDerivationPath` should always be a non-hardened segment of `privateDerivationPath` that follows `hdPublicKeyDerivationPath`).\n\nThe first character must be `M` (public derivation), followed by sets of `/` and a number representing the child index used in the non-hardened derivation at that depth.\n\nFor example, if `privateDerivationPath` is `m/0'/i`, it is not possible to derive the equivalent public key with only the HD public key `M`. (The path \"`M/0'/i`\" is impossible.) However, given the HD public key for `m/0'`, it is possible to derive the public key of `m/0'/i` for any `i`. In this case, `hdPublicKeyDerivationPath` would be `m/0'` and `publicDerivationPath` would be the remaining `M/i`.",
      type: 'string',
    },
    type: { const: 'HdKey', type: 'string' },
  },
  required: ['type'],
  type: 'object',
};
const schema28 = {
  additionalProperties: false,
  properties: {
    description: {
      description:
        'A single-line, human readable description for this variable (for use in user interfaces).',
      type: 'string',
    },
    name: {
      description:
        'A single-line, Title Case, human-readable name for this variable (for use in user interfaces).',
      type: 'string',
    },
    neverSignTwice: {
      description:
        'If set to `true`, indicates that this key should never be used to sign two different messages.\n\nThis is useful for contracts that use zero-confirmation escrow systems to guarantee against double-spend attempts. By indicating that the user could be subjected to losses if a key were used in multiple signatures, templates can ensure that wallet implementations apply appropriate safeguards around use of the key.\n\nDefaults to `false`.',
      type: 'boolean',
    },
    type: { const: 'Key', type: 'string' },
  },
  required: ['type'],
  type: 'object',
};
const schema29 = {
  additionalProperties: false,
  properties: {
    description: {
      description:
        'A single-line, human readable description for this variable (for use in user interfaces).',
      type: 'string',
    },
    name: {
      description:
        'A single-line, Title Case, human-readable name for this variable (for use in user interfaces).',
      type: 'string',
    },
    type: { const: 'WalletData', type: 'string' },
  },
  required: ['type'],
  type: 'object',
};
function validate23(
  data,
  { instancePath = '', parentData, parentDataProperty, rootData = data } = {},
) {
  let vErrors = null;
  let errors = 0;
  const _errs0 = errors;
  let valid0 = false;
  const _errs1 = errors;
  const _errs2 = errors;
  if (errors === _errs2) {
    if (data && typeof data == 'object' && !Array.isArray(data)) {
      let missing0;
      if (data.type === undefined && (missing0 = 'type')) {
        const err0 = {
          instancePath,
          schemaPath: '#/definitions/WalletTemplateAddressData/required',
          keyword: 'required',
          params: { missingProperty: missing0 },
          message: "must have required property '" + missing0 + "'",
        };
        if (vErrors === null) {
          vErrors = [err0];
        } else {
          vErrors.push(err0);
        }
        errors++;
      } else {
        const _errs4 = errors;
        for (const key0 in data) {
          if (!(key0 === 'description' || key0 === 'name' || key0 === 'type')) {
            const err1 = {
              instancePath,
              schemaPath:
                '#/definitions/WalletTemplateAddressData/additionalProperties',
              keyword: 'additionalProperties',
              params: { additionalProperty: key0 },
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
        if (_errs4 === errors) {
          if (data.description !== undefined) {
            const _errs5 = errors;
            if (typeof data.description !== 'string') {
              const err2 = {
                instancePath: instancePath + '/description',
                schemaPath:
                  '#/definitions/WalletTemplateAddressData/properties/description/type',
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
            var valid2 = _errs5 === errors;
          } else {
            var valid2 = true;
          }
          if (valid2) {
            if (data.name !== undefined) {
              const _errs7 = errors;
              if (typeof data.name !== 'string') {
                const err3 = {
                  instancePath: instancePath + '/name',
                  schemaPath:
                    '#/definitions/WalletTemplateAddressData/properties/name/type',
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
              var valid2 = _errs7 === errors;
            } else {
              var valid2 = true;
            }
            if (valid2) {
              if (data.type !== undefined) {
                let data2 = data.type;
                const _errs9 = errors;
                if (typeof data2 !== 'string') {
                  const err4 = {
                    instancePath: instancePath + '/type',
                    schemaPath:
                      '#/definitions/WalletTemplateAddressData/properties/type/type',
                    keyword: 'type',
                    params: { type: 'string' },
                    message: 'must be string',
                  };
                  if (vErrors === null) {
                    vErrors = [err4];
                  } else {
                    vErrors.push(err4);
                  }
                  errors++;
                }
                if ('AddressData' !== data2) {
                  const err5 = {
                    instancePath: instancePath + '/type',
                    schemaPath:
                      '#/definitions/WalletTemplateAddressData/properties/type/const',
                    keyword: 'const',
                    params: { allowedValue: 'AddressData' },
                    message: 'must be equal to constant',
                  };
                  if (vErrors === null) {
                    vErrors = [err5];
                  } else {
                    vErrors.push(err5);
                  }
                  errors++;
                }
                var valid2 = _errs9 === errors;
              } else {
                var valid2 = true;
              }
            }
          }
        }
      }
    } else {
      const err6 = {
        instancePath,
        schemaPath: '#/definitions/WalletTemplateAddressData/type',
        keyword: 'type',
        params: { type: 'object' },
        message: 'must be object',
      };
      if (vErrors === null) {
        vErrors = [err6];
      } else {
        vErrors.push(err6);
      }
      errors++;
    }
  }
  var _valid0 = _errs1 === errors;
  valid0 = valid0 || _valid0;
  if (!valid0) {
    const _errs11 = errors;
    const _errs12 = errors;
    if (errors === _errs12) {
      if (data && typeof data == 'object' && !Array.isArray(data)) {
        let missing1;
        if (data.type === undefined && (missing1 = 'type')) {
          const err7 = {
            instancePath,
            schemaPath: '#/definitions/WalletTemplateHdKey/required',
            keyword: 'required',
            params: { missingProperty: missing1 },
            message: "must have required property '" + missing1 + "'",
          };
          if (vErrors === null) {
            vErrors = [err7];
          } else {
            vErrors.push(err7);
          }
          errors++;
        } else {
          const _errs14 = errors;
          for (const key1 in data) {
            if (
              !(
                key1 === 'addressOffset' ||
                key1 === 'description' ||
                key1 === 'hdPublicKeyDerivationPath' ||
                key1 === 'name' ||
                key1 === 'neverSignTwice' ||
                key1 === 'privateDerivationPath' ||
                key1 === 'publicDerivationPath' ||
                key1 === 'type'
              )
            ) {
              const err8 = {
                instancePath,
                schemaPath:
                  '#/definitions/WalletTemplateHdKey/additionalProperties',
                keyword: 'additionalProperties',
                params: { additionalProperty: key1 },
                message: 'must NOT have additional properties',
              };
              if (vErrors === null) {
                vErrors = [err8];
              } else {
                vErrors.push(err8);
              }
              errors++;
              break;
            }
          }
          if (_errs14 === errors) {
            if (data.addressOffset !== undefined) {
              let data3 = data.addressOffset;
              const _errs15 = errors;
              if (!(typeof data3 == 'number' && isFinite(data3))) {
                const err9 = {
                  instancePath: instancePath + '/addressOffset',
                  schemaPath:
                    '#/definitions/WalletTemplateHdKey/properties/addressOffset/type',
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
              var valid4 = _errs15 === errors;
            } else {
              var valid4 = true;
            }
            if (valid4) {
              if (data.description !== undefined) {
                const _errs17 = errors;
                if (typeof data.description !== 'string') {
                  const err10 = {
                    instancePath: instancePath + '/description',
                    schemaPath:
                      '#/definitions/WalletTemplateHdKey/properties/description/type',
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
                var valid4 = _errs17 === errors;
              } else {
                var valid4 = true;
              }
              if (valid4) {
                if (data.hdPublicKeyDerivationPath !== undefined) {
                  const _errs19 = errors;
                  if (typeof data.hdPublicKeyDerivationPath !== 'string') {
                    const err11 = {
                      instancePath: instancePath + '/hdPublicKeyDerivationPath',
                      schemaPath:
                        '#/definitions/WalletTemplateHdKey/properties/hdPublicKeyDerivationPath/type',
                      keyword: 'type',
                      params: { type: 'string' },
                      message: 'must be string',
                    };
                    if (vErrors === null) {
                      vErrors = [err11];
                    } else {
                      vErrors.push(err11);
                    }
                    errors++;
                  }
                  var valid4 = _errs19 === errors;
                } else {
                  var valid4 = true;
                }
                if (valid4) {
                  if (data.name !== undefined) {
                    const _errs21 = errors;
                    if (typeof data.name !== 'string') {
                      const err12 = {
                        instancePath: instancePath + '/name',
                        schemaPath:
                          '#/definitions/WalletTemplateHdKey/properties/name/type',
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
                    var valid4 = _errs21 === errors;
                  } else {
                    var valid4 = true;
                  }
                  if (valid4) {
                    if (data.neverSignTwice !== undefined) {
                      const _errs23 = errors;
                      if (typeof data.neverSignTwice !== 'boolean') {
                        const err13 = {
                          instancePath: instancePath + '/neverSignTwice',
                          schemaPath:
                            '#/definitions/WalletTemplateHdKey/properties/neverSignTwice/type',
                          keyword: 'type',
                          params: { type: 'boolean' },
                          message: 'must be boolean',
                        };
                        if (vErrors === null) {
                          vErrors = [err13];
                        } else {
                          vErrors.push(err13);
                        }
                        errors++;
                      }
                      var valid4 = _errs23 === errors;
                    } else {
                      var valid4 = true;
                    }
                    if (valid4) {
                      if (data.privateDerivationPath !== undefined) {
                        const _errs25 = errors;
                        if (typeof data.privateDerivationPath !== 'string') {
                          const err14 = {
                            instancePath:
                              instancePath + '/privateDerivationPath',
                            schemaPath:
                              '#/definitions/WalletTemplateHdKey/properties/privateDerivationPath/type',
                            keyword: 'type',
                            params: { type: 'string' },
                            message: 'must be string',
                          };
                          if (vErrors === null) {
                            vErrors = [err14];
                          } else {
                            vErrors.push(err14);
                          }
                          errors++;
                        }
                        var valid4 = _errs25 === errors;
                      } else {
                        var valid4 = true;
                      }
                      if (valid4) {
                        if (data.publicDerivationPath !== undefined) {
                          const _errs27 = errors;
                          if (typeof data.publicDerivationPath !== 'string') {
                            const err15 = {
                              instancePath:
                                instancePath + '/publicDerivationPath',
                              schemaPath:
                                '#/definitions/WalletTemplateHdKey/properties/publicDerivationPath/type',
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
                          var valid4 = _errs27 === errors;
                        } else {
                          var valid4 = true;
                        }
                        if (valid4) {
                          if (data.type !== undefined) {
                            let data10 = data.type;
                            const _errs29 = errors;
                            if (typeof data10 !== 'string') {
                              const err16 = {
                                instancePath: instancePath + '/type',
                                schemaPath:
                                  '#/definitions/WalletTemplateHdKey/properties/type/type',
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
                            if ('HdKey' !== data10) {
                              const err17 = {
                                instancePath: instancePath + '/type',
                                schemaPath:
                                  '#/definitions/WalletTemplateHdKey/properties/type/const',
                                keyword: 'const',
                                params: { allowedValue: 'HdKey' },
                                message: 'must be equal to constant',
                              };
                              if (vErrors === null) {
                                vErrors = [err17];
                              } else {
                                vErrors.push(err17);
                              }
                              errors++;
                            }
                            var valid4 = _errs29 === errors;
                          } else {
                            var valid4 = true;
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
        const err18 = {
          instancePath,
          schemaPath: '#/definitions/WalletTemplateHdKey/type',
          keyword: 'type',
          params: { type: 'object' },
          message: 'must be object',
        };
        if (vErrors === null) {
          vErrors = [err18];
        } else {
          vErrors.push(err18);
        }
        errors++;
      }
    }
    var _valid0 = _errs11 === errors;
    valid0 = valid0 || _valid0;
    if (!valid0) {
      const _errs31 = errors;
      const _errs32 = errors;
      if (errors === _errs32) {
        if (data && typeof data == 'object' && !Array.isArray(data)) {
          let missing2;
          if (data.type === undefined && (missing2 = 'type')) {
            const err19 = {
              instancePath,
              schemaPath: '#/definitions/WalletTemplateKey/required',
              keyword: 'required',
              params: { missingProperty: missing2 },
              message: "must have required property '" + missing2 + "'",
            };
            if (vErrors === null) {
              vErrors = [err19];
            } else {
              vErrors.push(err19);
            }
            errors++;
          } else {
            const _errs34 = errors;
            for (const key2 in data) {
              if (
                !(
                  key2 === 'description' ||
                  key2 === 'name' ||
                  key2 === 'neverSignTwice' ||
                  key2 === 'type'
                )
              ) {
                const err20 = {
                  instancePath,
                  schemaPath:
                    '#/definitions/WalletTemplateKey/additionalProperties',
                  keyword: 'additionalProperties',
                  params: { additionalProperty: key2 },
                  message: 'must NOT have additional properties',
                };
                if (vErrors === null) {
                  vErrors = [err20];
                } else {
                  vErrors.push(err20);
                }
                errors++;
                break;
              }
            }
            if (_errs34 === errors) {
              if (data.description !== undefined) {
                const _errs35 = errors;
                if (typeof data.description !== 'string') {
                  const err21 = {
                    instancePath: instancePath + '/description',
                    schemaPath:
                      '#/definitions/WalletTemplateKey/properties/description/type',
                    keyword: 'type',
                    params: { type: 'string' },
                    message: 'must be string',
                  };
                  if (vErrors === null) {
                    vErrors = [err21];
                  } else {
                    vErrors.push(err21);
                  }
                  errors++;
                }
                var valid6 = _errs35 === errors;
              } else {
                var valid6 = true;
              }
              if (valid6) {
                if (data.name !== undefined) {
                  const _errs37 = errors;
                  if (typeof data.name !== 'string') {
                    const err22 = {
                      instancePath: instancePath + '/name',
                      schemaPath:
                        '#/definitions/WalletTemplateKey/properties/name/type',
                      keyword: 'type',
                      params: { type: 'string' },
                      message: 'must be string',
                    };
                    if (vErrors === null) {
                      vErrors = [err22];
                    } else {
                      vErrors.push(err22);
                    }
                    errors++;
                  }
                  var valid6 = _errs37 === errors;
                } else {
                  var valid6 = true;
                }
                if (valid6) {
                  if (data.neverSignTwice !== undefined) {
                    const _errs39 = errors;
                    if (typeof data.neverSignTwice !== 'boolean') {
                      const err23 = {
                        instancePath: instancePath + '/neverSignTwice',
                        schemaPath:
                          '#/definitions/WalletTemplateKey/properties/neverSignTwice/type',
                        keyword: 'type',
                        params: { type: 'boolean' },
                        message: 'must be boolean',
                      };
                      if (vErrors === null) {
                        vErrors = [err23];
                      } else {
                        vErrors.push(err23);
                      }
                      errors++;
                    }
                    var valid6 = _errs39 === errors;
                  } else {
                    var valid6 = true;
                  }
                  if (valid6) {
                    if (data.type !== undefined) {
                      let data14 = data.type;
                      const _errs41 = errors;
                      if (typeof data14 !== 'string') {
                        const err24 = {
                          instancePath: instancePath + '/type',
                          schemaPath:
                            '#/definitions/WalletTemplateKey/properties/type/type',
                          keyword: 'type',
                          params: { type: 'string' },
                          message: 'must be string',
                        };
                        if (vErrors === null) {
                          vErrors = [err24];
                        } else {
                          vErrors.push(err24);
                        }
                        errors++;
                      }
                      if ('Key' !== data14) {
                        const err25 = {
                          instancePath: instancePath + '/type',
                          schemaPath:
                            '#/definitions/WalletTemplateKey/properties/type/const',
                          keyword: 'const',
                          params: { allowedValue: 'Key' },
                          message: 'must be equal to constant',
                        };
                        if (vErrors === null) {
                          vErrors = [err25];
                        } else {
                          vErrors.push(err25);
                        }
                        errors++;
                      }
                      var valid6 = _errs41 === errors;
                    } else {
                      var valid6 = true;
                    }
                  }
                }
              }
            }
          }
        } else {
          const err26 = {
            instancePath,
            schemaPath: '#/definitions/WalletTemplateKey/type',
            keyword: 'type',
            params: { type: 'object' },
            message: 'must be object',
          };
          if (vErrors === null) {
            vErrors = [err26];
          } else {
            vErrors.push(err26);
          }
          errors++;
        }
      }
      var _valid0 = _errs31 === errors;
      valid0 = valid0 || _valid0;
      if (!valid0) {
        const _errs43 = errors;
        const _errs44 = errors;
        if (errors === _errs44) {
          if (data && typeof data == 'object' && !Array.isArray(data)) {
            let missing3;
            if (data.type === undefined && (missing3 = 'type')) {
              const err27 = {
                instancePath,
                schemaPath: '#/definitions/WalletTemplateWalletData/required',
                keyword: 'required',
                params: { missingProperty: missing3 },
                message: "must have required property '" + missing3 + "'",
              };
              if (vErrors === null) {
                vErrors = [err27];
              } else {
                vErrors.push(err27);
              }
              errors++;
            } else {
              const _errs46 = errors;
              for (const key3 in data) {
                if (
                  !(
                    key3 === 'description' ||
                    key3 === 'name' ||
                    key3 === 'type'
                  )
                ) {
                  const err28 = {
                    instancePath,
                    schemaPath:
                      '#/definitions/WalletTemplateWalletData/additionalProperties',
                    keyword: 'additionalProperties',
                    params: { additionalProperty: key3 },
                    message: 'must NOT have additional properties',
                  };
                  if (vErrors === null) {
                    vErrors = [err28];
                  } else {
                    vErrors.push(err28);
                  }
                  errors++;
                  break;
                }
              }
              if (_errs46 === errors) {
                if (data.description !== undefined) {
                  const _errs47 = errors;
                  if (typeof data.description !== 'string') {
                    const err29 = {
                      instancePath: instancePath + '/description',
                      schemaPath:
                        '#/definitions/WalletTemplateWalletData/properties/description/type',
                      keyword: 'type',
                      params: { type: 'string' },
                      message: 'must be string',
                    };
                    if (vErrors === null) {
                      vErrors = [err29];
                    } else {
                      vErrors.push(err29);
                    }
                    errors++;
                  }
                  var valid8 = _errs47 === errors;
                } else {
                  var valid8 = true;
                }
                if (valid8) {
                  if (data.name !== undefined) {
                    const _errs49 = errors;
                    if (typeof data.name !== 'string') {
                      const err30 = {
                        instancePath: instancePath + '/name',
                        schemaPath:
                          '#/definitions/WalletTemplateWalletData/properties/name/type',
                        keyword: 'type',
                        params: { type: 'string' },
                        message: 'must be string',
                      };
                      if (vErrors === null) {
                        vErrors = [err30];
                      } else {
                        vErrors.push(err30);
                      }
                      errors++;
                    }
                    var valid8 = _errs49 === errors;
                  } else {
                    var valid8 = true;
                  }
                  if (valid8) {
                    if (data.type !== undefined) {
                      let data17 = data.type;
                      const _errs51 = errors;
                      if (typeof data17 !== 'string') {
                        const err31 = {
                          instancePath: instancePath + '/type',
                          schemaPath:
                            '#/definitions/WalletTemplateWalletData/properties/type/type',
                          keyword: 'type',
                          params: { type: 'string' },
                          message: 'must be string',
                        };
                        if (vErrors === null) {
                          vErrors = [err31];
                        } else {
                          vErrors.push(err31);
                        }
                        errors++;
                      }
                      if ('WalletData' !== data17) {
                        const err32 = {
                          instancePath: instancePath + '/type',
                          schemaPath:
                            '#/definitions/WalletTemplateWalletData/properties/type/const',
                          keyword: 'const',
                          params: { allowedValue: 'WalletData' },
                          message: 'must be equal to constant',
                        };
                        if (vErrors === null) {
                          vErrors = [err32];
                        } else {
                          vErrors.push(err32);
                        }
                        errors++;
                      }
                      var valid8 = _errs51 === errors;
                    } else {
                      var valid8 = true;
                    }
                  }
                }
              }
            }
          } else {
            const err33 = {
              instancePath,
              schemaPath: '#/definitions/WalletTemplateWalletData/type',
              keyword: 'type',
              params: { type: 'object' },
              message: 'must be object',
            };
            if (vErrors === null) {
              vErrors = [err33];
            } else {
              vErrors.push(err33);
            }
            errors++;
          }
        }
        var _valid0 = _errs43 === errors;
        valid0 = valid0 || _valid0;
      }
    }
  }
  if (!valid0) {
    const err34 = {
      instancePath,
      schemaPath: '#/anyOf',
      keyword: 'anyOf',
      params: {},
      message: 'must match a schema in anyOf',
    };
    if (vErrors === null) {
      vErrors = [err34];
    } else {
      vErrors.push(err34);
    }
    errors++;
    validate23.errors = vErrors;
    return false;
  } else {
    errors = _errs0;
    if (vErrors !== null) {
      if (_errs0) {
        vErrors.length = _errs0;
      } else {
        vErrors = null;
      }
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
      const _errs1 = errors;
      for (const key0 in data) {
        if (
          !(
            key0 === 'description' ||
            key0 === 'name' ||
            key0 === 'scripts' ||
            key0 === 'variables'
          )
        ) {
          validate22.errors = [
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
            validate22.errors = [
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
          if (data.name !== undefined) {
            const _errs4 = errors;
            if (typeof data.name !== 'string') {
              validate22.errors = [
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
            var valid0 = _errs4 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.scripts !== undefined) {
              let data2 = data.scripts;
              const _errs6 = errors;
              if (errors === _errs6) {
                if (Array.isArray(data2)) {
                  var valid1 = true;
                  const len0 = data2.length;
                  for (let i0 = 0; i0 < len0; i0++) {
                    const _errs8 = errors;
                    if (typeof data2[i0] !== 'string') {
                      validate22.errors = [
                        {
                          instancePath: instancePath + '/scripts/' + i0,
                          schemaPath: '#/properties/scripts/items/type',
                          keyword: 'type',
                          params: { type: 'string' },
                          message: 'must be string',
                        },
                      ];
                      return false;
                    }
                    var valid1 = _errs8 === errors;
                    if (!valid1) {
                      break;
                    }
                  }
                } else {
                  validate22.errors = [
                    {
                      instancePath: instancePath + '/scripts',
                      schemaPath: '#/properties/scripts/type',
                      keyword: 'type',
                      params: { type: 'array' },
                      message: 'must be array',
                    },
                  ];
                  return false;
                }
              }
              var valid0 = _errs6 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.variables !== undefined) {
                let data4 = data.variables;
                const _errs10 = errors;
                if (errors === _errs10) {
                  if (
                    data4 &&
                    typeof data4 == 'object' &&
                    !Array.isArray(data4)
                  ) {
                    for (const key1 in data4) {
                      const _errs13 = errors;
                      if (
                        !validate23(data4[key1], {
                          instancePath:
                            instancePath +
                            '/variables/' +
                            key1.replace(/~/g, '~0').replace(/\//g, '~1'),
                          parentData: data4,
                          parentDataProperty: key1,
                          rootData,
                        })
                      ) {
                        vErrors =
                          vErrors === null
                            ? validate23.errors
                            : vErrors.concat(validate23.errors);
                        errors = vErrors.length;
                      }
                      var valid2 = _errs13 === errors;
                      if (!valid2) {
                        break;
                      }
                    }
                  } else {
                    validate22.errors = [
                      {
                        instancePath: instancePath + '/variables',
                        schemaPath: '#/properties/variables/type',
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
            }
          }
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
const schema30 = {
  additionalProperties: false,
  description:
    'An object describing the configuration for a particular scenario within an wallet template.',
  properties: {
    data: {
      $ref: '#/definitions/WalletTemplateScenarioData',
      description:
        "An object defining the data to use while compiling this scenario. The properties specified here are used to extend the existing scenario data based on this scenario's `extends` property.\n\nEach property is extended individually – to unset a previously-set property, the property must be individually overridden in this object.",
    },
    description: {
      description:
        'An optionally multi-line, free-form, human-readable description for this scenario (for use in user interfaces). If displayed, this description should use a monospace font to properly render ASCII diagrams.',
      type: 'string',
    },
    extends: {
      description:
        "The identifier of the scenario that this scenario extends. Any `data` or `transaction` properties not defined in this scenario inherit from the extended parent scenario.\n\nIf undefined, this scenario is assumed to extend the default scenario:\n\n- The default values for `data` are set:   - The identifiers of all `Key` variables and entities in this template are lexicographically sorted, then each is assigned an incrementing positive integer – beginning with `1` – encoded as an unsigned, 256-bit, big-endian integer (i.e. `0x0000...0001` (32 bytes), `0x0000...0002`, `0x0000...0003`, etc.). For `Key`s, this assigned value is used as the private key; For entities, the assigned value is used as the master seed of that entity's `HdPrivateKey`. If `hdKey` is set, the `addressIndex` is set to `0`.   - `currentBlockHeight` is set to `2`. This is the height of the second mined block after the genesis block: `000000006a625f06636b8bb6ac7b960a8d03705d1ace08b1a19da3fdcc99ddbd`. This default value was chosen to be low enough to simplify the debugging of block height offsets while remaining differentiated from `0` and `1`, which are used both as boolean return values and for control flow.   - `currentBlockTime` is set to `1231469665`. This is the Median Time-Past block time (BIP113) of block `2`.\n\n- Then `transaction` is set based on use:   - if the scenario is being used for transaction estimation, all transaction properties are taken from the transaction being estimated.   - if the scenario is being used for script testing and validation, the default value for each `transaction` property is used.\n\nWhen a scenario is extended, each property of `data` and `transaction` is extended individually: if the extending scenario does not provide a new value for `data.bytecode.value` or `transaction.property`, the parent value is used. To avoid inheriting a parent value, each child value must be individually overridden.",
      type: 'string',
    },
    name: {
      description:
        'A single-line, Title Case, human-readable name for this scenario for use in user interfaces, e.g.: `Delayed Recovery`.',
      type: 'string',
    },
    sourceOutputs: {
      description:
        'The list of source outputs (a.k.a. UTXOs) to use when generating the compilation context for this scenario.\n\nThe `sourceOutputs` property must have the same length as `transaction.inputs`, and each source output must be ordered to match the index of the input that spends it.\n\nTo be valid the `sourceOutputs` property must have exactly one source output with `lockingBytecode` set to `["slot"]` – the output at the same index as the `["slot"]` input in `transaction.inputs`.\n\nIf undefined, defaults to `[{ "lockingBytecode": ["slot"] }]`.',
      items: { $ref: '#/definitions/WalletTemplateScenarioSourceOutput' },
      type: 'array',
    },
    transaction: {
      additionalProperties: false,
      description:
        'The transaction within which this scenario should be evaluated. This is used for script testing and validation.\n\nIf undefined, inherits the default value for each property: ```json {   "inputs": [{ "unlockingBytecode": [\'slot\'] }],   "locktime": 0,   "outputs": [{ "lockingBytecode": {} }],   "version": 2 } ```\n\nAny `transaction` property that is not set will be inherited from the scenario specified by `extends`. when specifying the `inputs` and `outputs` properties, each input and output extends the default values for inputs and outputs, respectively.\n\nFor example, an input of `{}` is interpreted as: ```json {   "outpointIndex": 0,   "outpointTransactionHash":     "0000000000000000000000000000000000000000000000000000000000000000",   "sequenceNumber": 0,   "unlockingBytecode": [\'slot\'] } ``` And an output of `{}` is interpreted as: ```json {   "lockingBytecode": {     "script": [\'copy\'],     "overrides": { "hdKeys": { "addressIndex": 1 } }   },   "valueSatoshis": 0 } ```',
      properties: {
        inputs: {
          description:
            'The list of inputs to use when generating the transaction for this scenario.\n\nTo be valid the `inputs` property must have exactly one input with `unlockingBytecode` set to `["slot"]`. This is the input in which the unlocking script under test will be placed.\n\nIf undefined, inherits the default scenario `inputs` value: `[{ "unlockingBytecode": ["slot"] }]`.',
          items: { $ref: '#/definitions/WalletTemplateScenarioInput' },
          type: 'array',
        },
        locktime: {
          description:
            'The locktime to use when generating the transaction for this scenario. A positive integer from `0` to a maximum of `4294967295` – if undefined, defaults to `0`.\n\nLocktime can be provided as either a timestamp or a block height. Values less than `500000000` are understood to be a block height (the current block number in the chain, beginning from block `0`). Values greater than or equal to `500000000` are understood to be a UNIX timestamp.\n\nFor validating timestamp values, the median timestamp of the last 11 blocks (Median Time-Past) is used. The precise behavior is defined in BIP113.\n\nIf the `sequenceNumber` of every transaction input is set to `0xffffffff` (`4294967295`), locktime is disabled, and the transaction may be added to a block even if the specified locktime has not yet been reached. When locktime is disabled, if an `OP_CHECKLOCKTIMEVERIFY` operation is encountered during the verification of any input, an error is produced, and the transaction is invalid.',
          type: 'number',
        },
        outputs: {
          description:
            'The list of outputs to use when generating the transaction for this scenario.\n\nIf undefined, defaults to `[{ "lockingBytecode": {} }]`.',
          items: {
            $ref: '#/definitions/WalletTemplateScenarioTransactionOutput',
          },
          type: 'array',
        },
        version: {
          description:
            'The version to use when generating the transaction for this scenario. A positive integer from `0` to a maximum of `4294967295` – if undefined, inherits the default scenario `version` value: `2`.',
          type: 'number',
        },
      },
      type: 'object',
    },
  },
  type: 'object',
};
const schema31 = {
  additionalProperties: false,
  description: 'An object defining the data to use while compiling a scenario.',
  properties: {
    bytecode: {
      additionalProperties: { type: 'string' },
      description:
        "A map of full identifiers to CashAssembly scripts that compile to each identifier's value for this scenario. Allowing `bytecode` to be specified as scripts (rather than e.g. hex) offers greater power and flexibility.\n\nBytecode scripts have access to each other and all other template scripts and defined variables, however, cyclical references will produce an error at compile time. Also, because the results of these compilations will be used to generate the compilation context for this scenario, these scripts may not use compiler operations that themselves require access to compilation context (e.g. signatures).\n\nThe provided `fullIdentifier` should match the complete identifier for each item, e.g. `some_wallet_data`, `variable_id.public_key`, or `variable_id.signature.all_outputs`.\n\nAll `AddressData` and `WalletData` variables must be provided via `bytecode` (though the default scenario automatically includes reasonable values), and pre-computed results for operations of other variable types (e.g. `key.public_key`) may also be provided via this property.\n\nBecause each bytecode identifier may precisely match the identifier of the variable it defines for this scenario, references between these scripts must refer to the target script with a `_scenario.` prefix. E.g. to reference a sibling script `my_foo` from `my_bar`, the `my_bar` script must use the identifier `_scenario.my_foo`.",
      type: 'object',
    },
    currentBlockHeight: {
      description:
        'The current block height at the "address creation time" implied in this scenario.',
      type: 'number',
    },
    currentBlockTime: {
      description:
        'The current MTP block time as a UNIX timestamp at the "address creation time" implied in this scenario.\n\nNote, this is never a current timestamp, but rather the median timestamp of the last 11 blocks. It is therefore approximately one hour in the past.\n\nEvery block has a precise MTP block time, much like a block height. See BIP113 for details.',
      type: 'number',
    },
    hdKeys: {
      additionalProperties: false,
      description:
        'An object describing the settings used for `HdKey` variables in this scenario.',
      properties: {
        addressIndex: {
          description:
            'The current address index to be used for this scenario. The `addressIndex` gets added to each `HdKey`s `addressOffset` to calculate the dynamic index (`i`) used in each `privateDerivationPath` or `publicDerivationPath`.\n\nThis is required for any compiler operation that requires derivation. Typically, the value is incremented by one for each address in a wallet.\n\nDefaults to `0`.',
          type: 'number',
        },
        hdPrivateKeys: {
          additionalProperties: { type: 'string' },
          description:
            'A map of entity IDs to master HD private keys. These master HD private keys are used to derive each `HdKey` variable assigned to that entity according to its `privateDerivationPath`.\n\nHD private keys may be encoded for either mainnet or testnet (the network information is ignored).\n\nIf both an HD private key (in `hdPrivateKeys`) and HD public key (in `hdPublicKeys`) are provided for the same entity in the same scenario (not recommended), the HD private key is used.',
          type: 'object',
        },
        hdPublicKeys: {
          additionalProperties: { type: 'string' },
          description:
            'A map of entity IDs to HD public keys. These HD public keys are used to derive public keys for each `HdKey` variable assigned to that entity according to its `publicDerivationPath`.\n\nHD public keys may be encoded for either mainnet or testnet (the network information is ignored).\n\nIf both an HD private key (in `hdPrivateKeys`) and HD public key (in `hdPublicKeys`) are provided for the same entity in the same scenario (not recommended), the HD private key is used.',
          type: 'object',
        },
      },
      type: 'object',
    },
    keys: {
      additionalProperties: false,
      description:
        'An object describing the settings used for `Key` variables in this scenario.',
      properties: {
        privateKeys: {
          additionalProperties: { type: 'string' },
          description:
            'A map of `Key` variable IDs to their 32-byte, hexadecimal-encoded private key values.',
          type: 'object',
        },
      },
      type: 'object',
    },
  },
  type: 'object',
};
const schema32 = {
  additionalProperties: false,
  description:
    'An example output used to define a scenario for a wallet template.',
  properties: {
    lockingBytecode: {
      anyOf: [
        { $ref: '#/definitions/WalletTemplateScenarioBytecode' },
        {
          items: { const: 'slot', type: 'string' },
          maxItems: 1,
          minItems: 1,
          type: 'array',
        },
      ],
      description:
        'The locking bytecode used to encumber this output.\n\n`lockingBytecode` values may be provided as a hexadecimal-encoded string or as an object describing the required compilation. If undefined, defaults to  `{}`, which uses the default values for `script` and `overrides`, respectively.\n\nOnly source outputs may specify a `lockingBytecode` of `["slot"]`; this identifies the source output in which the locking script under test will be placed. (To be valid, every scenario\'s `sourceOutputs` property must have exactly one source output slot and one input slot at the same index.)',
    },
    token: {
      additionalProperties: false,
      description:
        'The CashToken contents of this output. This property is only defined if the output contains one or more tokens. For details, see `CHIP-2022-02-CashTokens`.',
      properties: {
        amount: {
          description:
            'The number of fungible tokens (of `category`) held in this output.\n\nBecause `Number.MAX_SAFE_INTEGER` (`9007199254740991`) is less than the maximum token amount (`9223372036854775807`), this value may also be provided as a string, e.g. `"9223372036854775807"`.\n\nIf undefined, this defaults to: `0`.',
          type: ['number', 'string'],
        },
        category: {
          description:
            'The 32-byte, hexadecimal-encoded token category ID to which the token(s) in this output belong in big-endian byte order. This is the byte order typically seen in block explorers and user interfaces (as opposed to little-endian byte order, which is used in standard P2P network messages).\n\nIf undefined, this defaults to the value: `0000000000000000000000000000000000000000000000000000000000000002`',
          type: 'string',
        },
        nft: {
          additionalProperties: false,
          description:
            'If present, the non-fungible token (NFT) held by this output. If the output does not include a non-fungible token, `undefined`.',
          properties: {
            capability: {
              description:
                'The capability of this non-fungible token, must be either `minting`, `mutable`, or `none`.\n\nIf undefined, this defaults to: `none`.',
              enum: ['minting', 'mutable', 'none'],
              type: 'string',
            },
            commitment: {
              description:
                'The hex-encoded commitment contents included in the non-fungible token held in this output.\n\nIf undefined, this defaults to: `""` (a zero-length commitment).',
              type: 'string',
            },
          },
          type: 'object',
        },
      },
      type: 'object',
    },
    valueSatoshis: {
      description:
        'The value of the output in satoshis, the smallest unit of bitcoin.\n\nIn a valid transaction, this is a positive integer, from `0` to the maximum number of satoshis available to the transaction.\n\nThe maximum number of satoshis in existence is about 1/4 of `Number.MAX_SAFE_INTEGER` (`9007199254740991`), so typically, this value is defined using a `number`. However, this value may also be defined using a 16-character, hexadecimal-encoded `string`, to allow for the full range of the 64-bit unsigned, little-endian integer used to encode `valueSatoshis` in the encoded output format, e.g. `"ffffffffffffffff"`. This is useful for representing scenarios where intentionally excessive values are provided (to ensure an otherwise properly-signed transaction can never be included in the blockchain), e.g. transaction size estimations or off-chain Bitauth signatures.\n\nIf undefined, this defaults to: `0`.',
      type: ['number', 'string'],
    },
  },
  type: 'object',
};
const schema33 = {
  anyOf: [
    { type: 'string' },
    {
      additionalProperties: false,
      properties: {
        overrides: {
          $ref: '#/definitions/WalletTemplateScenarioData',
          description:
            'Scenario data that extends the scenario\'s top-level `data` during script compilation.\n\nEach property is extended individually – to modify a property set by the top-level scenario `data`, the new value must be listed here.\n\nDefaults to `{}` for `sourceOutputs` and `transaction.inputs`; defaults to `{ "hdKeys": { "addressIndex": 1 } }` for `transaction.outputs`.',
        },
        script: {
          anyOf: [
            { type: 'string' },
            {
              items: { const: 'copy', type: 'string' },
              maxItems: 1,
              minItems: 1,
              type: 'array',
            },
          ],
          description:
            'The identifier of the script to compile when generating this bytecode. May also be set to `["copy"]`, which is automatically replaced with the identifier of the locking or unlocking script under test, respectively.\n\nIf undefined, defaults to `["copy"]`.',
        },
      },
      type: 'object',
    },
  ],
  description:
    'A type that describes the configuration for a particular locking or unlocking bytecode within a wallet template scenario.\n\nBytecode may be specified as either a hexadecimal-encoded string or an object describing the required compilation.\n\nFor `sourceOutputs` and `transaction.inputs`, defaults to `{ script: ["copy"], overrides: {} }`. For `transaction.outputs`, defaults to `{ script: ["copy"], overrides: { "hdKeys": { "addressIndex": 1 } } }`.',
};
function validate28(
  data,
  { instancePath = '', parentData, parentDataProperty, rootData = data } = {},
) {
  let vErrors = null;
  let errors = 0;
  const _errs0 = errors;
  let valid0 = false;
  const _errs1 = errors;
  if (typeof data !== 'string') {
    const err0 = {
      instancePath,
      schemaPath: '#/anyOf/0/type',
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
  var _valid0 = _errs1 === errors;
  valid0 = valid0 || _valid0;
  if (!valid0) {
    const _errs3 = errors;
    if (errors === _errs3) {
      if (data && typeof data == 'object' && !Array.isArray(data)) {
        const _errs5 = errors;
        for (const key0 in data) {
          if (!(key0 === 'overrides' || key0 === 'script')) {
            const err1 = {
              instancePath,
              schemaPath: '#/anyOf/1/additionalProperties',
              keyword: 'additionalProperties',
              params: { additionalProperty: key0 },
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
        if (_errs5 === errors) {
          if (data.overrides !== undefined) {
            let data0 = data.overrides;
            const _errs6 = errors;
            const _errs7 = errors;
            if (errors === _errs7) {
              if (data0 && typeof data0 == 'object' && !Array.isArray(data0)) {
                const _errs9 = errors;
                for (const key1 in data0) {
                  if (
                    !(
                      key1 === 'bytecode' ||
                      key1 === 'currentBlockHeight' ||
                      key1 === 'currentBlockTime' ||
                      key1 === 'hdKeys' ||
                      key1 === 'keys'
                    )
                  ) {
                    const err2 = {
                      instancePath: instancePath + '/overrides',
                      schemaPath:
                        '#/definitions/WalletTemplateScenarioData/additionalProperties',
                      keyword: 'additionalProperties',
                      params: { additionalProperty: key1 },
                      message: 'must NOT have additional properties',
                    };
                    if (vErrors === null) {
                      vErrors = [err2];
                    } else {
                      vErrors.push(err2);
                    }
                    errors++;
                    break;
                  }
                }
                if (_errs9 === errors) {
                  if (data0.bytecode !== undefined) {
                    let data1 = data0.bytecode;
                    const _errs10 = errors;
                    if (errors === _errs10) {
                      if (
                        data1 &&
                        typeof data1 == 'object' &&
                        !Array.isArray(data1)
                      ) {
                        for (const key2 in data1) {
                          const _errs13 = errors;
                          if (typeof data1[key2] !== 'string') {
                            const err3 = {
                              instancePath:
                                instancePath +
                                '/overrides/bytecode/' +
                                key2.replace(/~/g, '~0').replace(/\//g, '~1'),
                              schemaPath:
                                '#/definitions/WalletTemplateScenarioData/properties/bytecode/additionalProperties/type',
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
                          var valid4 = _errs13 === errors;
                          if (!valid4) {
                            break;
                          }
                        }
                      } else {
                        const err4 = {
                          instancePath: instancePath + '/overrides/bytecode',
                          schemaPath:
                            '#/definitions/WalletTemplateScenarioData/properties/bytecode/type',
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
                    var valid3 = _errs10 === errors;
                  } else {
                    var valid3 = true;
                  }
                  if (valid3) {
                    if (data0.currentBlockHeight !== undefined) {
                      let data3 = data0.currentBlockHeight;
                      const _errs15 = errors;
                      if (!(typeof data3 == 'number' && isFinite(data3))) {
                        const err5 = {
                          instancePath:
                            instancePath + '/overrides/currentBlockHeight',
                          schemaPath:
                            '#/definitions/WalletTemplateScenarioData/properties/currentBlockHeight/type',
                          keyword: 'type',
                          params: { type: 'number' },
                          message: 'must be number',
                        };
                        if (vErrors === null) {
                          vErrors = [err5];
                        } else {
                          vErrors.push(err5);
                        }
                        errors++;
                      }
                      var valid3 = _errs15 === errors;
                    } else {
                      var valid3 = true;
                    }
                    if (valid3) {
                      if (data0.currentBlockTime !== undefined) {
                        let data4 = data0.currentBlockTime;
                        const _errs17 = errors;
                        if (!(typeof data4 == 'number' && isFinite(data4))) {
                          const err6 = {
                            instancePath:
                              instancePath + '/overrides/currentBlockTime',
                            schemaPath:
                              '#/definitions/WalletTemplateScenarioData/properties/currentBlockTime/type',
                            keyword: 'type',
                            params: { type: 'number' },
                            message: 'must be number',
                          };
                          if (vErrors === null) {
                            vErrors = [err6];
                          } else {
                            vErrors.push(err6);
                          }
                          errors++;
                        }
                        var valid3 = _errs17 === errors;
                      } else {
                        var valid3 = true;
                      }
                      if (valid3) {
                        if (data0.hdKeys !== undefined) {
                          let data5 = data0.hdKeys;
                          const _errs19 = errors;
                          if (errors === _errs19) {
                            if (
                              data5 &&
                              typeof data5 == 'object' &&
                              !Array.isArray(data5)
                            ) {
                              const _errs21 = errors;
                              for (const key3 in data5) {
                                if (
                                  !(
                                    key3 === 'addressIndex' ||
                                    key3 === 'hdPrivateKeys' ||
                                    key3 === 'hdPublicKeys'
                                  )
                                ) {
                                  const err7 = {
                                    instancePath:
                                      instancePath + '/overrides/hdKeys',
                                    schemaPath:
                                      '#/definitions/WalletTemplateScenarioData/properties/hdKeys/additionalProperties',
                                    keyword: 'additionalProperties',
                                    params: { additionalProperty: key3 },
                                    message:
                                      'must NOT have additional properties',
                                  };
                                  if (vErrors === null) {
                                    vErrors = [err7];
                                  } else {
                                    vErrors.push(err7);
                                  }
                                  errors++;
                                  break;
                                }
                              }
                              if (_errs21 === errors) {
                                if (data5.addressIndex !== undefined) {
                                  let data6 = data5.addressIndex;
                                  const _errs22 = errors;
                                  if (
                                    !(
                                      typeof data6 == 'number' &&
                                      isFinite(data6)
                                    )
                                  ) {
                                    const err8 = {
                                      instancePath:
                                        instancePath +
                                        '/overrides/hdKeys/addressIndex',
                                      schemaPath:
                                        '#/definitions/WalletTemplateScenarioData/properties/hdKeys/properties/addressIndex/type',
                                      keyword: 'type',
                                      params: { type: 'number' },
                                      message: 'must be number',
                                    };
                                    if (vErrors === null) {
                                      vErrors = [err8];
                                    } else {
                                      vErrors.push(err8);
                                    }
                                    errors++;
                                  }
                                  var valid5 = _errs22 === errors;
                                } else {
                                  var valid5 = true;
                                }
                                if (valid5) {
                                  if (data5.hdPrivateKeys !== undefined) {
                                    let data7 = data5.hdPrivateKeys;
                                    const _errs24 = errors;
                                    if (errors === _errs24) {
                                      if (
                                        data7 &&
                                        typeof data7 == 'object' &&
                                        !Array.isArray(data7)
                                      ) {
                                        for (const key4 in data7) {
                                          const _errs27 = errors;
                                          if (typeof data7[key4] !== 'string') {
                                            const err9 = {
                                              instancePath:
                                                instancePath +
                                                '/overrides/hdKeys/hdPrivateKeys/' +
                                                key4
                                                  .replace(/~/g, '~0')
                                                  .replace(/\//g, '~1'),
                                              schemaPath:
                                                '#/definitions/WalletTemplateScenarioData/properties/hdKeys/properties/hdPrivateKeys/additionalProperties/type',
                                              keyword: 'type',
                                              params: { type: 'string' },
                                              message: 'must be string',
                                            };
                                            if (vErrors === null) {
                                              vErrors = [err9];
                                            } else {
                                              vErrors.push(err9);
                                            }
                                            errors++;
                                          }
                                          var valid6 = _errs27 === errors;
                                          if (!valid6) {
                                            break;
                                          }
                                        }
                                      } else {
                                        const err10 = {
                                          instancePath:
                                            instancePath +
                                            '/overrides/hdKeys/hdPrivateKeys',
                                          schemaPath:
                                            '#/definitions/WalletTemplateScenarioData/properties/hdKeys/properties/hdPrivateKeys/type',
                                          keyword: 'type',
                                          params: { type: 'object' },
                                          message: 'must be object',
                                        };
                                        if (vErrors === null) {
                                          vErrors = [err10];
                                        } else {
                                          vErrors.push(err10);
                                        }
                                        errors++;
                                      }
                                    }
                                    var valid5 = _errs24 === errors;
                                  } else {
                                    var valid5 = true;
                                  }
                                  if (valid5) {
                                    if (data5.hdPublicKeys !== undefined) {
                                      let data9 = data5.hdPublicKeys;
                                      const _errs29 = errors;
                                      if (errors === _errs29) {
                                        if (
                                          data9 &&
                                          typeof data9 == 'object' &&
                                          !Array.isArray(data9)
                                        ) {
                                          for (const key5 in data9) {
                                            const _errs32 = errors;
                                            if (
                                              typeof data9[key5] !== 'string'
                                            ) {
                                              const err11 = {
                                                instancePath:
                                                  instancePath +
                                                  '/overrides/hdKeys/hdPublicKeys/' +
                                                  key5
                                                    .replace(/~/g, '~0')
                                                    .replace(/\//g, '~1'),
                                                schemaPath:
                                                  '#/definitions/WalletTemplateScenarioData/properties/hdKeys/properties/hdPublicKeys/additionalProperties/type',
                                                keyword: 'type',
                                                params: { type: 'string' },
                                                message: 'must be string',
                                              };
                                              if (vErrors === null) {
                                                vErrors = [err11];
                                              } else {
                                                vErrors.push(err11);
                                              }
                                              errors++;
                                            }
                                            var valid7 = _errs32 === errors;
                                            if (!valid7) {
                                              break;
                                            }
                                          }
                                        } else {
                                          const err12 = {
                                            instancePath:
                                              instancePath +
                                              '/overrides/hdKeys/hdPublicKeys',
                                            schemaPath:
                                              '#/definitions/WalletTemplateScenarioData/properties/hdKeys/properties/hdPublicKeys/type',
                                            keyword: 'type',
                                            params: { type: 'object' },
                                            message: 'must be object',
                                          };
                                          if (vErrors === null) {
                                            vErrors = [err12];
                                          } else {
                                            vErrors.push(err12);
                                          }
                                          errors++;
                                        }
                                      }
                                      var valid5 = _errs29 === errors;
                                    } else {
                                      var valid5 = true;
                                    }
                                  }
                                }
                              }
                            } else {
                              const err13 = {
                                instancePath:
                                  instancePath + '/overrides/hdKeys',
                                schemaPath:
                                  '#/definitions/WalletTemplateScenarioData/properties/hdKeys/type',
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
                          var valid3 = _errs19 === errors;
                        } else {
                          var valid3 = true;
                        }
                        if (valid3) {
                          if (data0.keys !== undefined) {
                            let data11 = data0.keys;
                            const _errs34 = errors;
                            if (errors === _errs34) {
                              if (
                                data11 &&
                                typeof data11 == 'object' &&
                                !Array.isArray(data11)
                              ) {
                                const _errs36 = errors;
                                for (const key6 in data11) {
                                  if (!(key6 === 'privateKeys')) {
                                    const err14 = {
                                      instancePath:
                                        instancePath + '/overrides/keys',
                                      schemaPath:
                                        '#/definitions/WalletTemplateScenarioData/properties/keys/additionalProperties',
                                      keyword: 'additionalProperties',
                                      params: { additionalProperty: key6 },
                                      message:
                                        'must NOT have additional properties',
                                    };
                                    if (vErrors === null) {
                                      vErrors = [err14];
                                    } else {
                                      vErrors.push(err14);
                                    }
                                    errors++;
                                    break;
                                  }
                                }
                                if (_errs36 === errors) {
                                  if (data11.privateKeys !== undefined) {
                                    let data12 = data11.privateKeys;
                                    const _errs37 = errors;
                                    if (errors === _errs37) {
                                      if (
                                        data12 &&
                                        typeof data12 == 'object' &&
                                        !Array.isArray(data12)
                                      ) {
                                        for (const key7 in data12) {
                                          const _errs40 = errors;
                                          if (
                                            typeof data12[key7] !== 'string'
                                          ) {
                                            const err15 = {
                                              instancePath:
                                                instancePath +
                                                '/overrides/keys/privateKeys/' +
                                                key7
                                                  .replace(/~/g, '~0')
                                                  .replace(/\//g, '~1'),
                                              schemaPath:
                                                '#/definitions/WalletTemplateScenarioData/properties/keys/properties/privateKeys/additionalProperties/type',
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
                                          var valid9 = _errs40 === errors;
                                          if (!valid9) {
                                            break;
                                          }
                                        }
                                      } else {
                                        const err16 = {
                                          instancePath:
                                            instancePath +
                                            '/overrides/keys/privateKeys',
                                          schemaPath:
                                            '#/definitions/WalletTemplateScenarioData/properties/keys/properties/privateKeys/type',
                                          keyword: 'type',
                                          params: { type: 'object' },
                                          message: 'must be object',
                                        };
                                        if (vErrors === null) {
                                          vErrors = [err16];
                                        } else {
                                          vErrors.push(err16);
                                        }
                                        errors++;
                                      }
                                    }
                                  }
                                }
                              } else {
                                const err17 = {
                                  instancePath:
                                    instancePath + '/overrides/keys',
                                  schemaPath:
                                    '#/definitions/WalletTemplateScenarioData/properties/keys/type',
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
                            var valid3 = _errs34 === errors;
                          } else {
                            var valid3 = true;
                          }
                        }
                      }
                    }
                  }
                }
              } else {
                const err18 = {
                  instancePath: instancePath + '/overrides',
                  schemaPath: '#/definitions/WalletTemplateScenarioData/type',
                  keyword: 'type',
                  params: { type: 'object' },
                  message: 'must be object',
                };
                if (vErrors === null) {
                  vErrors = [err18];
                } else {
                  vErrors.push(err18);
                }
                errors++;
              }
            }
            var valid1 = _errs6 === errors;
          } else {
            var valid1 = true;
          }
          if (valid1) {
            if (data.script !== undefined) {
              let data14 = data.script;
              const _errs42 = errors;
              const _errs43 = errors;
              let valid10 = false;
              const _errs44 = errors;
              if (typeof data14 !== 'string') {
                const err19 = {
                  instancePath: instancePath + '/script',
                  schemaPath: '#/anyOf/1/properties/script/anyOf/0/type',
                  keyword: 'type',
                  params: { type: 'string' },
                  message: 'must be string',
                };
                if (vErrors === null) {
                  vErrors = [err19];
                } else {
                  vErrors.push(err19);
                }
                errors++;
              }
              var _valid1 = _errs44 === errors;
              valid10 = valid10 || _valid1;
              if (!valid10) {
                const _errs46 = errors;
                if (errors === _errs46) {
                  if (Array.isArray(data14)) {
                    if (data14.length > 1) {
                      const err20 = {
                        instancePath: instancePath + '/script',
                        schemaPath:
                          '#/anyOf/1/properties/script/anyOf/1/maxItems',
                        keyword: 'maxItems',
                        params: { limit: 1 },
                        message: 'must NOT have more than 1 items',
                      };
                      if (vErrors === null) {
                        vErrors = [err20];
                      } else {
                        vErrors.push(err20);
                      }
                      errors++;
                    } else {
                      if (data14.length < 1) {
                        const err21 = {
                          instancePath: instancePath + '/script',
                          schemaPath:
                            '#/anyOf/1/properties/script/anyOf/1/minItems',
                          keyword: 'minItems',
                          params: { limit: 1 },
                          message: 'must NOT have fewer than 1 items',
                        };
                        if (vErrors === null) {
                          vErrors = [err21];
                        } else {
                          vErrors.push(err21);
                        }
                        errors++;
                      } else {
                        var valid11 = true;
                        const len0 = data14.length;
                        for (let i0 = 0; i0 < len0; i0++) {
                          let data15 = data14[i0];
                          const _errs48 = errors;
                          if (typeof data15 !== 'string') {
                            const err22 = {
                              instancePath: instancePath + '/script/' + i0,
                              schemaPath:
                                '#/anyOf/1/properties/script/anyOf/1/items/type',
                              keyword: 'type',
                              params: { type: 'string' },
                              message: 'must be string',
                            };
                            if (vErrors === null) {
                              vErrors = [err22];
                            } else {
                              vErrors.push(err22);
                            }
                            errors++;
                          }
                          if ('copy' !== data15) {
                            const err23 = {
                              instancePath: instancePath + '/script/' + i0,
                              schemaPath:
                                '#/anyOf/1/properties/script/anyOf/1/items/const',
                              keyword: 'const',
                              params: { allowedValue: 'copy' },
                              message: 'must be equal to constant',
                            };
                            if (vErrors === null) {
                              vErrors = [err23];
                            } else {
                              vErrors.push(err23);
                            }
                            errors++;
                          }
                          var valid11 = _errs48 === errors;
                          if (!valid11) {
                            break;
                          }
                        }
                      }
                    }
                  } else {
                    const err24 = {
                      instancePath: instancePath + '/script',
                      schemaPath: '#/anyOf/1/properties/script/anyOf/1/type',
                      keyword: 'type',
                      params: { type: 'array' },
                      message: 'must be array',
                    };
                    if (vErrors === null) {
                      vErrors = [err24];
                    } else {
                      vErrors.push(err24);
                    }
                    errors++;
                  }
                }
                var _valid1 = _errs46 === errors;
                valid10 = valid10 || _valid1;
              }
              if (!valid10) {
                const err25 = {
                  instancePath: instancePath + '/script',
                  schemaPath: '#/anyOf/1/properties/script/anyOf',
                  keyword: 'anyOf',
                  params: {},
                  message: 'must match a schema in anyOf',
                };
                if (vErrors === null) {
                  vErrors = [err25];
                } else {
                  vErrors.push(err25);
                }
                errors++;
              } else {
                errors = _errs43;
                if (vErrors !== null) {
                  if (_errs43) {
                    vErrors.length = _errs43;
                  } else {
                    vErrors = null;
                  }
                }
              }
              var valid1 = _errs42 === errors;
            } else {
              var valid1 = true;
            }
          }
        }
      } else {
        const err26 = {
          instancePath,
          schemaPath: '#/anyOf/1/type',
          keyword: 'type',
          params: { type: 'object' },
          message: 'must be object',
        };
        if (vErrors === null) {
          vErrors = [err26];
        } else {
          vErrors.push(err26);
        }
        errors++;
      }
    }
    var _valid0 = _errs3 === errors;
    valid0 = valid0 || _valid0;
  }
  if (!valid0) {
    const err27 = {
      instancePath,
      schemaPath: '#/anyOf',
      keyword: 'anyOf',
      params: {},
      message: 'must match a schema in anyOf',
    };
    if (vErrors === null) {
      vErrors = [err27];
    } else {
      vErrors.push(err27);
    }
    errors++;
    validate28.errors = vErrors;
    return false;
  } else {
    errors = _errs0;
    if (vErrors !== null) {
      if (_errs0) {
        vErrors.length = _errs0;
      } else {
        vErrors = null;
      }
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
      const _errs1 = errors;
      for (const key0 in data) {
        if (
          !(
            key0 === 'lockingBytecode' ||
            key0 === 'token' ||
            key0 === 'valueSatoshis'
          )
        ) {
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
        if (data.lockingBytecode !== undefined) {
          let data0 = data.lockingBytecode;
          const _errs2 = errors;
          const _errs3 = errors;
          let valid1 = false;
          const _errs4 = errors;
          if (
            !validate28(data0, {
              instancePath: instancePath + '/lockingBytecode',
              parentData: data,
              parentDataProperty: 'lockingBytecode',
              rootData,
            })
          ) {
            vErrors =
              vErrors === null
                ? validate28.errors
                : vErrors.concat(validate28.errors);
            errors = vErrors.length;
          }
          var _valid0 = _errs4 === errors;
          valid1 = valid1 || _valid0;
          if (!valid1) {
            const _errs5 = errors;
            if (errors === _errs5) {
              if (Array.isArray(data0)) {
                if (data0.length > 1) {
                  const err0 = {
                    instancePath: instancePath + '/lockingBytecode',
                    schemaPath: '#/properties/lockingBytecode/anyOf/1/maxItems',
                    keyword: 'maxItems',
                    params: { limit: 1 },
                    message: 'must NOT have more than 1 items',
                  };
                  if (vErrors === null) {
                    vErrors = [err0];
                  } else {
                    vErrors.push(err0);
                  }
                  errors++;
                } else {
                  if (data0.length < 1) {
                    const err1 = {
                      instancePath: instancePath + '/lockingBytecode',
                      schemaPath:
                        '#/properties/lockingBytecode/anyOf/1/minItems',
                      keyword: 'minItems',
                      params: { limit: 1 },
                      message: 'must NOT have fewer than 1 items',
                    };
                    if (vErrors === null) {
                      vErrors = [err1];
                    } else {
                      vErrors.push(err1);
                    }
                    errors++;
                  } else {
                    var valid2 = true;
                    const len0 = data0.length;
                    for (let i0 = 0; i0 < len0; i0++) {
                      let data1 = data0[i0];
                      const _errs7 = errors;
                      if (typeof data1 !== 'string') {
                        const err2 = {
                          instancePath: instancePath + '/lockingBytecode/' + i0,
                          schemaPath:
                            '#/properties/lockingBytecode/anyOf/1/items/type',
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
                      if ('slot' !== data1) {
                        const err3 = {
                          instancePath: instancePath + '/lockingBytecode/' + i0,
                          schemaPath:
                            '#/properties/lockingBytecode/anyOf/1/items/const',
                          keyword: 'const',
                          params: { allowedValue: 'slot' },
                          message: 'must be equal to constant',
                        };
                        if (vErrors === null) {
                          vErrors = [err3];
                        } else {
                          vErrors.push(err3);
                        }
                        errors++;
                      }
                      var valid2 = _errs7 === errors;
                      if (!valid2) {
                        break;
                      }
                    }
                  }
                }
              } else {
                const err4 = {
                  instancePath: instancePath + '/lockingBytecode',
                  schemaPath: '#/properties/lockingBytecode/anyOf/1/type',
                  keyword: 'type',
                  params: { type: 'array' },
                  message: 'must be array',
                };
                if (vErrors === null) {
                  vErrors = [err4];
                } else {
                  vErrors.push(err4);
                }
                errors++;
              }
            }
            var _valid0 = _errs5 === errors;
            valid1 = valid1 || _valid0;
          }
          if (!valid1) {
            const err5 = {
              instancePath: instancePath + '/lockingBytecode',
              schemaPath: '#/properties/lockingBytecode/anyOf',
              keyword: 'anyOf',
              params: {},
              message: 'must match a schema in anyOf',
            };
            if (vErrors === null) {
              vErrors = [err5];
            } else {
              vErrors.push(err5);
            }
            errors++;
            validate27.errors = vErrors;
            return false;
          } else {
            errors = _errs3;
            if (vErrors !== null) {
              if (_errs3) {
                vErrors.length = _errs3;
              } else {
                vErrors = null;
              }
            }
          }
          var valid0 = _errs2 === errors;
        } else {
          var valid0 = true;
        }
        if (valid0) {
          if (data.token !== undefined) {
            let data2 = data.token;
            const _errs9 = errors;
            if (errors === _errs9) {
              if (data2 && typeof data2 == 'object' && !Array.isArray(data2)) {
                const _errs11 = errors;
                for (const key1 in data2) {
                  if (
                    !(
                      key1 === 'amount' ||
                      key1 === 'category' ||
                      key1 === 'nft'
                    )
                  ) {
                    validate27.errors = [
                      {
                        instancePath: instancePath + '/token',
                        schemaPath: '#/properties/token/additionalProperties',
                        keyword: 'additionalProperties',
                        params: { additionalProperty: key1 },
                        message: 'must NOT have additional properties',
                      },
                    ];
                    return false;
                    break;
                  }
                }
                if (_errs11 === errors) {
                  if (data2.amount !== undefined) {
                    let data3 = data2.amount;
                    const _errs12 = errors;
                    if (
                      !(typeof data3 == 'number' && isFinite(data3)) &&
                      typeof data3 !== 'string'
                    ) {
                      validate27.errors = [
                        {
                          instancePath: instancePath + '/token/amount',
                          schemaPath:
                            '#/properties/token/properties/amount/type',
                          keyword: 'type',
                          params: {
                            type: schema32.properties.token.properties.amount
                              .type,
                          },
                          message: 'must be number,string',
                        },
                      ];
                      return false;
                    }
                    var valid3 = _errs12 === errors;
                  } else {
                    var valid3 = true;
                  }
                  if (valid3) {
                    if (data2.category !== undefined) {
                      const _errs14 = errors;
                      if (typeof data2.category !== 'string') {
                        validate27.errors = [
                          {
                            instancePath: instancePath + '/token/category',
                            schemaPath:
                              '#/properties/token/properties/category/type',
                            keyword: 'type',
                            params: { type: 'string' },
                            message: 'must be string',
                          },
                        ];
                        return false;
                      }
                      var valid3 = _errs14 === errors;
                    } else {
                      var valid3 = true;
                    }
                    if (valid3) {
                      if (data2.nft !== undefined) {
                        let data5 = data2.nft;
                        const _errs16 = errors;
                        if (errors === _errs16) {
                          if (
                            data5 &&
                            typeof data5 == 'object' &&
                            !Array.isArray(data5)
                          ) {
                            const _errs18 = errors;
                            for (const key2 in data5) {
                              if (
                                !(
                                  key2 === 'capability' || key2 === 'commitment'
                                )
                              ) {
                                validate27.errors = [
                                  {
                                    instancePath: instancePath + '/token/nft',
                                    schemaPath:
                                      '#/properties/token/properties/nft/additionalProperties',
                                    keyword: 'additionalProperties',
                                    params: { additionalProperty: key2 },
                                    message:
                                      'must NOT have additional properties',
                                  },
                                ];
                                return false;
                                break;
                              }
                            }
                            if (_errs18 === errors) {
                              if (data5.capability !== undefined) {
                                let data6 = data5.capability;
                                const _errs19 = errors;
                                if (typeof data6 !== 'string') {
                                  validate27.errors = [
                                    {
                                      instancePath:
                                        instancePath + '/token/nft/capability',
                                      schemaPath:
                                        '#/properties/token/properties/nft/properties/capability/type',
                                      keyword: 'type',
                                      params: { type: 'string' },
                                      message: 'must be string',
                                    },
                                  ];
                                  return false;
                                }
                                if (
                                  !(
                                    data6 === 'minting' ||
                                    data6 === 'mutable' ||
                                    data6 === 'none'
                                  )
                                ) {
                                  validate27.errors = [
                                    {
                                      instancePath:
                                        instancePath + '/token/nft/capability',
                                      schemaPath:
                                        '#/properties/token/properties/nft/properties/capability/enum',
                                      keyword: 'enum',
                                      params: {
                                        allowedValues:
                                          schema32.properties.token.properties
                                            .nft.properties.capability.enum,
                                      },
                                      message:
                                        'must be equal to one of the allowed values',
                                    },
                                  ];
                                  return false;
                                }
                                var valid4 = _errs19 === errors;
                              } else {
                                var valid4 = true;
                              }
                              if (valid4) {
                                if (data5.commitment !== undefined) {
                                  const _errs21 = errors;
                                  if (typeof data5.commitment !== 'string') {
                                    validate27.errors = [
                                      {
                                        instancePath:
                                          instancePath +
                                          '/token/nft/commitment',
                                        schemaPath:
                                          '#/properties/token/properties/nft/properties/commitment/type',
                                        keyword: 'type',
                                        params: { type: 'string' },
                                        message: 'must be string',
                                      },
                                    ];
                                    return false;
                                  }
                                  var valid4 = _errs21 === errors;
                                } else {
                                  var valid4 = true;
                                }
                              }
                            }
                          } else {
                            validate27.errors = [
                              {
                                instancePath: instancePath + '/token/nft',
                                schemaPath:
                                  '#/properties/token/properties/nft/type',
                                keyword: 'type',
                                params: { type: 'object' },
                                message: 'must be object',
                              },
                            ];
                            return false;
                          }
                        }
                        var valid3 = _errs16 === errors;
                      } else {
                        var valid3 = true;
                      }
                    }
                  }
                }
              } else {
                validate27.errors = [
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
            var valid0 = _errs9 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.valueSatoshis !== undefined) {
              let data8 = data.valueSatoshis;
              const _errs23 = errors;
              if (
                !(typeof data8 == 'number' && isFinite(data8)) &&
                typeof data8 !== 'string'
              ) {
                validate27.errors = [
                  {
                    instancePath: instancePath + '/valueSatoshis',
                    schemaPath: '#/properties/valueSatoshis/type',
                    keyword: 'type',
                    params: { type: schema32.properties.valueSatoshis.type },
                    message: 'must be number,string',
                  },
                ];
                return false;
              }
              var valid0 = _errs23 === errors;
            } else {
              var valid0 = true;
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
const schema35 = {
  additionalProperties: false,
  description:
    'An example input used to define a scenario for a wallet template.',
  properties: {
    outpointIndex: {
      description:
        'The index of the output in the transaction from which this input is spent.\n\nIf undefined, this defaults to the same index as the input itself (so that by default, every outpoint in the produced transaction is different, even if an empty `outpointTransactionHash` is used for each transaction).',
      type: 'number',
    },
    outpointTransactionHash: {
      description:
        'A 32-byte, hexadecimal-encoded hash of the transaction from which this input is spent in big-endian byte order. This is the byte order typically seen in block explorers and user interfaces (as opposed to little-endian byte order, which is used in standard P2P network messages).\n\nIf undefined, this defaults to the value: `0000000000000000000000000000000000000000000000000000000000000001`\n\nA.K.A. Outpoint `Transaction ID`',
      type: 'string',
    },
    sequenceNumber: {
      description:
        'The positive, 32-bit unsigned integer used as the "sequence number" for this input.\n\nIf undefined, this defaults to `0`.',
      type: 'number',
    },
    unlockingBytecode: {
      anyOf: [
        { $ref: '#/definitions/WalletTemplateScenarioBytecode' },
        {
          items: { const: 'slot', type: 'string' },
          maxItems: 1,
          minItems: 1,
          type: 'array',
        },
      ],
      description:
        'The `unlockingBytecode` value of this input for this scenario. This must be either `["slot"]`, indicating that this input contains the `unlockingBytecode` under test by the scenario, or an `WalletTemplateScenarioBytecode`.\n\nFor a scenario to be valid, `unlockingBytecode` must be `["slot"]` for exactly one input in the scenario.\n\nDefaults to `["slot"]`.',
    },
  },
  type: 'object',
};
function validate31(
  data,
  { instancePath = '', parentData, parentDataProperty, rootData = data } = {},
) {
  let vErrors = null;
  let errors = 0;
  if (errors === 0) {
    if (data && typeof data == 'object' && !Array.isArray(data)) {
      const _errs1 = errors;
      for (const key0 in data) {
        if (
          !(
            key0 === 'outpointIndex' ||
            key0 === 'outpointTransactionHash' ||
            key0 === 'sequenceNumber' ||
            key0 === 'unlockingBytecode'
          )
        ) {
          validate31.errors = [
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
        if (data.outpointIndex !== undefined) {
          let data0 = data.outpointIndex;
          const _errs2 = errors;
          if (!(typeof data0 == 'number' && isFinite(data0))) {
            validate31.errors = [
              {
                instancePath: instancePath + '/outpointIndex',
                schemaPath: '#/properties/outpointIndex/type',
                keyword: 'type',
                params: { type: 'number' },
                message: 'must be number',
              },
            ];
            return false;
          }
          var valid0 = _errs2 === errors;
        } else {
          var valid0 = true;
        }
        if (valid0) {
          if (data.outpointTransactionHash !== undefined) {
            const _errs4 = errors;
            if (typeof data.outpointTransactionHash !== 'string') {
              validate31.errors = [
                {
                  instancePath: instancePath + '/outpointTransactionHash',
                  schemaPath: '#/properties/outpointTransactionHash/type',
                  keyword: 'type',
                  params: { type: 'string' },
                  message: 'must be string',
                },
              ];
              return false;
            }
            var valid0 = _errs4 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.sequenceNumber !== undefined) {
              let data2 = data.sequenceNumber;
              const _errs6 = errors;
              if (!(typeof data2 == 'number' && isFinite(data2))) {
                validate31.errors = [
                  {
                    instancePath: instancePath + '/sequenceNumber',
                    schemaPath: '#/properties/sequenceNumber/type',
                    keyword: 'type',
                    params: { type: 'number' },
                    message: 'must be number',
                  },
                ];
                return false;
              }
              var valid0 = _errs6 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.unlockingBytecode !== undefined) {
                let data3 = data.unlockingBytecode;
                const _errs8 = errors;
                const _errs9 = errors;
                let valid1 = false;
                const _errs10 = errors;
                if (
                  !validate28(data3, {
                    instancePath: instancePath + '/unlockingBytecode',
                    parentData: data,
                    parentDataProperty: 'unlockingBytecode',
                    rootData,
                  })
                ) {
                  vErrors =
                    vErrors === null
                      ? validate28.errors
                      : vErrors.concat(validate28.errors);
                  errors = vErrors.length;
                }
                var _valid0 = _errs10 === errors;
                valid1 = valid1 || _valid0;
                if (!valid1) {
                  const _errs11 = errors;
                  if (errors === _errs11) {
                    if (Array.isArray(data3)) {
                      if (data3.length > 1) {
                        const err0 = {
                          instancePath: instancePath + '/unlockingBytecode',
                          schemaPath:
                            '#/properties/unlockingBytecode/anyOf/1/maxItems',
                          keyword: 'maxItems',
                          params: { limit: 1 },
                          message: 'must NOT have more than 1 items',
                        };
                        if (vErrors === null) {
                          vErrors = [err0];
                        } else {
                          vErrors.push(err0);
                        }
                        errors++;
                      } else {
                        if (data3.length < 1) {
                          const err1 = {
                            instancePath: instancePath + '/unlockingBytecode',
                            schemaPath:
                              '#/properties/unlockingBytecode/anyOf/1/minItems',
                            keyword: 'minItems',
                            params: { limit: 1 },
                            message: 'must NOT have fewer than 1 items',
                          };
                          if (vErrors === null) {
                            vErrors = [err1];
                          } else {
                            vErrors.push(err1);
                          }
                          errors++;
                        } else {
                          var valid2 = true;
                          const len0 = data3.length;
                          for (let i0 = 0; i0 < len0; i0++) {
                            let data4 = data3[i0];
                            const _errs13 = errors;
                            if (typeof data4 !== 'string') {
                              const err2 = {
                                instancePath:
                                  instancePath + '/unlockingBytecode/' + i0,
                                schemaPath:
                                  '#/properties/unlockingBytecode/anyOf/1/items/type',
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
                            if ('slot' !== data4) {
                              const err3 = {
                                instancePath:
                                  instancePath + '/unlockingBytecode/' + i0,
                                schemaPath:
                                  '#/properties/unlockingBytecode/anyOf/1/items/const',
                                keyword: 'const',
                                params: { allowedValue: 'slot' },
                                message: 'must be equal to constant',
                              };
                              if (vErrors === null) {
                                vErrors = [err3];
                              } else {
                                vErrors.push(err3);
                              }
                              errors++;
                            }
                            var valid2 = _errs13 === errors;
                            if (!valid2) {
                              break;
                            }
                          }
                        }
                      }
                    } else {
                      const err4 = {
                        instancePath: instancePath + '/unlockingBytecode',
                        schemaPath:
                          '#/properties/unlockingBytecode/anyOf/1/type',
                        keyword: 'type',
                        params: { type: 'array' },
                        message: 'must be array',
                      };
                      if (vErrors === null) {
                        vErrors = [err4];
                      } else {
                        vErrors.push(err4);
                      }
                      errors++;
                    }
                  }
                  var _valid0 = _errs11 === errors;
                  valid1 = valid1 || _valid0;
                }
                if (!valid1) {
                  const err5 = {
                    instancePath: instancePath + '/unlockingBytecode',
                    schemaPath: '#/properties/unlockingBytecode/anyOf',
                    keyword: 'anyOf',
                    params: {},
                    message: 'must match a schema in anyOf',
                  };
                  if (vErrors === null) {
                    vErrors = [err5];
                  } else {
                    vErrors.push(err5);
                  }
                  errors++;
                  validate31.errors = vErrors;
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
                var valid0 = _errs8 === errors;
              } else {
                var valid0 = true;
              }
            }
          }
        }
      }
    } else {
      validate31.errors = [
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
  validate31.errors = vErrors;
  return errors === 0;
}
const schema36 = {
  additionalProperties: false,
  description:
    'An example output used to define a scenario for a wallet template.',
  properties: {
    lockingBytecode: {
      $ref: '#/definitions/WalletTemplateScenarioBytecode',
      description:
        'The locking bytecode used to encumber this output.\n\n`lockingBytecode` values may be provided as a hexadecimal-encoded string or as an object describing the required compilation. If undefined, defaults to  `{}`, which uses the default values for `script` and `overrides`, respectively.\n\nOnly source outputs may specify a `lockingBytecode` of `["slot"]`; this identifies the source output in which the locking script under test will be placed. (To be valid, every scenario\'s `sourceOutputs` property must have exactly one source output slot and one input slot at the same index.)',
    },
    token: {
      additionalProperties: false,
      description:
        'The CashToken contents of this output. This property is only defined if the output contains one or more tokens. For details, see `CHIP-2022-02-CashTokens`.',
      properties: {
        amount: {
          description:
            'The number of fungible tokens (of `category`) held in this output.\n\nBecause `Number.MAX_SAFE_INTEGER` (`9007199254740991`) is less than the maximum token amount (`9223372036854775807`), this value may also be provided as a string, e.g. `"9223372036854775807"`.\n\nIf undefined, this defaults to: `0`.',
          type: ['number', 'string'],
        },
        category: {
          description:
            'The 32-byte, hexadecimal-encoded token category ID to which the token(s) in this output belong in big-endian byte order. This is the byte order typically seen in block explorers and user interfaces (as opposed to little-endian byte order, which is used in standard P2P network messages).\n\nIf undefined, this defaults to the value: `0000000000000000000000000000000000000000000000000000000000000002`',
          type: 'string',
        },
        nft: {
          additionalProperties: false,
          description:
            'If present, the non-fungible token (NFT) held by this output. If the output does not include a non-fungible token, `undefined`.',
          properties: {
            capability: {
              description:
                'The capability of this non-fungible token, must be either `minting`, `mutable`, or `none`.\n\nIf undefined, this defaults to: `none`.',
              enum: ['minting', 'mutable', 'none'],
              type: 'string',
            },
            commitment: {
              description:
                'The hex-encoded commitment contents included in the non-fungible token held in this output.\n\nIf undefined, this defaults to: `""` (a zero-length commitment).',
              type: 'string',
            },
          },
          type: 'object',
        },
      },
      type: 'object',
    },
    valueSatoshis: {
      description:
        'The value of the output in satoshis, the smallest unit of bitcoin.\n\nIn a valid transaction, this is a positive integer, from `0` to the maximum number of satoshis available to the transaction.\n\nThe maximum number of satoshis in existence is about 1/4 of `Number.MAX_SAFE_INTEGER` (`9007199254740991`), so typically, this value is defined using a `number`. However, this value may also be defined using a 16-character, hexadecimal-encoded `string`, to allow for the full range of the 64-bit unsigned, little-endian integer used to encode `valueSatoshis` in the encoded output format, e.g. `"ffffffffffffffff"`. This is useful for representing scenarios where intentionally excessive values are provided (to ensure an otherwise properly-signed transaction can never be included in the blockchain), e.g. transaction size estimations or off-chain Bitauth signatures.\n\nIf undefined, this defaults to: `0`.',
      type: ['number', 'string'],
    },
  },
  type: 'object',
};
function validate34(
  data,
  { instancePath = '', parentData, parentDataProperty, rootData = data } = {},
) {
  let vErrors = null;
  let errors = 0;
  if (errors === 0) {
    if (data && typeof data == 'object' && !Array.isArray(data)) {
      const _errs1 = errors;
      for (const key0 in data) {
        if (
          !(
            key0 === 'lockingBytecode' ||
            key0 === 'token' ||
            key0 === 'valueSatoshis'
          )
        ) {
          validate34.errors = [
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
        if (data.lockingBytecode !== undefined) {
          const _errs2 = errors;
          if (
            !validate28(data.lockingBytecode, {
              instancePath: instancePath + '/lockingBytecode',
              parentData: data,
              parentDataProperty: 'lockingBytecode',
              rootData,
            })
          ) {
            vErrors =
              vErrors === null
                ? validate28.errors
                : vErrors.concat(validate28.errors);
            errors = vErrors.length;
          }
          var valid0 = _errs2 === errors;
        } else {
          var valid0 = true;
        }
        if (valid0) {
          if (data.token !== undefined) {
            let data1 = data.token;
            const _errs3 = errors;
            if (errors === _errs3) {
              if (data1 && typeof data1 == 'object' && !Array.isArray(data1)) {
                const _errs5 = errors;
                for (const key1 in data1) {
                  if (
                    !(
                      key1 === 'amount' ||
                      key1 === 'category' ||
                      key1 === 'nft'
                    )
                  ) {
                    validate34.errors = [
                      {
                        instancePath: instancePath + '/token',
                        schemaPath: '#/properties/token/additionalProperties',
                        keyword: 'additionalProperties',
                        params: { additionalProperty: key1 },
                        message: 'must NOT have additional properties',
                      },
                    ];
                    return false;
                    break;
                  }
                }
                if (_errs5 === errors) {
                  if (data1.amount !== undefined) {
                    let data2 = data1.amount;
                    const _errs6 = errors;
                    if (
                      !(typeof data2 == 'number' && isFinite(data2)) &&
                      typeof data2 !== 'string'
                    ) {
                      validate34.errors = [
                        {
                          instancePath: instancePath + '/token/amount',
                          schemaPath:
                            '#/properties/token/properties/amount/type',
                          keyword: 'type',
                          params: {
                            type: schema36.properties.token.properties.amount
                              .type,
                          },
                          message: 'must be number,string',
                        },
                      ];
                      return false;
                    }
                    var valid1 = _errs6 === errors;
                  } else {
                    var valid1 = true;
                  }
                  if (valid1) {
                    if (data1.category !== undefined) {
                      const _errs8 = errors;
                      if (typeof data1.category !== 'string') {
                        validate34.errors = [
                          {
                            instancePath: instancePath + '/token/category',
                            schemaPath:
                              '#/properties/token/properties/category/type',
                            keyword: 'type',
                            params: { type: 'string' },
                            message: 'must be string',
                          },
                        ];
                        return false;
                      }
                      var valid1 = _errs8 === errors;
                    } else {
                      var valid1 = true;
                    }
                    if (valid1) {
                      if (data1.nft !== undefined) {
                        let data4 = data1.nft;
                        const _errs10 = errors;
                        if (errors === _errs10) {
                          if (
                            data4 &&
                            typeof data4 == 'object' &&
                            !Array.isArray(data4)
                          ) {
                            const _errs12 = errors;
                            for (const key2 in data4) {
                              if (
                                !(
                                  key2 === 'capability' || key2 === 'commitment'
                                )
                              ) {
                                validate34.errors = [
                                  {
                                    instancePath: instancePath + '/token/nft',
                                    schemaPath:
                                      '#/properties/token/properties/nft/additionalProperties',
                                    keyword: 'additionalProperties',
                                    params: { additionalProperty: key2 },
                                    message:
                                      'must NOT have additional properties',
                                  },
                                ];
                                return false;
                                break;
                              }
                            }
                            if (_errs12 === errors) {
                              if (data4.capability !== undefined) {
                                let data5 = data4.capability;
                                const _errs13 = errors;
                                if (typeof data5 !== 'string') {
                                  validate34.errors = [
                                    {
                                      instancePath:
                                        instancePath + '/token/nft/capability',
                                      schemaPath:
                                        '#/properties/token/properties/nft/properties/capability/type',
                                      keyword: 'type',
                                      params: { type: 'string' },
                                      message: 'must be string',
                                    },
                                  ];
                                  return false;
                                }
                                if (
                                  !(
                                    data5 === 'minting' ||
                                    data5 === 'mutable' ||
                                    data5 === 'none'
                                  )
                                ) {
                                  validate34.errors = [
                                    {
                                      instancePath:
                                        instancePath + '/token/nft/capability',
                                      schemaPath:
                                        '#/properties/token/properties/nft/properties/capability/enum',
                                      keyword: 'enum',
                                      params: {
                                        allowedValues:
                                          schema36.properties.token.properties
                                            .nft.properties.capability.enum,
                                      },
                                      message:
                                        'must be equal to one of the allowed values',
                                    },
                                  ];
                                  return false;
                                }
                                var valid2 = _errs13 === errors;
                              } else {
                                var valid2 = true;
                              }
                              if (valid2) {
                                if (data4.commitment !== undefined) {
                                  const _errs15 = errors;
                                  if (typeof data4.commitment !== 'string') {
                                    validate34.errors = [
                                      {
                                        instancePath:
                                          instancePath +
                                          '/token/nft/commitment',
                                        schemaPath:
                                          '#/properties/token/properties/nft/properties/commitment/type',
                                        keyword: 'type',
                                        params: { type: 'string' },
                                        message: 'must be string',
                                      },
                                    ];
                                    return false;
                                  }
                                  var valid2 = _errs15 === errors;
                                } else {
                                  var valid2 = true;
                                }
                              }
                            }
                          } else {
                            validate34.errors = [
                              {
                                instancePath: instancePath + '/token/nft',
                                schemaPath:
                                  '#/properties/token/properties/nft/type',
                                keyword: 'type',
                                params: { type: 'object' },
                                message: 'must be object',
                              },
                            ];
                            return false;
                          }
                        }
                        var valid1 = _errs10 === errors;
                      } else {
                        var valid1 = true;
                      }
                    }
                  }
                }
              } else {
                validate34.errors = [
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
            var valid0 = _errs3 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.valueSatoshis !== undefined) {
              let data7 = data.valueSatoshis;
              const _errs17 = errors;
              if (
                !(typeof data7 == 'number' && isFinite(data7)) &&
                typeof data7 !== 'string'
              ) {
                validate34.errors = [
                  {
                    instancePath: instancePath + '/valueSatoshis',
                    schemaPath: '#/properties/valueSatoshis/type',
                    keyword: 'type',
                    params: { type: schema36.properties.valueSatoshis.type },
                    message: 'must be number,string',
                  },
                ];
                return false;
              }
              var valid0 = _errs17 === errors;
            } else {
              var valid0 = true;
            }
          }
        }
      }
    } else {
      validate34.errors = [
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
  validate34.errors = vErrors;
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
      const _errs1 = errors;
      for (const key0 in data) {
        if (
          !(
            key0 === 'data' ||
            key0 === 'description' ||
            key0 === 'extends' ||
            key0 === 'name' ||
            key0 === 'sourceOutputs' ||
            key0 === 'transaction'
          )
        ) {
          validate26.errors = [
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
        if (data.data !== undefined) {
          let data0 = data.data;
          const _errs2 = errors;
          const _errs3 = errors;
          if (errors === _errs3) {
            if (data0 && typeof data0 == 'object' && !Array.isArray(data0)) {
              const _errs5 = errors;
              for (const key1 in data0) {
                if (
                  !(
                    key1 === 'bytecode' ||
                    key1 === 'currentBlockHeight' ||
                    key1 === 'currentBlockTime' ||
                    key1 === 'hdKeys' ||
                    key1 === 'keys'
                  )
                ) {
                  validate26.errors = [
                    {
                      instancePath: instancePath + '/data',
                      schemaPath:
                        '#/definitions/WalletTemplateScenarioData/additionalProperties',
                      keyword: 'additionalProperties',
                      params: { additionalProperty: key1 },
                      message: 'must NOT have additional properties',
                    },
                  ];
                  return false;
                  break;
                }
              }
              if (_errs5 === errors) {
                if (data0.bytecode !== undefined) {
                  let data1 = data0.bytecode;
                  const _errs6 = errors;
                  if (errors === _errs6) {
                    if (
                      data1 &&
                      typeof data1 == 'object' &&
                      !Array.isArray(data1)
                    ) {
                      for (const key2 in data1) {
                        const _errs9 = errors;
                        if (typeof data1[key2] !== 'string') {
                          validate26.errors = [
                            {
                              instancePath:
                                instancePath +
                                '/data/bytecode/' +
                                key2.replace(/~/g, '~0').replace(/\//g, '~1'),
                              schemaPath:
                                '#/definitions/WalletTemplateScenarioData/properties/bytecode/additionalProperties/type',
                              keyword: 'type',
                              params: { type: 'string' },
                              message: 'must be string',
                            },
                          ];
                          return false;
                        }
                        var valid3 = _errs9 === errors;
                        if (!valid3) {
                          break;
                        }
                      }
                    } else {
                      validate26.errors = [
                        {
                          instancePath: instancePath + '/data/bytecode',
                          schemaPath:
                            '#/definitions/WalletTemplateScenarioData/properties/bytecode/type',
                          keyword: 'type',
                          params: { type: 'object' },
                          message: 'must be object',
                        },
                      ];
                      return false;
                    }
                  }
                  var valid2 = _errs6 === errors;
                } else {
                  var valid2 = true;
                }
                if (valid2) {
                  if (data0.currentBlockHeight !== undefined) {
                    let data3 = data0.currentBlockHeight;
                    const _errs11 = errors;
                    if (!(typeof data3 == 'number' && isFinite(data3))) {
                      validate26.errors = [
                        {
                          instancePath:
                            instancePath + '/data/currentBlockHeight',
                          schemaPath:
                            '#/definitions/WalletTemplateScenarioData/properties/currentBlockHeight/type',
                          keyword: 'type',
                          params: { type: 'number' },
                          message: 'must be number',
                        },
                      ];
                      return false;
                    }
                    var valid2 = _errs11 === errors;
                  } else {
                    var valid2 = true;
                  }
                  if (valid2) {
                    if (data0.currentBlockTime !== undefined) {
                      let data4 = data0.currentBlockTime;
                      const _errs13 = errors;
                      if (!(typeof data4 == 'number' && isFinite(data4))) {
                        validate26.errors = [
                          {
                            instancePath:
                              instancePath + '/data/currentBlockTime',
                            schemaPath:
                              '#/definitions/WalletTemplateScenarioData/properties/currentBlockTime/type',
                            keyword: 'type',
                            params: { type: 'number' },
                            message: 'must be number',
                          },
                        ];
                        return false;
                      }
                      var valid2 = _errs13 === errors;
                    } else {
                      var valid2 = true;
                    }
                    if (valid2) {
                      if (data0.hdKeys !== undefined) {
                        let data5 = data0.hdKeys;
                        const _errs15 = errors;
                        if (errors === _errs15) {
                          if (
                            data5 &&
                            typeof data5 == 'object' &&
                            !Array.isArray(data5)
                          ) {
                            const _errs17 = errors;
                            for (const key3 in data5) {
                              if (
                                !(
                                  key3 === 'addressIndex' ||
                                  key3 === 'hdPrivateKeys' ||
                                  key3 === 'hdPublicKeys'
                                )
                              ) {
                                validate26.errors = [
                                  {
                                    instancePath: instancePath + '/data/hdKeys',
                                    schemaPath:
                                      '#/definitions/WalletTemplateScenarioData/properties/hdKeys/additionalProperties',
                                    keyword: 'additionalProperties',
                                    params: { additionalProperty: key3 },
                                    message:
                                      'must NOT have additional properties',
                                  },
                                ];
                                return false;
                                break;
                              }
                            }
                            if (_errs17 === errors) {
                              if (data5.addressIndex !== undefined) {
                                let data6 = data5.addressIndex;
                                const _errs18 = errors;
                                if (
                                  !(typeof data6 == 'number' && isFinite(data6))
                                ) {
                                  validate26.errors = [
                                    {
                                      instancePath:
                                        instancePath +
                                        '/data/hdKeys/addressIndex',
                                      schemaPath:
                                        '#/definitions/WalletTemplateScenarioData/properties/hdKeys/properties/addressIndex/type',
                                      keyword: 'type',
                                      params: { type: 'number' },
                                      message: 'must be number',
                                    },
                                  ];
                                  return false;
                                }
                                var valid4 = _errs18 === errors;
                              } else {
                                var valid4 = true;
                              }
                              if (valid4) {
                                if (data5.hdPrivateKeys !== undefined) {
                                  let data7 = data5.hdPrivateKeys;
                                  const _errs20 = errors;
                                  if (errors === _errs20) {
                                    if (
                                      data7 &&
                                      typeof data7 == 'object' &&
                                      !Array.isArray(data7)
                                    ) {
                                      for (const key4 in data7) {
                                        const _errs23 = errors;
                                        if (typeof data7[key4] !== 'string') {
                                          validate26.errors = [
                                            {
                                              instancePath:
                                                instancePath +
                                                '/data/hdKeys/hdPrivateKeys/' +
                                                key4
                                                  .replace(/~/g, '~0')
                                                  .replace(/\//g, '~1'),
                                              schemaPath:
                                                '#/definitions/WalletTemplateScenarioData/properties/hdKeys/properties/hdPrivateKeys/additionalProperties/type',
                                              keyword: 'type',
                                              params: { type: 'string' },
                                              message: 'must be string',
                                            },
                                          ];
                                          return false;
                                        }
                                        var valid5 = _errs23 === errors;
                                        if (!valid5) {
                                          break;
                                        }
                                      }
                                    } else {
                                      validate26.errors = [
                                        {
                                          instancePath:
                                            instancePath +
                                            '/data/hdKeys/hdPrivateKeys',
                                          schemaPath:
                                            '#/definitions/WalletTemplateScenarioData/properties/hdKeys/properties/hdPrivateKeys/type',
                                          keyword: 'type',
                                          params: { type: 'object' },
                                          message: 'must be object',
                                        },
                                      ];
                                      return false;
                                    }
                                  }
                                  var valid4 = _errs20 === errors;
                                } else {
                                  var valid4 = true;
                                }
                                if (valid4) {
                                  if (data5.hdPublicKeys !== undefined) {
                                    let data9 = data5.hdPublicKeys;
                                    const _errs25 = errors;
                                    if (errors === _errs25) {
                                      if (
                                        data9 &&
                                        typeof data9 == 'object' &&
                                        !Array.isArray(data9)
                                      ) {
                                        for (const key5 in data9) {
                                          const _errs28 = errors;
                                          if (typeof data9[key5] !== 'string') {
                                            validate26.errors = [
                                              {
                                                instancePath:
                                                  instancePath +
                                                  '/data/hdKeys/hdPublicKeys/' +
                                                  key5
                                                    .replace(/~/g, '~0')
                                                    .replace(/\//g, '~1'),
                                                schemaPath:
                                                  '#/definitions/WalletTemplateScenarioData/properties/hdKeys/properties/hdPublicKeys/additionalProperties/type',
                                                keyword: 'type',
                                                params: { type: 'string' },
                                                message: 'must be string',
                                              },
                                            ];
                                            return false;
                                          }
                                          var valid6 = _errs28 === errors;
                                          if (!valid6) {
                                            break;
                                          }
                                        }
                                      } else {
                                        validate26.errors = [
                                          {
                                            instancePath:
                                              instancePath +
                                              '/data/hdKeys/hdPublicKeys',
                                            schemaPath:
                                              '#/definitions/WalletTemplateScenarioData/properties/hdKeys/properties/hdPublicKeys/type',
                                            keyword: 'type',
                                            params: { type: 'object' },
                                            message: 'must be object',
                                          },
                                        ];
                                        return false;
                                      }
                                    }
                                    var valid4 = _errs25 === errors;
                                  } else {
                                    var valid4 = true;
                                  }
                                }
                              }
                            }
                          } else {
                            validate26.errors = [
                              {
                                instancePath: instancePath + '/data/hdKeys',
                                schemaPath:
                                  '#/definitions/WalletTemplateScenarioData/properties/hdKeys/type',
                                keyword: 'type',
                                params: { type: 'object' },
                                message: 'must be object',
                              },
                            ];
                            return false;
                          }
                        }
                        var valid2 = _errs15 === errors;
                      } else {
                        var valid2 = true;
                      }
                      if (valid2) {
                        if (data0.keys !== undefined) {
                          let data11 = data0.keys;
                          const _errs30 = errors;
                          if (errors === _errs30) {
                            if (
                              data11 &&
                              typeof data11 == 'object' &&
                              !Array.isArray(data11)
                            ) {
                              const _errs32 = errors;
                              for (const key6 in data11) {
                                if (!(key6 === 'privateKeys')) {
                                  validate26.errors = [
                                    {
                                      instancePath: instancePath + '/data/keys',
                                      schemaPath:
                                        '#/definitions/WalletTemplateScenarioData/properties/keys/additionalProperties',
                                      keyword: 'additionalProperties',
                                      params: { additionalProperty: key6 },
                                      message:
                                        'must NOT have additional properties',
                                    },
                                  ];
                                  return false;
                                  break;
                                }
                              }
                              if (_errs32 === errors) {
                                if (data11.privateKeys !== undefined) {
                                  let data12 = data11.privateKeys;
                                  const _errs33 = errors;
                                  if (errors === _errs33) {
                                    if (
                                      data12 &&
                                      typeof data12 == 'object' &&
                                      !Array.isArray(data12)
                                    ) {
                                      for (const key7 in data12) {
                                        const _errs36 = errors;
                                        if (typeof data12[key7] !== 'string') {
                                          validate26.errors = [
                                            {
                                              instancePath:
                                                instancePath +
                                                '/data/keys/privateKeys/' +
                                                key7
                                                  .replace(/~/g, '~0')
                                                  .replace(/\//g, '~1'),
                                              schemaPath:
                                                '#/definitions/WalletTemplateScenarioData/properties/keys/properties/privateKeys/additionalProperties/type',
                                              keyword: 'type',
                                              params: { type: 'string' },
                                              message: 'must be string',
                                            },
                                          ];
                                          return false;
                                        }
                                        var valid8 = _errs36 === errors;
                                        if (!valid8) {
                                          break;
                                        }
                                      }
                                    } else {
                                      validate26.errors = [
                                        {
                                          instancePath:
                                            instancePath +
                                            '/data/keys/privateKeys',
                                          schemaPath:
                                            '#/definitions/WalletTemplateScenarioData/properties/keys/properties/privateKeys/type',
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
                            } else {
                              validate26.errors = [
                                {
                                  instancePath: instancePath + '/data/keys',
                                  schemaPath:
                                    '#/definitions/WalletTemplateScenarioData/properties/keys/type',
                                  keyword: 'type',
                                  params: { type: 'object' },
                                  message: 'must be object',
                                },
                              ];
                              return false;
                            }
                          }
                          var valid2 = _errs30 === errors;
                        } else {
                          var valid2 = true;
                        }
                      }
                    }
                  }
                }
              }
            } else {
              validate26.errors = [
                {
                  instancePath: instancePath + '/data',
                  schemaPath: '#/definitions/WalletTemplateScenarioData/type',
                  keyword: 'type',
                  params: { type: 'object' },
                  message: 'must be object',
                },
              ];
              return false;
            }
          }
          var valid0 = _errs2 === errors;
        } else {
          var valid0 = true;
        }
        if (valid0) {
          if (data.description !== undefined) {
            const _errs38 = errors;
            if (typeof data.description !== 'string') {
              validate26.errors = [
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
            var valid0 = _errs38 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.extends !== undefined) {
              const _errs40 = errors;
              if (typeof data.extends !== 'string') {
                validate26.errors = [
                  {
                    instancePath: instancePath + '/extends',
                    schemaPath: '#/properties/extends/type',
                    keyword: 'type',
                    params: { type: 'string' },
                    message: 'must be string',
                  },
                ];
                return false;
              }
              var valid0 = _errs40 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.name !== undefined) {
                const _errs42 = errors;
                if (typeof data.name !== 'string') {
                  validate26.errors = [
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
                var valid0 = _errs42 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.sourceOutputs !== undefined) {
                  let data17 = data.sourceOutputs;
                  const _errs44 = errors;
                  if (errors === _errs44) {
                    if (Array.isArray(data17)) {
                      var valid9 = true;
                      const len0 = data17.length;
                      for (let i0 = 0; i0 < len0; i0++) {
                        const _errs46 = errors;
                        if (
                          !validate27(data17[i0], {
                            instancePath: instancePath + '/sourceOutputs/' + i0,
                            parentData: data17,
                            parentDataProperty: i0,
                            rootData,
                          })
                        ) {
                          vErrors =
                            vErrors === null
                              ? validate27.errors
                              : vErrors.concat(validate27.errors);
                          errors = vErrors.length;
                        }
                        var valid9 = _errs46 === errors;
                        if (!valid9) {
                          break;
                        }
                      }
                    } else {
                      validate26.errors = [
                        {
                          instancePath: instancePath + '/sourceOutputs',
                          schemaPath: '#/properties/sourceOutputs/type',
                          keyword: 'type',
                          params: { type: 'array' },
                          message: 'must be array',
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
                  if (data.transaction !== undefined) {
                    let data19 = data.transaction;
                    const _errs47 = errors;
                    if (errors === _errs47) {
                      if (
                        data19 &&
                        typeof data19 == 'object' &&
                        !Array.isArray(data19)
                      ) {
                        const _errs49 = errors;
                        for (const key8 in data19) {
                          if (
                            !(
                              key8 === 'inputs' ||
                              key8 === 'locktime' ||
                              key8 === 'outputs' ||
                              key8 === 'version'
                            )
                          ) {
                            validate26.errors = [
                              {
                                instancePath: instancePath + '/transaction',
                                schemaPath:
                                  '#/properties/transaction/additionalProperties',
                                keyword: 'additionalProperties',
                                params: { additionalProperty: key8 },
                                message: 'must NOT have additional properties',
                              },
                            ];
                            return false;
                            break;
                          }
                        }
                        if (_errs49 === errors) {
                          if (data19.inputs !== undefined) {
                            let data20 = data19.inputs;
                            const _errs50 = errors;
                            if (errors === _errs50) {
                              if (Array.isArray(data20)) {
                                var valid11 = true;
                                const len1 = data20.length;
                                for (let i1 = 0; i1 < len1; i1++) {
                                  const _errs52 = errors;
                                  if (
                                    !validate31(data20[i1], {
                                      instancePath:
                                        instancePath +
                                        '/transaction/inputs/' +
                                        i1,
                                      parentData: data20,
                                      parentDataProperty: i1,
                                      rootData,
                                    })
                                  ) {
                                    vErrors =
                                      vErrors === null
                                        ? validate31.errors
                                        : vErrors.concat(validate31.errors);
                                    errors = vErrors.length;
                                  }
                                  var valid11 = _errs52 === errors;
                                  if (!valid11) {
                                    break;
                                  }
                                }
                              } else {
                                validate26.errors = [
                                  {
                                    instancePath:
                                      instancePath + '/transaction/inputs',
                                    schemaPath:
                                      '#/properties/transaction/properties/inputs/type',
                                    keyword: 'type',
                                    params: { type: 'array' },
                                    message: 'must be array',
                                  },
                                ];
                                return false;
                              }
                            }
                            var valid10 = _errs50 === errors;
                          } else {
                            var valid10 = true;
                          }
                          if (valid10) {
                            if (data19.locktime !== undefined) {
                              let data22 = data19.locktime;
                              const _errs53 = errors;
                              if (
                                !(typeof data22 == 'number' && isFinite(data22))
                              ) {
                                validate26.errors = [
                                  {
                                    instancePath:
                                      instancePath + '/transaction/locktime',
                                    schemaPath:
                                      '#/properties/transaction/properties/locktime/type',
                                    keyword: 'type',
                                    params: { type: 'number' },
                                    message: 'must be number',
                                  },
                                ];
                                return false;
                              }
                              var valid10 = _errs53 === errors;
                            } else {
                              var valid10 = true;
                            }
                            if (valid10) {
                              if (data19.outputs !== undefined) {
                                let data23 = data19.outputs;
                                const _errs55 = errors;
                                if (errors === _errs55) {
                                  if (Array.isArray(data23)) {
                                    var valid12 = true;
                                    const len2 = data23.length;
                                    for (let i2 = 0; i2 < len2; i2++) {
                                      const _errs57 = errors;
                                      if (
                                        !validate34(data23[i2], {
                                          instancePath:
                                            instancePath +
                                            '/transaction/outputs/' +
                                            i2,
                                          parentData: data23,
                                          parentDataProperty: i2,
                                          rootData,
                                        })
                                      ) {
                                        vErrors =
                                          vErrors === null
                                            ? validate34.errors
                                            : vErrors.concat(validate34.errors);
                                        errors = vErrors.length;
                                      }
                                      var valid12 = _errs57 === errors;
                                      if (!valid12) {
                                        break;
                                      }
                                    }
                                  } else {
                                    validate26.errors = [
                                      {
                                        instancePath:
                                          instancePath + '/transaction/outputs',
                                        schemaPath:
                                          '#/properties/transaction/properties/outputs/type',
                                        keyword: 'type',
                                        params: { type: 'array' },
                                        message: 'must be array',
                                      },
                                    ];
                                    return false;
                                  }
                                }
                                var valid10 = _errs55 === errors;
                              } else {
                                var valid10 = true;
                              }
                              if (valid10) {
                                if (data19.version !== undefined) {
                                  let data25 = data19.version;
                                  const _errs58 = errors;
                                  if (
                                    !(
                                      typeof data25 == 'number' &&
                                      isFinite(data25)
                                    )
                                  ) {
                                    validate26.errors = [
                                      {
                                        instancePath:
                                          instancePath + '/transaction/version',
                                        schemaPath:
                                          '#/properties/transaction/properties/version/type',
                                        keyword: 'type',
                                        params: { type: 'number' },
                                        message: 'must be number',
                                      },
                                    ];
                                    return false;
                                  }
                                  var valid10 = _errs58 === errors;
                                } else {
                                  var valid10 = true;
                                }
                              }
                            }
                          }
                        }
                      } else {
                        validate26.errors = [
                          {
                            instancePath: instancePath + '/transaction',
                            schemaPath: '#/properties/transaction/type',
                            keyword: 'type',
                            params: { type: 'object' },
                            message: 'must be object',
                          },
                        ];
                        return false;
                      }
                    }
                    var valid0 = _errs47 === errors;
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
const schema39 = {
  additionalProperties: false,
  properties: {
    name: {
      description:
        'A single-line, human-readable name for this script (for use in user interfaces).',
      type: 'string',
    },
    pushed: {
      description:
        'If set to `true`, indicates that this script should be wrapped in a push statement for testing.\n\nThis is useful for scripts that serve as "bytecode templates" – e.g. formatted messages or signature preimages. These scripts are typically not evaluated as bytecode but appear within push statements elsewhere in the template.\n\nDefaults to `false`.',
      type: 'boolean',
    },
    script: {
      description: 'The script definition in CashAssembly.',
      type: 'string',
    },
    tests: {
      additionalProperties: { $ref: '#/definitions/WalletTemplateScriptTest' },
      description:
        'One or more tests that can be used during development and during template validation to confirm the correctness of this tested script.',
      type: 'object',
    },
  },
  required: ['script', 'tests'],
  type: 'object',
};
const schema40 = {
  additionalProperties: false,
  properties: {
    check: {
      description:
        'The script to evaluate after the script being tested. This can be used to check that the tested script leaves the expected results on the stack. For example, if the tested script is expected to leave 3 items of a specific size on the stack, the `check` script could pop each resulting item from the stack and examine it for correctness.\n\nIn scenario testing, this script is appended to the script under test, and together they are treated as the locking script. Program evaluation is considered successful if the resulting program state can be verified by the virtual machine (e.g. the resulting stack contains a single `1`, no errors are produced, etc.).',
      type: 'string',
    },
    fails: {
      description:
        'A list of the scenario identifiers that – when used to compile this test and the script it tests – result in bytecode that fails program verification. The `setup` script is used in place of an unlocking script, and the concatenation of the script under test and the `check` script are used in place of a locking script.\n\nThese scenarios can be used to test this script in development and review.',
      items: { type: 'string' },
      type: 'array',
    },
    invalid: {
      description:
        'A list of the scenario identifiers that – when used to compile this test and the script it tests – result in a compilation error. The `setup` script is used in place of an unlocking script, and the concatenation of the script under test and the `check` script are used in place of a locking script.\n\nThese scenarios can be used to test this script in development and review.',
      items: { type: 'string' },
      type: 'array',
    },
    name: {
      description:
        'A single-line, Title Case, human-readable name for this test (for use in user interfaces).',
      type: 'string',
    },
    passes: {
      description:
        'A list of the scenario identifiers that – when used to compile this test and the script it tests – result in bytecode that passes program verification. The `setup` script is used in place of an unlocking script, and the concatenation of the script under test and the `check` script are used in place of a locking script.\n\nThese scenarios can be used to test this script in development and review.',
      items: { type: 'string' },
      type: 'array',
    },
    setup: {
      description:
        'A script to evaluate before the script being tested. This can be used to push values to the stack that are operated on by the tested script.\n\nIn scenario testing, this script is treated as the unlocking script.',
      type: 'string',
    },
  },
  required: ['check'],
  type: 'object',
};
function validate38(
  data,
  { instancePath = '', parentData, parentDataProperty, rootData = data } = {},
) {
  let vErrors = null;
  let errors = 0;
  if (errors === 0) {
    if (data && typeof data == 'object' && !Array.isArray(data)) {
      let missing0;
      if (
        (data.script === undefined && (missing0 = 'script')) ||
        (data.tests === undefined && (missing0 = 'tests'))
      ) {
        validate38.errors = [
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
              key0 === 'name' ||
              key0 === 'pushed' ||
              key0 === 'script' ||
              key0 === 'tests'
            )
          ) {
            validate38.errors = [
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
          if (data.name !== undefined) {
            const _errs2 = errors;
            if (typeof data.name !== 'string') {
              validate38.errors = [
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
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.pushed !== undefined) {
              const _errs4 = errors;
              if (typeof data.pushed !== 'boolean') {
                validate38.errors = [
                  {
                    instancePath: instancePath + '/pushed',
                    schemaPath: '#/properties/pushed/type',
                    keyword: 'type',
                    params: { type: 'boolean' },
                    message: 'must be boolean',
                  },
                ];
                return false;
              }
              var valid0 = _errs4 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.script !== undefined) {
                const _errs6 = errors;
                if (typeof data.script !== 'string') {
                  validate38.errors = [
                    {
                      instancePath: instancePath + '/script',
                      schemaPath: '#/properties/script/type',
                      keyword: 'type',
                      params: { type: 'string' },
                      message: 'must be string',
                    },
                  ];
                  return false;
                }
                var valid0 = _errs6 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.tests !== undefined) {
                  let data3 = data.tests;
                  const _errs8 = errors;
                  if (errors === _errs8) {
                    if (
                      data3 &&
                      typeof data3 == 'object' &&
                      !Array.isArray(data3)
                    ) {
                      for (const key1 in data3) {
                        let data4 = data3[key1];
                        const _errs11 = errors;
                        const _errs12 = errors;
                        if (errors === _errs12) {
                          if (
                            data4 &&
                            typeof data4 == 'object' &&
                            !Array.isArray(data4)
                          ) {
                            let missing1;
                            if (
                              data4.check === undefined &&
                              (missing1 = 'check')
                            ) {
                              validate38.errors = [
                                {
                                  instancePath:
                                    instancePath +
                                    '/tests/' +
                                    key1
                                      .replace(/~/g, '~0')
                                      .replace(/\//g, '~1'),
                                  schemaPath:
                                    '#/definitions/WalletTemplateScriptTest/required',
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
                              const _errs14 = errors;
                              for (const key2 in data4) {
                                if (
                                  !(
                                    key2 === 'check' ||
                                    key2 === 'fails' ||
                                    key2 === 'invalid' ||
                                    key2 === 'name' ||
                                    key2 === 'passes' ||
                                    key2 === 'setup'
                                  )
                                ) {
                                  validate38.errors = [
                                    {
                                      instancePath:
                                        instancePath +
                                        '/tests/' +
                                        key1
                                          .replace(/~/g, '~0')
                                          .replace(/\//g, '~1'),
                                      schemaPath:
                                        '#/definitions/WalletTemplateScriptTest/additionalProperties',
                                      keyword: 'additionalProperties',
                                      params: { additionalProperty: key2 },
                                      message:
                                        'must NOT have additional properties',
                                    },
                                  ];
                                  return false;
                                  break;
                                }
                              }
                              if (_errs14 === errors) {
                                if (data4.check !== undefined) {
                                  const _errs15 = errors;
                                  if (typeof data4.check !== 'string') {
                                    validate38.errors = [
                                      {
                                        instancePath:
                                          instancePath +
                                          '/tests/' +
                                          key1
                                            .replace(/~/g, '~0')
                                            .replace(/\//g, '~1') +
                                          '/check',
                                        schemaPath:
                                          '#/definitions/WalletTemplateScriptTest/properties/check/type',
                                        keyword: 'type',
                                        params: { type: 'string' },
                                        message: 'must be string',
                                      },
                                    ];
                                    return false;
                                  }
                                  var valid3 = _errs15 === errors;
                                } else {
                                  var valid3 = true;
                                }
                                if (valid3) {
                                  if (data4.fails !== undefined) {
                                    let data6 = data4.fails;
                                    const _errs17 = errors;
                                    if (errors === _errs17) {
                                      if (Array.isArray(data6)) {
                                        var valid4 = true;
                                        const len0 = data6.length;
                                        for (let i0 = 0; i0 < len0; i0++) {
                                          const _errs19 = errors;
                                          if (typeof data6[i0] !== 'string') {
                                            validate38.errors = [
                                              {
                                                instancePath:
                                                  instancePath +
                                                  '/tests/' +
                                                  key1
                                                    .replace(/~/g, '~0')
                                                    .replace(/\//g, '~1') +
                                                  '/fails/' +
                                                  i0,
                                                schemaPath:
                                                  '#/definitions/WalletTemplateScriptTest/properties/fails/items/type',
                                                keyword: 'type',
                                                params: { type: 'string' },
                                                message: 'must be string',
                                              },
                                            ];
                                            return false;
                                          }
                                          var valid4 = _errs19 === errors;
                                          if (!valid4) {
                                            break;
                                          }
                                        }
                                      } else {
                                        validate38.errors = [
                                          {
                                            instancePath:
                                              instancePath +
                                              '/tests/' +
                                              key1
                                                .replace(/~/g, '~0')
                                                .replace(/\//g, '~1') +
                                              '/fails',
                                            schemaPath:
                                              '#/definitions/WalletTemplateScriptTest/properties/fails/type',
                                            keyword: 'type',
                                            params: { type: 'array' },
                                            message: 'must be array',
                                          },
                                        ];
                                        return false;
                                      }
                                    }
                                    var valid3 = _errs17 === errors;
                                  } else {
                                    var valid3 = true;
                                  }
                                  if (valid3) {
                                    if (data4.invalid !== undefined) {
                                      let data8 = data4.invalid;
                                      const _errs21 = errors;
                                      if (errors === _errs21) {
                                        if (Array.isArray(data8)) {
                                          var valid5 = true;
                                          const len1 = data8.length;
                                          for (let i1 = 0; i1 < len1; i1++) {
                                            const _errs23 = errors;
                                            if (typeof data8[i1] !== 'string') {
                                              validate38.errors = [
                                                {
                                                  instancePath:
                                                    instancePath +
                                                    '/tests/' +
                                                    key1
                                                      .replace(/~/g, '~0')
                                                      .replace(/\//g, '~1') +
                                                    '/invalid/' +
                                                    i1,
                                                  schemaPath:
                                                    '#/definitions/WalletTemplateScriptTest/properties/invalid/items/type',
                                                  keyword: 'type',
                                                  params: { type: 'string' },
                                                  message: 'must be string',
                                                },
                                              ];
                                              return false;
                                            }
                                            var valid5 = _errs23 === errors;
                                            if (!valid5) {
                                              break;
                                            }
                                          }
                                        } else {
                                          validate38.errors = [
                                            {
                                              instancePath:
                                                instancePath +
                                                '/tests/' +
                                                key1
                                                  .replace(/~/g, '~0')
                                                  .replace(/\//g, '~1') +
                                                '/invalid',
                                              schemaPath:
                                                '#/definitions/WalletTemplateScriptTest/properties/invalid/type',
                                              keyword: 'type',
                                              params: { type: 'array' },
                                              message: 'must be array',
                                            },
                                          ];
                                          return false;
                                        }
                                      }
                                      var valid3 = _errs21 === errors;
                                    } else {
                                      var valid3 = true;
                                    }
                                    if (valid3) {
                                      if (data4.name !== undefined) {
                                        const _errs25 = errors;
                                        if (typeof data4.name !== 'string') {
                                          validate38.errors = [
                                            {
                                              instancePath:
                                                instancePath +
                                                '/tests/' +
                                                key1
                                                  .replace(/~/g, '~0')
                                                  .replace(/\//g, '~1') +
                                                '/name',
                                              schemaPath:
                                                '#/definitions/WalletTemplateScriptTest/properties/name/type',
                                              keyword: 'type',
                                              params: { type: 'string' },
                                              message: 'must be string',
                                            },
                                          ];
                                          return false;
                                        }
                                        var valid3 = _errs25 === errors;
                                      } else {
                                        var valid3 = true;
                                      }
                                      if (valid3) {
                                        if (data4.passes !== undefined) {
                                          let data11 = data4.passes;
                                          const _errs27 = errors;
                                          if (errors === _errs27) {
                                            if (Array.isArray(data11)) {
                                              var valid6 = true;
                                              const len2 = data11.length;
                                              for (
                                                let i2 = 0;
                                                i2 < len2;
                                                i2++
                                              ) {
                                                const _errs29 = errors;
                                                if (
                                                  typeof data11[i2] !== 'string'
                                                ) {
                                                  validate38.errors = [
                                                    {
                                                      instancePath:
                                                        instancePath +
                                                        '/tests/' +
                                                        key1
                                                          .replace(/~/g, '~0')
                                                          .replace(
                                                            /\//g,
                                                            '~1',
                                                          ) +
                                                        '/passes/' +
                                                        i2,
                                                      schemaPath:
                                                        '#/definitions/WalletTemplateScriptTest/properties/passes/items/type',
                                                      keyword: 'type',
                                                      params: {
                                                        type: 'string',
                                                      },
                                                      message: 'must be string',
                                                    },
                                                  ];
                                                  return false;
                                                }
                                                var valid6 = _errs29 === errors;
                                                if (!valid6) {
                                                  break;
                                                }
                                              }
                                            } else {
                                              validate38.errors = [
                                                {
                                                  instancePath:
                                                    instancePath +
                                                    '/tests/' +
                                                    key1
                                                      .replace(/~/g, '~0')
                                                      .replace(/\//g, '~1') +
                                                    '/passes',
                                                  schemaPath:
                                                    '#/definitions/WalletTemplateScriptTest/properties/passes/type',
                                                  keyword: 'type',
                                                  params: { type: 'array' },
                                                  message: 'must be array',
                                                },
                                              ];
                                              return false;
                                            }
                                          }
                                          var valid3 = _errs27 === errors;
                                        } else {
                                          var valid3 = true;
                                        }
                                        if (valid3) {
                                          if (data4.setup !== undefined) {
                                            const _errs31 = errors;
                                            if (
                                              typeof data4.setup !== 'string'
                                            ) {
                                              validate38.errors = [
                                                {
                                                  instancePath:
                                                    instancePath +
                                                    '/tests/' +
                                                    key1
                                                      .replace(/~/g, '~0')
                                                      .replace(/\//g, '~1') +
                                                    '/setup',
                                                  schemaPath:
                                                    '#/definitions/WalletTemplateScriptTest/properties/setup/type',
                                                  keyword: 'type',
                                                  params: { type: 'string' },
                                                  message: 'must be string',
                                                },
                                              ];
                                              return false;
                                            }
                                            var valid3 = _errs31 === errors;
                                          } else {
                                            var valid3 = true;
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          } else {
                            validate38.errors = [
                              {
                                instancePath:
                                  instancePath +
                                  '/tests/' +
                                  key1.replace(/~/g, '~0').replace(/\//g, '~1'),
                                schemaPath:
                                  '#/definitions/WalletTemplateScriptTest/type',
                                keyword: 'type',
                                params: { type: 'object' },
                                message: 'must be object',
                              },
                            ];
                            return false;
                          }
                        }
                        var valid1 = _errs11 === errors;
                        if (!valid1) {
                          break;
                        }
                      }
                    } else {
                      validate38.errors = [
                        {
                          instancePath: instancePath + '/tests',
                          schemaPath: '#/properties/tests/type',
                          keyword: 'type',
                          params: { type: 'object' },
                          message: 'must be object',
                        },
                      ];
                      return false;
                    }
                  }
                  var valid0 = _errs8 === errors;
                } else {
                  var valid0 = true;
                }
              }
            }
          }
        }
      }
    } else {
      validate38.errors = [
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
  validate38.errors = vErrors;
  return errors === 0;
}
const func4 = Object.prototype.hasOwnProperty;
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
        (data.entities === undefined && (missing0 = 'entities')) ||
        (data.scripts === undefined && (missing0 = 'scripts')) ||
        (data.supported === undefined && (missing0 = 'supported')) ||
        (data.version === undefined && (missing0 = 'version'))
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
          if (
            !(
              key0 === '$schema' ||
              key0 === 'description' ||
              key0 === 'entities' ||
              key0 === 'name' ||
              key0 === 'scenarios' ||
              key0 === 'scripts' ||
              key0 === 'supported' ||
              key0 === 'version'
            )
          ) {
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
            if (data.description !== undefined) {
              const _errs4 = errors;
              if (typeof data.description !== 'string') {
                validate21.errors = [
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
              var valid0 = _errs4 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.entities !== undefined) {
                let data2 = data.entities;
                const _errs6 = errors;
                if (errors === _errs6) {
                  if (
                    data2 &&
                    typeof data2 == 'object' &&
                    !Array.isArray(data2)
                  ) {
                    for (const key1 in data2) {
                      const _errs9 = errors;
                      if (
                        !validate22(data2[key1], {
                          instancePath:
                            instancePath +
                            '/entities/' +
                            key1.replace(/~/g, '~0').replace(/\//g, '~1'),
                          parentData: data2,
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
                      var valid1 = _errs9 === errors;
                      if (!valid1) {
                        break;
                      }
                    }
                  } else {
                    validate21.errors = [
                      {
                        instancePath: instancePath + '/entities',
                        schemaPath: '#/properties/entities/type',
                        keyword: 'type',
                        params: { type: 'object' },
                        message: 'must be object',
                      },
                    ];
                    return false;
                  }
                }
                var valid0 = _errs6 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.name !== undefined) {
                  const _errs10 = errors;
                  if (typeof data.name !== 'string') {
                    validate21.errors = [
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
                  var valid0 = _errs10 === errors;
                } else {
                  var valid0 = true;
                }
                if (valid0) {
                  if (data.scenarios !== undefined) {
                    let data5 = data.scenarios;
                    const _errs12 = errors;
                    if (errors === _errs12) {
                      if (
                        data5 &&
                        typeof data5 == 'object' &&
                        !Array.isArray(data5)
                      ) {
                        for (const key2 in data5) {
                          const _errs15 = errors;
                          if (
                            !validate26(data5[key2], {
                              instancePath:
                                instancePath +
                                '/scenarios/' +
                                key2.replace(/~/g, '~0').replace(/\//g, '~1'),
                              parentData: data5,
                              parentDataProperty: key2,
                              rootData,
                            })
                          ) {
                            vErrors =
                              vErrors === null
                                ? validate26.errors
                                : vErrors.concat(validate26.errors);
                            errors = vErrors.length;
                          }
                          var valid2 = _errs15 === errors;
                          if (!valid2) {
                            break;
                          }
                        }
                      } else {
                        validate21.errors = [
                          {
                            instancePath: instancePath + '/scenarios',
                            schemaPath: '#/properties/scenarios/type',
                            keyword: 'type',
                            params: { type: 'object' },
                            message: 'must be object',
                          },
                        ];
                        return false;
                      }
                    }
                    var valid0 = _errs12 === errors;
                  } else {
                    var valid0 = true;
                  }
                  if (valid0) {
                    if (data.scripts !== undefined) {
                      let data7 = data.scripts;
                      const _errs16 = errors;
                      if (errors === _errs16) {
                        if (
                          data7 &&
                          typeof data7 == 'object' &&
                          !Array.isArray(data7)
                        ) {
                          for (const key3 in data7) {
                            let data8 = data7[key3];
                            const _errs19 = errors;
                            const _errs20 = errors;
                            let valid4 = false;
                            const _errs21 = errors;
                            const _errs22 = errors;
                            if (errors === _errs22) {
                              if (
                                data8 &&
                                typeof data8 == 'object' &&
                                !Array.isArray(data8)
                              ) {
                                let missing1;
                                if (
                                  data8.script === undefined &&
                                  (missing1 = 'script')
                                ) {
                                  const err0 = {
                                    instancePath:
                                      instancePath +
                                      '/scripts/' +
                                      key3
                                        .replace(/~/g, '~0')
                                        .replace(/\//g, '~1'),
                                    schemaPath:
                                      '#/definitions/WalletTemplateScript/required',
                                    keyword: 'required',
                                    params: { missingProperty: missing1 },
                                    message:
                                      "must have required property '" +
                                      missing1 +
                                      "'",
                                  };
                                  if (vErrors === null) {
                                    vErrors = [err0];
                                  } else {
                                    vErrors.push(err0);
                                  }
                                  errors++;
                                } else {
                                  const _errs24 = errors;
                                  for (const key4 in data8) {
                                    if (
                                      !(key4 === 'name' || key4 === 'script')
                                    ) {
                                      const err1 = {
                                        instancePath:
                                          instancePath +
                                          '/scripts/' +
                                          key3
                                            .replace(/~/g, '~0')
                                            .replace(/\//g, '~1'),
                                        schemaPath:
                                          '#/definitions/WalletTemplateScript/additionalProperties',
                                        keyword: 'additionalProperties',
                                        params: { additionalProperty: key4 },
                                        message:
                                          'must NOT have additional properties',
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
                                  if (_errs24 === errors) {
                                    if (data8.name !== undefined) {
                                      const _errs25 = errors;
                                      if (typeof data8.name !== 'string') {
                                        const err2 = {
                                          instancePath:
                                            instancePath +
                                            '/scripts/' +
                                            key3
                                              .replace(/~/g, '~0')
                                              .replace(/\//g, '~1') +
                                            '/name',
                                          schemaPath:
                                            '#/definitions/WalletTemplateScript/properties/name/type',
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
                                      var valid6 = _errs25 === errors;
                                    } else {
                                      var valid6 = true;
                                    }
                                    if (valid6) {
                                      if (data8.script !== undefined) {
                                        const _errs27 = errors;
                                        if (typeof data8.script !== 'string') {
                                          const err3 = {
                                            instancePath:
                                              instancePath +
                                              '/scripts/' +
                                              key3
                                                .replace(/~/g, '~0')
                                                .replace(/\//g, '~1') +
                                              '/script',
                                            schemaPath:
                                              '#/definitions/WalletTemplateScript/properties/script/type',
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
                                        var valid6 = _errs27 === errors;
                                      } else {
                                        var valid6 = true;
                                      }
                                    }
                                  }
                                }
                              } else {
                                const err4 = {
                                  instancePath:
                                    instancePath +
                                    '/scripts/' +
                                    key3
                                      .replace(/~/g, '~0')
                                      .replace(/\//g, '~1'),
                                  schemaPath:
                                    '#/definitions/WalletTemplateScript/type',
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
                            var _valid0 = _errs21 === errors;
                            valid4 = valid4 || _valid0;
                            if (!valid4) {
                              const _errs29 = errors;
                              const _errs30 = errors;
                              if (errors === _errs30) {
                                if (
                                  data8 &&
                                  typeof data8 == 'object' &&
                                  !Array.isArray(data8)
                                ) {
                                  let missing2;
                                  if (
                                    (data8.lockingType === undefined &&
                                      (missing2 = 'lockingType')) ||
                                    (data8.script === undefined &&
                                      (missing2 = 'script'))
                                  ) {
                                    const err5 = {
                                      instancePath:
                                        instancePath +
                                        '/scripts/' +
                                        key3
                                          .replace(/~/g, '~0')
                                          .replace(/\//g, '~1'),
                                      schemaPath:
                                        '#/definitions/WalletTemplateScriptLocking/required',
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
                                    const _errs32 = errors;
                                    for (const key5 in data8) {
                                      if (
                                        !(
                                          key5 === 'lockingType' ||
                                          key5 === 'name' ||
                                          key5 === 'script'
                                        )
                                      ) {
                                        const err6 = {
                                          instancePath:
                                            instancePath +
                                            '/scripts/' +
                                            key3
                                              .replace(/~/g, '~0')
                                              .replace(/\//g, '~1'),
                                          schemaPath:
                                            '#/definitions/WalletTemplateScriptLocking/additionalProperties',
                                          keyword: 'additionalProperties',
                                          params: { additionalProperty: key5 },
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
                                    if (_errs32 === errors) {
                                      if (data8.lockingType !== undefined) {
                                        let data11 = data8.lockingType;
                                        const _errs33 = errors;
                                        if (typeof data11 !== 'string') {
                                          const err7 = {
                                            instancePath:
                                              instancePath +
                                              '/scripts/' +
                                              key3
                                                .replace(/~/g, '~0')
                                                .replace(/\//g, '~1') +
                                              '/lockingType',
                                            schemaPath:
                                              '#/definitions/WalletTemplateScriptLocking/properties/lockingType/type',
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
                                        if (
                                          !(
                                            data11 === 'p2sh20' ||
                                            data11 === 'p2sh32' ||
                                            data11 === 'standard'
                                          )
                                        ) {
                                          const err8 = {
                                            instancePath:
                                              instancePath +
                                              '/scripts/' +
                                              key3
                                                .replace(/~/g, '~0')
                                                .replace(/\//g, '~1') +
                                              '/lockingType',
                                            schemaPath:
                                              '#/definitions/WalletTemplateScriptLocking/properties/lockingType/enum',
                                            keyword: 'enum',
                                            params: {
                                              allowedValues:
                                                schema38.properties.lockingType
                                                  .enum,
                                            },
                                            message:
                                              'must be equal to one of the allowed values',
                                          };
                                          if (vErrors === null) {
                                            vErrors = [err8];
                                          } else {
                                            vErrors.push(err8);
                                          }
                                          errors++;
                                        }
                                        var valid8 = _errs33 === errors;
                                      } else {
                                        var valid8 = true;
                                      }
                                      if (valid8) {
                                        if (data8.name !== undefined) {
                                          const _errs35 = errors;
                                          if (typeof data8.name !== 'string') {
                                            const err9 = {
                                              instancePath:
                                                instancePath +
                                                '/scripts/' +
                                                key3
                                                  .replace(/~/g, '~0')
                                                  .replace(/\//g, '~1') +
                                                '/name',
                                              schemaPath:
                                                '#/definitions/WalletTemplateScriptLocking/properties/name/type',
                                              keyword: 'type',
                                              params: { type: 'string' },
                                              message: 'must be string',
                                            };
                                            if (vErrors === null) {
                                              vErrors = [err9];
                                            } else {
                                              vErrors.push(err9);
                                            }
                                            errors++;
                                          }
                                          var valid8 = _errs35 === errors;
                                        } else {
                                          var valid8 = true;
                                        }
                                        if (valid8) {
                                          if (data8.script !== undefined) {
                                            const _errs37 = errors;
                                            if (
                                              typeof data8.script !== 'string'
                                            ) {
                                              const err10 = {
                                                instancePath:
                                                  instancePath +
                                                  '/scripts/' +
                                                  key3
                                                    .replace(/~/g, '~0')
                                                    .replace(/\//g, '~1') +
                                                  '/script',
                                                schemaPath:
                                                  '#/definitions/WalletTemplateScriptLocking/properties/script/type',
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
                                            var valid8 = _errs37 === errors;
                                          } else {
                                            var valid8 = true;
                                          }
                                        }
                                      }
                                    }
                                  }
                                } else {
                                  const err11 = {
                                    instancePath:
                                      instancePath +
                                      '/scripts/' +
                                      key3
                                        .replace(/~/g, '~0')
                                        .replace(/\//g, '~1'),
                                    schemaPath:
                                      '#/definitions/WalletTemplateScriptLocking/type',
                                    keyword: 'type',
                                    params: { type: 'object' },
                                    message: 'must be object',
                                  };
                                  if (vErrors === null) {
                                    vErrors = [err11];
                                  } else {
                                    vErrors.push(err11);
                                  }
                                  errors++;
                                }
                              }
                              var _valid0 = _errs29 === errors;
                              valid4 = valid4 || _valid0;
                              if (!valid4) {
                                const _errs39 = errors;
                                if (
                                  !validate38(data8, {
                                    instancePath:
                                      instancePath +
                                      '/scripts/' +
                                      key3
                                        .replace(/~/g, '~0')
                                        .replace(/\//g, '~1'),
                                    parentData: data7,
                                    parentDataProperty: key3,
                                    rootData,
                                  })
                                ) {
                                  vErrors =
                                    vErrors === null
                                      ? validate38.errors
                                      : vErrors.concat(validate38.errors);
                                  errors = vErrors.length;
                                }
                                var _valid0 = _errs39 === errors;
                                valid4 = valid4 || _valid0;
                                if (!valid4) {
                                  const _errs40 = errors;
                                  const _errs41 = errors;
                                  if (errors === _errs41) {
                                    if (
                                      data8 &&
                                      typeof data8 == 'object' &&
                                      !Array.isArray(data8)
                                    ) {
                                      let missing3;
                                      if (
                                        (data8.script === undefined &&
                                          (missing3 = 'script')) ||
                                        (data8.unlocks === undefined &&
                                          (missing3 = 'unlocks'))
                                      ) {
                                        const err12 = {
                                          instancePath:
                                            instancePath +
                                            '/scripts/' +
                                            key3
                                              .replace(/~/g, '~0')
                                              .replace(/\//g, '~1'),
                                          schemaPath:
                                            '#/definitions/WalletTemplateScriptUnlocking/required',
                                          keyword: 'required',
                                          params: { missingProperty: missing3 },
                                          message:
                                            "must have required property '" +
                                            missing3 +
                                            "'",
                                        };
                                        if (vErrors === null) {
                                          vErrors = [err12];
                                        } else {
                                          vErrors.push(err12);
                                        }
                                        errors++;
                                      } else {
                                        const _errs43 = errors;
                                        for (const key6 in data8) {
                                          if (
                                            !func4.call(
                                              schema41.properties,
                                              key6,
                                            )
                                          ) {
                                            const err13 = {
                                              instancePath:
                                                instancePath +
                                                '/scripts/' +
                                                key3
                                                  .replace(/~/g, '~0')
                                                  .replace(/\//g, '~1'),
                                              schemaPath:
                                                '#/definitions/WalletTemplateScriptUnlocking/additionalProperties',
                                              keyword: 'additionalProperties',
                                              params: {
                                                additionalProperty: key6,
                                              },
                                              message:
                                                'must NOT have additional properties',
                                            };
                                            if (vErrors === null) {
                                              vErrors = [err13];
                                            } else {
                                              vErrors.push(err13);
                                            }
                                            errors++;
                                            break;
                                          }
                                        }
                                        if (_errs43 === errors) {
                                          if (data8.ageLock !== undefined) {
                                            const _errs44 = errors;
                                            if (
                                              typeof data8.ageLock !== 'string'
                                            ) {
                                              const err14 = {
                                                instancePath:
                                                  instancePath +
                                                  '/scripts/' +
                                                  key3
                                                    .replace(/~/g, '~0')
                                                    .replace(/\//g, '~1') +
                                                  '/ageLock',
                                                schemaPath:
                                                  '#/definitions/WalletTemplateScriptUnlocking/properties/ageLock/type',
                                                keyword: 'type',
                                                params: { type: 'string' },
                                                message: 'must be string',
                                              };
                                              if (vErrors === null) {
                                                vErrors = [err14];
                                              } else {
                                                vErrors.push(err14);
                                              }
                                              errors++;
                                            }
                                            var valid10 = _errs44 === errors;
                                          } else {
                                            var valid10 = true;
                                          }
                                          if (valid10) {
                                            if (data8.estimate !== undefined) {
                                              const _errs46 = errors;
                                              if (
                                                typeof data8.estimate !==
                                                'string'
                                              ) {
                                                const err15 = {
                                                  instancePath:
                                                    instancePath +
                                                    '/scripts/' +
                                                    key3
                                                      .replace(/~/g, '~0')
                                                      .replace(/\//g, '~1') +
                                                    '/estimate',
                                                  schemaPath:
                                                    '#/definitions/WalletTemplateScriptUnlocking/properties/estimate/type',
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
                                              var valid10 = _errs46 === errors;
                                            } else {
                                              var valid10 = true;
                                            }
                                            if (valid10) {
                                              if (data8.fails !== undefined) {
                                                let data16 = data8.fails;
                                                const _errs48 = errors;
                                                if (errors === _errs48) {
                                                  if (Array.isArray(data16)) {
                                                    var valid11 = true;
                                                    const len0 = data16.length;
                                                    for (
                                                      let i0 = 0;
                                                      i0 < len0;
                                                      i0++
                                                    ) {
                                                      const _errs50 = errors;
                                                      if (
                                                        typeof data16[i0] !==
                                                        'string'
                                                      ) {
                                                        const err16 = {
                                                          instancePath:
                                                            instancePath +
                                                            '/scripts/' +
                                                            key3
                                                              .replace(
                                                                /~/g,
                                                                '~0',
                                                              )
                                                              .replace(
                                                                /\//g,
                                                                '~1',
                                                              ) +
                                                            '/fails/' +
                                                            i0,
                                                          schemaPath:
                                                            '#/definitions/WalletTemplateScriptUnlocking/properties/fails/items/type',
                                                          keyword: 'type',
                                                          params: {
                                                            type: 'string',
                                                          },
                                                          message:
                                                            'must be string',
                                                        };
                                                        if (vErrors === null) {
                                                          vErrors = [err16];
                                                        } else {
                                                          vErrors.push(err16);
                                                        }
                                                        errors++;
                                                      }
                                                      var valid11 =
                                                        _errs50 === errors;
                                                      if (!valid11) {
                                                        break;
                                                      }
                                                    }
                                                  } else {
                                                    const err17 = {
                                                      instancePath:
                                                        instancePath +
                                                        '/scripts/' +
                                                        key3
                                                          .replace(/~/g, '~0')
                                                          .replace(
                                                            /\//g,
                                                            '~1',
                                                          ) +
                                                        '/fails',
                                                      schemaPath:
                                                        '#/definitions/WalletTemplateScriptUnlocking/properties/fails/type',
                                                      keyword: 'type',
                                                      params: { type: 'array' },
                                                      message: 'must be array',
                                                    };
                                                    if (vErrors === null) {
                                                      vErrors = [err17];
                                                    } else {
                                                      vErrors.push(err17);
                                                    }
                                                    errors++;
                                                  }
                                                }
                                                var valid10 =
                                                  _errs48 === errors;
                                              } else {
                                                var valid10 = true;
                                              }
                                              if (valid10) {
                                                if (
                                                  data8.invalid !== undefined
                                                ) {
                                                  let data18 = data8.invalid;
                                                  const _errs52 = errors;
                                                  if (errors === _errs52) {
                                                    if (Array.isArray(data18)) {
                                                      var valid12 = true;
                                                      const len1 =
                                                        data18.length;
                                                      for (
                                                        let i1 = 0;
                                                        i1 < len1;
                                                        i1++
                                                      ) {
                                                        const _errs54 = errors;
                                                        if (
                                                          typeof data18[i1] !==
                                                          'string'
                                                        ) {
                                                          const err18 = {
                                                            instancePath:
                                                              instancePath +
                                                              '/scripts/' +
                                                              key3
                                                                .replace(
                                                                  /~/g,
                                                                  '~0',
                                                                )
                                                                .replace(
                                                                  /\//g,
                                                                  '~1',
                                                                ) +
                                                              '/invalid/' +
                                                              i1,
                                                            schemaPath:
                                                              '#/definitions/WalletTemplateScriptUnlocking/properties/invalid/items/type',
                                                            keyword: 'type',
                                                            params: {
                                                              type: 'string',
                                                            },
                                                            message:
                                                              'must be string',
                                                          };
                                                          if (
                                                            vErrors === null
                                                          ) {
                                                            vErrors = [err18];
                                                          } else {
                                                            vErrors.push(err18);
                                                          }
                                                          errors++;
                                                        }
                                                        var valid12 =
                                                          _errs54 === errors;
                                                        if (!valid12) {
                                                          break;
                                                        }
                                                      }
                                                    } else {
                                                      const err19 = {
                                                        instancePath:
                                                          instancePath +
                                                          '/scripts/' +
                                                          key3
                                                            .replace(/~/g, '~0')
                                                            .replace(
                                                              /\//g,
                                                              '~1',
                                                            ) +
                                                          '/invalid',
                                                        schemaPath:
                                                          '#/definitions/WalletTemplateScriptUnlocking/properties/invalid/type',
                                                        keyword: 'type',
                                                        params: {
                                                          type: 'array',
                                                        },
                                                        message:
                                                          'must be array',
                                                      };
                                                      if (vErrors === null) {
                                                        vErrors = [err19];
                                                      } else {
                                                        vErrors.push(err19);
                                                      }
                                                      errors++;
                                                    }
                                                  }
                                                  var valid10 =
                                                    _errs52 === errors;
                                                } else {
                                                  var valid10 = true;
                                                }
                                                if (valid10) {
                                                  if (
                                                    data8.name !== undefined
                                                  ) {
                                                    const _errs56 = errors;
                                                    if (
                                                      typeof data8.name !==
                                                      'string'
                                                    ) {
                                                      const err20 = {
                                                        instancePath:
                                                          instancePath +
                                                          '/scripts/' +
                                                          key3
                                                            .replace(/~/g, '~0')
                                                            .replace(
                                                              /\//g,
                                                              '~1',
                                                            ) +
                                                          '/name',
                                                        schemaPath:
                                                          '#/definitions/WalletTemplateScriptUnlocking/properties/name/type',
                                                        keyword: 'type',
                                                        params: {
                                                          type: 'string',
                                                        },
                                                        message:
                                                          'must be string',
                                                      };
                                                      if (vErrors === null) {
                                                        vErrors = [err20];
                                                      } else {
                                                        vErrors.push(err20);
                                                      }
                                                      errors++;
                                                    }
                                                    var valid10 =
                                                      _errs56 === errors;
                                                  } else {
                                                    var valid10 = true;
                                                  }
                                                  if (valid10) {
                                                    if (
                                                      data8.passes !== undefined
                                                    ) {
                                                      let data21 = data8.passes;
                                                      const _errs58 = errors;
                                                      if (errors === _errs58) {
                                                        if (
                                                          Array.isArray(data21)
                                                        ) {
                                                          var valid13 = true;
                                                          const len2 =
                                                            data21.length;
                                                          for (
                                                            let i2 = 0;
                                                            i2 < len2;
                                                            i2++
                                                          ) {
                                                            const _errs60 =
                                                              errors;
                                                            if (
                                                              typeof data21[
                                                                i2
                                                              ] !== 'string'
                                                            ) {
                                                              const err21 = {
                                                                instancePath:
                                                                  instancePath +
                                                                  '/scripts/' +
                                                                  key3
                                                                    .replace(
                                                                      /~/g,
                                                                      '~0',
                                                                    )
                                                                    .replace(
                                                                      /\//g,
                                                                      '~1',
                                                                    ) +
                                                                  '/passes/' +
                                                                  i2,
                                                                schemaPath:
                                                                  '#/definitions/WalletTemplateScriptUnlocking/properties/passes/items/type',
                                                                keyword: 'type',
                                                                params: {
                                                                  type: 'string',
                                                                },
                                                                message:
                                                                  'must be string',
                                                              };
                                                              if (
                                                                vErrors === null
                                                              ) {
                                                                vErrors = [
                                                                  err21,
                                                                ];
                                                              } else {
                                                                vErrors.push(
                                                                  err21,
                                                                );
                                                              }
                                                              errors++;
                                                            }
                                                            var valid13 =
                                                              _errs60 ===
                                                              errors;
                                                            if (!valid13) {
                                                              break;
                                                            }
                                                          }
                                                        } else {
                                                          const err22 = {
                                                            instancePath:
                                                              instancePath +
                                                              '/scripts/' +
                                                              key3
                                                                .replace(
                                                                  /~/g,
                                                                  '~0',
                                                                )
                                                                .replace(
                                                                  /\//g,
                                                                  '~1',
                                                                ) +
                                                              '/passes',
                                                            schemaPath:
                                                              '#/definitions/WalletTemplateScriptUnlocking/properties/passes/type',
                                                            keyword: 'type',
                                                            params: {
                                                              type: 'array',
                                                            },
                                                            message:
                                                              'must be array',
                                                          };
                                                          if (
                                                            vErrors === null
                                                          ) {
                                                            vErrors = [err22];
                                                          } else {
                                                            vErrors.push(err22);
                                                          }
                                                          errors++;
                                                        }
                                                      }
                                                      var valid10 =
                                                        _errs58 === errors;
                                                    } else {
                                                      var valid10 = true;
                                                    }
                                                    if (valid10) {
                                                      if (
                                                        data8.script !==
                                                        undefined
                                                      ) {
                                                        const _errs62 = errors;
                                                        if (
                                                          typeof data8.script !==
                                                          'string'
                                                        ) {
                                                          const err23 = {
                                                            instancePath:
                                                              instancePath +
                                                              '/scripts/' +
                                                              key3
                                                                .replace(
                                                                  /~/g,
                                                                  '~0',
                                                                )
                                                                .replace(
                                                                  /\//g,
                                                                  '~1',
                                                                ) +
                                                              '/script',
                                                            schemaPath:
                                                              '#/definitions/WalletTemplateScriptUnlocking/properties/script/type',
                                                            keyword: 'type',
                                                            params: {
                                                              type: 'string',
                                                            },
                                                            message:
                                                              'must be string',
                                                          };
                                                          if (
                                                            vErrors === null
                                                          ) {
                                                            vErrors = [err23];
                                                          } else {
                                                            vErrors.push(err23);
                                                          }
                                                          errors++;
                                                        }
                                                        var valid10 =
                                                          _errs62 === errors;
                                                      } else {
                                                        var valid10 = true;
                                                      }
                                                      if (valid10) {
                                                        if (
                                                          data8.timeLockType !==
                                                          undefined
                                                        ) {
                                                          let data24 =
                                                            data8.timeLockType;
                                                          const _errs64 =
                                                            errors;
                                                          if (
                                                            typeof data24 !==
                                                            'string'
                                                          ) {
                                                            const err24 = {
                                                              instancePath:
                                                                instancePath +
                                                                '/scripts/' +
                                                                key3
                                                                  .replace(
                                                                    /~/g,
                                                                    '~0',
                                                                  )
                                                                  .replace(
                                                                    /\//g,
                                                                    '~1',
                                                                  ) +
                                                                '/timeLockType',
                                                              schemaPath:
                                                                '#/definitions/WalletTemplateScriptUnlocking/properties/timeLockType/type',
                                                              keyword: 'type',
                                                              params: {
                                                                type: 'string',
                                                              },
                                                              message:
                                                                'must be string',
                                                            };
                                                            if (
                                                              vErrors === null
                                                            ) {
                                                              vErrors = [err24];
                                                            } else {
                                                              vErrors.push(
                                                                err24,
                                                              );
                                                            }
                                                            errors++;
                                                          }
                                                          if (
                                                            !(
                                                              data24 ===
                                                                'height' ||
                                                              data24 ===
                                                                'timestamp'
                                                            )
                                                          ) {
                                                            const err25 = {
                                                              instancePath:
                                                                instancePath +
                                                                '/scripts/' +
                                                                key3
                                                                  .replace(
                                                                    /~/g,
                                                                    '~0',
                                                                  )
                                                                  .replace(
                                                                    /\//g,
                                                                    '~1',
                                                                  ) +
                                                                '/timeLockType',
                                                              schemaPath:
                                                                '#/definitions/WalletTemplateScriptUnlocking/properties/timeLockType/enum',
                                                              keyword: 'enum',
                                                              params: {
                                                                allowedValues:
                                                                  schema41
                                                                    .properties
                                                                    .timeLockType
                                                                    .enum,
                                                              },
                                                              message:
                                                                'must be equal to one of the allowed values',
                                                            };
                                                            if (
                                                              vErrors === null
                                                            ) {
                                                              vErrors = [err25];
                                                            } else {
                                                              vErrors.push(
                                                                err25,
                                                              );
                                                            }
                                                            errors++;
                                                          }
                                                          var valid10 =
                                                            _errs64 === errors;
                                                        } else {
                                                          var valid10 = true;
                                                        }
                                                        if (valid10) {
                                                          if (
                                                            data8.unlocks !==
                                                            undefined
                                                          ) {
                                                            const _errs66 =
                                                              errors;
                                                            if (
                                                              typeof data8.unlocks !==
                                                              'string'
                                                            ) {
                                                              const err26 = {
                                                                instancePath:
                                                                  instancePath +
                                                                  '/scripts/' +
                                                                  key3
                                                                    .replace(
                                                                      /~/g,
                                                                      '~0',
                                                                    )
                                                                    .replace(
                                                                      /\//g,
                                                                      '~1',
                                                                    ) +
                                                                  '/unlocks',
                                                                schemaPath:
                                                                  '#/definitions/WalletTemplateScriptUnlocking/properties/unlocks/type',
                                                                keyword: 'type',
                                                                params: {
                                                                  type: 'string',
                                                                },
                                                                message:
                                                                  'must be string',
                                                              };
                                                              if (
                                                                vErrors === null
                                                              ) {
                                                                vErrors = [
                                                                  err26,
                                                                ];
                                                              } else {
                                                                vErrors.push(
                                                                  err26,
                                                                );
                                                              }
                                                              errors++;
                                                            }
                                                            var valid10 =
                                                              _errs66 ===
                                                              errors;
                                                          } else {
                                                            var valid10 = true;
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
                                      const err27 = {
                                        instancePath:
                                          instancePath +
                                          '/scripts/' +
                                          key3
                                            .replace(/~/g, '~0')
                                            .replace(/\//g, '~1'),
                                        schemaPath:
                                          '#/definitions/WalletTemplateScriptUnlocking/type',
                                        keyword: 'type',
                                        params: { type: 'object' },
                                        message: 'must be object',
                                      };
                                      if (vErrors === null) {
                                        vErrors = [err27];
                                      } else {
                                        vErrors.push(err27);
                                      }
                                      errors++;
                                    }
                                  }
                                  var _valid0 = _errs40 === errors;
                                  valid4 = valid4 || _valid0;
                                }
                              }
                            }
                            if (!valid4) {
                              const err28 = {
                                instancePath:
                                  instancePath +
                                  '/scripts/' +
                                  key3.replace(/~/g, '~0').replace(/\//g, '~1'),
                                schemaPath:
                                  '#/properties/scripts/additionalProperties/anyOf',
                                keyword: 'anyOf',
                                params: {},
                                message: 'must match a schema in anyOf',
                              };
                              if (vErrors === null) {
                                vErrors = [err28];
                              } else {
                                vErrors.push(err28);
                              }
                              errors++;
                              validate21.errors = vErrors;
                              return false;
                            } else {
                              errors = _errs20;
                              if (vErrors !== null) {
                                if (_errs20) {
                                  vErrors.length = _errs20;
                                } else {
                                  vErrors = null;
                                }
                              }
                            }
                            var valid3 = _errs19 === errors;
                            if (!valid3) {
                              break;
                            }
                          }
                        } else {
                          validate21.errors = [
                            {
                              instancePath: instancePath + '/scripts',
                              schemaPath: '#/properties/scripts/type',
                              keyword: 'type',
                              params: { type: 'object' },
                              message: 'must be object',
                            },
                          ];
                          return false;
                        }
                      }
                      var valid0 = _errs16 === errors;
                    } else {
                      var valid0 = true;
                    }
                    if (valid0) {
                      if (data.supported !== undefined) {
                        let data26 = data.supported;
                        const _errs68 = errors;
                        if (errors === _errs68) {
                          if (Array.isArray(data26)) {
                            var valid14 = true;
                            const len3 = data26.length;
                            for (let i3 = 0; i3 < len3; i3++) {
                              let data27 = data26[i3];
                              const _errs70 = errors;
                              if (typeof data27 !== 'string') {
                                validate21.errors = [
                                  {
                                    instancePath:
                                      instancePath + '/supported/' + i3,
                                    schemaPath:
                                      '#/definitions/AuthenticationVirtualMachineIdentifier/type',
                                    keyword: 'type',
                                    params: { type: 'string' },
                                    message: 'must be string',
                                  },
                                ];
                                return false;
                              }
                              if (
                                !(
                                  data27 === 'BCH_2020_05' ||
                                  data27 === 'BCH_2021_05' ||
                                  data27 === 'BCH_2022_05' ||
                                  data27 === 'BCH_2023_05' ||
                                  data27 === 'BCH_SPEC' ||
                                  data27 === 'BSV_2020_02' ||
                                  data27 === 'BSV_SPEC' ||
                                  data27 === 'BTC_2017_08' ||
                                  data27 === 'BTC_SPEC' ||
                                  data27 === 'XEC_2020_05' ||
                                  data27 === 'XEC_SPEC'
                                )
                              ) {
                                validate21.errors = [
                                  {
                                    instancePath:
                                      instancePath + '/supported/' + i3,
                                    schemaPath:
                                      '#/definitions/AuthenticationVirtualMachineIdentifier/enum',
                                    keyword: 'enum',
                                    params: { allowedValues: schema42.enum },
                                    message:
                                      'must be equal to one of the allowed values',
                                  },
                                ];
                                return false;
                              }
                              var valid14 = _errs70 === errors;
                              if (!valid14) {
                                break;
                              }
                            }
                          } else {
                            validate21.errors = [
                              {
                                instancePath: instancePath + '/supported',
                                schemaPath: '#/properties/supported/type',
                                keyword: 'type',
                                params: { type: 'array' },
                                message: 'must be array',
                              },
                            ];
                            return false;
                          }
                        }
                        var valid0 = _errs68 === errors;
                      } else {
                        var valid0 = true;
                      }
                      if (valid0) {
                        if (data.version !== undefined) {
                          let data28 = data.version;
                          const _errs73 = errors;
                          if (
                            !(typeof data28 == 'number' && isFinite(data28))
                          ) {
                            validate21.errors = [
                              {
                                instancePath: instancePath + '/version',
                                schemaPath: '#/properties/version/type',
                                keyword: 'type',
                                params: { type: 'number' },
                                message: 'must be number',
                              },
                            ];
                            return false;
                          }
                          if (0 !== data28) {
                            validate21.errors = [
                              {
                                instancePath: instancePath + '/version',
                                schemaPath: '#/properties/version/const',
                                keyword: 'const',
                                params: { allowedValue: 0 },
                                message: 'must be equal to constant',
                              },
                            ];
                            return false;
                          }
                          var valid0 = _errs73 === errors;
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
