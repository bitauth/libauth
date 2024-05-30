import test from 'ava';

import {
  createCompilationContextCommonTesting,
  createCompilerBch,
  hexToBin,
  stringifyTestVector,
} from '../../lib.js';

// prettier-ignore
const privkey = new Uint8Array([0xf8, 0x5d, 0x4b, 0xd8, 0xa0, 0x3c, 0xa1, 0x06, 0xc9, 0xde, 0xb4, 0x7b, 0x79, 0x18, 0x03, 0xda, 0xc7, 0xf0, 0x33, 0x38, 0x09, 0xe3, 0xf1, 0xdd, 0x04, 0xd1, 0x82, 0xe0, 0xab, 0xa6, 0xe5, 0x53]);

test('[BCH compiler] createCompilerBch: generateBytecode', (t) => {
  const compiler = createCompilerBch({
    scripts: {
      lock: 'OP_DUP OP_HASH160 <$(<a.public_key> OP_HASH160)> OP_EQUALVERIFY OP_CHECKSIG',
      unlock: '<a.schnorr_signature.all_outputs> <a.public_key>',
    },
    unlockingScripts: {
      unlock: 'lock',
    },
    variables: {
      a: {
        type: 'Key',
      },
    },
  });
  const resultLock = compiler.generateBytecode({
    data: {
      keys: { privateKeys: { a: privkey } },
    },
    scriptId: 'lock',
  });
  t.deepEqual(
    resultLock,
    {
      bytecode: hexToBin('76a91415d16c84669ab46059313bf0747e781f1d13936d88ac'),
      success: true,
    },
    stringifyTestVector(resultLock),
  );

  const resultUnlock = compiler.generateBytecode({
    data: {
      compilationContext: createCompilationContextCommonTesting(),
      keys: { privateKeys: { a: privkey } },
    },
    scriptId: 'unlock',
  });
  t.deepEqual(
    resultUnlock,
    {
      bytecode: hexToBin(
        '412000c439d7eb94cb7b501560a2e96fe9eb7d9a4083f0ab84408fb0fab97e51f6ed4d8a4d7aae3bc805afe3aa8b75f6bf74fa102529349c9d0d112d2c34ec9b2b41210376ea9e36a75d2ecf9c93a0be76885e36f822529db22acfdc761c9b5b4544f5c5',
      ),
      success: true,
    },
    stringifyTestVector(resultUnlock),
  );
});

