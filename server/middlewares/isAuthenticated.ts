import { Request, Response, NextFunction } from "express";

export function isAuthenticated(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    res.clearCookie("userId", { path: "/" });
    res.clearCookie("connect.sid", { path: "/" });
    res.status(401).json({ message: "Nicht authentifiziert" });
  }
}
