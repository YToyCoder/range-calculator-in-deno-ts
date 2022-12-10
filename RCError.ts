import { RCError, RCErrorBuilder } from './types.ts'

class RCErrorImpl implements RCError{
  readonly _source: string
  readonly _message: string
  readonly _location: number[]

  constructor(source: string, message: string, location: number[]){
    this._source = source
    this._message = message
    this._location = location
  }
  errorMark(): string {

    let arraw = ""
    for(let i = 0; i<this._source.length; i++){
      const inlocation = this._location.filter((value)=> value == i).length > 0 
      if(inlocation){
        arraw += "^"
      }else {
        arraw += " "
      }
    }
    return arraw;
  }

  source(): string {
    return this._source
  }
  message(): string {
    return this._message
  }
  location(): number[] {
    return this._location
  }

  toString(): string {
    return `${this._source}\n${this.errorMark()}\n${this.message()}`
  }
}

class RCErrorBuilderImpl implements RCErrorBuilder {
  source(source: string): RCErrorBuilder {
    this._s = source
    return this
  }
  message(message: string): RCErrorBuilder {
    this._m = message
    return this
  }
  location(loc: number): RCErrorBuilder {
    this._locs.push(loc)
    return this
  }
  _s!: string
  _m!: string
  _locs: Array<number>

  constructor(){
    this._s = ""
    this._m = ""
    this._locs = []
  }
  build(): RCError {
    return new RCErrorImpl(this._s, this._m, this._locs)
  }
}

export function errorBuilder() : RCErrorBuilder{
  return new RCErrorBuilderImpl()
}