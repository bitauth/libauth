/* eslint-disable functional/no-return-void */
declare module 'chuhai' {
  function suite(implementation: (s: Helper) => void): Promise<void>;
  function suite(
    name: string,
    implementation: (s: Helper) => void
  ): Promise<void>;
  // eslint-disable-next-line import/no-default-export
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  set: (key: string, value: any) => void;
}

type Benchmark = (deferred: { resolve: () => void }) => void;

interface BenchmarkOptions {
  async?: boolean;
  defer?: boolean;
}
