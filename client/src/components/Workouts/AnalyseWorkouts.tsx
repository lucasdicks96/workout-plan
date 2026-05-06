import { useEffect, useMemo, useState } from "react";
import { useSetTitle } from "../../hooks/useSetTitle";
import { CompletedWorkout } from "../../types/workouts";
import { apiService } from "../../services/apiService";
import {
  LineChart,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import styles from "../../styles/AnalyseWorkouts.module.css";

// ==========================================
// Typdefinitionen
// ==========================================

type ChartMetricType = "VOLUMEN" | "WEIGHT" | "REPS" | "COMBO";
type ViewModeType = "SESSION" | "SET";

/**
 * Struktur für einen einzelnen Datenpunkt, der an Recharts übergeben wird.
 * Repräsentiert je nach viewMode entweder eine ganze Session oder einen einzelnen Satz.
 */
interface ChartDataPoint {
  name: string;
  volumen: number;
  gewicht: number;
  wiederholungen: number;
  workoutName: string;
  exerciseName?: string; // Ist optional, da es in der "SESSION"-Ansicht (auf Workout-Ebene) nicht existiert
}

/**
 * Typ für den Payload innerhalb des Recharts-Tooltips.
 */
interface TooltipPayload {
  name: string;
  value: number;
  color: string;
  payload: ChartDataPoint;
}

/**
 * Typ für die Props unserer Custom Tooltip Komponente.
 */
interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}

// ==========================================
// Hauptkomponente: AnalyseWorkouts
// ==========================================

/**
 * AnalyseWorkouts
 * Ein umfangreiches Dashboard zur Visualisierung von Trainingsdaten.
 * Erlaubt das Filtern nach Zeiträumen, Workouts und spezifischen Übungen.
 * Bietet sowohl einen aggregierten Verlauf (Pro Session) als auch eine
 * detaillierte Satz-für-Satz Ansicht (Pro Satz) in Form von interaktiven Diagrammen.
 */
