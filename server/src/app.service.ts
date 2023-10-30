import { Injectable } from '@nestjs/common';
import { cases } from './prompts/cases.js';


@Injectable()
export class AppService {
  async getCases(): Promise<string[]> {
    return Object.keys(cases);
  }

}
