import { Module } from '@nestjs/common';
import { PatientService } from './patient.service.js';
import { PatientController } from './patient.controller.js';
import { AppModule } from '../app.module.js';

@Module({
  controllers: [PatientController],
  providers: [PatientService],
})
export class PatientModule {}
