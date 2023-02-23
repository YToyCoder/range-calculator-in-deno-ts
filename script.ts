import { compileAndRunScript } from "./main.ts";
import * as Colors from "https://deno.land/std/fmt/colors.ts"
import { exists } from "https://deno.land/std/fs/mod.ts"

Deno.args.forEach(v => console.log(v))

console.log(`pwd is ${Deno.env.get("PWD")}`);

async function lookupFile(input: string) : Promise<string>{
  if(await exists(input)) return input
  return `${Deno.env.get("PWD")}/${input}`
}

console.log("lookup file");

for await (const i of Deno.args){
  const filepath = await lookupFile(i)
    compileAndRunScript(filepath)
    .catch(e => {
      console.log(Colors.red(e.toString()))
    })
}
