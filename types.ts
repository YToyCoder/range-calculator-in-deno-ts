import { RCValue } from "./Emulator.ts"

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