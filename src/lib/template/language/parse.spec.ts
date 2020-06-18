/* eslint-disable functional/no-expression-statement, max-lines */
import test from 'ava';

import { parseScript, stringifyTestVector } from '../../lib';

test('parseScript: empty string', (t) => {
  t.deepEqual(parseScript(''), {
    status: true,
    value: {
      end: {
        column: 1,
        line: 1,
        offset: 0,
      },
      name: 'Script',
      start: {
        column: 1,
        line: 1,
        offset: 0,
      },
      value: [],
    },
  });
});

test('parseScript: BigIntLiteral', (t) => {
  t.deepEqual(parseScript('42'), {
    status: true,
    value: {
      end: {
        column: 3,
        line: 1,
        offset: 2,
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
            column: 3,
            line: 1,
            offset: 2,
          },
          name: 'BigIntLiteral',
          start: {
            column: 1,
            line: 1,
            offset: 0,
          },
          value: '42',
        },
      ],
    },
  });
  t.deepEqual(parseScript('-42'), {
    status: true,
    value: {
      end: {
        column: 4,
        line: 1,
        offset: 3,
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
            column: 4,
            line: 1,
            offset: 3,
          },
          name: 'BigIntLiteral',
          start: {
            column: 1,
            line: 1,
            offset: 0,
          },
          value: '-42',
        },
      ],
    },
  });
  const allowed = parseScript('0 1 -1 01 0_1 -1__000_000');
  t.deepEqual(
    allowed,
    {
      status: true,
      value: {
        end: {
          column: 26,
          line: 1,
          offset: 25,
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
              column: 2,
              line: 1,
              offset: 1,
            },
            name: 'BigIntLiteral',
            start: {
              column: 1,
              line: 1,
              offset: 0,
            },
            value: '0',
          },
          {
            end: {
              column: 4,
              line: 1,
              offset: 3,
            },
            name: 'BigIntLiteral',
            start: {
              column: 3,
              line: 1,
              offset: 2,
            },
            value: '1',
          },
          {
            end: {
              column: 7,
              line: 1,
              offset: 6,
            },
            name: 'BigIntLiteral',
            start: {
              column: 5,
              line: 1,
              offset: 4,
            },
            value: '-1',
          },
          {
            end: {
              column: 10,
              line: 1,
              offset: 9,
            },
            name: 'BigIntLiteral',
            start: {
              column: 8,
              line: 1,
              offset: 7,
            },
            value: '01',
          },
          {
            end: {
              column: 14,
              line: 1,
              offset: 13,
            },
            name: 'BigIntLiteral',
            start: {
              column: 11,
              line: 1,
              offset: 10,
            },
            value: '0_1',
          },
          {
            end: {
              column: 26,
              line: 1,
              offset: 25,
            },
            name: 'BigIntLiteral',
            start: {
              column: 15,
              line: 1,
              offset: 14,
            },
            value: '-1__000_000',
          },
        ],
      },
    },
    stringifyTestVector(allowed)
  );

  const maybeUnexpected = parseScript('_1 1_');
  t.deepEqual(
    maybeUnexpected,
    {
      status: true,
      value: {
        end: {
          column: 6,
          line: 1,
          offset: 5,
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
              column: 3,
              line: 1,
              offset: 2,
            },
            name: 'Identifier',
            start: {
              column: 1,
              line: 1,
              offset: 0,
            },
            value: '_1',
          },
          {
            end: {
              column: 5,
              line: 1,
              offset: 4,
            },
            name: 'BigIntLiteral',
            start: {
              column: 4,
              line: 1,
              offset: 3,
            },
            value: '1',
          },
          {
            end: {
              column: 6,
              line: 1,
              offset: 5,
            },
            name: 'Identifier',
            start: {
              column: 5,
              line: 1,
              offset: 4,
            },
            value: '_',
          },
        ],
      },
    },
    stringifyTestVector(maybeUnexpected)
  );

  const errors = parseScript('-_1');
  t.deepEqual(
    errors,
    {
      expected: [
        'EOF',
        "a binary literal ('0b...')",
        'a double quote (")',
        "a hex literal ('0x...')",
        "a single quote (')",
        'a valid identifier',
        'an integer literal',
        "the start of a multi-line comment ('/*')",
        "the start of a push statement ('<')",
        "the start of a single-line comment ('//')",
        "the start of an evaluation ('$')",
      ],
      index: {
        column: 1,
        line: 1,
        offset: 0,
      },
      status: false,
    },
    stringifyTestVector(errors)
  );
});

