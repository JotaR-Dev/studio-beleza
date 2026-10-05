import cron from 'node-cron';
import { addMinutes, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { and, eq, gte, isNull, lte } from 'drizzle-orm';
import { db } from '../db';
import { appointments } from '../db/schema';
import { WhatsAppService } from './whatsapp.service';

export class NotificationSystem {
  private static started = false;
  private static processingReminders = false;

  static start() {
    if (this.started) return;
    this.started = true;

    cron.schedule('* * * * *', () => this.processReminders());
    console.log('⏰ Serviço de lembretes do WhatsApp iniciado (verificação a cada minuto).');
  }

  static async notifyOwner(appointmentId: string, action: 'Novo' | 'Alterado') {
    const ownerPhone = process.env.OWNER_WHATSAPP_NUMBER;
    if (!ownerPhone) {
      throw new Error('OWNER_WHATSAPP_NUMBER não está configurado.');
    }

    const appointment = await db.query.appointments.findFirst({
      where: eq(appointments.id, appointmentId),
      with: { user: true, service: true },
    });

    if (!appointment) {
      throw new Error(`Agendamento ${appointmentId} não encontrado para notificação.`);
    }

    const dateTime = format(appointment.startsAt, "dd/MM 'às' HH:mm", { locale: ptBR });
    const templateName = action === 'Novo'
      ? process.env.WHATSAPP_NEW_APPOINTMENT_TEMPLATE || 'novo_agendamento_studio'
      : process.env.WHATSAPP_UPDATED_APPOINTMENT_TEMPLATE || 'agendamento_alterado_studio';

    await WhatsAppService.sendTemplate(ownerPhone, templateName, [
      `${appointment.user.firstName} ${appointment.user.lastName}`,
      appointment.user.phone,
      appointment.service.name,
      dateTime,
    ]);
  }

  private static async processReminders() {
    if (this.processingReminders) return;
    this.processingReminders = true;

    try {
      const now = new Date();
      const reminderWindowStart = addMinutes(now, 119);
      const reminderWindowEnd = addMinutes(now, 121);
      const pendingReminders = await db.query.appointments.findMany({
        where: and(
          eq(appointments.status, 'CONFIRMED'),
          isNull(appointments.reminderSentAt),
          gte(appointments.startsAt, reminderWindowStart),
          lte(appointments.startsAt, reminderWindowEnd),
        ),
        with: { user: true, service: true },
      });

      for (const appointment of pendingReminders) {
        const claimedAt = new Date();
        const [claimed] = await db
          .update(appointments)
          .set({ reminderSentAt: claimedAt })
          .where(and(
            eq(appointments.id, appointment.id),
            eq(appointments.status, 'CONFIRMED'),
            isNull(appointments.reminderSentAt),
          ))
          .returning({ id: appointments.id });

        if (!claimed) continue;

        try {
          if (appointment.user.whatsappOptIn === true) {
            const dateTime = format(appointment.startsAt, "dd/MM 'às' HH:mm", { locale: ptBR });
            const templateName = process.env.WHATSAPP_REMINDER_TEMPLATE || 'lembrete_agendamento';

            await WhatsAppService.sendTemplate(appointment.user.phone, templateName, [
              appointment.user.firstName,
              appointment.service.name,
              dateTime,
              process.env.STUDIO_ADDRESS || 'Studio de Beleza',
            ]);
          } else {
            console.info(`Lembrete WhatsApp não enviado: cliente sem consentimento (agendamento ${appointment.id}).`);
          }
        } catch (error) {
          await db
            .update(appointments)
            .set({ reminderSentAt: null })
            .where(and(
              eq(appointments.id, appointment.id),
              eq(appointments.reminderSentAt, claimedAt),
            ));
          console.error(`Erro ao enviar lembrete do agendamento ${appointment.id}:`, error);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar lembretes pendentes do WhatsApp:', error);
    } finally {
      this.processingReminders = false;
    }
  }
}
