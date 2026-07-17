import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { getUserById } from "../repositories/user.repository";
import * as authService from "../services/auth.service";
import { AppError } from "../types/errors.types";

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

passport.serializeUser(function (user: any, done: any) {
  return done(null, user.id);
});

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
