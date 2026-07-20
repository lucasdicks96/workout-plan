import { useEffect, useMemo, useState, useCallback } from "react";
import { useSetTitle } from "../../hooks/useSetTitle";
import { CompletedWorkout } from "../../schemas/workout.schema";
import { apiService } from "../../services/apiService";
import { getApiErrorMessage } from "../../util/errorHelper";
import CustomSelect from "../CustomSelect";
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
import { useNotification } from "../../hooks/useNotification";

// ==========================================
// Typdefinitionen
// ==========================================

/**
 * Verfügbare Metriken für die visuelle Auswertung im Diagramm:
 * - `"VOLUMEN"`: Gesamtes bewegtes Gewicht (Gewicht × Wiederholungen)
 * - `"WEIGHT"`: Höchst- oder Satzgewicht
 * - `"REPS"`: Anzahl der Wiederholungen
 * - `"COMBO"`: Kombinierte Ansicht aus Wiederholungen (Balken) und Gewicht (Linie)
 */
type ChartMetricType = "VOLUMEN" | "WEIGHT" | "REPS" | "COMBO";

/**
 * Granularität der Diagrammdarstellung:
 * - `"SESSION"`: Aggregierte Werte pro gesamtem Trainingstag/Session
 * - `"SET"`: Detaillierte Einzelwerte pro absolviertem Satz
 */
type ViewModeType = "SESSION" | "SET";

/**
 * Repräsentiert einen einzelnen Datenpunkt innerhalb des Recharts-Diagramms.
 */
interface ChartDataPoint {
  /** Eindeutiger Bezeichner/Achsen-String für Recharts */
  name: string;
  /** Das reine Datum im deutschen Format ("DD.MM.") für Tooltips */
  dateStr: string;
  /** Optionale Satz-Information (z. B. "Satz 1") für die Satz-Detailansicht */
  setStr?: string;
  /** Berechnetes Volumen (Gewicht × Wiederholungen) */
  volumen: number;
  /** Absolviertes Gewicht in kg */
  gewicht: number;
  /** Absolvierte Anzahl an Wiederholungen */
  wiederholungen: number;
  /** Titel des zugrundeliegenden Workout-Plans */
  workoutName: string;
  /** Optionaler Name der spezifischen Übung */
  exerciseName?: string;
}

/**
 * Payload-Struktur für einzelne Datenreihen-Einträge im Recharts-Tooltip.
 */
interface TooltipPayload {
  /** Name der Datenreihe (z. B. "Gewicht (kg)") */
  name: string;
  /** Der aktuelle numerische Wert */
  value: number;
  /** Die zugewiesene Farbe im Diagramm */
  color: string;
  /** Der vollständige zugrundeliegende `ChartDataPoint` */
  payload: ChartDataPoint;
}

/**
 * Eigenschaften (Props) für die benutzerdefinierte `CustomTooltip`-Komponente.
 */
interface CustomTooltipProps {
  /** Gibt an, ob der Tooltip aktuell auf dem Diagramm aktiv/sichtbar ist */
  active?: boolean;
  /** Array aller aktiven Datenpunkte unter dem Cursor */
  payload?: TooltipPayload[];
  /** Die Bezeichnung des X-Achsen-Wertes */
  label?: string;
}

// ==========================================
// Hauptkomponente: AnalyseWorkouts
// ==========================================

/**
 * AnalyseWorkouts
 *
 * Eine interaktive Analyse-Seite zur visuellen und statistischen Auswertung absolvierter Trainings.
 *
 * Bietet folgende Kernfunktionen:
 * - Dynamisches Filtern nach Workout-Plan, Einzelübung und Zeitfenster (7, 30, 90 Tage, Gesamt).
 * - Diagramm-Umschaltung zwischen Session-Aggregaten und detaillierten Satz-Verläufen.
 * - Verschiedene Metriken (Volumen, Gewicht, Wiederholungen sowie kombinierte Ansicht).
 * - Automatische Trendberechnung (steigend, sinkend, stabil) und statistische Zusammenfassung (Summe, Max, Min, Ø).
 *
 * @returns {JSX.Element} Die gerenderte Analyseansicht mit Filtern, Diagramm und Datentabelle.
 */
