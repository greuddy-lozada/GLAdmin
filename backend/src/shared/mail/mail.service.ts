import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

export interface SendMailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;

  private getTransporter(): Transporter | null {
    if (this.transporter) return this.transporter;

    const host = process.env.SMTP_HOST?.trim();
    if (!host) {
      return null;
    }

    const port = Number(process.env.SMTP_PORT ?? 587);
    const user = process.env.SMTP_USER?.trim();
    const pass = process.env.SMTP_PASS?.trim();

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: user && pass ? { user, pass } : undefined,
    });

    return this.transporter;
  }

  isConfigured(): boolean {
    return Boolean(process.env.SMTP_HOST?.trim());
  }

  async send(options: SendMailOptions): Promise<boolean> {
    const transporter = this.getTransporter();
    if (!transporter) {
      this.logger.warn(
        `SMTP not configured — skipped email to ${options.to}: ${options.subject}`,
      );
      return false;
    }

    const from = process.env.MAIL_FROM?.trim() || 'noreply@cuadra.app';

    try {
      await transporter.sendMail({
        from,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html ?? options.text,
      });
      this.logger.log(`Email sent to ${options.to}: ${options.subject}`);
      return true;
    } catch (err) {
      this.logger.error(
        `Failed to send email to ${options.to}`,
        err instanceof Error ? err.stack : String(err),
      );
      return false;
    }
  }

  async sendInviteEmail(params: {
    to: string;
    organizationName: string;
    roleName: string;
    inviteUrl: string;
    expiresAt: Date;
  }): Promise<boolean> {
    const expires = params.expiresAt.toLocaleDateString('es-VE');
    const subject = `Invitación a ${params.organizationName} — Cuadra`;
    const text = [
      `Te invitaron a unirte a ${params.organizationName} en Cuadra como ${params.roleName}.`,
      '',
      `Abre este enlace para crear tu cuenta:`,
      params.inviteUrl,
      '',
      `El enlace vence el ${expires}.`,
      '',
      'Si no esperabas esta invitación, ignora este correo.',
    ].join('\n');

    const html = `
      <p>Te invitaron a unirte a <strong>${escapeHtml(params.organizationName)}</strong> en Cuadra como <strong>${escapeHtml(params.roleName)}</strong>.</p>
      <p><a href="${escapeHtml(params.inviteUrl)}">Crear tu cuenta</a></p>
      <p style="color:#666;font-size:14px">El enlace vence el ${escapeHtml(expires)}.</p>
      <p style="color:#666;font-size:14px">Si no esperabas esta invitación, ignora este correo.</p>
    `.trim();

    return this.send({ to: params.to, subject, text, html });
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
