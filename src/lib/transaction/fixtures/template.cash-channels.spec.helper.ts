/* eslint-disable camelcase, @typescript-eslint/naming-convention */
// cspell:ignore bitcoinvarint, IDE\'s
import { AuthenticationTemplate } from '../../template/template-types';

export const cashChannels: AuthenticationTemplate = {
  $schema: 'https://bitauth.com/schemas/authentication-template-v0.schema.json',
  description:
    '**Noncustodial, Privacy-Preserving, Flexibly-Denominated, Recurring Payments for Bitcoin Cash**\n\nA single-key channel which allows the owner to preauthorize any number of future payments to a receiver.\n\nEach authorization specifies a payment value, payment time, channel and payment identification information, and maximum satoshi value. When the payment time for an authorization is reached, the receiver can create a single transaction to withdraw the authorized amount to their own wallet, sending the change back to the channel. Beyond initially signing authorizations, the owner does not need to participate in executing authorized payments.\n\nThe channel does not need to hold a balance to preauthorize transactions – much like a debit account, the owner only needs to ensure that the wallet contains adequate funds to satisfy upcoming payments.\n\nChannel payments can be denominated in any asset. If the channel is denominated in an asset other than BCH, the precise payment amount is determined by a Rate Oracle, an entity partially-trusted with determining the current value of the denominating asset. (If the value of the denominating asset rises dramatically in terms of BCH, the Owner must sign a new authorization with a larger maximum authorized satoshi value.)\n \nThis wallet is entirely noncustodial: at any time, the owner can withdraw their funds to end the arrangement.\n\nIn normal use, the owner should create a unique channel for each Receiver. This provides better privacy (receivers can not determine the payment amounts or frequency of payments to other receivers) and better security (misbehaving receivers can not disrupt upcoming payments to other receivers).\n\nImplementation note: a single authorization can be used to withdraw from any channel UTXO. In most cases, authorizations are meant to be used only once, so wallets should never hold more than one unspent UTXO per channel. To “top up” the wallet, the existing UTXO should be spent back to itself, adding funds as necessary.',
  entities: {
    owner_entity: {
      description:
        'The owner of this channel. The owner can pre-sign authorizations or withdraw from the channel at any time.',
      name: 'Owner',
      variables: {
        authorized_amount: {
          description:
            'The value of the authorized payment in terms of the denominating asset encoded as a Script Number, e.g. `10000`.\n\nIf the denominating asset is BCH, this number is represented in satoshis. If the denominating asset is another currency, it should be represented in the smallest common decimal unit of that currency, e.g. for $100.00 "USD", this value should be `10000`. All fiat currencies must be represented with 2 decimal places, even for currencies where fractional units are not commonly used, e.g. IRR, VND, IDR.\n\nBecause this value is not operated upon by the locking script, if desired, the value may be encrypted (using a key shared by all entities) so the terms of authorizations are not publicly auditable.',
          name: 'Authorized Amount',
          type: 'AddressData',
        },
        denominating_asset: {
          description:
            'The asset in which the Authorized Amount is specified. This should be an identifier (like a currency code or ticker symbol) which is understood by each party, encoded as a UTF8Literal, e.g. `"BCH"`, `"XAU"`, or `"USD"`. \n\nIf desired, the value can be encrypted (using a key shared by all entities) so the exact terms of the transaction are not publicly auditable.',
          name: 'Denominating Asset',
          type: 'AddressData',
        },
        maximum_authorized_satoshis: {
          description:
            "The maximum allowed satoshi value of a payment authorization, encoded as a Script Number, e.g. `10000`.\n\nIf the Denominating Asset is BCH, this is the exact value of the payment.\n\nIf the Denominating Asset is not BCH, the exact payment amount is chosen by the Rate Oracle (Payment Satoshis). If the rate has changed dramatically enough that the payment will exceed the Maximum Authorized Satoshis, the authorization is no longer valid, and the Owner must sign another authorization with a higher Maximum Authorized Satoshis value. The Owner should calculate this based on the percentage market price increase they're willing to continue allowing this authorization. E.g.: maximum_authorized_satoshis = current_estimated_satoshis *  (1 + price_flexibility_percentage)",
          name: 'Maximum Authorized Satoshis',
          type: 'AddressData',
        },
        owner: {
          description: '',
          name: "Owner's Key",
          type: 'Key',
        },
        payment_number: {
          description:
            'The sequence number of this payment, used as an identifier for an authorization. Authorizations must be used in order, and this number should be incremented by one for each authorization signed.\n\nEncoded as a Script Number between 0 and 65534, e.g. `42`.',
          name: 'Payment Number',
          type: 'AddressData',
        },
        payment_time: {
          description:
            'The planned Block Time at which an Authorization should become valid for spending. This is also the time at which the Rate Oracle (if present) should determine the Payment Satoshis.\n\nMust be encoded as a Script Number (of up to 5 bytes as is consumed by OP_CHECKLOCKTIMEVERIFY).',
          name: 'Payment Time',
          type: 'AddressData',
        },
      },
    },
    rate_oracle_entity: {
      description:
        'The Rate Oracle is an entity trusted with determining the current exchange rate of the denominating asset at each authorization’s payment time. If the denominating asset is BCH, no rate oracle is required.\n\nDepending on the relationship between Owner and Receiver, the Receiver (or a party contracted by the receiver) may also serve as the Rate Oracle. (If the Receiver abuses the role, the Owner can end the arrangement.) In a merchant scenario, the payment processor is a good candidate for Rate Oracle.\n\nThe Rate Oracle’s claims are used by the channel to determine the exact BCH amount of the payment, so long as the rate remains below the maximum satoshi value specified by the authorization.',
      name: 'Rate Oracle',
      variables: {
        payment_satoshis: {
          description:
            "The exact number of satoshis to be paid when executing an authorization. The Rate Oracle decides this value based on the Authorized Amount and the Denominating Asset.\n\nThe Channel restricts this value to never exceed the Maximum Authorized Satoshis specified in the Owner's authorization.",
          name: 'Payment Satoshis',
          type: 'AddressData',
        },
        rate_oracle: {
          description: '',
          name: "Rate Oracle's Key",
          type: 'Key',
        },
      },
    },
    receiver_entity: {
      description:
        'The entity designated as the recipient of all channel payments. \n\nThe receiver holds authorizations signed by the Owner. When the payment time of an authorization is reached, the Receiver can create a transaction for the value specified by the authorization, spending the change back to the channel.',
      name: 'Receiver',
      variables: {
        receiver: {
          description: '',
          name: "Receiver's Key",
          type: 'Key',
        },
      },
    },
  },
  name: 'CashChannels',
  scenarios: {
    after_payment_time: {
      description: 'An example of successful payment authorization execution.',
      extends: 'before_payment_time',
      name: '$10.00 USD – After Payment Time',
      transaction: {
        locktime: 1580515200,
      },
    },
    before_payment_time: {
      data: {
        bytecode: {
          authorized_amount: '1000',
          denominating_asset: "'USD'",
          maximum_authorized_satoshis: '10500',
          payment_number: '2',
          payment_satoshis: '10000',
          payment_time: '1580515200',
        },
        hdKeys: {
          addressIndex: 0,
        },
      },
      description:
        'An example attempting to execute a payment authorization before the payment time authorized by the owner. The authorization is for "1000" in asset "USD" (described in cents, so $10.00 USD), and it authorizes a payment of a maximum of 10500 satoshis. The hypothetical UTXO being spent has a value of 20000 satoshis.',
      name: '$10.00 USD – Before Payment Time',
      transaction: {
        locktime: 1577836800,
        outputs: [
          {
            lockingBytecode: {
              overrides: {
                bytecode: {
                  payment_number: '3',
                },
                hdKeys: {
                  addressIndex: 0,
                },
              },
            },
            satoshis: 10000,
          },
        ],
      },
      value: 20000,
    },
    exceeds_maximum_payment_number: {
      data: {
        bytecode: {
          payment_number: '65536',
        },
      },
      description:
        'An example scenario where the payment number exceeds the maximum uint16 value.',
      name: 'Payment Number Exceeds Maximum',
    },
    test_bytecode_values: {
      description:
        "A scenario for testing all bytecode values. Because this scenario doesn't require compiling the script under test for its outputs, errors are a little easier to debug.",
      extends: 'after_payment_time',
      name: 'Test Bytecode Values',
      transaction: {
        outputs: [
          {
            lockingBytecode: '',
          },
        ],
      },
    },
  },
  scripts: {
    channel: {
      lockingType: 'p2sh',
      name: 'Channel',
      script:
        '<owner.public_key>\nOP_SWAP\nOP_IF\n    /**\n     * Execute Authorization\n     */\n    OP_DUP OP_TOALTSTACK // save owner.public_key\n\n    /**\n     * Reconstruct payment authorization message\n     */\n    <6> OP_PICK // channel_identifier\n    <15> OP_PICK // payment_number_padded\n    <7> OP_PICK // maximum_authorized_satoshis\n    OP_DUP\n    <12> OP_PICK // payment_satoshis\n    OP_GREATERTHANOREQUAL OP_VERIFY // maximum_authorized_satoshis >= payment_satoshis\n    <8> OP_NUM2BIN\n    <7> OP_PICK <8> OP_NUM2BIN // authorized_amount\n    <7> OP_PICK <8> OP_NUM2BIN // denominating_asset\n    <7> OP_PICK <8> OP_NUM2BIN // payment_time\n    OP_CAT OP_CAT\n    OP_DUP OP_TOALTSTACK // save (authorized_amount + denominating_asset + payment_time)\n    OP_CAT OP_CAT OP_CAT\n    OP_SWAP \n\n   OP_CHECKDATASIGVERIFY // check payment authorization signature\n\n    OP_CHECKLOCKTIMEVERIFY // fail if not past payment_time\n    OP_2DROP OP_2DROP\n\n    <8> OP_PICK // payment_number_padded\n    <payment_number_padded>\n    OP_EQUALVERIFY // check against payment_number in authorization\n\n    // reconstruct rate_claim\n    OP_FROMALTSTACK\n    <3> OP_PICK // payment_satoshis\n    <8> OP_NUM2BIN\n    OP_CAT\n\n\n    OP_SWAP\n    OP_FROMALTSTACK // load owner.public_key\n    <receiver.public_key>\n    OP_DUP\n    OP_TOALTSTACK // save receiver.public_key\n    OP_CAT\n    OP_HASH160\n\n    OP_EQUALVERIFY // verify channel_identifier\n\n    <rate_oracle.public_key>\n    OP_CHECKDATASIGVERIFY // verify rate_claim\n\n    <7> OP_PICK // covered_bytecode_before_payment_number\n    <7> OP_PICK // payment_number_padded\n    OP_BIN2NUM\n    <1> OP_ADD <2> OP_NUM2BIN // next payment_number\n    <7> OP_PICK // covered_bytecode_after_payment_number\n    OP_CAT OP_CAT \n    OP_HASH160 // P2SH redeem bytecode hash\n    \n    /**\n     * prefix locking bytecode with its length (required in serialization)\n     */\n    <23>\n    <OP_HASH160 OP_PUSHBYTES_20>\n    OP_ROT\n    <OP_EQUAL>\n    OP_CAT OP_CAT // expected locking bytecode\n    OP_CAT // length + locking bytecode\n\n    // calculate expected output value\n    <5> OP_PICK // outpoint_value\n    OP_BIN2NUM\n    OP_ROT\n    OP_SUB <8> OP_NUM2BIN // remaining balance\n    OP_SWAP OP_CAT // expected output serialization\n    OP_SWAP OP_CAT\n\n    /**\n     * Verify signing serialization transaction outputs (uncomment for testing)\n     */\n    // OP_DUP OP_TOALTSTACK\n    // <8> OP_PICK // signing_serialization.transaction_outputs\n    // OP_EQUALVERIFY\n    // OP_FROMALTSTACK\n    /**\n     * End signing serialization transaction outputs verification (uncomment for testing)\n     */\n\n    OP_HASH256 // expected transaction_outputs_hash\n    OP_SWAP\n    OP_CAT OP_CAT OP_CAT OP_CAT OP_CAT OP_CAT OP_CAT\n\n    /**\n     * Verify full signing serialization (uncomment for testing)\n     */\n    // OP_DUP OP_TOALTSTACK\n    // OP_EQUALVERIFY\n    // OP_FROMALTSTACK\n    /**\n     * End full signing serialization verification (uncomment for testing)\n     */\n    \n    OP_SHA256\n\n    OP_FROMALTSTACK\n    OP_DUP\n    <3> OP_PICK // receiver.schnorr_signature.all_outputs\n    OP_ROT\n    OP_CHECKSIGVERIFY // signature covers transaction\n    OP_ROT \n    <64> OP_SPLIT OP_DROP // remove signature serialization type bit\n    OP_ROT OP_ROT\n    OP_CHECKDATASIG // signature covers expected transaction\nOP_ELSE\n    // Owner Spend\n    OP_CHECKSIG\nOP_ENDIF \n\n\n',
    },
    channel_components: {
      name: 'Channel Components',
      script:
        '/**\n * This is just a convenience script to split the locking bytecode\n * at the location of "payment_number_padded". Since this is used in\n * several places, using a single script makes updates easier.\n **/\n<channel> // The raw locking bytecode of the current channel\n<78> OP_SPLIT // the location of payment_number_padded in channel\n<2> OP_SPLIT // the length of payment_number_padded',
      tests: [
        {
          check:
            '/**\n * Here we confirm that we split the bytecode at the\n * correct indexes:\n * - item 1 should be the bytecode before payment_number_padded\n * - item 2 should be payment_number_padded\n * - item 3 should be the bytecode after payment_number_padded\n */\n\n<1> OP_PICK OP_TOALTSTACK\n\nOP_CAT OP_CAT <channel> OP_EQUALVERIFY\n\nOP_FROMALTSTACK <payment_number_padded> OP_EQUAL',
          name: 'Contains Padded Payment Number',
          passes: ['after_payment_time', 'before_payment_time'],
        },
      ],
    },
    channel_identifier: {
      name: 'Channel Identifier',
      pushed: true,
      script:
        '$(<owner.public_key>\n<receiver.public_key>\nOP_CAT\nOP_HASH160)',
      tests: [
        {
          check: '<0x564752b9f1c9f0246c8444a7f0a0ee8348f2e339>\nOP_EQUAL',
          name: 'Expected ID',
        },
      ],
    },
    covered_bytecode_after_payment_number: {
      name: 'Covered Bytecode After Payment Number',
      pushed: true,
      script:
        '$(\n    channel_components <0> OP_PICK\n    OP_NIP OP_NIP OP_NIP\n)',
      tests: [
        {
          check:
            '<0x886c537958807e7c6c2102e493dbf1c10d80f3581e4904930b1404cc6c13900ee0758474fa94abe8c4cd13766b7ea9882102f9308a019258c31049344f85f89d5229b531c845836f99b08601f113bce036f9bb57795779815193528057797e7ea9011702a9147b01877e7e7e5579817b9458807c7e7c7eaa7c7e7e7e7e7e7e7ea86c7653797bad7b01407f757b7bba67ac68>\nOP_EQUAL',
          name: 'Check Bytecode',
          passes: ['test_bytecode_values'],
        },
      ],
    },
    covered_bytecode_before_payment_number: {
      name: 'Covered Bytecode Before Payment Number',
      pushed: true,
      script:
        '$(\n    channel_components <2> OP_PICK\n    OP_NIP OP_NIP OP_NIP\n)',
      tests: [
        {
          check:
            '<0x210279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f817987c63766b56795f795779765c79a26958805779588057795880577958807e7e766b7e7e7e7cbbb16d6d587902>\nOP_EQUAL',
          name: 'Check Bytecode',
          passes: ['test_bytecode_values'],
        },
      ],
    },
    execute_authorization: {
      fails: ['before_payment_time'],
      name: 'Execute Authorization',
      passes: ['after_payment_time'],
      script:
        '/**\n * Once the payment time for an authorization has passed,\n * this script can be used to execute it.\n */\n<receiver.schnorr_signature.all_outputs>\n\n/**\n * Verify signing serialization transaction outputs (uncomment for testing)\n */\n// <signing_serialization.transaction_outputs>\n/**\n * Verify full signing serialization (uncomment for testing)\n */\n// <signing_serialization.full_all_outputs>\n\n<$(  \n    <signing_serialization.version>\n    <signing_serialization.transaction_outpoints_hash>\n    <signing_serialization.transaction_sequence_numbers_hash>\n    <signing_serialization.outpoint_transaction_hash>\n    <signing_serialization.outpoint_index>\n    <signing_serialization.covered_bytecode_length>\n    OP_CAT OP_CAT OP_CAT OP_CAT OP_CAT\n)> // signing serialization before the covered bytecode\n<covered_bytecode_before_payment_number>\n<payment_number_padded>\n<covered_bytecode_after_payment_number>\n<signing_serialization.output_value> // initial balance of channel\n<signing_serialization.sequence_number>\n<$(\n    <signing_serialization.locktime>\n    <0x41000000> // signing serialization type\n    OP_CAT\n)>\n<$(\n/**\n * signing_serialization.transaction_outputs with the\n * first output (the next channel UTXO) removed\n */\n<signing_serialization.transaction_outputs>\n    <32> // length of channel output (P2SH output)\n    OP_SPLIT\n    OP_NIP\n)>\n<payment_satoshis>\n<rate_oracle.data_signature.rate_claim>\n<channel_identifier>\n<maximum_authorized_satoshis>\n<authorized_amount>\n<denominating_asset>\n<payment_time>\n<owner.data_signature.payment_authorization>\n<1>',
      unlocks: 'channel',
    },
    owner_spend: {
      name: 'Owner Spend',
      passes: ['after_payment_time', 'before_payment_time'],
      script:
        '/**\n * This script lets the Owner spend the current channel UTXO\n * to either "top up" the channel or close it.\n */\n<owner.schnorr_signature.all_outputs>\n<0>',
      unlocks: 'channel',
    },
    payment_authorization: {
      name: 'Payment Authorization',
      pushed: true,
      script:
        '$(\n    <channel_identifier>\n    <payment_number>\n    <2> OP_NUM2BIN\n    <maximum_authorized_satoshis>\n    <8> OP_NUM2BIN\n    <authorized_amount>\n    <8> OP_NUM2BIN\n    <denominating_asset>\n    <8> OP_NUM2BIN\n    <payment_time>\n    <8> OP_NUM2BIN\n    OP_CAT OP_CAT OP_CAT OP_CAT OP_CAT\n)',
      tests: [
        {
          check:
            '<0x564752b9f1c9f0246c8444a7f0a0ee8348f2e33902000429000000000000e803000000000000555344000000000080bf345e00000000>\nOP_EQUAL',
          name: 'Check Format',
          passes: ['before_payment_time'],
        },
      ],
    },
    payment_number_padded: {
      name: 'Payment Number Padded',
      pushed: true,
      script:
        '$(\n    <payment_number>\n    OP_DUP <65534> OP_LESSTHANOREQUAL OP_VERIFY\n    <2> OP_NUM2BIN\n)\n\n\n<1>',
      tests: [
        {
          check: '<0x0200>\nOP_EQUAL',
          fails: ['exceeds_maximum_payment_number'],
          name: 'Requires Uint16',
          passes: ['before_payment_time'],
        },
      ],
    },
    rate_claim: {
      name: 'Rate Claim',
      pushed: true,
      script:
        '$(\n    <authorized_amount>\n    <8> OP_NUM2BIN\n    <denominating_asset>\n    <8> OP_NUM2BIN\n    <payment_time>\n    <8> OP_NUM2BIN\n    <payment_satoshis>\n    <8> OP_NUM2BIN\n    OP_CAT\n    OP_CAT\n    OP_CAT\n)',
      tests: [
        {
          check:
            '<\n    0xe803000000000000\n    0x5553440000000000\n    0x80bf345e00000000\n    0x1027000000000000\n>\nOP_EQUAL',
          name: 'Check Format',
          passes: ['after_payment_time'],
        },
      ],
    },
  },
  supported: ['BCH_2019_05', 'BCH_2019_11'],
  version: 0,
};
