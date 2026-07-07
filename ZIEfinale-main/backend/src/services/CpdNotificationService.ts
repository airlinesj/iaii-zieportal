/**
 * CPD Notification Service
 * Handles email notifications for CPD applications
 */

import nodemailer from 'nodemailer';

// Email transporter configuration (adjust based on your email setup)
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'localhost',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: process.env.EMAIL_USER ? {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  } : undefined,
});

export class CpdNotificationService {
  /**
   * Send approval notification email to applicant
   */
  static async sendApprovalNotification(
    email: string,
    companyName: string,
    courseTitle: string,
    paymentAmount: number,
    currency: string,
    applicationId: string
  ): Promise<void> {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@zie.org.zw',
        to: email,
        subject: `CPD Application Approved - Payment Required for ${courseTitle}`,
        html: `
          <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #2c3e50; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background-color: #f9f9f9; }
                .footer { text-align: center; padding: 20px; font-size: 0.9em; color: #666; }
                .button { display: inline-block; background-color: #27ae60; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; }
                .details { background-color: white; padding: 15px; border-left: 4px solid #27ae60; margin: 15px 0; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h2>CPD Application Approved</h2>
                </div>
                <div class="content">
                  <p>Dear Applicant,</p>
                  <p>We are pleased to inform you that your CPD (Continuing Professional Development) application has been <strong>approved</strong> by our assessment team.</p>
                  
                  <div class="details">
                    <h3>Application Details:</h3>
                    <p><strong>Organization:</strong> ${companyName}</p>
                    <p><strong>Course Title:</strong> ${courseTitle}</p>
                    <p><strong>Application ID:</strong> ${applicationId}</p>
                  </div>

                  <h3>Next Step: Payment Required</h3>
                  <p>To proceed with your training, please complete the payment of <strong>${currency} ${paymentAmount.toFixed(2)}</strong>.</p>
                  <p>Once you log in to the portal, you will see the payment option on your CPD application dashboard. Click "Pay Now" to proceed to our secure payment gateway.</p>

                  <p>Payment methods accepted:</p>
                  <ul>
                    <li>Credit/Debit Card (Visa, MasterCard)</li>
                    <li>Bank Transfer</li>
                    <li>Mobile Money (where applicable)</li>
                  </ul>

                  <a href="${process.env.PORTAL_URL || 'https://portal.zie.org.zw'}/cpd/${applicationId}" class="button">Go to Payment Page</a>

                  <h3>Important Notes:</h3>
                  <ul>
                    <li>Your CPD approval is valid for 30 days from the date of this email</li>
                    <li>Payment must be completed within this period to secure your training slot</li>
                    <li>You will receive a confirmation email immediately after successful payment</li>
                    <li>Our support team is available to assist with any payment issues</li>
                  </ul>

                  <p>If you have any questions, please contact our support team at <strong>cpd@zie.org.zw</strong> or call <strong>+263 XXX XXXXXX</strong>.</p>
                </div>
                <div class="footer">
                  <p>&copy; 2024 The ZImbabwe Institution of Engineers (ZIE). All rights reserved.</p>
                </div>
              </div>
            </body>
          </html>
        `,
      };