test('parseScript: Identifier', (t) => {
  t.deepEqual(parseScript('a_variable'), {
    status: true,
    value: {
      end: {
        column: 11,
        line: 1,
        offset: 10,
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
            column: 11,
            line: 1,
            offset: 10,
          },
          name: 'Identifier',
          start: {
            column: 1,
            line: 1,
            offset: 0,
          },
          value: 'a_variable',
        },
      ],
    },
  });
});

test('parseScript: UTF8Literal', (t) => {
  t.deepEqual(parseScript(`"a'b\`c 👍"`), {
    status: true,
    value: {
      end: {
        column: 11,
        line: 1,
        offset: 10,
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
            column: 11,
            line: 1,
            offset: 10,
          },
          name: 'UTF8Literal',
          start: {
            column: 1,
            line: 1,
            offset: 0,
          },
          value: "a'b`c 👍",
        },
      ],
    },
  });
  t.deepEqual(parseScript(`'a"b\`c 🚀'`), {
    status: true,
    value: {
      end: {
        column: 11,
        line: 1,
        offset: 10,
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
            column: 11,
            line: 1,
            offset: 10,
          },
          name: 'UTF8Literal',
          start: {
            column: 1,
            line: 1,
            offset: 0,
          },
          value: 'a"b`c 🚀',
        },
      ],
    },
  });
});

test('parseScript: HexLiteral', (t) => {
  t.deepEqual(parseScript('0xdeadbeef'), {
    status: true,
    value: {
      end: {
        column: 11,
        line: 1,
        offset: 10,
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
            column: 11,
            line: 1,
            offset: 10,
          },
          name: 'HexLiteral',
          start: {
            column: 1,
            line: 1,
            offset: 0,
          },
          value: 'deadbeef',
        },
      ],
    },
  });
  const allowed = parseScript('0x01 0x0101 0x0_1 0x00_00__11_11');
  t.deepEqual(
    allowed,
    {
      status: true,
      value: {
        end: {
          column: 33,
          line: 1,
          offset: 32,
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
              column: 5,
              line: 1,
              offset: 4,
            },
            name: 'HexLiteral',
            start: {
              column: 1,
              line: 1,
              offset: 0,
            },
            value: '01',
          },
          {
            end: {
              column: 12,
              line: 1,
              offset: 11,
            },
            name: 'HexLiteral',
            start: {
              column: 6,
              line: 1,
              offset: 5,
            },
            value: '0101',
          },
          {
            end: {
              column: 18,
              line: 1,
              offset: 17,
            },
            name: 'HexLiteral',
            start: {
              column: 13,
              line: 1,
              offset: 12,
            },
            value: '0_1',
          },
          {
            end: {
              column: 33,
              line: 1,
              offset: 32,
            },
            name: 'HexLiteral',
            start: {
              column: 19,
              line: 1,
              offset: 18,
            },
            value: '00_00__11_11',
          },
        ],
      },
    },
    stringifyTestVector(allowed)
  );
  const maybeUnexpected = parseScript('0x 0x0_ 0x0_11 0x0_1_ 0x_01');
  t.deepEqual(
    maybeUnexpected,
    {
      status: true,
      value: {
        end: {
          column: 28,
          line: 1,
          offset: 27,
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
              column: 2,
              line: 1,
              offset: 1,
            },
            name: 'BigIntLiteral',
            start: {
              column: 1,
              line: 1,
              offset: 0,
            },
            value: '0',
          },
          {
            end: {
              column: 3,
              line: 1,
              offset: 2,
            },
            name: 'Identifier',
            start: {
              column: 2,
              line: 1,
              offset: 1,
            },
            value: 'x',
          },
          {
            end: {
              column: 5,
              line: 1,
              offset: 4,
            },
            name: 'BigIntLiteral',
            start: {
              column: 4,
              line: 1,
              offset: 3,
            },
            value: '0',
          },
          {
            end: {
              column: 8,
              line: 1,
              offset: 7,
            },
            name: 'Identifier',
            start: {
              column: 5,
              line: 1,
              offset: 4,
            },
            value: 'x0_',
          },
          {
            end: {
              column: 14,
              line: 1,
              offset: 13,
            },
            name: 'HexLiteral',
            start: {
              column: 9,
              line: 1,
              offset: 8,
            },
            value: '0_1',
          },
          {
            end: {
              column: 15,
              line: 1,
              offset: 14,
            },
            name: 'BigIntLiteral',
            start: {
              column: 14,
              line: 1,
              offset: 13,
            },
            value: '1',
          },
          {
            end: {
              column: 21,
              line: 1,
              offset: 20,
            },
            name: 'HexLiteral',
            start: {
              column: 16,
              line: 1,
              offset: 15,
            },
            value: '0_1',
          },
          {
            end: {
              column: 22,
              line: 1,
              offset: 21,
            },
            name: 'Identifier',
            start: {
              column: 21,
              line: 1,
              offset: 20,
            },
            value: '_',
          },
          {
            end: {
              column: 24,
              line: 1,
              offset: 23,
            },
            name: 'BigIntLiteral',
            start: {
              column: 23,
              line: 1,
              offset: 22,
            },
            value: '0',
          },
          {
            end: {
              column: 28,
              line: 1,
              offset: 27,
            },
            name: 'Identifier',
            start: {
              column: 24,
              line: 1,
              offset: 23,
            },
            value: 'x_01',
          },
        ],
      },
    },
    stringifyTestVector(maybeUnexpected)
  );
});

