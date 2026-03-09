import cron, { ScheduledTask } from 'node-cron';
import { User } from '../models/User';
import { ExchangeRateService } from './ExchangeRateService';
import { AuditService } from './AuditService';
import { getAnnualFeeBothCurrencies } from './AnnualMembershipFeeService';
import { sendEmail } from './emailService';

/**
 * AnnualMembershipFeeUpdateService
 * Automatically updates outstanding membership fees for all members yearly
 * Runs on a scheduled basis (configurable, default: yearly on March 9th at 2:00 AM)
 */
export class AnnualMembershipFeeUpdateService {
  private static instance: AnnualMembershipFeeUpdateService;
  private cronJob: ScheduledTask | null = null;
  private isRunning = false;

  private constructor() {}

  static getInstance(): AnnualMembershipFeeUpdateService {
    if (!AnnualMembershipFeeUpdateService.instance) {
      AnnualMembershipFeeUpdateService.instance = new AnnualMembershipFeeUpdateService();
    }
    return AnnualMembershipFeeUpdateService.instance;
  }

  /**
   * Initialize the annual fee update job
   * Default: Runs yearly on March 9th at 2:00 AM (same concept as retention cycle)
   * Format: minute (0-59) | hour (0-23) | day of month (1-31) | month (1-12) | day of week (0-6)
   * 0 2 9 3 * = 2:00 AM on March 9th every year
   */
  initializeAnnualFeeUpdate(cronSchedule: string = '0 2 9 3 *'): void {
    try {
      console.log('🔄 Initializing Annual Membership Fee Update Service...');
      
      this.cronJob = cron.schedule(cronSchedule, async () => {
        await this.executeAnnualFeeUpdate();
      });

      console.log(`✓ Annual Membership Fee Update Service initialized`);
      console.log(`  Schedule: ${cronSchedule} (2:00 AM on March 9th each year)`);
      console.log('  All active members will have their outstanding fees recalculated');
    } catch (error) {
      console.error('❌ Error initializing Annual Membership Fee Update Service:', error);
    }
  }

