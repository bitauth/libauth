// tslint:disable:no-expression-statement no-magic-numbers
import test from 'ava';

import { hexToBin } from '../../../utils/hex';

import { compileScript } from './compile';

test('compileScript: unprovided ID', t => {
  t.deepEqual(compileScript('test', {}, { scripts: { typo: '1' } }), {
    errorType: 'parse',
    errors: [
      {
        error:
          "No script with an ID of 'test' was provided in the compilation environment.",
        range: {
          endColumn: 0,
          endLineNumber: 0,
          startColumn: 0,
          startLineNumber: 0
        }
      }
    ],
    success: false
  });
});

test('compileScript: empty string', t => {
  t.deepEqual(compileScript('t', {}, { scripts: { t: '' } }), {
    errorType: 'parse',
    errors: [
      {
        error: 'Tried to compile an empty string as a script.',
        range: {
          endColumn: 0,
          endLineNumber: 0,
          startColumn: 0,
          startLineNumber: 0
        }
      }
    ],
    success: false
  });
});

test('compileScript parse error', t => {
  t.deepEqual(compileScript('t', {}, { scripts: { t: '$' } }), {
    errorType: 'parse',
    errors: [
      {
        error:
          'Encountered unexpected input while parsing script. Expected EOF, a UTF8 literal, a comment, a hexadecimal literal, a push expression, a valid identifier, an evaluation expression, an integer literal',
        range: {
          endColumn: 1,
          endLineNumber: 1,
          startColumn: 1,
          startLineNumber: 1
        }
      }
    ],
    success: false
  });
});

test('compileScript: 0x51', t => {
  t.deepEqual(compileScript('t', {}, { scripts: { t: '0x51' } }), {
    bytecode: Uint8Array.of(0x51),
    parse: {
      end: {
        column: 5,
        line: 1,
        offset: 4
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
            column: 5,
            line: 1,
            offset: 4
          },
          name: 'HexLiteral',
          start: {
            column: 1,
            line: 1,
            offset: 0
          },
          value: '51'
        }
      ]
    },
    reduce: {
      bytecode: Uint8Array.of(0x51),
      range: {
        endColumn: 5,
        endLineNumber: 1,
        startColumn: 1,
        startLineNumber: 1
      },
      source: [
        {
          bytecode: Uint8Array.of(0x51),
          range: {
            endColumn: 5,
            endLineNumber: 1,
            startColumn: 1,
            startLineNumber: 1
          }
        }
      ]
    },
    resolve: [
      {
        range: {
          endColumn: 5,
          endLineNumber: 1,
          startColumn: 1,
          startLineNumber: 1
        },
        type: 'bytecode',
        value: Uint8Array.of(0x51)
      }
    ],
    success: true
  });
});

