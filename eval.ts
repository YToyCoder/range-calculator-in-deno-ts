import { rc_eval } from "./main.ts"

Deno.args.forEach(value => {
  try {
    const r = rc_eval(value)
    console.log(r.toString())
  }catch(e){
    console.error(e.toString());
  }
})