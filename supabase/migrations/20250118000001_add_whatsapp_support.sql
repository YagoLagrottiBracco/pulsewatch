-- Add WhatsApp fields to user_profiles
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS whatsapp_notifications BOOLEAN DEFAULT false;

-- Add whatsapp_sent to alerts table
ALTER TABLE alerts
ADD COLUMN IF NOT EXISTS whatsapp_sent BOOLEAN DEFAULT false;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_whatsapp ON user_profiles(whatsapp_number) WHERE whatsapp_notifications = true;

-- Comment
COMMENT ON COLUMN user_profiles.whatsapp_number IS 'Número de WhatsApp do usuário no formato internacional (ex: +5511999999999)';
COMMENT ON COLUMN user_profiles.whatsapp_notifications IS 'Se o usuário quer receber notificações via WhatsApp';
COMMENT ON COLUMN alerts.whatsapp_sent IS 'Se a notificação foi enviada via WhatsApp';
