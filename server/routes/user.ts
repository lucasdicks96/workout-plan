import { Router, Request, Response, NextFunction } from "express";
import passport from "passport";
import bcrypt from "bcrypt";
import pool from "../config/db";

const router = Router();

router.post("/register", async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const { email, password } = req.body;

    const checkIfExists = await client.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    if (checkIfExists.rows.length > 0) {
      res.status(501).json({ message: "User already exists" });
    } else {
      const hashedPassword = await bcrypt.hash(password, 15);

      const result = await client.query(
        "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email",
        [email, hashedPassword]
      );
      res.status(201).json({ message: "User created", user: result.rows[0] });
    }
  } catch (err) {
    res.status(501).json({ message: "Registration error", error: err });
  } finally {
    client.release();
  }
});

router.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/users/users",
    failureRedirect: "/users/login",
  })
);

router.get("/users", isAuthenticated, (req: Request, res: Response) => {
  res.json({ message: "Willkommen" });
});

router.post("/logout", (req: Request, res: Response) => {
  // console.log(req.user);
  req.logout(() => {
    res.json({ message: "logged out" });
  });
});

function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    // return res.status(200).json({ user: req.user });
    return next();
  }
  return res.status(401).json({ message: "Not authorized. Please login" });
}

export default router;
