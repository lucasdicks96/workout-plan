import { createLogger, transports, format } from "winston";

const errorLogger = createLogger({
  level: "error",
  format: format.combine(format.timestamp(), format.json()),
  transports: [
    new transports.Console(),
    new transports.File({ filename: "error.log" }),
  ],
});

export default errorLogger;
