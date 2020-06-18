/**
 * This file is derived from https://github.com/jneen/parsimmon and
 * https://github.com/DefinitelyTyped/DefinitelyTyped.
 */
/* eslint-disable prefer-destructuring, @typescript-eslint/unified-signatures, functional/no-method-signature, functional/no-throw-statement, functional/no-conditional-statement, @typescript-eslint/no-this-alias, consistent-this, @typescript-eslint/ban-ts-comment, prefer-spread, @typescript-eslint/restrict-template-expressions, func-names, @typescript-eslint/init-declarations, new-cap, @typescript-eslint/require-array-sort-compare, guard-for-in, no-plusplus, functional/no-let, functional/no-loop-statement, @typescript-eslint/prefer-for-of, @typescript-eslint/restrict-plus-operands, functional/immutable-data, @typescript-eslint/no-use-before-define, @typescript-eslint/strict-boolean-expressions, no-param-reassign, functional/no-expression-statement, functional/no-this-expression, @typescript-eslint/no-explicit-any, func-style, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return, @typescript-eslint/naming-convention, @typescript-eslint/method-signature-style */
// cspell: ignore accum

interface Index {
  /** zero-based character offset */
  offset: number;
  /** one-based line offset */
  line: number;
  /** one-based column offset */
  column: number;
}

interface Mark<T> {
  start: Index;
  end: Index;
  value: T;
}

interface Node<Name extends string, T> extends Mark<T> {
  name: Name;
}

type Result<T> = Success<T> | Failure;

interface Success<T> {
  status: true;
  value: T;
}

interface Failure {
  status: false;
  expected: string[];
  index: Index;
}

type TypedRule<TLanguageSpec> = {
  [P in keyof TLanguageSpec]: (
    r: TypedLanguage<TLanguageSpec>
  ) => Parser<TLanguageSpec[P]>;
};

type TypedLanguage<TLanguageSpec> = {
  [P in keyof TLanguageSpec]: Parser<TLanguageSpec[P]>;
};

interface Parser<T> {
  parse(input: string): Result<T>;
  or<U>(otherParser: Parser<U>): Parser<T | U>;
  then<U>(call: (result: T) => Parser<U>): Parser<U>;
  then<U>(anotherParser: Parser<U>): Parser<U>;
  map<U>(call: (result: T) => U): Parser<U>;
  skip<U>(otherParser: Parser<U>): Parser<T>;
  many(): Parser<T[]>;
  mark(): Parser<Mark<T>>;
  node<Name extends string>(name: Name): Parser<Node<Name, T>>;
  desc(description: string | string[]): Parser<T>;
  sepBy<U>(separator: Parser<U>): Parser<T[]>;
}

function Parsimmon(action: any) {
  // @ts-expect-error
  if (!(this instanceof Parsimmon)) {
    // @ts-expect-error
    return new Parsimmon(action);
  }
  // @ts-expect-error
  this._ = action;
}

const _ = Parsimmon.prototype;

// -*- Helpers -*-

function makeSuccess(index: any, value: any) {
  return {
    expected: [],
    furthest: -1,
    index,
    status: true,
    value,
  };
}

function makeFailure(index: any, expected: any) {
  expected = [expected];
  return {
    expected,
    furthest: index,
    index: -1,
    status: false,
    value: null,
  };
}

function mergeReplies(result: any, last: any) {
  if (!last) {
    return result;
  }
  if (result.furthest > last.furthest) {
    return result;
  }
  const expected =
    result.furthest === last.furthest
      ? union(result.expected, last.expected)
      : last.expected;
  return {
    expected,
    furthest: last.furthest,
    index: result.index,
    status: result.status,
    value: result.value,
  };
}

