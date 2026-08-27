-- Diario di Pesca — schema iniziale (fase 1 MVP)
-- Esegui questo intero file nel SQL Editor di Supabase (vedi SETUP.md).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- profiles: un profilo per utente autenticato (nome visibile nel feed)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- entrambi gli utenti devono vedersi a vicenda nel feed condiviso
create policy "profiles are readable by any authenticated user"
  on public.profiles for select
  to authenticated
  using (true);

create policy "users can insert their own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

create policy "users can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- crea automaticamente un profilo alla registrazione di un nuovo utente,
-- cosi' non serve un passo manuale in piu' dopo aver creato gli account
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------------
-- catches: le catture registrate da entrambi gli utenti
-- ---------------------------------------------------------------------------
create table public.catches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  -- generato sul device: permette di riconoscere un invio gia' sincronizzato
  -- se il sync viene ripetuto (rete instabile) senza creare doppioni
  client_id text not null unique,
  species text not null,
  caught_at timestamptz not null,
  latitude double precision,
  longitude double precision,
  photo_path text not null,
  -- colonne previste per l'arricchimento meteo automatico (roadmap futura),
  -- non popolate ne' usate nella fase 1
  weather_pressure numeric,
  weather_temperature numeric,
  weather_wind_speed numeric,
  moon_phase text,
  created_at timestamptz not null default now()
);

create index catches_caught_at_idx on public.catches (caught_at desc);

alter table public.catches enable row level security;

create policy "catches are readable by any authenticated user"
  on public.catches for select
  to authenticated
  using (true);

create policy "users can insert their own catches"
  on public.catches for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "users can update their own catches"
  on public.catches for update
  to authenticated
  using (auth.uid() = user_id);

create policy "users can delete their own catches"
  on public.catches for delete
  to authenticated
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- storage: bucket pubblico in lettura per le foto delle catture
-- (scelta confermata: nessun dato sensibile nelle foto, niente signed URL da rinnovare)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('catch-photos', 'catch-photos', true)
on conflict (id) do nothing;

-- convenzione path: "<user_id>/<client_id>.jpg" cosi' la policy puo' verificare
-- che ognuno scriva solo dentro la propria cartella
create policy "authenticated users can upload their own catch photos"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'catch-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "users can delete their own catch photos"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'catch-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
