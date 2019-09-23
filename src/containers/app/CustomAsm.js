import 'brace/mode/assembly_x86';

export class CustomHighlightRules extends window.ace.acequire("ace/mode/text_highlight_rules").TextHighlightRules {
  constructor() {
    super();
    this.$rules = {
      "start": [{
        token: "constant.character.hexadecimal.assembly",
        regex: "\\b(?:goto|cond_goto|move|set|add|sub|load|write|or)",
        caseInsensitive: true
      }, {
        token: "variable.parameter.register.assembly",
        regex: "\\b(?:R1|R2|R3)",
        caseInsensitive: true
      },
      { token: 'constant.character.decimal.assembly',
         regex: '\\b[0-9]+\\b' },
         { token: 'support.function.directive.assembly',
           regex: "\\b(?:M[(0-9)]*)",
           caseInsensitive: true },
         { token: 'string.assembly', regex: /'([^\\']|\\.)*'/ },
         { token: 'string.assembly', regex: /"([^\\"]|\\.)*"/ },
         { token: 'comment.assembly', regex: ';.*$' }]
    };
  }
}

export default class CustomAsm extends window.ace.acequire('ace/mode/assembly_x86').Mode {
  constructor() {
    super();
    this.HighlightRules = CustomHighlightRules;
  }
}