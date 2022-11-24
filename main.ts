import { LexerFactoryImpl } from "./Lexer.ts"
import { ParserImpl  } from "./Parser.ts"
import { Emulator, RCValue } from "./Emulator.ts"

export function rc_eval(str : string): RCValue{
  const parser = new ParserImpl(new LexerFactoryImpl(str).create())
  const res : RCValue = parser
  .parse()
  .accept(new Emulator())
  return res
}
