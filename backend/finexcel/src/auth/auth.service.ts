import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {

    constructor(
        private readonly users: UserService,
        private readonly jwtService: JwtService,
    ) {}
    
    async validateUser(email: string, password: string){
        const user = await this.users.findByEmail(email);
        if(!user) return null;

        const isValidPassword = await bcrypt.compare(password, user.password);
        if(!isValidPassword){
            return null;
        }

        const { password: _, ...result } = user;
        return result;
    }

    async login(email: string, password: string){
        const user = await this.validateUser(email, password);
        if(!user){
            throw new UnauthorizedException('Invalid Credentials');
        }

        const payload = { sub: user.userid, email: user.email, username: user.username };
        return {
            access_token: this.jwtService.sign(payload),
            user : user
        };
    }

    async register(email: string, username: string, password: string){
        if(!email){
            console.log("ANJG KOSOONG BENERAN");
            throw new ConflictException('Email Gaada');
        }

        const ExistUser = await this.users.findByEmail(email);
        if(ExistUser){
            throw new ConflictException('Email already exist');
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const user = await this.users.insertUser({
            email: email,
            password: hashedPassword,
            username: username
        });

        const { password: _, ...result } = user;
        const payload = { sub: result.userid, email: result.email, username: result.username };
        return {
            access_token: this.jwtService.sign(payload),
            user: result
        };
    }

}
