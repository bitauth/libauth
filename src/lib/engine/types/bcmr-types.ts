// spell-checker:ignore DDTHH, ZDTC

/**
 * A mapping of identifiers to URIs associated with an entity. URI identifiers
 * may be widely-standardized or registry-specific. Values must be valid URIs,
 * including a protocol prefix – e.g. `https://` or `ipfs://`., Clients are only
 * required to support `https` and `ipfs` URIs, but any scheme may be specified.
 */
export type URIs = {
  [identifier: string]: string;
};

/**
 * A mapping of extension identifiers to extension definitions. Extensions may
 * be widely standardized or application-specific, and extension definitions
 * must be either:
 *
 * - `string`s,
 * - key-value mappings of `string`s, or
 * - two-dimensional, key-value mappings of `string`s.
 *
 * This limitation encourages safety and wider compatibility across
 * implementations.
 *
 * To encode an array, it is recommended that each value be assigned to a
 * numeric key indicating the item's index (beginning at `0`).
 * Numerically-indexed objects are often a more useful and resilient
 * data-transfer format than simple arrays because they simplify difference-only
 * transmission: only modified indexes need to be transferred, and shifts in
 * item order must be explicit, simplifying merges of conflicting updates.
 *
 * For encoding of more complex data, consider using base64 and/or
 * string-encoded JSON.
 */
export type Extensions = {
  [extensionIdentifier: string]:
    | string
    | { [key: string]: string }
    | { [keyA: string]: { [keyB: string]: string } };
};

/**
 * Tags allow registries to classify and group identities by a variety of
 * characteristics. Tags are standardized within a registry and may represent
 * either labels applied by that registry or designations by external
 * authorities (certification, membership, ownership, etc.) that are tracked by
 * that registry.
 *
 * Examples of possible tags include: `individual`, `organization`, `token`,
 * `wallet`, `exchange`, `staking`, `utility-token`, `security-token`,
 * `stablecoin`, `wrapped`, `collectable`, `deflationary`, `governance`,
 * `decentralized-exchange`, `liquidity-provider`, `sidechain`,
 * `sidechain-bridge`, `acme-audited`, `acme-endorsed`, etc.
 *
 * Tags may be used by clients in search, discovery, and filtering of
 * identities, and they can also convey information like accreditation from
 * investor protection organizations, public certifications by security or
 * financial auditors, and other designations that signal integrity and value
 * to users.
 */
export type Tag = {
  /**
   * The name of this tag for use in interfaces.
   *
   * In user interfaces with limited space, names should be hidden beyond
   * the first newline character or `20` characters until revealed by the user.
   *
   * E.g.:
   * - `Individual`
   * - `Token`
   * - `Audited by ACME, Inc.`
   */
  name: string;

  /**
   * A string describing this tag for use in user interfaces.
   *
   * In user interfaces with limited space, descriptions should be hidden beyond
   * the first newline character or `140` characters until revealed by the user.
   *
   * E.g.:
   * - `An identity maintained by a single individual.`
   * - `An identity representing a type of token.`
   * - `An on-chain application that has passed security audits by ACME, Inc.`
   */
  description?: string;

  /**
   * A mapping of identifiers to URIs associated with this tag. URI identifiers
   * may be widely-standardized or registry-specific. Values must be valid URIs,
   * including a protocol prefix (e.g. `https://` or `ipfs://`). Clients are
   * only required to support `https` and `ipfs` URIs, but any scheme may
   * be specified.
   *
   * The following identifiers are recommended for all tags:
   * - `icon`
   * - `web`
   *
   * The following optional identifiers are standardized:
   * - `blog`
   * - `chat`
   * - `forum`
   * - `icon-intro`
   * - `registry`
   * - `support`
   *
   * For details on these standard identifiers, see:
   * https://github.com/bitjson/chip-bcmr#uri-identifiers
   *
   * Custom URI identifiers allow for sharing social networking profiles, p2p
   * connection information, and other application-specific URIs. Identifiers
   * must be lowercase, alphanumeric strings, with no whitespace or special
   * characters other than dashes (as a regular expression: `/^[-a-z0-9]+$/`).
   *
   * For example, some common identifiers include: `discord`, `docker`,
   * `facebook`, `git`, `github`, `gitter`, `instagram`, `linkedin`, `matrix`,
   * `npm`, `reddit`, `slack`, `substack`, `telegram`, `twitter`, `wechat`,
   * `youtube`.
   */
  uris?: URIs;

  /**
   * A mapping of `Tag` extension identifiers to extension definitions.
   * {@link Extensions} may be widely standardized or application-specific.
   */
  extensions?: Extensions;
};