export default function AnalyseWorkouts() {
  useSetTitle("Analyse Workouts");
  const { showNotification } = useNotification();

  /** Zustand aller absolvierten Workouts aus der API */
  const [completedWorkouts, setCompletedWorkouts] = useState<
    CompletedWorkout[]
  >([]);
  /** Filterzustand: Ausgewählter Workout-Plan ("ALL" oder spezifischer Titel) */
  const [selectedWorkoutTitle, setSelectedWorkoutTitle] =
    useState<string>("ALL");
  /** Filterzustand: Ausgewählte Übung ("ALL" oder spezifischer Name) */
  const [selectedExerciseTitle, setSelectedExerciseTitle] =
    useState<string>("ALL");
  /** Filterzustand: Betrachteter Zeitraum in Tagen (0 = Gesamtzeitraum) */
  const [timeRangeDays, setTimeRangeDays] = useState<number>(30);
  /** Steuerung der anzuzeigenden Metrik im Diagramm */
  const [chartMetric, setChartMetric] = useState<ChartMetricType>("VOLUMEN");
  /** Steuerung der Granularität (Session vs. Satz) */
  const [viewMode, setViewMode] = useState<ViewModeType>("SET");

  /**
   * Lädt die Historie aller absolvierten Workouts asynchron vom Backend.
   */
  const fetchCompletedWorkouts = useCallback(async () => {
    try {
      const response = await apiService.getCompletedWorkouts();
      setCompletedWorkouts(response.data);
    } catch (error) {
      showNotification(
        getApiErrorMessage(error, "Fehler beim Abrufen der Workouts"),
        "error",
        3000,
      );
    }
  }, [showNotification]);

  useEffect(() => {
    fetchCompletedWorkouts();
  }, [fetchCompletedWorkouts]);

  /**
   * Extrahiert und sortiert alle verfügbaren Workout-Namen für das Dropdown-Menü.
   */
  const availableWorkouts = useMemo(() => {
    const workoutNames = new Set(completedWorkouts.map((w) => w.planTitle));
    return Array.from(workoutNames).sort();
  }, [completedWorkouts]);

  /**
   * Extrahiert und sortiert alle verfügbaren Übungs-Namen – abhängig vom gewählten Workout-Filter.
   */
  const availableExercises = useMemo(() => {
    const exerciseNames = new Set<string>();
    completedWorkouts.forEach((workout) => {
      if (
        selectedWorkoutTitle === "ALL" ||
        workout.planTitle === selectedWorkoutTitle
      ) {
        workout.exercises.forEach((ex) => exerciseNames.add(ex.title));
      }
    });
    return Array.from(exerciseNames).sort();
  }, [completedWorkouts, selectedWorkoutTitle]);

  /**
   * Setzt den Übungsfilter auf "ALL" zurück, falls die aktuell gewählte Übung
   * im neu gefilterten Workout-Plan nicht existiert.
   */
  useEffect(() => {
    if (
      selectedExerciseTitle !== "ALL" &&
      !availableExercises.includes(selectedExerciseTitle)
    ) {
      setSelectedExerciseTitle("ALL");
    }
  }, [availableExercises, selectedExerciseTitle]);

  /**
   * Formatiert eine Zeitdauer in Sekunden in ein lesbares Stunden- und Minuten-Format.
   *
   * @param {number} seconds - Die Dauer in Sekunden.
   * @returns {string} Formatierte Zeitangabe (z. B. "1h 15m") oder "-" bei 0 Sekunden.
   */
  const formatTime = (seconds: number) => {
    if (seconds === 0) return "-";
    const m = Math.floor(seconds / 60);
    const h = Math.floor(m / 60);
    const remainingM = m % 60;
    return `${h}h ${remainingM < 10 ? "0" : ""}${remainingM}m`;
  };

  /**
   * Berechnet statistische Kennzahlen (Summe, Max, Min, Mittelwert und Trend)
   * für eine Zahlenreihe. Der Trend vergleicht den aktuellsten Wert mit dem bisherigen Mittelwert.
   *
   * @param {number[]} arr - Das Array der zu berechnenden Zahlenwerte.
   * @returns {{ sum: number, max: number, min: number, avg: number, trend: number }}
   *          Objekt mit den berechneten Kennzahlen (`trend`: 1 = steigend, -1 = sinkend, 0 = neutral).
   */
  const calculateStats = (arr: number[]) => {
    if (arr.length === 0) return { sum: 0, max: 0, min: 0, avg: 0, trend: 0 };
    const sum = arr.reduce((a, b) => a + b, 0);
    const max = Math.max(...arr);
    const min = Math.min(...arr);
    const avg = sum / arr.length;
    let trend = 0;
    if (arr.length > 1) {
      const last = arr[arr.length - 1];
      const previousArr = arr.slice(0, -1);
      const prevAvg =
        previousArr.reduce((a, b) => a + b, 0) / previousArr.length;
      if (last > prevAvg * 1.02) trend = 1;
      else if (last < prevAvg * 0.98) trend = -1;
    }
    return { sum, max, min, avg, trend };
  };

  /**
   * Hauptberechnung: Generiert die Datenpunkte für das Recharts-Diagramm (`chartData`)
   * sowie die aggregierte Statistik-Tabelle (`tableData`) unter Berücksichtigung aller aktiven Filter.
   */
  const { chartData, tableData, workoutCount } = useMemo(() => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - timeRangeDays);

    const filteredWorkouts = completedWorkouts.filter((w) => {
      const isWithinDate =
        timeRangeDays === 0 || new Date(w.startTime) >= cutoffDate;
      const isMatchingWorkout =
        selectedWorkoutTitle === "ALL" || w.title === selectedWorkoutTitle;
      return isWithinDate && isMatchingWorkout;
    });

    const sortedWorkouts = [...filteredWorkouts].sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    );

    const generatedChartData: ChartDataPoint[] = [];
    const vols: number[] = [];
    const reps: number[] = [];
    const sets: number[] = [];
    const weights: number[] = [];
    const durations: number[] = [];
    let currentDayForAxis = "";

    sortedWorkouts.forEach((workout) => {
      let sessionVolume = 0;
      let sessionMaxWeight = 0;
      let sessionReps = 0;
      let sessionSets = 0;
      let hasMatchingData = false;
      const formattedDate = new Date(workout.startTime).toLocaleDateString(
        "de-DE",
        { day: "2-digit", month: "2-digit" },
      );

      workout.exercises.forEach((exercise) => {
        if (
          selectedExerciseTitle === "ALL" ||
          exercise.title === selectedExerciseTitle
        ) {
          exercise.sets.forEach((set, index) => {
            hasMatchingData = true;
            const w = Number(set.weight) || 0;
            const r = Number(set.repetitions) || 0;

            if (viewMode === "SET") {
              let isFirstOfDay = false;
              if (formattedDate !== currentDayForAxis) {
                isFirstOfDay = true;
                currentDayForAxis = formattedDate;
              }

              const firstMarker = isFirstOfDay ? "___FIRST" : "";
              const axisName =
                selectedExerciseTitle === "ALL"
                  ? `${formattedDate} (S${index + 1})___${exercise.title}${firstMarker}`
                  : `${formattedDate} (S${index + 1})${firstMarker}`;

              generatedChartData.push({
                name: axisName,
                dateStr: formattedDate,
                setStr: `Satz ${index + 1}`,
                volumen: w * r,
                gewicht: w,
                wiederholungen: r,
                workoutName: workout.title,
                exerciseName: exercise.title,
              });
            }

            sessionVolume += w * r;
            sessionReps += r;
            sessionSets += 1;
            if (w > sessionMaxWeight) sessionMaxWeight = w;
          });
        }
      });

      if (hasMatchingData) {
        if (viewMode === "SESSION") {
          generatedChartData.push({
            name: formattedDate,
            dateStr: formattedDate,
            volumen: sessionVolume,
            gewicht: sessionMaxWeight,
            wiederholungen: sessionReps,
            workoutName: workout.title,
          });
        }

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
   * Liefert die Farbschema- und Beschriftungskonfiguration für die aktuell gewählte Einzelmetrik.
   *
   * @returns {{ dataKey: string, label: string, color: string }} Konfigurationsobjekt für Recharts.
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
   * Rendert das visuelle Trend-Symbol (Pfeil nach oben/unten oder Bindestrich) für die Datentabelle.
   *
   * @param {number} trendVal - Der Trendcode (1 = Steigend, -1 = Sinkend, 0 = Neutral).
   * @returns {JSX.Element} Das gerenderte Trend-Icon.
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
   *
   * Benutzerdefinierte Tooltip-Komponente für Recharts:
   * - Trennt Datum, Satz-Information und Übungsname sauber ab.
   * - Passt sich dynamisch an Einzel- und Kombi-Diagramme an.
   *
   * @param {CustomTooltipProps} props - Die Tooltip-Eigenschaften von Recharts.
   * @returns {JSX.Element | null} Das gerenderte Tooltip-Element oder null.
   */
  const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;

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
            {data.dateStr} {data.setStr ? `| ${data.setStr}` : ""}
          </p>
          {data.exerciseName && (
            <p
              style={{
                margin: "0 0 5px 0",
                fontSize: "12px",
                color: "var(--c-text-primary)",
                opacity: 0.8,
              }}
            >
              {data.exerciseName}
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

  return (
    <div className={styles["analyse-container"]}>
      {/* 1. Sektion: Globale Filter */}
      <div className={styles["filter-section"]}>
        {/* 1. Workout Plan */}
        <div className={styles["filter-group"]}>
          <label className={styles["filter-label"]}>Workout Plan:</label>
          <CustomSelect
            value={selectedWorkoutTitle}
            onChange={setSelectedWorkoutTitle}
            options={[
              { label: "Alle Workouts", value: "ALL" },
              ...availableWorkouts.map((title) => ({
                label: title,
                value: title,
              })),
            ]}
          />
        </div>

        {/* 2. Übung */}
        <div className={styles["filter-group"]}>
          <label className={styles["filter-label"]}>Übung:</label>
          <CustomSelect
            value={selectedExerciseTitle}
            onChange={setSelectedExerciseTitle}
            options={[
              { label: "Alle Übungen", value: "ALL" },
              ...availableExercises.map((title) => ({
                label: title,
                value: title,
              })),
            ]}
          />
        </div>

        {/* 3. Zeitraum */}
        <div className={styles["filter-group"]}>
          <label className={styles["filter-label"]}>Zeitraum:</label>
          <CustomSelect
            value={timeRangeDays}
            onChange={setTimeRangeDays}
            options={[
              { label: "Letzte 7 Tage", value: 7 },
              { label: "Letzte 30 Tage", value: 30 },
              { label: "Letzte 90 Tage", value: 90 },
              { label: "Gesamter Zeitraum", value: 0 },
            ]}
          />
        </div>
      </div>

      {/* 2. Sektion: Diagramm (Recharts) */}
      <div className={styles["chart-section"]}>
        <div className={styles["chart-header"]}>
          <h3 className={styles["chart-title"]}>
            Trendverlauf ({chartData.length} Datenpunkte)
          </h3>

          <div className={styles["chart-controls"]}>
            <div className={styles["filter-group"]}>
              <label className={styles["filter-label"]}>Detaillierung:</label>
              <CustomSelect
                value={viewMode}
                onChange={(val) => setViewMode(val as ViewModeType)}
                options={[
                  { label: "Pro Session (Gesamt)", value: "SESSION" },
                  { label: "Pro Satz (Detailliert)", value: "SET" },
                ]}
              />
            </div>

            {/* 5. Metrik */}
            <div className={styles["filter-group"]}>
              <label className={styles["filter-label"]}>Anzeigen:</label>
              <CustomSelect
                value={chartMetric}
                onChange={(val) => setChartMetric(val as ChartMetricType)}
                options={[
                  { label: "Kombi: Wdh. & Gewicht", value: "COMBO" },
                  { label: "Nur Volumen", value: "VOLUMEN" },
                  { label: "Nur Gewicht", value: "WEIGHT" },
                  { label: "Nur Wiederholungen", value: "REPS" },
                ]}
              />
            </div>
          </div>
        </div>

        {chartData.length > 0 ? (
          <div className={styles["chart-container"]}>
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
                  <ComposedChart
                    data={chartData}
                    margin={{ top: 5, right: 10, bottom: 5, left: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="name"
                      interval={0}
                      tickLine={chartData.length <= 30}
                      tickFormatter={(value) => {
                        if (typeof value !== "string") return value;

                        if (viewMode === "SESSION") {
                          return value.split("___")[0];
                        }

                        // --- SATZ-ANSICHT (SET) ---
                        const isFirst = value.includes("___FIRST");

                        if (isFirst) {
                          return value.split(" ")[0];
                        } else {
                          if (chartData.length > 25) {
                            return "";
                          }
                          const match = value.match(/\((S\d+)\)/);
                          return match ? match[1] : "";
                        }
                      }}
                      tick={{
                        fontSize: 12,
                        fill: "var(--c-text-primary)",
                        angle: 0,
                        textAnchor: "middle",
                      }}
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
                  <LineChart
                    data={chartData}
                    margin={{ top: 5, right: 10, bottom: 5, left: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="name"
                      interval={0}
                      tickLine={chartData.length <= 30}
                      tickFormatter={(value) => {
                        if (typeof value !== "string") return value;

                        if (viewMode === "SESSION") {
                          return value.split("___")[0];
                        }

                        // --- SATZ-ANSICHT (SET) ---
                        const isFirst = value.includes("___FIRST");

                        if (isFirst) {
                          return value.split(" ")[0];
                        } else {
                          if (chartData.length > 25) {
                            return "";
                          }
                          const match = value.match(/\((S\d+)\)/);
                          return match ? match[1] : "";
                        }
                      }}
                      tick={{
                        fontSize: 12,
                        fill: "var(--c-text-primary)",
                        angle: 0,
                        textAnchor: "middle",
                      }}
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
