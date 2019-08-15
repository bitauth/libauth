// TODO: clean up - this implementation comes from:
// https://github.com/google/closure-library/blob/8598d87242af59aac233270742c8984e2b2bdbe0/closure/goog/crypt/crypt.js
// consider switching to:
// https://github.com/mathiasbynens/utf8.js/blob/master/utf8.js

// tslint:disable:cyclomatic-complexity no-let no-if-statement no-magic-numbers no-object-mutation no-expression-statement no-bitwise
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
// tslint:enable:cyclomatic-complexity no-let no-if-statement no-magic-numbers no-object-mutation no-expression-statement no-bitwise

// also compare to:
// https://gist.github.com/joni/3760795
// https://gist.github.com/pascaldekloe/62546103a1576803dade9269ccf76330
// and:

// function stringFromUTF8Array(data)
// {
//   const extraByteMap = [ 1, 1, 1, 1, 2, 2, 3, 0 ];
//   var count = data.length;
//   var str = "";

//   for (var index = 0;index < count;)
//   {
//     var ch = data[index++];
//     if (ch & 0x80)
//     {
//       var extra = extraByteMap[(ch >> 3) & 0x07];
//       if (!(ch & 0x40) || !extra || ((index + extra) > count))
//         return null;

//       ch = ch & (0x3F >> extra);
//       for (;extra > 0;extra -= 1)
//       {
//         var chx = data[index++];
//         if ((chx & 0xC0) != 0x80)
//           return null;

//         ch = (ch << 6) | (chx & 0x3F);
//       }
//     }

//     str += String.fromCharCode(ch);
//   }

//   return str;
// }

// tslint:disable:cyclomatic-complexity no-let no-if-statement no-magic-numbers no-object-mutation no-expression-statement no-bitwise
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
// tslint:enable:cyclomatic-complexity no-let no-if-statement no-magic-numbers no-object-mutation no-expression-statement no-bitwise
