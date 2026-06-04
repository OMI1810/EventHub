import VerificationEmail from "@email/confirmation.email";
import { MailerService } from "@nestjs-modules/mailer";
import { Injectable } from "@nestjs/common";
import { render } from "@react-email/render";

@Injectable()
export class EmailService {
  constructor(private readonly mailerService: MailerService) {}

  sendEmail(to: string, subject: string, html: string) {
    return this.mailerService.sendMail({
      to,
      subject,
      html,
    });
  }

  async sendVerification(to: string, verificationLink: string) {
    const html = await render(VerificationEmail({ url: verificationLink }));
    return this.sendEmail(to, "Подтверждение почты", html);
  }

  async sendTwoFactorCode(to: string, code: string) {
    return this.sendEmail(
      to,
      "Код подтверждения входа",
      `
        <div style="font-family: Arial, sans-serif; line-height: 1.5;">
          <h2>Код подтверждения входа</h2>
          <p>Введите этот код на странице авторизации:</p>
          <p style="font-size: 28px; font-weight: 700; letter-spacing: 6px;">${code}</p>
          <p>Код действует 10 минут. Если вы не входили в аккаунт, просто проигнорируйте это письмо.</p>
        </div>
      `,
    );
  }
}