test('parseScript: BinaryLiteral', (t) => {
  const b1 = parseScript('0b1');
  t.deepEqual(
    b1,
    {
      status: true,
      value: {
        end: {
          column: 4,
          line: 1,
          offset: 3,
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
              column: 4,
              line: 1,
              offset: 3,
            },
            name: 'BinaryLiteral',
            start: {
              column: 1,
              line: 1,
              offset: 0,
            },
            value: '1',
          },
        ],
      },
    },
    stringifyTestVector(b1)
  );
  const b010101 = parseScript('0b010101');
  t.deepEqual(
    b010101,
    {
      status: true,
      value: {
        end: {
          column: 9,
          line: 1,
          offset: 8,
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
              column: 9,
              line: 1,
              offset: 8,
            },
            name: 'BinaryLiteral',
            start: {
              column: 1,
              line: 1,
              offset: 0,
            },
            value: '010101',
          },
        ],
      },
    },
    stringifyTestVector(b010101)
  );
  const allowed = parseScript('0b0 0b1 0b111 0b0_0 0b0000_0000__0000_0000');
  t.deepEqual(
    allowed,
    {
      status: true,
      value: {
        end: {
          column: 43,
          line: 1,
          offset: 42,
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
              column: 4,
              line: 1,
              offset: 3,
            },
            name: 'BinaryLiteral',
            start: {
              column: 1,
              line: 1,
              offset: 0,
            },
            value: '0',
          },
          {
            end: {
              column: 8,
              line: 1,
              offset: 7,
            },
            name: 'BinaryLiteral',
            start: {
              column: 5,
              line: 1,
              offset: 4,
            },
            value: '1',
          },
          {
            end: {
              column: 14,
              line: 1,
              offset: 13,
            },
            name: 'BinaryLiteral',
            start: {
              column: 9,
              line: 1,
              offset: 8,
            },
            value: '111',
          },
          {
            end: {
              column: 20,
              line: 1,
              offset: 19,
            },
            name: 'BinaryLiteral',
            start: {
              column: 15,
              line: 1,
              offset: 14,
            },
            value: '0_0',
          },
          {
            end: {
              column: 43,
              line: 1,
              offset: 42,
            },
            name: 'BinaryLiteral',
            start: {
              column: 21,
              line: 1,
              offset: 20,
            },
            value: '0000_0000__0000_0000',
          },
        ],
      },
    },
    stringifyTestVector(allowed)
  );
  const maybeUnexpected = parseScript('0b 0b_ 0b_1 0b1_');
  t.deepEqual(
    maybeUnexpected,
    {
      status: true,
      value: {
        end: {
          column: 17,
          line: 1,
          offset: 16,
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
              column: 2,
              line: 1,
              offset: 1,
            },
            name: 'BigIntLiteral',
            start: {
              column: 1,
              line: 1,
              offset: 0,
            },
            value: '0',
          },
          {
            end: {
              column: 3,
              line: 1,
              offset: 2,
            },
            name: 'Identifier',
            start: {
              column: 2,
              line: 1,
              offset: 1,
            },
            value: 'b',
          },
          {
            end: {
              column: 5,
              line: 1,
              offset: 4,
            },
            name: 'BigIntLiteral',
            start: {
              column: 4,
              line: 1,
              offset: 3,
            },
            value: '0',
          },
          {
            end: {
              column: 7,
              line: 1,
              offset: 6,
            },
            name: 'Identifier',
            start: {
              column: 5,
              line: 1,
              offset: 4,
            },
            value: 'b_',
          },
          {
            end: {
              column: 9,
              line: 1,
              offset: 8,
            },
            name: 'BigIntLiteral',
            start: {
              column: 8,
              line: 1,
              offset: 7,
            },
            value: '0',
          },
          {
            end: {
              column: 12,
              line: 1,
              offset: 11,
            },
            name: 'Identifier',
            start: {
              column: 9,
              line: 1,
              offset: 8,
            },
            value: 'b_1',
          },
          {
            end: {
              column: 16,
              line: 1,
              offset: 15,
            },
            name: 'BinaryLiteral',
            start: {
              column: 13,
              line: 1,
              offset: 12,
            },
            value: '1',
          },
          {
            end: {
              column: 17,
              line: 1,
              offset: 16,
            },
            name: 'Identifier',
            start: {
              column: 16,
              line: 1,
              offset: 15,
            },
            value: '_',
          },
        ],
      },
    },
    stringifyTestVector(maybeUnexpected)
  );
});

