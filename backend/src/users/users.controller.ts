import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  UseGuards,
  Request,
  Delete,
  Post,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { RequestWithUser } from '../types/auth';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Post('profile/cv')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
          cb(null, true);
        } else {
          cb(
            new Error('Chỉ cho phép tải lên tệp tin định dạng PDF cho CV'),
            false,
          );
        }
      },
    }),
  )
  uploadCV(
    @Request() req: RequestWithUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new Error('File is required');
    return this.usersService.updateCV(req.user.userId, file);
  }

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Post('profile/avatar')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  uploadAvatar(
    @Request() req: RequestWithUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new Error('File is required');
    return this.usersService.updateAvatar(req.user.userId, file);
  }

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Get('profile')
  getProfile(@Request() req: RequestWithUser) {
    return this.usersService.getProfile(req.user.userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Post('employer-request')
  createEmployerRequest(@Request() req: RequestWithUser) {
    return this.usersService.createEmployerRequest(req.user.userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Get('employer-request/status')
  getEmployerRequestStatus(@Request() req: RequestWithUser) {
    return this.usersService.getEmployerRequestStatus(req.user.userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Get('employer-requests')
  getAllEmployerRequests(@Request() req: RequestWithUser) {
    if (req.user.role !== 'admin') {
      throw new Error('Bạn không có quyền thực hiện hành động này.');
    }
    return this.usersService.getAllEmployerRequests();
  }

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Patch('employer-requests/:id')
  handleEmployerRequest(
    @Param('id') id: string,
    @Body('status') status: 'approved' | 'rejected',
    @Request() req: RequestWithUser,
  ) {
    if (req.user.role !== 'admin') {
      throw new Error('Bạn không có quyền thực hiện hành động này.');
    }
    return this.usersService.handleEmployerRequest(id, status);
  }

  @Get(':id/public')
  getPublicProfile(@Param('id') id: string) {
    return this.usersService.getPublicProfile(id);
  }

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body()
    updateUserDto: Partial<{
      cvUrl: string;
      avatarUrl: string;
      name: string;
      phone: string;
      address: string;
      education: string;
      skills: string;
    }>,
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Patch(':id/promote')
  promote(@Param('id') id: string) {
    return this.usersService.promoteToAdmin(id);
  }

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
