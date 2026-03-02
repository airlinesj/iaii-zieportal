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

  if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
    console.warn('⚠️ SMTP configuration incomplete. Email service may not work.');
    console.warn('Required env vars: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS');
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: parseInt(smtpPort || '587', 10),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  return transporter;
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
              This is an automated email from the Zimbabwe Institution of Engineers Membership Portal. Please do not reply to this email.
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

This is an automated email from the Zimbabwe Institution of Engineers Membership Portal. Please do not reply to this email.
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
              This is an automated email from the Zimbabwe Institution of Engineers Membership Portal. Please do not reply to this email.
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

This is an automated email from the Zimbabwe Institution of Engineers Membership Portal. Please do not reply to this email.
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

    const info = await transporter.sendMail(mailOptions);

    console.log('✉️ Email sent:', {
      messageId: info.messageId,
      to,
      subject,
    });

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error: any) {
    console.error('❌ Error sending email:', error.message);
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
            This is an automated email from the Zimbabwe Institution of Engineers Membership Portal. Please do not reply to this email.
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
          
          <p>Thank you for submitting your membership application to Zimbabwe Institution of Engineers.</p>
          
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
            This is an automated email from the Zimbabwe Institution of Engineers Membership Portal. Please do not reply to this email.
          </p>
        </div>
      </body>
    </html>
  `;

  return sendEmail(email, 'Application Confirmation - Zimbabwe Institution of Engineers', htmlContent);
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
            This is an automated email from the Zimbabwe Institution of Engineers Membership Portal. Please do not reply to this email.
          </p>
        </div>
      </body>
    </html>
  `;

  return sendEmail(email, `Application Status Update: ${status}`, htmlContent);
}
