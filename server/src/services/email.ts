export interface EmailParams {
  extra_email: string;
  extra_subject: string;
  extra_text: string;
}

export function sendEmail(params: EmailParams): string {
  const { extra_email, extra_subject, extra_text } = params;
  
  // In a real implementation, this would connect to an SMTP server or email API
  // For simulation purposes, we'll log and return a success message
  
  const timestamp = new Date().toISOString();
  const emailId = Math.random().toString(36).substring(2, 15);
  
  console.log(`[${timestamp}] Email sent successfully`);
  console.log(`  To: ${extra_email}`);
  console.log(`  Subject: ${extra_subject}`);
  console.log(`  Body: ${extra_text.substring(0, 50)}${extra_text.length > 50 ? '...' : ''}`);
  console.log(`  Email ID: ${emailId}`);
  
  return JSON.stringify({
    success: true,
    message: `Email sent to ${extra_email}`,
    emailId,
    timestamp,
    to: extra_email,
    subject: extra_subject,
    bodyPreview: extra_text.substring(0, 100)
  }, null, 2);
}

export function simulateEmailSending(email: string, subject: string, body: string): string {
  return sendEmail({
    extra_email: email,
    extra_subject: subject,
    extra_text: body
  });
}