import {
  Body,
  Controller,
  Post,
  Req,
  Session,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { PatientService } from './patient.service.js';
import { AppService } from '../app.service.js';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';

@Controller()
export class PatientController {
  constructor(private readonly patientService: PatientService) {}

  @Post('createprompt')
  async createPrompt(@Body() body) {
    return await this.patientService.createPrompt(body);
  }

  @Post('audio')
  @UseInterceptors(
    FileInterceptor('file'),
  )
  async transcribeAudio(@UploadedFile() file) {
    return this.patientService.transcribeAudio(file);
  }

  @Post('audiotext')
  async generateResponse(@Body() body) {
    return this.patientService.generateResponse(body);
  }
}
