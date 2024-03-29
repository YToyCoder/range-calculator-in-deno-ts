import { LexerFactoryImpl } from "./Lexer.ts"
import { ParserImpl  } from "./Parser.ts"
import { Emulator } from "./Emulator.ts"
import { AstNodeT, createPureRCValue, EvalBuilder, RCValue  } from "./types.ts"
import { errorBuilder } from "./RCError.ts";

export function rc_eval(str : string): RCValue{
  return new EvalBuilderImpl().eval(str)
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
    this.env.forEach((val, key) => this.emulator?.set(key, createPureRCValue(val)))
    const lexer = new LexerFactoryImpl(source).create()
    const tree = new ParserImpl(lexer).parse()
    return tree.accept(this.emulator)
  }
}

export class VarsEvaluator {
  private env : Set<string>

  constructor(){
    this.env = new Set()
  }

  setEnv(name: string): VarsEvaluator{
    this.env.add(name)
    return this
  }
  eval(source: string): boolean{
    // this.env.forEach((val, key) => this.emulator?.set(key, val))
    const lexer = new LexerFactoryImpl(source).create()
    new ParserImpl(lexer).parse()
    const vars = lexer.varsExport()
    this.env.forEach((key) => vars.delete(key))
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
    return true
  }
}

export function compileToRCValue(str : string): RCValue{

  str = str.trim()
  if(!str.startsWith("(")){
    str = `(${str})`
  }
  const lexer = new LexerFactoryImpl(str).create()
  const tree = new ParserImpl(lexer).parse()
  switch(tree.type){
    case AstNodeT.RANGE:
      return tree.accept(new Emulator(str))
    case  AstNodeT.NUM:
      return tree.accept(new Emulator(str))
    default:
      throw errorBuilder()
      .message("表达式错误,表达式既不是范围表达式'(a ~ b)'也不是数值表达式`")
      .build()
  }
}
