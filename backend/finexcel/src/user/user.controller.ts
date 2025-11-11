import { Body, Controller, Get, Logger, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { Prisma } from '@prisma/client';

@Controller('user')
export class UserController {
    constructor(private readonly userService : UserService){}

    private readonly logger = new Logger(UserController.name)

    @Get('getUser')
    getUser(){
        this.logger.log("Wow");
        return this.userService.findAll();
    }

    @Post('create')
    createUser(@Body() userData: Prisma.UsersCreateInput) {
        return this.userService.insertUser(userData);
    }

}
