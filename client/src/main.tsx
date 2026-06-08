/**
 * @file main.tsx
 * @description Der primäre Einstiegspunkt (Entry Point) der React-Applikation.
 * Hier wird der virtuelle DOM von React an den echten HTML-DOM gekoppelt.
 * * Zudem wird hier die globale Architektur aufgebaut, indem die Applikation
 * in verschiedene Context-Provider gewrappt wird. Die Reihenfolge (Zwiebel-Prinzip)
 * ist dabei essenziell: Äußere Provider können nicht auf innere zugreifen, 
 * innere Provider können jedoch auf alle äußeren zugreifen.
 */

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import { AuthProvider } from "./context/AuthContext.tsx";
import { NotificationProvider } from "./context/NotificationContext.tsx";
import { ThemeProvider } from "./context/ThemeContext.tsx";
import "./styles/global.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  // React.StrictMode hilft in der Entwicklung (Development Mode) dabei, 
  // unsichere Lifecycles, veraltete APIs und unerwartete Side-Effects zu finden, 
  // indem es Komponenten testweise doppelt rendert.
  <React.StrictMode>
    
    {/* 1. ThemeProvider (Ganz außen): 
        Kümmert sich um CSS-Klassen am Body-Tag. Ist völlig unabhängig von Auth oder UI-Popups 
        und sollte von Anfang an greifen, damit kein unformatiertes HTML aufblitzt. */}
    <ThemeProvider>
      
      {/* 2. NotificationProvider (Mitte): 
          Hält das globale Popup. Da er innerhalb des ThemeProviders liegt, 
          funktionieren hier alle CSS-Variablen für Dark/Light-Mode perfekt. */}
      <NotificationProvider>
        
        {/* 3. AuthProvider (Innen): 
            Steuert den Login-Status. Da er innerhalb des NotificationProviders liegt, 
            kann er bei einem fehlgeschlagenen Login/Logout problemlos ein Popup triggern. */}
        <AuthProvider>
          
          {/* Die eigentliche Applikation mit Router und UI */}
          <App />
          
        </AuthProvider>
      </NotificationProvider>
    </ThemeProvider>
  </React.StrictMode>,
);