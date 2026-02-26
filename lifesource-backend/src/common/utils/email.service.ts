import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly mailerService: MailerService) {}

  async sendWelcomeEmail(to: string, name: string): Promise<void> {
    await this.sendMail({
      to,
      subject: 'Welcome to LifeSource — You are Making a Difference',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
          <title>Welcome to LifeSource</title>
        </head>
        <body style="margin:0;padding:0;background-color:#f9fafb;font-family:'Segoe UI',Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">

                  <!-- Header -->
                  <tr>
                    <td style="background-color:#c53030;padding:32px 40px;text-align:center;">
                      <h1 style="margin:0;color:#ffffff;font-size:24px;letter-spacing:0.5px;">LifeSource</h1>
                      <p style="margin:6px 0 0;color:#feb2b2;font-size:13px;">Connecting Donors. Saving Lives.</p>
                    </td>
                  </tr>

                  <!-- Body -->
                  <tr>
                    <td style="padding:40px;">

                      <h2 style="margin:0 0 12px;color:#1a202c;font-size:20px;">Welcome, ${name}!</h2>
                      <p style="margin:0 0 20px;color:#4a5568;font-size:15px;line-height:1.6;">
                        Thank you for joining <strong>LifeSource</strong>. Your account has been created successfully, and you're now part of a community dedicated to saving lives through blood donation.
                      </p>

                      <!-- What you can do box -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;background:#fff5f5;border:1px solid #fed7d7;border-radius:8px;">
                        <tr>
                          <td style="padding:24px;">
                            <p style="margin:0 0 16px;color:#742a2a;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;">What you can do on LifeSource</p>
                            <table cellpadding="0" cellspacing="0" width="100%">
                              <tr>
                                <td style="padding:6px 0;color:#4a5568;font-size:14px;line-height:1.5;">
                                  🩸 &nbsp;<strong>Donate blood</strong> — respond to urgent requests near you
                                </td>
                              </tr>
                              <tr>
                                <td style="padding:6px 0;color:#4a5568;font-size:14px;line-height:1.5;">
                                  🏥 &nbsp;<strong>Request blood</strong> — submit requests for yourself or a loved one
                                </td>
                              </tr>
                              <tr>
                                <td style="padding:6px 0;color:#4a5568;font-size:14px;line-height:1.5;">
                                  📍 &nbsp;<strong>Find hospitals</strong> — locate verified partner hospitals in your area
                                </td>
                              </tr>
                              <tr>
                                <td style="padding:6px 0;color:#4a5568;font-size:14px;line-height:1.5;">
                                  📋 &nbsp;<strong>Track donations</strong> — view your donation history and impact
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>

                      <p style="margin:0 0 28px;color:#4a5568;font-size:15px;line-height:1.6;">
                        If you have any questions or need help getting started, our support team is always here for you.
                      </p>

                      <p style="margin:0;color:#4a5568;font-size:15px;">
                        Together, we save lives.<br/>
                        <strong>The LifeSource Team</strong>
                      </p>

                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background:#f7fafc;padding:24px 40px;border-top:1px solid #e2e8f0;text-align:center;">
                      <p style="margin:0;color:#a0aec0;font-size:12px;">
                        © ${new Date().getFullYear()} LifeSource · This is an automated message, please do not reply directly to this email.
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });
  }

  async sendHospitalApprovalEmail(
    to: string,
    firstName: string,
    temporaryPassword: string,
  ): Promise<void> {
    await this.sendMail({
      to,
      subject: 'Your Hospital Has Been Approved — LifeSource',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
          <title>Hospital Approved</title>
        </head>
        <body style="margin:0;padding:0;background-color:#f9fafb;font-family:'Segoe UI',Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">

                  <!-- Header -->
                  <tr>
                    <td style="background-color:#c53030;padding:32px 40px;text-align:center;">
                      <h1 style="margin:0;color:#ffffff;font-size:24px;letter-spacing:0.5px;">LifeSource</h1>
                      <p style="margin:6px 0 0;color:#feb2b2;font-size:13px;">Hospital Network Administration</p>
                    </td>
                  </tr>

                  <!-- Body -->
                  <tr>
                    <td style="padding:40px;">

                      <h2 style="margin:0 0 12px;color:#1a202c;font-size:20px;">Congratulations, ${firstName}!</h2>
                      <p style="margin:0 0 20px;color:#4a5568;font-size:15px;line-height:1.6;">
                        Your hospital's registration on the <strong>LifeSource</strong> platform has been reviewed and <strong style="color:#2f855a;">approved</strong>.
                        Your administrator account is now active and ready to use.
                      </p>

                      <p style="margin:0 0 8px;color:#4a5568;font-size:15px;line-height:1.6;">
                        You can now log in to manage your hospital's blood inventory, respond to blood requests, record donations, and coordinate with the LifeSource network.
                      </p>

                      <!-- Credentials box -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;background:#fff5f5;border:1px solid #fed7d7;border-radius:8px;">
                        <tr>
                          <td style="padding:24px;">
                            <p style="margin:0 0 14px;color:#742a2a;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;">Your Login Credentials</p>
                            <table cellpadding="0" cellspacing="0">
                              <tr>
                                <td style="padding:4px 0;color:#718096;font-size:14px;width:80px;">Email</td>
                                <td style="padding:4px 0;color:#1a202c;font-size:14px;font-weight:600;">${to}</td>
                              </tr>
                              <tr>
                                <td style="padding:4px 0;color:#718096;font-size:14px;">Password</td>
                                <td style="padding:4px 0;">
                                  <code style="background:#fff;border:1px solid #fed7d7;color:#c53030;padding:3px 10px;border-radius:4px;font-size:14px;font-weight:700;letter-spacing:1px;">${temporaryPassword}</code>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>

                      <!-- Warning -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;background:#fffbeb;border-left:4px solid #d69e2e;border-radius:4px;">
                        <tr>
                          <td style="padding:14px 16px;color:#744210;font-size:14px;line-height:1.5;">
                            <strong>⚠ Important:</strong> This is a temporary password. You will be required to change it on your first login. Please keep your credentials confidential.
                          </td>
                        </tr>
                      </table>

                      <p style="margin:0 0 28px;color:#4a5568;font-size:15px;line-height:1.6;">
                        If you encounter any issues accessing your account or have questions about managing your hospital on LifeSource, please reach out to our support team.
                      </p>

                      <p style="margin:0;color:#4a5568;font-size:15px;">
                        Thank you for joining the LifeSource network. Together, we save lives.
                      </p>

                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background:#f7fafc;padding:24px 40px;border-top:1px solid #e2e8f0;text-align:center;">
                      <p style="margin:0;color:#a0aec0;font-size:12px;">
                        © ${new Date().getFullYear()} LifeSource · This is an automated message, please do not reply directly to this email.
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });
  }

  async sendHospitalRejectionEmail(
    to: string,
    firstName: string,
    reason: string,
  ): Promise<void> {
    await this.sendMail({
      to,
      subject: 'Update on Your Hospital Registration — LifeSource',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
          <title>Hospital Registration Update</title>
        </head>
        <body style="margin:0;padding:0;background-color:#f9fafb;font-family:'Segoe UI',Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">

                  <!-- Header -->
                  <tr>
                    <td style="background-color:#c53030;padding:32px 40px;text-align:center;">
                      <h1 style="margin:0;color:#ffffff;font-size:24px;letter-spacing:0.5px;">LifeSource</h1>
                      <p style="margin:6px 0 0;color:#feb2b2;font-size:13px;">Hospital Network Administration</p>
                    </td>
                  </tr>

                  <!-- Body -->
                  <tr>
                    <td style="padding:40px;">

                      <h2 style="margin:0 0 12px;color:#1a202c;font-size:20px;">Hello, ${firstName}</h2>
                      <p style="margin:0 0 20px;color:#4a5568;font-size:15px;line-height:1.6;">
                        Thank you for submitting your hospital's registration request to join the <strong>LifeSource</strong> network.
                        After careful review, we are unable to approve your registration at this time.
                      </p>

                      <!-- Reason box -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;background:#fff5f5;border:1px solid #fed7d7;border-radius:8px;">
                        <tr>
                          <td style="padding:24px;">
                            <p style="margin:0 0 10px;color:#742a2a;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;">Reason for Rejection</p>
                            <p style="margin:0;color:#1a202c;font-size:15px;line-height:1.6;">${reason}</p>
                          </td>
                        </tr>
                      </table>

                      <p style="margin:0 0 16px;color:#4a5568;font-size:15px;line-height:1.6;">
                        If you believe this decision was made in error, or if you have addressed the issue above and would like to reapply, please contact our support team with the relevant documentation and we will be happy to assist you.
                      </p>

                      <p style="margin:0 0 28px;color:#4a5568;font-size:15px;line-height:1.6;">
                        We appreciate your interest in partnering with LifeSource and hope to work with your institution in the future.
                      </p>

                      <p style="margin:0;color:#4a5568;font-size:15px;">
                        Warm regards,<br/>
                        <strong>The LifeSource Team</strong>
                      </p>

                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background:#f7fafc;padding:24px 40px;border-top:1px solid #e2e8f0;text-align:center;">
                      <p style="margin:0;color:#a0aec0;font-size:12px;">
                        © ${new Date().getFullYear()} LifeSource · This is an automated message, please do not reply directly to this email.
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });
  }

  // Shared private sender — all methods funnel through here
  private async sendMail({
    to,
    subject,
    html,
  }: {
    to: string;
    subject: string;
    html: string;
  }): Promise<void> {
    try {
      await this.mailerService.sendMail({ to, subject, html });
      this.logger.log(`Email sent to ${to} — "${subject}"`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to} — "${subject}"`, error);
      throw error;
    }
  }
}
