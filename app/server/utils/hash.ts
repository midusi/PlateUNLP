
import bcrypt from 'bcrypt'

export async function hashPassword(password: string, saltRounds = 10): Promise<string> {
  return await bcrypt.hash(password, saltRounds)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash)
}

