import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { eq, or } from 'drizzle-orm';
import { db } from './index';
import { users } from './schema';

async function main() {
  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD
    ?? (process.env.NODE_ENV === 'production' ? undefined : 'admin');
  const email = process.env.ADMIN_EMAIL || 'admin@studio.local';

  if (!password) {
    throw new Error('Defina ADMIN_PASSWORD antes de criar a conta administrativa em produção.');
  }

  const existingUser = await db.query.users.findFirst({
    where: or(eq(users.username, username), eq(users.email, email)),
  });

  if (existingUser) {
    if (existingUser.username === username && existingUser.role === 'ADMIN') {
      console.log(`A conta administrativa "${username}" já existe; nenhuma alteração foi feita.`);
      return;
    }

    throw new Error('O nome de usuário ou e-mail administrativo já pertence a outra conta.');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await db.insert(users).values({
    firstName: 'Admin',
    lastName: 'Studio',
    email,
    phone: '0000000000',
    username,
    passwordHash,
    whatsappOptIn: false,
    role: 'ADMIN',
  });

  console.log(`Conta administrativa "${username}" criada com sucesso.`);
}

main().catch((error: unknown) => {
  console.error('Não foi possível criar a conta administrativa:', error);
  process.exitCode = 1;
});
