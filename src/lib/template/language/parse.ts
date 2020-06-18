import { ParseResult } from './language-types';
import { P } from './parsimmon';

/* eslint-disable sort-keys, @typescript-eslint/naming-convention, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
const authenticationScriptParser = P.createLanguage({
  script: (r) =>
    P.seqMap(
      P.optWhitespace,
      r.expression.sepBy(P.optWhitespace),
      P.optWhitespace,
      (_, expressions) => expressions
    ).node('Script'),
  expression: (r) =>
    P.alt(
      r.comment,
      r.push,
      r.evaluation,
      r.utf8,
      r.binary,
      r.hex,
      r.bigint,
      r.identifier
    ),
  comment: (r) =>
    P.alt(r.singleLineComment, r.multiLineComment).node('Comment'),
  singleLineComment: () =>
    P.seqMap(
      P.string('//').desc("the start of a single-line comment ('//')"),
      P.regexp(/[^\n]*/u),
      (__, comment) => comment.trim()
    ),
  multiLineComment: () =>
    P.seqMap(
      P.string('/*').desc("the start of a multi-line comment ('/*')"),
      P.regexp(/[\s\S]*?\*\//u).desc(
        "the end of this multi-line comment ('*/')"
      ),
      (__, comment) => comment.slice(0, -'*/'.length).trim()
    ),
  push: (r) =>
    P.seqMap(
      P.string('<').desc("the start of a push statement ('<')"),
      r.script,
      P.string('>').desc("the end of this push statement ('>')"),
      (_, push) => push
    ).node('Push'),
  evaluation: (r) =>
    P.seqMap(
      P.string('$').desc("the start of an evaluation ('$')"),
      P.string('(').desc("the opening parenthesis of this evaluation ('(')"),
      r.script,
      P.string(')').desc("the closing parenthesis of this evaluation (')')"),
      (_, __, evaluation) => evaluation
    ).node('Evaluation'),
  identifier: () =>
    P.regexp(/[a-zA-Z_][.a-zA-Z0-9_-]*/u)
      .desc('a valid identifier')
      .node('Identifier'),
  utf8: () =>
    P.alt(
      P.seqMap(
        P.string('"').desc('a double quote (")'),
        P.regexp(/[^"]*/u),
        P.string('"').desc('a closing double quote (")'),
        (__, literal) => literal
      ),
      P.seqMap(
        P.string("'").desc("a single quote (')"),
        P.regexp(/[^']*/u),
        P.string("'").desc("a closing single quote (')"),
        (__, literal) => literal
      )
    ).node('UTF8Literal'),
  hex: () =>
    P.seqMap(
      P.string('0x').desc("a hex literal ('0x...')"),
      P.regexp(/[0-9a-f]_*(?:_*[0-9a-f]_*[0-9a-f]_*)*[0-9a-f]/iu).desc(
        'a valid hexadecimal string'
      ),
      (__, literal) => literal
    ).node('HexLiteral'),
  binary: () =>
    P.seqMap(
      P.string('0b').desc("a binary literal ('0b...')"),
      P.regexp(/[01]+(?:[01_]*[01]+)*/iu).desc('a string of binary digits'),
      (__, literal) => literal
    ).node('BinaryLiteral'),
  bigint: () =>
    P.regexp(/-?[0-9]+(?:[0-9_]*[0-9]+)*/u)
      .desc('an integer literal')
      .node('BigIntLiteral'),
});
/* eslint-enable sort-keys, @typescript-eslint/naming-convention, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */

export const parseScript = (script: string) =>
  authenticationScriptParser.script.parse(script) as ParseResult;
