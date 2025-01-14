import env from "dotenv";
import express, { NextFunction, Request, Response } from "express";
import session from "express-session";
import passport from "./config/passport";
import userRoute from "./routes/user";
import exerciseRoute from "./routes/exercise";
var cors = require("cors");
var cookieParser = require("cookie-parser");

declare module "express-session" {
  export interface SessionData {
    sessionUser: { id: number; email: string }; // Beispiel: spezifischere Typen
  }
}
const port = parseInt(process.env.PORT || "5000");

const app = express();

env.config();

app.use(cookieParser());
app.use(
  session({
    secret: (process.env.SESSION_SECRET || "default secret") as string,
    resave: false,
    saveUninitialized: false,
    unset: "destroy",
    cookie: {
      path: "/",
      secure: false,
      httpOnly: true,
      maxAge: 1000 * 60 * 30,
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use("/user", userRoute);
app.use("/exercise", exerciseRoute);

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong" });
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
