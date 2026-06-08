import { createContext, useRef, ReactNode } from "react";
import Popup, { PopupRef } from "../components/Popup";

/** Mögliche Status-Typen für das Popup (bestimmt meist die Farbe). */
export type NotificationStatus = "success" | "fail" | "error";

/** * Typisierung für den Context.
 * Definiert die verfügbaren Funktionen, die andere Komponenten nutzen können.
 */
export interface NotificationContextType {
  /** Öffnet das Popup mit einer Nachricht und einem optionalen Status. */
  showNotification: (
    message: string,
    status?: NotificationStatus,
    duration?: number,
  ) => void;
}

/** * Der globale Notification-Context.
 * Wird vom `useNotification` Hook konsumiert.
 */
export const NotificationContext = createContext<
  NotificationContextType | undefined
>(undefined);

/**
 * Provider-Komponente für das Notification-System.
 * Umschließt die App und rendert die eigentliche Popup-Komponente zentral.
 */
export function NotificationProvider({ children }: { children: ReactNode }) {
  const popupRef = useRef<PopupRef>(null);

  /**
   * Triggert das globale Popup.
   * @param message - Die anzuzeigende Textnachricht
   * @param status - Der Typ der Benachrichtigung (Standard: "fail")
   * @param duration - Optionale Dauer (überschreibt den Standardwert des Popups)
   */
  const showNotification = (
    message: string,
    status: NotificationStatus = "fail",
    duration?: number,
  ) => {
    // Reicht die (optionale) Dauer an das Popup weiter
    popupRef.current?.show(message, status, duration);
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      {/* Das zentrale Popup, das über jedem anderen Inhalt liegt */}
      <Popup ref={popupRef} showBackdrop={true} />
    </NotificationContext.Provider>
  );
}
