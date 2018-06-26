// used in tests and benchmarks
declare module 'bcoin' {
  var thingsBitcoinTsTestsUse: {
    crypto: {
      ripemd160: any;
    };
  };
  export = thingsBitcoinTsTestsUse;
}
