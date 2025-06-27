import jwt, { SignOptions } from 'jsonwebtoken';

interface TokenPayload {
  id: number;
  email: string;
}

const JWT_SECRET: string = process.env.JWT_SECRET || 'YOUR_DEFAULT_JWT_SECRET';

export const generateToken = (
  payload: TokenPayload,
  exp = 30 * 24 * 60 * 60
): string => {
  const options: SignOptions = {
    expiresIn: exp,
  };
  return jwt.sign(payload, JWT_SECRET, options);
};

export const verifyToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    throw new Error('Invalid token');
  }
};

export const decodeToken = (token: string): TokenPayload | null => {
  try {
    return jwt.decode(token) as TokenPayload;
  } catch (error) {
    return null;
  }
};
