import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret-change-me');

export interface UserPayload {
  id: number;
  email: string;
  name: string;
  role: 'ADMIN' | 'BL';
}

export async function createToken(user: UserPayload): Promise<string> {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(secret);
}

export async function verifyToken(token: string): Promise<UserPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as UserPayload;
  } catch {
    return null;
  }
}

export async function getUser(): Promise<UserPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function requireUser(roles?: string[]): Promise<UserPayload> {
  const user = await getUser();
  if (!user) throw new Error('Unauthorized');
  if (roles && !roles.includes(user.role)) throw new Error('Forbidden');
  return user;
}
