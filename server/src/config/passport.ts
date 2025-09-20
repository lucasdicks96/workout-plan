import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { findUserById } from "../repositories/user.repository";
import * as authService from "../services/auth.service";

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

        if (!user) {
          return done(null, false);
        }

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

passport.serializeUser(function (user: any, done: any) {
  return done(null, user.id);
});

passport.deserializeUser(async function (id: string, done: any) {
  try {
    const user = await findUserById(id);
    if (user) {
      done(null, user);
    } else {
      done(null);
    }
  } catch (err) {
    done(err);
  }
});

export default passport;
