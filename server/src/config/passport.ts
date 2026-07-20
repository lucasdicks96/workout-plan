import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { getUserById } from "../repositories/user.repository";
import * as authService from "../services/auth.service";
import { AppError } from "../types/errors.types";

/**
 * Passport Local Strategy Konfiguration.
 * 
 * Verwendet die E-Mail-Adresse als Anmeldenamen (`usernameField: "email"`) und das Passwort.
 * Die Verifizierung der Anmeldedaten wird an den `authService` delegiert. 
 * Spezifische Anwendungsfehler (`AppError`) werden abgefangen und als authentifizierungs-
 * fehlgeschlagen-Meldungen an Passport übergeben.
 */
passport.use(
  "local",
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    async (email: string, password: string, done: any) => {
      try {
        const user = await authService.verifyUserCredentials(email, password);

        return done(null, user);
      } catch (err) {
        if (err instanceof AppError) {
          return done(null, false, {
            message: err.message,
          });
        }

        return done(err);
      }
    },
  ),
);

/**
 * Serialisiert den Benutzer für die Express-Session.
 * Speichert aus Performance- und Sicherheitsgründen ausschließlich die ID des Benutzers in der Session.
 *
 * @param {any} user - Das vom Authentifizierungs-Callback zurückgegebene Benutzerobjekt.
 * @param {any} done - Passport-Callback-Funktion.
 */
passport.serializeUser(function (user: any, done: any) {
  return done(null, user.id);
});

/**
 * Deserialisiert den Benutzer aus der Express-Session.
 * Ruft bei jedem Request anhand der gespeicherten ID die aktuellen Benutzerdaten aus der Datenbank ab,
 * entfernt das Passwort-Feld aus Sicherheitsgründen per Destructuring und stellt den Benutzer über `req.user` bereit.
 *
 * @async
 * @param {string} id - Die in der Session hinterlegte Benutzer-ID.
 * @param {any} done - Passport-Callback-Funktion.
 * @returns {Promise<void>}
 */
passport.deserializeUser(async function (id: string, done: any) {
  try {
    const { password, ...user } = await getUserById(id);
    if (!user) {
      return done(null, false);
    }
    done(null, user);
  } catch (err) {
    done(err);
  }
});

export default passport;