/**
 * Jest-Testkonfiguration für das Backend-Projekt.
 * 
 * Konfiguriert das Test-Framework für die Ausführung von TypeScript-Tests 
 * in einer Node.js-Laufzeitumgebung unter Verwendung von `ts-jest`.
 * 
 * @type {import('ts-jest').JestConfigWithTsJest}
 */
module.exports = {
  /** Aktiviert das `ts-jest`-Preset zur nahtlosen Transformation und Ausführung von TypeScript-Testdateien. */
  preset: 'ts-jest',
  
  /** Legt die Testumgebung fest (Node.js für Backend-API-Tests, ohne virtuelle Browser-DOM-Overheads). */
  testEnvironment: 'node',
  
  /**
   * Mustersuche für relevante Testdateien.
   * Stellt sicher, dass Jest ausschließlich Dateien mit der Endung `.test.ts` ausführt.
   * Schließt Hilfs- und Setup-Dateien (wie `setup.ts` oder `testHelpers.ts`) explizit aus der Test-Execution aus.
   */
  testMatch: ["**/*.test.ts"],
  
  /**
   * Liste von Modulen/Skripten, die unmittelbar nach der Initialisierung der Testumgebung 
   * und vor jedem einzelnen Test-Suite-Lauf ausgeführt werden.
   * Dient dem globalen Setup, Datenbank-Reset (Staubsauger) und der Test-Infrastruktur.
   */
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],
};