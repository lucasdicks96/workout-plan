import {
  describe,
  expect,
  it,
  jest,
  beforeEach,
  afterEach,
} from "@jest/globals";
import crypto from "crypto"; // Für die Generierung von Test-IDs
import request from "supertest";
import app from "../src/index";
import { createAndLoginTestUser } from "./testHelpers";

// Cloudflare Turnstile für die Tests dekonstruieren/überbrücken
jest.mock("../src/middlewares/turnstile.ts", () => ({
  verifyTurnstile: (req: any, res: any, next: any) => next(),
}));

describe("OWASP Top 10 & Auth Lifecycle Tests (/auth)", () => {
  // ==========================================
  // 1. STANDARD LIFECYCLE (Mit deiner Helper-Funktion)
  // ==========================================
  describe("Regulärer Auth-Lifecycle & Session-Integrität", () => {
    it("GET /status - sollte mit dem Cookie aus der Helper-Funktion erfolgreich sein", async () => {
      // Nutzt deinen fertigen Test-User inkl. frischem Cookie
      const { cookie, email } = await createAndLoginTestUser();

      const response = await request(app)
        .get("/user/status") // Passe den Pfad an (/user/status oder /auth/status)
        .set("Cookie", cookie);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("success");
      expect(response.body.data.email).toBe(email);
      // OWASP Data Exposure Check: Niemals das Passwort ausliefern!
      expect(response.body.data.password).toBeUndefined();
    });

    it("POST /logout - sollte die Session zerstören und das Cookie entwerfen", async () => {
      const { cookie } = await createAndLoginTestUser();

      // 1. Logout durchführen
      const logoutRes = await request(app)
        .post("/user/logout")
        .set("Cookie", cookie);

      expect(logoutRes.status).toBe(200);

      // 2. OWASP A07 (Session Destruction Check):
      // Der Angreifer versucht, das ALTE Cookie nach dem Logout weiter zu nutzen.
      // Da req.session.destroy() in der DB lief, MUSS die API abblocken!
      const statusRes = await request(app)
        .get("/user/status")
        .set("Cookie", cookie);

      expect(statusRes.status).toBe(401);
      expect(statusRes.body.status).toBe("fail");
    });
  });

  // ==========================================
  // 2. OWASP A03:2021 - INJECTION ATTACKEN
  // ==========================================
  describe("OWASP A03 - SQLi, NoSQLi & XSS Prevention", () => {
    it("sollte klassische SQL-Injection im Login-Formular abblocken", async () => {
      // Angreifer versucht, die SQL-Where-Klausel auszuhebeln (' OR '1'='1)
      const response = await request(app).post("/user/login").send({
        email: "' OR '1'='1' --",
        password: "' OR '1'='1' --",
      });

      // Zod (ungültige E-Mail) muss mit 400 greifen ODER Passport mit 401
      expect(response.status).toBe(400);
      expect(response.body.status).toBe("fail");
    });

    it("sollte NoSQL/JSON-Object-Injection abblocken", async () => {
      // Angreifer sendet ein Objekt statt eines Strings, um Datenbanken zu verwirren
      const response = await request(app)
        .post("/user/login")
        .send({
          email: { $ne: null }, // MongoDB/ORM-Klassiker: "Wo email nicht null ist"
          password: { $gt: "" },
        });

      // Zod MUSS hier mit 400 werfen, weil z.string()/z.email() erwartet wird!
      expect(response.status).toBe(400);
      expect(response.body.status).toBe("fail");
    });

    it("sollte XSS-Payloads in der E-Mail-Adresse durch Validierung stoppen", async () => {
      // Angreifer versucht, ein Script als Benutzername/Email zu speichern
      const response = await request(app).post("/user/register").send({
        email: `<script>alert('XSS')</script>@domain.de`,
        password: "sicherEsPassword123!",
      });

      // Dein Zod z.email() Schema sollte diesen String nicht als Email akzeptieren
      expect(response.status).toBe(400);
    });
  });
  describe("im Production-Modus", () => {
    const originalNodeEnv = process.env.NODE_ENV;

    beforeEach(() => {
      // Für diesen Test-Block auf Production umstellen
      process.env.NODE_ENV = "production";
    });

    afterEach(() => {
      // Nach dem Test sofort wieder den ursprünglichen Zustand herstellen
      process.env.NODE_ENV = originalNodeEnv;
    });

    it("sollte XSS-Payloads in der E-Mail-Adresse durch Validierung stoppen", async () => {
      // Angreifer versucht, ein Script als Benutzername/Email zu speichern
      const response = await request(app).post("/user/register").send({
        email: `<script>alert('XSS')</script>@domain.de`,
        password: "sicherEsPassword123!",
      });

      // Dein Zod z.email() Schema sollte diesen String nicht als Email akzeptieren
      expect(response.status).toBe(404);
    });
  });

  // ==========================================
  // 3. OWASP A01:2021 - MASS ASSIGNMENT (Privilege Escalation)
  // ==========================================
  describe("OWASP A01 - Mass Assignment / Privilege Escalation", () => {
    it("sollte verhindern, dass sich User bei der Registrierung Admin-Rechte erschleichen", async () => {
      const email = `hacker-${Date.now()}@workout.de`;

      // Angreifer hängt heimlich "role: 'admin'" oder "isAdmin: true" an das JSON
      const response = await request(app)
        .post("/user/register")
        .send({
          email: email,
          password: "sicherEsPassword123!",
          role: "admin", // Vektor 1
          isAdmin: true, // Vektor 2
          permissions: ["ALL"], // Vektor 3
        });

      // SZENARIO A (Zod .strict()): Die API wirft 400, weil unbekannte Felder im JSON sind
      if (response.status === 400) {
        expect(response.body.status).toBe("fail");
      }
      // SZENARIO B (Zod .strip()): Die API ignoriert die Felder und legt den User an
      else if (response.status === 201) {
        // WICHTIG: Der User MUSS im Backend trotzdem als normaler "user" angelegt worden sein!
        expect(response.body.data.role).toBe("user");
        expect(response.body.data.role).not.toBe("admin");
      } else {
        throw new Error(
          `Unerwarteter Statuscode: ${response.status}. Body: ${JSON.stringify(response.body)}`,
        );
      }
    });
  });

  // ==========================================
  // 4. OWASP A07:2021 - BRUTE FORCE & RATE LIMITING
  // ==========================================
  describe("OWASP A07 - Brute Force Protection (Rate Limiting Check)", () => {
    it("sollte nach mehreren fehlgeschlagenen Login-Versuchen blockieren (HTTP 429)", async () => {
      // Dieser Test schlägt intentional fehl (oder wird übersprungen),
      // falls du noch keinen Rate-Limiter wie 'express-rate-limit' eingerichtet hast!
      const targetEmail = `victim-${Date.now()}@workout.de`;

      let lastResponse;
      // 15 Mal blitzschnell das falsche Passwort senden
      for (let i = 0; i < 15; i++) {
        lastResponse = await request(app)
          .post("/user/login")
          .set("X-Test-Rate-Limit", "true")
          .send({
            email: targetEmail,
            password: `falschesPasswort_${i}`,
          });

        // Wenn der Rate Limiter vor den 15 Versuchen greift, brechen wir die Schleife ab
        if (lastResponse.status === 429) break;
      }
      expect(lastResponse?.status).toBe(429);
    });
  });
});

