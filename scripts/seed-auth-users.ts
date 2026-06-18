import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';
import dotenv from 'dotenv';
import { validatePasswordPolicy } from '../server';

dotenv.config();

const prisma = new PrismaClient();

const slug = (value: string) => value.trim().toLowerCase();

function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} wajib diisi.`);
  return value;
}

function validateUsername(value: string) {
  const username = slug(value);
  if (!/^[a-z0-9._-]{3,40}$/.test(username)) throw new Error(`Username tidak valid: ${value}`);
  return username;
}

async function upsertUser(prefix: 'ADMIN' | 'READER', role: 'ADMIN' | 'READER') {
  const username = validateUsername(required(`${prefix}_USERNAME`));
  const password = required(`${prefix}_PASSWORD`);
  const policyError = validatePasswordPolicy(password);
  if (policyError) throw new Error(`${prefix}_PASSWORD: ${policyError}`);
  const name = process.env[`${prefix}_NAME`]?.trim() || username;
  const passwordHash = await argon2.hash(password);

  const user = await prisma.user.upsert({
    where: { username },
    create: {
      id: `user-${role.toLowerCase()}-${crypto.randomUUID()}`,
      username,
      name,
      role,
      passwordHash,
      active: true
    },
    update: {
      name,
      role,
      passwordHash,
      active: true
    }
  });
  await prisma.session.deleteMany({ where: { userId: user.id } });
  return { username: user.username, role: user.role, active: user.active };
}

async function main() {
  const users = [
    await upsertUser('ADMIN', 'ADMIN'),
    await upsertUser('READER', 'READER')
  ];
  console.log(JSON.stringify({ seeded: users }, null, 2));
}

main().finally(async () => {
  await prisma.$disconnect();
});