export default function AnalyseWorkouts() {
  useSetTitle("Analyse Workouts");

  // --- State-Management ---
  const [completedWorkouts, setCompletedWorkouts] = useState<
    CompletedWorkout[]
  >([]);

  // Filter-States
  const [selectedWorkoutTitle, setSelectedWorkoutTitle] =
    useState<string>("ALL");
  const [selectedExerciseTitle, setSelectedExerciseTitle] =
    useState<string>("ALL");
  const [timeRangeDays, setTimeRangeDays] = useState<number>(30); // 0 = Gesamter Zeitraum

  // Chart-Darstellungs-States
  const [chartMetric, setChartMetric] = useState<ChartMetricType>("VOLUMEN");
  const [viewMode, setViewMode] = useState<ViewModeType>("SET");

  // --- Daten abrufen ---
  useEffect(() => {
    const fetchCompletedWorkouts = async () => {
      const response = await apiService.getCompletedWorkouts();
      setCompletedWorkouts(response.data);
    };
    fetchCompletedWorkouts();
  }, []);

  // --- Abgeleitete Daten (Memoized zur Performance-Optimierung) ---

  /**
   * Extrahiert alle einzigartigen Workout-Namen für das Filter-Dropdown.
   */
  const availableWorkouts = useMemo(() => {
    const workoutNames = new Set(completedWorkouts.map((w) => w.title));
    return Array.from(workoutNames).sort();
  }, [completedWorkouts]);

  /**
   * Extrahiert alle einzigartigen Übungsnamen basierend auf dem aktuell gewählten Workout.
   */
  const availableExercises = useMemo(() => {
    const exerciseNames = new Set<string>();
    completedWorkouts.forEach((workout) => {
      if (
        selectedWorkoutTitle === "ALL" ||
        workout.title === selectedWorkoutTitle
      ) {
        workout.exercises.forEach((ex) => exerciseNames.add(ex.title));
      }
    });
    return Array.from(exerciseNames).sort();
  }, [completedWorkouts, selectedWorkoutTitle]);

  // Setzt die ausgewählte Übung zurück auf "ALL", falls das Workout gewechselt wurde
  // und die aktuell gewählte Übung im neuen Workout nicht existiert.
  useEffect(() => {
    if (
      selectedExerciseTitle !== "ALL" &&
      !availableExercises.includes(selectedExerciseTitle)
    ) {
      setSelectedExerciseTitle("ALL");
    }
  }, [availableExercises, selectedExerciseTitle]);

  // --- Hilfsfunktionen ---

  /**
   * Formatiert Sekunden in ein lesbares Format (z.B. "1h 15m").
   */
  const formatTime = (seconds: number) => {
    if (seconds === 0) return "-";
    const m = Math.floor(seconds / 60);
    const h = Math.floor(m / 60);
    const remainingM = m % 60;
    return `${h}h ${remainingM < 10 ? "0" : ""}${remainingM}m`;
  };

  /**
   * Berechnet statistische Werte (Summe, Max, Min, Durchschnitt, Trend) aus einem Array von Zahlen.
   * Wird genutzt, um die Datentabelle unter dem Diagramm zu füllen.
   */
  const calculateStats = (arr: number[]) => {
    if (arr.length === 0) return { sum: 0, max: 0, min: 0, avg: 0, trend: 0 };

    const sum = arr.reduce((a, b) => a + b, 0);
    const max = Math.max(...arr);
    const min = Math.min(...arr);
    const avg = sum / arr.length;

    // Einfache Trend-Berechnung: Vergleicht den letzten Wert mit dem Durchschnitt aller vorherigen Werte.
    let trend = 0;
    if (arr.length > 1) {
      const last = arr[arr.length - 1];
      const previousArr = arr.slice(0, -1);
      const prevAvg =
        previousArr.reduce((a, b) => a + b, 0) / previousArr.length;
      if (last > prevAvg * 1.02)
        trend = 1; // Mehr als 2% Steigerung
      else if (last < prevAvg * 0.98) trend = -1; // Mehr als 2% Abfall
    }

    return { sum, max, min, avg, trend };
  };

  /**
   * Haupt-Datenprozessor: Filtert, sortiert und aggregiert die Workouts.
   * Generiert die `chartData` (für Recharts) und `tableData` (für die Statistik-Tabelle).
   */
  const { chartData, tableData, workoutCount } = useMemo(() => {
    // 1. Datumsgrenze berechnen
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - timeRangeDays);

    // 2. Workouts nach Datum und Workout-Titel filtern
    const filteredWorkouts = completedWorkouts.filter((w) => {
      const isWithinDate =
        timeRangeDays === 0 || new Date(w.startTime) >= cutoffDate;
      const isMatchingWorkout =
        selectedWorkoutTitle === "ALL" || w.title === selectedWorkoutTitle;
      return isWithinDate && isMatchingWorkout;
    });

    // 3. Chronologisch sortieren (älteste zuerst, für einen logischen Chart-Verlauf)
    const sortedWorkouts = [...filteredWorkouts].sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    );

    const generatedChartData: ChartDataPoint[] = [];

    // Arrays zum Sammeln von Werten für die calculateStats-Funktion
    const vols: number[] = [];
    const reps: number[] = [];
    const sets: number[] = [];
    const weights: number[] = [];
    const durations: number[] = [];

    // 4. Daten aggregieren
    sortedWorkouts.forEach((workout) => {
      let sessionVolume = 0;
      let sessionMaxWeight = 0;
      let sessionReps = 0;
      let sessionSets = 0;
      let hasMatchingData = false;
      const formattedDate = new Date(workout.startTime).toLocaleDateString(
        "de-DE",
        {
          day: "2-digit",
          month: "2-digit",
        },
      );

      workout.exercises.forEach((exercise) => {
        // Filtern nach spezifischer Übung
        if (
          selectedExerciseTitle === "ALL" ||
          exercise.title === selectedExerciseTitle
        ) {
          exercise.sets.forEach((set, index) => {
            hasMatchingData = true;
            const w = Number(set.weight) || 0;
            const r = Number(set.repetitions) || 0;

            // Wenn wir die detaillierte Satz-Ansicht haben, pushen wir JEDEN Satz in den Chart
            if (viewMode === "SET") {
              // Einzigartiger X-Achsen Name durch "___" Trenner. Recharts braucht unique Keys.
              const axisName =
                selectedExerciseTitle === "ALL"
                  ? `${formattedDate} (S${index + 1})___${exercise.title}`
                  : `${formattedDate} (S${index + 1})`;

              generatedChartData.push({
                name: axisName,
                volumen: w * r,
                gewicht: w,
                wiederholungen: r,
                workoutName: workout.title,
                exerciseName: exercise.title,
              });
            }

            // Werte für die Session-Aggregation aufaddieren
            sessionVolume += w * r;
            sessionReps += r;
            sessionSets += 1;
            if (w > sessionMaxWeight) sessionMaxWeight = w;
          });
        }
      });

      // Wenn in dieser Session relevante Daten waren, füge sie der Session-Ansicht hinzu
      if (hasMatchingData) {
        if (viewMode === "SESSION") {
          generatedChartData.push({
            name: formattedDate,
            volumen: sessionVolume,
            gewicht: sessionMaxWeight,
            wiederholungen: sessionReps,
            workoutName: workout.title,
          });
        }

        // Statistik-Arrays für die Tabelle befüllen
        vols.push(sessionVolume);
        reps.push(sessionReps);
        sets.push(sessionSets);
        weights.push(sessionMaxWeight);
        durations.push(Number(workout.duration) || 0);
      }
    });

    return {
      chartData: generatedChartData,
      workoutCount: sortedWorkouts.length,
      tableData: {
        volume: calculateStats(vols),
        reps: calculateStats(reps),
        sets: calculateStats(sets),
        weight: calculateStats(weights),
        duration: calculateStats(durations),
      },
    };
  }, [
    completedWorkouts,
    selectedWorkoutTitle,
    selectedExerciseTitle,
    timeRangeDays,
    viewMode,
  ]);

  /**
   * Gibt die Konfiguration (Key, Farbe, Label) für den aktuell gewählten Chart-Modus zurück.
   */
  const getChartConfig = () => {
    switch (chartMetric) {
      case "WEIGHT":
        return { dataKey: "gewicht", label: "Gewicht (kg)", color: "#16a34a" };
      case "REPS":
        return {
          dataKey: "wiederholungen",
          label: "Wiederholungen",
          color: "#d97706",
        };
      case "VOLUMEN":
      default:
        return { dataKey: "volumen", label: "Volumen (kg)", color: "#2563eb" };
    }
  };

  const currentConfig = getChartConfig();

  /**
   * Rendert einen kleinen visuellen Indikator (Pfeil) basierend auf dem Trend.
   */
  const renderTrend = (trendVal: number) => {
    if (workoutCount < 2)
      return <span className={styles["trend-neutral"]}>-</span>;
    if (trendVal === 1)
      return (
        <span className={styles["trend-up"]} title="Steigend">
          ▲
        </span>
      );
    if (trendVal === -1)
      return (
        <span className={styles["trend-down"]} title="Sinkend">
          ▼
        </span>
      );
    return (
      <span className={styles["trend-neutral"]} title="Stabil">
        −
      </span>
    );
  };

  /**
   * CustomTooltip
   * Eine überschriebene Tooltip-Komponente für Recharts.
   * Sorgt dafür, dass die intern genutzten "___"-Trenner im UI ausgeblendet werden
   * und formatiert das Pop-up passend zum App-Theme.
   */
  const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      // Bereinigt das unsichtbare Suffix, das wir für unique Recharts-Keys brauchten
      const cleanLabel =
        typeof label === "string" ? label.split("___")[0] : label;

      return (
        <div
          style={{
            backgroundColor: "var(--c-surface)",
            padding: "10px",
            border: "1px solid var(--c-border)",
            borderRadius: "5px",
          }}
        >
          <p
            style={{
              fontWeight: "bold",
              margin: "0 0 5px 0",
              color: "var(--c-text-primary)",
            }}
          >
            {cleanLabel}
          </p>
          {/* Zeige Übungsname, falls vorhanden (nur im SET-Modus relevant) */}
          {payload[0]?.payload?.exerciseName && (
            <p
              style={{
                margin: "0 0 5px 0",
                fontSize: "12px",
                color: "var(--c-text-primary)",
                opacity: 0.8,
              }}
            >
              {payload[0].payload.exerciseName}
            </p>
          )}
          {payload.map((entry: TooltipPayload, index: number) => (
            <p
              key={`item-${index}`}
              style={{ color: entry.color, margin: "2px 0" }}
            >
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // --- Render ---
  return (
    <div className={styles["analyse-container"]}>
      {/* 1. Sektion: Globale Filter */}
      <div className={styles["filter-section"]}>
        <div className={styles["filter-group"]}>
          <label htmlFor="workoutPlan" className={styles["filter-label"]}>
            Workout Plan:
          </label>
          <select
            id="workoutPlan"
            value={selectedWorkoutTitle}
            onChange={(e) => setSelectedWorkoutTitle(e.target.value)}
            className={styles["filter-select"]}
          >
            <option value="ALL">Alle Workouts</option>
            {availableWorkouts.map((title) => (
              <option key={`workout-${title}`} value={title}>
                {title}
              </option>
            ))}
          </select>
        </div>

        <div className={styles["filter-group"]}>
          <label htmlFor="exercise" className={styles["filter-label"]}>
            Übung:
          </label>
          <select
            id="exercise"
            value={selectedExerciseTitle}
            onChange={(e) => setSelectedExerciseTitle(e.target.value)}
            className={styles["filter-select"]}
          >
            <option value="ALL">Alle Übungen</option>
            {availableExercises.map((title) => (
              <option key={`exercise-${title}`} value={title}>
                {title}
              </option>
            ))}
          </select>
        </div>

        <div className={styles["filter-group"]}>
          <label htmlFor="timeRange" className={styles["filter-label"]}>
            Zeitraum:
          </label>
          <select
            id="timeRange"
            value={timeRangeDays}
            onChange={(e) => setTimeRangeDays(Number(e.target.value))}
            className={styles["filter-select"]}
          >
            <option value={7}>Letzte 7 Tage</option>
            <option value={30}>Letzte 30 Tage</option>
            <option value={90}>Letzte 90 Tage</option>
            <option value={0}>Gesamter Zeitraum</option>
          </select>
        </div>
      </div>

      {/* 2. Sektion: Diagramm (Recharts) */}
      <div className={styles["chart-section"]}>
        <div className={styles["chart-header"]}>
          <h3 className={styles["chart-title"]}>
            Trendverlauf ({chartData.length} Datenpunkte)
          </h3>

          {/* Steuerelemente für das Diagramm */}
          <div className={styles["chart-controls"]}>
            <div className={styles["filter-group"]}>
              <label htmlFor="viewMode" className={styles["filter-label"]}>
                Detaillierung:
              </label>
              <select
                id="viewMode"
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value as ViewModeType)}
                className={styles["filter-select"]}
              >
                <option value="SESSION">Pro Session (Gesamt)</option>
                <option value="SET">Pro Satz (Detailliert)</option>
              </select>
            </div>

            <div className={styles["filter-group"]}>
              <label htmlFor="chartMetric" className={styles["filter-label"]}>
                Anzeigen:
              </label>
              <select
                id="chartMetric"
                value={chartMetric}
                onChange={(e) =>
                  setChartMetric(e.target.value as ChartMetricType)
                }
                className={styles["filter-select"]}
              >
                <option value="COMBO">Kombi: Wdh. & Gewicht</option>
                <option value="VOLUMEN">Nur Volumen</option>
                <option value="WEIGHT">Nur Gewicht</option>
                <option value="REPS">Nur Wiederholungen</option>
              </select>
            </div>
          </div>
        </div>

        {chartData.length > 0 ? (
          <div className={styles["chart-container"]}>
            {/* 
              Absoluter Wrapper um Recharts: Verhindert, dass ResponsiveContainer
              bei Layout-Änderungen ausbricht oder ins Unendliche wächst.
            */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
              }}
            >
              <ResponsiveContainer width="100%" height={320} debounce={50}>
                {chartMetric === "COMBO" ? (
                  // Kombinierter Chart (Bar = Wdh, Line = Gewicht)
                  <ComposedChart
                    data={chartData}
                    margin={{ top: 5, right: 10, bottom: 5, left: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    {/* X-Achse: Filtert Suffixe für eine saubere Anzeige */}
                    <XAxis
                      dataKey="name"
                      tickFormatter={(value) =>
                        typeof value === "string"
                          ? value.split("___")[0]
                          : value
                      }
                      tick={{ fontSize: 12, fill: "var(--c-text-primary)" }}
                      tickMargin={10}
                    />
                    <YAxis
                      yAxisId="left"
                      tick={{ fontSize: 12, fill: "var(--c-text-primary)" }}
                      label={{
                        value: "Wiederholungen",
                        angle: -90,
                        position: "insideLeft",
                        style: {
                          fontSize: "12px",
                          fill: "var(--c-text-primary)",
                        },
                      }}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tick={{ fontSize: 12, fill: "var(--c-text-primary)" }}
                      label={{
                        value: "Gewicht (kg)",
                        angle: 90,
                        position: "insideRight",
                        style: {
                          fontSize: "12px",
                          fill: "var(--c-text-primary)",
                        },
                      }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ paddingTop: "15px" }} />
                    <Bar
                      yAxisId="left"
                      dataKey="wiederholungen"
                      name="Wiederholungen"
                      fill="#d97706"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={40}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="gewicht"
                      name="Gewicht (kg)"
                      stroke="#16a34a"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </ComposedChart>
                ) : (
                  // Normaler LineChart für einzelne Metriken (Volumen, Reps, Weight)
                  <LineChart
                    data={chartData}
                    margin={{ top: 5, right: 10, bottom: 5, left: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tickFormatter={(value) =>
                        typeof value === "string"
                          ? value.split("___")[0]
                          : value
                      }
                      tick={{ fontSize: 12, fill: "var(--c-text-primary)" }}
                      tickMargin={10}
                    />
                    <YAxis
                      width={60}
                      tick={{ fontSize: 12, fill: "var(--c-text-primary)" }}
                      label={{
                        value: currentConfig.label,
                        angle: -90,
                        position: "insideLeft",
                        style: {
                          textAnchor: "middle",
                          fontSize: "12px",
                          fill: "var(--c-text-primary)",
                        },
                      }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                      type="monotone"
                      dataKey={currentConfig.dataKey}
                      name={currentConfig.label}
                      stroke={currentConfig.color}
                      strokeWidth={3}
                      activeDot={{ r: 6 }}
                      animationDuration={500}
                    />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="chart-empty">
            Keine Daten für die gewählten Filter verfügbar.
          </div>
        )}
      </div>

      {/* 3. Sektion: Datentabelle */}
      {workoutCount > 0 && (
        <div className={styles["table-section"]}>
          <table className={styles["stats-table"]}>
            <thead>
              <tr>
                <th>Metrik</th>
                <th>Summe</th>
                <th>Max</th>
                <th>Min</th>
                <th>Mittelwert (Ø)</th>
                <th>Trend</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className={styles["th"]}>Volumen</td>
                <td>{tableData.volume.sum.toLocaleString("de-DE")} kg</td>
                <td>{tableData.volume.max.toLocaleString("de-DE")} kg</td>
                <td>{tableData.volume.min.toLocaleString("de-DE")} kg</td>
                <td>
                  {Math.round(tableData.volume.avg).toLocaleString("de-DE")} kg
                </td>
                <td>{renderTrend(tableData.volume.trend)}</td>
              </tr>
              <tr>
                <td className={styles["th"]}>Zeit</td>
                <td>{formatTime(tableData.duration.sum)}</td>
                <td>{formatTime(tableData.duration.max)}</td>
                <td>{formatTime(tableData.duration.min)}</td>
                <td>{formatTime(tableData.duration.avg)}</td>
                <td>{renderTrend(tableData.duration.trend)}</td>
              </tr>
              <tr>
                <td className={styles["th"]}>Sätze</td>
                <td>{tableData.sets.sum}</td>
                <td>{tableData.sets.max}</td>
                <td>{tableData.sets.min}</td>
                <td>{Math.round(tableData.sets.avg * 10) / 10}</td>
                <td>{renderTrend(tableData.sets.trend)}</td>
              </tr>
              <tr>
                <td className={styles["th"]}>Wdh.</td>
                <td>{tableData.reps.sum.toLocaleString("de-DE")}</td>
                <td>{tableData.reps.max}</td>
                <td>{tableData.reps.min}</td>
                <td>{Math.round(tableData.reps.avg)}</td>
                <td>{renderTrend(tableData.reps.trend)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
