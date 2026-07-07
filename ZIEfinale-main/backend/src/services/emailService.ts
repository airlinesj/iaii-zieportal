import nodemailer from 'nodemailer';

interface RefereeAppraisalEmailData {
  applicantName: string;
  applicantEmail: string;
  refereeName: string;
  refereeEmail: string;
  applicationId: string;
  refereeToken: string;
}

interface SponsorAppraisalEmailData {
  applicantName: string;
  applicantEmail: string;
  sponsorName: string;
  sponsorEmail: string;
  applicationId: string;
  sponsorToken: string;
}

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Create transporter from environment variables
function getEmailTransporter() {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpSecure = process.env.SMTP_SECURE === 'true';

  if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
    console.warn('⚠️ SMTP configuration incomplete. Email service may not work.');
    console.warn('Required env vars: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS');
    console.warn('Current config:', {
      SMTP_HOST: smtpHost ? '✓' : '✗',
      SMTP_PORT: smtpPort ? '✓' : '✗',
      SMTP_USER: smtpUser ? '✓' : '✗',
      SMTP_PASS: smtpPass ? '✓' : '✗',
      SMTP_SECURE: smtpSecure,
      SMTP_FROM: process.env.SMTP_FROM ? '✓' : '✗',
    });
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: parseInt(smtpPort || '587', 10),
    secure: smtpSecure, // true for 465, false for 587
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
    // Improve connection reliability
    requireTLS: !smtpSecure, // TLS required for port 587
    tls: {
      rejectUnauthorized: false, // Allow self-signed certs for testing
    },
  });

  return transporter;
}

/**
 * Test SMTP connection
 */
export async function testSMTPConnection(): Promise<{ success: boolean; message: string; error?: string }> {
  try {
    const transporter = getEmailTransporter();
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT;
    const smtpUser = process.env.SMTP_USER;
    const smtpSecure = process.env.SMTP_SECURE === 'true';

    console.log('🧪 Testing SMTP Connection...');
    console.log('   Host:', smtpHost);
    console.log('   Port:', smtpPort);
    console.log('   Secure (TLS):', smtpSecure);
    console.log('   User:', smtpUser);

    await transporter.verify();

    console.log('✅ SMTP Connection Successful!');
    return {
      success: true,
      message: `Successfully connected to ${smtpHost}:${smtpPort} as ${smtpUser}`,
    };
  } catch (error: any) {
    console.error('❌ SMTP Connection Failed:', {
      error: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
    });
    return {
      success: false,
      message: 'SMTP connection failed',
      error: error.message,
    };
  }
}

/**
 * Send a test email to verify SMTP is working
 */
