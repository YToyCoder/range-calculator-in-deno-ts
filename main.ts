import { LexerFactoryImpl } from "./Lexer.ts"
import { ParserImpl  } from "./Parser.ts"
import { Emulator, RCValue } from "./Emulator.ts"
import { EvalBuilder } from "./types.ts"

export function rc_eval(str : string): RCValue{
  const parser = new ParserImpl(new LexerFactoryImpl(str).create())
  const res : RCValue = parser
  .parse()
  .accept(new Emulator())
  return res
}

export class EvalBuilderImpl implements EvalBuilder{
  readonly emulator : Emulator

  constructor();
  constructor(em: Emulator)
  constructor(_emulator ?: Emulator){
    this.emulator = _emulator ? _emulator : new Emulator()
  }

  setEnv(name: string,value: number): EvalBuilder {
    this.emulator.set(name, value)
    return this;
  }

  eval(source: string): RCValue {
    return new ParserImpl(new LexerFactoryImpl(source).create())
      .parse()
      .accept(this.emulator)
  }
}
