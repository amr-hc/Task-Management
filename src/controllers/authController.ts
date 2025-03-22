import { NextFunction, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { registerSchema, loginSchema } from '../validations/authValidation';
import dotenv from 'dotenv';
import ApiError from '../utils/ApiError';
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET as string;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET as string;

const generateTokens = (user: any) => {
  const accessToken = jwt.sign(
    { userId: user._id, role: user.role },
    JWT_SECRET,
    { expiresIn: '7h' }
  );

  const refreshToken = jwt.sign(
    { userId: user._id },
    JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};

export const register = async ( req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ApiError(400, 'Email already in use');
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed });

    const tokens = generateTokens(user);
    const { _id, role } = user;

    res.status(201).json({
      user: { _id, name, email, role },
      ...tokens,
    });
  } catch (err) {
    next(err);
  }
};


export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) throw new ApiError(401, 'Invalid credentials');

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new ApiError(401, 'Invalid credentials');

    const tokens = generateTokens(user);
    const { _id, name, role } = user;

    res.status(200).json({
      user: { _id, name, email, role },
      ...tokens,
    });
  } catch (err) {
    next(err);
  }
};

export const handleRefreshToken = async ( req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    const payload: any = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    const user = await User.findById(payload.userId);

    if (!user) throw new ApiError(401, 'User not found');

    const tokens = generateTokens(user);
    const { _id, name, email, role } = user;

    res.status(200).json({
      user: { _id, name, email, role },
      ...tokens,
    });
  } catch (err) {
    next(new ApiError(401, 'Invalid or expired refresh token'));
  }
};


