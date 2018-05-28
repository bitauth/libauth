// used in benchmarks (TODO: finish typing, send PR to project)
declare module 'chuhai' {
  function suite(
    name: string,
    implementation: (s: Helper) => void
  ): Promise<void>;
  export default suite;
}

interface Helper {
  cycle: (implementation: () => void) => void;
  bench: (name: string, implementation: () => void) => void;
  set: (key: string, value: any) => void;
}
