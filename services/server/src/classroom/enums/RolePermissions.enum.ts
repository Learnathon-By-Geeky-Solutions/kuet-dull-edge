/*
The Plan
One single source of truth for all the permissions in the application.
If greater than 2^32
use the later box

Use a function to generate these arrays

Or use big int for execution
customize after fetching and during write

*/

//make all members constant
//Obj.freeze(Permissions)

class PermissionEnum {
  private static _instance: PermissionEnum = null

  private constructor() {}

  static getOne() {
    if (PermissionEnum._instance) {
      return PermissionEnum._instance
    }
    PermissionEnum._instance = new PermissionEnum()
    return PermissionEnum._instance
  }

  chunk = 32n

  OWNER = 1n << 0n
  MANAGE_ROLES = 1n << 1n
  UPDATE_CLASSROOM = 1n << 2n
  DELTE_CLASSROOM = 1n << 3n

  decode(num: bigint) {
    const arr = []
    while (num) {
      //may need to reverse
      // the lower index should have the lower bits
      arr.push(Number(num & ((1n << this.chunk) - 1n)))
      num >>= this.chunk
    }
    return arr
  }

  encode(numbers: number[]) {
    let res = 0n
    // traverse in reverse
    for (let i = numbers.length - 1; i >= 0; i--) {
      const num = numbers[i]
      res <<= this.chunk
      res |= BigInt(num)
    }
    return res
  }
}

export const Permission: PermissionEnum = Object.freeze(PermissionEnum.getOne())