function makeLineColumnIndex(input: any, i: any) {
  const lines = input.slice(0, i).split('\n');
  /*
   * Note that unlike the character offset, the line and column offsets are
   * 1-based.
   */
  const lineWeAreUpTo = lines.length;
  const columnWeAreUpTo = lines[lines.length - 1].length + 1;
  return {
    column: columnWeAreUpTo,
    line: lineWeAreUpTo,
    offset: i,
  };
}

// Returns the sorted set union of two arrays of strings
function union(xs: any, ys: any) {
  const obj = {};
  for (let i = 0; i < xs.length; i++) {
    // @ts-expect-error
    obj[xs[i]] = true;
  }
  for (let j = 0; j < ys.length; j++) {
    // @ts-expect-error
    obj[ys[j]] = true;
  }
  const keys = [];
  for (const k in obj) {
    keys.push(k);
  }
  keys.sort();
  return keys;
}

// -*- Error Formatting -*-

function flags(re: any) {
  const s = String(re);
  return s.slice(s.lastIndexOf('/') + 1);
}

function anchoredRegexp(re: any) {
  return RegExp(`^(?:${re.source})`, flags(re));
}

// -*- Combinators -*-

function seq(...params: any[]) {
  const parsers: any[] = [].slice.call(params);
  const numParsers = parsers.length;
  return Parsimmon(function (input: any, i: any) {
    let result;
    const accum = new Array(numParsers);
    for (let j = 0; j < numParsers; j += 1) {
      result = mergeReplies(parsers[j]._(input, i), result);
      if (!result.status) {
        return result;
      }
      accum[j] = result.value;
      i = result.index;
    }
    return mergeReplies(makeSuccess(i, accum), result);
  });
}

function seqMap<T, U>(p1: Parser<T>, cb: (a1: T) => U): Parser<U>;
function seqMap<T, U, V>(
  p1: Parser<T>,
  p2: Parser<U>,
  cb: (a1: T, a2: U) => V
): Parser<V>;
function seqMap<T, U, V, W>(
  p1: Parser<T>,
  p2: Parser<U>,
  p3: Parser<V>,
  cb: (a1: T, a2: U, a3: V) => W
): Parser<W>;
function seqMap<T, U, V, W, X>(
  p1: Parser<T>,
  p2: Parser<U>,
  p3: Parser<V>,
  p4: Parser<W>,
  cb: (a1: T, a2: U, a3: V, a4: W) => X
): Parser<X>;
function seqMap<T, U, V, W, X, Y>(
  p1: Parser<T>,
  p2: Parser<U>,
  p3: Parser<V>,
  p4: Parser<W>,
  p5: Parser<X>,
  cb: (a1: T, a2: U, a3: V, a4: W, a5: X) => Y
): Parser<Y>;
function seqMap(...params: any[]) {
  const args = [].slice.call(params);
  const mapper = args.pop();
  return seq.apply(null, args).map(function (results: any) {
    // @ts-expect-error
    return mapper.apply(null, results);
  });
}

function createLanguage<TLanguageSpec>(parsers: TypedRule<TLanguageSpec>) {
  const language = {} as TypedLanguage<TLanguageSpec>;
  for (const key in parsers) {
    (function (rule: string) {
      const func = function () {
        // @ts-expect-error
        return parsers[rule](language);
      };
      // @ts-expect-error
      language[rule] = lazy(func);
    })(key);
  }
  return language;
}

function alt(...params: any[]) {
  const parsers: any[] = [].slice.call(params);
  return Parsimmon(function (input: any, i: any) {
    let result;
    for (let j = 0; j < parsers.length; j += 1) {
      result = mergeReplies(parsers[j]._(input, i), result);
      if (result.status) {
        return result;
      }
    }
    return result;
  });
}

function sepBy(parser: any, separator: any) {
  return sepBy1(parser, separator).or(succeed([]));
}

function sepBy1(parser: any, separator: any) {
  const pairs = separator.then(parser).many();
  return seqMap(parser, pairs, function (r: any, rs: any) {
    return [r].concat(rs);
  });
}

