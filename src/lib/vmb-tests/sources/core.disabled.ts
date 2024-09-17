import type { VmbTestDefinitionGroup } from '../../lib.js';

export default [
  [
    'Disabled/unknown operations',
    [
      // TODO: all OP_UNKNOWNs
      ['<0>', 'OP_IF OP_RESERVED OP_ENDIF <1>', 'OP_RESERVED is standard if not executed'],
      ['<1>', 'OP_IF OP_RESERVED OP_ENDIF <1>', 'OP_RESERVED fails evaluation if executed', ['invalid']],
      ['<0>', 'OP_IF OP_VER OP_ENDIF <1>', 'OP_VER is standard if not executed'],
      ['<1>', 'OP_IF OP_VER OP_ENDIF <1>', 'OP_VER fails evaluation if executed', ['invalid']],
      ['<0>', 'OP_IF OP_VERIF OP_ENDIF <1>', 'OP_VERIF fails evaluation even if not executed', ['invalid']],
      ['<0>', 'OP_IF OP_VERNOTIF OP_ENDIF <1>', 'OP_VERNOTIF fails evaluation even if not executed', ['invalid']],
      ['<0>', 'OP_IF OP_RETURN OP_ENDIF <1>', 'OP_RETURN is standard if not executed'],
      ['<1>', 'OP_IF OP_RETURN OP_ENDIF <1>', 'OP_RETURN fails evaluation if executed', ['invalid']],
      ['<0>', 'OP_IF OP_INVERT OP_ENDIF <1>', 'OP_INVERT fails evaluation even if not executed', ['invalid']],
      ['<0>', 'OP_IF OP_RESERVED1 OP_ENDIF <1>', 'OP_RESERVED1 is standard if not executed'],
      ['<1>', 'OP_IF OP_RESERVED1 OP_ENDIF <1>', 'OP_RESERVED1 fails evaluation if executed', ['invalid']],
      ['<0>', 'OP_IF OP_RESERVED2 OP_ENDIF <1>', 'OP_RESERVED2 is standard if not executed'],
      ['<1>', 'OP_IF OP_RESERVED2 OP_ENDIF <1>', 'OP_RESERVED2 fails evaluation if executed', ['invalid']],
      ['<0>', 'OP_IF OP_2MUL OP_ENDIF <1>', 'OP_2MUL fails evaluation even if not executed', ['invalid']],
      ['<0>', 'OP_IF OP_2DIV OP_ENDIF <1>', 'OP_2DIV fails evaluation even if not executed', ['invalid']],
      ['<0>', 'OP_IF OP_LSHIFT OP_ENDIF <1>', 'OP_LSHIFT fails evaluation even if not executed', ['invalid']],
      ['<0>', 'OP_IF OP_RSHIFT OP_ENDIF <1>', 'OP_RSHIFT fails evaluation even if not executed', ['invalid']],
    ],
  ],
] as const satisfies VmbTestDefinitionGroup[];
