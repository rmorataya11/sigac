import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { MailService } from './mail.service';

describe('MailService', () => {
  const sendMail = jest.fn().mockResolvedValue(undefined);

  function configWithSmtp(): ConfigService {
    const get = jest.fn((key: string) => {
      const map: Record<string, string> = {
        MAIL_SMTP_HOST: 'sandbox.smtp.mailtrap.io',
        MAIL_SMTP_PORT: '2525',
        MAIL_SMTP_USER: 'user',
        MAIL_SMTP_PASS: 'pass',
        MAIL_FROM: 'SIGAC <noreply@test.local>',
      };
      return map[key];
    });
    return { get } as unknown as ConfigService;
  }

  function configWithoutSmtp(): ConfigService {
    const get = jest.fn(() => undefined);
    return { get } as unknown as ConfigService;
  }

  beforeEach(() => {
    sendMail.mockClear();
    jest.spyOn(nodemailer, 'createTransport').mockReturnValue({
      sendMail,
    } as unknown as nodemailer.Transporter);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('no envía correo si no hay SMTP configurado', async () => {
    const svc = new MailService(configWithoutSmtp());
    await svc.notifyActivityParticipants('created', {
      title: 'T',
      activityDateLabel: '2026-04-01',
      startTime: '10:00',
      endTime: '11:00',
      participantEmails: ['a@test.com'],
    });
    expect(nodemailer.createTransport).not.toHaveBeenCalled();
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('deduplica emails y usa primer destinatario en to y el resto en bcc', async () => {
    const svc = new MailService(configWithSmtp());
    await svc.notifyActivityParticipants('confirmed', {
      title: 'Reunión',
      activityDateLabel: '2026-04-06',
      startTime: '09:00',
      endTime: '10:00',
      participantEmails: ['A@test.com', 'a@test.com', 'b@test.com'],
    });

    expect(sendMail).toHaveBeenCalledTimes(1);
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'a@test.com',
        bcc: ['b@test.com'],
        subject: expect.stringContaining('Reunión') as string,
      }),
    );
  });

  it('no llama a sendMail si no hay destinatarios', async () => {
    const svc = new MailService(configWithSmtp());
    await svc.notifyActivityParticipants('updated', {
      title: 'X',
      activityDateLabel: '2026-04-01',
      startTime: '10:00',
      endTime: '11:00',
      participantEmails: ['', '  '],
    });
    expect(sendMail).not.toHaveBeenCalled();
  });
});
