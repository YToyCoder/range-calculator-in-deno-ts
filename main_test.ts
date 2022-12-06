import { assertEquals, assertFalse} from "https://deno.land/std@0.165.0/testing/asserts.ts";
import { RCValue, RCValueT } from "./Emulator.ts";
import { createToken, TokenType } from "./Lexer.ts";
import { rc_eval } from './main.ts'
import { tokenlize } from './Util.ts'

Deno.test("test number",() => 
{
  assertEquals( rc_eval("1 + 2").number, 3 )
  assertEquals( rc_eval("1 + 2 + 4").number, 7 )
  assertEquals(rc_eval("(1 + 2) + (4 ~ 5) - (3 + 4 )"), new RCValue(RCValueT.RangeValue, 0, 1));
  assertFalse( !rc_eval("(1 + 2) + (4.0 ~ 4.83) - (3 + 4 )").equal(new RCValue(RCValueT.RangeValue, 0.0, 0.83)))
  assertFalse( rc_eval("(1 + 2) + (4.01 ~ 4.83) - (3 + 4 )").equal(new RCValue(RCValueT.RangeValue, 0.0, 0.83)))
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