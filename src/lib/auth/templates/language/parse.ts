import * as P from './parsimmon.js';

/**
 * TODO: @types/parsimmon is not in use because of some early hacks. Ideally,
 * this can be cleaned up by converting parsimmon.js to TypeScript, and trimming
 * out the parts we don't need.
 */
const authenticationScriptParser = P.createLanguage({
  script: r =>
    P.seqMap(
      P.regexp(/[\s]*/),
      r.expression.sepBy(P.regexp(/[\s]+/)).node('Script'),
      P.regexp(/[\s]*/),
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
  comment: r =>
    P.alt(r.singleLineComment, r.multiLineComment)
      .desc('a comment')
      .node('Comment'),
  singleLineComment: _ =>
    P.seqMap(
      P.string('//'),
      P.regexp(/[^\n]*/),
      P.string('\n'),
      (__, comment) => comment.trim()
    ),
  multiLineComment: _ =>
    P.seqMap(
      P.string('/*'),
      P.regexp(/[\s\S]*(?=\*\/)/),
      P.string('*/'),
      (__, comment) => comment.trim()
    ),
  push: r =>
    // tslint:disable-next-line: no-unsafe-any
    P.seqMap(P.string('<'), r.script, P.string('>'), (_, push) => push)
      .desc('a push expression')
      .node('Push'),
  evaluation: r =>
    P.seqMap(
      P.string('$('),
      r.script,
      P.string(')'),
      // tslint:disable-next-line: no-unsafe-any
      (_, evaluation) => evaluation
    )
      .desc('an evaluation expression')
      .node('Evaluation'),
  identifier: _ =>
    P.regexp(/[a-zA-Z_][\.a-zA-Z0-9_-]*/)
      .desc('a valid identifier')
      .node('Identifier'),
  utf8: _ =>
    P.alt(
      P.seqMap(
        P.string('"'),
        P.regexp(/[^"]*/),
        P.string('"'),
        (__, literal) => literal
      ),
      P.seqMap(
        P.string("'"),
        P.regexp(/[^']*/),
        P.string("'"),
        (__, literal) => literal
      )
    )
      .desc('a UTF8 literal')
      .node('UTF8Literal'),
  hex: _ =>
    P.seqMap(
      P.string('0x'),
      P.regexp(/(?:[0-9a-f]{2})+/i).desc('a valid hexadecimal string'),
      (__, literal) => literal
    )
      .desc('a hexadecimal literal')
      .node('HexLiteral'),
  bigint: (
    _ // TODO: support negative numbers – add tests for positive and negative numbers at each byte length
  ) =>
    P.regexp(/[0-9]+/)
      .desc('an integer')
      .map(BigInt)
      .desc('an integer literal')
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

interface BitAuthProgramSegment extends MarkedNode {
  name: string;
}

interface BitAuthStringSegment extends BitAuthProgramSegment {
  name: StringSegmentType;
  value: string;
}

interface BitAuthBigIntSegment extends BitAuthProgramSegment {
  name: 'BigIntLiteral';
  value: bigint;
}

interface BitAuthRecursiveSegment extends BitAuthProgramSegment {
  name: RecursiveSegmentType;
  value: BitAuthScriptSegment;
}

export interface BitAuthScriptSegment extends BitAuthProgramSegment {
  name: 'Script';
  value: Array<
    BitAuthRecursiveSegment | BitAuthBigIntSegment | BitAuthStringSegment
  >;
}

export type ParseResult =
  | { expected: string[]; index: SourcePosition; status: false }
  | { status: true; value: BitAuthScriptSegment };

export const parseBitAuthScript = (script: string): ParseResult =>
  authenticationScriptParser.script.parse(script);
