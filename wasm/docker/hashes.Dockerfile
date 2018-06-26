FROM liuchong/rustup:nightly
RUN rustup target add wasm32-unknown-unknown --toolchain nightly
RUN cargo +nightly install wasm-bindgen-cli
RUN cargo install wasm-pack
RUN apt-get update && apt-get install git cmake python -y

WORKDIR /
# Build Binaryen v1.38.6
RUN BINARYEN_RELEASE=aab16136b9752eb0586b3a5b32b1d0e7a5803835 \
  && git clone --single-branch https://github.com/WebAssembly/binaryen.git \
  && cd binaryen \
  && git checkout $BINARYEN_RELEASE \
  && cmake . && make

# ripemd160
COPY wasm/hashes/ripemd160 /bitcoin-ts/wasm/hashes/ripemd160
WORKDIR /bitcoin-ts/wasm/hashes/ripemd160
RUN mkdir -p out/ripemd160
RUN wasm-pack init
RUN /binaryen/bin/wasm-opt -O3 pkg/ripemd160_bg.wasm -o pkg/ripemd160.wasm
RUN cp pkg/ripemd160.wasm out/ripemd160
RUN cp pkg/ripemd160.d.ts out/ripemd160
RUN cp pkg/ripemd160.js out/ripemd160
RUN OUTPUT_TS_FILE=out/ripemd160/ripemd160.base64.ts; printf "/**\n * @hidden\n */\n// prettier-ignore\nexport const ripemd160Base64Bytes: string =\n  '" > $OUTPUT_TS_FILE && base64 -w 0 pkg/ripemd160.wasm >> $OUTPUT_TS_FILE && printf "';\n" >> $OUTPUT_TS_FILE
RUN cp -r /bitcoin-ts/wasm/hashes/ripemd160/out /bitcoin-ts/bin

# sha256
COPY wasm/hashes/sha256 /bitcoin-ts/wasm/hashes/sha256
WORKDIR /bitcoin-ts/wasm/hashes/sha256
RUN mkdir -p out/sha256
RUN wasm-pack init
RUN /binaryen/bin/wasm-opt -O3 pkg/sha256_bg.wasm -o pkg/sha256.wasm
RUN cp pkg/sha256.wasm out/sha256
RUN cp pkg/sha256.d.ts out/sha256
RUN cp pkg/sha256.js out/sha256
RUN OUTPUT_TS_FILE=out/sha256/sha256.base64.ts; printf "/**\n * @hidden\n */\n// prettier-ignore\nexport const sha256Base64Bytes: string =\n  '" > $OUTPUT_TS_FILE && base64 -w 0 pkg/sha256.wasm >> $OUTPUT_TS_FILE && printf "';\n" >> $OUTPUT_TS_FILE
RUN cp -r /bitcoin-ts/wasm/hashes/sha256/out /bitcoin-ts/bin

WORKDIR /bitcoin-ts/wasm/hashes/

# copy outputs to mounted volume
CMD ["cp", "-r", "/bitcoin-ts/bin", "/bitcoin-ts/out"]