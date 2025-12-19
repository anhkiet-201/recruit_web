import { Controller, Get, Post, Body, Param, Delete, UseGuards } from '@nestjs/common';
import { TagsService } from './tags.service';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('tags')
@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) { }

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Post()
  create(@Body() createTagDto: any) {
    return this.tagsService.create(createTagDto);
  }

  @Get()
  findAll() {
    return this.tagsService.findAll();
  }

  @Get('job/:jobId')
  getJobTags(@Param('jobId') jobId: string) {
    return this.tagsService.getJobTags(jobId);
  }

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Post('job/:jobId')
  addTagToJob(@Param('jobId') jobId: string, @Body('tagId') tagId: string) {
    return this.tagsService.addTagToJob(jobId, tagId);
  }

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tagsService.remove(id);
  }

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Delete('job/:jobId/:tagId')
  removeTagFromJob(@Param('jobId') jobId: string, @Param('tagId') tagId: string) {
    return this.tagsService.removeTagFromJob(jobId, tagId);
  }
}