// -*- Core Parsing Methods -*-

_.parse = function (input: any) {
  const result = this.skip(eof)._(input, 0);
  if (result.status) {
    return {
      status: true,
      value: result.value,
    };
  }
  return {
    expected: result.expected,
    index: makeLineColumnIndex(input, result.furthest),
    status: false,
  };
};

// -*- Other Methods -*-

_.or = function (alternative: any) {
  return alt(this, alternative);
};

_.then = function (next: any) {
  return seq(this, next).map(function (results: any) {
    return results[1];
  });
};

_.many = function () {
  const self = this;

  return Parsimmon(function (input: any, i: any) {
    const accum = [];
    let result;

    for (;;) {
      result = mergeReplies(self._(input, i), result);
      if (result.status) {
        /* istanbul ignore if */ if (i === result.index) {
          throw new Error(
            'infinite loop detected in .many() parser --- calling .many() on ' +
              'a parser which can accept zero characters is usually the cause'
          );
        }
        i = result.index;
        accum.push(result.value);
      } else {
        return mergeReplies(makeSuccess(i, accum), result);
      }
    }
  });
};

_.map = function (fn: any) {
  const self = this;
  return Parsimmon(function (input: any, i: any) {
    const result = self._(input, i);
    if (!result.status) {
      return result;
    }
    return mergeReplies(makeSuccess(result.index, fn(result.value)), result);
  });
};

_.skip = function (next: any) {
  return seq(this, next).map(function (results: any) {
    return results[0];
  });
};

_.node = function (name: any) {
  return seqMap(index, this, index, function (
    start: any,
    value: any,
    end: any
  ) {
    return {
      end,
      name,
      start,
      value,
    };
  });
};

_.sepBy = function (separator: any) {
  return sepBy(this, separator);
};

_.desc = function (expected: any) {
  expected = [expected];
  const self = this;
  return Parsimmon(function (input: any, i: any) {
    const reply = self._(input, i);
    if (!reply.status) {
      reply.expected = expected;
    }
    return reply;
  });
};

// -*- Constructors -*-

function string(str: string): Parser<string> {
  const expected = `'${str}'`;
  return Parsimmon(function (input: any, i: any) {
    const j = i + str.length;
    const head = input.slice(i, j);
    if (head === str) {
      return makeSuccess(j, head);
    }
    return makeFailure(i, expected);
  });
}

function regexp(re: RegExp, group = 0): Parser<string> {
  const anchored = anchoredRegexp(re);
  const expected = String(re);
  return Parsimmon(function (input: any, i: any) {
    const match = anchored.exec(input.slice(i));
    if (match) {
      const fullMatch = match[0];
      const groupMatch = match[group];
      return makeSuccess(i + fullMatch.length, groupMatch);
    }
    return makeFailure(i, expected);
  });
}

function succeed(value: any) {
  return Parsimmon(function (__: any, i: any) {
    return makeSuccess(i, value);
  });
}

function lazy(f: any) {
  const parser = Parsimmon(function (input: any, i: any) {
    parser._ = f()._;
    return parser._(input, i);
  });

  return parser;
}

// -*- Base Parsers -*-

const index = Parsimmon(function (input: any, i: any) {
  return makeSuccess(i, makeLineColumnIndex(input, i));
});

const eof = Parsimmon(function (input: any, i: any) {
  if (i < input.length) {
    return makeFailure(i, 'EOF');
  }
  return makeSuccess(i, null);
});

const optWhitespace = regexp(/\s*/u).desc('optional whitespace');
const whitespace = regexp(/\s+/u).desc('whitespace');

export const P = {
  alt,
  createLanguage,
  index,
  lazy,
  makeFailure,
  makeSuccess,
  of: succeed,
  optWhitespace,
  regexp,
  sepBy,
  sepBy1,
  seq,
  seqMap,
  string,
  succeed,
  whitespace,
};
