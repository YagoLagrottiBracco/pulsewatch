-- Adiciona coluna telegram_username para o novo fluxo de conexão via username
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS telegram_username text;

-- Habilita Realtime para user_profiles (necessário para atualização automática da UI)
do $$
begin
  begin
    alter publication supabase_realtime add table user_profiles;
  exception when others then null;
  end;
end $$;