test('parseScript: comments', (t) => {
  const single = parseScript(`// single-line comment`);
  t.deepEqual(
    single,
    {
      status: true,
      value: {
        end: {
          column: 23,
          line: 1,
          offset: 22,
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
              column: 23,
              line: 1,
              offset: 22,
            },
            name: 'Comment',
            start: {
              column: 1,
              line: 1,
              offset: 0,
            },
            value: 'single-line comment',
          },
        ],
      },
    },
    stringifyTestVector(single)
  );
  const multi = parseScript(`/* \nmulti-line\n comment\n */`);
  t.deepEqual(
    multi,
    {
      status: true,
      value: {
        end: {
          column: 4,
          line: 4,
          offset: 27,
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
              column: 4,
              line: 4,
              offset: 27,
            },
            name: 'Comment',
            start: {
              column: 1,
              line: 1,
              offset: 0,
            },
            value: 'multi-line\n comment',
          },
        ],
      },
    },
    stringifyTestVector(multi)
  );
  const multiple = parseScript(`/* comment before */ OP_1 /* comment after */`);
  t.deepEqual(
    multiple,
    {
      status: true,
      value: {
        end: {
          column: 46,
          line: 1,
          offset: 45,
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
              column: 21,
              line: 1,
              offset: 20,
            },
            name: 'Comment',
            start: {
              column: 1,
              line: 1,
              offset: 0,
            },
            value: 'comment before',
          },
          {
            end: {
              column: 26,
              line: 1,
              offset: 25,
            },
            name: 'Identifier',
            start: {
              column: 22,
              line: 1,
              offset: 21,
            },
            value: 'OP_1',
          },
          {
            end: {
              column: 46,
              line: 1,
              offset: 45,
            },
            name: 'Comment',
            start: {
              column: 27,
              line: 1,
              offset: 26,
            },
            value: 'comment after',
          },
        ],
      },
    },
    stringifyTestVector(multiple)
  );
});

