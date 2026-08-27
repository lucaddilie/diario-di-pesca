# Diario di Pesca

PWA offline-first per registrare le catture di pesca, condivisa tra due utenti. Vedi `SETUP.md` per la configurazione da zero.

## Stack

- React + Vite + `vite-plugin-pwa`
- Supabase (auth, database, storage foto) — piano gratuito
- Dexie (IndexedDB) per la coda di sincronizzazione offline
- Hosting: Vercel

## Stato

Tutti e sei i punti dell'MVP (fase 1 del prompt) sono implementati:

1. ✅ Login email/password
2. ✅ Form nuova cattura (foto, specie, data/ora, GPS)
3. ✅ Salvataggio locale immediato + sync automatica con indicatore di stato
4. ✅ Compressione foto lato client
5. ✅ Feed cronologico condiviso
6. ✅ Manifest PWA + service worker (installabile, apribile offline)

Da fare prima di poterlo usare in una vera uscita di pesca: completare i passi manuali in `SETUP.md` (progetto Supabase, deploy). Una volta online, va testato sul campo prima di aggiungere altro (vedi roadmap nel prompt originale).

## Comandi

```bash
npm run dev      # sviluppo locale
npm run build    # build di produzione (usato anche da Vercel)
npm run preview  # anteprima della build di produzione
```
