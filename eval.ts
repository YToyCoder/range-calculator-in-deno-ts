import { rc_eval } from "./main.ts"
import * as Colors from "https://deno.land/std/fmt/colors.ts"

function evalPureString(code: string){
  try {
    const r = rc_eval(code)
    console.log(Colors.green(r.toString()))
  }catch(e){
    console.error(Colors.red(e.toString()));
  }
}

Deno.args.forEach(evalPureString)
