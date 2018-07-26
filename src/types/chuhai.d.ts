declare module 'chuhai' {
  function suite(implementation: (s: Helper) => void): Promise<void>;
  function suite(
    name: string,
    implementation: (s: Helper) => void
  ): Promise<void>;
  export default suite;
}

interface Helper {
  cycle: (implementation: () => void) => void;
  bench: (
    name: string,
    implementation: Benchmark,
    opts?: BenchmarkOptions
  ) => void;
  burn: (
    name: string,
    implementation: Benchmark,
    opts?: BenchmarkOptions
  ) => void;
  set: (key: string, value: any) => void;
}

type Benchmark = (deferred: { resolve: () => void }) => void;

interface BenchmarkOptions {
  async?: boolean;
  defer?: boolean;
}
