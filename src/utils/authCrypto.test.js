import { describe, it, expect } from 'vitest';
import { generateSalt, hashPassword, verifyPassword, bufferToHex } from './authCrypto';

describe('authCrypto', () => {
  it('bufferToHex doit convertir un buffer en chaîne hexadécimale stable', () => {
    const buf = new Uint8Array([0, 15, 16, 255]).buffer;
    const hex = bufferToHex(buf);
    expect(hex).toBe('000f10ff');
  });

  it('hashPassword produit le même hash pour même mot de passe + salt', async () => {
    const salt = generateSalt(16);
    const password = 'SuperMotDePasse123!';

    const h1 = await hashPassword(password, salt);
    const h2 = await hashPassword(password, salt);

    expect(h1).toBe(h2);
  });

  it('hashPassword change si le mot de passe ou le salt change', async () => {
    const salt = generateSalt(16);
    const password = 'MotDePasse1';
    const otherPassword = 'MotDePasse2';

    const base = await hashPassword(password, salt);
    const diffPassword = await hashPassword(otherPassword, salt);
    const otherSalt = generateSalt(16);
    const diffSalt = await hashPassword(password, otherSalt);

    expect(diffPassword).not.toBe(base);
    expect(diffSalt).not.toBe(base);
  });

  it('verifyPassword retourne true pour les bons identifiants et false sinon', async () => {
    const salt = generateSalt(16);
    const password = 'MonMotDePasseSécurisé';
    const hash = await hashPassword(password, salt);

    const ok = await verifyPassword(password, salt, hash);
    const wrongPass = await verifyPassword('autreMot', salt, hash);
    const wrongSalt = await verifyPassword(password, generateSalt(16), hash);

    expect(ok).toBe(true);
    expect(wrongPass).toBe(false);
    expect(wrongSalt).toBe(false);
  });
});


