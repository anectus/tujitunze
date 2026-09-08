import { IsString, MaxLength, MinLength } from 'class-validator';

// The app's global ValidationPipe (main.ts) runs this before the
// controller/service ever sees the request — a `q` shorter than 2 chars
// (or missing entirely) is rejected with a 400 here, not by a hand-rolled
// length check inside SearchService.
export class SearchQueryDto {
  @IsString()
  @MinLength(2, { message: 'Search query must be at least 2 characters.' })
  @MaxLength(100)
  q!: string;
}
