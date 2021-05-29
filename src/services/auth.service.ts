import crypto from 'crypto';
import util from 'util';

import { UserEntity } from '../domains/users.entity';
import { BadRequestException, ForbiddenException } from '../lib/exceptions';
import { AuthRepository } from '../repositories/auth.repo';
import { JoinDto, SnsJoinDto } from '../dtos/users.dto';
class AuthService {
  private readonly authRepository: AuthRepository;

  private EXEC_NUM = parseInt(process.env.EXEC_NUM, 10);
  private RESULT_LENGTH = parseInt(process.env.RESULT_LENGTH, 10);

  private randomBytes = util.promisify(crypto.randomBytes);

  constructor(authRepository: AuthRepository) {
    this.authRepository = authRepository;
  }

  public async findAll(): Promise<UserEntity[]> {
    const users: UserEntity[] = await this.authRepository.findAll();
    return users;
  }

  public async findById(userId: string): Promise<UserEntity> {
    const findUser: UserEntity = await this.authRepository.findById(userId);
    return findUser;
  }

  public async findByEmail(userEmail: string): Promise<UserEntity> {
    const findUser: UserEntity = await this.authRepository.findByEmail(userEmail);
    return findUser;
  }

  public async login(email: string, password: string): Promise<UserEntity> {
    const findUser: UserEntity = await this.authRepository.findByEmail(email);

    if (!findUser) {
      throw new BadRequestException('Cannot find user');
    }

    const cryptedPassword: Buffer = crypto.pbkdf2Sync(
      password,
      findUser.salt,
      this.EXEC_NUM,
      this.RESULT_LENGTH,
      'sha512'
    );

    if (findUser.password === cryptedPassword.toString('base64')) {
      if (findUser.deactivatedAt !== null) {
        throw new ForbiddenException('Deactivated account');
      }

      return findUser;
    } else {
      throw new BadRequestException('Check your id and password');
    }
  }

  public async createUser(userData: JoinDto): Promise<UserEntity> {
    const findUser: UserEntity = await this.authRepository.findByEmail(userData.email);

    if (findUser) {
      throw new BadRequestException(`Duplicated email ${userData.email}`);
    }

    if (userData.userPw !== userData.userPwRe) {
      throw new BadRequestException('Passwords are not matched');
    }

    const generatedId: string = crypto
      .createHash('sha256')
      .update(userData.email)
      .digest('hex')
      .slice(0, 14);
    const salt: string = await (await this.randomBytes(64)).toString('base64');
    const cryptedPassword: Buffer = crypto.pbkdf2Sync(
      userData.userPw,
      salt,
      this.EXEC_NUM,
      this.RESULT_LENGTH,
      'sha512'
    );

    const authToken = cryptedPassword.toString('hex').slice(0, 24);

    const createUser: UserEntity = await this.authRepository.createUser({
      email: userData.email,
      nickname: userData.userNick,
      screenId: generatedId,
      password: cryptedPassword.toString('base64'),
      salt,
      token: authToken,
      displayLanguage: userData.userLang,
    });

    return createUser;
  }

  public async createSnsUser(snsJoinData: SnsJoinDto): Promise<UserEntity> {
    const generateId: string = crypto
      .createHash('sha256')
      .update(snsJoinData.email)
      .digest('hex')
      .slice(0, 14);

    const salt: string = await (await this.randomBytes(64)).toString('base64');

    const cryptedPassword: string = await crypto
      .pbkdf2Sync(snsJoinData.email, salt, this.EXEC_NUM, this.RESULT_LENGTH, 'sha512')
      .toString('base64');

    const createUser = await this.authRepository.createUser({
      email: snsJoinData.email,
      password: cryptedPassword,
      salt,
      nickname: snsJoinData.name,
      screenId: generateId,
      displayLanguage: snsJoinData.displayLanguage,
      profile: snsJoinData.profile,
      snsId: snsJoinData.uid,
      snsType: snsJoinData.snsType,
      isConfirmed: true,
    });

    return createUser;
  }

  public async updateUser(userId: string, userData: Partial<UserEntity>): Promise<UserEntity> {
    if (!userId || !userData) {
      throw new BadRequestException('User id and data required');
    }

    const updateUserData = await this.authRepository.updateUser(userId, userData);

    if (!updateUserData) {
      throw new BadRequestException('Not a user');
    }

    return updateUserData;
  }

  public async deleteUser(userId: string): Promise<UserEntity> {
    const deleteUser: UserEntity = await this.authRepository.deleteUser(userId);

    if (!deleteUser) {
      throw new BadRequestException('Cannot find user');
    }

    return deleteUser;
  }

  public async changePassword(email: string, userPwNew: string) {
    const findUser: UserEntity = await this.findByEmail(email);

    if (!findUser) {
      throw new BadRequestException('Cannot find user');
    }

    const newSalt: string = await (await this.randomBytes(64)).toString('base64');
    const newPassword: string = await (
      await crypto.pbkdf2Sync(userPwNew, newSalt, this.EXEC_NUM, this.RESULT_LENGTH, 'sha512')
    ).toString('base64');

    await this.authRepository.updateUser(findUser._id, {
      salt: newSalt,
      password: newPassword,
    });
  }

  public async confirmUser(email: string, token: string): Promise<boolean> {
    const findUser: UserEntity = await this.authRepository.findByEmail(email);

    if (!findUser) {
      throw new BadRequestException('Cannot find user');
    }

    if (findUser.token === null && findUser.isConfirmed === true) {
      throw new ForbiddenException('Already confirmed');
    }

    if (findUser.token !== token) {
      throw new BadRequestException('Data not matched');
    }

    const confirmation = await this.updateUser(findUser._id, {
      token: null,
      isConfirmed: true,
    });

    if (!confirmation) {
      return false;
    }

    return true;
  }

  public async findBySnsId(snsId: string, snsType: string): Promise<UserEntity> {
    const findUser: UserEntity = await this.authRepository.findBySnsId(snsId, snsType);

    return findUser;
  }

  public async deactivateUser(userId: string): Promise<boolean> {
    const findUser = await this.authRepository.findById(userId);

    if (!findUser) {
      throw new BadRequestException('Cannot find user. Check id.');
    }

    await this.authRepository.updateUser(userId, { deactivatedAt: new Date() });

    return true;
  }
}

export default AuthService;
