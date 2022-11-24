export function isLetter(char : string) : boolean {
  return /^[a-zA-Z]/.test(char)
}

export function isDigital(char : string) : boolean {
  return /^[0-9]/.test(char)
}