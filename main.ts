import { Lexer, LexerFactoryImpl } from "./Lexer.ts"
import { ParserImpl  } from "./Parser.ts"
import { Emulator } from "./Emulator.ts"
import { AstNodeT, createPureRCValue, EvalBuilder, Parser, RCValue  } from "./types.ts"
import { errorBuilder } from "./RCError.ts";
import { readline } from "https://deno.land/x/readline@v1.1.0/mod.ts"

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
    // console.log(JSON.stringify(tree, null, 2))
    // const vars = lexer.varsExport()
    // this.env.forEach((_, key) => vars.delete(key))
    // if(vars.size > 0){
    //   const eb = errorBuilder().source(source)
    //   let msg = "变量"
    //   vars.forEach((val, key) => {
    //     val.forEach(loc => eb.location(loc))
    //     msg += ` ${key}`
    //   })
    //   msg += "不存在"
    //   throw eb
    //   .message(msg)
    //   .build()
    // }
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

enum EvaluatingPhase {
  uinit, // un init
  initialized,  // init
  running, // runnning
  finished // end
}

type EvaluatingContext = {
  lexer: Lexer | undefined // lexer
  parser: Parser | undefined // parser
  evaluator: Emulator | undefined // emulator
  filename: string // source filename
  ln: number // line number
  phase: EvaluatingPhase // phase stat
}

// 
function createEvaluatingContext(filename: string): EvaluatingContext{
  return  {
    lexer: undefined,
    parser: undefined,
    evaluator: new Emulator(filename),
    filename,
    ln: -1,
    phase: EvaluatingPhase.uinit,
  }
}

function evaluatingPhaseChecking(ec: EvaluatingContext, expect: EvaluatingPhase | Array<EvaluatingPhase>): void {
  if(expect instanceof Array<EvaluatingPhase>){
    if(!expect.some(i => i === ec.phase)){
      throw {toString: () => "not in right pahse"}
    }
  }else if(ec.phase !== expect){
    throw {toString: () => "not in right phase"}
  }
}

const linephase : EvaluatingPhase[] = [EvaluatingPhase.uinit, EvaluatingPhase.initialized]
function perpareLexerAndParser(ec:EvaluatingContext ,linecode: string): void{
  evaluatingPhaseChecking(ec, linephase)
  // init lexer and parser
  const lexer = new LexerFactoryImpl(linecode).create()
  const parser = new ParserImpl(lexer)
  ec.lexer = lexer
  ec.parser = parser
}

function lineEvaluatingPrepare(ec: EvaluatingContext, line: string): void {
  perpareLexerAndParser(ec, line) // lexer and parser 
  ec.phase = EvaluatingPhase.initialized
  ec.ln++
}

function execLine(ec: EvaluatingContext): void {
  const tree = ec.parser?.parse()
  if(ec.evaluator == undefined)
    throw {toString: ()=>"evaluator not exists"}
  tree?.accept(ec.evaluator)
}

export async function compileAndRunScript(fname: string): Promise<void> {
  const decoder = new TextDecoder()
  const econtext = createEvaluatingContext(fname)
  const f = await Deno.open(fname)
  for await (const line of readline(f)){
    const dcline = decoder.decode(line)
    if(dcline.length <= 1) continue
    lineEvaluatingPrepare(econtext, dcline)
    execLine(econtext)
  }
}