test('compileScript: <1>', t => {
  t.deepEqual(compileScript('t', {}, { scripts: { t: '<1>' } }), {
    bytecode: Uint8Array.of(0x51),
    parse: {
      end: {
        column: 4,
        line: 1,
        offset: 3
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
            column: 4,
            line: 1,
            offset: 3
          },
          name: 'Push',
          start: {
            column: 1,
            line: 1,
            offset: 0
          },
          value: {
            end: {
              column: 3,
              line: 1,
              offset: 2
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
                  column: 3,
                  line: 1,
                  offset: 2
                },
                name: 'BigIntLiteral',
                start: {
                  column: 2,
                  line: 1,
                  offset: 1
                },
                value: BigInt(1)
              }
            ]
          }
        }
      ]
    },
    reduce: {
      bytecode: Uint8Array.of(0x51),
      range: {
        endColumn: 4,
        endLineNumber: 1,
        startColumn: 1,
        startLineNumber: 1
      },
      source: [
        {
          bytecode: Uint8Array.of(0x51),
          range: {
            endColumn: 4,
            endLineNumber: 1,
            startColumn: 1,
            startLineNumber: 1
          },
          source: [
            {
              bytecode: Uint8Array.of(0x01),
              range: {
                endColumn: 3,
                endLineNumber: 1,
                startColumn: 2,
                startLineNumber: 1
              },
              source: [
                {
                  bytecode: Uint8Array.of(0x01),
                  range: {
                    endColumn: 3,
                    endLineNumber: 1,
                    startColumn: 2,
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
          endColumn: 4,
          endLineNumber: 1,
          startColumn: 1,
          startLineNumber: 1
        },
        type: 'push',
        value: [
          {
            range: {
              endColumn: 3,
              endLineNumber: 1,
              startColumn: 2,
              startLineNumber: 1
            },
            type: 'bytecode',
            value: Uint8Array.of(0x01)
          }
        ]
      }
    ],
    success: true
  });
});

test('compileScript: <0xabcdef>', t => {
  t.deepEqual(compileScript('t', {}, { scripts: { t: '<0xabcdef>' } }), {
    bytecode: Uint8Array.of(0x03, 0xab, 0xcd, 0xef),
    parse: {
      end: {
        column: 11,
        line: 1,
        offset: 10
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
            column: 11,
            line: 1,
            offset: 10
          },
          name: 'Push',
          start: {
            column: 1,
            line: 1,
            offset: 0
          },
          value: {
            end: {
              column: 10,
              line: 1,
              offset: 9
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
                  column: 10,
                  line: 1,
                  offset: 9
                },
                name: 'HexLiteral',
                start: {
                  column: 2,
                  line: 1,
                  offset: 1
                },
                value: 'abcdef'
              }
            ]
          }
        }
      ]
    },
    reduce: {
      bytecode: Uint8Array.of(0x03, 0xab, 0xcd, 0xef),
      range: {
        endColumn: 11,
        endLineNumber: 1,
        startColumn: 1,
        startLineNumber: 1
      },
      source: [
        {
          bytecode: Uint8Array.of(0x03, 0xab, 0xcd, 0xef),
          range: {
            endColumn: 11,
            endLineNumber: 1,
            startColumn: 1,
            startLineNumber: 1
          },
          source: [
            {
              bytecode: Uint8Array.of(0xab, 0xcd, 0xef),
              range: {
                endColumn: 10,
                endLineNumber: 1,
                startColumn: 2,
                startLineNumber: 1
              },
              source: [
                {
                  bytecode: Uint8Array.of(0xab, 0xcd, 0xef),
                  range: {
                    endColumn: 10,
                    endLineNumber: 1,
                    startColumn: 2,
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
          endColumn: 11,
          endLineNumber: 1,
          startColumn: 1,
          startLineNumber: 1
        },
        type: 'push',
        value: [
          {
            range: {
              endColumn: 10,
              endLineNumber: 1,
              startColumn: 2,
              startLineNumber: 1
            },
            type: 'bytecode',
            value: Uint8Array.of(0xab, 0xcd, 0xef)
          }
        ]
      }
    ],
    success: true
  });
});

test('compileScript: <"abc 👍">', t => {
  t.deepEqual(compileScript('t', {}, { scripts: { t: '<"abc 👍">' } }), {
    bytecode: hexToBin('0861626320f09f918d'),
    parse: {
      end: {
        column: 11,
        line: 1,
        offset: 10
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
            column: 11,
            line: 1,
            offset: 10
          },
          name: 'Push',
          start: {
            column: 1,
            line: 1,
            offset: 0
          },
          value: {
            end: {
              column: 10,
              line: 1,
              offset: 9
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
                  column: 10,
                  line: 1,
                  offset: 9
                },
                name: 'UTF8Literal',
                start: {
                  column: 2,
                  line: 1,
                  offset: 1
                },
                value: 'abc 👍'
              }
            ]
          }
        }
      ]
    },
    reduce: {
      bytecode: hexToBin('0861626320f09f918d'),
      range: {
        endColumn: 11,
        endLineNumber: 1,
        startColumn: 1,
        startLineNumber: 1
      },
      source: [
        {
          bytecode: hexToBin('0861626320f09f918d'),
          range: {
            endColumn: 11,
            endLineNumber: 1,
            startColumn: 1,
            startLineNumber: 1
          },
          source: [
            {
              bytecode: hexToBin('61626320f09f918d'),
              range: {
                endColumn: 10,
                endLineNumber: 1,
                startColumn: 2,
                startLineNumber: 1
              },
              source: [
                {
                  bytecode: hexToBin('61626320f09f918d'),
                  range: {
                    endColumn: 10,
                    endLineNumber: 1,
                    startColumn: 2,
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
          endColumn: 11,
          endLineNumber: 1,
          startColumn: 1,
          startLineNumber: 1
        },
        type: 'push',
        value: [
          {
            range: {
              endColumn: 10,
              endLineNumber: 1,
              startColumn: 2,
              startLineNumber: 1
            },
            type: 'bytecode',
            value: hexToBin('61626320f09f918d')
          }
        ]
      }
    ],
    success: true
  });
});

test('compileScript (no identifiers): OP_1', t => {
  t.deepEqual(compileScript('t', {}, { scripts: { t: 'OP_1' } }), {
    errorType: 'resolve',
    errors: [
      {
        error: "Unknown identifier 'OP_1'.",
        range: {
          endColumn: 5,
          endLineNumber: 1,
          startColumn: 1,
          startLineNumber: 1
        }
      }
    ],
    parse: {
      end: {
        column: 5,
        line: 1,
        offset: 4
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
            column: 5,
            line: 1,
            offset: 4
          },
          name: 'Identifier',
          start: {
            column: 1,
            line: 1,
            offset: 0
          },
          value: 'OP_1'
        }
      ]
    },
    resolve: [
      {
        range: {
          endColumn: 5,
          endLineNumber: 1,
          startColumn: 1,
          startLineNumber: 1
        },
        type: 'error',
        value: "Unknown identifier 'OP_1'."
      }
    ],
    success: false
  });
});

test('compileScript: OP_1 OP_2 OP_ADD', t => {
  t.deepEqual(
    compileScript(
      't',
      {},
      {
        opcodes: {
          OP_1: Uint8Array.of(0x51),
          OP_2: Uint8Array.of(0x52),
          OP_ADD: Uint8Array.of(0x93)
        },
        scripts: { t: 'OP_1 OP_2 OP_ADD' }
      }
    ),
    {
      bytecode: Uint8Array.of(0x51, 0x52, 0x93),
      parse: {
        end: {
          column: 17,
          line: 1,
          offset: 16
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
              column: 5,
              line: 1,
              offset: 4
            },
            name: 'Identifier',
            start: {
              column: 1,
              line: 1,
              offset: 0
            },
            value: 'OP_1'
          },
          {
            end: {
              column: 10,
              line: 1,
              offset: 9
            },
            name: 'Identifier',
            start: {
              column: 6,
              line: 1,
              offset: 5
            },
            value: 'OP_2'
          },
          {
            end: {
              column: 17,
              line: 1,
              offset: 16
            },
            name: 'Identifier',
            start: {
              column: 11,
              line: 1,
              offset: 10
            },
            value: 'OP_ADD'
          }
        ]
      },
      reduce: {
        bytecode: Uint8Array.of(0x51, 0x52, 0x93),
        range: {
          endColumn: 17,
          endLineNumber: 1,
          startColumn: 1,
          startLineNumber: 1
        },
        source: [
          {
            bytecode: Uint8Array.of(0x51),
            range: {
              endColumn: 5,
              endLineNumber: 1,
              startColumn: 1,
              startLineNumber: 1
            }
          },
          {
            bytecode: Uint8Array.of(0x52),
            range: {
              endColumn: 10,
              endLineNumber: 1,
              startColumn: 6,
              startLineNumber: 1
            }
          },
          {
            bytecode: Uint8Array.of(0x93),
            range: {
              endColumn: 17,
              endLineNumber: 1,
              startColumn: 11,
              startLineNumber: 1
            }
          }
        ]
      },
      resolve: [
        {
          range: {
            endColumn: 5,
            endLineNumber: 1,
            startColumn: 1,
            startLineNumber: 1
          },
          type: 'bytecode',
          value: Uint8Array.of(0x51)
        },
        {
          range: {
            endColumn: 10,
            endLineNumber: 1,
            startColumn: 6,
            startLineNumber: 1
          },
          type: 'bytecode',
          value: Uint8Array.of(0x52)
        },
        {
          range: {
            endColumn: 17,
            endLineNumber: 1,
            startColumn: 11,
            startLineNumber: 1
          },
          type: 'bytecode',
          value: Uint8Array.of(0x93)
        }
      ],
      success: true
    }
  );
});
