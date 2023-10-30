import { Controller, Get, Post, Req, Res, Session } from '@nestjs/common';
import { AppService } from './app.service.js';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('getcases')
  async getHello(): Promise<any> {
    const cases = await this.appService.getCases();
    // response.send({ cases, ID: request.session.id });
    return { cases };
  }
}
