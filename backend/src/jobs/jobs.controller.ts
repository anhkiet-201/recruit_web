import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, UseInterceptors, UploadedFile, Request } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiConsumes, ApiBody, ApiQuery } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { AiService } from '../ai/ai.service';

@ApiTags('jobs')
@Controller('jobs')
export class JobsController {
  constructor(
    private readonly jobsService: JobsService,
    private readonly aiService: AiService
  ) { }

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Post()
  create(@Body() createJobDto: any) {
    return this.jobsService.create(createJobDto);
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
  findAll(@Query() query: any) {
    return this.jobsService.findAll(query);
  }

  @Get('search')
  @ApiQuery({ name: 'title', required: false })
  @ApiQuery({ name: 'location', required: false })
  @ApiQuery({ name: 'jobType', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async search(@Request() req, @Query() query: any) {
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
  findOne(@Param('id') id: string, @Query('incrementView') incrementView?: string) {
    const shouldIncrement = incrementView !== 'false';
    return this.jobsService.findOne(id, shouldIncrement);
  }

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateJobDto: any) {
    return this.jobsService.update(id, updateJobDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.jobsService.remove(id);
  }
}