/**
 * A definition for one type of NFT within a token category.
 */
export type NftType = {
  /**
   * The name of this NFT type for use in interfaces. Names longer than `20`
   * characters may be elided in some interfaces.
   *
   * E.g. `Market Order Buys`, `Limit Order Sales`, `Pledge Receipts`,
   * `ACME Stadium Tickets`, `Sealed Votes`, etc.
   */
  name: string;

  /**
   * A string describing this NFT type for use in user interfaces.
   *
   * In user interfaces with limited space, names should be hidden beyond the
   * first newline character or `140` characters until revealed by the user.
   *
   * E.g.:
   * - "Receipts issued by the exchange to record details about purchases. After
   * settlement, these receipts are redeemed for the purchased tokens.";
   * - "Receipts issued by the crowdfunding campaign to document the value of
   * funds pledged. If the user decides to cancel their pledge before the
   * campaign completes, these receipts can be redeemed for a full refund.";
   * - "Tickets issued for events at ACME Stadium.";
   * - Sealed ballots certified by ACME decentralized organization during the
   * voting period. After the voting period ends, these ballots must be revealed
   * to reclaim the tokens used for voting."
   */
  description?: string;

  /**
   * A list of identifiers for fields contained in NFTs of this type. On
   * successful parsing evaluations, the bottom item on the altstack indicates
   * the matched NFT type, and the remaining altstack items represent NFT field
   * contents in the order listed (where `fields[0]` is the second-to-bottom
   * item, and the final item in `fields` is the top of the altstack).
   *
   * Fields should be ordered by recommended importance from most important to
   * least important; in user interfaces, clients should display fields at lower
   * indexes more prominently than those at higher indexes, e.g. if some fields
   * cannot be displayed in minimized interfaces, higher-importance fields can
   * still be represented. (Note, this ordering is controlled by the bytecode
   * specified in `token.nft.parse.bytecode`.)
   *
   * If this is a sequential NFT, (the category's `parse.bytecode` is
   * undefined), `fields` should be omitted or set to `undefined`.
   */
  fields?: string[];

  /**
   * A mapping of identifiers to URIs associated with this NFT type. URI
   * identifiers may be widely-standardized or registry-specific. Values must be
   * valid URIs, including a protocol prefix (e.g. `https://` or `ipfs://`).
   * Clients are only required to support `https` and `ipfs` URIs, but any
   * scheme may be specified.
   */
  uris?: URIs;

  /**
   * A mapping of NFT type extension identifiers to extension definitions.
   * {@link Extensions} may be widely standardized or application-specific.
   */
  extensions?: Extensions;
};

/**
 * A definition specifying a field that can be encoded in non-fungible tokens of
 * a token category.
 */
