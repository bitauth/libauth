# FROM liuchong/rustup:nightly
FROM liuchong/rustup@sha256:57795147db06a7ebad574469fb1198cf36fc26dc74d504d128ae2160271b2b61
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
COPY wasm/hashes/ripemd160 /libauth/wasm/hashes/ripemd160
WORKDIR /libauth/wasm/hashes/ripemd160
RUN mkdir -p out/ripemd160
RUN wasm-pack init
RUN /binaryen/bin/wasm-opt -O3 pkg/ripemd160_bg.wasm -o pkg/ripemd160.wasm
RUN cp pkg/ripemd160.wasm out/ripemd160
RUN cp pkg/ripemd160.d.ts out/ripemd160
RUN cp pkg/ripemd160.js out/ripemd160
RUN OUTPUT_TS_FILE=out/ripemd160/ripemd160.base64.ts; printf "/**\n * @hidden\n */\n// prettier-ignore\nexport const ripemd160Base64Bytes =\n  '" > $OUTPUT_TS_FILE && base64 -w 0 pkg/ripemd160.wasm >> $OUTPUT_TS_FILE && printf "';\n" >> $OUTPUT_TS_FILE
RUN cp -r /libauth/wasm/hashes/ripemd160/out/ripemd160 /libauth/bin

# sha256
COPY wasm/hashes/sha256 /libauth/wasm/hashes/sha256
WORKDIR /libauth/wasm/hashes/sha256
RUN mkdir -p out/sha256
RUN wasm-pack init
RUN /binaryen/bin/wasm-opt -O3 pkg/sha256_bg.wasm -o pkg/sha256.wasm
RUN cp pkg/sha256.wasm out/sha256
RUN cp pkg/sha256.d.ts out/sha256
RUN cp pkg/sha256.js out/sha256
RUN OUTPUT_TS_FILE=out/sha256/sha256.base64.ts; printf "/**\n * @hidden\n */\n// prettier-ignore\nexport const sha256Base64Bytes =\n  '" > $OUTPUT_TS_FILE && base64 -w 0 pkg/sha256.wasm >> $OUTPUT_TS_FILE && printf "';\n" >> $OUTPUT_TS_FILE
RUN cp -r /libauth/wasm/hashes/sha256/out/sha256 /libauth/bin

# sha512
COPY wasm/hashes/sha512 /libauth/wasm/hashes/sha512
WORKDIR /libauth/wasm/hashes/sha512
RUN mkdir -p out/sha512
RUN wasm-pack init
RUN /binaryen/bin/wasm-opt -O3 pkg/sha512_bg.wasm -o pkg/sha512.wasm
RUN cp pkg/sha512.wasm out/sha512
RUN cp pkg/sha512.d.ts out/sha512
RUN cp pkg/sha512.js out/sha512
RUN OUTPUT_TS_FILE=out/sha512/sha512.base64.ts; printf "/**\n * @hidden\n */\n// prettier-ignore\nexport const sha512Base64Bytes =\n  '" > $OUTPUT_TS_FILE && base64 -w 0 pkg/sha512.wasm >> $OUTPUT_TS_FILE && printf "';\n" >> $OUTPUT_TS_FILE
RUN cp -r /libauth/wasm/hashes/sha512/out/sha512 /libauth/bin

# sha1
COPY wasm/hashes/sha1 /libauth/wasm/hashes/sha1
WORKDIR /libauth/wasm/hashes/sha1
RUN mkdir -p out/sha1
RUN wasm-pack init
RUN /binaryen/bin/wasm-opt -O3 pkg/sha1_bg.wasm -o pkg/sha1.wasm
RUN cp pkg/sha1.wasm out/sha1
RUN cp pkg/sha1.d.ts out/sha1
RUN cp pkg/sha1.js out/sha1
RUN OUTPUT_TS_FILE=out/sha1/sha1.base64.ts; printf "/**\n * @hidden\n */\n// prettier-ignore\nexport const sha1Base64Bytes =\n  '" > $OUTPUT_TS_FILE && base64 -w 0 pkg/sha1.wasm >> $OUTPUT_TS_FILE && printf "';\n" >> $OUTPUT_TS_FILE
RUN cp -r /libauth/wasm/hashes/sha1/out/sha1 /libauth/bin

WORKDIR /libauth/wasm/hashes/

# copy outputs to mounted volume
CMD ["cp", "-r", "/libauth/bin", "/libauth/out"]