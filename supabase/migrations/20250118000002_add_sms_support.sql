-- Add SMS fields to user_profiles
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS sms_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS sms_notifications BOOLEAN DEFAULT false;

-- Add sms_sent to alerts table
ALTER TABLE alerts
ADD COLUMN IF NOT EXISTS sms_sent BOOLEAN DEFAULT false;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_sms ON user_profiles(sms_number) WHERE sms_notifications = true;

-- Comment
COMMENT ON COLUMN user_profiles.sms_number IS 'Número de telefone do usuário para SMS no formato internacional (ex: +5511999999999)';
COMMENT ON COLUMN user_profiles.sms_notifications IS 'Se o usuário quer receber notificações via SMS';
COMMENT ON COLUMN alerts.sms_sent IS 'Se a notificação foi enviada via SMS';
