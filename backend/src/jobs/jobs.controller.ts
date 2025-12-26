import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  UseInterceptors,
  UploadedFile,
  Request,
} from '@nestjs/common';
import { JobsService } from './jobs.service';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { AiService } from '../ai/ai.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import type { RequestWithUser } from '../types/auth';

interface JobQuery {
  page?: number;
  limit?: number;
  status?: string;
  authorId?: string;
  title?: string;
  location?: string;
  jobType?: string;
}

@ApiTags('jobs')
@Controller('jobs')
export class JobsController {
  constructor(
    private readonly jobsService: JobsService,
    private readonly aiService: AiService,
  ) {}

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Post()
  create(@Request() req: RequestWithUser, @Body() createJobDto: CreateJobDto) {
    return this.jobsService.create(createJobDto, req.user);
  }

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Post('import')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  importJobs(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new Error('File is required');
    return this.jobsService.importFromExcel(file);
  }

  @Get()
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'authorId', required: false })
  findAll(@Query() query: JobQuery) {
    return this.jobsService.findAll(query);
  }

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Patch(':id/approve')
  approve(
    @Param('id') id: string,
    @Body('status') status: 'ACTIVE' | 'REJECTED' | 'DRAFT',
    @Request() req: RequestWithUser,
  ) {
    if (req.user.role !== 'admin') {
      throw new Error('Bạn không có quyền thực hiện hành động này.');
    }
    return this.jobsService.approveJob(id, status);
  }

  @Get('search')
  @ApiQuery({ name: 'title', required: false })
  @ApiQuery({ name: 'location', required: false })
  @ApiQuery({ name: 'jobType', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async search(@Request() req: RequestWithUser, @Query() query: JobQuery) {
    const userId = req.user?.userId;

    const guestId = req.headers['x-guest-id'] as string;
    return this.jobsService.search({ ...query, userId, guestId });
  }

  @Get('ai-search')
  @ApiQuery({ name: 'q', required: true })
  aiSearch(@Query('q') query: string) {
    return this.aiService.findSimilarJobs(query);
  }

  @Get('locations')
  getLocations() {
    return this.jobsService.getLocations();
  }

  @Get('suggestions')
  getSuggestions() {
    return this.jobsService.getSuggestions();
  }

  @Get('trending')
  getTrending(@Query('limit') limit?: number) {
    return this.jobsService.getTrendingJobs(limit);
  }

  @Get('hot')
  getHot(@Query('limit') limit?: number) {
    return this.jobsService.getHotJobs(limit);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Query('incrementView') incrementView?: string,
  ) {
    const shouldIncrement = incrementView !== 'false';
    return this.jobsService.findOne(id, shouldIncrement);
  }

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateJobDto: UpdateJobDto,
    @Request() req: RequestWithUser,
  ) {
    return this.jobsService.update(id, updateJobDto, req.user);
  }

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.jobsService.remove(id);
  }
}
