import { TreeNode, Visitor, RCValueT, createPureRCValue, createRangeRCValue } from "./types.ts"

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
    return createPureRCValue(Number(node.value))
  }

  visitVar(node : TreeNode){
    const name = node.value
    const value = this.variableValues.get(String(name))
    if( !value )
      throw new Error(`couldn't find variable ${name} `)
    return createPureRCValue(value)
  }

}