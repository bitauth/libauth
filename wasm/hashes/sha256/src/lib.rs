#![feature(proc_macro, wasm_import_module, wasm_custom_section)]

extern crate sha2;
extern crate wasm_bindgen;
#[macro_use]
extern crate arrayref;

use sha2::{Digest, Sha256};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn sha256(input: &[u8]) -> Vec<u8> {
    return Sha256::digest(input).to_vec();
}

#[test]
fn sha256_hash() {
    let hash_abc = vec![
        186, 120, 22, 191, 143, 1, 207, 234, 65, 65, 64, 222, 93, 174, 34, 35, 176, 3, 97, 163,
        150, 23, 122, 156, 180, 16, 255, 97, 242, 0, 21, 173,
    ];
    assert_eq!(sha256(b"abc"), hash_abc);
    let hash_test = vec![
        159, 134, 208, 129, 136, 76, 125, 101, 154, 47, 234, 160, 197, 90, 208, 21, 163, 191, 79,
        27, 43, 11, 130, 44, 209, 93, 108, 21, 176, 240, 10, 8,
    ];
    assert_eq!(sha256(b"test"), hash_test);
    let hash_bitcoin_ts = vec![
        197, 172, 209, 87, 32, 54, 111, 116, 79, 74, 33, 12, 216, 172, 180, 55, 181, 8, 52, 10, 69,
        75, 79, 77, 6, 145, 161, 201, 161, 182, 67, 158,
    ];
    assert_eq!(sha256(b"bitcoin-ts"), hash_bitcoin_ts);
}

const SHA256_SIZE: usize = std::mem::size_of::<Sha256>();

#[wasm_bindgen]
pub fn sha256_init() -> Vec<u8> {
    let hasher = Sha256::new();
    let raw_state: [u8; SHA256_SIZE] = unsafe { std::mem::transmute(hasher) };
    raw_state.to_vec()
}

#[wasm_bindgen]
pub fn sha256_update(raw_state: &mut [u8], input: &[u8]) -> Vec<u8> {
    let raw_state2 = array_mut_ref!(raw_state, 0, SHA256_SIZE);
    let mut hasher: Sha256 = unsafe { std::mem::transmute(*raw_state2) };
    hasher.input(input);
    let raw_state3: [u8; SHA256_SIZE] = unsafe { std::mem::transmute(hasher) };
    raw_state3.to_vec()
}

#[wasm_bindgen]
pub fn sha256_final(raw_state: &mut [u8]) -> Vec<u8> {
    let raw_state2 = array_mut_ref!(raw_state, 0, SHA256_SIZE);
    let hasher: Sha256 = unsafe { std::mem::transmute(*raw_state2) };
    hasher.result().to_vec()
}

#[test]
fn sha256_incremental_hash() {
    let hash_bitcoin_ts = vec![
        197, 172, 209, 87, 32, 54, 111, 116, 79, 74, 33, 12, 216, 172, 180, 55, 181, 8, 52, 10, 69,
        75, 79, 77, 6, 145, 161, 201, 161, 182, 67, 158,
    ];
    let mut state = sha256_init();
    let mut state = sha256_update(state.as_mut_slice(), b"bitcoin");
    let mut state = sha256_update(state.as_mut_slice(), b"-ts");
    assert_eq!(sha256_final(state.as_mut_slice()), hash_bitcoin_ts);
}
