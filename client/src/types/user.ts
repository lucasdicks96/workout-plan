export interface User {
  id: string;
  email: string;
  password?: string;
  role: "user" | "admin";
}

export interface UserWithoutPassword {
  id: string;
  email: string;
  role: "user" | "admin";
}
