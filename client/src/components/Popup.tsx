import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
  useRef,
  CSSProperties,
} from "react";
import styles from "../styles/Popup.module.css";
import { NotificationStatus } from "../context/NotificationContext";

/**
 * Definition der verfügbaren Eigenschaften (Props) für die Popup-Komponente.
 */
interface PopupProps {
  /** Automatische Schließdauer in Millisekunden. Standard: 1500ms */
  duration?: number;
  /** Optionale zusätzliche CSS-Klassen für das äußere Styling des Popups */
  className?: string;
  /** Callback-Funktion, die ausgeführt wird, sobald das Popup schließt */
  onClose?: () => void;
  /** Aktiviert oder deaktiviert den abgedunkelten Hintergrund (Backdrop). Standard: true */
  showBackdrop?: boolean;
  /** Optionaler Callback, der beim Klick auf den abgedunkelten Hintergrund aufgerufen wird */
  onBackdropClick?: () => void;
}

/**
 * Definition der Schnittstelle (API), die über das Ref-Objekt nach außen freigegeben wird.
 * Ermöglicht es Elternkomponenten, das Popup imperativ zu steuern, ohne eigenen State verwalten zu müssen.
 */
interface PopupRef {
  /**
   * Öffnet das Popup mit einer definierten Nachricht und einem optischen Status.
   *
   * @param message - Der anzuzeigende Text (muss ein gültiger, nicht-leerer String sein).
   * @param status - Der optische Status (z. B. "success", "fail", "error"), der die Hintergrundfarbe bestimmt.
   * @param customDuration - Optionale individuelle Anzeigedauer in Millisekunden, die den Standardwert überschreibt.
   */
  show: (
    message: string,
    status?: NotificationStatus,
    customDuration?: number,
  ) => void;
  /** Schließt das Popup sofort manuell vor Ablauf des automatischen Timers. */
  hide: () => void;
}

/**
 * Eine imperativ gesteuerte Popup-/Modal-Komponente für systemweite Benachrichtigungen (Alerts, Toasts).
 * 
 * Da die Komponente in `forwardRef` gekapselt ist, muss sie in der Elternkomponente über eine Ref
 * angebunden werden (`const popupRef = useRef<PopupRef>(null)`). Über `popupRef.current.show(...)` 
 * kann die Anzeige ausgelöst werden.
 *
 * @param props - Die Konfigurations-Props der Komponente.
 * @param ref - Das von außen übergebene Ref-Objekt zur Steuerung der Komponente.
 * @returns Das gerenderte Popup-Element im DOM oder `null`, wenn es geschlossen ist.
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
    ref,
  ) => {
    /** Interner Zustand für die Sichtbarkeit, den Text und das Erscheinungsbild des Popups. */
    const [internalState, setInternalState] = useState<{
      message: string;
      isOpen: boolean;
      status: NotificationStatus;
    }>({ message: "", isOpen: false, status: "fail" });

    /**
     * Ref zur Speicherung der Timer-ID des automatischen Schließ-Timeouts.
     * Über eine Ref statt State gelöst, damit beim Neusetzen des Timers kein Re-Render ausgelöst wird.
     */
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    /**
     * Gibt die Methoden `show` und `hide` an die Elternkomponente frei.
     * Regelt das Verwerfen alter Timer bei schnellen, aufeinanderfolgenden Aufrufen (Debounced behavior).
     */
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

          // 1. Popup öffnen und aktuelle Daten setzen
          setInternalState({ message, isOpen: true, status });

          // 2. Laufenden Timer löschen (falls das Popup bereits aktiv war)
          if (timerRef.current) {
            clearTimeout(timerRef.current);
          }

          // 3. Gültige Dauer ermitteln (Call-spezifisch oder Fallback auf Komponentendefault)
          const activeDuration = customDuration ?? duration;

          // 4. Automatischen Schließ-Timer starten
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
      [duration, onClose],
    );

    /**
     * Cleanup-Effect: Garantiert, dass laufende Timeouts beim Unmounten der Komponente
     * aus dem Speicher gelöscht werden, um Memory-Leaks zu vermeiden.
     */
    useEffect(() => {
      return () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
      };
    }, []);

    // Verhindert unnötiges Rendering im DOM, wenn das Popup inaktiv ist
    if (!internalState.isOpen) {
      return null;
    }

    const isSuccess = internalState.status === "success";

    /** Dynamisch berechnete Inline-Styles basierend auf dem aktuellen Benachrichtigungsstatus. */
    const popupStyle: CSSProperties = {
      position: "fixed",
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
      textAlign: "center",
      alignItems: "center",
      fontWeight: "bold",
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
          className={className}
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