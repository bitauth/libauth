// used in tests and benchmarks
declare module 'bcrypto' {
  // eslint-disable-next-line init-declarations
  const thingsBitcoinTsTestsUse: {
    RIPEMD160: BcryptoHashMethod;
    SHA1: BcryptoHashMethod;
    SHA256: BcryptoHashMethod;
    SHA512: BcryptoHashMethod;
  };
  export = thingsBitcoinTsTestsUse;

  interface BcryptoHashMethod {
    digest: (input: Buffer) => Buffer;
  }
}
