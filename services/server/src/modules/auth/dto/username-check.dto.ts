import { IsNotEmpty, IsString, Matches, MinLength, MaxLength } from 'class-validator';

export class UsernameCheckDto {
    @IsNotEmpty()
    @IsString()
    @MinLength(3)
    @MaxLength(20)
    @Matches(/^[a-zA-Z0-9_.]{3,20}$/, {
        message: 'Username can only contain letters, numbers, and underscores',
    })
    username: string;
}