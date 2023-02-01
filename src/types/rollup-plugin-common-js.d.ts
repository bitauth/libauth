// used in benchmarks
declare module '@rollup/plugin-commonjs' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function alias(): any;
  // eslint-disable-next-line import/no-default-export
  export default alias;
}