export type NftCategoryField = {
  [identifier: string]: {
    /**
     * The name of this field for use in interfaces. Names longer than `20`
     * characters may be elided in some interfaces.
     *
     * E.g.:
     * - `BCH Pledged`
     * - `Tokens Sold`
     * - `Settlement Locktime`
     * - `Seat Number`,
     * - `IPFS Content Identifier`
     * - `HTTPS URL`
     */
    name?: string;

    /**
     * A string describing how this identity uses NFTs (for use in user
     * interfaces). Descriptions longer than `160` characters may be elided in
     * some interfaces.
     *
     * E.g.:
     * - `The BCH value pledged at the time this receipt was issued.`
     * - `The number of tokens sold in this order.`
     * - `The seat number associated with this ticket.`
     */
    description?: string;

    /**
     * The expected encoding of this field when read from the parsing altstack
     * (see {@link ParsableNftCollection}). All encoding definitions must have a
     * `type`, and some encoding definitions allow for additional hinting about
     * display strategies in clients.
     *
     * Encoding types may be set to `binary`, `boolean`, `hex`, `number`,
     * or `utf8`:
     *
     * - `binary` types should be displayed as binary literals (e.g. `0b0101`)
     * - `boolean` types should be displayed as `true` if exactly `0x01` or
     * `false` if exactly `0x00`. If a boolean value does not match one of these
     * values, clients should represent the NFT as unable to be parsed
     * (e.g. simply display the full `commitment`).
     * - `hex` types should be displayed as hex literals (e.g.`0xabcd`).
     * - `https-url` types are percent encoded with the `https://` prefix
     * omitted; they may be displayed as URIs or as activatable links.
     * - `ipfs-cid` types are binary-encoded IPFS Content Identifiers; they may
     * be displayed as URIs or as activatable links.
     * - `locktime` types are `OP_TXLOCKTIME` results: integers from `0` to
     * `4294967295` (inclusive) where values less than `500000000` are
     * understood to be a block height (the current block number in the chain,
     * beginning from block `0`), and values greater than or equal to
     * `500000000` are understood to be a Median Time Past (BIP113) UNIX
     * timestamp. (Note, sequence age is not currently supported.)
     * - `number` types should be displayed according the their configured
     * `decimals` and `unit` values.
     * - `utf8` types should be displayed as utf8 strings.
     */
    encoding:
      | {
          type:
            | 'binary'
            | 'boolean'
            | 'hex'
            | 'https-url'
            | 'ipfs-cid'
            | 'utf8'
            | `locktime`;
        }
      | {
          type: 'number';

          /**
           * The `aggregate` property indicates that aggregating this field from
           * multiple NFTs is desirable in user interfaces. For example, for a
           * field named `BCH Pledged` where `aggregate` is `add`, the client
           * can display a `Total BCH Pledged` in any user interface listing
           * more than one NFT.
           *
           * If specified, clients should aggregate the field from all NFTs, of
           * all NFT types within the category, within a particular view (e.g.
           * NFTs held by a single wallet, NFTs existing in a single
           * transaction's outputs, etc.) using the specified operation.
           *
           * Note, while aggregation could be performed using any commutative
           * operation – multiplication, bitwise AND, bitwise OR, bitwise XOR,
           * etc. – only `add` is currently supported.
           */
          aggregate?: 'add';

          /**
           * An integer between `0` and `18` (inclusive) indicating the
           * divisibility of the primary unit of this token field.
           *
           * This is the number of digits that can appear after the decimal
           * separator in amounts. For a field with a `decimals` of `2`, a value
           * of `123456` should be displayed as `1234.56`.
           *
           * If omitted, defaults to `0`.
           */
          decimals?: number;

          /**
           * The unit in which this field is denominated, taking the `decimals`
           * value into account. If representing fungible token amount, this
           * will often be the symbol of the represented token category.
           *
           * E.g. `BCH`, `sats`, `AcmeUSD`, etc.
           *
           * If not provided, clients should not represent this field as having
           * a unit beyond the field's `name`.
           */
          unit?: string;
        };
    /**
     * A mapping of identifiers to URIs associated with this NFT field. URI
     * identifiers may be widely-standardized or registry-specific. Values must
     * be valid URIs, including a protocol prefix (e.g. `https://` or
     * `ipfs://`). Clients are only required to support `https` and `ipfs` URIs,
     * but any scheme may be specified.
     */
    uris?: URIs;

    /**
     * A mapping of NFT field extension identifiers to extension definitions.
     * {@link Extensions} may be widely standardized or application-specific.
     */
    extensions?: Extensions;
  };
};

/**
 * Interpretation information for a collection of sequential NFTs, a collection
 * in which each NFT includes only a sequential identifier within its on-chain
 * commitment. Note that {@link SequentialNftCollection}s differ from
 * {@link ParsableNftCollection}s in that sequential collections lack a
 * parsing `bytecode` with which to inspect each NFT commitment: the type of
 * each NFT is indexed by the full contents its commitment (interpreted as a
 * positive VM integer in user interfaces).
 */
export type SequentialNftCollection = {
  /**
   * A mapping of each NFT commitment (typically, a positive integer encoded as
   * a VM number) to metadata for that NFT type in this category.
   */
  types: {
    /**
     * Interpretation information for each type of NFT within the token
     * category, indexed by commitment hex. For sequential NFTs, the on-chain
     * commitment of each NFT is interpreted as a VM number to reference its
     * particular NFT type in user interfaces. Issuing a sequential NFT with a
     * negative or invalid VM number is discouraged, but clients may render the
     * commitment of such NFTs in hex-encoded form, prefixed with `X`.
     */
    [commitmentHex: string]: NftType;
  };
};

/**
 * Interpretation information for a collection of parsable NFTs, a collection
 * in which each NFT may include additional metadata fields beyond a sequential
 * identifier within its on-chain commitment. Note that
 * {@link ParsableNftCollection}s differ from {@link SequentialNftCollection}s
 * in that parsable collections require a parsing `bytecode` with which to
 * inspect each NFT commitment: the type of each NFT is indexed by the
 * hex-encoded contents the bottom item on the altstack following the evaluation
 * of the parsing bytecode.
 */
