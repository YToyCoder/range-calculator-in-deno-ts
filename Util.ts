import { LexerFactoryImpl, Token } from "./Lexer.ts"

export function isLetter(char : string) : boolean {
  return /^[a-zA-Z]/.test(char)
}

export function isDigital(char : string) : boolean {
  return /^[0-9]/.test(char)
}

export function tokenlize(source : string) : Array<Token> {
  const factory = new LexerFactoryImpl(source)
  const lexer = factory.create();
  const tokens : Array<Token> = []
  while(lexer.hasNext()){
    tokens.push(lexer.next())
  }
  return tokens
}