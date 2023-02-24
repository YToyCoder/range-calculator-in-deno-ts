import * as Colors from "https://deno.land/std@0.167.0/fmt/colors.ts"
import { exists } from "https://deno.land/std@0.177.0/fs/mod.ts"
import { Lexer, LexerFactoryImpl } from "./Lexer.ts"
import { Parser } from "./types.ts"
import { Emulator } from "./Emulator.ts"
import { ParserImpl  } from "./Parser.ts"
import { readline } from "https://deno.land/x/readline@v1.1.0/mod.ts"

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
async function lookupFile(input: string) : Promise<string>{
  if(await exists(input)) return input
  return `${Deno.env.get("PWD")}/${input}`
}

for await (const i of Deno.args){
  const filepath = await lookupFile(i)
    compileAndRunScript(filepath)
    .catch(e => {
      console.log(Colors.red(e.toString()))
    })
}
