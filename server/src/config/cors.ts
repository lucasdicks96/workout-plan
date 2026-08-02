import { CorsOptions } from "cors";

export const corsConfig: CorsOptions = {
  origin: [
    "http://localhost:5173",
    "http://192.168.50.154:8443",
    "https://lucaslabs.dev",
  ],
  optionsSuccessStatus: 200,
  credentials: true,
};
