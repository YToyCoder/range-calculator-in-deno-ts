import { TreeNode, Visitor } from "./types.ts"


export enum RCValueT {
  PureNumber ,
  RangeValue 
}

function createPureRCValue(value : number){
  return new RCValue(RCValueT.PureNumber, value )
}

function createRangeRCValue(left : number , right : number ) {
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
    const rangeEqual : () => boolean = () => valueEqual(Number(this.leftN), Number(other.leftN), delta) && valueEqual(Number(this.rightN), Number(this.rightN), delta)
    return other.type == this.type && (this.type == RCValueT.PureNumber ? numberEqual() : rangeEqual())
  }

  add(other : RCValue){
    // console.log(`-> add ${JSON.stringify(this)} ${JSON.stringify(other)}`);
    return this.threeCases(other, (a : number, b : number) => a + b)
  }

  divide(other : RCValue){
    // console.log(`-> divide ${JSON.stringify(this)} ${JSON.stringify(other)}`);
    if(this.type == RCValueT.RangeValue && typeof this.leftN != 'undefined' && typeof this.rightN != 'undefined' && typeof other.number != "undefined")
      return createRangeRCValue(this.leftN / other.number, this.rightN / other.number)
    return createPureRCValue(Number(this.number) / Number(other.number))
  }

  multi(other : RCValue){
    // console.log(`-> multi ${JSON.stringify(this)} ${JSON.stringify(other)}`);
    return this.threeCases(other, (a, b) => a * b)
  }

  threeCases(other : RCValue, method : (a : number, b : number) => number){
    if(this.type == RCValueT.RangeValue)
      return createRangeRCValue(method(Number(this.leftN) , Number(other.number)), method(Number(this.rightN), Number(other.number)))
    else if(other.type == RCValueT.RangeValue)
      return createRangeRCValue(method(Number(this.number), Number(other.leftN)), method(Number(this.number), Number(other.rightN)))
    return createPureRCValue(method(Number(this.number), Number(other.number)))
  }

  power(other : RCValue){
    // console.log(`-> power ${JSON.stringify(this)} ${JSON.stringify(other)}`);
    return this.threeCases(other, (a, b) => a ** b)
  }

  sub(other : RCValue){
    // console.log(`-> sub ${JSON.stringify(this)} ${JSON.stringify(other)}`);
    return this.threeCases(other, (a, b) => a - b)
  }

}

export class Emulator implements Visitor {
  readonly variableValues : Map<string,number>
  
  constructor(){
    this.variableValues = new Map<string,number>()
  }

  set(name : string, value : number){
    this.variableValues.set(name, value)
    return this
  }


  visitBinary(node : TreeNode, method : string){
    if(typeof node.children == 'undefined')
      throw new Error('')
    const { children : [left, right] } = node
    const lV = left.accept(this)
    const rV = right.accept(this)
    // console.log(`-> visiting binary ${JSON.stringify(method)} ${JSON.stringify(lV)} ${JSON.stringify(rV)}`);
    return lV[method](rV)
  }

  visitMulti(node:TreeNode){
    return this.visitBinary(node,'multi')
  }

  visitAdd(node: TreeNode){
    return this.visitBinary(node,'add')
  }

  visitDivid(node:TreeNode){
    return this.visitBinary(node, 'divide')
  }

  visitRange(node: TreeNode){
    if(typeof node.children == 'undefined')
      throw new Error('')
    const {children : [left, right]} = node
    const lV = left.accept(this)
    const rV = right.accept(this)
    if(lV.type != RCValueT.PureNumber || rV.type != RCValueT.PureNumber){
      throw new Error("between range(~) operator, the value should be PureNumber")
    }
    return createRangeRCValue(lV.number,rV.number)
  }

  visitPow(node : TreeNode){
    return this.visitBinary(node, 'power')
  }

  visitSub(node : TreeNode){
    return this.visitBinary(node, 'sub')
  }

  visitNum(node: TreeNode){
    // return new NumExpression(node.number, astType.NUM, undefined)
    // console.log(`-> visit number ${JSON.stringify(node)}`);
    return createPureRCValue(Number(node.value))
  }

  visitVar(node : TreeNode){
    const name = node.value
    const value = this.variableValues.get(String(name))
    // console.log(`-> visit var ${JSON.stringify(node)}`);
    if( !value )
      throw new Error(`couldn't find variable ${name} `)
    return createPureRCValue(value)
  }

}