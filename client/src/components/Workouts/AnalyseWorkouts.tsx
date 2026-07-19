import { useEffect, useMemo, useState, useCallback } from "react";
import { useSetTitle } from "../../hooks/useSetTitle";
import { CompletedWorkout } from "../../types/workouts";
import { apiService } from "../../services/apiService";
import { getApiErrorMessage } from "../../util/errorHelper";
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

type ChartMetricType = "VOLUMEN" | "WEIGHT" | "REPS" | "COMBO";
type ViewModeType = "SESSION" | "SET";

interface ChartDataPoint {
  name: string;
  dateStr: string; // Speichert nur das Datum für den Tooltip
  setStr?: string; // Speichert die Satz-Info (z.B. "Satz 1")
  volumen: number;
  gewicht: number;
  wiederholungen: number;
  workoutName: string;
  exerciseName?: string;
}

interface TooltipPayload {
  name: string;
  value: number;
  color: string;
  payload: ChartDataPoint;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}

// ==========================================
// Hauptkomponente: AnalyseWorkouts
// ==========================================

export default function AnalyseWorkouts() {
  useSetTitle("Analyse Workouts");
  const { showNotification } = useNotification();

  const [completedWorkouts, setCompletedWorkouts] = useState<
    CompletedWorkout[]
  >([]);
  const [selectedWorkoutTitle, setSelectedWorkoutTitle] =
    useState<string>("ALL");
  const [selectedExerciseTitle, setSelectedExerciseTitle] =
    useState<string>("ALL");
  const [timeRangeDays, setTimeRangeDays] = useState<number>(30);
  const [chartMetric, setChartMetric] = useState<ChartMetricType>("VOLUMEN");
  const [viewMode, setViewMode] = useState<ViewModeType>("SET");

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
  }, []);

  useEffect(() => {
    fetchCompletedWorkouts();
  }, []);

  const availableWorkouts = useMemo(() => {
    const workoutNames = new Set(completedWorkouts.map((w) => w.planTitle));
    return Array.from(workoutNames).sort();
  }, [completedWorkouts]);

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

  useEffect(() => {
    if (
      selectedExerciseTitle !== "ALL" &&
      !availableExercises.includes(selectedExerciseTitle)
    ) {
      setSelectedExerciseTitle("ALL");
    }
  }, [availableExercises, selectedExerciseTitle]);

  const formatTime = (seconds: number) => {
    if (seconds === 0) return "-";
    const m = Math.floor(seconds / 60);
    const h = Math.floor(m / 60);
    const remainingM = m % 60;
    return `${h}h ${remainingM < 10 ? "0" : ""}${remainingM}m`;
  };

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

              // dateStr und setStr hinzugefügt für saubere Trennung von Datum und Satz-Info im Tooltip
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
          // dateStr hinzugefügt für sauberen Tooltip
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
   * Vollständig benutzerdefinierter Tooltip, der Datum, Satz-Info, Übungsname und die Werte anzeigt. Verwendet die neuen dateStr und setStr Felder für saubere Trennung von Datum und Satz-Info.
    - Zeigt das Datum immer an, aber die Satz-Info nur, wenn sie existiert (also in der Satz-Ansicht).
    - Zeigt den Übungsnamen an, wenn ein spezifischer Übungstitel ausgewählt ist oder wenn in der Satz-Ansicht mehrere Übungen angezeigt werden.
    - Listet alle Werte (Volumen, Gewicht, Wiederholungen) mit entsprechenden Farben auf, abhängig von der aktuellen Chart-Metrik.
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
                      tickFormatter={(value) => {
                        if (typeof value !== "string") return value;

                        if (viewMode === "SESSION") {
                          return value.split("___")[0];
                        }

                        // Logik für die Satz-Ansicht
                        const isFirst = value.includes("___FIRST");

                        if (isFirst) {
                          // Wenn es der erste Satz des Tages ist, gib nur das Datum aus (z.B. "14.05")
                          return value.split(" ")[0];
                        } else {
                          // Wenn nicht, gib nur die Satznummer aus (z.B. "S2")
                          const match = value.match(/\((S\d+)\)/);
                          return match ? match[1] : "";
                        }
                      }}
                      tick={{
                        fontSize: 12,
                        fill: "var(--c-text-primary)",
                        angle: -45,
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
                      tickFormatter={(value) => {
                        if (typeof value !== "string") return value;

                        if (viewMode === "SESSION") {
                          return value.split("___")[0];
                        }

                        // Logik für die Satz-Ansicht
                        const isFirst = value.includes("___FIRST");

                        if (isFirst) {
                          // Wenn es der erste Satz des Tages ist, gib nur das Datum aus (z.B. "14.05")
                          return value.split(" ")[0];
                        } else {
                          // Wenn nicht, gib nur die Satznummer aus (z.B. "S2")
                          const match = value.match(/\((S\d+)\)/);
                          return match ? match[1] : "";
                        }
                      }}
                      tick={{
                        fontSize: 12,
                        fill: "var(--c-text-primary)",
                        angle: -45,
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
