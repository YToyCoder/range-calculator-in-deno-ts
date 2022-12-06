import { assertEquals } from "https://deno.land/std@0.165.0/testing/asserts.ts";
import { rc_eval } from './main.ts'

Deno.test("test number",() => 
{
  assertEquals( rc_eval("1 + 2").number, 3 )
  assertEquals( rc_eval("1 + 2 + 4").number, 7 )
  console.log(rc_eval("(1 + 2) + (4 ~ 5) - (3 + 4 )"));
});
