import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { eq, or } from 'drizzle-orm';
import { db } from '../db';
import { users } from '../db/schema';

const registerSchema = z.object({
  firstName: z.string().min(2, 'O nome deve conter no mínimo 2 caracteres.'),
  lastName: z.string().min(2, 'O sobrenome deve conter no mínimo 2 caracteres.'),
  email: z.string().email('Informe um endereço de e-mail válido.'),
  phone: z.string().min(10, 'O telefone deve conter no mínimo 10 caracteres.'),
  username: z.string().min(4, 'O login deve conter no mínimo quatro caracteres.'),
  password: z.string().min(6, 'A senha deve conter no mínimo 6 caracteres.'),
  whatsappOptIn: z.boolean().default(true),
});

export const register = async (req: Request, res: Response) => {
  try {
    const data = registerSchema.parse(req.body);

    const existingUser = await db.query.users.findFirst({
      where: or(eq(users.email, data.email), eq(users.username, data.username)),
    });

    if (existingUser) return res.status(400).json({ error: 'E-mail ou nome de usuário já em uso.' });

    const passwordHash = await bcrypt.hash(data.password, 10);

    const [newUser] = await db.insert(users).values({ ...data, passwordHash }).returning();

    const token = jwt.sign({ id: newUser.id, role: newUser.role }, process.env.JWT_SECRET!, { expiresIn: '7d' });

    res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 604800000 });
    
    // NOVIDADE: O token agora é enviado no JSON
    res.status(201).json({ id: newUser.id, firstName: newUser.firstName, role: newUser.role, token });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues.map((issue) => issue.message).join(' ') });
    }
    res.status(500).json({ error: 'Erro no servidor.' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    const user = await db.query.users.findFirst({ where: eq(users.username, username) });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET!, { expiresIn: '7d' });

    res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 604800000 });
    
    // NOVIDADE: O token agora é enviado no JSON
    res.json({ id: user.id, firstName: user.firstName, role: user.role, token });
  } catch (error) {
    res.status(500).json({ error: 'Erro no servidor.' });
  }
};

export const logout = (req: Request, res: Response) => {
  res.clearCookie('token');
  res.json({ message: 'Logout realizado com sucesso.' });
};
