import bcrypt from 'bcryptjs'

/**
 * Şifreyi hash'ler.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12)
  return await bcrypt.hash(password, salt)
}

/**
 * Girilen şifreyi kayıtlı hash ile karşılaştırır.
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  // Eski PBKDF2 hashlerini de desteklemek isterseniz burayı genişletebilirsiniz.
  // Ancak mevcut DB BCrypt kullanıyor.
  try {
    return await bcrypt.compare(password, storedHash)
  } catch (e) {
    console.error('Password verification error:', e)
    return false
  }
}

