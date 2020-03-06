// used in benchmarks
declare module '@rollup/plugin-alias' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function alias(config?: RollupPluginAliasOptions): any;
  // eslint-disable-next-line import/no-default-export
  export default alias;
}

interface RollupPluginAliasOptions {
  readonly entries: {
    readonly [key: string]: string;
  };
}
