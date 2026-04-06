import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

export type ActivityMailEvent =
  | 'created'
  | 'updated'
  | 'confirmed'
  | 'cancelled';

export type ActivityMailPayload = {
  title: string;
  activityDateLabel: string;
  startTime: string;
  endTime: string;
  /** Destinatarios únicos (participantes con email en BD) */
  participantEmails: string[];
};

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>('MAIL_SMTP_HOST');
    const user = this.config.get<string>('MAIL_SMTP_USER');
    const pass = this.config.get<string>('MAIL_SMTP_PASS');
    if (host && user && pass) {
      const port = Number(this.config.get<string>('MAIL_SMTP_PORT') ?? 2525);
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
      this.logger.log(
        `SMTP configurado (${host}:${port}) — Mailtrap u otro proveedor`,
      );
    } else {
      this.logger.warn(
        'SMTP no configurado (MAIL_SMTP_HOST / USER / PASS). Los avisos por correo están desactivados.',
      );
    }
  }

  private get fromAddress(): string {
    return (
      this.config.get<string>('MAIL_FROM') ?? 'SIGAC <noreply@sigac.local>'
    );
  }

  /**
   * UC-09: notificación a participantes. Fallos solo se registran en log (no revierten la actividad).
   */
  async notifyActivityParticipants(
    event: ActivityMailEvent,
    payload: ActivityMailPayload,
  ): Promise<void> {
    if (!this.transporter) {
      return;
    }
    const { participantEmails, title, activityDateLabel, startTime, endTime } =
      payload;
    const unique = [...new Set(participantEmails.map((e) => e.trim().toLowerCase()))].filter(
      Boolean,
    );
    if (unique.length === 0) {
      return;
    }

    const { subject, text } = this.buildActivityMessage(event, {
      title,
      activityDateLabel,
      startTime,
      endTime,
    });

    try {
      const [to, ...bcc] = unique;
      await this.transporter.sendMail({
        from: this.fromAddress,
        to,
        bcc: bcc.length > 0 ? bcc : undefined,
        subject,
        text,
      });
      this.logger.log(
        `Correo "${event}" enviado (BCC ${unique.length} destinatarios): ${title}`,
      );
    } catch (err) {
      this.logger.error(
        `Fallo SMTP al notificar actividad (${event}): ${title}`,
        err instanceof Error ? err.stack : String(err),
      );
    }
  }

  private buildActivityMessage(
    event: ActivityMailEvent,
    body: {
      title: string;
      activityDateLabel: string;
      startTime: string;
      endTime: string;
    },
  ): { subject: string; text: string } {
    const when = `${body.activityDateLabel} ${body.startTime}–${body.endTime}`;
    const lines: Record<ActivityMailEvent, { subject: string; text: string }> = {
      created: {
        subject: `[SIGAC] Nueva actividad: ${body.title}`,
        text: `Se ha creado una actividad en la que participas.\n\nTítulo: ${body.title}\nFecha y hora: ${when}\n`,
      },
      updated: {
        subject: `[SIGAC] Actividad actualizada: ${body.title}`,
        text: `Una actividad en la que participas ha sido modificada.\n\nTítulo: ${body.title}\nFecha y hora: ${when}\n`,
      },
      confirmed: {
        subject: `[SIGAC] Actividad confirmada: ${body.title}`,
        text: `Una actividad en la que participas ha sido confirmada.\n\nTítulo: ${body.title}\nFecha y hora: ${when}\n`,
      },
      cancelled: {
        subject: `[SIGAC] Actividad cancelada: ${body.title}`,
        text: `Una actividad en la que participabas ha sido cancelada.\n\nTítulo: ${body.title}\nFecha y hora prevista: ${when}\n`,
      },
    };
    return lines[event];
  }
}
