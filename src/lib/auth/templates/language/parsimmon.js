// cspell: ignore accum, contramap, promap

// TODO: convert to TS, remove matching .d.ts file, remove build step

'use strict';

function Parsimmon(action) {
  if (!(this instanceof Parsimmon)) {
    return new Parsimmon(action);
  }
  this._ = action;
}

var _ = Parsimmon.prototype;

// -*- Helpers -*-

function makeSuccess(index, value) {
  return {
    status: true,
    index: index,
    value: value,
    furthest: -1,
    expected: []
  };
}

function makeFailure(index, expected) {
  expected = [expected];
  return {
    status: false,
    index: -1,
    value: null,
    furthest: index,
    expected: expected
  };
}

function mergeReplies(result, last) {
  if (!last) {
    return result;
  }
  if (result.furthest > last.furthest) {
    return result;
  }
  var expected =
    result.furthest === last.furthest
      ? union(result.expected, last.expected)
      : last.expected;
  return {
    status: result.status,
    index: result.index,
    value: result.value,
    furthest: last.furthest,
    expected: expected
  };
}

function makeLineColumnIndex(input, i) {
  var lines = input.slice(0, i).split('\n');
  // Note that unlike the character offset, the line and column offsets are
  // 1-based.
  var lineWeAreUpTo = lines.length;
  var columnWeAreUpTo = lines[lines.length - 1].length + 1;
  return {
    offset: i,
    line: lineWeAreUpTo,
    column: columnWeAreUpTo
  };
}

// Returns the sorted set union of two arrays of strings
function union(xs, ys) {
  var obj = {};
  for (var i = 0; i < xs.length; i++) {
    obj[xs[i]] = true;
  }
  for (var j = 0; j < ys.length; j++) {
    obj[ys[j]] = true;
  }
  var keys = [];
  for (var k in obj) {
    keys.push(k);
  }
  keys.sort();
  return keys;
}

// -*- Error Formatting -*-

function flags(re) {
  var s = '' + re;
  return s.slice(s.lastIndexOf('/') + 1);
}

function anchoredRegexp(re) {
  return RegExp('^(?:' + re.source + ')', flags(re));
}

// -*- Combinators -*-

function seq() {
  var parsers = [].slice.call(arguments);
  var numParsers = parsers.length;
  return Parsimmon(function(input, i) {
    var result;
    var accum = new Array(numParsers);
    for (var j = 0; j < numParsers; j += 1) {
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

function seqMap() {
  var args = [].slice.call(arguments);
  var mapper = args.pop();
  return seq.apply(null, args).map(function(results) {
    return mapper.apply(null, results);
  });
}

function createLanguage(parsers) {
  var language = {};
  for (var key in parsers) {
    (function(key) {
      var func = function() {
        return parsers[key](language);
      };
      language[key] = lazy(func);
    })(key);
  }
  return language;
}

function alt() {
  var parsers = [].slice.call(arguments);
  var numParsers = parsers.length;
  return Parsimmon(function(input, i) {
    var result;
    for (var j = 0; j < parsers.length; j += 1) {
      result = mergeReplies(parsers[j]._(input, i), result);
      if (result.status) {
        return result;
      }
    }
    return result;
  });
}

function sepBy(parser, separator) {
  return sepBy1(parser, separator).or(succeed([]));
}

function sepBy1(parser, separator) {
  var pairs = separator.then(parser).many();
  return seqMap(parser, pairs, function(r, rs) {
    return [r].concat(rs);
  });
}

// -*- Core Parsing Methods -*-

_.parse = function(input) {
  var result = this.skip(eof)._(input, 0);
  if (result.status) {
    return {
      status: true,
      value: result.value
    };
  }
  return {
    status: false,
    index: makeLineColumnIndex(input, result.furthest),
    expected: result.expected
  };
};

// -*- Other Methods -*-

_.or = function(alternative) {
  return alt(this, alternative);
};

_.then = function(next) {
  return seq(this, next).map(function(results) {
    return results[1];
  });
};

_.many = function() {
  var self = this;

  return Parsimmon(function(input, i) {
    var accum = [];
    var result = undefined;

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

_.map = function(fn) {
  var self = this;
  return Parsimmon(function(input, i) {
    var result = self._(input, i);
    if (!result.status) {
      return result;
    }
    return mergeReplies(makeSuccess(result.index, fn(result.value)), result);
  });
};

_.skip = function(next) {
  return seq(this, next).map(function(results) {
    return results[0];
  });
};

_.node = function(name) {
  return seqMap(index, this, index, function(start, value, end) {
    return {
      name: name,
      value: value,
      start: start,
      end: end
    };
  });
};

_.sepBy = function(separator) {
  return sepBy(this, separator);
};

_.desc = function(expected) {
  expected = [expected];
  var self = this;
  return Parsimmon(function(input, i) {
    var reply = self._(input, i);
    if (!reply.status) {
      reply.expected = expected;
    }
    return reply;
  });
};

// -*- Constructors -*-

function string(str) {
  var expected = "'" + str + "'";
  return Parsimmon(function(input, i) {
    var j = i + str.length;
    var head = input.slice(i, j);
    if (head === str) {
      return makeSuccess(j, head);
    } else {
      return makeFailure(i, expected);
    }
  });
}

function regexp(re, group) {
  group = 0;
  var anchored = anchoredRegexp(re);
  var expected = '' + re;
  return Parsimmon(function(input, i) {
    var match = anchored.exec(input.slice(i));
    if (match) {
      var fullMatch = match[0];
      var groupMatch = match[group];
      return makeSuccess(i + fullMatch.length, groupMatch);
    }
    return makeFailure(i, expected);
  });
}

function succeed(value) {
  return Parsimmon(function(input, i) {
    return makeSuccess(i, value);
  });
}

function lazy(f) {
  var parser = Parsimmon(function(input, i) {
    parser._ = f()._;
    return parser._(input, i);
  });

  return parser;
}

// -*- Base Parsers -*-

var index = Parsimmon(function(input, i) {
  return makeSuccess(i, makeLineColumnIndex(input, i));
});

var eof = Parsimmon(function(input, i) {
  if (i < input.length) {
    return makeFailure(i, 'EOF');
  }
  return makeSuccess(i, null);
});

var optWhitespace = regexp(/\s*/).desc('optional whitespace');
var whitespace = regexp(/\s+/).desc('whitespace');

Parsimmon.alt = alt;
Parsimmon.createLanguage = createLanguage;
Parsimmon.index = index;
Parsimmon.lazy = lazy;
Parsimmon.makeFailure = makeFailure;
Parsimmon.makeSuccess = makeSuccess;
Parsimmon.of = succeed;
Parsimmon.optWhitespace = optWhitespace;
Parsimmon.Parser = Parsimmon;
Parsimmon.regexp = regexp;
Parsimmon.sepBy = sepBy;
Parsimmon.sepBy1 = sepBy1;
Parsimmon.seq = seq;
Parsimmon.seqMap = seqMap;
Parsimmon.string = string;
Parsimmon.succeed = succeed;
Parsimmon.whitespace = whitespace;

module.exports = Parsimmon;
