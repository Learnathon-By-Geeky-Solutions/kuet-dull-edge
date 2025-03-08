import { SetMetadata } from '@nestjs/common'

import { PERMISSION_KEY } from '../../common/constants'

export const PermissionRequired = (permission: bigint) =>
  SetMetadata(PERMISSION_KEY, permission)
