import { MiddlewareConsumer, Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PatientModule } from './patient/patient.module.js';

@Module({
  imports: [PatientModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
