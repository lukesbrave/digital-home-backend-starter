create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table if not exists backend_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz default now()
);

create table if not exists brand_context (
  key text primary key,
  category text not null,
  content text not null,
  updated_at timestamptz default now()
);

drop trigger if exists backend_settings_updated_at on backend_settings;
create trigger backend_settings_updated_at
  before update on backend_settings
  for each row execute function update_updated_at();

drop trigger if exists brand_context_updated_at on brand_context;
create trigger brand_context_updated_at
  before update on brand_context
  for each row execute function update_updated_at();

alter table backend_settings enable row level security;
alter table brand_context enable row level security;
