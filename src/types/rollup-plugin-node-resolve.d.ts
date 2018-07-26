// used in benchmarks (TODO: finish typing, send PR to project)
declare module 'rollup-plugin-node-resolve' {
  function resolve(config?: RollupPluginNodeResolveOptions): any;
  export default resolve;
}

interface RollupPluginNodeResolveOptions {
  jsnext?: boolean;
  main?: boolean;
  browser?: boolean;
}
