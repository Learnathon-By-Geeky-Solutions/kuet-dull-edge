import { IsNotEmpty, IsString, MinLength, MaxLength, Matches } from 'class-validator'
import { OAuthOnboardingDto as IOAuthOnboardingDto } from '../../../interfaces/auth.interfaces'
import { OnboardingDto } from './onboarding.dto'

export class OAuthOnboardingDto extends OnboardingDto implements IOAuthOnboardingDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(20)
  @Matches(/^[a-zA-Z0-9_.]{3,20}$/)
  username: string
}
