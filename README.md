### range-calculator-in-deno-ts

[range-calculator](https://github.com/forsilence/range-calculator)

能够计算包含范围的算式, 如:

运行如下命令,将会打印`(4.010 ~ 4.200)`
```
deno run eval.ts "1 + 2 + (1.01 ~ 1.20)" 
```

友好的错误提示,例如输入`deno run eval.ts "1 + 2 + (1.01 ~ 1.20"`, 将会打印:
```txt
1 + 2 + (1.01 ~ 1.20
                   ^
范围运算应该写成(a ~ b)
```

代码中使用
```ts
import { EvalBuilderImpl } from 'main.ts'
import { RCValue } from "types.ts"

const r : RCValue = new EvalBuilderImpl()
.setEnv("a",1.0)
.setEnv("b",2.0)
.eval("a + b + (1.001 ~ 1.201)")
console.log(r.toString())
// log 
// (4.001 ~ 4.201)
```

[deno](https://deno.land/)
