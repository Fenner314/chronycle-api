import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ReplayRequestDto {
  @ApiProperty()
  @IsString()
  id: string;
}
