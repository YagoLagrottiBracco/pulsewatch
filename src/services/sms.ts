import twilio from 'twilio';

export interface SMSMessage {
  to: string;
  message: string;
}

export interface SMSAlertData {
  storeName: string;
  alertType: string;
  alertTitle: string;
  message: string;
  timestamp: string;
}

// Initialize Twilio client
function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    throw new Error('Credenciais Twilio não configuradas');
  }

  return twilio(accountSid, authToken);
}

// Send SMS message
export async function sendSMSMessage({
  to,
  message,
}: SMSMessage): Promise<boolean> {
  try {
    const client = getTwilioClient();
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!fromNumber) {
      console.error('TWILIO_PHONE_NUMBER não configurado');
      return false;
    }

    const response = await client.messages.create({
      from: fromNumber,
      to: to,
      body: message,
    });

    if (response.status === 'queued' || response.status === 'sent' || response.status === 'delivered') {
      console.log('SMS enviado com sucesso:', response.sid);
      return true;
    }

    console.error('Erro ao enviar SMS:', response.status);
    return false;
  } catch (error: any) {
    console.error('Erro ao enviar SMS:', error.message);
    return false;
  }
}

// Format alert message for SMS (keep it short - SMS has 160 char limit)
export function formatSMSAlert(data: SMSAlertData): string {
  const emoji = getAlertEmoji(data.alertType);
  
  // SMS deve ser curto e direto
  return `${emoji} PulseWatch
${data.alertTitle}
Loja: ${data.storeName}
${data.message}
Ver: ${process.env.NEXT_PUBLIC_APP_URL}/alerts`.trim();
}

// Get emoji for alert type
function getAlertEmoji(alertType: string): string {
  const emojiMap: { [key: string]: string } = {
    ESTOQUE_ZERADO: '🔴',
    ESTOQUE_BAIXO: '⚠️',
    ESTOQUE_DISPONIVEL: '✅',
    LOJA_OFFLINE: '❌',
    LOJA_ONLINE: '✅',
    NOVA_VENDA: '💰',
    PRODUTO_POPULAR: '🔥',
    ERRO_INTEGRACAO: '⚡',
  };

  return emojiMap[alertType] || '🔔';
}

// Send SMS alert
export async function sendSMSAlert(
  phoneNumber: string,
  data: SMSAlertData
): Promise<boolean> {
  const message = formatSMSAlert(data);
  return sendSMSMessage({ to: phoneNumber, message });
}

// Verify Twilio SMS configuration
export async function verifySMSConfig(): Promise<boolean> {
  try {
    const client = getTwilioClient();
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!fromNumber) return false;

    // Try to get account info to verify credentials
    await client.api.accounts(process.env.TWILIO_ACCOUNT_SID!).fetch();
    return true;
  } catch (error) {
    console.error('Erro ao verificar configuração SMS:', error);
    return false;
  }
}

// Validate phone number format
export function validatePhoneNumber(phoneNumber: string): boolean {
  // Phone number should be in international format: +[country code][number]
  // Example: +5511999999999
  const phoneRegex = /^\+[1-9]\d{1,14}$/;
  return phoneRegex.test(phoneNumber);
}

// Format phone number to international format
export function formatPhoneNumber(phoneNumber: string): string {
  // Remove all non-numeric characters except +
  let formatted = phoneNumber.replace(/[^\d+]/g, '');

  // If doesn't start with +, assume Brazil (+55)
  if (!formatted.startsWith('+')) {
    formatted = '+55' + formatted;
  }

  return formatted;
}
