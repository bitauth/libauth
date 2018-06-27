#![feature(proc_macro, wasm_import_module, wasm_custom_section)]

extern crate sha1;
extern crate wasm_bindgen;
#[macro_use]
extern crate arrayref;

use sha1::{Digest, Sha1};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn sha1(input: &[u8]) -> Vec<u8> {
    return Sha1::digest(input).to_vec();
}

#[test]
fn sha1_hash() {
    let hash_abc = vec![
        169, 153, 62, 54, 71, 6, 129, 106, 186, 62, 37, 113, 120, 80, 194, 108, 156, 208, 216, 157,
    ];
    assert_eq!(sha1(b"abc"), hash_abc);
    let hash_test = vec![
        169, 74, 143, 229, 204, 177, 155, 166, 28, 76, 8, 115, 211, 145, 233, 135, 152, 47, 187,
        211,
    ];
    assert_eq!(sha1(b"test"), hash_test);
    let hash_bitcoin_ts = vec![
        172, 243, 119, 55, 165, 187, 137, 56, 129, 102, 231, 172, 37, 23, 43, 80, 241, 124, 241,
        186,
    ];
    assert_eq!(sha1(b"bitcoin-ts"), hash_bitcoin_ts);
}

const SHA1_SIZE: usize = std::mem::size_of::<Sha1>();

#[wasm_bindgen]
pub fn sha1_init() -> Vec<u8> {
    let hasher = Sha1::new();
    let raw_state: [u8; SHA1_SIZE] = unsafe { std::mem::transmute(hasher) };
    raw_state.to_vec()
}

#[wasm_bindgen]
pub fn sha1_update(raw_state: &mut [u8], input: &[u8]) -> Vec<u8> {
    let raw_state2 = array_mut_ref!(raw_state, 0, SHA1_SIZE);
    let mut hasher: Sha1 = unsafe { std::mem::transmute(*raw_state2) };
    hasher.input(input);
    let raw_state3: [u8; SHA1_SIZE] = unsafe { std::mem::transmute(hasher) };
    raw_state3.to_vec()
}

#[wasm_bindgen]
pub fn sha1_final(raw_state: &mut [u8]) -> Vec<u8> {
    let raw_state2 = array_mut_ref!(raw_state, 0, SHA1_SIZE);
    let hasher: Sha1 = unsafe { std::mem::transmute(*raw_state2) };
    hasher.result().to_vec()
}

#[test]
fn sha1_incremental_hash() {
    let hash_bitcoin_ts = vec![
        172, 243, 119, 55, 165, 187, 137, 56, 129, 102, 231, 172, 37, 23, 43, 80, 241, 124, 241,
        186,
    ];
    let mut state = sha1_init();
    let mut state = sha1_update(state.as_mut_slice(), b"bitcoin");
    let mut state = sha1_update(state.as_mut_slice(), b"-ts");
    assert_eq!(sha1_final(state.as_mut_slice()), hash_bitcoin_ts);
}
