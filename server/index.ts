import express from "express";
import env from "dotenv";
import pg from "pg";
// import bcrypt from "bcrypt";
// import passport from "passport";
// import { Strategy } from "passport-local";
// import session from "express-session";

const port = parseInt(process.env.PORT || "");
// const pgPort = process.env.PG_PORT;
const app = express();
env.config();

const db = new pg.Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: parseInt(process.env.PG_PORT || ""),
});

// db.connect();

app.get("/", (req, res) => {});
app.get("/home", (req, res) => {});
app.get("/plan", (req, res) => {});
app.get("/exercise", (req, res) => {});


app.post("/login", async (req, res) => {});
app.post("/register", async (req, res) => {});
app.post("/plan", async (req, res) => {});
app.post("/exercise", async (req, res) => {});

app.patch("/plan", async (req, res) => {});
app.patch("/exercise", async (req, res) => {});

//  Only plans and exercises added by the user
app.delete("/plan", async (req, res) => {});
app.delete("/exercise", async (req, res) => {});
app.delete("/account", (req, res) => {});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
