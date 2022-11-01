import ohm from 'ohm-js'

// This grammar is intended to parse links so that links are either hidden
// from the user, or parsed into HTML in the popup view.
// I recommend testing in https://ohmjs.org/editor/
const linksGrammar = `
Links {
	start = recurse
    recurse = (mainLink | mainBacklink | text)*
    mainLink = (~link text)* xspaces link xspaces recurse
    mainBacklink = (~backlink text)* xspaces backlink xspaces recurse
   	text = any
    link = "[" (~"]" text)* "]" "(" (~")" text)* ")"
    backlink = "[[" (~"]]" text)* "]]"
    xspaces = (" " | "\\r\\n" | "\\n")*
}
`

export const grammar = ohm.grammar(linksGrammar)
export const hideLinkSemantics = grammar.createSemantics()
hideLinkSemantics.addOperation('eval()', {
  start(recurse) {
    const result = recurse.eval()
    return result
  },
  recurse(items) {
    let result = ''
    items.children.map((item) => {
      const innerRes = item.eval()
      result += innerRes
    })
    return result
  },
  mainLink(text, spaces1, link, spaces2, recurse) {
    return text.sourceString + spaces1.sourceString + link.eval() + spaces2.sourceString + recurse.eval()
  },
  mainBacklink(text, spaces1, backlink, spaces2, recurse) {
    return text.sourceString + spaces1.sourceString + backlink.eval() + spaces2.sourceString + recurse.eval()
  },
  text(char) {
    return char.sourceString
  },
  // Importantly, we hide the link URLs.
  link(lb1, text, rb1, lb2, link, rb2) {
    return text.sourceString
  },
  backlink(lb1, text, rb1) {
    return text.sourceString
  },
},
)

// Here's a deeply nested object version:
//   Start(recurse) {
//     return recurse.eval()
//   },
//   recurse(items) {
//     return items.children.map(item => item.eval())
//   },
//   mainLink(text, spaces1, link, spaces2, recurse) {
//     return {
//       text: text.sourceString,
//       link: link.eval(),
//       recurse: recurse.eval(),
//     }
//   },
//   mainBacklink(text, spaces1, backlink, spaces2, recurse) {
//     return {
//       text: text.sourceString,
//       backlink: backlink.eval(),
//       recurse: recurse.eval(),
//     }
//   },
//   text(char) {
//     return char.sourceString
//   },
//   link(lb1, text, rb1, lb2, link, rb2) {
//     return {
//       text: text.sourceString,
//       link: link.sourceString,
//     }
//   },
//   backlink(lb1, text, rb1) {
//     return {
//       text: text.sourceString,
//     }
//   },
// }
