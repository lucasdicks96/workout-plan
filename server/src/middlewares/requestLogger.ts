import { Request, Response, NextFunction } from "express";

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (process.env.NODE_ENV === "production") {
    console.log("--------------------------------");
    console.log("Incoming Request:", req.method, req.url);
    console.log("Remote IP:", req.ip);
    console.log("X-Forwarded-For Header:", req.headers["x-forwarded-for"]);
    console.log("--------------------------------");
  }
  next();
};