export type ParsableNftCollection = {
  /**
   * A segment of hex-encoded Bitcoin Cash VM bytecode that parses UTXOs
   * holding NFTs of this category, identifies the NFT's type within the
   * category, and returns a list of the NFT's field values via the
   * altstack. If undefined, this NFT Category includes only sequential NFTs,
   * with only an identifier and no NFT fields encoded in each NFT's
   * on-chain commitment.
   *
   * The parse `bytecode` is evaluated by instantiating and partially
   * verifying a standardized NFT parsing transaction:
   * - version: `2`
   * - inputs:
   *   - 0: Spends the UTXO containing the NFT with an empty
   *   unlocking bytecode and sequence number of `0`.
   *   - 1: Spends index `0` of the empty hash outpoint, with locking
   *   bytecode set to `parse.bytecode`, unlocking bytecode `OP_1`
   *   (`0x51`) and sequence number `0`.
   * - outputs:
   *   - 0: A locking bytecode of OP_RETURN (`0x6a`) and value of `0`.
   * - locktime: `0`
   *
   * After input 1 of this NFT parsing transaction is evaluated, if the
   * resulting stack is not valid (a single "truthy" element remaining on
   * the stack) – or if the altstack is empty – parsing has failed and
   * clients should represent the NFT as unable to be parsed (e.g. simply
   * display the full `commitment` as a hex-encoded value in the user
   * interface).
   *
   * On successful parsing evaluations, the bottom item on the altstack
   * indicates the type of the NFT according to the matching definition in
   * `types`. If no match is found, clients should represent the NFT as
   * unable to be parsed.
   *
   * For example: `00d2517f7c6b` (OP_0 OP_UTXOTOKENCOMMITMENT OP_1 OP_SPLIT
   * OP_SWAP OP_TOALTSTACK OP_TOALTSTACK) splits the commitment after 1 byte,
   * pushing the first byte to the altstack as an NFT type identifier and the
   * remaining segment of the commitment as the first NFT field value.
   *
   * If undefined (in a {@link SequentialNftCollection}), this field could be
   * considered to have a default value of `00d26b` (OP_0 OP_UTXOTOKENCOMMITMENT
   * OP_TOALTSTACK), which takes the full contents of the commitment as a fixed
   * type index. As such, each index of the NFT category's `types` maps a
   * precise commitment value to the metadata for NFTs with that particular
   * commitment. E.g. an NFT with an empty commitment (VM number 0) maps to
   * `types['']`, a commitment of `01` (hex) maps to `types['01']`, etc. This
   * pattern is used for collections of sequential NFTs.
   */
  bytecode: string;
  /**
   * A mapping of hex-encoded values to definitions of possible NFT types
   * in this category.
   */
  types: {
    /**
     * A definitions for each type of NFT within the token category. Parsable
     * NFT types are indexed by the hex-encoded value of the bottom altstack
     * item following evaluation of `NftCategory.parse.bytecode`. The remaining
     * altstack items are mapped to NFT fields according to the `fields`
     * property of the matching NFT type.
     */
    [bottomAltstackHex: string]: NftType;
  };
};

/**
 * A definition specifying the non-fungible token information for a
 * token category.
 */
export type NftCategory = {
  /**
   * A string describing how this identity uses NFTs (for use in user
   * interfaces). Descriptions longer than `160` characters may be elided in
   * some interfaces.
   *
   * E.g.:
   * - "ACME DEX NFT order receipts are issued when you place orders on the
   * decentralized exchange. After orders are processed, order receipts can
   * be redeemed for purchased tokens or sales proceeds.";
   * - "ACME Game collectable NFTs unlock unique playable content, user
   * avatars, and item skins in ACME Game Online."; etc.
   */
  description?: string;

  /**
   * A mapping of field identifier to field definitions for the data fields
   * that can appear in NFT commitments of this category.
   *
   * Categories including only sequential NFTs (where `parse.bytecode` is
   * undefined) should omit `fields` (or set to `undefined`).
   */
  fields?: NftCategoryField;

  /**
   * Parsing and interpretation information for all NFTs of this category;
   * this enables generalized wallets to parse and display detailed
   * information about all NFTs held by the wallet, e.g. `BCH Pledged`,
   * `Order Price`, `Seat Number`, `Asset Number`,
   * `IPFS Content Identifier`, `HTTPS URL`, etc.
   *
   * Parsing instructions are provided in the `bytecode` property, and the
   * results are interpreted using the `types` property.
   */
  parse: ParsableNftCollection | SequentialNftCollection;
};

/**
 * A definition specifying information about an identity's token category.
 */