  /**
   * Execute the annual fee update for all active members
   * This method:
   * 1. Gets current exchange rate
   * 2. Finds all members with active membership
   * 3. Recalculates fees based on current grade and exchange rate
   * 4. Updates the annualFeeAmount field
   * 5. Logs the action to audit trail
   * 6. Sends notification emails
   */
  async executeAnnualFeeUpdate(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️ Annual fee update already in progress, skipping...');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();
    let updatedCount = 0;
    let failedCount = 0;

    try {
      console.log('\n📅 ========== STARTING ANNUAL FEE UPDATE CYCLE ==========');
      console.log(`⏰ Timestamp: ${new Date().toISOString()}`);

      // Get current exchange rate
      const exchangeRateService = ExchangeRateService.getInstance();
      const currentRate = await exchangeRateService.getExchangeRate();
      console.log(`💱 Current Exchange Rate: USD 1 = ZWL ${currentRate.toFixed(2)}`);

      // Find all members with active membership status
      const activeMembers = await User.find({
        membershipStatus: 'member',
        currentMembershipGrade: { $in: ['Technician', 'Technologist', 'Member', 'Fellow'] },
      }).select('_id email currentMembershipGrade annualFeeAmount role');

      console.log(`👥 Found ${activeMembers.length} active members to process`);

      // Update each member's annual fee
      for (const member of activeMembers) {
        try {
          const oldFeeAmount = member.annualFeeAmount;

          // Calculate new fee based on current grade and exchange rate
          const feeInfo = getAnnualFeeBothCurrencies(
            member.currentMembershipGrade || 'Technician',
            currentRate
          );

          if (!feeInfo) {
            console.warn(`⚠️ Could not calculate fee for member ${member.email}`);
            failedCount++;
            continue;
          }

          // Update annualFeeAmount in database
          const oldAnnualFeeAmount = member.annualFeeAmount;
          member.annualFeeAmount = feeInfo.usd;
          await member.save();

          // Log this action to audit trail
          try {
            await AuditService.logAction(
              member._id.toString(),
              member.email,
              'MEMBERSHIP_FEE_UPDATED',
              'User',
              member._id,
              `Annual membership fee updated for ${feeInfo.name}. Previous: USD ${oldAnnualFeeAmount || 'N/A'}, Current: USD ${feeInfo.usd}`,
              {
                changes: {
                  before: {
                    grade: member.currentMembershipGrade,
                    annualFeeUSD: oldAnnualFeeAmount,
                  },
                  after: {
                    grade: member.currentMembershipGrade,
                    annualFeeUSD: feeInfo.usd,
                    annualFeeZWL: feeInfo.zwl,
                  },
                },
                status: 'SUCCESS',
                adminName: 'System',
              }
            );
          } catch (auditError) {
            console.warn(`⚠️ Failed to log audit entry for ${member.email}:`, auditError);
          }

          // Send notification email to member
          try {
            await sendAnnualFeeUpdateEmail({
              memberEmail: member.email,
              memberGrade: feeInfo.name,
              newFeeUSD: feeInfo.usd,
              newFeeZWL: feeInfo.zwl,
              exchangeRate: currentRate,
              updateDate: new Date(),
              previousFeeUSD: oldAnnualFeeAmount,
            });
          } catch (emailError) {
            console.warn(`⚠️ Failed to send email to ${member.email}:`, emailError);
          }

          updatedCount++;
          console.log(`✓ Updated fee for ${member.email} (${feeInfo.name}): USD ${feeInfo.usd} / ZWL ${feeInfo.zwl.toFixed(2)}`);
        } catch (error) {
          failedCount++;
          console.error(`❌ Error updating fee for member ${member.email}:`, error);
        }
      }

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log('\n📊 ========== ANNUAL FEE UPDATE COMPLETE ==========');
      console.log(`✓ Successfully updated: ${updatedCount} members`);
      console.log(`❌ Failed to update: ${failedCount} members`);
      console.log(`⏱️ Duration: ${duration} seconds`);
      console.log(`🔄 Next update: March 9, ${new Date().getFullYear() + 1} at 2:00 AM\n`);

      // Log summary to console and audit
      if (updatedCount > 0) {
        try {
          await AuditService.logAction(
            'SYSTEM',
            'system@zie.co.zw',
            'ANNUAL_FEE_CYCLE_COMPLETED',
            'System',
            'annual-fee-cycle',
            `Annual membership fee update completed. ${updatedCount} members updated, ${failedCount} failed.`,
            {
              changes: {
                after: {
                  executionTime: `${duration}s`,
                  membersProcessed: activeMembers.length,
                  successfulUpdates: updatedCount,
                  failedUpdates: failedCount,
                },
              },
              status: 'SUCCESS',
              adminName: 'System',
            }
          );
        } catch (err) {
          console.warn('⚠️ Failed to log completion to audit trail:', err);
        }
      }
    } catch (error) {
      console.error('❌ CRITICAL ERROR in executeAnnualFeeUpdate:', error);
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`⏱️ Failed after ${duration} seconds`);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Force execute the annual fee update immediately (for testing/admin)
   */
  async forceExecuteNow(): Promise<{ success: boolean; message: string; details?: any }> {
    if (this.isRunning) {
      return {
        success: false,
        message: 'Annual fee update is already running. Please wait for it to complete.',
      };
    }

    try {
      await this.executeAnnualFeeUpdate();
      return {
        success: true,
        message: 'Annual fee update executed successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        message: 'Error executing annual fee update',
        details: error.message,
      };
    }
  }

  /**
   * Stop the scheduled job
   */
  stop(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      console.log('⏹️ Annual Membership Fee Update Service stopped');
    }
  }

  /**
   * Get current status of the service
   */
  getStatus(): {
    isRunning: boolean;
    isInitialized: boolean;
    nextExecution?: string;
  } {
    return {
      isRunning: this.isRunning,
      isInitialized: this.cronJob !== null,
      nextExecution: this.cronJob ? 'March 9 at 2:00 AM (yearly)' : 'Not initialized',
    };
  }
}

/**
 * Send annual fee update notification email
 */
