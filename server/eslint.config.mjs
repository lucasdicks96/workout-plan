import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: {
        // Sagt ESLint, dass globale Node-Variablen wie process.env oder __dirname okay sind
        node: true, 
      },
    },
    rules: {
      // Hier kommen später deine Server-spezifischen Regeln rein
    },
  }
);