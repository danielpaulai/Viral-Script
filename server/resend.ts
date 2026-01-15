import { Resend } from 'resend';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.api_key)) {
    throw new Error('Resend not connected');
  }
  return {
    apiKey: connectionSettings.settings.api_key, 
    fromEmail: connectionSettings.settings.from_email
  };
}

export async function getResendClient() {
  const { apiKey, fromEmail } = await getCredentials();
  return {
    client: new Resend(apiKey),
    fromEmail
  };
}

export async function sendWelcomeEmail(toEmail: string, userName: string) {
  try {
    const { client, fromEmail } = await getResendClient();
    
    const result = await client.emails.send({
      from: fromEmail || 'Viral Script Writer <noreply@viralscriptwriter.com>',
      to: toEmail,
      subject: 'Welcome to Viral Script Writer!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #6366f1;">Welcome to Viral Script Writer!</h1>
          <p>Hi ${userName || 'there'},</p>
          <p>Thanks for signing up! You now have access to our AI-powered script generation tool.</p>
          <h2>Your 7-Day Free Trial Includes:</h2>
          <ul>
            <li>Up to 20 AI-generated scripts</li>
            <li>Access to all script formats and hooks</li>
            <li>Deep Research mode for enhanced scripts</li>
            <li>Script Memory for voice consistency</li>
          </ul>
          <p>Ready to create your first viral script?</p>
          <a href="https://viralscriptwriter.com" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">Start Creating</a>
          <p style="margin-top: 24px; color: #666;">Happy creating!<br>The Viral Script Writer Team</p>
        </div>
      `
    });
    
    console.log('[Resend] Welcome email sent to:', toEmail);
    return result;
  } catch (error) {
    console.error('[Resend] Failed to send welcome email:', error);
    throw error;
  }
}

export async function sendTrialEndingEmail(toEmail: string, userName: string, daysLeft: number) {
  try {
    const { client, fromEmail } = await getResendClient();
    
    const result = await client.emails.send({
      from: fromEmail || 'Viral Script Writer <noreply@viralscriptwriter.com>',
      to: toEmail,
      subject: `Your trial ends in ${daysLeft} day${daysLeft > 1 ? 's' : ''}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #6366f1;">Your Trial is Ending Soon</h1>
          <p>Hi ${userName || 'there'},</p>
          <p>Your free trial ends in <strong>${daysLeft} day${daysLeft > 1 ? 's' : ''}</strong>.</p>
          <p>Don't lose access to:</p>
          <ul>
            <li>Unlimited AI script generation</li>
            <li>Viral Examples from TikTok & Instagram</li>
            <li>Advanced Deep Research mode</li>
            <li>Script Memory & Knowledge Base</li>
          </ul>
          <a href="https://viralscriptwriter.com/pricing" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">Upgrade Now</a>
          <p style="margin-top: 24px; color: #666;">Questions? Just reply to this email.<br>The Viral Script Writer Team</p>
        </div>
      `
    });
    
    console.log('[Resend] Trial ending email sent to:', toEmail);
    return result;
  } catch (error) {
    console.error('[Resend] Failed to send trial ending email:', error);
    throw error;
  }
}

export async function sendTrialExpiredEmail(toEmail: string, userName: string) {
  try {
    const { client, fromEmail } = await getResendClient();
    
    const result = await client.emails.send({
      from: fromEmail || 'Viral Script Writer <noreply@viralscriptwriter.com>',
      to: toEmail,
      subject: 'Your trial has expired',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #6366f1;">Your Trial Has Expired</h1>
          <p>Hi ${userName || 'there'},</p>
          <p>Your 7-day free trial has ended. Upgrade now to continue creating viral scripts!</p>
          <h2>Choose Your Plan:</h2>
          <ul>
            <li><strong>Starter ($9/mo)</strong> - 50 scripts/month</li>
            <li><strong>Pro ($19/mo)</strong> - 200 scripts/month + Viral Examples</li>
            <li><strong>Ultimate ($39/mo)</strong> - Unlimited scripts + all features</li>
          </ul>
          <a href="https://viralscriptwriter.com/pricing" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">View Plans</a>
          <p style="margin-top: 24px; color: #666;">Thanks for trying Viral Script Writer!<br>The Team</p>
        </div>
      `
    });
    
    console.log('[Resend] Trial expired email sent to:', toEmail);
    return result;
  } catch (error) {
    console.error('[Resend] Failed to send trial expired email:', error);
    throw error;
  }
}

export async function sendScriptEmail(toEmail: string, scriptTitle: string, scriptContent: string) {
  try {
    const { client, fromEmail } = await getResendClient();
    
    const result = await client.emails.send({
      from: fromEmail || 'Viral Script Writer <noreply@viralscriptwriter.com>',
      to: toEmail,
      subject: `Your Script: ${scriptTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #6366f1;">${scriptTitle}</h1>
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 16px 0; white-space: pre-wrap;">
${scriptContent}
          </div>
          <p style="color: #666;">This script was generated by Viral Script Writer.</p>
          <a href="https://viralscriptwriter.com" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">Create More Scripts</a>
        </div>
      `
    });
    
    console.log('[Resend] Script email sent to:', toEmail);
    return result;
  } catch (error) {
    console.error('[Resend] Failed to send script email:', error);
    throw error;
  }
}

export async function sendWeeklyUsageSummaryEmail(
  toEmail: string, 
  userName: string,
  stats: {
    scriptsCreated: number;
    topCategory: string;
    avgWordCount: number;
    savedToVault: number;
  }
) {
  try {
    const { client, fromEmail } = await getResendClient();
    
    const result = await client.emails.send({
      from: fromEmail || 'Viral Script Writer <noreply@viralscriptwriter.com>',
      to: toEmail,
      subject: 'Your Weekly Viral Script Summary',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #6366f1;">Your Weekly Summary</h1>
          <p>Hi ${userName || 'there'},</p>
          <p>Here's what you accomplished this week:</p>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 16px 0;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
              <div>
                <h3 style="margin: 0; color: #6366f1; font-size: 24px;">${stats.scriptsCreated}</h3>
                <p style="margin: 4px 0 0; color: #666; font-size: 14px;">Scripts Created</p>
              </div>
              <div>
                <h3 style="margin: 0; color: #6366f1; font-size: 24px;">${stats.savedToVault}</h3>
                <p style="margin: 4px 0 0; color: #666; font-size: 14px;">Saved to Vault</p>
              </div>
              <div>
                <h3 style="margin: 0; color: #6366f1; font-size: 24px;">${stats.avgWordCount}</h3>
                <p style="margin: 4px 0 0; color: #666; font-size: 14px;">Avg Words/Script</p>
              </div>
              <div>
                <h3 style="margin: 0; color: #6366f1; font-size: 24px;">${stats.topCategory || 'N/A'}</h3>
                <p style="margin: 4px 0 0; color: #666; font-size: 14px;">Top Category</p>
              </div>
            </div>
          </div>
          
          <p>Keep up the great work! Consistency is key to building your content empire.</p>
          
          <a href="https://viralscriptwriter.com" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">Create New Script</a>
          
          <p style="margin-top: 24px; color: #666;">Keep creating!<br>The Viral Script Writer Team</p>
        </div>
      `
    });
    
    console.log('[Resend] Weekly summary email sent to:', toEmail);
    return result;
  } catch (error) {
    console.error('[Resend] Failed to send weekly summary email:', error);
    throw error;
  }
}
