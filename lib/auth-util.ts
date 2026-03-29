/**
 * Cloudflare Edge uyumlu Şifreleme Yardımcıları (Web Crypto API)
 * PBKDF2 (SHA-256) algoritmasını kullanır.
 */

async function get_digest(password: string, salt: Uint8Array) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveBits", "deriveKey"]
  );
  
  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as unknown as ArrayBuffer,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );

  const exported = await crypto.subtle.exportKey("raw", key);
  return new Uint8Array(exported);
}

/**
 * Şifreyi hash'ler. Format: iterations:salt:hash (hex)
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await get_digest(password, salt);
  
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  const hashHex = Array.from(hash).map(b => b.toString(16).padStart(2, '0')).join('');
  
  return `pbkdf2:100000:${saltHex}:${hashHex}`;
}

/**
 * Girilen şifreyi kayıtlı hash ile karşılaştırır.
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  if (!storedHash.startsWith('pbkdf2:')) return false;
  
  const parts = storedHash.split(':');
  if (parts.length !== 4) return false;
  
  const iterations = parseInt(parts[1]);
  const saltHex = parts[2];
  const storedHashHex = parts[3];
  
  const salt = new Uint8Array(saltHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
  const hash = await get_digest(password, salt);
  const hashHex = Array.from(hash).map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex === storedHashHex;
}
