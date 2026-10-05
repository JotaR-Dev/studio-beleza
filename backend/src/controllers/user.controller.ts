import { Request, Response } from 'express';
import { db } from '../db';
import { users, appointments } from '../db/schema';
import { addMinutes, parseISO } from 'date-fns';
import { and, desc, eq, gt, lt, ne } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

// Obter dados do usuário logado
export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { passwordHash: false }
    });

    if (!user) return res.status(404).json({ error: "Usuário não encontrado." });
    res.json(user);
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    res.status(500).json({ error: "Erro ao buscar perfil." });
  }
};

// Atualizar perfil e/ou senha
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { firstName, lastName, phone, whatsappOptIn, currentPassword, newPassword } = req.body;

    const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
    if (!user) return res.status(404).json({ error: "Usuário não encontrado." });

    const updateData: any = {
      firstName: firstName || user.firstName,
      lastName: lastName || user.lastName,
      phone: phone || user.phone,
      whatsappOptIn: whatsappOptIn !== undefined ? whatsappOptIn : user.whatsappOptIn,
    };

    // Se o usuário quer alterar a senha
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ error: "Informe a senha atual para definir uma nova senha." });
      }
      const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isValidPassword) {
        return res.status(400).json({ error: "Senha atual incorreta." });
      }
      updateData.passwordHash = await bcrypt.hash(newPassword, 10);
    }

    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        phone: users.phone,
        whatsappOptIn: users.whatsappOptIn,
        role: users.role,
      });

    res.json({ message: "Perfil atualizado com sucesso!", user: updatedUser });
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({ error: "Erro ao atualizar perfil." });
  }
};

// Listar agendamentos do próprio cliente logado
export const getClientAppointments = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const clientAppointments = await db.query.appointments.findMany({
      where: eq(appointments.userId, userId),
      with: { service: true },
      orderBy: [desc(appointments.startsAt)],
    });

    res.json(clientAppointments);
  } catch (error) {
    console.error('Erro ao buscar agendamentos do cliente:', error);
    res.status(500).json({ error: "Erro ao buscar seus agendamentos." });
  }
};

// Cancelar ou remarcar com validação estrita das 24 horas (Backend)
export const clientManageAppointment = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { startsAt, action } = req.body; // action: 'cancel' ou 'reschedule'
    if (typeof id !== 'string') {
      return res.status(400).json({ error: "Agendamento inválido." });
    }

    const appointment = await db.query.appointments.findFirst({
      where: and(eq(appointments.id, id), eq(appointments.userId, userId)),
      with: { service: true },
    });

    if (!appointment) {
      return res.status(404).json({ error: "Agendamento não encontrado." });
    }

    if (appointment.status !== 'CONFIRMED') {
      return res.status(400).json({ error: "Este agendamento não pode mais ser alterado." });
    }

    if (appointment.startsAt.getTime() - Date.now() < 24 * 60 * 60 * 1000) {
      return res.status(400).json({ 
        error: "Alterações ou cancelamentos só são permitidos com no mínimo 24 horas de antecedência." 
      });
    }

    if (action === 'cancel') {
      await db.update(appointments)
        .set({ status: 'CANCELED', updatedAt: new Date() })
        .where(eq(appointments.id, id));
      return res.json({ message: "Agendamento cancelado com sucesso." });
    }

    if (action === 'reschedule') {
      if (typeof startsAt !== 'string') {
        return res.status(400).json({ error: "Data e horário inválidos." });
      }
      const nextStartsAt = parseISO(startsAt);
      if (Number.isNaN(nextStartsAt.getTime())) {
        return res.status(400).json({ error: "Data e horário inválidos." });
      }

      const nextEndsAt = addMinutes(nextStartsAt, appointment.service.durationMinutes);
      const conflict = await db.query.appointments.findFirst({
        where: and(
          eq(appointments.status, 'CONFIRMED'),
          ne(appointments.id, id),
          lt(appointments.startsAt, nextEndsAt),
          gt(appointments.endsAt, nextStartsAt),
        ),
      });
      if (conflict) return res.status(400).json({ error: "Horário indisponível." });

      const [updated] = await db
        .update(appointments)
        .set({
          startsAt: nextStartsAt,
          endsAt: nextEndsAt,
          reminderSentAt: null,
          updatedAt: new Date(),
        })
        .where(eq(appointments.id, id))
        .returning();
      return res.json({ message: "Remarcado com sucesso!", updated });
    }

    return res.status(400).json({ error: "Ação inválida." });
  } catch (error) {
    console.error('Erro ao processar solicitação do cliente:', error);
    res.status(500).json({ error: "Erro ao processar solicitação." });
  }
};
