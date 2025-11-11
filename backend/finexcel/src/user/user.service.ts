import { Injectable } from '@nestjs/common';
import { Prisma, Users } from '@prisma/client';
import { DbService } from 'src/db/db.service';

@Injectable()
export class UserService {

    constructor(
        private readonly db: DbService,
    ){}

    async findAll(){
        return this.db.users.findMany();
    }

    async findByEmail(email: string){
        return this.db.users.findUnique({
            where: {
                email: email
            }
        });
    }

    async insertUser(user: Prisma.UsersCreateInput){
        return this.db.users.create({
            data: user
        });
    }

}
