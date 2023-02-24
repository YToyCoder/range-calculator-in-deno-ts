import { errorBuilder } from "./RCError.ts"
import { isDigital, isLetter } from "./Util.ts"
export enum TokenType {
  OP,
  Literal,
  Variable
}

export interface Token {
  id : string,
  type : number,
  position : number
}

export function createToken(Id : string, type : number, position : number) : Token {
  return {
    id : Id,
    type,
    position
  }
}

function isOp(str: string): boolean {
  return /[\*|\^|+|\-|=|/|~/(|)]/.test(str)
}

export interface Lexer {
  next() : Token 
  peek(index?:number) : Token | undefined
  hasNext() : boolean
  source : string
  varsExport(): Map<string,Array<number>>
}

export interface LexerFactory{
  create() : Lexer
}

export class LexerFactoryImpl implements LexerFactory {
  readonly source : string
  constructor(_s : string){
    this.source = _s
  }

  create(): Lexer {
    return new LexerImpl(this.source)
  }

}

class LexerImpl implements Lexer {

  readonly source : string
  private position  = 0
  private buffer : Array<Token> = []
  private vars : Map<string,Array<number>> 

  constructor(source : string){
    this.source = source
    this.vars = new Map()
  }
  varsExport(): Map<string,number[]> {
    return this.vars
  }

  next(): Token {
    if(this.buffer.length == 0 && !this.hasNext()){
      throw new Error('eof')
    }
    if(this.buffer.length == 0)
      this.buffer = [this.fetchToken()]
    return this.buffer.splice(0, 1)[0]
  }

  peek(index?: number|undefined): Token|undefined {
  
    index = typeof index == 'undefined' ? 0 : index
    if(index < this.buffer.length)
      return this.buffer[index]
    let sizeOfToken2fetch = index - this.buffer.length + 1
    while(sizeOfToken2fetch > 0 && this.hasNext()){
      this.buffer.push(this.fetchToken())
      sizeOfToken2fetch--
    }
    return sizeOfToken2fetch > 0 ? undefined : this.buffer[index]
  }
  hasNext(): boolean {
    this.ignoreSpace()
    return this.buffer.length > 0 || this.position < this.source.length
  }

  fetchToken() : Token {
    this.ignoreSpace()
    const c = this.source[this.position]
    if(isDigital(c)){
      return this.handleDigital()
    }else if(isLetter(c)){
      return this.handleIdentifier()
    }else if(isOp(c)){
      return this.handleOp(c)
    }else{
      const e = errorBuilder()
      .source(this.source)
      .message(`无法识别语句<${JSON.stringify(c)}>`)
      .location(this.position)
      .build()
      throw e
    }
  }

  private handleOp(c : string){
    switch(c){
      case "+":
      case "-":
      case "*":
      case "/":
        if(this.position+1 < this.source.length && this.source[this.position + 1] == "="){
          const recordPos = this.position
          this.position += 2
          return createToken(this.source.substring(recordPos, recordPos + 2), TokenType.OP, recordPos)
        }
        return createToken(this.source[this.position], TokenType.OP, this.position++)
      default:
        return createToken(this.source[this.position], TokenType.OP, this.position++)
    }
  }

  private handleIdentifier() : Token {
    const recordPos = this.position
    while(this.position < this.source.length && isLetter(this.source[this.position]))
      this.position++
    const id = this.source.substring(recordPos, this.position)
    // this.vars.set(id, recordPos)
    if(!this.vars.has(id)){
      this.vars.set(id,[])
    }
    this.vars.get(id)?.push(recordPos)
    return createToken(id, id == "print" ? TokenType.OP : TokenType.Variable, recordPos)
  }

  private ignoreSpace(){
    const source = this.source
    while(
      source.length > this.position && 
      /[ |\r|\n]/.test(source[this.position])
    ) this.position++
  }

  private handleDigital(): Token {
    const recordPos = this.position
    while(this.position < this.source.length && isDigital(this.source[this.position])){
      this.position++;
    }
    if(this.position >= this.source.length || this.source[this.position] != "."){
      return createToken(this.source.substring(recordPos, this.position),TokenType.Literal, recordPos)
    }
    this.position++
    while(this.position < this.source.length && isDigital(this.source[this.position])){
      this.position++
    }

    return createToken(this.source.substring(recordPos, this.position), TokenType.Literal, recordPos)
  }
}