async function sendAnnualFeeUpdateEmail(params: {
  memberEmail: string;
  memberGrade: string;
  newFeeUSD: number;
  newFeeZWL: number;
  exchangeRate: number;
  updateDate: Date;
  previousFeeUSD?: number;
}): Promise<void> {
  const {
    memberEmail,
    memberGrade,
    newFeeUSD,
    newFeeZWL,
    exchangeRate,
    updateDate,
    previousFeeUSD,
  } = params;

  const feeChangeIndicator = previousFeeUSD ? 
    (newFeeUSD > previousFeeUSD ? '📈 INCREASED' : newFeeUSD < previousFeeUSD ? '📉 DECREASED' : '➡️ UNCHANGED') :
    '📌 ANNUAL RENEWAL';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; border-radius: 8px; }
          .header { background: linear-gradient(135deg, #004A59 0%, #0088aa 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 20px; border-radius: 0 0 8px 8px; }
          .fee-box { background: #f0f8ff; border-left: 4px solid #0088aa; padding: 15px; margin: 15px 0; border-radius: 4px; }
          .fee-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 16px; }
          .fee-label { font-weight: 600; color: #004A59; }
          .fee-value { font-size: 18px; font-weight: 700; color: #0088aa; }
          .info-box { background: #fff8e6; border-left: 4px solid #ff9800; padding: 12px; margin: 15px 0; border-radius: 4px; font-size: 14px; }
          .footer { text-align: center; padding: 15px; color: #666; font-size: 12px; border-top: 1px solid #eee; margin-top: 20px; }
          .badge { display: inline-block; padding: 5px 10px; background: #0088aa; color: white; border-radius: 4px; font-weight: 600; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Annual Membership Fee Updated</h2>
            <p>Zimbabwe Institution of Engineers</p>
          </div>
          
          <div class="content">
            <p>Dear Member,</p>
            
            <p>Your annual membership fee for <strong>${memberGrade}</strong> has been updated effective <strong>${updateDate.toLocaleDateString()}</strong>.</p>
            
            <div class="fee-box">
              <div class="fee-row">
                <span class="fee-label">Membership Grade:</span>
                <span>${memberGrade}</span>
              </div>
              <div class="fee-row">
                <span class="fee-label">Updated Fee (USD):</span>
                <span class="fee-value">$${newFeeUSD.toFixed(2)}</span>
              </div>
              <div class="fee-row">
                <span class="fee-label">Updated Fee (ZWL):</span>
                <span class="fee-value">ZWL ${newFeeZWL.toFixed(2)}</span>
              </div>
              <div class="fee-row">
                <span class="fee-label">Exchange Rate Used:</span>
                <span>1 USD = ZWL ${exchangeRate.toFixed(2)}</span>
              </div>
              ${previousFeeUSD ? `
              <div class="fee-row" style="border-top: 1px solid #ddd; padding-top: 10px; margin-top: 10px;">
                <span class="fee-label">Previous Fee (USD):</span>
                <span>$${previousFeeUSD.toFixed(2)}</span>
              </div>
              <div class="fee-row">
                <span class="fee-label">Status:</span>
                <span class="badge">${feeChangeIndicator}</span>
              </div>
              ` : ''}
            </div>
            
            <div class="info-box">
              <strong>💡 Important Information</strong>
              <p>Your annual membership renewal is due within the next 365 days. Please ensure timely payment to maintain your membership status and access to member benefits.</p>
            </div>
            
            <p>If you have any questions about your membership renewal or fee calculation, please contact us at:</p>
            <ul>
              <li>Email: <a href="mailto:members@zie.co.zw">members@zie.co.zw</a></li>
              <li>Phone: +263 (0)4 333 166</li>
            </ul>
            
            <p>Thank you for your continued membership with ZIE.</p>
            
            <p>Best regards,<br><strong>Zimbabwe Institution of Engineers</strong><br>Membership Department</p>
          </div>
          
          <div class="footer">
            <p>This is an automated notification. Do not reply to this email.</p>
            <p>© ${new Date().getFullYear()} Zimbabwe Institution of Engineers. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    await sendEmail(
      memberEmail,
      `Annual Membership Fee Update - ${memberGrade} ${feeChangeIndicator}`,
      htmlContent
    );
    console.log(`📧 Sent fee update email to ${memberEmail}`);
  } catch (error) {
    console.error(`❌ Failed to send email to ${memberEmail}:`, error);
    throw error;
  }
}
