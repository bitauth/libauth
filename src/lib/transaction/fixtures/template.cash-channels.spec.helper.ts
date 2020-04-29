/* eslint-disable camelcase */
// cspell:ignore bitcoinvarint, IDE\'s
import { dateToLocktime } from '../../format/time';
import { AuthenticationTemplate } from '../../template/template-types';

const exampleAuthorizationTime = dateToLocktime(
  new Date('2020-01-01T00:00:00.000Z')
) as number;
const exampleAuthorizedPaymentTime = dateToLocktime(
  new Date('2020-02-01T00:00:00.000Z')
) as number;

export const cashChannels: AuthenticationTemplate = {
  ...{ name: 'CashChannels' },
  $schema: 'https://bitauth.com/schemas/authentication-template-v0.schema.json',
  description:
    '**Noncustodial, Privacy-Preserving, Flexibly-Denominated, Recurring Payments for Bitcoin Cash**\n\nA single-key channel which allows the owner to preauthorize any number of future payments to a receiver.\n\nEach authorization specifies a payment value, payment time, channel and payment identification information, and maximum satoshi value. When the payment time for an authorization is reached, the receiver can create a single transaction to withdraw the authorized amount to their own wallet, sending the change back to the channel. Beyond initially signing authorizations, the owner does not need to participate in executing authorized payments.\n\nThe channel does not need to hold a balance to preauthorize transactions – much like a debit account, the owner only needs to ensure that the wallet contains adequate funds to satisfy upcoming payments.\n\nChannel payments can be denominated in any asset. If the channel is denominated in an asset other than BCH, the precise payment amount is determined by a Rate Oracle, an entity partially-trusted with determining the current value of the denominating asset. (If the value of the denominating asset rises dramatically in terms of BCH, the Owner must sign a new authorization with a larger maximum authorized satoshi value.)\n \nThis wallet is entirely noncustodial: at any time, the owner can withdraw their funds to end the arrangement.\n\nIn normal use, the owner should create a unique channel for each Receiver. This provides better privacy (receivers can not determine the payment amounts or frequency of payments to other receivers) and better security (misbehaving receivers can not disrupt upcoming payments to other receivers).\n\nImplementation note: a single authorization can be used to withdraw from any channel UTXO. In most cases, authorizations are meant to be used only once, so wallets should never hold more than one unspent UTXO per channel. To “top up” the wallet, the existing UTXO should be spent back to itself, adding funds as necessary.',
  entities: {
    owner_entity: {
      description:
        'The owner of this channel. The owner can pre-sign authorizations or withdraw from the channel at any time.',
      name: 'Owner',
      scripts: ['channel'],
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
      scripts: [],
      variables: {
        payment_satoshis: {
          description:
            "The exact number of satoshis to be paid when executing an authorization. The Rate Oracle decides this value based on the Authorized Amount and the Denominating Asset.\n\nThe Channel restricts this value to never exceed the Maximum Authorized Satoshis specified in the Owner's authorization.",
          name: 'Payment Satoshis',
          type: 'AddressData',
        },
        rate_oracle: {
          name: "Rate Oracle's Key",
          type: 'Key',
        },
      },
    },
    receiver_entity: {
      description:
        'The entity designated as the recipient of all channel payments. \n\nThe receiver holds authorizations signed by the Owner. When the payment time of an authorization is reached, the Receiver can create a transaction for the value specified by the authorization, spending the change back to the channel.',
      name: 'Receiver',
      scripts: ['execute_authorization'],
      variables: {
        receiver: {
          name: "Receiver's Key",
          type: 'Key',
        },
      },
    },
  },
  scenarios: {
    after_payment_time: {
      description: 'An example of successful payment authorization execution.',
      extends: 'usd10',
      name: '$10.00 USD – After Payment Time',
      transaction: {
        locktime: exampleAuthorizedPaymentTime,
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
          payment_time: '0xd9a9f35d',
        },
      },
      description:
        'An example attempting to execute a payment authorization before the payment time authorized by the owner.',
      extends: 'usd10',
      name: '$10.00 USD – Before Payment Time',
      transaction: {
        locktime: exampleAuthorizationTime,
      },
    },
    usd10: {
      description:
        'A working channel denominated in USD. The authorization is for "1000" in asset "USD" (described in cents, so $10.00 USD), and it authorizes a payment of a maximum of 10500 satoshis.',
      name: '$10.00 USD Authorization',
    },
  },
  scripts: {
    channel: {
      lockingType: 'standard',
      name: 'Channel',
      script:
        'OP_HASH160 <$(\n    // TODO: switch channel implementation based on <denominating_asset>\n    <channel_oracle> OP_HASH160\n)> OP_EQUAL\n',
    },
    channel_components: {
      name: 'Channel Components',
      script:
        '// serialization of the next channel output\n<channel_oracle>\n// the location of payment_number_padded in channel\n<78> OP_SPLIT\n<2> OP_SPLIT',
    },
    channel_identifier: {
      name: 'Channel Identifier',
      script:
        '$(<owner.public_key>\n<receiver.public_key>\nOP_CAT\nOP_HASH160)',
    },
    channel_oracle: {
      lockingType: 'p2sh',
      name: 'Channel (Oracle)',
      script:
        '<owner.public_key>\nOP_SWAP\nOP_IF\n    // Execute Authorization\n    OP_DUP OP_TOALTSTACK // save owner.public_key\n\n    // reconstruct payment authorization message\n    <6> OP_PICK // channel_identifier\n    <15> OP_PICK // payment_number_padded\n    <7> OP_PICK // maximum_authorized_satoshis\n    OP_DUP\n    <12> OP_PICK // payment_satoshis\n    OP_GREATERTHANOREQUAL OP_VERIFY // maximum_authorized_satoshis >= payment_satoshis\n    <8> OP_NUM2BIN\n    <7> OP_PICK <8> OP_NUM2BIN // authorized_amount\n    <7> OP_PICK <8> OP_NUM2BIN // denominating_asset\n    <7> OP_PICK <8> OP_NUM2BIN // payment_time\n    OP_CAT OP_CAT\n    OP_DUP OP_TOALTSTACK // save (authorized_amount + denominating_asset + payment_time)\n    OP_CAT OP_CAT OP_CAT\n    OP_SWAP\n    OP_CHECKDATASIGVERIFY // check payment authorization signature\n\n    OP_CHECKLOCKTIMEVERIFY // fail if not past payment_time\n    OP_2DROP OP_2DROP\n\n    <8> OP_PICK // payment_number_padded\n    <payment_number_padded>\n    OP_EQUALVERIFY // check against payment_number in authorization\n\n    // reconstruct rate_claim\n    OP_FROMALTSTACK\n    <3> OP_PICK // payment_satoshis\n    <8> OP_NUM2BIN\n    OP_CAT\n\n    OP_SWAP\n    OP_FROMALTSTACK // load owner.public_key\n    <receiver.public_key>\n    OP_DUP\n    OP_TOALTSTACK // save receiver.public_key\n    OP_CAT\n    OP_HASH160\n    OP_EQUALVERIFY // verify channel_identifier\n\n    <rate_oracle.public_key>\n    OP_CHECKDATASIGVERIFY // verify rate_claim\n\n    <7> OP_PICK // covered_bytecode_before_payment_number\n    <7> OP_PICK // payment_number_padded\n    OP_BIN2NUM\n    <1> OP_ADD <2> OP_NUM2BIN // next payment_number\n    <7> OP_PICK // covered_bytecode_after_payment_number\n    OP_CAT OP_CAT \n    OP_HASH160 // P2SH redeem bytecode hash\n    // prefix locking bytecode with its length (required in serialization)\n    <23>\n    <OP_HASH160 OP_PUSHBYTES_20> OP_ROT\n    <OP_EQUAL>\n    OP_CAT OP_CAT OP_CAT // length + locking bytecode\n\n    // calculate expected output value\n    <5> OP_PICK // outpoint_value\n    OP_BIN2NUM\n    OP_ROT\n    OP_SUB <8> OP_NUM2BIN // remaining balance\n    OP_SWAP OP_CAT // expected output serialization\n    OP_SWAP OP_CAT\n    OP_HASH256 // expected transaction_outputs_hash\n    OP_SWAP\n    OP_CAT OP_CAT OP_CAT OP_CAT OP_CAT OP_CAT OP_CAT\n\n    OP_SHA256\n\n    OP_FROMALTSTACK\n    OP_DUP\n    <3> OP_PICK // receiver.schnorr_signature.all_outputs\n    OP_ROT\n    OP_CHECKSIGVERIFY // signature covers transaction\n    OP_ROT <64> OP_SPLIT OP_DROP // remove signature serialization type bit\n    OP_ROT OP_ROT \n    OP_CHECKDATASIG // signature covers expected transaction\nOP_ELSE\n    // Owner Spend \n    OP_CHECKSIG\nOP_ENDIF \n',
    },
    covered_bytecode: {
      name: 'Covered Bytecode',
      script:
        '// simulate covered_bytecode being available from the compiler\nchannel_oracle',
    },
    covered_bytecode_after_payment_number: {
      name: 'Covered Bytecode After Payment Number',
      script:
        '$(\n    channel_components <0> OP_PICK\n    OP_NIP OP_NIP OP_NIP\n)',
    },
    covered_bytecode_before_payment_number: {
      name: 'Covered Bytecode Before Payment Number',
      script:
        '$(\n    channel_components <2> OP_PICK\n    OP_NIP OP_NIP OP_NIP\n)',
    },
    covered_bytecode_bitcoinvarint: {
      name: 'Covered Bytecode BitcoinVarInt',
      script:
        '// covered bytecode must be prefixed with a BitcoinVarInt if its length\n$(\n    <channel_oracle> OP_SIZE // value as script number\n    // BitcoinVarInt is unsigned, so we have to manually\n    // correct the number here\n    <1> OP_SPLIT OP_DROP OP_NIP\n)\n/**\n * Pardon the error here in Bitauth IDE – this template is never evaluated,\n * but the IDE does not yet support a way of indicating that a script\n * is only being used as a "bytecode template":\n * https://github.com/bitauth/bitauth-ide/issues/33\n *\n */',
    },
    execute_authorization: {
      name: 'Execute Authorization',
      script:
        '// TODO: switch channel implementation based on <denominating_asset>\nexecute_authorization_oracle\n<channel_oracle>',
      unlocks: 'channel',
    },
    execute_authorization_oracle: {
      name: 'Execute Authorization (Oracle)',
      script:
        '/**\n * Once the payment time for an authorization has passed,\n * this script can be used to execute it.\n */\n<receiver.schnorr_signature.all_outputs> \n<signing_serialization_before_covered_bytecode>\n<covered_bytecode_before_payment_number>\n<$(channel_components <1> OP_PICK\nOP_NIP OP_NIP OP_NIP)> // payment_number_padded\n<covered_bytecode_after_payment_number>\n<signing_serialization.output_value> // initial balance of channel\n<signing_serialization.sequence_number>\n<signing_serialization_after_transaction_outputs_hash>\n<remaining_transaction_outputs>\n<payment_satoshis>\n<rate_oracle.data_signature.rate_claim>\n<channel_identifier>\n<maximum_authorized_satoshis>\n<authorized_amount>\n<denominating_asset>\n<payment_time>\n<owner.data_signature.payment_authorization>\n<1>\n',
      unlocks: 'channel_oracle',
    },
    get_next_channel_hash: {
      name: 'Get Next Channel Hash',
      script:
        '/**\n * Not used in the actual template – this is useful for adjusting the\n * hard-coded `nextCashChannelHash160` in the IDE before scenarios\n * are added. \n */\n<covered_bytecode_before_payment_number>\n<payment_number>\n<1> OP_ADD <2> OP_NUM2BIN // next payment_number\n<covered_bytecode_after_payment_number>\nOP_CAT OP_CAT  // next redeem script\nOP_HASH160 // `nextCashChannelHash160`\n\n// full locking bytecode:\n<OP_HASH160 OP_PUSHBYTES_20> OP_SWAP\n<OP_EQUAL>\nOP_CAT OP_CAT',
    },
    owner_spend: {
      name: 'Owner Spend',
      script: 'owner_spend_oracle\n<channel>',
      unlocks: 'channel',
    },
    owner_spend_oracle: {
      name: 'Owner Spend (Oracle)',
      script:
        '/**\n * This script lets the Owner spend the current channel UTXO\n * to either "top up" the channel or close it.\n */\n<owner.schnorr_signature.all_outputs>\n<0>',
      unlocks: 'channel_oracle',
    },
    payment_authorization: {
      name: 'Payment Authorization',
      script:
        '$(\n    <channel_identifier>\n    <payment_number>\n    <2> OP_NUM2BIN\n    <maximum_authorized_satoshis>\n    <8> OP_NUM2BIN\n    <authorized_amount>\n    <8> OP_NUM2BIN\n    <denominating_asset>\n    <8> OP_NUM2BIN\n    <payment_time>\n    <8> OP_NUM2BIN\n    OP_CAT OP_CAT OP_CAT OP_CAT OP_CAT\n)',
    },
    payment_number_padded: {
      name: 'Payment Number Padded',
      script:
        '$(\n    <payment_number>\n    OP_DUP <65534> OP_LESSTHANOREQUAL OP_VERIFY\n    <2> OP_NUM2BIN\n)',
    },
    rate_claim: {
      name: 'Rate Claim',
      script:
        '$(\n    <authorized_amount>\n    <8> OP_NUM2BIN\n    <denominating_asset>\n    <8> OP_NUM2BIN\n    <payment_time>\n    <8> OP_NUM2BIN\n    <payment_satoshis>\n    <8> OP_NUM2BIN\n    OP_CAT\n    OP_CAT\n    OP_CAT\n)\n',
    },
    remaining_transaction_outputs: {
      name: 'Remaining Transaction Outputs',
      script:
        '// signing_serialization_transaction_outputs with first output removed\n$( <signing_serialization.transaction_outputs>\n    // length of first output (P2SH output)\n    <32> OP_SPLIT\n    OP_NIP\n)',
    },
    signing_serialization: {
      name: 'Signing Serialization',
      script:
        '/**\n * Note: the IDE\'s "contextProgram" (the into transaction which\n * IDE scripts are loaded for testing) is currently hard-coded.\n * To make changes, you may need to update the code.\n */\n<signing_serialization.version>\n<signing_serialization.transaction_outpoints_hash>\n<signing_serialization.transaction_sequence_numbers_hash>\n<signing_serialization.outpoint_transaction_hash>\n<signing_serialization.outpoint_index>\n<signing_serialization.covered_bytecode_prefix>\n<signing_serialization.covered_bytecode>\n<signing_serialization.output_value>\n<signing_serialization.sequence_number>\n<signing_serialization.transaction_outputs_hash>\n<signing_serialization.locktime>\n<0x41000000>\nOP_CAT OP_CAT OP_CAT OP_CAT OP_CAT OP_CAT OP_CAT OP_CAT OP_CAT OP_CAT OP_CAT\n\n<signing_serialization.full_all_outputs>',
      tests: [
        {
          check: ' OP_EQUAL',
          name: 'Test Full Serialization',
          setup: '',
        },
      ],
    },
    signing_serialization_after_transaction_outputs_hash: {
      name: 'Signing Serialization After Transaction Outputs Hash',
      script:
        '$(\n    <signing_serialization.locktime>\n    <0x41000000>\n    OP_CAT\n)',
    },
    signing_serialization_before_covered_bytecode: {
      name: 'Signing Serialization Before Covered Bytecode',
      script:
        '$(  \n    <signing_serialization.version>\n    <signing_serialization.transaction_outpoints_hash>\n    <signing_serialization.transaction_sequence_numbers_hash>\n    <signing_serialization.outpoint_transaction_hash>\n    <signing_serialization.outpoint_index>\n    <signing_serialization.covered_bytecode_prefix>\n    OP_CAT OP_CAT OP_CAT OP_CAT OP_CAT\n)',
    },
  },
  supported: ['BCH_2019_05', 'BCH_2019_11'],
  version: 0,
};
