import env from "dotenv";
import express from "express";
import session from "express-session";
import passport from "./config/passport";
import userRoute from "./routes/auth.route";
import exerciseRoute from "./routes/exercise.route";
import workoutRoute from "./routes/workout.route";
var cors = require("cors");
var cookieParser = require("cookie-parser");
import errorHandler from "./middlewares/error";

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
      secure: process.env.NODE_ENV === "production" ? true : false, // Setze auf true in der Produktion
      httpOnly: true,
      maxAge: 1000 * 3600 * 12,
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: ["http://localhost:5173", "http://192.168.50.244:5173"],
    credentials: true,
  })
);

app.use("/user", userRoute);
app.use("/exercise", exerciseRoute);
app.use("/workout", workoutRoute);

app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
