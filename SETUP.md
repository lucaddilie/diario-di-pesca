# Setup — Diario di Pesca

Guida passo passo per portare il progetto da questa cartella a un'app installabile e online.
Ogni comando va incollato nel Terminale così com'è (sostituendo solo le parti tra `< >`).

Node.js è già installato su questo Mac (verificato: v26.7.0), quindi puoi saltare quel passo.

## 1. Aprire il progetto nel Terminale

```bash
cd /Users/lucadilie/Desktop/claude_code/diario-pesca
```

Le dipendenze sono già installate. Se in futuro clonassi il progetto su un altro computer, il primo comando da lanciare sarebbe:

```bash
npm install
```

## 2. Creare il progetto Supabase (backend, gratuito)

1. Vai su [supabase.com](https://supabase.com) → **Start your project** → crea un account (puoi usare GitHub per accedere).
2. Clicca **New project**.
3. Compila:
   - **Name**: `diario-pesca` (o come preferisci)
   - **Database Password**: generane una e **salvala da qualche parte** (non serve per questo progetto, ma Supabase la richiede)
   - **Region**: scegli quella più vicina all'Italia, es. `Europe (Frankfurt)` o `Europe (London)`
4. Clicca **Create new project** e aspetta 1-2 minuti che venga provisionato.

Nessuna carta di credito richiesta per il piano gratuito.

## 3. Eseguire lo schema del database

1. Nel progetto Supabase, apri **SQL Editor** (icona nel menu a sinistra) → **New query**.
2. Apri il file `supabase/migrations/0001_init.sql` di questo progetto, copia **tutto** il contenuto e incollalo nell'editor.
3. Clicca **Run**.

Questo comando crea le tabelle (`profiles`, `catches`), le regole di sicurezza (ogni utente vede tutte le catture ma può modificare solo le proprie) e il bucket di storage per le foto (`catch-photos`, pubblico in lettura come deciso insieme).

Se vedi "Success. No rows returned" è andato tutto bene.

## 4. Recuperare le chiavi del progetto

1. Nel progetto Supabase: **Settings** (icona ingranaggio) → **API**.
2. Copia:
   - **Project URL**
   - **anon public** key (sotto "Project API keys")

## 5. Creare il file `.env`

Nel Terminale, dalla cartella del progetto:

```bash
cp .env.example .env
```

Apri il file `.env` appena creato (con TextEdit, VS Code, o `open -e .env` da Terminale) e incolla i valori copiati al punto 4:

```
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

Questo file **non va mai condiviso né caricato su GitHub** (è già escluso in `.gitignore`).

## 6. Provare il progetto in locale

```bash
npm run dev
```

Apri l'indirizzo che compare nel Terminale (di solito `http://localhost:5173`) nel browser del Mac. Per ora vedrai solo la schermata "Diario di Pesca" — le funzionalità (login, form, feed) verranno aggiunte una alla volta nella fase 3. Premi `Ctrl+C` nel Terminale per fermare il server quando hai finito.

## 7. Creare i due account utente

1. In Supabase: **Authentication** → **Users** → **Add user** → **Create new user**.
2. Inserisci email e password per il tuo account. Spunta **Auto Confirm User** (così non serve un'email di conferma).
3. Ripeti per l'account del tuo amico.

Alla creazione di ogni utente, un profilo viene generato automaticamente (grazie al trigger nello schema) usando la parte dell'email prima della `@` come nome visualizzato. Potrete cambiarlo in un secondo momento dall'app.

## 8. Caricare il codice su GitHub

Dato che hai già un repository GitHub pronto (vuoto), da questa cartella:

```bash
git init
git add .
git commit -m "Scaffolding iniziale diario di pesca"
git branch -M main
git remote add origin <URL_DEL_TUO_REPOSITORY_GITHUB>
git push -u origin main
```

Sostituisci `<URL_DEL_TUO_REPOSITORY_GITHUB>` con l'URL del tuo repository (es. `https://github.com/tuonome/diario-pesca.git`, lo trovi sulla pagina del repository cliccando il pulsante verde **Code**).

## 9. Deploy su Vercel (hosting gratuito)

1. Vai su [vercel.com](https://vercel.com) → **Sign Up** → accedi con lo stesso account GitHub.
2. Clicca **Add New...** → **Project**.
3. Seleziona il repository `diario-pesca` dalla lista e clicca **Import**.
4. Vercel riconosce automaticamente che è un progetto Vite: non serve cambiare nulla nei campi di build.
5. Prima di cliccare Deploy, apri **Environment Variables** e aggiungi le stesse due variabili del file `.env`:
   - `VITE_SUPABASE_URL` → il tuo Project URL
   - `VITE_SUPABASE_ANON_KEY` → la tua anon key
6. Clicca **Deploy** e aspetta il completamento (1-2 minuti).

Ad ogni `git push` successivo su `main`, Vercel rifà il deploy automaticamente: non dovrai ripetere questi passi.

## 10. Installare l'app sull'iPhone

1. Apri l'indirizzo del sito (quello fornito da Vercel, es. `https://diario-pesca.vercel.app`) in **Safari** sull'iPhone (deve essere Safari, non Chrome).
2. Tocca l'icona **Condividi** (il quadrato con la freccia verso l'alto).
3. Scorri e tocca **Aggiungi alla schermata Home**.
4. Conferma. L'icona 🎣 apparirà sulla home come un'app normale.

Per verificare che funzioni offline: apri l'app dall'icona sulla home, poi attiva la modalità aereo e riapri l'app — dovrebbe comunque caricarsi.

## Riepilogo variabili d'ambiente

| Variabile | Dove trovarla |
|---|---|
| `VITE_SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon public key |

Vanno impostate sia nel file `.env` locale sia nelle Environment Variables di Vercel.
