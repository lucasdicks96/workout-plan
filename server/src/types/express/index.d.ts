import { UserWithoutPassword as CustomUser } from "../user.types";

declare global {
  namespace Express {
    export interface User extends CustomUser {}
    export interface Request {
      user?: User;
    }
  }
}

export {};
