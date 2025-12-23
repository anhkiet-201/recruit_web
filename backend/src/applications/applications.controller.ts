import { Controller, Get, Post, Body, Patch, Param, UseGuards, Request } from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('applications')
@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) { }

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Post()
  submit(@Request() req, @Body() createApplicationDto: any) {
    return this.applicationsService.submitApplication(req.user.userId, createApplicationDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Get('my')
  getMyApplications(@Request() req) {
    return this.applicationsService.getMyApplications(req.user.userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Get('employer')
  getEmployerApplications(@Request() req) {
    if (req.user.role !== 'employer' && req.user.role !== 'admin') {
      throw new Error('Bạn không có quyền thực hiện hành động này.');
    }
    return this.applicationsService.getEmployerApplications(req.user.userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Get()
  findAll(@Request() req) {
    if (req.user.role !== 'admin') {
      throw new Error('Bạn không có quyền thực hiện hành động này.');
    }
    return this.applicationsService.findAll();
  }

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.applicationsService.updateStatus(id, status);
  }
}
