import { useContext } from "react";
import { NotificationContext, NotificationContextType } from "../context/NotificationContext";

/**
 * Custom Hook für den einfachen Zugriff auf das globale Benachrichtigungssystem (Popup).
 * Ermöglicht es jeder Komponente, Erfolgs- oder Fehlermeldungen auf dem Bildschirm einzublenden,
 * ohne eigene Popup-Zustände verwalten zu müssen.
 *
 * @throws {Error} Löst einen Fehler aus, wenn der Hook in einer Komponente 
 * verwendet wird, die nicht vom `NotificationProvider` umschlossen ist.
 * @returns {NotificationContextType} Ein Objekt mit der `showNotification`-Funktion.
 */
export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  
  // Wichtiger Sicherheitscheck: Wurde der Hook außerhalb des Providers aufgerufen?
  // Das schützt davor, dass die App lautlos fehlschlägt, falls man in der main.tsx
  // den Provider vergessen hat.
  if (!context) {
    throw new Error("useNotification must be used within a NotificationProvider");
  }
  
  return context;
};