export type TokenCategory = {
  /**
   * The current token category used by this identity. Often, this will be
   * equal to the identity's authbase, but some token identities must migrate
   * to new categories for technical reasons.
   */
  category: string;

  /**
   * An abbreviation used to uniquely identity this token category.
   *
   * Symbols must be comprised only of capital letters, numbers, and dashes
   * (`-`). This can be validated with the regular expression:
   * `/^[-A-Z0-9]+$/`.
   */
  symbol: string;

  /**
   * An integer between `0` and `18` (inclusive) indicating the divisibility
   * of the primary unit of this token category.
   *
   * This is the number of digits that can appear after the decimal separator
   * in fungible token amounts. For a token category with a `symbol` of
   * `SYMBOL` and a `decimals` of `2`, a fungible token amount of `12345`
   * should be displayed as `123.45 SYMBOL`.
   *
   * If omitted, defaults to `0`.
   */
  decimals?: number;

  /**
   * Display information for non-fungible tokens (NFTs) of this identity.
   * Omitted for token categories without NFTs.
   */
  nfts?: NftCategory;
};

/**
 * A snapshot of the metadata for a particular identity at a specific time.
 */
export type IdentitySnapshot = {
  /**
   * The name of this identity for use in interfaces.
   *
   * In user interfaces with limited space, names should be hidden beyond
   * the first newline character or `20` characters until revealed by the user.
   *
   * E.g. `ACME Class A Shares`, `ACME Registry`, `Satoshi Nakamoto`, etc.
   */
  name: string;

  /**
   * A string describing this identity for use in user interfaces.
   *
   * In user interfaces with limited space, descriptions should be hidden beyond
   * the first newline character or `140` characters until revealed by the user.
   *
   * E.g.:
   * - `The common stock issued by ACME, Inc.`
   * - `A metadata registry maintained by Company Name, the embedded registry for Wallet Name.`
   * - `Software developer and lead maintainer of Wallet Name.`
   */
  description?: string;

  /**
   * An array of `Tag` identifiers marking the `Tag`s associated with this
   * identity. All specified tag identifiers must be defined in the registry's
   * `tags` mapping.
   */
  tags?: string[];

  /**
   * The timestamp at which this identity snapshot is fully in effect. This
   * value should only be provided if the snapshot takes effect over a period
   * of time (e.g. an in-circulation token identity is gradually migrating to
   * a new category). In these cases, clients should gradually migrate to
   * using the new information beginning after the identity snapshot's timestamp
   * and the `migrated` time.
   *
   * This timestamp must be provided in simplified extended ISO 8601 format, a
   * 24-character string of format `YYYY-MM-DDTHH:mm:ss.sssZ` where timezone is
   * zero UTC (denoted by `Z`). Note, this is the format returned by ECMAScript
   * `Date.toISOString()`.
   */
  migrated?: string;

  /**
   * If this identity is a type of token, a data structure indicating how tokens
   * should be understood and displayed in user interfaces. Omitted for
   * non-token identities.
   */
  token?: TokenCategory;

  /**
   * The status of this identity, must be `active`, `inactive`, or `burned`. If
   * omitted, defaults to `active`.
   * - Identities with an `active` status should be actively tracked by clients.
   * - Identities with an `inactive` status may be considered for archival by
   * clients and may be removed in future registry versions.
   * - Identities with a `burned` status have been destroyed by setting the
   * latest identity output to a data-carrier output (`OP_RETURN`), permanently
   * terminating the authchain. Clients should archive burned identities and –
   * if the burned identity represented a token type – consider burning any
   * remaining tokens of that category to reclaim funds from those outputs.
   */
  status?: 'active' | 'burned' | 'inactive';

  /**
   * The split ID of this identity's chain of record.
   *
   * If undefined, defaults to {@link MetadataRegistry.defaultChain}.
   */
  splitId?: string;

  /**
   * A mapping of identifiers to URIs associated with this identity. URI
   * identifiers may be widely-standardized or registry-specific. Values must be
   * valid URIs, including a protocol prefix (e.g. `https://` or `ipfs://`).
   * Clients are only required to support `https` and `ipfs` URIs, but any
   * scheme may be specified.
   *
   * The following identifiers are recommended for all identities:
   * - `icon`
   * - `web`
   *
   * The following optional identifiers are standardized:
   * - `blog`
   * - `chat`
   * - `forum`
   * - `icon-intro`
   * - `image`
   * - `migrate`
   * - `registry`
   * - `support`
   *
   * For details on these standard identifiers, see:
   * https://github.com/bitjson/chip-bcmr#uri-identifiers
   *
   * Custom URI identifiers allow for sharing social networking profiles, p2p
   * connection information, and other application-specific URIs. Identifiers
   * must be lowercase, alphanumeric strings, with no whitespace or special
   * characters other than dashes (as a regular expression: `/^[-a-z0-9]+$/`).
   *
   * For example, some common identifiers include: `discord`, `docker`,
   * `facebook`, `git`, `github`, `gitter`, `instagram`, `linkedin`, `matrix`,
   * `npm`, `reddit`, `slack`, `substack`, `telegram`, `twitter`, `wechat`,
   * `youtube`.
   */
  uris?: URIs;

  /**
   * A mapping of `IdentitySnapshot` extension identifiers to extension
   * definitions. {@link Extensions} may be widely standardized or
   * application-specific.
   *
   * Standardized extensions for `IdentitySnapshot`s include the `authchain`
   * extension. See
   * https://github.com/bitjson/chip-bcmr#authchain-extension for details.
   */
  extensions?: Extensions;
};