test('parseScript: empty push statement', (t) => {
  t.deepEqual(parseScript('<>'), {
    status: true,
    value: {
      end: {
        column: 3,
        line: 1,
        offset: 2,
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
            column: 3,
            line: 1,
            offset: 2,
          },
          name: 'Push',
          start: {
            column: 1,
            line: 1,
            offset: 0,
          },
          value: {
            end: {
              column: 2,
              line: 1,
              offset: 1,
            },
            name: 'Script',
            start: {
              column: 2,
              line: 1,
              offset: 1,
            },
            value: [],
          },
        },
      ],
    },
  });
});

test('parseScript: push of a literal', (t) => {
  t.deepEqual(parseScript('<"abc">'), {
    status: true,
    value: {
      end: {
        column: 8,
        line: 1,
        offset: 7,
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
            column: 8,
            line: 1,
            offset: 7,
          },
          name: 'Push',
          start: {
            column: 1,
            line: 1,
            offset: 0,
          },
          value: {
            end: {
              column: 7,
              line: 1,
              offset: 6,
            },
            name: 'Script',
            start: {
              column: 2,
              line: 1,
              offset: 1,
            },
            value: [
              {
                end: {
                  column: 7,
                  line: 1,
                  offset: 6,
                },
                name: 'UTF8Literal',
                start: {
                  column: 2,
                  line: 1,
                  offset: 1,
                },
                value: 'abc',
              },
            ],
          },
        },
      ],
    },
  });
});

test('parseScript: push of a push statement', (t) => {
  t.deepEqual(parseScript('<<>>'), {
    status: true,
    value: {
      end: {
        column: 5,
        line: 1,
        offset: 4,
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
            column: 5,
            line: 1,
            offset: 4,
          },
          name: 'Push',
          start: {
            column: 1,
            line: 1,
            offset: 0,
          },
          value: {
            end: {
              column: 4,
              line: 1,
              offset: 3,
            },
            name: 'Script',
            start: {
              column: 2,
              line: 1,
              offset: 1,
            },
            value: [
              {
                end: {
                  column: 4,
                  line: 1,
                  offset: 3,
                },
                name: 'Push',
                start: {
                  column: 2,
                  line: 1,
                  offset: 1,
                },
                value: {
                  end: {
                    column: 3,
                    line: 1,
                    offset: 2,
                  },
                  name: 'Script',
                  start: {
                    column: 3,
                    line: 1,
                    offset: 2,
                  },
                  value: [],
                },
              },
            ],
          },
        },
      ],
    },
  });
});

test('parseScript: push of an evaluation', (t) => {
  t.deepEqual(parseScript('<$(<1><2> OP_ADD)> OP_EQUAL'), {
    status: true,
    value: {
      end: {
        column: 28,
        line: 1,
        offset: 27,
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
            column: 19,
            line: 1,
            offset: 18,
          },
          name: 'Push',
          start: {
            column: 1,
            line: 1,
            offset: 0,
          },
          value: {
            end: {
              column: 18,
              line: 1,
              offset: 17,
            },
            name: 'Script',
            start: {
              column: 2,
              line: 1,
              offset: 1,
            },
            value: [
              {
                end: {
                  column: 18,
                  line: 1,
                  offset: 17,
                },
                name: 'Evaluation',
                start: {
                  column: 2,
                  line: 1,
                  offset: 1,
                },
                value: {
                  end: {
                    column: 17,
                    line: 1,
                    offset: 16,
                  },
                  name: 'Script',
                  start: {
                    column: 4,
                    line: 1,
                    offset: 3,
                  },
                  value: [
                    {
                      end: {
                        column: 7,
                        line: 1,
                        offset: 6,
                      },
                      name: 'Push',
                      start: {
                        column: 4,
                        line: 1,
                        offset: 3,
                      },
                      value: {
                        end: {
                          column: 6,
                          line: 1,
                          offset: 5,
                        },
                        name: 'Script',
                        start: {
                          column: 5,
                          line: 1,
                          offset: 4,
                        },
                        value: [
                          {
                            end: {
                              column: 6,
                              line: 1,
                              offset: 5,
                            },
                            name: 'BigIntLiteral',
                            start: {
                              column: 5,
                              line: 1,
                              offset: 4,
                            },
                            value: '1',
                          },
                        ],
                      },
                    },
                    {
                      end: {
                        column: 10,
                        line: 1,
                        offset: 9,
                      },
                      name: 'Push',
                      start: {
                        column: 7,
                        line: 1,
                        offset: 6,
                      },
                      value: {
                        end: {
                          column: 9,
                          line: 1,
                          offset: 8,
                        },
                        name: 'Script',
                        start: {
                          column: 8,
                          line: 1,
                          offset: 7,
                        },
                        value: [
                          {
                            end: {
                              column: 9,
                              line: 1,
                              offset: 8,
                            },
                            name: 'BigIntLiteral',
                            start: {
                              column: 8,
                              line: 1,
                              offset: 7,
                            },
                            value: '2',
                          },
                        ],
                      },
                    },
                    {
                      end: {
                        column: 17,
                        line: 1,
                        offset: 16,
                      },
                      name: 'Identifier',
                      start: {
                        column: 11,
                        line: 1,
                        offset: 10,
                      },
                      value: 'OP_ADD',
                    },
                  ],
                },
              },
            ],
          },
        },
        {
          end: {
            column: 28,
            line: 1,
            offset: 27,
          },
          name: 'Identifier',
          start: {
            column: 20,
            line: 1,
            offset: 19,
          },
          value: 'OP_EQUAL',
        },
      ],
    },
  });
});

