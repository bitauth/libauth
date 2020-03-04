/**
 * This implementations is derived from:
 * https://github.com/google/closure-library/blob/8598d87242af59aac233270742c8984e2b2bdbe0/closure/goog/crypt/crypt.js
 *
 * Copyright 2008 The Closure Library Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/* eslint-disable complexity, functional/no-let, functional/immutable-data, no-bitwise, @typescript-eslint/no-magic-numbers, functional/no-expression-statement, functional/no-conditional-statement, functional/no-loop-statement, no-plusplus */

/**
 * Interpret a string as UTF-8 and encode it as a Uint8Array.
 * @param utf8 - the string to encode
 */
export const utf8ToBin = (utf8: string) => {
  const out = [];
  let p = 0;
  for (let i = 0; i < utf8.length; i++) {
    let c = utf8.charCodeAt(i);
    if (c < 128) {
      out[p++] = c;
    } else if (c < 2048) {
      out[p++] = (c >> 6) | 192;
      out[p++] = (c & 63) | 128;
    } else if (
      (c & 0xfc00) === 0xd800 &&
      i + 1 < utf8.length &&
      (utf8.charCodeAt(i + 1) & 0xfc00) === 0xdc00
    ) {
      c = ((c & 0x03ff) << 10) + 0x10000 + (utf8.charCodeAt((i += 1)) & 0x03ff);
      out[p++] = (c >> 18) | 240;
      out[p++] = ((c >> 12) & 63) | 128;
      out[p++] = ((c >> 6) & 63) | 128;
      out[p++] = (c & 63) | 128;
    } else {
      out[p++] = (c >> 12) | 224;
      out[p++] = ((c >> 6) & 63) | 128;
      out[p++] = (c & 63) | 128;
    }
  }
  return new Uint8Array(out);
};

/**
 * Decode a Uint8Array as a UTF-8 string.
 * @param bytes - the Uint8Array to decode
 */
export const binToUtf8 = (bytes: Uint8Array) => {
  const out = [];
  let pos = 0;
  let c = 0;
  while (pos < bytes.length) {
    const c1 = bytes[pos++];
    if (c1 < 128) {
      out[c++] = String.fromCharCode(c1);
    } else if (c1 > 191 && c1 < 224) {
      const c2 = bytes[pos++];
      out[c++] = String.fromCharCode(((c1 & 31) << 6) | (c2 & 63));
    } else if (c1 > 239 && c1 < 365) {
      const c2 = bytes[pos++];
      const c3 = bytes[pos++];
      const c4 = bytes[pos++];
      const u =
        (((c1 & 7) << 18) | ((c2 & 63) << 12) | ((c3 & 63) << 6) | (c4 & 63)) -
        0x10000;
      out[c++] = String.fromCharCode((u >> 10) + 0xd800);
      out[c++] = String.fromCharCode((u & 1023) + 0xdc00);
    } else {
      const c2 = bytes[pos++];
      const c3 = bytes[pos++];
      out[c++] = String.fromCharCode(
        ((c1 & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63)
      );
    }
  }
  return out.join('');
};
