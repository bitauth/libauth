// tslint:disable:no-expression-statement no-magic-numbers
import test from 'ava';

import { hexToBin } from '../../../utils/utils';
import {
  AuthenticationInstruction,
  createAuthenticationProgramExternalStateCommonEmpty,
  createAuthenticationProgramStateCommon
} from '../../auth';

import { createCompilerBCH } from './compiler';

// prettier-ignore
const privkey = new Uint8Array([0xf8, 0x5d, 0x4b, 0xd8, 0xa0, 0x3c, 0xa1, 0x06, 0xc9, 0xde, 0xb4, 0x7b, 0x79, 0x18, 0x03, 0xda, 0xc7, 0xf0, 0x33, 0x38, 0x09, 0xe3, 0xf1, 0xdd, 0x04, 0xd1, 0x82, 0xe0, 0xab, 0xa6, 0xe5, 0x53]);

test('createCompilerBCH: generate', async t => {
  const compiler = await createCompilerBCH({
    scripts: {
      lock:
        'OP_DUP OP_HASH160 <$(<a.public_key> OP_HASH160)> OP_EQUALVERIFY OP_CHECKSIG',
      unlock: '<a.signature.all_outputs> <a.public_key>'
    },
    variables: {
      a: {
        type: 'Key'
      }
    }
  });
  const resultLock = compiler.generate('lock', {
    keys: { privateKeys: { a: privkey } }
  });
  t.deepEqual(resultLock, {
    bytecode: hexToBin('76a91415d16c84669ab46059313bf0747e781f1d13936d88ac'),
    success: true
  });
  // tslint:disable-next-line: no-if-statement
  if (resultLock.success) {
    const resultUnlock = compiler.generate('unlock', {
      keys: { privateKeys: { a: privkey } },
      operationData: {
        ...createAuthenticationProgramExternalStateCommonEmpty(),
        coveredBytecode: resultLock.bytecode
      }
    });
    t.deepEqual(resultUnlock, {
      bytecode: hexToBin(
        '47304402206aa4183e0d831a01d2d22174cd4434c5dcb4d58d1c079e2f36ed0f09c6265eba022075024ac787395a32f1886d92a033319a15813c4eb93c2e38a60884760c5dad4741210376ea9e36a75d2ecf9c93a0be76885e36f822529db22acfdc761c9b5b4544f5c5'
      ),
      success: true
    });
  }
});

