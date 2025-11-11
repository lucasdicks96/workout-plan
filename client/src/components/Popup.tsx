import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import styles from "../styles/Popup.module.css";

interface PopupProps {
  duration?: number;
  className?: string;
  onClose?: () => void;
  showBackdrop?: boolean; // Neue Prop: Backdrop aktivieren
  onBackdropClick?: () => void; // Optional: Close bei Klick
}

interface PopupRef {
  show: (message: string, status: number) => void;
  hide: () => void;
}

/**
 * Wiederverwendbare Popup-Komponente mit internem State-Management.
 * Verwaltet Sichtbarkeit, Nachricht und Status intern via ref-Methoden.
 * Automatisches Schließen nach Dauer; unterstützt imperative Steuerung.
 *
 * @example
 * const popupRef = useRef<PopupRef>(null);
 * popupRef.current?.show("Erfolg!", 200);
 *
 * @param duration - Auto-Schließdauer in Millisekunden
 * @param className - Zusätzliche Klassen
 * @param onClose - Callback nach Schließen
 */
const Popup = forwardRef<PopupRef, PopupProps>(
  (
    {
      duration = 1500,
      className = "",
      onClose,
      showBackdrop = true,
      onBackdropClick,
    },
    ref
  ) => {
    const [internalState, setInternalState] = useState<{
      message: string;
      isOpen: boolean;
      status: number;
    }>({ message: "", isOpen: false, status: 0 });

    useImperativeHandle(
      ref,
      () => ({
        show: (message: string, status: number) => {
          if (typeof message !== "string" || !message.trim()) {
            console.warn("Popup: Message muss ein nicht-leerer String sein.");
            return;
          }
          if (typeof status !== "number") {
            console.warn("Popup: Status muss eine Zahl sein.");
            return;
          }
          setInternalState({ message, isOpen: true, status });
        },
        hide: () => {
          setInternalState((prev) => ({ ...prev, isOpen: false }));
        },
      }),
      []
    );

    // Auto-Schließen mit Callback
    useEffect(() => {
      if (internalState.isOpen && internalState.message) {
        const timer = setTimeout(() => {
          setInternalState((prev) => ({ ...prev, isOpen: false }));
          onClose?.();
        }, duration);
        return () => clearTimeout(timer);
      }
    }, [internalState.isOpen, internalState.message, duration, onClose]);

    if (!internalState.isOpen) {
      return null;
    }

    const isSuccess = internalState.status.toString().startsWith("2");
    const popupStyle = {
      position: "absolute" as const,
      top: "50%",
      left: "calc(window.innerWidth / 2)",
      transform: "translate(-50%, -50%)",
      padding: "1.25rem",
      borderRadius: "0.5rem",
      backgroundColor: isSuccess ? "var(--c-primary)" : "var(--c-danger)",
      color: "var(--c-bg)",
      zIndex: 1000,
      textAlign: "center" as const,
      fontWeight: "bold" as const,
      minWidth: "250px",
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    };

    return (
      <>
        {showBackdrop && (
          <div
            className={styles.backdrop}
            onClick={(e) => {
              e.stopPropagation(); // Verhindert Popup-Klick
              onBackdropClick?.(); // optionaler Callback
            }}
          />
        )}
        <div
          style={popupStyle}
          className={`${styles.popup} ${className}`}
          role="alert"
          aria-live="polite"
          onClick={(e) => e.stopPropagation()} // Stoppt Backdrop-Close
        >
          {internalState.message}
        </div>
      </>
    );
  }
);

Popup.displayName = "Popup";

export default Popup;
export type { PopupRef }; // Für Import in Componenten, die Ref nutzen
