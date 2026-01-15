import { pool } from './db';
import { 
  sendTrialEndingEmail, 
  sendTrialExpiredEmail,
  sendWeeklyUsageSummaryEmail 
} from './resend';

const TRIAL_REMINDER_DAYS = [2, 1]; // Send reminders 2 days and 1 day before expiration
const CHECK_INTERVAL_MS = 60 * 60 * 1000; // Check every hour

let isSchedulerRunning = false;

export async function checkTrialExpirations() {
  if (!pool) {
    console.log('[Email Scheduler] No database pool available');
    return;
  }

  try {
    console.log('[Email Scheduler] Checking trial expirations...');
    
    // Find users whose trials end in 2 days or 1 day
    for (const daysLeft of TRIAL_REMINDER_DAYS) {
      const result = await pool.query(`
        SELECT id, username, email, trial_ends_at 
        FROM users 
        WHERE plan = 'trial' 
          AND trial_ends_at IS NOT NULL
          AND trial_ends_at::date = (CURRENT_DATE + INTERVAL '${daysLeft} days')::date
          AND (last_trial_reminder_sent IS NULL OR last_trial_reminder_sent::date < CURRENT_DATE)
      `);
      
      for (const user of result.rows) {
        try {
          const email = user.email || user.username;
          if (email && email.includes('@')) {
            await sendTrialEndingEmail(email, user.username?.split('@')[0] || 'there', daysLeft);
            
            // Mark reminder as sent
            await pool.query(
              `UPDATE users SET last_trial_reminder_sent = NOW() WHERE id = $1`,
              [user.id]
            );
            console.log(`[Email Scheduler] Sent ${daysLeft}-day trial reminder to ${email}`);
          }
        } catch (error) {
          console.error(`[Email Scheduler] Failed to send trial reminder to user ${user.id}:`, error);
        }
      }
    }
    
    // Find users whose trials expired today (send expired notification)
    const expiredResult = await pool.query(`
      SELECT id, username, email, trial_ends_at 
      FROM users 
      WHERE plan = 'trial' 
        AND trial_ends_at IS NOT NULL
        AND trial_ends_at::date = CURRENT_DATE
        AND (last_trial_expired_sent IS NULL OR last_trial_expired_sent::date < CURRENT_DATE)
    `);
    
    for (const user of expiredResult.rows) {
      try {
        const email = user.email || user.username;
        if (email && email.includes('@')) {
          await sendTrialExpiredEmail(email, user.username?.split('@')[0] || 'there');
          
          // Mark expired notification as sent
          await pool.query(
            `UPDATE users SET last_trial_expired_sent = NOW() WHERE id = $1`,
            [user.id]
          );
          console.log(`[Email Scheduler] Sent trial expired notification to ${email}`);
        }
      } catch (error) {
        console.error(`[Email Scheduler] Failed to send trial expired to user ${user.id}:`, error);
      }
    }
    
    console.log('[Email Scheduler] Trial check complete');
  } catch (error) {
    console.error('[Email Scheduler] Error checking trial expirations:', error);
  }
}

export async function sendWeeklySummaries() {
  if (!pool) {
    console.log('[Email Scheduler] No database pool available');
    return;
  }

  try {
    console.log('[Email Scheduler] Sending weekly summaries...');
    
    // Get active users who created scripts in the last week
    const result = await pool.query(`
      SELECT 
        u.id,
        u.username,
        u.email,
        COUNT(s.id) as scripts_created,
        COALESCE(AVG(s.word_count), 0) as avg_word_count,
        (SELECT COUNT(*) FROM vault_items v WHERE v.user_id = u.id AND v.created_at >= NOW() - INTERVAL '7 days') as saved_to_vault,
        (SELECT s2.category FROM scripts s2 WHERE s2.user_id = u.id AND s2.created_at >= NOW() - INTERVAL '7 days' GROUP BY s2.category ORDER BY COUNT(*) DESC LIMIT 1) as top_category
      FROM users u
      JOIN scripts s ON s.user_id = u.id
      WHERE s.created_at >= NOW() - INTERVAL '7 days'
        AND (u.last_weekly_summary_sent IS NULL OR u.last_weekly_summary_sent < NOW() - INTERVAL '6 days')
      GROUP BY u.id, u.username, u.email
      HAVING COUNT(s.id) >= 1
    `);
    
    for (const user of result.rows) {
      try {
        const email = user.email || user.username;
        if (email && email.includes('@')) {
          await sendWeeklyUsageSummaryEmail(
            email,
            user.username?.split('@')[0] || 'there',
            {
              scriptsCreated: parseInt(user.scripts_created) || 0,
              topCategory: user.top_category || 'General',
              avgWordCount: Math.round(parseFloat(user.avg_word_count) || 0),
              savedToVault: parseInt(user.saved_to_vault) || 0,
            }
          );
          
          // Mark summary as sent
          await pool.query(
            `UPDATE users SET last_weekly_summary_sent = NOW() WHERE id = $1`,
            [user.id]
          );
          console.log(`[Email Scheduler] Sent weekly summary to ${email}`);
        }
      } catch (error) {
        console.error(`[Email Scheduler] Failed to send weekly summary to user ${user.id}:`, error);
      }
    }
    
    console.log('[Email Scheduler] Weekly summaries complete');
  } catch (error) {
    console.error('[Email Scheduler] Error sending weekly summaries:', error);
  }
}

export function startEmailScheduler() {
  if (isSchedulerRunning) {
    console.log('[Email Scheduler] Already running');
    return;
  }
  
  isSchedulerRunning = true;
  console.log('[Email Scheduler] Started - checking every hour');
  
  // Run immediately on startup (after a short delay to let DB connect)
  setTimeout(async () => {
    await checkTrialExpirations();
    
    // Check if it's Monday for weekly summary (run at ~9 AM UTC)
    const now = new Date();
    if (now.getUTCDay() === 1 && now.getUTCHours() >= 9 && now.getUTCHours() < 10) {
      await sendWeeklySummaries();
    }
  }, 10000);
  
  // Set up hourly check
  setInterval(async () => {
    await checkTrialExpirations();
    
    // Send weekly summaries on Mondays around 9 AM UTC
    const now = new Date();
    if (now.getUTCDay() === 1 && now.getUTCHours() >= 9 && now.getUTCHours() < 10) {
      await sendWeeklySummaries();
    }
  }, CHECK_INTERVAL_MS);
}
