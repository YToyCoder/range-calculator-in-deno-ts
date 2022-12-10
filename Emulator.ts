import { errorBuilder } from "./RCError.ts"
import { TreeNode, Visitor, RCValueT, createPureRCValue, createRangeRCValue } from "./types.ts"

export class Emulator implements Visitor {
  readonly variableValues : Map<string,number>
  readonly source: string
  
  constructor(source: string){
    this.variableValues = new Map<string,number>()
    this.source = source
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
      throw errorBuilder()
      .location(node.loc)
      .message("范围操作两边只能是数字")
      .build()
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
      throw errorBuilder()
      .location(node.loc)
      .source(this.source)
      .message(`不存在变量${name}`)
      .build()
      // throw new Error(`couldn't find variable ${name} `)
    return createPureRCValue(value)
  }

}