// used in benchmarks (TODO: finish typing, send PR to project)
declare module 'rollup-plugin-node-resolve' {
  function nodeResolve(config?: RollupPluginNodeResolveOptions): any;
  export default nodeResolve;
}

interface RollupPluginNodeResolveOptions {
  jsnext?: boolean;
  main?: boolean;
  browser?: boolean;
}
