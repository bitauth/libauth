// used in tests and benchmarks
declare module 'bcrypto' {
  var thingsBitcoinTsTestsUse: {
    ripemd160: any;
    sha1: any;
    sha256: any;
    sha512: any;
  };
  export = thingsBitcoinTsTestsUse;
}
