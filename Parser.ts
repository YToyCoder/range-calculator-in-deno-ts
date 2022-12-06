import { Lexer, Token, TokenType } from "./Lexer.ts";
import { AstNodeT, Parser, TreeNode, Visitor } from "./types.ts"

export abstract class CommonNode implements TreeNode{
  constructor(value : string | number, type : AstNodeT, children : Array<TreeNode> | undefined){
    this.value = value
    this.type = type
    this.children = children
  }
  abstract accept(visitor: Visitor) : any; 
  value: string|number;
  type: AstNodeT;
  children: TreeNode[] | undefined;
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
    return this.buildE(this.lexer)
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
        return new VariableExpression(start.id, AstNodeT.Variable, undefined)
      return new NumExpression(start.id, AstNodeT.NUM, undefined)
    }
    if(start.id != '(')
      throw new Error(`build (F -> (E) | id | (id ~ id)) error , should not start with ${start.id} position (${start.position})`)
    const next = lexer.peek(0)
    const nextNext = lexer.peek(1)
    if(!isOp(next) && nextNext?.id == '~'){
      const range = this.getRange(lexer)
      if(lexer.next().id != ')'){
        throw new Error('range has no closingParenthesis!')
      }
      return range
    }
    const ans = this.buildE(lexer)
    if(!lexer.hasNext() || lexer.next().id != ')') // pop )
      throw new Error('pase () error : has no )')
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
      const left = this.buildT(lexer)
      if(!left)
        throw new Error('buildE error left is build as undefined')
      if(lexer.hasNext() && opOk(lexer.peek()) ){
        const op = lexer.next()
        if(!isOp(op))
          throw new Error(`pase error! it's not op ${op.id} ${op.position} ${op.type} : OP ${op}  .`)
        const right = this.buildE(lexer)
        switch (op.id) {
          case '+':
            return new AddExpression(op.id, AstNodeT.ADD, [left, right])
          case '-':
            return new SubExpression(op.id, AstNodeT.SUB, [left, right])
          default:
            throw new Error('operator error')
        }
      }
      return left
    }else 
      throw new Error('lexer empty when build e')
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
            return new MultiExpression('*', AstNodeT.MULTI, [left,right])
          case '^':
            return new PowExpression('^', AstNodeT.POW, [left, right])
          case '/':
            return new DividExpression('/',AstNodeT.DIVID, [left, right])
          default:
            throw new Error(`error in operator `)
        }
      }
      while(lexer.hasNext() && opOk(lexer.peek())){
        const op = lexer.next()
        if(!opOk(op))
          throw new Error(`build T op is ${op.id}`)
        const right = this.buildF(lexer)
        left = merge(right,op)
      }
      return left
    }else 
      throw new Error('lexer empty when build T')
  }

  // ( id ~ id )
  private getRange(lexer: Lexer){
    const left = this.buildF(lexer)
    const rangeOp = lexer.next()
    if(rangeOp.id != '~')
      throw new Error('getRange error')
    const right = this.buildF(lexer)
    return new RangeExpression("~", AstNodeT.RANGE, [left, right])
  }

}