/**
 * A snapshot of the metadata for a particular chain/network at a specific
 * time. This allows for registries to provide similar metadata for each chain's
 * native currency unit (name, description, symbol, icon, etc.) as can be
 * provided for other registered tokens.
 */
export type ChainSnapshot = Omit<IdentitySnapshot, 'migrated' | 'token'> & {
  /**
   * A data structure indicating how the chain's native currency units should be
   * displayed in user interfaces.
   */
  token: {
    /**
     * An abbreviation used to uniquely identity this native currency unit.
     *
     * Symbols must be comprised only of capital letters, numbers, and dashes
     * (`-`). This can be validated with the regular expression:
     * `/^[-A-Z0-9]+$/`.
     */
    symbol: string;

    /**
     * An integer between `0` and `18` (inclusive) indicating the divisibility
     * of the primary unit of this native currency.
     *
     * This is the number of digits that can appear after the decimal separator
     * in currency amounts. For a currency with a `symbol` of `SYMBOL` and a
     * `decimals` of `2`, an amount of `12345` should be displayed as
     * `123.45 SYMBOL`.
     *
     * If omitted, defaults to `0`.
     */
    decimals?: number;
  };
};

/**
 * A field keyed by timestamps to document the evolution of the field. Each
 * timestamp must be provided in simplified extended ISO 8601 format, a
 * 24-character string of format `YYYY-MM-DDTHH:mm:ss.sssZ` where timezone is
 * zero UTC (denoted by `Z`). Note, this is the format returned by ECMAScript
 * `Date.toISOString()`.
 *
 * For example, to insert a new value:
 * ```ts
 * const result = { ...previousValue, [(new Date()).toISOString()]: newValue };
 * ```
 */
export type RegistryTimestampKeyedValues<T> = {
  [timestamp: string]: T;
};

/**
 * A block height-keyed map of {@link ChainSnapshot}s documenting the evolution
 * of a particular chain/network's identity. Like {@link IdentityHistory}, this
 * structure allows wallets and other user interfaces to offer better
 * experiences when a chain identity is rebranded, redenominated, or other
 * important metadata is modified in a coordinated update.
 */
export type ChainHistory = RegistryTimestampKeyedValues<ChainSnapshot>;

/**
 * A timestamp-keyed map of {@link IdentitySnapshot}s documenting
 * the evolution of a particular identity. The current identity information is
 * the snapshot associated with the latest timestamp reached. If no timestamp
 * has yet been reached, the snapshot of the oldest timestamp is considered
 * current. Future-dated timestamps indicate planned migrations.
 *
 * This strategy allows wallets and other user interfaces to offer better
 * experiences when an identity is rebranded, a token redenominated, or other
 * important metadata is modified in a coordinated update. For example, a wallet
 * may warn token holders of a forthcoming rebranding of fungible tokens they
 * hold; after the change, the wallet may continue to offer prominent interface
 * hints that the rebranded token identity was recently updated.
 *
 * Timestamps may be order by time via lexicographical sort. For determinism, it
 * is recommended that implementations sort from newest to oldest in exported
 * registry JSON files.
 *
 * If the current snapshot's {@link IdentitySnapshot.migrated} isn't specified,
 * the snapshot's index is a precise time at which the snapshot takes effect and
 * clients should begin using the new information. If `migrated` is specified,
 * the snapshot's index is the timestamp at which the transition is considered
 * to begin, see {@link IdentitySnapshot.migrated} for details.
 *
 * Each timestamp must be provided in simplified extended ISO 8601 format, a
 * 24-character string of format `YYYY-MM-DDTHH:mm:ss.sssZ` where timezone is
 * zero UTC (denoted by `Z`). Note, this is the format returned by ECMAScript
 * `Date.toISOString()`.
 *
 * In the case that an identity change occurs due to on-chain activity (e.g. an
 * on-chain migration that is set to complete at a particular locktime value),
 * registry-recorded timestamps reflect the real-world time at which the
 * maintainer of the registry believes the on-chain activity to have actually
 * occurred. Likewise, future-dated timestamps indicate a precise real-world
 * time at which a snapshot is estimated to take effect, rather than the Median
 * Time Past (BIP113) UNIX timestamp or another on-chain measurement of time.
 */
