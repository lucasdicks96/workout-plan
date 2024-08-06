import express from "express";
import env from "dotenv";
import pg from "pg";
var cors = require("cors");
import bcrypt from "bcrypt";
import passport from "passport";
import { Strategy } from "passport-local";
import session from "express-session";

const port = parseInt(process.env.PORT || "5000");
// const pgPort = process.env.PG_PORT;
const app = express();
const saltRounds: number = 15;
env.config();

type User = {
  id: number;
  email: string;
  password: string;
};

app.use(
  session({
    secret: process.env.SESSION_SECRET || "default secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60,
    },
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    // origin: "http://localhost/5173",
    // credentials: true,
  })
);

app.use(passport.initialize());
app.use(passport.session());

const db = new pg.Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: parseInt(process.env.PG_PORT || "5432"),
});

db.connect();

app.get("/", (req, res) => {});

app.get("/logout", (req, res, next) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.status(200).json({ message: "Logout successful" });
  });
});
app.get("/dashboard", (req, res) => {
  if (req.isAuthenticated()) {
    res.status(200);
    console.log("get /dashboard route");
  }
});
app.get("/plan", (req, res) => {});
app.get("/exercise", (req, res) => {});

app.post("/login", (req, res, next) => {
  // console.log(req.body);
  passport.authenticate("local", (err: any, user: User) => {
    // console.log(user);
    if (err) return next(err);
    if (!user) return res.status(401).json({ message: "Login failed!" });
    req.logIn(user, (err: any) => {
      if (err) return next(err);
      console.log("success");
      return res.status(200).json({ message: "Login successful!" });
    });
  })(req, res, next);
});
app.post("/register", async (req, res) => {
  const data = req.body;
  const email = data.email;
  const password = data.password;
  // console.log(email, password);
  try {
    const checkIfExists = await db.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (checkIfExists.rows.length > 0) {
      return res.status(401).json({ message: "User already exists" });
    } else {
      bcrypt.hash(password, saltRounds, async (err: any, hash: string) => {
        if (err) {
          console.error("Error hashing password: ", err);
        } else {
          const result = await db.query(
            "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING *",
            [email, hash]
          );
          const user: User = result.rows[0];
          // console.log(user);
          req.login(user, (err: any) => {
            console.log("success");
            res.status(200).json({ message: "Login successful" });
          });
        }
      });
    }
  } catch (err) {
    console.error(err);
  }
});
app.post("/plan", async (req, res) => {});
app.post("/exercise", async (req, res) => {});

app.patch("/plan", async (req, res) => {});
app.patch("/exercise", async (req, res) => {});

//  Only plans and exercises added by the user
app.delete("/plan", async (req, res) => {});
app.delete("/exercise", async (req, res) => {});
app.delete("/account", (req, res) => {});

passport.use(
  "local",
  new Strategy({ usernameField: "email" }, async function (
    email: string,
    password: string,
    done: any
  ) {
    try {
      const result = await db.query("SELECT * FROM users WHERE email = $1 ", [
        email,
      ]);
      // console.log(result);
      if (result.rows.length > 0) {
        const user: User = result.rows[0];
        // console.log(user);
        const storedHashedPassword: string = user.password;
        // console.log("User: ", user);
        bcrypt.compare(
          password,
          storedHashedPassword,
          (err: any, valid: boolean) => {
            if (err) {
              console.error("Error comparing passwords", err);
              return done(err);
            }
            if (valid) {
              return done(null, user);
            } else {
              return done(null, false, { message: "Incorrect password" });
            }
          }
        );
      } else {
        return done(null, false, { message: "User not found" });
      }
    } catch (error) {
      console.error("Error in local strategy", error);
      return done(error);
    }
  })
);

passport.serializeUser(function (user: any, done: any) {
  // console.log("Serialize id: ", user);
  return done(null, user.id);
});

passport.deserializeUser(async function (user: any, done: any) {
  try {
    const result = await db.query("SELECT * FROM users WHERE id = $1", [
      user.id,
    ]);
    if (result.rows.length > 0) {
      const user = result.rows[0];
      return done(null, user);
    } else {
      return done(new Error("User not found"), null);
    }
  } catch (err) {
    return done(err);
  }
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
