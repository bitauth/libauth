#![feature(proc_macro, wasm_import_module, wasm_custom_section)]

extern crate sha2;
extern crate wasm_bindgen;
#[macro_use]
extern crate arrayref;

use sha2::{Digest, Sha512};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn sha512(input: &[u8]) -> Vec<u8> {
    return Sha512::digest(input).to_vec();
}

#[test]
fn sha512_hash() {
    let hash_abc = vec![
        221, 175, 53, 161, 147, 97, 122, 186, 204, 65, 115, 73, 174, 32, 65, 49, 18, 230, 250, 78,
        137, 169, 126, 162, 10, 158, 238, 230, 75, 85, 211, 154, 33, 146, 153, 42, 39, 79, 193,
        168, 54, 186, 60, 35, 163, 254, 235, 189, 69, 77, 68, 35, 100, 60, 232, 14, 42, 154, 201,
        79, 165, 76, 164, 159,
    ];
    assert_eq!(sha512(b"abc"), hash_abc);
    let hash_test = vec![
        238, 38, 176, 221, 74, 247, 231, 73, 170, 26, 142, 227, 193, 10, 233, 146, 63, 97, 137,
        128, 119, 46, 71, 63, 136, 25, 165, 212, 148, 14, 13, 178, 122, 193, 133, 248, 160, 225,
        213, 248, 79, 136, 188, 136, 127, 214, 123, 20, 55, 50, 195, 4, 204, 95, 169, 173, 142,
        111, 87, 245, 0, 40, 168, 255,
    ];
    assert_eq!(sha512(b"test"), hash_test);
    let hash_bitcoin_ts = vec![
        199, 3, 62, 254, 211, 112, 236, 45, 153, 174, 172, 201, 56, 4, 81, 75, 63, 108, 8, 154,
        220, 157, 74, 51, 3, 125, 152, 147, 138, 57, 239, 39, 144, 71, 255, 181, 173, 73, 150, 146,
        149, 26, 151, 201, 54, 28, 80, 219, 128, 183, 24, 114, 55, 231, 4, 126, 200, 17, 11, 95,
        50, 70, 85, 60,
    ];
    assert_eq!(sha512(b"bitcoin-ts"), hash_bitcoin_ts);
}

const SHA512_SIZE: usize = std::mem::size_of::<Sha512>();

#[wasm_bindgen]
pub fn sha512_init() -> Vec<u8> {
    let hasher = Sha512::new();
    let raw_state: [u8; SHA512_SIZE] = unsafe { std::mem::transmute(hasher) };
    raw_state.to_vec()
}

#[wasm_bindgen]
pub fn sha512_update(raw_state: &mut [u8], input: &[u8]) -> Vec<u8> {
    let raw_state2 = array_mut_ref!(raw_state, 0, SHA512_SIZE);
    let mut hasher: Sha512 = unsafe { std::mem::transmute(*raw_state2) };
    hasher.input(input);
    let raw_state3: [u8; SHA512_SIZE] = unsafe { std::mem::transmute(hasher) };
    raw_state3.to_vec()
}

#[wasm_bindgen]
pub fn sha512_final(raw_state: &mut [u8]) -> Vec<u8> {
    let raw_state2 = array_mut_ref!(raw_state, 0, SHA512_SIZE);
    let hasher: Sha512 = unsafe { std::mem::transmute(*raw_state2) };
    hasher.result().to_vec()
}

#[test]
fn sha512_incremental_hash() {
    let hash_bitcoin_ts = vec![
        199, 3, 62, 254, 211, 112, 236, 45, 153, 174, 172, 201, 56, 4, 81, 75, 63, 108, 8, 154,
        220, 157, 74, 51, 3, 125, 152, 147, 138, 57, 239, 39, 144, 71, 255, 181, 173, 73, 150, 146,
        149, 26, 151, 201, 54, 28, 80, 219, 128, 183, 24, 114, 55, 231, 4, 126, 200, 17, 11, 95,
        50, 70, 85, 60,
    ];
    let mut state = sha512_init();
    let mut state = sha512_update(state.as_mut_slice(), b"bitcoin");
    let mut state = sha512_update(state.as_mut_slice(), b"-ts");
    assert_eq!(sha512_final(state.as_mut_slice()), hash_bitcoin_ts);
}