      await transporter.sendMail(mailOptions);
      console.log(`✓ Approval notification sent to ${email}`);
    } catch (error) {
      console.error('Error sending approval notification:', error);
      throw error;
    }
  }

  /**
   * Send rejection notification email to applicant
   */
  static async sendRejectionNotification(
    email: string,
    companyName: string,
    courseTitle: string,
    rejectionReason: string,
    applicationId: string
  ): Promise<void> {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@zie.org.zw',
        to: email,
        subject: `CPD Application Status Update for ${courseTitle}`,
        html: `
          <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #c0392b; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background-color: #f9f9f9; }
                .footer { text-align: center; padding: 20px; font-size: 0.9em; color: #666; }
                .alert { background-color: #ffebee; padding: 15px; border-left: 4px solid #c0392b; margin: 15px 0; }
                .details { background-color: white; padding: 15px; border-left: 4px solid #c0392b; margin: 15px 0; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h2>CPD Application Status Update</h2>
                </div>
                <div class="content">
                  <p>Dear Applicant,</p>
                  <p>Thank you for submitting your CPD application. After careful review by our assessment team, we regret to inform you that your application was not approved at this time.</p>
                  
                  <div class="details">
                    <h3>Application Details:</h3>
                    <p><strong>Organization:</strong> ${companyName}</p>
                    <p><strong>Course Title:</strong> ${courseTitle}</p>
                    <p><strong>Application ID:</strong> ${applicationId}</p>
                  </div>

                  <div class="alert">
                    <h3>Reason for Non-Approval:</h3>
                    <p>${rejectionReason}</p>
                  </div>

                  <h3>Next Steps:</h3>
                  <p>You are welcome to resubmit your application after addressing the feedback provided above. Please ensure all required documents are complete and accurate.</p>

                  <p>For further clarification or to discuss your application, please contact our CPD team at:</p>
                  <ul>
                    <li>Email: <strong>cpd@zie.org.zw</strong></li>
                    <li>Phone: <strong>+263 XXX XXXXXX</strong></li>
                  </ul>

                  <p>We appreciate your effort and wish you success with your future CPD initiatives.</p>
                </div>
                <div class="footer">
                  <p>&copy; 2024 The ZImbabwe Institution of Engineers (ZIE). All rights reserved.</p>
                </div>
              </div>
            </body>
          </html>
        `,
      };

      await transporter.sendMail(mailOptions);
      console.log(`✓ Rejection notification sent to ${email}`);
    } catch (error) {
      console.error('Error sending rejection notification:', error);
      throw error;
    }
  }

  /**
   * Send payment confirmation email
   */
  static async sendPaymentConfirmation(
    email: string,
    companyName: string,
    courseTitle: string,
    paymentAmount: number,
    currency: string,
    transactionId: string,
    applicationId: string
  ): Promise<void> {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@zie.org.zw',
        to: email,
        subject: `Payment Confirmation - CPD Training for ${courseTitle}`,
        html: `
          <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #27ae60; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background-color: #f9f9f9; }
                .footer { text-align: center; padding: 20px; font-size: 0.9em; color: #666; }
                .success { background-color: #e8f5e9; padding: 15px; border-left: 4px solid #27ae60; margin: 15px 0; }
                .receipt { background-color: white; padding: 15px; border: 1px solid #ddd; margin: 15px 0; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h2>Payment Confirmation</h2>
                </div>
                <div class="content">
                  <p>Dear Applicant,</p>
                  <p>Thank you for your payment! We have successfully received your payment for the CPD training program.</p>
                  
                  <div class="success">
                    <h3>✓ Payment Successful</h3>
                    <p>Your training is now confirmed and you can proceed with the accreditation process.</p>
                  </div>

                  <div class="receipt">
                    <h3>Payment Receipt:</h3>
                    <p><strong>Organization:</strong> ${companyName}</p>
                    <p><strong>Course Title:</strong> ${courseTitle}</p>
                    <p><strong>Amount Paid:</strong> ${currency} ${paymentAmount.toFixed(2)}</p>
                    <p><strong>Transaction ID:</strong> ${transactionId}</p>
                    <p><strong>Application ID:</strong> ${applicationId}</p>
                    <p><strong>Payment Date:</strong> ${new Date().toLocaleDateString()}</p>
                  </div>

                  <h3>What Happens Next:</h3>
                  <ol>
                    <li>Your payment has been recorded in the system</li>
                    <li>Your training details have been registered in the admin dashboard</li>
                    <li>Our administrative team will process your application within 2-3 business days</li>
                    <li>You will receive a confirmation email with your training schedule and materials</li>
                  </ol>

                  <h3>Important Information:</h3>
                  <ul>
                    <li>Keep your transaction ID for your records: <strong>${transactionId}</strong></li>
                    <li>A summary of this training will appear on your member dashboard</li>
                    <li>CPD hours will be credited after successful course completion</li>
                  </ul>

                  <p>If you have any questions about your payment or training, please contact us at <strong>cpd@zie.org.zw</strong>.</p>
                </div>
                <div class="footer">
                  <p>&copy; 2024 The ZImbabwe Institution of Engineers (ZIE). All rights reserved.</p>
                </div>
              </div>
            </body>
          </html>
        `,
      };

      await transporter.sendMail(mailOptions);
      console.log(`✓ Payment confirmation sent to ${email}`);
    } catch (error) {
      console.error('Error sending payment confirmation:', error);
      throw error;
    }
  }

  /**
   * Send notification to admins about new CPD application requiring approval
   */
  static async notifyAdminsOfNewApplication(
    adminEmails: string[],
    companyName: string,
    courseTitle: string,
    applicantEmail: string,
    applicationId: string
  ): Promise<void> {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@zie.org.zw',
        to: adminEmails.join(','),
        subject: `New CPD Application Requires Approval: ${courseTitle}`,
        html: `
          <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #2c3e50; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background-color: #f9f9f9; }
                .footer { text-align: center; padding: 20px; font-size: 0.9em; color: #666; }
                .alert { background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 15px 0; }
                .details { background-color: white; padding: 15px; border-left: 4px solid #2c3e50; margin: 15px 0; }
                .button { display: inline-block; background-color: #2c3e50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h2>New CPD Application Pending Review</h2>
                </div>
                <div class="content">
                  <p>Dear Administrator,</p>
                  <p>A new CPD (Continuing Professional Development) application has been submitted and is awaiting your review and approval.</p>
                  
                  <div class="alert">
                    <h3>Action Required</h3>
                    <p>Please review this application and approve or reject it. Once approved, the applicant will be notified and can proceed with payment.</p>
                  </div>

                  <div class="details">
                    <h3>Application Details:</h3>
                    <p><strong>Organization:</strong> ${companyName}</p>
                    <p><strong>Course Title:</strong> ${courseTitle}</p>
                    <p><strong>Applicant Email:</strong> ${applicantEmail}</p>
                    <p><strong>Application ID:</strong> ${applicationId}</p>
                    <p><strong>Submitted Date:</strong> ${new Date().toLocaleDateString()}</p>
                  </div>

                  <p style="text-align: center;">
                    <a href="${process.env.ADMIN_URL || 'https://admin.zie.org.zw'}/cpd/${applicationId}" class="button">Review Application</a>
                    <a href="${process.env.ADMIN_URL || 'https://admin.zie.org.zw'}/cpd/pending" class="button">View All Pending</a>
                  </p>

                  <p>Best regards,<br>CPD Management System</p>
                </div>
                <div class="footer">
                  <p>&copy; 2024 The ZImbabwe Institution of Engineers (ZIE). All rights reserved.</p>
                </div>
              </div>
            </body>
          </html>
        `,
      };

      await transporter.sendMail(mailOptions);
      console.log(`✓ Admin notification sent to ${adminEmails.join(', ')}`);
    } catch (error) {
      console.error('Error sending admin notification:', error);
      throw error;
    }
  }

  /**
   * Send payment reminder email
   */
  static async sendPaymentReminder(
    email: string,
    companyName: string,
    courseTitle: string,
    paymentAmount: number,
    currency: string,
    applicationId: string,
    daysRemaining: number
  ): Promise<void> {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@zie.org.zw',
        to: email,
        subject: `Payment Reminder: ${courseTitle} - ${daysRemaining} days remaining`,
        html: `
          <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #f39c12; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background-color: #f9f9f9; }
                .footer { text-align: center; padding: 20px; font-size: 0.9em; color: #666; }
                .alert { background-color: #fff3cd; padding: 15px; border-left: 4px solid #f39c12; margin: 15px 0; }
                .button { display: inline-block; background-color: #27ae60; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h2>Payment Reminder</h2>
                </div>
                <div class="content">
                  <p>Dear Applicant,</p>
                  <p>This is a friendly reminder that your payment is pending for the CPD application.</p>
                  
                  <div class="alert">
                    <h3>⏰ Time Remaining: ${daysRemaining} days</h3>
                    <p>Your approval will expire if payment is not completed within ${daysRemaining} days.</p>
                  </div>

                  <h3>Application Details:</h3>
                  <p><strong>Course:</strong> ${courseTitle}</p>
                  <p><strong>Organization:</strong> ${companyName}</p>
                  <p><strong>Amount Due:</strong> ${currency} ${paymentAmount.toFixed(2)}</p>

                  <p style="text-align: center;">
                    <a href="${process.env.PORTAL_URL || 'https://portal.zie.org.zw'}/cpd/${applicationId}" class="button">Complete Payment Now</a>
                  </p>

                  <p>If you have already made the payment, please disregard this message. If you experience any difficulties with the payment process, please contact our support team.</p>
                </div>
                <div class="footer">
                  <p>&copy; 2024 The ZImbabwe Institution of Engineers (ZIE). All rights reserved.</p>
                </div>
              </div>
            </body>
          </html>
        `,
      };

      await transporter.sendMail(mailOptions);
      console.log(`✓ Payment reminder sent to ${email}`);
    } catch (error) {
      console.error('Error sending payment reminder:', error);
      throw error;
    }
  }
}

export default CpdNotificationService;
