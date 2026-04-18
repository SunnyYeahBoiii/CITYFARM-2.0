import { IsString, IsNotEmpty } from 'class-validator';

export class LogCareDto {
  @IsString()
  @IsNotEmpty()
  taskId: string;
}