export async function sendTestEmail(toEmail: string): Promise<EmailResult> {
  try {
    console.log('📧 Sending test email to:', toEmail);
    
    const htmlContent = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
            <h2 style="color: #2c3e50;">✅ SMTP Test Successful</h2>
            
            <p>This is a test email to verify your SMTP configuration is working correctly.</p>
            
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Test Details:</strong></p>
              <p>Timestamp: ${new Date().toISOString()}</p>
              <p>From: ${process.env.SMTP_FROM || process.env.SMTP_USER}</p>
            </div>
            
            <p>If you received this email, your SMTP configuration is working correctly!</p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            
            <p style="font-size: 12px; color: #666;">
              This is an automated test email from the ZIE Membership Portal.
            </p>
          </div>
        </body>
      </html>
    `;

    return sendEmail(toEmail, '✅ SMTP Test Email - Configuration Verified', htmlContent);
  } catch (error: any) {
    console.error('❌ Error sending test email:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Send referee appraisal email to a referee
 */
export async function sendRefereeAppraisalEmail(data: RefereeAppraisalEmailData): Promise<EmailResult> {
  try {
    const transporter = getEmailTransporter();
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';

    // Build the referee appraisal link
    const appraisalLink = `${frontendUrl}/referee-review?applicationId=${encodeURIComponent(data.applicationId)}&token=${encodeURIComponent(data.refereeToken)}`;

    // HTML email template
    const htmlContent = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
            <h2 style="color: #2c3e50;">Referee Appraisal Request</h2>
            
            <p>Dear <strong>${data.refereeName}</strong>,</p>
            
            <p>You have been nominated as a referee for the following applicant:</p>
            
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Applicant Name:</strong> ${data.applicantName}</p>
              <p><strong>Applicant Email:</strong> ${data.applicantEmail}</p>
              <p><strong>Application ID:</strong> ${data.applicationId}</p>
            </div>
            
            <p>Please review the application and provide your appraisal by clicking the link below:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${appraisalLink}" style="background-color: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                View & Appraise Application
              </a>
            </div>
            
            <p style="font-size: 12px; color: #666;">
              If the link doesn't work, copy and paste this URL in your browser:<br/>
              ${appraisalLink}
            </p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            
            <p style="font-size: 12px; color: #666;">
              This is an automated email from the The ZImbabwe Institution of Engineers Membership Portal. Please do not reply to this email.
            </p>
          </div>
        </body>
      </html>
    `;

    // Plain text version
    const textContent = `
Referee Appraisal Request

Dear ${data.refereeName},

You have been nominated as a referee for the following applicant:

Applicant Name: ${data.applicantName}
Applicant Email: ${data.applicantEmail}
Application ID: ${data.applicationId}

Please review the application and provide your appraisal using the following link:
${appraisalLink}

This is an automated email from the The ZImbabwe Institution of Engineers Membership Portal. Please do not reply to this email.
    `;

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: data.refereeEmail,
      subject: `Referee Appraisal Request for ${data.applicantName}`,
      text: textContent,
      html: htmlContent,
    };;

    const info = await transporter.sendMail(mailOptions);

    console.log('✉️ Referee appraisal email sent:', {
      messageId: info.messageId,
      to: data.refereeEmail,
      applicationId: data.applicationId,
    });

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error: any) {
    console.error('❌ Error sending referee appraisal email:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Send sponsor appraisal email to a sponsor
 */
export async function sendSponsorAppraisalEmail(data: SponsorAppraisalEmailData): Promise<EmailResult> {
  try {
    const transporter = getEmailTransporter();
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';

    // Build the sponsor appraisal link
    const appraisalLink = `${frontendUrl}/sponsor-review?applicationId=${encodeURIComponent(data.applicationId)}&token=${encodeURIComponent(data.sponsorToken)}`;

    // HTML email template
    const htmlContent = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
            <h2 style="color: #2c3e50;">Sponsor Appraisal Request</h2>
            
            <p>Dear <strong>${data.sponsorName}</strong>,</p>
            
            <p>You have been nominated as a sponsor for the following applicant:</p>
            
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Applicant Name:</strong> ${data.applicantName}</p>
              <p><strong>Applicant Email:</strong> ${data.applicantEmail}</p>
              <p><strong>Application ID:</strong> ${data.applicationId}</p>
            </div>
            
            <p>Please review the application and provide your appraisal by clicking the link below:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${appraisalLink}" style="background-color: #27ae60; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                View & Appraise Application
              </a>
            </div>
            
            <p style="font-size: 12px; color: #666;">
              If the link doesn't work, copy and paste this URL in your browser:<br/>
              ${appraisalLink}
            </p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            
            <p style="font-size: 12px; color: #666;">
              This is an automated email from the The ZImbabwe Institution of Engineers Membership Portal. Please do not reply to this email.
            </p>
          </div>
        </body>
      </html>
    `;

    // Plain text version
    const textContent = `
Sponsor Appraisal Request

Dear ${data.sponsorName},

You have been nominated as a sponsor for the following applicant:

Applicant Name: ${data.applicantName}
Applicant Email: ${data.applicantEmail}
Application ID: ${data.applicationId}

Please review the application and provide your appraisal using the following link:
${appraisalLink}

This is an automated email from the The ZImbabwe Institution of Engineers Membership Portal. Please do not reply to this email.
    `;

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: data.sponsorEmail,
      subject: `Sponsor Appraisal Request for ${data.applicantName}`,
      text: textContent,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log('✉️ Sponsor appraisal email sent:', {
      messageId: info.messageId,
      to: data.sponsorEmail,
      applicationId: data.applicationId,
    });

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error: any) {
    console.error('❌ Error sending sponsor appraisal email:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Generic email sender for other use cases
 */
export async function sendEmail(
  to: string,
  subject: string,
  htmlContent: string,
  textContent?: string
): Promise<EmailResult> {
  try {
    const transporter = getEmailTransporter();

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      text: textContent || htmlContent.replace(/<[^>]*>/g, ''), // Strip HTML tags if no plain text provided
      html: htmlContent,
    };

    console.log('📧 Attempting to send email:', {
      from: mailOptions.from,
      to,
      subject,
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE,
    });

    const info = await transporter.sendMail(mailOptions);

    console.log('✅ Email sent successfully:', {
      messageId: info.messageId,
      to,
      subject,
      response: info.response,
    });

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error: any) {
    console.error('❌ Error sending email:', {
      to,
      subject,
      error: error.message,
      code: error.code,
      command: error.command,
      full_error: error,
    });
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Send interview notification email
 */
export async function sendInterviewNotificationEmail(
  applicantEmail: string,
  applicantName: string,
  interviewDetails: string
): Promise<EmailResult> {
  const htmlContent = `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
          <h2 style="color: #2c3e50;">Interview Notification</h2>
          
          <p>Dear <strong>${applicantName}</strong>,</p>
          
          <p>Congratulations! You have been invited for an interview.</p>
          
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p>${interviewDetails}</p>
          </div>
          
          <p>Please ensure you arrive on time and bring all required documents.</p>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          
          <p style="font-size: 12px; color: #666;">
            This is an automated email from the The ZImbabwe Institution of Engineers Membership Portal. Please do not reply to this email.
          </p>
        </div>
      </body>
    </html>
  `;

  return sendEmail(applicantEmail, 'Interview Notification', htmlContent);
}

/**
 * Send application confirmation email
 */
export async function sendApplicationConfirmationEmail(
  email: string,
  name: string,
  applicationId: string
): Promise<EmailResult> {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';

  const htmlContent = `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
          <h2 style="color: #2c3e50;">Application Received</h2>
          
          <p>Dear <strong>${name}</strong>,</p>
          
          <p>Thank you for submitting your membership application to The ZImbabwe Institution of Engineers.</p>
          
          <p>Your application has been received and is currently being reviewed. Below are your application details:</p>
          
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Application ID:</strong> ${applicationId}</p>
          </div>
          
          <p>You can track the progress of your application by logging into your portal:</p>
          
          <div style="text-align: center; margin: 20px 0;">
            <a href="${frontendUrl}/dashboard" style="background-color: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              View My Application
            </a>
          </div>
          
          <p>If you have any questions, please contact us at support@zie.org.zw</p>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          
          <p style="font-size: 12px; color: #666;">
            This is an automated email from the The ZImbabwe Institution of Engineers Membership Portal. Please do not reply to this email.
          </p>
        </div>
      </body>
    </html>
  `;

  return sendEmail(email, 'Application Confirmation - The ZImbabwe Institution of Engineers', htmlContent);
}

/**
 * Send status update email
 */
export async function sendStatusUpdateEmail(
  email: string,
  name: string,
  status: string,
  customMessage?: string
): Promise<EmailResult> {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';

  // Determine status color and message
  let statusColor = '#3498db';
  let statusMessage = customMessage || `Your application status has been updated to: <strong>${status}</strong>`;

  if (!customMessage) {
    if (status === 'Approved' || status === 'Passed' || status === 'Interview Passed') {
      statusColor = '#27ae60';
      statusMessage = `Congratulations! Your application status has been updated to: <strong style="color: ${statusColor};">${status}</strong>`;
    } else if (status === 'Rejected' || status === 'Interview Failed') {
      statusColor = '#e74c3c';
      statusMessage = `Your application status has been updated to: <strong style="color: ${statusColor};">${status}</strong>`;
    } else if (status === 'Under Review' || status === 'Pending') {
      statusColor = '#f39c12';
    }
  }

  const htmlContent = `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
          <h2 style="color: #2c3e50;">Application Status Update</h2>
          
          <p>Dear <strong>${name}</strong>,</p>
          
          <p>${statusMessage}</p>
          
          <div style="background-color: ${statusColor}; color: white; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; font-size: 18px;">Status: <strong>${status}</strong></p>
          </div>
          
          <p>Please log in to your account to view more details:</p>
          
          <div style="text-align: center; margin: 20px 0;">
            <a href="${frontendUrl}/dashboard" style="background-color: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              View Application Details
            </a>
          </div>
          
          <p>If you have any questions, please contact us at support@zie.org.zw</p>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          
          <p style="font-size: 12px; color: #666;">
            This is an automated email from the The ZImbabwe Institution of Engineers Membership Portal. Please do not reply to this email.
          </p>
        </div>
      </body>
    </html>
  `;

  return sendEmail(email, `Application Status Update: ${status}`, htmlContent);
}

/**
 * Send exchange rate approval request notification to superadmin
 */
export async function sendExchangeRateApprovalEmail(data: {
  superAdminName: string;
  superAdminEmail: string;
  adminName: string;
  adminEmail: string;
  currentRate: number;
  requestedRate: number;
  reason: string;
  approvalId: string;
}): Promise<EmailResult> {
  try {
    const transporter = getEmailTransporter();
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
    const percentChange = (((data.requestedRate - data.currentRate) / data.currentRate) * 100).toFixed(2);

    const htmlContent = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
            <h2 style="color: #c0392b;">⚠️ Exchange Rate Update Request Pending Approval</h2>
            
            <p>Dear <strong>${data.superAdminName}</strong>,</p>
            
            <p>An admin has submitted a request to update the USD to ZWL exchange rate. Your approval is required.</p>
            
            <div style="background-color: #ecf0f1; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #2c3e50;">Exchange Rate Details</h3>
              
              <table style="width: 100%; border-collapse: collapse;">
                <tr style="border-bottom: 1px solid #bdc3c7;">
                  <td style="padding: 10px; font-weight: bold;">Current Rate:</td>
                  <td style="padding: 10px;">1 USD = ZWL ${data.currentRate.toFixed(2)}</td>
                </tr>
                <tr style="border-bottom: 1px solid #bdc3c7;">
                  <td style="padding: 10px; font-weight: bold;">Requested Rate:</td>
                  <td style="padding: 10px;">1 USD = ZWL ${data.requestedRate.toFixed(2)}</td>
                </tr>
                <tr style="border-bottom: 1px solid #bdc3c7;">
                  <td style="padding: 10px; font-weight: bold;">Change:</td>
                  <td style="padding: 10px; color: ${data.requestedRate > data.currentRate ? '#e74c3c' : '#27ae60'};">
                    ${data.requestedRate > data.currentRate ? '+' : ''}${(data.requestedRate - data.currentRate).toFixed(2)} (${percentChange}%)
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px; font-weight: bold;">Requested By:</td>
                  <td style="padding: 10px;">${data.adminName} (${data.adminEmail})</td>
                </tr>
              </table>
              
              <h4 style="margin: 20px 0 10px 0; color: #2c3e50;">Reason for Update:</h4>
              <p style="margin: 0; padding: 10px; background-color: white; border-left: 3px solid #3498db;">
                ${data.reason}
              </p>
            </div>
            
            <p style="color: #c0392b; font-weight: bold;">Please review and take action:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${frontendUrl}/admin/exchange-rate-approvals/${data.approvalId}" style="background-color: #27ae60; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin-right: 10px;">
                Review & Approve/Reject
              </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            
            <p style="font-size: 12px; color: #666;">
              This is an automated email from the The ZImbabwe Institution of Engineers Membership Portal. Please do not reply to this email.
            </p>
          </div>
        </body>
      </html>
    `;

    const textContent = `
Exchange Rate Update Request - Pending Approval

Dear ${data.superAdminName},

An admin has submitted a request to update the USD to ZWL exchange rate. Your approval is required.

Current Rate: 1 USD = ZWL ${data.currentRate.toFixed(2)}
Requested Rate: 1 USD = ZWL ${data.requestedRate.toFixed(2)}
Change: ${data.requestedRate > data.currentRate ? '+' : ''}${(data.requestedRate - data.currentRate).toFixed(2)} (${percentChange}%)

Requested By: ${data.adminName} (${data.adminEmail})

Reason for Update:
${data.reason}

Please review and take action at:
${frontendUrl}/admin/exchange-rate-approvals/${data.approvalId}

This is an automated email from the The ZImbabwe Institution of Engineers Membership Portal. Please do not reply to this email.
    `;

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: data.superAdminEmail,
      subject: `⚠️ Exchange Rate Update Approval Required`,
      text: textContent,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log('✉️ Exchange rate approval request email sent:', {
      messageId: info.messageId,
      to: data.superAdminEmail,
      approvalId: data.approvalId,
    });

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error: any) {
    console.error('❌ Error sending exchange rate approval email:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Send exchange rate approved notification to admin
 */
export async function sendExchangeRateApprovedEmail(data: {
  adminName: string;
  adminEmail: string;
  oldRate: number;
  newRate: number;
  approvalComment: string;
}): Promise<EmailResult> {
  try {
    const transporter = getEmailTransporter();

    const htmlContent = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
            <h2 style="color: #27ae60;">✓ Exchange Rate Update Approved</h2>
            
            <p>Dear <strong>${data.adminName}</strong>,</p>
            
            <p>Your exchange rate update request has been <strong>approved by a superadmin</strong>.</p>
            
            <div style="background-color: #d5f4e6; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #27ae60;">
              <h3 style="margin-top: 0; color: #27ae60;">Rate Update Applied</h3>
              
              <table style="width: 100%; border-collapse: collapse;">
                <tr style="border-bottom: 1px solid #a9dfbf;">
                  <td style="padding: 10px; font-weight: bold;">Previous Rate:</td>
                  <td style="padding: 10px;">1 USD = ZWL ${data.oldRate.toFixed(2)}</td>
                </tr>
                <tr style="border-bottom: 1px solid #a9dfbf;">
                  <td style="padding: 10px; font-weight: bold;">New Rate:</td>
                  <td style="padding: 10px;">1 USD = ZWL ${data.newRate.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; font-weight: bold;">Status:</td>
                  <td style="padding: 10px; color: #27ae60; font-weight: bold;">Active</td>
                </tr>
              </table>
            </div>
            
            <h4 style="margin: 20px 0 10px 0; color: #2c3e50;">Approval Comment:</h4>
            <p style="margin: 0; padding: 10px; background-color: #ecf0f1; border-left: 3px solid #27ae60;">
              ${data.approvalComment}
            </p>
            
            <p style="margin-top: 20px; color: #666; font-size: 14px;">
              The new exchange rate is now active in the system and will be used for all future fee calculations.
            </p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            
            <p style="font-size: 12px; color: #666;">
              This is an automated email from the The ZImbabwe Institution of Engineers Membership Portal. Please do not reply to this email.
            </p>
          </div>
        </body>
      </html>
    `;

    const textContent = `
Exchange Rate Update Approved

Dear ${data.adminName},

Your exchange rate update request has been approved by a superadmin.

Previous Rate: 1 USD = ZWL ${data.oldRate.toFixed(2)}
New Rate: 1 USD = ZWL ${data.newRate.toFixed(2)}
Status: Active

Approval Comment:
${data.approvalComment}

The new exchange rate is now active in the system and will be used for all future fee calculations.

This is an automated email from the The ZImbabwe Institution of Engineers Membership Portal. Please do not reply to this email.
    `;

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: data.adminEmail,
      subject: `✓ Your Exchange Rate Update Has Been Approved`,
      text: textContent,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log('✉️ Exchange rate approved email sent:', {
      messageId: info.messageId,
      to: data.adminEmail,
    });

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error: any) {
    console.error('❌ Error sending exchange rate approved email:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Send exchange rate rejected notification to admin
 */
export async function sendExchangeRateRejectedEmail(data: {
  adminName: string;
  adminEmail: string;
  requestedRate: number;
  currentRate: number;
  rejectionReason: string;
}): Promise<EmailResult> {
  try {
    const transporter = getEmailTransporter();

    const htmlContent = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
            <h2 style="color: #e74c3c;">✗ Exchange Rate Update Rejected</h2>
            
            <p>Dear <strong>${data.adminName}</strong>,</p>
            
            <p>Your exchange rate update request has been <strong>rejected by a superadmin</strong>.</p>
            
            <div style="background-color: #fadbd8; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #e74c3c;">
              <h3 style="margin-top: 0; color: #e74c3c;">Request Details</h3>
              
              <table style="width: 100%; border-collapse: collapse;">
                <tr style="border-bottom: 1px solid #f5b7b1;">
                  <td style="padding: 10px; font-weight: bold;">Current Rate:</td>
                  <td style="padding: 10px;">1 USD = ZWL ${data.currentRate.toFixed(2)} (Still Active)</td>
                </tr>
                <tr style="border-bottom: 1px solid #f5b7b1;">
                  <td style="padding: 10px; font-weight: bold;">Requested Rate:</td>
                  <td style="padding: 10px;">1 USD = ZWL ${data.requestedRate.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; font-weight: bold;">Status:</td>
                  <td style="padding: 10px; color: #e74c3c; font-weight: bold;">Rejected</td>
                </tr>
              </table>
            </div>
            
            <h4 style="margin: 20px 0 10px 0; color: #2c3e50;">Rejection Reason:</h4>
            <p style="margin: 0; padding: 10px; background-color: #ecf0f1; border-left: 3px solid #e74c3c;">
              ${data.rejectionReason}
            </p>
            
            <p style="margin-top: 20px; color: #666; font-size: 14px;">
              If you believe this request should be reconsidered, please contact a superadmin or submit a new request with additional information.
            </p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            
            <p style="font-size: 12px; color: #666;">
              This is an automated email from the The ZImbabwe Institution of Engineers Membership Portal. Please do not reply to this email.
            </p>
          </div>
        </body>
      </html>
    `;

    const textContent = `
Exchange Rate Update Rejected

Dear ${data.adminName},

Your exchange rate update request has been rejected by a superadmin.

Current Rate: 1 USD = ZWL ${data.currentRate.toFixed(2)} (Still Active)
Requested Rate: 1 USD = ZWL ${data.requestedRate.toFixed(2)}
Status: Rejected

Rejection Reason:
${data.rejectionReason}

If you believe this request should be reconsidered, please contact a superadmin or submit a new request with additional information.

This is an automated email from the The ZImbabwe Institution of Engineers Membership Portal. Please do not reply to this email.
    `;

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: data.adminEmail,
      subject: `✗ Your Exchange Rate Update Has Been Rejected`,
      text: textContent,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log('✉️ Exchange rate rejected email sent:', {
      messageId: info.messageId,
      to: data.adminEmail,
    });

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error: any) {
    console.error('❌ Error sending exchange rate rejected email:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}
