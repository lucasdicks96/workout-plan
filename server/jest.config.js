/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  // Aktiviert den TypeScript-Übersetzer
  preset: 'ts-jest',
  
  // Teilt Jest mit, dass wir eine Backend-App testen (kein Browser-DOM)
  testEnvironment: 'node',
  
  // LÖSUNG FÜR FEHLER 2: 
  // Jest darf NUR Dateien ausführen, die exakt auf ".test.ts" enden. 
  // setup.ts und testHelpers.ts werden dadurch brav ignoriert!
  testMatch: ["**/*.test.ts"],
  
  // Führt unseren Datenbank-Staubsauger vor jedem Testlauf aus
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],
};