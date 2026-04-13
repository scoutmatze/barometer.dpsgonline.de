# BL-Barometer

Rueckmeldetool fuer Bundesleitungs-Sitzungen der DPSG 1300.

## Deployment auf bundesamt (5.75.169.81)

### 1. DNS setzen
```
barometer.dpsgonline.de -> 5.75.169.81
```

### 2. Dateien auf Server kopieren
```bash
scp bl-barometer.tar.gz deploy@5.75.169.81:~/
ssh deploy@5.75.169.81
tar xzf bl-barometer.tar.gz
cd bl-barometer
```

### 3. Environment konfigurieren
```bash
cp .env.example .env
nano .env
# DB_PASSWORD und JWT_SECRET setzen
```

### 4. Starten
```bash
docker compose up -d --build
```

### 5. Admin-User anlegen
```bash
docker compose exec app node -e "
  const { Pool } = require('pg');
  const bcrypt = require('bcryptjs');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  (async () => {
    const hash = await bcrypt.hash('DEIN_PIN', 12);
    await pool.query(
      \"INSERT INTO users (email, name, pin_hash, role) VALUES (\$1, \$2, \$3, 'ADMIN') ON CONFLICT (email) DO UPDATE SET pin_hash = \$3\",
      ['mathias.meyer@dpsg1300.de', 'Mathias Meyer', hash]
    );
    console.log('Admin erstellt');
    await pool.end();
  })();
"
```

### 6. Traefik neustarten (damit neuer Container erkannt wird)
```bash
cd ~/dpsg-reisekosten
docker compose -f docker-compose.prod.yml restart traefik
```

## Rollen

- **ADMIN**: Sitzungen erstellen, E-Mails verwalten, Import, Umfragen schliessen
- **BL**: Auswertungen einsehen, Vergleiche, Praesentationsmodus
- **Teilnehmende**: Token-Link (kein Login), anonym, einmalig

## Features

- Mobile-optimierte Umfrage (1 Frage/Screen, grosse Tap-Targets)
- Likert-Skala + Numerisch + Freitext
- Template-System (fixe Fragen + variable TOPs)
- Excel-Import (Forms-Exporte)
- Praesentationsmodus (Fullscreen, Pfeiltasten)
- Offener Zugang (Teams-Link) + Token-basierter Zugang
- DSGVO: Token-Zuordnung wird nach Umfrage-Schluss geloescht
