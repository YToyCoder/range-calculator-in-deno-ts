export enum AstNodeT {
  MULTI ,
  DIVID ,
  NUM ,
  RANGE ,
  POW ,
  ADD ,
  SUB ,
  Parenthesis ,
  Variable 
}

export interface Parser {
  parse() : TreeNode
}

export interface TreeNode {
  readonly value : string | number
  readonly type : AstNodeT 
  readonly children : Array<TreeNode> | undefined
  accept(visitor : Visitor) : any 
}

export interface Visitor{

  visitMulti(node : TreeNode): RCValue

  visitAdd(node : TreeNode) : RCValue

  visitDivid(node : TreeNode) : RCValue

  visitRange(node : TreeNode) : RCValue

  visitPow(node : TreeNode) : RCValue

  visitSub(node : TreeNode) : RCValue

  visitNum(node : TreeNode) : RCValue

  visitVar(node : TreeNode) : RCValue
}

export interface EvalBuilder {
  setEnv(name: string, value : number) : EvalBuilder
  eval(source : string) : RCValue
}

export enum RCValueT {
  PureNumber ,
  RangeValue 
}

export function createPureRCValue(value : number){
  return new RCValue(RCValueT.PureNumber, value )
}

export function createRangeRCValue(left : number , right : number ) {
  return new RCValue(RCValueT.RangeValue, left, right)
}

export class RCValue {
  readonly number : number | undefined
  readonly leftN : number | undefined
  readonly rightN : number | undefined
  readonly type : RCValueT

  constructor(ty_ : RCValueT, num : number);
  constructor(ty_ : RCValueT, num : number, theOther : number)

  constructor(ty_ : RCValueT, num : number , theOther ?: number ){
    this.type = ty_
    if(typeof theOther != 'undefined' || theOther != null){
      this.leftN = num
      this.rightN = theOther
    }else {
      this.number = num
    }
  }

  toString(){
    if(this.type == RCValueT.PureNumber)
      return this.number
    else if(this.type == RCValueT.RangeValue) {
      const a = Number(this.leftN);
      const b = Number(this.rightN);
      return `(${Math.min(a, b)} ~ ${Math.max(a,b)})`
    }
    return "Error Type";
  }

  equal(other : RCValue, delta ?: number): boolean {
    function valueEqual(a: number, b : number, delta ?: number) {
      return typeof delta == 'undefined' ? a == b : Math.abs(a - b) <= delta
    }
    const numberEqual : () => boolean = () => valueEqual(Number(this.number), Number(other.number), delta)
    const rangeEqual : () => boolean = () => 
      valueEqual(Number(this.leftN), Number(other.leftN), delta) && valueEqual(Number(this.rightN), Number(this.rightN), delta)
    return other.type == this.type && (this.type == RCValueT.PureNumber ? numberEqual() : rangeEqual())
  }

  add(other : RCValue){
    return this.threeCases(other, (a : number, b : number) => a + b)
  }

  divide(other : RCValue){
    if(this.type == RCValueT.RangeValue && 
      typeof this.leftN != 'undefined' && 
      typeof this.rightN != 'undefined' && 
      typeof other.number != "undefined"
    ) {
      return createRangeRCValue(this.leftN / other.number, this.rightN / other.number)
    }else {
      return createPureRCValue(Number(this.number) / Number(other.number))
    }
  }

  multi(other : RCValue){
    return this.threeCases(other, (a, b) => a * b)
  }

  threeCases(other : RCValue, method : (a : number, b : number) => number){
    if(this.type == RCValueT.RangeValue)
      return createRangeRCValue(
        method(Number(this.leftN) , Number(other.number)), 
        method(Number(this.rightN), Number(other.number))
      )
    else if(other.type == RCValueT.RangeValue)
      return createRangeRCValue(method(Number(this.number), Number(other.leftN)), method(Number(this.number), Number(other.rightN)))
    return createPureRCValue(method(Number(this.number), Number(other.number)))
  }

  power(other : RCValue){
    return this.threeCases(other, (a, b) => a ** b)
  }

  sub(other : RCValue){
    return this.threeCases(other, (a, b) => a - b)
  }

}

