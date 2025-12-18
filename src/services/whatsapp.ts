import twilio from 'twilio';

export interface WhatsAppMessage {
  to: string;
  message: string;
}

export interface WhatsAppAlertData {
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

// Send WhatsApp message
export async function sendWhatsAppMessage({
  to,
  message,
}: WhatsAppMessage): Promise<boolean> {
  try {
    const client = getTwilioClient();
    const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER;

    if (!fromNumber) {
      console.error('TWILIO_WHATSAPP_NUMBER não configurado');
      return false;
    }

    // Twilio WhatsApp numbers must be in format: whatsapp:+1234567890
    const formattedFrom = fromNumber.startsWith('whatsapp:')
      ? fromNumber
      : `whatsapp:${fromNumber}`;
    
    const formattedTo = to.startsWith('whatsapp:')
      ? to
      : `whatsapp:${to}`;

    const response = await client.messages.create({
      from: formattedFrom,
      to: formattedTo,
      body: message,
    });

    if (response.status === 'queued' || response.status === 'sent' || response.status === 'delivered') {
      console.log('Mensagem WhatsApp enviada com sucesso:', response.sid);
      return true;
    }

    console.error('Erro ao enviar mensagem WhatsApp:', response.status);
    return false;
  } catch (error: any) {
    console.error('Erro ao enviar mensagem WhatsApp:', error.message);
    return false;
  }
}

// Format alert message for WhatsApp
export function formatWhatsAppAlert(data: WhatsAppAlertData): string {
  const emoji = getAlertEmoji(data.alertType);
  const timestamp = new Date(data.timestamp).toLocaleString('pt-BR');

  return `
${emoji} *${data.alertTitle}*

📦 *Loja:* ${data.storeName}

${data.message}

🕐 ${timestamp}

🔗 Ver no PulseWatch: ${process.env.NEXT_PUBLIC_APP_URL}/alerts
  `.trim();
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

// Send WhatsApp alert
export async function sendWhatsAppAlert(
  phoneNumber: string,
  data: WhatsAppAlertData
): Promise<boolean> {
  const message = formatWhatsAppAlert(data);
  return sendWhatsAppMessage({ to: phoneNumber, message });
}

// Verify Twilio configuration
export async function verifyWhatsAppConfig(): Promise<boolean> {
  try {
    const client = getTwilioClient();
    const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER;

    if (!fromNumber) return false;

    // Try to get account info to verify credentials
    await client.api.accounts(process.env.TWILIO_ACCOUNT_SID!).fetch();
    return true;
  } catch (error) {
    console.error('Erro ao verificar configuração WhatsApp:', error);
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