test('[BCH compiler] createCompilerBch: debug', (t) => {
  const compiler = createCompilerBch({
    scripts: {
      lock: 'OP_DUP OP_HASH160 <$(<a.public_key> OP_HASH160)> OP_EQUALVERIFY OP_CHECKSIG',
      unlock: '<a.ecdsa_signature.all_outputs> <a.public_key>',
    },
    unlockingScripts: {
      unlock: 'lock',
    },
    variables: {
      a: {
        type: 'Key',
      },
    },
  });
  const resultLock = compiler.generateBytecode({
    data: {
      keys: { privateKeys: { a: privkey } },
    },
    debug: true,
    scriptId: 'lock',
  });
  t.deepEqual(
    resultLock,
    {
      bytecode: hexToBin('76a91415d16c84669ab46059313bf0747e781f1d13936d88ac'),
      parse: {
        end: {
          column: 76,
          line: 1,
          offset: 75,
        },
        name: 'Script',
        start: {
          column: 1,
          line: 1,
          offset: 0,
        },
        value: [
          {
            end: {
              column: 7,
              line: 1,
              offset: 6,
            },
            name: 'Identifier',
            start: {
              column: 1,
              line: 1,
              offset: 0,
            },
            value: 'OP_DUP',
          },
          {
            end: {
              column: 18,
              line: 1,
              offset: 17,
            },
            name: 'Identifier',
            start: {
              column: 8,
              line: 1,
              offset: 7,
            },
            value: 'OP_HASH160',
          },
          {
            end: {
              column: 49,
              line: 1,
              offset: 48,
            },
            name: 'Push',
            start: {
              column: 19,
              line: 1,
              offset: 18,
            },
            value: {
              end: {
                column: 48,
                line: 1,
                offset: 47,
              },
              name: 'Script',
              start: {
                column: 20,
                line: 1,
                offset: 19,
              },
              value: [
                {
                  end: {
                    column: 48,
                    line: 1,
                    offset: 47,
                  },
                  name: 'Evaluation',
                  start: {
                    column: 20,
                    line: 1,
                    offset: 19,
                  },
                  value: {
                    end: {
                      column: 47,
                      line: 1,
                      offset: 46,
                    },
                    name: 'Script',
                    start: {
                      column: 22,
                      line: 1,
                      offset: 21,
                    },
                    value: [
                      {
                        end: {
                          column: 36,
                          line: 1,
                          offset: 35,
                        },
                        name: 'Push',
                        start: {
                          column: 22,
                          line: 1,
                          offset: 21,
                        },
                        value: {
                          end: {
                            column: 35,
                            line: 1,
                            offset: 34,
                          },
                          name: 'Script',
                          start: {
                            column: 23,
                            line: 1,
                            offset: 22,
                          },
                          value: [
                            {
                              end: {
                                column: 35,
                                line: 1,
                                offset: 34,
                              },
                              name: 'Identifier',
                              start: {
                                column: 23,
                                line: 1,
                                offset: 22,
                              },
                              value: 'a.public_key',
                            },
                          ],
                        },
                      },
                      {
                        end: {
                          column: 47,
                          line: 1,
                          offset: 46,
                        },
                        name: 'Identifier',
                        start: {
                          column: 37,
                          line: 1,
                          offset: 36,
                        },
                        value: 'OP_HASH160',
                      },
                    ],
                  },
                },
              ],
            },
          },
          {
            end: {
              column: 64,
              line: 1,
              offset: 63,
            },
            name: 'Identifier',
            start: {
              column: 50,
              line: 1,
              offset: 49,
            },
            value: 'OP_EQUALVERIFY',
          },
          {
            end: {
              column: 76,
              line: 1,
              offset: 75,
            },
            name: 'Identifier',
            start: {
              column: 65,
              line: 1,
              offset: 64,
            },
            value: 'OP_CHECKSIG',
          },
        ],
      },
      reduce: {
        bytecode: hexToBin(
          '76a91415d16c84669ab46059313bf0747e781f1d13936d88ac',
        ),
        range: {
          endColumn: 76,
          endLineNumber: 1,
          startColumn: 1,
          startLineNumber: 1,
        },
        script: [
          {
            bytecode: hexToBin('76'),
            range: {
              endColumn: 7,
              endLineNumber: 1,
              startColumn: 1,
              startLineNumber: 1,
            },
          },
          {
            bytecode: hexToBin('a9'),
            range: {
              endColumn: 18,
              endLineNumber: 1,
              startColumn: 8,
              startLineNumber: 1,
            },
          },
          {
            bytecode: hexToBin('1415d16c84669ab46059313bf0747e781f1d13936d'),
            push: {
              bytecode: hexToBin('15d16c84669ab46059313bf0747e781f1d13936d'),
              range: {
                endColumn: 48,
                endLineNumber: 1,
                startColumn: 20,
                startLineNumber: 1,
              },
              script: [
                {
                  bytecode: hexToBin(
                    '15d16c84669ab46059313bf0747e781f1d13936d',
                  ),
                  range: {
                    endColumn: 48,
                    endLineNumber: 1,
                    startColumn: 20,
                    startLineNumber: 1,
                  },
                  source: {
                    bytecode: hexToBin(
                      '210376ea9e36a75d2ecf9c93a0be76885e36f822529db22acfdc761c9b5b4544f5c5a9',
                    ),
                    range: {
                      endColumn: 47,
                      endLineNumber: 1,
                      startColumn: 22,
                      startLineNumber: 1,
                    },
                    script: [
                      {
                        bytecode: hexToBin(
                          '210376ea9e36a75d2ecf9c93a0be76885e36f822529db22acfdc761c9b5b4544f5c5',
                        ),
                        push: {
                          bytecode: hexToBin(
                            '0376ea9e36a75d2ecf9c93a0be76885e36f822529db22acfdc761c9b5b4544f5c5',
                          ),
                          range: {
                            endColumn: 35,
                            endLineNumber: 1,
                            startColumn: 23,
                            startLineNumber: 1,
                          },
                          script: [
                            {
                              bytecode: hexToBin(
                                '0376ea9e36a75d2ecf9c93a0be76885e36f822529db22acfdc761c9b5b4544f5c5',
                              ),
                              range: {
                                endColumn: 35,
                                endLineNumber: 1,
                                startColumn: 23,
                                startLineNumber: 1,
                              },
                            },
                          ],
                        },
                        range: {
                          endColumn: 36,
                          endLineNumber: 1,
                          startColumn: 22,
                          startLineNumber: 1,
                        },
                      },
                      {
                        bytecode: hexToBin('a9'),
                        range: {
                          endColumn: 47,
                          endLineNumber: 1,
                          startColumn: 37,
                          startLineNumber: 1,
                        },
                      },
                    ],
                  },
                  trace: [
                    {
                      alternateStack: [],
                      controlStack: [],
                      instructions: [],
                      ip: 0,
                      lastCodeSeparator: -1,
                      metrics: {
                        executedInstructionCount: 0,
                        signatureCheckCount: 0,
                      },
                      operationCount: 0,
                      program: {
                        inputIndex: 0,
                        sourceOutputs: [
                          {
                            lockingBytecode: hexToBin(
                              '210376ea9e36a75d2ecf9c93a0be76885e36f822529db22acfdc761c9b5b4544f5c5a9',
                            ),
                            valueSatoshis: 0n,
                          },
                        ],
                        transaction: {
                          inputs: [
                            {
                              outpointIndex: 0,
                              outpointTransactionHash: hexToBin(
                                '0000000000000000000000000000000000000000000000000000000000000000',
                              ),
                              sequenceNumber: 0,
                              unlockingBytecode: hexToBin(''),
                            },
                          ],
                          locktime: 0,
                          outputs: [
                            {
                              lockingBytecode: hexToBin(''),
                              valueSatoshis: 0n,
                            },
                          ],
                          version: 0,
                        },
                      },
                      signedMessages: [],
                      stack: [],
                      transactionLengthBytes: 60,
                    },
                    {
                      alternateStack: [],
                      controlStack: [],
                      instructions: [
                        {
                          data: hexToBin(
                            '0376ea9e36a75d2ecf9c93a0be76885e36f822529db22acfdc761c9b5b4544f5c5',
                          ),
                          opcode: 33,
                        },
                        {
                          opcode: 169,
                        },
                      ],
                      ip: 0,
                      lastCodeSeparator: -1,
                      metrics: {
                        executedInstructionCount: 0,
                        signatureCheckCount: 0,
                      },
                      operationCount: 0,
                      program: {
                        inputIndex: 0,
                        sourceOutputs: [
                          {
                            lockingBytecode: hexToBin(
                              '210376ea9e36a75d2ecf9c93a0be76885e36f822529db22acfdc761c9b5b4544f5c5a9',
                            ),
                            valueSatoshis: 0n,
                          },
                        ],
                        transaction: {
                          inputs: [
                            {
                              outpointIndex: 0,
                              outpointTransactionHash: hexToBin(
                                '0000000000000000000000000000000000000000000000000000000000000000',
                              ),
                              sequenceNumber: 0,
                              unlockingBytecode: hexToBin(''),
                            },
                          ],
                          locktime: 0,
                          outputs: [
                            {
                              lockingBytecode: hexToBin(''),
                              valueSatoshis: 0n,
                            },
                          ],
                          version: 0,
                        },
                      },
                      signedMessages: [],
                      stack: [],
                      transactionLengthBytes: 60,
                    },
                    {
                      alternateStack: [],
                      controlStack: [],
                      instructions: [
                        {
                          data: hexToBin(
                            '0376ea9e36a75d2ecf9c93a0be76885e36f822529db22acfdc761c9b5b4544f5c5',
                          ),
                          opcode: 33,
                        },
                        {
                          opcode: 169,
                        },
                      ],
                      ip: 1,
                      lastCodeSeparator: -1,
                      metrics: {
                        executedInstructionCount: 1,
                        signatureCheckCount: 0,
                      },
                      operationCount: 0,
                      program: {
                        inputIndex: 0,
                        sourceOutputs: [
                          {
                            lockingBytecode: hexToBin(
                              '210376ea9e36a75d2ecf9c93a0be76885e36f822529db22acfdc761c9b5b4544f5c5a9',
                            ),
                            valueSatoshis: 0n,
                          },
                        ],
                        transaction: {
                          inputs: [
                            {
                              outpointIndex: 0,
                              outpointTransactionHash: hexToBin(
                                '0000000000000000000000000000000000000000000000000000000000000000',
                              ),
                              sequenceNumber: 0,
                              unlockingBytecode: hexToBin(''),
                            },
                          ],
                          locktime: 0,
                          outputs: [
                            {
                              lockingBytecode: hexToBin(''),
                              valueSatoshis: 0n,
                            },
                          ],
                          version: 0,
                        },
                      },
                      signedMessages: [],
                      stack: [
                        hexToBin(
                          '0376ea9e36a75d2ecf9c93a0be76885e36f822529db22acfdc761c9b5b4544f5c5',
                        ),
                      ],
                      transactionLengthBytes: 60,
                    },
                    {
                      alternateStack: [],
                      controlStack: [],
                      instructions: [
                        {
                          data: hexToBin(
                            '0376ea9e36a75d2ecf9c93a0be76885e36f822529db22acfdc761c9b5b4544f5c5',
                          ),
                          opcode: 33,
                        },
                        {
                          opcode: 169,
                        },
                      ],
                      ip: 2,
                      lastCodeSeparator: -1,
                      metrics: {
                        executedInstructionCount: 2,
                        signatureCheckCount: 0,
                      },
                      operationCount: 1,
                      program: {
                        inputIndex: 0,
                        sourceOutputs: [
                          {
                            lockingBytecode: hexToBin(
                              '210376ea9e36a75d2ecf9c93a0be76885e36f822529db22acfdc761c9b5b4544f5c5a9',
                            ),
                            valueSatoshis: 0n,
                          },
                        ],
                        transaction: {
                          inputs: [
                            {
                              outpointIndex: 0,
                              outpointTransactionHash: hexToBin(
                                '0000000000000000000000000000000000000000000000000000000000000000',
                              ),
                              sequenceNumber: 0,
                              unlockingBytecode: hexToBin(''),
                            },
                          ],
                          locktime: 0,
                          outputs: [
                            {
                              lockingBytecode: hexToBin(''),
                              valueSatoshis: 0n,
                            },
                          ],
                          version: 0,
                        },
                      },
                      signedMessages: [],
                      stack: [
                        hexToBin('15d16c84669ab46059313bf0747e781f1d13936d'),
                      ],
                      transactionLengthBytes: 60,
                    },
                    {
                      alternateStack: [],
                      controlStack: [],
                      instructions: [
                        {
                          data: hexToBin(
                            '0376ea9e36a75d2ecf9c93a0be76885e36f822529db22acfdc761c9b5b4544f5c5',
                          ),
                          opcode: 33,
                        },
                        {
                          opcode: 169,
                        },
                      ],
                      ip: 2,
                      lastCodeSeparator: -1,
                      metrics: {
                        executedInstructionCount: 2,
                        signatureCheckCount: 0,
                      },
                      operationCount: 1,
                      program: {
                        inputIndex: 0,
                        sourceOutputs: [
                          {
                            lockingBytecode: hexToBin(
                              '210376ea9e36a75d2ecf9c93a0be76885e36f822529db22acfdc761c9b5b4544f5c5a9',
                            ),
                            valueSatoshis: 0n,
                          },
                        ],
                        transaction: {
                          inputs: [
                            {
                              outpointIndex: 0,
                              outpointTransactionHash: hexToBin(
                                '0000000000000000000000000000000000000000000000000000000000000000',
                              ),
                              sequenceNumber: 0,
                              unlockingBytecode: hexToBin(''),
                            },
                          ],
                          locktime: 0,
                          outputs: [
                            {
                              lockingBytecode: hexToBin(''),
                              valueSatoshis: 0n,
                            },
                          ],
                          version: 0,
                        },
                      },
                      signedMessages: [],
                      stack: [
                        hexToBin('15d16c84669ab46059313bf0747e781f1d13936d'),
                      ],
                      transactionLengthBytes: 60,
                    },
                  ],
                },
              ],
            },
            range: {
              endColumn: 49,
              endLineNumber: 1,
              startColumn: 19,
              startLineNumber: 1,
            },
          },
          {
            bytecode: hexToBin('88'),
            range: {
              endColumn: 64,
              endLineNumber: 1,
              startColumn: 50,
              startLineNumber: 1,
            },
          },
          {
            bytecode: hexToBin('ac'),
            range: {
              endColumn: 76,
              endLineNumber: 1,
              startColumn: 65,
              startLineNumber: 1,
            },
          },
        ],
      },
      resolve: [
        {
          opcode: 'OP_DUP',
          range: {
            endColumn: 7,
            endLineNumber: 1,
            startColumn: 1,
            startLineNumber: 1,
          },
          type: 'bytecode',
          value: hexToBin('76'),
        },
        {
          opcode: 'OP_HASH160',
          range: {
            endColumn: 18,
            endLineNumber: 1,
            startColumn: 8,
            startLineNumber: 1,
          },
          type: 'bytecode',
          value: hexToBin('a9'),
        },
        {
          range: {
            endColumn: 49,
            endLineNumber: 1,
            startColumn: 19,
            startLineNumber: 1,
          },
          type: 'push',
          value: [
            {
              range: {
                endColumn: 48,
                endLineNumber: 1,
                startColumn: 20,
                startLineNumber: 1,
              },
              type: 'evaluation',
              value: [
                {
                  range: {
                    endColumn: 36,
                    endLineNumber: 1,
                    startColumn: 22,
                    startLineNumber: 1,
                  },
                  type: 'push',
                  value: [
                    {
                      range: {
                        endColumn: 35,
                        endLineNumber: 1,
                        startColumn: 23,
                        startLineNumber: 1,
                      },
                      type: 'bytecode',
                      value: hexToBin(
                        '0376ea9e36a75d2ecf9c93a0be76885e36f822529db22acfdc761c9b5b4544f5c5',
                      ),
                      variable: 'a.public_key',
                    },
                  ],
                },
                {
                  opcode: 'OP_HASH160',
                  range: {
                    endColumn: 47,
                    endLineNumber: 1,
                    startColumn: 37,
                    startLineNumber: 1,
                  },
                  type: 'bytecode',
                  value: hexToBin('a9'),
                },
              ],
            },
          ],
        },
        {
          opcode: 'OP_EQUALVERIFY',
          range: {
            endColumn: 64,
            endLineNumber: 1,
            startColumn: 50,
            startLineNumber: 1,
          },
          type: 'bytecode',
          value: hexToBin('88'),
        },
        {
          opcode: 'OP_CHECKSIG',
          range: {
            endColumn: 76,
            endLineNumber: 1,
            startColumn: 65,
            startLineNumber: 1,
          },
          type: 'bytecode',
          value: hexToBin('ac'),
        },
      ],
      success: true,
    },
    stringifyTestVector(resultLock),
  );

  const resultUnlock = compiler.generateBytecode({
    data: {
      compilationContext: createCompilationContextCommonTesting(),
      keys: { privateKeys: { a: privkey } },
    },
    debug: true,
    scriptId: 'unlock',
  });
  t.deepEqual(
    resultUnlock,
    {
      bytecode: hexToBin(
        '483045022100f129fea5cb875fe5f35e3b2cf919aaf2211340cb49de5253db1d0726cf5f3b7c0220747c59400a81473510883199f59a3f957adf0418dff9d1549ed985bf0b66c4af41210376ea9e36a75d2ecf9c93a0be76885e36f822529db22acfdc761c9b5b4544f5c5',
      ),
      parse: {
        end: { column: 47, line: 1, offset: 46 },
        name: 'Script',
        start: { column: 1, line: 1, offset: 0 },
        value: [
          {
            end: { column: 32, line: 1, offset: 31 },
            name: 'Push',
            start: { column: 1, line: 1, offset: 0 },
            value: {
              end: { column: 31, line: 1, offset: 30 },
              name: 'Script',
              start: { column: 2, line: 1, offset: 1 },
              value: [
                {
                  end: { column: 31, line: 1, offset: 30 },
                  name: 'Identifier',
                  start: { column: 2, line: 1, offset: 1 },
                  value: 'a.ecdsa_signature.all_outputs',
                },
              ],
            },
          },
          {
            end: { column: 47, line: 1, offset: 46 },
            name: 'Push',
            start: { column: 33, line: 1, offset: 32 },
            value: {
              end: { column: 46, line: 1, offset: 45 },
              name: 'Script',
              start: { column: 34, line: 1, offset: 33 },
              value: [
                {
                  end: { column: 46, line: 1, offset: 45 },
                  name: 'Identifier',
                  start: { column: 34, line: 1, offset: 33 },
                  value: 'a.public_key',
                },
              ],
            },
          },
        ],
      },
      reduce: {
        bytecode: hexToBin(
          '483045022100f129fea5cb875fe5f35e3b2cf919aaf2211340cb49de5253db1d0726cf5f3b7c0220747c59400a81473510883199f59a3f957adf0418dff9d1549ed985bf0b66c4af41210376ea9e36a75d2ecf9c93a0be76885e36f822529db22acfdc761c9b5b4544f5c5',
        ),
        range: {
          endColumn: 47,
          endLineNumber: 1,
          startColumn: 1,
          startLineNumber: 1,
        },
        script: [
          {
            bytecode: hexToBin(
              '483045022100f129fea5cb875fe5f35e3b2cf919aaf2211340cb49de5253db1d0726cf5f3b7c0220747c59400a81473510883199f59a3f957adf0418dff9d1549ed985bf0b66c4af41',
            ),
            push: {
              bytecode: hexToBin(
                '3045022100f129fea5cb875fe5f35e3b2cf919aaf2211340cb49de5253db1d0726cf5f3b7c0220747c59400a81473510883199f59a3f957adf0418dff9d1549ed985bf0b66c4af41',
              ),
              range: {
                endColumn: 31,
                endLineNumber: 1,
                startColumn: 2,
                startLineNumber: 1,
              },
              script: [
                {
                  bytecode: hexToBin(
                    '3045022100f129fea5cb875fe5f35e3b2cf919aaf2211340cb49de5253db1d0726cf5f3b7c0220747c59400a81473510883199f59a3f957adf0418dff9d1549ed985bf0b66c4af41',
                  ),
                  range: {
                    endColumn: 31,
                    endLineNumber: 1,
                    startColumn: 2,
                    startLineNumber: 1,
                  },
                },
              ],
            },
            range: {
              endColumn: 32,
              endLineNumber: 1,
              startColumn: 1,
              startLineNumber: 1,
            },
          },
          {
            bytecode: hexToBin(
              '210376ea9e36a75d2ecf9c93a0be76885e36f822529db22acfdc761c9b5b4544f5c5',
            ),
            push: {
              bytecode: hexToBin(
                '0376ea9e36a75d2ecf9c93a0be76885e36f822529db22acfdc761c9b5b4544f5c5',
              ),
              range: {
                endColumn: 46,
                endLineNumber: 1,
                startColumn: 34,
                startLineNumber: 1,
              },
              script: [
                {
                  bytecode: hexToBin(
                    '0376ea9e36a75d2ecf9c93a0be76885e36f822529db22acfdc761c9b5b4544f5c5',
                  ),
                  range: {
                    endColumn: 46,
                    endLineNumber: 1,
                    startColumn: 34,
                    startLineNumber: 1,
                  },
                },
              ],
            },
            range: {
              endColumn: 47,
              endLineNumber: 1,
              startColumn: 33,
              startLineNumber: 1,
            },
          },
        ],
      },
      resolve: [
        {
          range: {
            endColumn: 32,
            endLineNumber: 1,
            startColumn: 1,
            startLineNumber: 1,
          },
          type: 'push',
          value: [
            {
              range: {
                endColumn: 31,
                endLineNumber: 1,
                startColumn: 2,
                startLineNumber: 1,
              },
              signature: {
                serialization: hexToBin(
                  '000000002d6c6135bed260db00d1b9ad203fbd17ee6c8b009850fc407bfec29fc45e3d4d8cb9012517c817fead650287d61bdd9c68803b6bf9c64133dcab3e65b5a50cb90101010101010101010101010101010101010101010101010101010101010101000000001976a91415d16c84669ab46059313bf0747e781f1d13936d88acffffffffffffffff00000000dd2aed19e2aa2ddc93b21ca9e9bb5e89016be12113ea1746ebb4e1d0417eca550000000041000000',
                ),
              },
              type: 'bytecode',
              value: hexToBin(
                '3045022100f129fea5cb875fe5f35e3b2cf919aaf2211340cb49de5253db1d0726cf5f3b7c0220747c59400a81473510883199f59a3f957adf0418dff9d1549ed985bf0b66c4af41',
              ),
              variable: 'a.ecdsa_signature.all_outputs',
            },
          ],
        },
        {
          range: {
            endColumn: 47,
            endLineNumber: 1,
            startColumn: 33,
            startLineNumber: 1,
          },
          type: 'push',
          value: [
            {
              range: {
                endColumn: 46,
                endLineNumber: 1,
                startColumn: 34,
                startLineNumber: 1,
              },
              type: 'bytecode',
              value: hexToBin(
                '0376ea9e36a75d2ecf9c93a0be76885e36f822529db22acfdc761c9b5b4544f5c5',
              ),
              variable: 'a.public_key',
            },
          ],
        },
      ],
      success: true,
    },
    stringifyTestVector(resultUnlock),
  );
});
