#![feature(proc_macro, wasm_import_module, wasm_custom_section)]

extern crate ripemd160;
extern crate wasm_bindgen;
#[macro_use]
extern crate arrayref;

use ripemd160::{Digest, Ripemd160};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn ripemd160(input: &[u8]) -> Vec<u8> {
    return Ripemd160::digest(input).to_vec();
}

#[test]
fn ripemd160_hash() {
    // 'abc' -> '8eb208f7e05d987a9b044a8e98c6b087f15a0bfc'
    let hash_abc = vec![
        142, 178, 8, 247, 224, 93, 152, 122, 155, 4, 74, 142, 152, 198, 176, 135, 241, 90, 11, 252,
    ];
    assert_eq!(ripemd160(b"abc"), hash_abc);
    // 'test' -> '5e52fee47e6b070565f74372468cdc699de89107'
    let hash_test = vec![
        94, 82, 254, 228, 126, 107, 7, 5, 101, 247, 67, 114, 70, 140, 220, 105, 157, 232, 145, 7,
    ];
    assert_eq!(ripemd160(b"test"), hash_test);
    // 'bitcoin-ts' -> '7217be7f5d75391d4d1be94bda6679d52d65d2c7'
    let hash_bitcoin_ts = vec![
        114, 23, 190, 127, 93, 117, 57, 29, 77, 27, 233, 75, 218, 102, 121, 213, 45, 101, 210, 199,
    ];
    assert_eq!(ripemd160(b"bitcoin-ts"), hash_bitcoin_ts);
}
