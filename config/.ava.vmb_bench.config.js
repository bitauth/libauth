export default {
  files: ['src/lib/vmb-tests/benchmark-bch-vmb-tests.spec.ts'],
  typescript: {
    compile: false,
    rewritePaths: {
      'src/': 'build/',
    },
  },
};
