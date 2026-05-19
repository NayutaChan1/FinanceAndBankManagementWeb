import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'USER_CLIENT',
        transport: Transport.TCP,
        options: {
          host: process.env.USER_SERVICE_HOST || 'user-service',
          port: process.env.USER_SERVICE_PORT
            ? parseInt(process.env.USER_SERVICE_PORT)
            : 8888,
        },
      },
      {
        name: 'AUTH_CLIENT',
        transport: Transport.TCP,
        options: {
          host: process.env.AUTH_SERVICE_HOST || 'auth-service',
          port: process.env.AUTH_SERVICE_PORT
            ? parseInt(process.env.AUTH_SERVICE_PORT)
            : 8889,
        },
      },
    ]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
