import { useEffect, useMemo, useState } from "react";
import { useSetTitle } from "../../hooks/useSetTitle";
import { CompletedWorkout } from "../../schemas/workout.schema";
import { apiService } from "../../services/apiService";

import Calendar from "react-calendar";
import { ActivityCalendar } from "react-activity-calendar";
import "react-calendar/dist/Calendar.css";
import styles from "../../styles/Dashboard.module.css";

/**
 * Definiert die möglichen Ansichtsmodi für den Aktivitätsverlauf.
 * "MONTH" zeigt den klassischen Monatskalender, "YEAR" die GitHub-style Heatmap.
 */
type ViewMode = "MONTH" | "YEAR";

/**
 * Dashboard-Komponente.
 * Die Startseite nach dem Login. Zeigt eine Zusammenfassung der Benutzeraktivitäten,
 * Quick-Stats (z.B. Wochenziele) und einen visuellen Trainingsverlauf (Kalender/Heatmap).
 */
export default function Dashboard() {
  // Setzt den globalen Seitentitel im Header
  useSetTitle("Dashboard");

  const [completedWorkouts, setCompletedWorkouts] = useState<
    CompletedWorkout[]
  >([]);
  const [viewMode, setViewMode] = useState<ViewMode>("YEAR");

  /**
   * Lädt alle abgeschlossenen Workouts beim ersten Rendern der Komponente
   * und sortiert diese chronologisch absteigend (neueste zuerst).
   */
  useEffect(() => {
    const fetchCompletedWorkouts = async () => {
      try {
        const response = await apiService.getCompletedWorkouts();

        const sortedData = response.data.sort(
          (a: CompletedWorkout, b: CompletedWorkout) =>
            new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
        );
        setCompletedWorkouts(sortedData);
      } catch (error) {
        console.error("Fehler beim Laden der Workouts:", error);
      }
    };
    fetchCompletedWorkouts();
  }, []);

  /**
   * Bereitet die Rohdaten der Workouts für die verschiedenen UI-Widgets auf.
   * Wird dank `useMemo` nur neu berechnet, wenn sich `completedWorkouts` ändert.
   */
  const { heatmapData, workoutDatesSet, quickStats, recentWorkouts } =
    useMemo(() => {
      const datesSet = new Set<string>();
      const workoutCounts = new Map<string, number>();

      let workoutsThisWeek = 0;
      const now = new Date();

      // Berechne den Start der aktuellen Woche (Montag, 00:00 Uhr)
      const dayOfWeek = now.getDay() || 7; // So = 7, Mo = 1
      const mondayOfThisWeek = new Date(now);
      mondayOfThisWeek.setHours(0, 0, 0, 0);
      mondayOfThisWeek.setDate(now.getDate() - dayOfWeek + 1);

      // 1. Zähle Workouts pro Tag und prüfe aktuelle Woche
      completedWorkouts.forEach((w) => {
        const dateObj = new Date(w.startTime);
        // Zeitzonen-Korrektur, um den genauen lokalen Tagestring (YYYY-MM-DD) zu erhalten
        const localDate = new Date(
          dateObj.getTime() - dateObj.getTimezoneOffset() * 60000,
        );
        const dateString = localDate.toISOString().split("T")[0];

        datesSet.add(dateString);
        workoutCounts.set(dateString, (workoutCounts.get(dateString) || 0) + 1);

        if (dateObj >= mondayOfThisWeek) {
          workoutsThisWeek++;
        }
      });

      // 2. Generiere Datenstruktur für die Jahres-Heatmap (letzte 365 Tage)
      const heatData = [];
      const today = new Date();
      for (let i = 365; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const localD = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
        const dateStr = localD.toISOString().split("T")[0];

        const count = workoutCounts.get(dateStr) || 0;

        // Bestimmt die Farbintensität in der Heatmap (Level 0-4)
        let level = 0;
        if (count === 1) level = 1;
        else if (count === 2) level = 2;
        else if (count === 3) level = 3;
        else if (count >= 4) level = 4;

        heatData.push({ date: dateStr, count, level });
      }

      // 3. Berechne Tage seit dem letzten Workout für die Quick-Stats
      let daysSinceLast = "Noch keins";
      if (completedWorkouts.length > 0) {
        const lastWorkoutDate = new Date(completedWorkouts[0].startTime);
        const diffTime = Math.abs(now.getTime() - lastWorkoutDate.getTime());
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) daysSinceLast = "Heute";
        else if (diffDays === 1) daysSinceLast = "Gestern";
        else daysSinceLast = `Vor ${diffDays} Tagen`;
      }

      return {
        heatmapData: heatData,
        workoutDatesSet: datesSet,
        recentWorkouts: completedWorkouts.slice(0, 3), // Beschränkt den Feed auf die letzten 3
        quickStats: {
          total: completedWorkouts.length,
          thisWeek: workoutsThisWeek,
          lastWorkout: daysSinceLast,
        },
      };
    }, [completedWorkouts]);

  /**
   * Hilfsfunktion: Konvertiert Sekunden in eine gut lesbare Minuten-Anzeige.
   *
   * @param seconds - Dauer in Sekunden
   * @returns Formatierter String, z.B. "45 Min."
   */
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    return `${mins} Min.`;
  };

  // Ziel für diese Woche (TODO: Später aus User-Settings laden)
  const weeklyGoal = 3;
  // Limitiert den Fortschrittsbalken auf maximal 100%
  const progressPercent = Math.min(
    (quickStats.thisWeek / weeklyGoal) * 100,
    100,
  );

  return (
    <div className={styles["dashboard-container"]}>
      {/* --- Welcome Header & Start Button --- */}
      <div className={styles["welcome-header"]}>
        <div>
          <h1 className={styles["welcome-title"]}>Willkommen zurück! 👋</h1>
          <p className={styles["welcome-subtitle"]}>
            Bleib dran! Dein nächstes Workout wartet schon auf dich.
          </p>
        </div>
        {/* Platzhalter-Button für das nächste Workout */}
        {/* <button className={styles["start-button"]}>Workout starten</button> */}
      </div>

      {/* --- Quick Stats Grid --- */}
      <div className={styles["stats-grid"]}>
        <div className={styles["stat-card"]}>
          <span className={styles["stat-title"]}>Gesamte Workouts</span>
          <span className={styles["stat-value"]}>{quickStats.total}</span>
          <span className={styles["stat-subtext"]}>Bisher absolviert</span>
        </div>

        <div className={styles["stat-card"]}>
          <span className={styles["stat-title"]}>Letztes Workout</span>
          <span className={styles["stat-value"]}>{quickStats.lastWorkout}</span>
          <span className={styles["stat-subtext"]}>Gut gemacht!</span>
        </div>

        <div className={styles["stat-card"]}>
          <span className={styles["stat-title"]}>
            Wochenziel ({weeklyGoal}x)
          </span>
          <span className={styles["stat-value"]}>
            {quickStats.thisWeek} / {weeklyGoal}
          </span>
          <div className={styles["progress-bar-bg"]}>
            <div
              className={styles["progress-bar-fill"]}
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* --- Main Layout: Kalender & Feed --- */}
      <div className={styles["main-grid"]}>
        {/* Linke Seite: Kalender / Heatmap */}
        <div className={styles["widget-card"]}>
          <div className={styles["widget-header"]}>
            <h2 className={styles["widget-title"]}>Aktivitätsverlauf</h2>
            <div className={styles["view-toggle"]}>
              <button
                onClick={() => setViewMode("MONTH")}
                className={`${styles["toggle-btn"]} ${viewMode === "MONTH" ? styles["toggle-btn-active"] : ""}`}
              >
                Monat
              </button>
              <button
                onClick={() => setViewMode("YEAR")}
                className={`${styles["toggle-btn"]} ${viewMode === "YEAR" ? styles["toggle-btn-active"] : ""}`}
              >
                Jahr
              </button>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "center" }}>
            {viewMode === "YEAR" ? (
              <ActivityCalendar
                data={heatmapData}
                theme={{
                  light: [
                    "var(--c-bg, #f3f4f6)",
                    "#9be9a8",
                    "#40c463",
                    "#30a14e",
                    "#216e39",
                  ],
                  dark: [
                    "var(--c-bg, #1f2937)",
                    "#0e4429",
                    "#006d32",
                    "#26a641",
                    "#39d353",
                  ],
                }}
                labels={{
                  months: [
                    "Jan",
                    "Feb",
                    "Mär",
                    "Apr",
                    "Mai",
                    "Jun",
                    "Jul",
                    "Aug",
                    "Sep",
                    "Okt",
                    "Nov",
                    "Dez",
                  ],
                  weekdays: ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"],
                  totalCount: "{{count}} Workouts im letzten Jahr",
                  legend: { less: "Weniger", more: "Mehr" },
                }}
                showWeekdayLabels
                blockSize={14}
                blockMargin={4}
                fontSize={14}
              />
            ) : (
              <div style={{ width: "100%", maxWidth: "500px" }}>
                <Calendar
                  className={styles["custom-calendar"]}
                  locale="de-DE"
                  tileContent={({ date, view }) => {
                    // Markiert Tage im Monatskalender, an denen trainiert wurde
                    if (view === "month") {
                      const localDate = new Date(
                        date.getTime() - date.getTimezoneOffset() * 60000,
                      );
                      const dateStr = localDate.toISOString().split("T")[0];
                      if (workoutDatesSet.has(dateStr)) {
                        return <div className={styles["workout-dot"]}></div>;
                      }
                    }
                    return null;
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Rechte Seite: Letzte Aktivitäten (Feed) */}
        <div className={styles["widget-card"]}>
          <div className={styles["widget-header"]}>
            <h2 className={styles["widget-title"]}>Letzte Workouts</h2>
          </div>

          <div className={styles["feed-list"]}>
            {recentWorkouts.length > 0 ? (
              recentWorkouts.map((workout) => {
                // Formatiert das Datum auf z.B. "15. Okt"
                const formattedDate = new Date(
                  workout.startTime,
                ).toLocaleDateString("de-DE", {
                  day: "2-digit",
                  month: "short",
                });

                return (
                  <div key={workout.id} className={styles["feed-item"]}>
                    <h3 className={styles["feed-item-title"]}>
                      {workout.title}
                    </h3>
                    <div className={styles["feed-item-meta"]}>
                      <span>📅 {formattedDate}</span>
                      <span>⏱️ {formatDuration(workout.duration)}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p
                style={{
                  color: "var(--c-text-secondary)",
                  textAlign: "center",
                }}
              >
                Noch keine Workouts aufgezeichnet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
