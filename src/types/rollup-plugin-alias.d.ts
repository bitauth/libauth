// used in benchmarks (TODO: finish typing, send PR to project)
declare module 'rollup-plugin-alias' {
  function alias(config?: RollupPluginAliasOptions): any;
  export default alias;
}

interface RollupPluginAliasOptions {
  [key: string]: string;
}
