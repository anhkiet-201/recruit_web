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
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('recruitment')
export class RecruitmentController {
  constructor(private readonly recruitmentService: RecruitmentService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new recruitment post' })
  create(@Body() post: CreatePostDto) {
    return this.recruitmentService.createPost(post);
  }

  @Get()
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
  @ApiOperation({ summary: 'Semantic search for jobs' })
  @ApiQuery({ name: 'q', required: true, type: String })
  search(@Query('q') query: string) {
    return this.recruitmentService.searchSemantic(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a recruitment post by ID' })
  findOne(@Param('id') id: string) {
    return this.recruitmentService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a recruitment post' })
  update(
    @Param('id') id: string,
    @Body() updateData: Partial<RecruitmentPost>,
  ) {
    return this.recruitmentService.update(id, updateData);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a recruitment post' })
  remove(@Param('id') id: string) {
    return this.recruitmentService.remove(id);
  }
}
