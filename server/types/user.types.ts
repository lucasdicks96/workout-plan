export default interface User extends UserWithoutPassword {
  password: string;
}

export interface UserWithoutPassword {
  id: string;
  email: string;
  role: "user" | "admin";
}