test('createCompilerBCH: debug', async t => {
  const state = createAuthenticationProgramExternalStateCommonEmpty();
  const createState = (
    // tslint:disable-next-line: no-any
    instructions: Array<AuthenticationInstruction<any>>
  ) => createAuthenticationProgramStateCommon(instructions, [], state);
  const compiler = await createCompilerBCH({
    createState,
    scripts: {
      lock:
        'OP_DUP OP_HASH160 <$(<a.public_key> OP_HASH160)> OP_EQUALVERIFY OP_CHECKSIG',
      unlock: '<a.signature.all_outputs> <a.public_key>'
    },
    variables: {
      a: {
        type: 'Key'
      }
    }
  });
  const resultLock = compiler.debug('lock', {
    keys: { privateKeys: { a: privkey } }
  });
  t.deepEqual(resultLock, {
    bytecode: hexToBin('76a91415d16c84669ab46059313bf0747e781f1d13936d88ac'),
    parse: {
      end: {
        column: 76,
        line: 1,
        offset: 75
      },
      name: 'Script',
      start: {
        column: 1,
        line: 1,
        offset: 0
      },
      value: [
        {
          end: {
            column: 7,
            line: 1,
            offset: 6
          },
          name: 'Identifier',
          start: {
            column: 1,
            line: 1,
            offset: 0
          },
          value: 'OP_DUP'
        },
        {
          end: {
            column: 18,
            line: 1,
            offset: 17
          },
          name: 'Identifier',
          start: {
            column: 8,
            line: 1,
            offset: 7
          },
          value: 'OP_HASH160'
        },
        {
          end: {
            column: 49,
            line: 1,
            offset: 48
          },
          name: 'Push',
          start: {
            column: 19,
            line: 1,
            offset: 18
          },

          value: {
            end: {
              column: 48,
              line: 1,
              offset: 47
            },
            name: 'Script',
            start: {
              column: 20,
              line: 1,
              offset: 19
            },
            value: [
              {
                end: {
                  column: 48,
                  line: 1,
                  offset: 47
                },
                name: 'Evaluation',
                start: {
                  column: 20,
                  line: 1,
                  offset: 19
                },
                value: {
                  end: {
                    column: 47,
                    line: 1,
                    offset: 46
                  },
                  name: 'Script',
                  start: {
                    column: 22,
                    line: 1,
                    offset: 21
                  },
                  value: [
                    {
                      end: {
                        column: 36,
                        line: 1,
                        offset: 35
                      },
                      name: 'Push',
                      start: {
                        column: 22,
                        line: 1,
                        offset: 21
                      },
                      value: {
                        end: {
                          column: 35,
                          line: 1,
                          offset: 34
                        },
                        name: 'Script',
                        start: {
                          column: 23,
                          line: 1,
                          offset: 22
                        },
                        value: [
                          {
                            end: {
                              column: 35,
                              line: 1,
                              offset: 34
                            },
                            name: 'Identifier',
                            start: {
                              column: 23,
                              line: 1,
                              offset: 22
                            },
                            value: 'a.public_key'
                          }
                        ]
                      }
                    },
                    {
                      end: {
                        column: 47,
                        line: 1,
                        offset: 46
                      },
                      name: 'Identifier',
                      start: {
                        column: 37,
                        line: 1,
                        offset: 36
                      },
                      value: 'OP_HASH160'
                    }
                  ]
                }
              }
            ]
          }
        },
        {
          end: {
            column: 64,
            line: 1,
            offset: 63
          },
          name: 'Identifier',
          start: {
            column: 50,
            line: 1,
            offset: 49
          },
          value: 'OP_EQUALVERIFY'
        },
        {
          end: {
            column: 76,
            line: 1,
            offset: 75
          },
          name: 'Identifier',
          start: {
            column: 65,
            line: 1,
            offset: 64
          },
          value: 'OP_CHECKSIG'
        }
      ]
    },
    reduce: {
      bytecode: hexToBin('76a91415d16c84669ab46059313bf0747e781f1d13936d88ac'),
      range: {
        endColumn: 76,
        endLineNumber: 1,
        startColumn: 1,
        startLineNumber: 1
      },
      source: [
        {
          bytecode: Uint8Array.of(0x76),
          range: {
            endColumn: 7,
            endLineNumber: 1,
            startColumn: 1,
            startLineNumber: 1
          }
        },
        {
          bytecode: Uint8Array.of(0xa9),
          range: {
            endColumn: 18,
            endLineNumber: 1,
            startColumn: 8,
            startLineNumber: 1
          }
        },
        {
          bytecode: hexToBin('1415d16c84669ab46059313bf0747e781f1d13936d'),
          range: {
            endColumn: 49,
            endLineNumber: 1,
            startColumn: 19,
            startLineNumber: 1
          },
          source: [
            {
              bytecode: hexToBin('15d16c84669ab46059313bf0747e781f1d13936d'),
              range: {
                endColumn: 48,
                endLineNumber: 1,
                startColumn: 20,
                startLineNumber: 1
              },
              source: [
                {
                  bytecode: hexToBin(
                    '15d16c84669ab46059313bf0747e781f1d13936d'
                  ),
                  range: {
                    endColumn: 48,
                    endLineNumber: 1,
                    startColumn: 20,
                    startLineNumber: 1
                  },
                  samples: [
                    {
                      range: {
                        endColumn: 36,
                        endLineNumber: 1,
                        startColumn: 22,
                        startLineNumber: 1
                      },
                      state: {
                        alternateStack: [],
                        executionStack: [],
                        hashCorrespondingOutput: state.hashCorrespondingOutput,
                        hashTransactionOutpoints:
                          state.hashTransactionOutpoints,
                        hashTransactionOutputs: state.hashTransactionOutputs,
                        hashTransactionSequenceNumbers:
                          state.hashTransactionSequenceNumbers,
                        instructions: [
                          {
                            data: hexToBin(
                              '0376ea9e36a75d2ecf9c93a0be76885e36f822529db22acfdc761c9b5b4544f5c5'
                            ),
                            opcode: 33
                          },
                          {
                            opcode: 169
                          }
                        ],
                        ip: 1,
                        lastCodeSeparator: -1,
                        locktime: 0,
                        operationCount: 0,
                        outpointIndex: 0,
                        outpointTransactionHash: hexToBin(
                          '0505050505050505050505050505050505050505050505050505050505050505'
                        ),
                        outputValue: BigInt(0),
                        sequenceNumber: 0,
                        signatureOperationsCount: 0,
                        stack: [
                          hexToBin(
                            '0376ea9e36a75d2ecf9c93a0be76885e36f822529db22acfdc761c9b5b4544f5c5'
                          )
                        ],
                        version: 0
                      }
                    },
                    {
                      range: {
                        endColumn: 47,
                        endLineNumber: 1,
                        startColumn: 37,
                        startLineNumber: 1
                      },
                      state: {
                        alternateStack: [],
                        executionStack: [],
                        hashCorrespondingOutput: state.hashCorrespondingOutput,
                        hashTransactionOutpoints:
                          state.hashTransactionOutpoints,
                        hashTransactionOutputs: state.hashTransactionOutputs,
                        hashTransactionSequenceNumbers:
                          state.hashTransactionSequenceNumbers,
                        instructions: [
                          {
                            data: hexToBin(
                              '0376ea9e36a75d2ecf9c93a0be76885e36f822529db22acfdc761c9b5b4544f5c5'
                            ),
                            opcode: 33
                          },
                          {
                            opcode: 169
                          }
                        ],
                        ip: 2,
                        lastCodeSeparator: -1,
                        locktime: 0,
                        operationCount: 1,
                        outpointIndex: 0,
                        outpointTransactionHash: hexToBin(
                          '0505050505050505050505050505050505050505050505050505050505050505'
                        ),
                        outputValue: BigInt(0),
                        sequenceNumber: 0,
                        signatureOperationsCount: 0,
                        stack: [
                          hexToBin('15d16c84669ab46059313bf0747e781f1d13936d')
                        ],

                        version: 0
                      }
                    }
                  ],
                  source: [
                    {
                      bytecode: hexToBin(
                        '210376ea9e36a75d2ecf9c93a0be76885e36f822529db22acfdc761c9b5b4544f5c5a9'
                      ),
                      range: {
                        endColumn: 47,
                        endLineNumber: 1,
                        startColumn: 22,
                        startLineNumber: 1
                      },
                      source: [
                        {
                          bytecode: hexToBin(
                            '210376ea9e36a75d2ecf9c93a0be76885e36f822529db22acfdc761c9b5b4544f5c5'
                          ),
                          range: {
                            endColumn: 36,
                            endLineNumber: 1,
                            startColumn: 22,
                            startLineNumber: 1
                          },
                          source: [
                            {
                              bytecode: hexToBin(
                                '0376ea9e36a75d2ecf9c93a0be76885e36f822529db22acfdc761c9b5b4544f5c5'
                              ),
                              range: {
                                endColumn: 35,
                                endLineNumber: 1,
                                startColumn: 23,
                                startLineNumber: 1
                              },
                              source: [
                                {
                                  bytecode: hexToBin(
                                    '0376ea9e36a75d2ecf9c93a0be76885e36f822529db22acfdc761c9b5b4544f5c5'
                                  ),
                                  range: {
                                    endColumn: 35,
                                    endLineNumber: 1,
                                    startColumn: 23,
                                    startLineNumber: 1
                                  }
                                }
                              ]
                            }
                          ]
                        },
                        {
                          bytecode: Uint8Array.of(0xa9),
                          range: {
                            endColumn: 47,
                            endLineNumber: 1,
                            startColumn: 37,
                            startLineNumber: 1
                          }
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          bytecode: Uint8Array.of(0x88),
          range: {
            endColumn: 64,
            endLineNumber: 1,
            startColumn: 50,
            startLineNumber: 1
          }
        },
        {
          bytecode: Uint8Array.of(0xac),
          range: {
            endColumn: 76,
            endLineNumber: 1,
            startColumn: 65,
            startLineNumber: 1
          }
        }
      ]
    },
    resolve: [
      {
        range: {
          endColumn: 7,
          endLineNumber: 1,
          startColumn: 1,
          startLineNumber: 1
        },
        type: 'bytecode',
        value: Uint8Array.of(0x76)
      },
      {
        range: {
          endColumn: 18,
          endLineNumber: 1,
          startColumn: 8,
          startLineNumber: 1
        },
        type: 'bytecode',
        value: Uint8Array.of(0xa9)
      },
      {
        range: {
          endColumn: 49,
          endLineNumber: 1,
          startColumn: 19,
          startLineNumber: 1
        },
        type: 'push',
        value: [
          {
            range: {
              endColumn: 48,
              endLineNumber: 1,
              startColumn: 20,
              startLineNumber: 1
            },
            type: 'evaluation',
            value: [
              {
                range: {
                  endColumn: 36,
                  endLineNumber: 1,
                  startColumn: 22,
                  startLineNumber: 1
                },
                type: 'push',
                value: [
                  {
                    range: {
                      endColumn: 35,
                      endLineNumber: 1,
                      startColumn: 23,
                      startLineNumber: 1
                    },
                    type: 'bytecode',
                    value: hexToBin(
                      '0376ea9e36a75d2ecf9c93a0be76885e36f822529db22acfdc761c9b5b4544f5c5'
                    ),
                    variable: 'a.public_key'
                  }
                ]
              },
              {
                range: {
                  endColumn: 47,
                  endLineNumber: 1,
                  startColumn: 37,
                  startLineNumber: 1
                },
                type: 'bytecode',
                value: Uint8Array.of(0xa9)
              }
            ]
          }
        ]
      },
      {
        range: {
          endColumn: 64,
          endLineNumber: 1,
          startColumn: 50,
          startLineNumber: 1
        },
        type: 'bytecode',
        value: Uint8Array.of(0x88)
      },
      {
        range: {
          endColumn: 76,
          endLineNumber: 1,
          startColumn: 65,
          startLineNumber: 1
        },
        type: 'bytecode',
        value: Uint8Array.of(0xac)
      }
    ],
    success: true
  });
  // tslint:disable-next-line: no-if-statement
  if (resultLock.success) {
    const resultUnlock = compiler.debug('unlock', {
      keys: { privateKeys: { a: privkey } },
      operationData: {
        ...createAuthenticationProgramExternalStateCommonEmpty(),
        coveredBytecode: resultLock.bytecode
      }
    });
    t.deepEqual(resultUnlock, {
      bytecode: hexToBin(
        '47304402206aa4183e0d831a01d2d22174cd4434c5dcb4d58d1c079e2f36ed0f09c6265eba022075024ac787395a32f1886d92a033319a15813c4eb93c2e38a60884760c5dad4741210376ea9e36a75d2ecf9c93a0be76885e36f822529db22acfdc761c9b5b4544f5c5'
      ),
      parse: {
        end: {
          column: 41,
          line: 1,
          offset: 40
        },
        name: 'Script',
        start: {
          column: 1,
          line: 1,
          offset: 0
        },
        value: [
          {
            end: {
              column: 26,
              line: 1,
              offset: 25
            },
            name: 'Push',
            start: {
              column: 1,
              line: 1,
              offset: 0
            },
            value: {
              end: {
                column: 25,
                line: 1,
                offset: 24
              },
              name: 'Script',
              start: {
                column: 2,
                line: 1,
                offset: 1
              },
              value: [
                {
                  end: {
                    column: 25,
                    line: 1,
                    offset: 24
                  },
                  name: 'Identifier',
                  start: {
                    column: 2,
                    line: 1,
                    offset: 1
                  },
                  value: 'a.signature.all_outputs'
                }
              ]
            }
          },
          {
            end: {
              column: 41,
              line: 1,
              offset: 40
            },
            name: 'Push',
            start: {
              column: 27,
              line: 1,
              offset: 26
            },
            value: {
              end: {
                column: 40,
                line: 1,
                offset: 39
              },
              name: 'Script',
              start: {
                column: 28,
                line: 1,
                offset: 27
              },
              value: [
                {
                  end: {
                    column: 40,
                    line: 1,
                    offset: 39
                  },
                  name: 'Identifier',
                  start: {
                    column: 28,
                    line: 1,
                    offset: 27
                  },
                  value: 'a.public_key'
                }
              ]
            }
          }
        ]
      },
      reduce: {
        bytecode: hexToBin(
          '47304402206aa4183e0d831a01d2d22174cd4434c5dcb4d58d1c079e2f36ed0f09c6265eba022075024ac787395a32f1886d92a033319a15813c4eb93c2e38a60884760c5dad4741210376ea9e36a75d2ecf9c93a0be76885e36f822529db22acfdc761c9b5b4544f5c5'
        ),
        range: {
          endColumn: 41,
          endLineNumber: 1,
          startColumn: 1,
          startLineNumber: 1
        },
        source: [
          {
            bytecode: hexToBin(
              '47304402206aa4183e0d831a01d2d22174cd4434c5dcb4d58d1c079e2f36ed0f09c6265eba022075024ac787395a32f1886d92a033319a15813c4eb93c2e38a60884760c5dad4741'
            ),
            range: {
              endColumn: 26,
              endLineNumber: 1,
              startColumn: 1,
              startLineNumber: 1
            },
            source: [
              {
                bytecode: hexToBin(
                  '304402206aa4183e0d831a01d2d22174cd4434c5dcb4d58d1c079e2f36ed0f09c6265eba022075024ac787395a32f1886d92a033319a15813c4eb93c2e38a60884760c5dad4741'
                ),
                range: {
                  endColumn: 25,
                  endLineNumber: 1,
                  startColumn: 2,
                  startLineNumber: 1
                },
                source: [
                  {
                    bytecode: hexToBin(
                      '304402206aa4183e0d831a01d2d22174cd4434c5dcb4d58d1c079e2f36ed0f09c6265eba022075024ac787395a32f1886d92a033319a15813c4eb93c2e38a60884760c5dad4741'
                    ),
                    range: {
                      endColumn: 25,
                      endLineNumber: 1,
                      startColumn: 2,
                      startLineNumber: 1
                    }
                  }
                ]
              }
            ]
          },
          {
            bytecode: hexToBin(
              '210376ea9e36a75d2ecf9c93a0be76885e36f822529db22acfdc761c9b5b4544f5c5'
            ),
            range: {
              endColumn: 41,
              endLineNumber: 1,
              startColumn: 27,
              startLineNumber: 1
            },
            source: [
              {
                bytecode: hexToBin(
                  '0376ea9e36a75d2ecf9c93a0be76885e36f822529db22acfdc761c9b5b4544f5c5'
                ),
                range: {
                  endColumn: 40,
                  endLineNumber: 1,
                  startColumn: 28,
                  startLineNumber: 1
                },
                source: [
                  {
                    bytecode: hexToBin(
                      '0376ea9e36a75d2ecf9c93a0be76885e36f822529db22acfdc761c9b5b4544f5c5'
                    ),
                    range: {
                      endColumn: 40,
                      endLineNumber: 1,
                      startColumn: 28,
                      startLineNumber: 1
                    }
                  }
                ]
              }
            ]
          }
        ]
      },
      resolve: [
        {
          range: {
            endColumn: 26,
            endLineNumber: 1,
            startColumn: 1,
            startLineNumber: 1
          },
          type: 'push',
          value: [
            {
              range: {
                endColumn: 25,
                endLineNumber: 1,
                startColumn: 2,
                startLineNumber: 1
              },
              type: 'bytecode',
              value: hexToBin(
                '304402206aa4183e0d831a01d2d22174cd4434c5dcb4d58d1c079e2f36ed0f09c6265eba022075024ac787395a32f1886d92a033319a15813c4eb93c2e38a60884760c5dad4741'
              ),
              variable: 'a.signature.all_outputs'
            }
          ]
        },
        {
          range: {
            endColumn: 41,
            endLineNumber: 1,
            startColumn: 27,
            startLineNumber: 1
          },
          type: 'push',
          value: [
            {
              range: {
                endColumn: 40,
                endLineNumber: 1,
                startColumn: 28,
                startLineNumber: 1
              },
              type: 'bytecode',
              value: hexToBin(
                '0376ea9e36a75d2ecf9c93a0be76885e36f822529db22acfdc761c9b5b4544f5c5'
              ),
              variable: 'a.public_key'
            }
          ]
        }
      ],
      success: true
    });
  }
});

// TODO: test single and multi-line comments
