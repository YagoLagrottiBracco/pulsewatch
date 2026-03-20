-- Habilitar Supabase Realtime para as tabelas principais do PulseWatch.
-- Cada bloco ignora o erro caso a tabela já esteja na publicação.

do $$
begin
  begin
    alter publication supabase_realtime add table stores;
  exception when others then null;
  end;

  begin
    alter publication supabase_realtime add table alerts;
  exception when others then null;
  end;

  begin
    alter publication supabase_realtime add table products;
  exception when others then null;
  end;

  begin
    alter publication supabase_realtime add table downtime_incidents;
  exception when others then null;
  end;

  begin
    alter publication supabase_realtime add table audit_logs;
  exception when others then null;
  end;
end $$;
