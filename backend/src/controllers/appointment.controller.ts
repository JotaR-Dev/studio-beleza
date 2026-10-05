import { Request, Response } from 'express';
import { addMinutes, differenceInHours, parseISO } from 'date-fns';
import { and, eq, gt, lt, ne } from 'drizzle-orm';
import { db } from '../db';
import { appointments, services } from '../db/schema';
import { NotificationSystem } from '../services/whatsapp.worker';

export const getServices = async (_req: Request, res: Response) => {
  const allServices = await db.query.services.findMany({ where: eq(services.active, true) });
  res.json(allServices);
};

export const createAppointment = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { serviceId, startsAt } = req.body;

  try {
    const service = await db.query.services.findFirst({ where: eq(services.id, serviceId) });
    if (!service || !service.active) return res.status(400).json({ error: 'Serviço inválido.' });
    if (typeof startsAt !== 'string') return res.status(400).json({ error: 'Data e horário inválidos.' });

    const startDate = parseISO(startsAt);
    if (Number.isNaN(startDate.getTime())) return res.status(400).json({ error: 'Data e horário inválidos.' });

    const endDate = addMinutes(startDate, service.durationMinutes);
    const conflict = await db.query.appointments.findFirst({
      where: and(
        eq(appointments.status, 'CONFIRMED'),
        lt(appointments.startsAt, endDate),
        gt(appointments.endsAt, startDate),
      ),
    });

    if (conflict) return res.status(400).json({ error: 'Horário indisponível.' });

    const [appointment] = await db.insert(appointments).values({
      userId,
      serviceId,
      startsAt: startDate,
      endsAt: endDate,
    }).returning();

    void NotificationSystem.notifyOwner(appointment.id, 'Novo')
      .catch((error) => console.error(`Erro ao notificar a dona sobre o agendamento ${appointment.id}:`, error));

    res.status(201).json(appointment);
  } catch (error) {
    console.error('Erro ao criar agendamento:', error);
    res.status(500).json({ error: 'Erro ao agendar.' });
  }
};

export const cancelAppointment = async (req: Request, res: Response) => {
  const id = req.params.id;
  if (typeof id !== 'string') return res.status(400).json({ error: 'Agendamento inválido.' });
  const userId = req.user!.id;

  try {
    const appointment = await db.query.appointments.findFirst({
      where: and(eq(appointments.id, id), eq(appointments.userId, userId)),
    });
    if (!appointment) return res.status(404).json({ error: 'Agendamento não encontrado.' });

    if (differenceInHours(appointment.startsAt, new Date()) < 24) {
      return res.status(400).json({ error: 'Cancelamentos só com 24 horas de antecedência.' });
    }

    await db.update(appointments).set({ status: 'CANCELED' }).where(eq(appointments.id, id));
    res.json({ message: 'Cancelado com sucesso.' });
  } catch (error) {
    console.error('Erro ao cancelar agendamento:', error);
    res.status(500).json({ error: 'Erro no servidor.' });
  }
};

export const getAdminAppointments = async (_req: Request, res: Response) => {
  try {
    const allAppointments = await db.query.appointments.findMany({
      with: {
        service: true,
        user: {
          columns: { passwordHash: false },
        },
      },
      orderBy: (appointment, { asc }) => [asc(appointment.startsAt)],
    });

    res.json(allAppointments.map(({ user, ...appointment }) => ({
      ...appointment,
      client: user,
    })));
  } catch (error) {
    console.error('Erro ao buscar agendamentos do admin:', error);
    res.status(500).json({ error: 'Erro ao carregar agendamentos.' });
  }
};

export const updateAppointment = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    if (typeof id !== 'string') return res.status(400).json({ error: 'Agendamento inválido.' });
    const { startsAt, status } = req.body;
    const current = await db.query.appointments.findFirst({
      where: eq(appointments.id, id),
      with: { service: true },
    });

    if (!current) return res.status(404).json({ error: 'Agendamento não encontrado.' });
    if (startsAt !== undefined && (typeof startsAt !== 'string' || !startsAt.trim())) {
      return res.status(400).json({ error: 'Data e horário inválidos.' });
    }
    if (status !== undefined && !['CONFIRMED', 'CANCELED', 'COMPLETED'].includes(status)) {
      return res.status(400).json({ error: 'Status inválido.' });
    }

    const nextStartsAt = startsAt ? parseISO(startsAt) : current.startsAt;
    if (Number.isNaN(nextStartsAt.getTime())) {
      return res.status(400).json({ error: 'Data e horário inválidos.' });
    }
    const nextEndsAt = startsAt
      ? addMinutes(nextStartsAt, current.service.durationMinutes)
      : current.endsAt;

    if (startsAt) {
      const conflict = await db.query.appointments.findFirst({
        where: and(
          eq(appointments.status, 'CONFIRMED'),
          ne(appointments.id, id),
          lt(appointments.startsAt, nextEndsAt),
          gt(appointments.endsAt, nextStartsAt),
        ),
      });

      if (conflict) return res.status(400).json({ error: 'Horário indisponível.' });
    }

    const [updated] = await db
      .update(appointments)
      .set({
        updatedAt: new Date(),
        ...(startsAt && {
          startsAt: nextStartsAt,
          endsAt: nextEndsAt,
          reminderSentAt: null,
        }),
        ...(status && { status }),
      })
      .where(eq(appointments.id, id))
      .returning();

    if (!updated) return res.status(404).json({ error: 'Agendamento não encontrado.' });

    if ((startsAt && nextStartsAt.getTime() !== current.startsAt.getTime())
      || (status && status !== current.status)) {
      void NotificationSystem.notifyOwner(id, 'Alterado')
        .catch((error) => console.error(`Erro ao notificar a dona sobre a alteração do agendamento ${id}:`, error));
    }

    res.json({ message: 'Agendamento atualizado com sucesso!', updated });
  } catch (error) {
    console.error('Erro ao atualizar agendamento:', error);
    res.status(500).json({ error: 'Erro ao atualizar agendamento.' });
  }
};

export const adminCancelAppointment = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    if (typeof id !== 'string') return res.status(400).json({ error: 'Agendamento inválido.' });

    const [deleted] = await db
      .delete(appointments)
      .where(eq(appointments.id, id))
      .returning();

    if (!deleted) return res.status(404).json({ error: 'Agendamento não encontrado.' });
    res.json({ message: 'Agendamento cancelado com sucesso!' });
  } catch (error) {
    console.error('Erro ao cancelar agendamento pelo admin:', error);
    res.status(500).json({ error: 'Erro ao cancelar agendamento.' });
  }
};