test('parseScript: invalid identifier characters', (t) => {
  t.deepEqual(parseScript('test_$variable'), {
    expected: ["the opening parenthesis of this evaluation ('(')"],
    index: {
      column: 7,
      line: 1,
      offset: 6,
    },
    status: false,
  });
});

test('parseScript: incomplete UTF8Literal', (t) => {
  t.deepEqual(parseScript("'incomplete"), {
    expected: ["a closing single quote (')"],
    index: {
      column: 12,
      line: 1,
      offset: 11,
    },
    status: false,
  });
  t.deepEqual(parseScript('"incomplete'), {
    expected: ['a closing double quote (")'],
    index: {
      column: 12,
      line: 1,
      offset: 11,
    },
    status: false,
  });
});

test('parseScript: BigIntLiteral without trailing whitespace', (t) => {
  t.deepEqual(parseScript('1234a'), {
    status: true,
    value: {
      end: {
        column: 6,
        line: 1,
        offset: 5,
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
            column: 5,
            line: 1,
            offset: 4,
          },
          name: 'BigIntLiteral',
          start: {
            column: 1,
            line: 1,
            offset: 0,
          },
          value: '1234',
        },
        {
          end: {
            column: 6,
            line: 1,
            offset: 5,
          },
          name: 'Identifier',
          start: {
            column: 5,
            line: 1,
            offset: 4,
          },
          value: 'a',
        },
      ],
    },
  });
});

test('parseScript: HexLiteral without trailing whitespace', (t) => {
  t.deepEqual(parseScript('0x010203f'), {
    status: true,
    value: {
      end: {
        column: 10,
        line: 1,
        offset: 9,
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
            column: 9,
            line: 1,
            offset: 8,
          },
          name: 'HexLiteral',
          start: {
            column: 1,
            line: 1,
            offset: 0,
          },
          value: '010203',
        },
        {
          end: {
            column: 10,
            line: 1,
            offset: 9,
          },
          name: 'Identifier',
          start: {
            column: 9,
            line: 1,
            offset: 8,
          },
          value: 'f',
        },
      ],
    },
  });
});

test('parseScript: incomplete push', (t) => {
  t.deepEqual(parseScript('<my_var'), {
    expected: [
      "a binary literal ('0b...')",
      'a double quote (")',
      "a hex literal ('0x...')",
      "a single quote (')",
      'a valid identifier',
      'an integer literal',
      "the end of this push statement ('>')",
      "the start of a multi-line comment ('/*')",
      "the start of a push statement ('<')",
      "the start of a single-line comment ('//')",
      "the start of an evaluation ('$')",
    ],
    index: {
      column: 8,
      line: 1,
      offset: 7,
    },
    status: false,
  });
});

