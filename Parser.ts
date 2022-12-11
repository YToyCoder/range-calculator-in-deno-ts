import { Lexer, Token, TokenType } from "./Lexer.ts";
import { errorBuilder } from "./RCError.ts";
import { AstNodeT, Parser, RCValue, TreeNode, Visitor } from "./types.ts"

export abstract class CommonNode implements TreeNode{
  constructor(value : string | number, type : AstNodeT, loc: number, children : Array<TreeNode> | undefined){
    this.value = value
    this.type = type
    this.children = children
    this.loc = loc
  }
  abstract accept(visitor: Visitor) : RCValue; 
  value: string|number;
  type: AstNodeT;
  children: TreeNode[] | undefined;
  loc: number
}

class AddExpression extends CommonNode{
  accept(visitor : Visitor){
    return visitor.visitAdd(this)
  }
}

class MultiExpression extends CommonNode{
  accept(visitor : Visitor){
    return visitor.visitMulti(this)
  }
}

class DividExpression extends CommonNode{
  accept(visitor : Visitor){
    return visitor.visitDivid(this)
  }
}

class NumExpression extends CommonNode{
  accept(visitor : Visitor){
    return visitor.visitNum(this)
  }
}

class RangeExpression extends CommonNode{
  accept(visitor: Visitor){
    return visitor.visitRange(this)
  }
}

class PowExpression extends CommonNode{
  accept(visitor: Visitor){
    return visitor.visitPow(this)
  }
}

class SubExpression extends CommonNode{
  accept(visitor: Visitor){
    return visitor.visitSub(this)
  }
}

class VariableExpression extends CommonNode{
  accept(visitor: Visitor){
    return visitor.visitVar(this)
  }
}

class AssignmentExpression extends CommonNode{
  accept(visitor: Visitor): RCValue {
    return visitor.visitAssignment(this)
  }
}

/* paser */
function isVariable(token: Token) : boolean{
  return token.type == TokenType.Variable
}

function isOp(token : Token | undefined): boolean{
  return typeof token != 'undefined' && token.type == TokenType.OP
}

export class ParserImpl implements Parser{
  readonly lexer : Lexer 
  
  constructor(lexer : Lexer){
    this.lexer = lexer
  }

  parse() : TreeNode {
    if(!this.lexer.hasNext())
      throw new Error('paser err')
    return this.term(this.lexer)
  }

  /**
   * A -> id "=" E | E 
   */
  private term(lexer : Lexer) : TreeNode {
    if(!lexer.hasNext())
      throw errorBuilder()
      .message("空字符串")
      .build()
    const idOrExpr = this.buildE(lexer)
    function isEqualOp(tok: Token | undefined) : boolean {
      if(typeof tok == "undefined")
        return false
      return tok.type == TokenType.OP && tok.id == '=' 
    }
    if(idOrExpr.type == AstNodeT.Variable && lexer.hasNext() && isEqualOp(lexer.peek())) {
      // id "=" E
      const id = idOrExpr
      const equalOp = lexer.next()
      if(!lexer.hasNext())
        throw errorBuilder()
        .location(equalOp.position)
        .message("赋值语句没有初始化值")
        .build()
      const expr = this.buildE(lexer)
      if(lexer.hasNext())
        throw errorBuilder()
        .location(lexer.next().position - 1)
        .message("语法错误")
        .build()
      return new AssignmentExpression("=",AstNodeT.Assignment, equalOp.position, [id,expr])
    }else if(lexer.hasNext()){
      throw errorBuilder()
      .location(lexer.next().position - 1)
      .message("语法错误")
      .build()
    }
    return idOrExpr
  }

