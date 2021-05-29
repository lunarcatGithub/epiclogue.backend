import { Request, Response, NextFunction } from 'express';
import UsersService from '../services/users.service';
import IntResponse from '../lib/response';
import { UserEntity } from '../domains/users.entity';
import { UpdateUserDto, UserTokenDto } from '../dtos/users.dto';
import MongoUsersRepository from '../repositories/mongo.users.repo';

class UsersController {
  private usersService: UsersService = new UsersService(new MongoUsersRepository());

  public getUserProfile = async (req: Request, res: Response, next: NextFunction) => {
    const userId: string = (res.locals.user as UserTokenDto)._id;

    const userProfile: Partial<UserEntity> = await this.usersService.getUserProfile(userId)

    IntResponse(res, 200, userProfile)
  };

  public postUserProfile = async (req: Request, res: Response, next: NextFunction) => {
    const userId: string = (res.locals.user as UserTokenDto)._id;
    const updateProfile: UpdateUserDto = req.body;

    const updateResult: Partial<UserEntity> = await this.usersService.postUserProfile(userId, updateProfile);

    IntResponse(res, 200, updateResult)
  };
}

export default UsersController;