test('parseScript: incomplete multi-line comment', (t) => {
  t.deepEqual(parseScript('identifier /* \n multi-line\ncomment\n'), {
    expected: ["the end of this multi-line comment ('*/')"],
    index: {
      column: 14,
      line: 1,
      offset: 13,
    },
    status: false,
  });
});

test('parseScript: incomplete evaluation', (t) => {
  t.deepEqual(parseScript('<$'), {
    expected: ["the opening parenthesis of this evaluation ('(')"],
    index: {
      column: 3,
      line: 1,
      offset: 2,
    },
    status: false,
  });
  t.deepEqual(parseScript('<$(<1> <2> OP_ADD >'), {
    expected: [
      "a binary literal ('0b...')",
      'a double quote (")',
      "a hex literal ('0x...')",
      "a single quote (')",
      'a valid identifier',
      'an integer literal',
      "the closing parenthesis of this evaluation (')')",
      "the start of a multi-line comment ('/*')",
      "the start of a push statement ('<')",
      "the start of a single-line comment ('//')",
      "the start of an evaluation ('$')",
    ],
    index: {
      column: 19,
      line: 1,
      offset: 18,
    },
    status: false,
  });
});

test('parseScript: complex script', (t) => {
  const script = `
// there are plenty of ways to push 0/call OP_0
<0> OP_0 0 0x00 $(OP_0) <$(OP_0)> $(< -1 > < 1 > OP_ADD)
/**
 * A multi-line comment 🚀
 * Followed by some UTF8Literals
 */
'abc' "'🧙'"
// a comment at the end
`;
  const result = parseScript(script);
  t.deepEqual(
    result,
    {
      status: true,
      value: {
        end: {
          column: 1,
          line: 10,
          offset: 211,
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
              column: 48,
              line: 2,
              offset: 48,
            },
            name: 'Comment',
            start: {
              column: 1,
              line: 2,
              offset: 1,
            },
            value: 'there are plenty of ways to push 0/call OP_0',
          },
          {
            end: {
              column: 4,
              line: 3,
              offset: 52,
            },
            name: 'Push',
            start: {
              column: 1,
              line: 3,
              offset: 49,
            },
            value: {
              end: {
                column: 3,
                line: 3,
                offset: 51,
              },
              name: 'Script',
              start: {
                column: 2,
                line: 3,
                offset: 50,
              },
              value: [
                {
                  end: {
                    column: 3,
                    line: 3,
                    offset: 51,
                  },
                  name: 'BigIntLiteral',
                  start: {
                    column: 2,
                    line: 3,
                    offset: 50,
                  },
                  value: '0',
                },
              ],
            },
          },
          {
            end: {
              column: 9,
              line: 3,
              offset: 57,
            },
            name: 'Identifier',
            start: {
              column: 5,
              line: 3,
              offset: 53,
            },
            value: 'OP_0',
          },
          {
            end: {
              column: 11,
              line: 3,
              offset: 59,
            },
            name: 'BigIntLiteral',
            start: {
              column: 10,
              line: 3,
              offset: 58,
            },
            value: '0',
          },
          {
            end: {
              column: 16,
              line: 3,
              offset: 64,
            },
            name: 'HexLiteral',
            start: {
              column: 12,
              line: 3,
              offset: 60,
            },
            value: '00',
          },
          {
            end: {
              column: 24,
              line: 3,
              offset: 72,
            },
            name: 'Evaluation',
            start: {
              column: 17,
              line: 3,
              offset: 65,
            },
            value: {
              end: {
                column: 23,
                line: 3,
                offset: 71,
              },
              name: 'Script',
              start: {
                column: 19,
                line: 3,
                offset: 67,
              },
              value: [
                {
                  end: {
                    column: 23,
                    line: 3,
                    offset: 71,
                  },
                  name: 'Identifier',
                  start: {
                    column: 19,
                    line: 3,
                    offset: 67,
                  },
                  value: 'OP_0',
                },
              ],
            },
          },
          {
            end: {
              column: 34,
              line: 3,
              offset: 82,
            },
            name: 'Push',
            start: {
              column: 25,
              line: 3,
              offset: 73,
            },
            value: {
              end: {
                column: 33,
                line: 3,
                offset: 81,
              },
              name: 'Script',
              start: {
                column: 26,
                line: 3,
                offset: 74,
              },
              value: [
                {
                  end: {
                    column: 33,
                    line: 3,
                    offset: 81,
                  },
                  name: 'Evaluation',
                  start: {
                    column: 26,
                    line: 3,
                    offset: 74,
                  },
                  value: {
                    end: {
                      column: 32,
                      line: 3,
                      offset: 80,
                    },
                    name: 'Script',
                    start: {
                      column: 28,
                      line: 3,
                      offset: 76,
                    },
                    value: [
                      {
                        end: {
                          column: 32,
                          line: 3,
                          offset: 80,
                        },
                        name: 'Identifier',
                        start: {
                          column: 28,
                          line: 3,
                          offset: 76,
                        },
                        value: 'OP_0',
                      },
                    ],
                  },
                },
              ],
            },
          },
          {
            end: {
              column: 57,
              line: 3,
              offset: 105,
            },
            name: 'Evaluation',
            start: {
              column: 35,
              line: 3,
              offset: 83,
            },
            value: {
              end: {
                column: 56,
                line: 3,
                offset: 104,
              },
              name: 'Script',
              start: {
                column: 37,
                line: 3,
                offset: 85,
              },
              value: [
                {
                  end: {
                    column: 43,
                    line: 3,
                    offset: 91,
                  },
                  name: 'Push',
                  start: {
                    column: 37,
                    line: 3,
                    offset: 85,
                  },
                  value: {
                    end: {
                      column: 42,
                      line: 3,
                      offset: 90,
                    },
                    name: 'Script',
                    start: {
                      column: 38,
                      line: 3,
                      offset: 86,
                    },
                    value: [
                      {
                        end: {
                          column: 41,
                          line: 3,
                          offset: 89,
                        },
                        name: 'BigIntLiteral',
                        start: {
                          column: 39,
                          line: 3,
                          offset: 87,
                        },
                        value: '-1',
                      },
                    ],
                  },
                },
                {
                  end: {
                    column: 49,
                    line: 3,
                    offset: 97,
                  },
                  name: 'Push',
                  start: {
                    column: 44,
                    line: 3,
                    offset: 92,
                  },
                  value: {
                    end: {
                      column: 48,
                      line: 3,
                      offset: 96,
                    },
                    name: 'Script',
                    start: {
                      column: 45,
                      line: 3,
                      offset: 93,
                    },
                    value: [
                      {
                        end: {
                          column: 47,
                          line: 3,
                          offset: 95,
                        },
                        name: 'BigIntLiteral',
                        start: {
                          column: 46,
                          line: 3,
                          offset: 94,
                        },
                        value: '1',
                      },
                    ],
                  },
                },
                {
                  end: {
                    column: 56,
                    line: 3,
                    offset: 104,
                  },
                  name: 'Identifier',
                  start: {
                    column: 50,
                    line: 3,
                    offset: 98,
                  },
                  value: 'OP_ADD',
                },
              ],
            },
          },
          {
            end: {
              column: 4,
              line: 7,
              offset: 173,
            },
            name: 'Comment',
            start: {
              column: 1,
              line: 4,
              offset: 106,
            },
            value:
              '*\n * A multi-line comment 🚀\n * Followed by some UTF8Literals',
          },
          {
            end: {
              column: 6,
              line: 8,
              offset: 179,
            },
            name: 'UTF8Literal',
            start: {
              column: 1,
              line: 8,
              offset: 174,
            },
            value: 'abc',
          },
          {
            end: {
              column: 13,
              line: 8,
              offset: 186,
            },
            name: 'UTF8Literal',
            start: {
              column: 7,
              line: 8,
              offset: 180,
            },
            value: "'🧙'",
          },
          {
            end: {
              column: 24,
              line: 9,
              offset: 210,
            },
            name: 'Comment',
            start: {
              column: 1,
              line: 9,
              offset: 187,
            },
            value: 'a comment at the end',
          },
        ],
      },
    },
    stringifyTestVector(result)
  );
});
