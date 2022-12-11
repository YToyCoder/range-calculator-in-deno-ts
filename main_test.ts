import { assertEquals, assertFalse} from "https://deno.land/std@0.165.0/testing/asserts.ts";
import { createPureRCValue, createRangeRCValue, RCValue, RCValueT } from "./types.ts";
import { createToken, LexerFactoryImpl, TokenType } from "./Lexer.ts";
import { compileToRCValue, EvalBuilderImpl, rc_eval, VarsEvaluator } from './main.ts'
import { tokenlize } from './Util.ts'
import { errorBuilder } from "./RCError.ts";

function errorTest(source: string) {
  try{
    // new EvalBuilderImpl()
    // .eval(source)
    rc_eval(source)
  }catch(e){
    console.error(e.toString());
  }
}

Deno.test("test number",() => 
{
  assertEquals( rc_eval("1 + 2").number, 3 )
  assertEquals( rc_eval("1 + 2 + 4").number, 7 )
  assertEquals(rc_eval("(1 + 2) + (4 ~ 5) - (3 + 4 )"), new RCValue(RCValueT.RangeValue, 0, 1));
  assertFalse( !rc_eval("(1 + 2) + (4.0 ~ 4.83) - (3 + 4 )").equal(new RCValue(RCValueT.RangeValue, 0.0, 0.83)))
  assertFalse( rc_eval("(1 + 2) + (4.01 ~ 4.83) - (3 + 4 )").equal(new RCValue(RCValueT.RangeValue, 0.0, 0.83)))
  const res = new EvalBuilderImpl()
    .setEnv('a', 1.0)
    .setEnv('b', 10)
    .setEnv('k', -1)
    .eval("(a + b * (20 + k)) + (2 ~ 3)")
  try {
    new EvalBuilderImpl()
    .eval("a + 2 * a")
  }catch(e){
    e._source = "a + 2 * a"
    console.error(e.toString())
    // throw e.toString()
  }
  console.log(res.toString())
  console.log((new RCValue(RCValueT.RangeValue, 0.0, 0.83)).toString());
});

Deno.test("test double", () => {
  const toks = tokenlize("2.10 + 20.30 - 4");
  assertEquals(toks[0], createToken("2.10", TokenType.Literal, 0))
  assertEquals(toks[1], createToken("+", TokenType.OP, 5))
  assertEquals(toks[2], createToken("20.30", TokenType.Literal, 7))
  assertEquals(toks[3], createToken("-", TokenType.OP, 13))
  assertEquals(toks[4], createToken("4", TokenType.Literal, 15))
})

Deno.test("error report", () => {
  const erm = errorBuilder()
  .source("1 + 2 + 3")
  .location(0)
  .location(2)
  .message("message")
  .build()
  console.log(erm.toString());
})

Deno.test("lexer error report", () => {
  const lexer = (new LexerFactoryImpl("1>>")).create()
  try {
    while(lexer.hasNext()){
      const n = lexer.next()
    }
  }catch(e){
    console.log(e.toString());
    
  }
})

Deno.test({
  name: "error",
  fn: () => {
    errorTest("22 + (3 * 4")
    errorTest("(3+2)-")
    errorTest("2-3 * 4 ( 2 ^ 10 )")
    errorTest("(2.001 ~ 3.002) - a * 10")
    errorTest("(2.001 ~ 3.002) - a * 10 + build + 3.004")
  }
})

function try_with(fn: () => void){
  try {
    fn()
  }catch(e){
    console.error(e.toString())
    
  }
}

Deno.test({
  name: "var evaluator",
  fn: () => {
    try_with(
      () => {
        new VarsEvaluator()
        .setEnv("a")
        .eval("a + b + c")
      }
    )

    try_with(
      () => {
        new VarsEvaluator()
        .eval("(3 ~ 4)")
      }
    )
  }
})

Deno.test("compile string to RCValue", () => {
  assertEquals( compileToRCValue("1.0"), createPureRCValue(1.0))
  assertEquals( compileToRCValue("(1.0 ~ 1.23)"), createRangeRCValue(1.0,1.23))
  assertEquals( compileToRCValue("1.0 ~ 1.23"), createRangeRCValue(1.0,1.23))
})