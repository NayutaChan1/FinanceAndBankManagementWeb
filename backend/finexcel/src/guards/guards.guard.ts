import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';

@Injectable()
export class GuardsGuard implements CanActivate {
  constructor() {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['api-key'];

    const validApiKey = process.env.API_KEY || 'yahahaha gadapet API Keynya';

    if(!apiKey || apiKey !== validApiKey){
      throw new UnauthorizedException('Invalid API Key');
    }

    return true;
  }
}
