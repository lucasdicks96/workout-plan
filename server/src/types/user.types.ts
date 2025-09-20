export interface User extends UserWithoutPassword {
  password: string;
}

export interface UserWithoutPassword {
  id: string;
  email: string;
  role: "user" | "admin";
}
 // "dev": "nodemon --exec \"ts-node --cache-directory .tscache\" ./src/www.ts",