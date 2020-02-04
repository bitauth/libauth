// used in benchmarks (TODO: finish typing, send PR to project)
declare module 'rollup-plugin-node-resolve' {
  function nodeResolve(config?: RollupPluginNodeResolveOptions): any;
  export default nodeResolve;
}

interface RollupPluginNodeResolveOptions {
  // cspell: disable-next-line
  jsnext?: boolean;
  main?: boolean;
  browser?: boolean;
}