  /**
   * F -> (E) | id | (id ~ id)
   */
  private buildF(lexer : Lexer): TreeNode{
    if(!lexer.hasNext())
      throw new Error('buildF empty')
    const start = lexer.next()
    if(!isOp(start)){
      /** F -> id */
      if(isVariable(start))
        return new VariableExpression(start.id, AstNodeT.Variable, start.position, undefined)
      return new NumExpression(start.id, AstNodeT.NUM, start.position, undefined)
    }
    if(start.id != '(')
      throw errorBuilder()
      .location(start.position)
      .source(lexer.source)
      .message("语法错误")
      .build()
      // throw new Error(`build (F -> (E) | id | (id ~ id)) error , should not start with ${start.id} position (${start.position})`)
    const next = lexer.peek(0)
    const nextNext = lexer.peek(1)
    if(!isOp(next) && nextNext?.id == '~'){
      const range = this.getRange(lexer)
      let rec = undefined
      if(!lexer.hasNext() || (rec = lexer.next()).id != ')'){
        // throw new Error('range has no closingParenthesis!')
        throw errorBuilder()
        .location(rec == undefined ? lexer.source.length - 1 : rec.position)
        .message("范围运算应该写成(a ~ b)")
        .source(lexer.source)
        .build()
      }
      return range
    }
    const ans = this.buildE(lexer)
    let rec = undefined
    if(!lexer.hasNext() || (rec = lexer.next()).id != ')') // pop )
      throw errorBuilder()
      .location(rec == undefined ? lexer.source.length - 1 : rec.position)
      .message("公式错误没有反括号‘)’")
      .source(lexer.source)
      .build()
    return ans
  }

  /**
   * E -> E + T | E - T | T
   */
  private buildE(lexer : Lexer) : TreeNode{

    function opOk(tok : Token | undefined){
      if(typeof tok == "undefined")
        return false
      switch(tok.id){
        case '-':
        case '+':
          return true
        default:
          return false
      }
    }

    if(lexer.hasNext()){
      const start = lexer.peek()
      const left = this.buildT(lexer)
      if(!left)
        errorBuilder()
        .source(lexer.source)
        .location(Number(start?.position))
        .message("语法错误")
        .build()

      if(lexer.hasNext() && opOk(lexer.peek()) ){
        const op = lexer.next()
        const right = this.buildE(lexer)
        switch (op.id) {
          case '+':
            return new AddExpression(op.id, AstNodeT.ADD, op.position, [left, right])
          case '-':
            return new SubExpression(op.id, AstNodeT.SUB, op.position,[left, right])
          default:
            throw errorBuilder()
            .source(lexer.source)
            .location(op.position)
            .message(`无法识别${op.id}操作`)
            .build()
        }
      }
      return left
    }else 
      throw this.unrecognizedError()
  }

  unrecognizedError(){
    return errorBuilder()
    .source(this.lexer.source)
    .location(this.lexer.source.length - 1)
    .message("语法错误")
    .build()
  }

  /**
   * T -> T * F | T ^ F | T/F | F
   */
  private buildT(lexer : Lexer){
    function opOk(tok : Token | undefined){
      if(typeof tok == "undefined")
        return false
      switch(tok.id){
        case '*':
        case '^':
        case '/':
          return true
        default:
          return false
      }
    }

    if(lexer.hasNext()){
      let left = this.buildF(lexer)
      // deno-lint-ignore no-inner-declarations
      function merge(right: TreeNode, op: Token) {
        switch (op.id) {
          case '*':
            return new MultiExpression('*', AstNodeT.MULTI, op.position, [left,right])
          case '^':
            return new PowExpression('^', AstNodeT.POW,op.position, [left, right])
          case '/':
            return new DividExpression('/',AstNodeT.DIVID, op.position, [left, right])
          default:
            throw errorBuilder()
            .location(op.position)
            .message("无法识别运算符")
            .source(lexer.source)
            .build()
        }
      }
      while(lexer.hasNext() && opOk(lexer.peek())){
        const op = lexer.next()
        const right = this.buildF(lexer)
        left = merge(right,op)
      }
      return left
    }else 
      throw this.unrecognizedError()
      // new Error('lexer empty when build T')
  }

  // ( id ~ id )
  private getRange(lexer: Lexer){
    const left = this.buildF(lexer)
    const rangeOp = lexer.next()
    const right = this.buildF(lexer)
    return new RangeExpression("~", AstNodeT.RANGE, rangeOp.position, [left, right])
  }

}
