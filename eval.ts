import { rc_eval } from "./main.ts"
import * as Colors from "https://deno.land/std/fmt/colors.ts"

Deno.args.forEach(value => {
  try {
    const r = rc_eval(value)
    console.log(Colors.green(r.toString()))
  }catch(e){
    console.error(Colors.red(e.toString()));
  }
})