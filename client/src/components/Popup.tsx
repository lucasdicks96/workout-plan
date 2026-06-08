import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
  useRef,
} from "react";
import styles from "../styles/Popup.module.css";
import { NotificationStatus } from "../context/NotificationContext";

/**
 * Definition der verfügbaren Properties (Props) für die Popup-Komponente.
 */
interface PopupProps {
  /** Automatische Schließdauer in Millisekunden. Standard: 1500ms */
  duration?: number;
  /** Optionale zusätzliche CSS-Klassen für das Styling */
  className?: string;
  /** Callback-Funktion, die ausgeführt wird, sobald das Popup schließt */
  onClose?: () => void;
  /** Aktiviert oder deaktiviert den abgedunkelten Hintergrund (Backdrop). Standard: true */
  showBackdrop?: boolean;
  /** Optionaler Callback, wenn der Benutzer auf den abgedunkelten Hintergrund klickt */
  onBackdropClick?: () => void;
}

/**
 * Definition der Funktionen, die über das Ref-Objekt nach außen freigegeben werden.
 */
interface PopupRef {
  /**
   * Öffnet das Popup.
   * @param message - Der anzuzeigende Text.
   * @param status - Der Status (z.B. "success", "fail", "error"), der die Farbe bestimmt.
   * @param customDuration - Optionale Dauer, überschreibt die Standarddauer.
   */
  show: (
    message: string,
    status?: NotificationStatus,
    customDuration?: number,
  ) => void;
  /** Schließt das Popup manuell vor Ablauf der Zeit. */
  hide: () => void;
}

const Popup = forwardRef<PopupRef, PopupProps>(
  (
    {
      duration = 1500, // Standardwert aus den Props
      onClose,
      showBackdrop = true,
      onBackdropClick,
    },
    ref,
  ) => {
    const [internalState, setInternalState] = useState<{
      message: string;
      isOpen: boolean;
      status: NotificationStatus;
    }>({ message: "", isOpen: false, status: "fail" });

    // Ref für den Timer, damit wir ihn bei Bedarf abbrechen können
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useImperativeHandle(
      ref,
      () => ({
        show: (
          message: string,
          status: NotificationStatus = "fail",
          customDuration?: number,
        ) => {
          if (typeof message !== "string" || !message.trim()) {
            console.warn("Popup: Message muss ein nicht-leerer String sein.");
            return;
          }

          // 1. Popup öffnen und Daten setzen
          setInternalState({ message, isOpen: true, status });

          // 2. Alten Timer löschen (falls das Popup schon offen war)
          if (timerRef.current) {
            clearTimeout(timerRef.current);
          }

          // 3. Dauer bestimmen (übergebene Dauer oder Fallback auf Props)
          const activeDuration = customDuration ?? duration;

          // 4. Neuen Timer starten
          timerRef.current = setTimeout(() => {
            setInternalState((prev) => ({ ...prev, isOpen: false }));
            onClose?.();
            timerRef.current = null;
          }, activeDuration);
        },

        hide: () => {
          if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
          }
          setInternalState((prev) => ({ ...prev, isOpen: false }));
          onClose?.();
        },
      }),
      [duration, onClose], // Abhängigkeiten für useImperativeHandle
    );

    // WICHTIG: Cleanup beim Unmounten der Komponente!
    useEffect(() => {
      return () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
      };
    }, []);

    // Wenn nicht geöffnet, gar nichts ins DOM rendern
    if (!internalState.isOpen) {
      return null;
    }

    const isSuccess = internalState.status === "success";

    const popupStyle = {
      position: "fixed" as const,
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      padding: "1.25rem",
      borderRadius: "0.5rem",
      backgroundColor: isSuccess
        ? "var(--c-primary, #4caf50)"
        : "var(--c-danger, #f44336)",
      color: "var(--c-bg, #ffffff)",
      zIndex: 10000,
      textAlign: "center" as const,
      alignItems: "center" as const,
      fontWeight: "bold" as const,
      minWidth: "250px",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
    };

    return (
      <>
        {showBackdrop && (
          <div
            className={styles.backdrop}
            onClick={(e) => {
              e.stopPropagation();
              onBackdropClick?.();
            }}
          />
        )}

        <div
          style={popupStyle}
          role="alert"
          aria-live="polite"
          onClick={(e) => e.stopPropagation()}
        >
          {internalState.message}
        </div>
      </>
    );
  },
);

Popup.displayName = "Popup";

export default Popup;
export type { PopupRef };
