import * as P from './parsimmon.js';

/**
 * TODO: @types/parsimmon is not in use because of some early hacks. Ideally,
 * this can be cleaned up by converting parsimmon.js to TypeScript, and trimming
 * out the parts we don't need.
 */
const authenticationScriptParser = P.createLanguage({
  script: r =>
    P.seqMap(
      P.optWhitespace,
      r.expression.sepBy(P.optWhitespace).node('Script'),
      P.optWhitespace,
      (_, expressions) => expressions
    ),
  // tslint:disable-next-line: object-literal-sort-keys
  expression: r =>
    P.alt(
      r.comment,
      r.push,
      r.evaluation,
      r.utf8,
      r.hex,
      r.bigint,
      r.identifier
    ),
  comment: r => P.alt(r.singleLineComment, r.multiLineComment).node('Comment'),
  singleLineComment: _ =>
    P.seqMap(
      P.string('//').desc("the start of a single-line comment ('//')"),
      P.regexp(/[^\n]*/),
      (__, comment) => comment.trim()
    ),
  multiLineComment: _ =>
    P.seqMap(
      P.string('/*').desc("the start of a multi-line comment ('/*')"),
      P.regexp(/[\s\S]*(?=\*\/)/).desc(
        "the end of this multi-line comment ('*/')"
      ),
      P.string('*/'),
      (__, comment) => comment.trim()
    ),
  push: r =>
    P.seqMap(
      P.string('<').desc("the start of a push statement ('<')"),
      r.script,
      P.string('>').desc("the end of this push statement ('>')"),
      // tslint:disable-next-line: no-unsafe-any
      (_, push) => push
    ).node('Push'),
  evaluation: r =>
    P.seqMap(
      P.string('$').desc("the start of an evaluation ('$')"),
      P.string('(').desc("the opening parenthesis of this evaluation ('(')"),
      r.script,
      P.string(')').desc("the closing parenthesis of this evaluation (')')"),
      // tslint:disable-next-line: no-unsafe-any
      (_, __, evaluation) => evaluation
    ).node('Evaluation'),
  identifier: _ =>
    P.regexp(/[a-zA-Z_][\.a-zA-Z0-9_-]*/)
      .desc('a valid identifier')
      .node('Identifier'),
  utf8: _ =>
    P.alt(
      P.seqMap(
        P.string('"').desc('a double quote (")'),
        P.regexp(/[^"]*/),
        P.string('"').desc('a closing double quote (")'),
        (__, literal) => literal
      ),
      P.seqMap(
        P.string("'").desc("a single quote (')"),
        P.regexp(/[^']*/),
        P.string("'").desc("a closing single quote (')"),
        (__, literal) => literal
      )
    ).node('UTF8Literal'),
  hex: _ =>
    P.seqMap(
      P.string('0x').desc("a hex literal ('0x...')"),
      P.regexp(/(?:[0-9a-f]{2})+/i).desc('a valid hexadecimal string'),
      (__, literal) => literal
    ).node('HexLiteral'),
  bigint: _ =>
    P.regexp(/[\-0-9]+/)
      .desc('an integer literal')
      .map(BigInt)
      .node('BigIntLiteral')
});

export interface SourcePosition {
  column: number;
  line: number;
  offset: number;
}

export interface MarkedNode {
  end: SourcePosition;
  start: SourcePosition;
}

type StringSegmentType =
  | 'Comment'
  | 'Identifier'
  | 'UTF8Literal'
  | 'HexLiteral';

type RecursiveSegmentType = 'Push' | 'Evaluation';

interface BitauthTemplatingLanguageSegment extends MarkedNode {
  name: string;
}

interface BtlStringSegment extends BitauthTemplatingLanguageSegment {
  name: StringSegmentType;
  value: string;
}

interface BtlBigIntSegment extends BitauthTemplatingLanguageSegment {
  name: 'BigIntLiteral';
  value: bigint;
}

interface BtlRecursiveSegment extends BitauthTemplatingLanguageSegment {
  name: RecursiveSegmentType;
  value: BtlScriptSegment;
}

export interface BtlScriptSegment extends BitauthTemplatingLanguageSegment {
  name: 'Script';
  value: Array<BtlRecursiveSegment | BtlBigIntSegment | BtlStringSegment>;
}

export type ParseResult =
  | { expected: string[]; index: SourcePosition; status: false }
  | { status: true; value: BtlScriptSegment };

export const parseScript = (script: string): ParseResult =>
  authenticationScriptParser.script.parse(script);