export type IdentityHistory = RegistryTimestampKeyedValues<IdentitySnapshot>;

/**
 * An identity representing a metadata registry that is not published on-chain
 * and therefore has no authbase or trackable authchain.
 */
export type OffChainRegistryIdentity = Pick<
  IdentitySnapshot,
  'description' | 'extensions' | 'name' | 'tags' | 'uris'
>;

/**
 * A Bitcoin Cash Metadata Registry is an authenticated JSON file containing
 * metadata about tokens, identities, contract applications, and other on-chain
 * artifacts. BCMRs conform to the Bitcoin Cash Metadata Registry JSON Schema,
 * and they can be published and maintained by any entity or individual.
 */
export type MetadataRegistry = {
  /**
   * The schema used by this registry. Many JSON editors can automatically
   * provide inline documentation and autocomplete support using the `$schema`
   * property, so it is recommended that registries include it. E.g.:
   * `https://cashtokens.org/bcmr-v2.schema.json`
   */
  $schema?: string;

  /**
   * The version of this registry. Versioning adheres to Semantic Versioning
   * (https://semver.org/).
   */
  version: {
    /**
     * The major version is incremented when an identity is removed.
     */
    major: number;

    /**
     * The minor version is incremented when an identity is added or a new
     * identity snapshot is added.
     */
    minor: number;

    /**
     * The patch version is incremented when an existing identity or identity
     * snapshot is modified (e.g. to correct an error or add a missing piece of
     * information) or when other registry properties (e.g. registry `name`,
     * `description`, `uris`, etc.) are modified.
     *
     * Generally, substantive changes to an existing identity should be made
     * using a new identity snapshot in a minor version upgrade – this allows
     * clients to provide a better user experience by noting the change in
     * relevant user interfaces.
     *
     * For example, patch upgrades might include spelling corrections in an
     * existing snapshot or the addition of an `icon` containing a
     * higher-resolution version of an existing `icon` image. On the other hand,
     * a rebranding in which the icon is substantially changed may warrant a new
     * identity snapshot to be added in a minor version upgrade.
     */
    patch: number;
  };

  /**
   * The timestamp of the latest revision made to this registry version. The
   * timestamp must be provided in simplified extended ISO 8601 format, a
   * 24-character string of format `YYYY-MM-DDTHH:mm:ss.sssZ` where timezone is
   * zero UTC (denoted by `Z`). Note, this is the format returned by ECMAScript
   * `Date.toISOString()`.
   */
  latestRevision: string;

  /**
   * The identity information of this particular registry, provided as either an
   * authbase (recommended) or an `IdentitySnapshot`.
   *
   * An authbase is a 32-byte, hex-encoded transaction hash (A.K.A. TXID) for
   * which the zeroth-descendant transaction chain (ZDTC) authenticates and
   * publishes all registry updates. If an authbase is provided, the registry's
   * identity information can be found in `identities[authbase]`, and clients
   * should immediately attempt to verify the registry's identity on-chain.
   * (See https://github.com/bitjson/chip-bcmr#chain-resolved-registries)
   *
   * If an `IdentitySnapshot` is provided directly, this registry does not
   * support on-chain resolution/authentication, and the contained
   * `IdentitySnapshot` can only be authenticated via DNS/HTTPS.
   */
  registryIdentity: OffChainRegistryIdentity | string;

  /**
   * A mapping of authbases to the `IdentityHistory` for that identity.
   *
   * An authbase is a 32-byte, hex-encoded transaction hash (A.K.A. TXID) for
   * which the zeroth-descendant transaction chain (ZDTC) authenticates and
   * publishes an identity's claimed metadata.
   *
   * Identities may represent metadata registries, specific types of tokens,
   * companies, organizations, individuals, or other on-chain entities.
   */
  identities?: {
    [authbase: string]: IdentityHistory;
  };

  /**
   * A map of registry-specific `Tag`s used by this registry to convey
   * information about identities it tracks.
   *
   * Tags allow registries to group identities into collections of related
   * identities, marking characteristics or those identities. Tags are
   * standardized within a registry and may represent either labels applied by
   * that registry (e.g. `individual`, `organization`, `token`, `wallet`,
   * `exchange`, `staking`, `utility-token`, `security-token`, `stablecoin`,
   * `wrapped`, `collectable`, `deflationary`, `governance`,
   * `decentralized-exchange`, `liquidity-provider`, `sidechain`,
   * `sidechain-bridge`, etc.) or designations by external authorities
   * (certification, membership, ownership, etc.) that are tracked by
   * that registry.
   *
   * Tags may be used by clients in search, discover, and filtering of
   * identities, and they can also convey information like accreditation from
   * investor protection organizations, public certifications by security or
   * financial auditors, and other designations that signal legitimacy and value
   * to users.
   */
  tags?: {
    [identifier: string]: Tag;
  };

  /**
   * The split ID of the chain/network considered the "default" chain for this
   * registry. Identities that do not specify a {@link IdentitySnapshot.splitId}
   * are assumed to be set to this split ID. For a description of split IDs,
   * see {@link MetadataRegistry.chains}.
   *
   * If not provided, the `defaultChain` is
   * `0000000000000000029e471c41818d24b8b74c911071c4ef0b4a0509f9b5a8ce`, the BCH
   * side of the BCH/XEC split (mainnet). Common values include:
   * - `00000000ae25e85d9e22cd6c8d72c2f5d4b0222289d801b7f633aeae3f8c6367`
   * (testnet4)
   * - `00000000040ba9641ba98a37b2e5ceead38e4e2930ac8f145c8094f94c708727`
   * (chipnet)
   */
  defaultChain?: string;

  /**
   * A map of split IDs tracked by this registry to the {@link ChainHistory} for
   * that chain/network.
   *
   * The split ID of a chain is the block header hash (A.K.A. block ID) of the
   * first unique block after the most recent tracked split – a split after
   * which both resulting chains are considered notable or tracked by the
   * registry. (For chains with no such splits, this is the ID of the
   * genesis block.)
   *
   * Note, split ID is inherently a "relative" identifier. After a tracked
   * split, both resulting chains will have a new split ID. However, if a wallet
   * has not yet heard about a particular split, that wallet will continue to
   * reference one of the resulting chains by its previous split ID, and the
   * split-unaware wallet may create transactions that are valid on both chains
   * (losing claimable value if the receivers of their transactions don't
   * acknowledge transfers on both chains). When a registry trusted by the
   * wallet notes the split in it's `chains` map, the wallet can represent the
   * split in the user interface using the the latest {@link ChainSnapshot} for
   * each chain and splitting coins prior to spending (by introducing post-split
   * coins in each transaction).
   *
   * This map may exclude the following well-known split IDs (all clients
   * supporting any of these chains should build-in {@link ChainHistory} for
   * those chains):
   *
   * - `0000000000000000029e471c41818d24b8b74c911071c4ef0b4a0509f9b5a8ce`:
   *   A.K.A. mainnet – the BCH side of the BCH/XEC split.
   * - `00000000ae25e85d9e22cd6c8d72c2f5d4b0222289d801b7f633aeae3f8c6367`:
   *   A.K.A testnet4 – the test network on which CHIPs are activated
   *   simultaneously with mainnet (May 15 at 12 UTC).
   * - `00000000040ba9641ba98a37b2e5ceead38e4e2930ac8f145c8094f94c708727`:
   *   A.K.A. chipnet – the test network on which CHIPs are activated 6 months
   *   before mainnet (November 15 at 12 UTC).
   *
   * All other split IDs referenced by this registry should be included in this
   * map.
   */
  chains?: {
    [splitId: string]: ChainHistory;
  };

  /**
   * The license under which this registry is published. This may be specified
   * as either a SPDX short identifier (https://spdx.org/licenses/) or by
   * including the full text of the license.
   *
   * Common values include:
   *  - `CC0-1.0`: https://creativecommons.org/publicdomain/zero/1.0/
   *  - `MIT`: https://opensource.org/licenses/MIT
   */
  license?: string;

  /**
   * A mapping of `Registry` extension identifiers to extension definitions.
   * {@link Extensions} may be widely standardized or application-specific.
   *
   * Standardized extensions for `Registry`s include the `locale` extension. See
   * https://github.com/bitjson/chip-bcmr#locales-extension for details.
   */
  extensions?: Extensions;
};
