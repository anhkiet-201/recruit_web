import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RecruitmentService } from './recruitment.service';
import { RecruitmentPost } from './model';
import { CreatePostDto } from './recruitment.dto';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Recruitment')
@Controller('recruitment')
export class RecruitmentController {
  constructor(private readonly recruitmentService: RecruitmentService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new recruitment post' })
  create(@Body() post: CreatePostDto) {
    return this.recruitmentService.createPost(post);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all recruitment posts' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  findAll(
    @Query('limit') limit: string = '10',
    @Query('offset') offset: string = '0',
  ) {
    return this.recruitmentService.findAll(+limit, +offset);
  }

  @Get('search')
  @ApiOperation({
    summary: 'Semantic search for jobs with pagination - PUBLIC',
  })
  @ApiQuery({ name: 'query', required: true, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'threshold', required: false, type: Number })
  search(
    @Query('query') query: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('threshold') threshold: string = '0.5',
  ) {
    return this.recruitmentService.searchSemantic(
      query,
      +page,
      +limit,
      +threshold,
    );
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a recruitment post by ID' })
  findOne(@Param('id') id: string) {
    return this.recruitmentService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a recruitment post' })
  update(
    @Param('id') id: string,
    @Body() updateData: Partial<RecruitmentPost>,
  ) {
    return this.recruitmentService.update(id, updateData);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a recruitment post' })
  remove(@Param('id') id: string) {
    return this.recruitmentService.remove(id);
  }
}