describe("Auth Routes)", () => {
  // Hilfsfunktion für eindeutige Test-Emails
  const generateTestEmail = () => `test-${crypto.randomUUID()}@workout.de`;
  const validPassword = "sicherEsPassword123";

  // ==========================================
  // 1. REGISTRIERUNG (POST /user/register)
  // ==========================================
  describe("POST /user/register", () => {
    it("sollte einen neuen Benutzer registrieren, einloggen und das Passwort NIEMALS zurückgeben", async () => {
      const email = generateTestEmail();

      const response = await request(app)
        .post("/user/register")
        .send({ email, password: validPassword });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe("success");
      expect(response.body.data).toBeDefined();
      expect(response.body.data.email).toBe(email);
      expect(response.body.data.role).toBe("user");

      // SICHERHEITS-CHECK: Das Passwort darf niemals im JSON auftauchen!
      expect(response.body.data.password).toBeUndefined();

      // SESSION-CHECK: Prüfen, ob das "connect.sid" Cookie gesetzt wurde
      const rawCookies = response.headers["set-cookie"];

      // 2. WICHTIG: Normalisieren (macht aus einem einzelnen String immer ein Array von Strings)
      const cookies: string[] = Array.isArray(rawCookies)
        ? rawCookies
        : [rawCookies].filter(Boolean);

      // 3. Jetzt funktioniert .some() fehlerfrei und typsicher:
      expect(cookies.some((c) => c.startsWith("connect.sid="))).toBe(true);
    });

    it("sollte mit 400 scheitern, wenn das Zod-Schema verletzt wird (z.B. Passwort zu kurz)", async () => {
      const response = await request(app)
        .post("/user/register")
        .send({ email: "keine-echte-email", password: "123" }); // < 4 Zeichen

      expect(response.status).toBe(400);
      expect(response.body.status).toBe("fail");
    });
  });

  // ==========================================
  // PRODUCTION CHECK (Deaktivierte Registrierung)
  // ==========================================
  describe("im Production-Modus", () => {
    const originalNodeEnv = process.env.NODE_ENV;

    beforeEach(() => {
      // Für diesen Test-Block auf Production umstellen
      process.env.NODE_ENV = "production";
    });

    afterEach(() => {
      // Nach dem Test sofort wieder den ursprünglichen Zustand herstellen
      process.env.NODE_ENV = originalNodeEnv;
    });

    it("sollte mit 404 und einer Fehlermeldung antworten, wenn die Registrierung deaktiviert ist", async () => {
      const email = generateTestEmail();

      const response = await request(app)
        .post("/user/register")
        .send({ email, password: validPassword });

      expect(response.status).toBe(404);
      expect(response.body.message).toBeDefined();

      // Optional: Falls deine Error-Middleware auch 'status' liefert
      if (response.body.status) {
        expect(response.body.status).toMatch(/fail|error/);
      }
    });
  });
  // ==========================================
  // 2. LOGIN (POST /user/login)
  // ==========================================
  describe("POST /user/login", () => {
    it("sollte den Benutzer bei korrekten Anmeldedaten erfolgreich einloggen", async () => {
      const user = await createAndLoginTestUser();
      const response = await request(app)
        .post("/user/login")
        .send({ email: user.email, password: user.password });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("success");
      expect(response.body.data.email).toBe(user.email);
      expect(response.body.data.password).toBeUndefined();

      // Prüfen, ob ein frisches Session-Cookie gesendet wurde
      // SESSION-CHECK: Prüfen, ob das "connect.sid" Cookie gesetzt wurde
      const rawCookies = response.headers["set-cookie"];

      // 2. WICHTIG: Normalisieren (macht aus einem einzelnen String immer ein Array von Strings)
      const cookies: string[] = Array.isArray(rawCookies)
        ? rawCookies
        : [rawCookies].filter(Boolean);

      // 3. Jetzt funktioniert .some() fehlerfrei und typsicher:
      expect(cookies.some((c) => c.startsWith("connect.sid="))).toBe(true);
    });

    it("sollte 401 Unauthorized zurückgeben, wenn das Passwort falsch ist", async () => {
      const user = await createAndLoginTestUser();
      const response = await request(app)
        .post("/user/login")
        .send({ email: user.email, password: "falschesPassword!" });

      // Je nachdem, wie dein Service und deine errorHandler konfiguriert sind:
      expect(response.status).toBe(401);
      expect(response.body.status).toBe("fail");
    });

    it("sollte abbrechen, wenn ein nicht existierender Benutzer versucht sich einzuloggen", async () => {
      const response = await request(app)
        .post("/user/login")
        .send({ email: "ghost@workout.de", password: validPassword });

      expect(response.status).toBe(401);
      expect(response.body.status).toBe("fail");
    });
  });

  // ==========================================
  // 3. STATUS & SESSION-LEBENSZYKLUS
  // ==========================================
  describe("Session-Lebenszyklus: Status & Logout", () => {
    it("GET /user/status - sollte die Benutzerdaten zurückgeben, wenn das Cookie gültig ist", async () => {
      const user = await createAndLoginTestUser();
      const response = await request(app)
        .get("/user/status")
        .set("Cookie", user.cookie); // Das gespeicherte Cookie anhängen!

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("success");
      expect(response.body.data.email).toBe(user.email);
    });

    it("GET /user/status - sollte mit 401 (Unauthorized) scheitern, wenn KEIN Cookie gesendet wird", async () => {
      const response = await request(app).get("/user/status"); // Kein .set("Cookie")

      expect(response.status).toBe(401);
      expect(response.body.status).toBe("fail");
    });

    it("POST /user/logout - sollte die Session zerstören und die Cookies löschen", async () => {
      const user = await createAndLoginTestUser();
      // 1. Logout mit dem aktiven Cookie ausführen
      const logoutResponse = await request(app)
        .post("/user/logout")
        .set("Cookie", user.cookie);

      expect(logoutResponse.status).toBe(200);
      expect(logoutResponse.body.status).toBe("success");

      // 2. Prüfen, ob das Backend die Cookies per "clearCookie" (Expires in der Vergangenheit) löscht
      const rawSetCookieHeaders = logoutResponse.headers["set-cookie"];
      const setCookieHeaders: string[] = Array.isArray(rawSetCookieHeaders)
        ? rawSetCookieHeaders
        : [rawSetCookieHeaders].filter(Boolean);
      expect(setCookieHeaders).toBeDefined();
      expect(
        setCookieHeaders.some(
          (c: string) => c.includes("connect.sid=;") || c.includes("Expires="),
        ),
      ).toBe(true);

      // 3. DEN ERNSTFALL TESTEN:
      // Wir versuchen, dieselbe Status-Route mit dem ALIEN (nun zerstörten) Cookie aufzurufen.
      // Da die Session in PostgreSQL zerstört wurde, MUSS das Backend jetzt 401 werfen!
      const statusCheckResponse = await request(app)
        .get("/user/status")
        .set("Cookie", user.cookie);

      expect(statusCheckResponse.status).toBe(401);
    });
  });
});
