import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class InterceptorsInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, headers, body, query } = request;

    console.log(`[${new Date().toISOString()}] ${method} ${url}`)
    console.log('Headers:', JSON.stringify(headers, null, 2));
    console.log('Query:', JSON.stringify(query, null, 2));
    console.log('Body:', JSON.stringify(body, null, 2));

    const date = Date.now();

    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse();
        console.log(`[${new Date().toISOString()}] Response : ${response.statusCode} - ${Date.now() - date}`)
      })
    );
  }
}
