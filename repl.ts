import * as Colors from "https://deno.land/std@0.167.0/fmt/colors.ts"
import { readline } from "https://deno.land/x/readline@v1.1.0/mod.ts"
import { Emulator } from "./Emulator.ts";
import { LexerFactoryImpl } from "./Lexer.ts";
import { ParserImpl } from "./Parser.ts";

const welcome = `
welcome to ${ Colors.yellow("range calculator") }.
author : ${Colors.blue("forsilence")}
`

console.log(welcome);

function success(str : string) : void {
  console.log(Colors.green(str));
}

function err(str: string) : void {
  console.log(Colors.red(str));
}

function print(str:string) : void {
  Deno.stdout.write(new TextEncoder().encode(str))
}

const arrow = "> "
print(arrow)
const emulator = new Emulator("")

const textDecoder = new TextDecoder() 
const EndCode = "#"

for await (const line of readline(Deno.stdin)){
  // console.log(`line: ${new TextDecoder().decode(line)}`);
  try {
    const source = textDecoder.decode(line).trim()
    if(source == EndCode)
      Deno.exit(0)
    emulator.setSource(source)
    success(
      new ParserImpl(new LexerFactoryImpl(source).create())
      .parse()
      .accept(emulator)
      .toString()
    )
    // success(rc_eval(source).toString())
    print(arrow)
    continue
  }catch(e){
    err(e.toString())
    print(arrow)
  }
}
