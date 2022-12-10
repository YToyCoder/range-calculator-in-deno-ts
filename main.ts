import { LexerFactoryImpl } from "./Lexer.ts"
import { ParserImpl  } from "./Parser.ts"
import { Emulator } from "./Emulator.ts"
import { EvalBuilder, RCValue  } from "./types.ts"
import { errorBuilder } from "./RCError.ts";

export function rc_eval(str : string): RCValue{
  const parser = new ParserImpl(new LexerFactoryImpl(str).create())
  const res : RCValue = parser
  .parse()
  .accept(new Emulator(str))
  return res
}

export class EvalBuilderImpl implements EvalBuilder{
  private emulator : Emulator | undefined
  private env : Map<string, number> 

  constructor();
  constructor(em: Emulator)
  constructor( _emulator ?: Emulator){
    this.emulator = _emulator 
    this.env = new Map()
  }

  setEnv(name: string,value: number): EvalBuilder {
    this.env.set(name, value)
    return this;
  }

  eval(source: string): RCValue {
    if(!this.emulator)
      this.emulator = new Emulator(source)
    this.env.forEach((val, key) => this.emulator?.set(key, val))
    const lexer = new LexerFactoryImpl(source).create()
    const tree = new ParserImpl(lexer)
      .parse()
    const vars = lexer.varsExport()
    this.env.forEach((_, key) => vars.delete(key))
    if(vars.size > 0){
      const eb = errorBuilder().source(source)
      let msg = "变量"
      vars.forEach((val, key) => {
        val.forEach(loc => eb.location(loc))
        msg += ` ${key}`
      })
      msg += "不存在"
      throw eb
      .message(msg)
      .build()
    }
    return tree.accept(this.emulator)
  }
}
