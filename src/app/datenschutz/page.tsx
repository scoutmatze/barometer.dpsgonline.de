'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DatenschutzPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-dpsg-beige-50">
      <div className="bg-dpsg-blue text-white">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-6 py-4">
          <button onClick={() => router.back()} className="opacity-70 hover:opacity-100">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="text-base font-bold">Datenschutz</div>
            <div className="text-xs opacity-50">BL-O-Meter</div>
          </div>
        </div>
        <div className="h-1 bg-dpsg-red" />
      </div>

      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="rounded-xl border border-dpsg-gray-200 bg-white p-6 space-y-6 text-sm text-dpsg-gray-700 leading-relaxed">

          <div>
            <h2 className="text-lg font-bold text-dpsg-gray-900 mb-2">Datenschutzerklärung BL-O-Meter</h2>
            <p>
              Das BL-O-Meter ist ein internes Rückmeldetool der Deutschen Pfadfinder*innenschaft Sankt Georg (DPSG),
              Bundesleitung, betrieben durch das Jugendwerk St. Georg e.V.
            </p>
          </div>

          <div>
            <h3 className="text-base font-bold text-dpsg-gray-900 mb-1">Verantwortliche Stelle</h3>
            <p>
              Jugendwerk St. Georg e.V.<br />
              Martinstraße 2<br />
              41472 Neuss<br />
              E-Mail: mathias.meyer@dpsg.de
            </p>
          </div>

          <div>
            <h3 className="text-base font-bold text-dpsg-gray-900 mb-1">Welche Daten werden erhoben?</h3>

            <p className="font-semibold text-dpsg-gray-900 mt-3">1. Registrierte Nutzer*innen (Admin / BL-Mitglieder)</p>
            <p>
              Für den Login werden gespeichert: E-Mail-Adresse, Name und ein gehashter PIN.
              Der PIN wird mit bcrypt verschlüsselt und ist nicht im Klartext einsehbar.
              Diese Daten sind notwendig, um den Zugang zur Auswertung und Verwaltung zu ermöglichen.
            </p>

            <p className="font-semibold text-dpsg-gray-900 mt-3">2. Rückmeldungen (BL-Sitzungen)</p>
            <p>
              Die Antworten auf Umfragen werden <strong>vollständig anonym</strong> gespeichert.
              Es gibt keine Zuordnung zwischen einer Antwort und einer Person.
              Bei token-basierten Umfragen wird lediglich gespeichert, dass ein Token eingelöst wurde —
              die Zuordnung welcher Token an welche E-Mail-Adresse gesendet wurde, wird nach
              Abschluss der Umfrage automatisch gelöscht.
            </p>

            <p className="font-semibold text-dpsg-gray-900 mt-3">3. Live-Sessions (Wettercheck, Polls, Word Cloud)</p>
            <p>
              Live-Antworten werden mit einem zufällig generierten Browser-Fingerprint verknüpft,
              um Doppel-Abstimmungen zu verhindern. Dieser Fingerprint ist eine zufällige Zeichenkette
              die im Browser gespeichert wird — er enthält keine persönlichen Informationen und
              lässt keinen Rückschluss auf die Person zu.
            </p>

            <p className="font-semibold text-dpsg-gray-900 mt-3">4. Offener Zugang (Teams-Link)</p>
            <p>
              Bei Umfragen ohne Token wird ein Hash aus Browser-Informationen verwendet,
              um Doppel-Abstimmungen zu erkennen. Es werden keine IP-Adressen gespeichert.
            </p>
          </div>

          <div>
            <h3 className="text-base font-bold text-dpsg-gray-900 mb-1">Cookies</h3>
            <p>
              Das BL-O-Meter verwendet ein einziges technisch notwendiges Cookie (<code>auth-token</code>)
              für die Authentifizierung registrierter Nutzer*innen. Dieses Cookie ist:
            </p>
            <ul className="list-disc list-inside mt-1 space-y-1 text-dpsg-gray-600">
              <li>HttpOnly (nicht per JavaScript auslesbar)</li>
              <li>Secure (nur über HTTPS übertragen)</li>
              <li>SameSite: Lax (Schutz gegen Cross-Site-Angriffe)</li>
              <li>Gültig für 7 Tage</li>
            </ul>
            <p className="mt-2">
              Es werden keine Tracking-Cookies, Analyse-Cookies oder Cookies von Drittanbietern verwendet.
            </p>
          </div>

          <div>
            <h3 className="text-base font-bold text-dpsg-gray-900 mb-1">Technische Infrastruktur</h3>
            <ul className="list-disc list-inside space-y-1 text-dpsg-gray-600">
              <li>Server: Hetzner Online GmbH, Rechenzentrum in Deutschland</li>
              <li>Verschlüsselung: TLS/SSL (Let's Encrypt), alle Verbindungen laufen über HTTPS</li>
              <li>Datenbank: PostgreSQL 16, läuft auf demselben Server, nicht extern erreichbar</li>
              <li>Anwendung: Next.js (Open Source), Docker-Container</li>
              <li>Passwort-Hashing: bcrypt mit Salt (Industriestandard)</li>
              <li>Keine Anbindung an externe Analyse- oder Tracking-Dienste</li>
              <li>Keine Weitergabe von Daten an Dritte</li>
              <li>Einziger externer Dienst: Google Fonts (Schriftart PT Sans Narrow)</li>
            </ul>
          </div>

          <div>
            <h3 className="text-base font-bold text-dpsg-gray-900 mb-1">Rechtsgrundlage</h3>
            <p>
              Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO
              (berechtigtes Interesse an der Qualitätssicherung der Verbandsarbeit)
              sowie Art. 6 Abs. 1 lit. a DSGVO (Einwilligung durch Teilnahme an der Umfrage).
            </p>
          </div>

          <div>
            <h3 className="text-base font-bold text-dpsg-gray-900 mb-1">Speicherdauer</h3>
            <ul className="list-disc list-inside space-y-1 text-dpsg-gray-600">
              <li>Umfrage-Antworten: Unbegrenzt (für Langzeitvergleiche), anonymisiert</li>
              <li>Token-Zuordnungen: Werden nach Abschluss der Umfrage gelöscht</li>
              <li>User-Accounts: Bis zur Löschung durch Administrator*in</li>
              <li>Live-Session-Daten: Unbegrenzt, anonymisiert</li>
            </ul>
          </div>

          <div>
            <h3 className="text-base font-bold text-dpsg-gray-900 mb-1">Deine Rechte</h3>
            <p>
              Du hast das Recht auf Auskunft, Berichtigung, Löschung und Einschränkung der Verarbeitung
              deiner personenbezogenen Daten. Da Umfrageantworten anonym gespeichert werden, ist eine
              nachträgliche Zuordnung und damit Löschung einzelner Antworten nicht möglich.
              Für Fragen zum Datenschutz wende dich an: mathias.meyer@dpsg.de
            </p>
          </div>

          <div className="border-t border-dpsg-gray-100 pt-4">
            <p className="text-xs text-dpsg-gray-400">
              Stand: April 2026 · Quellcode: github.com/scoutmatze/barometer.dpsgonline.de (privat)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
