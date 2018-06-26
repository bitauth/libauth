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
    let hash_abc = vec![
        142, 178, 8, 247, 224, 93, 152, 122, 155, 4, 74, 142, 152, 198, 176, 135, 241, 90, 11, 252,
    ];
    assert_eq!(ripemd160(b"abc"), hash_abc);
    let hash_test = vec![
        94, 82, 254, 228, 126, 107, 7, 5, 101, 247, 67, 114, 70, 140, 220, 105, 157, 232, 145, 7,
    ];
    assert_eq!(ripemd160(b"test"), hash_test);
    let hash_bitcoin_ts = vec![
        114, 23, 190, 127, 93, 117, 57, 29, 77, 27, 233, 75, 218, 102, 121, 213, 45, 101, 210, 199,
    ];
    assert_eq!(ripemd160(b"bitcoin-ts"), hash_bitcoin_ts);
}

const RIPEMD160_SIZE: usize = std::mem::size_of::<Ripemd160>();

#[wasm_bindgen]
pub fn ripemd160_init() -> Vec<u8> {
    let hasher = Ripemd160::new();
    let raw_state: [u8; RIPEMD160_SIZE] = unsafe { std::mem::transmute(hasher) };
    raw_state.to_vec()
}

#[wasm_bindgen]
pub fn ripemd160_update(raw_state: &mut [u8], input: &[u8]) -> Vec<u8> {
    let raw_state2 = array_mut_ref!(raw_state, 0, RIPEMD160_SIZE);
    let mut hasher: Ripemd160 = unsafe { std::mem::transmute(*raw_state2) };
    hasher.input(input);
    let raw_state3: [u8; RIPEMD160_SIZE] = unsafe { std::mem::transmute(hasher) };
    raw_state3.to_vec()
}

#[wasm_bindgen]
pub fn ripemd160_final(raw_state: &mut [u8]) -> Vec<u8> {
    let raw_state2 = array_mut_ref!(raw_state, 0, RIPEMD160_SIZE);
    let hasher: Ripemd160 = unsafe { std::mem::transmute(*raw_state2) };
    hasher.result().to_vec()
}

#[test]
fn ripemd160_() {
    let hash_bitcoin_ts = vec![
        114, 23, 190, 127, 93, 117, 57, 29, 77, 27, 233, 75, 218, 102, 121, 213, 45, 101, 210, 199,
    ];
    let mut state = ripemd160_init();
    let mut state = ripemd160_update(state.as_mut_slice(), b"bitcoin");
    let mut state = ripemd160_update(state.as_mut_slice(), b"-ts");
    assert_eq!(ripemd160_final(state.as_mut_slice()), hash_bitcoin_ts);
}
