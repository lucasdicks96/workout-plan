import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Dashboard from "./components/Dashboard/Dashboard";
import CreateExercise from "./components/Exercises/CreateExercises";
import EditExercise from "./components/Exercises/EditExercises";
import Exercise from "./components/Exercises/Exercises";
import AuthPage from "./components/LandingPage/AuthPage";
import Layout from "./components/Layout/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";
import CreateWorkouts from "./components/Workouts/CreateWorkouts";
import EditWorkouts from "./components/Workouts/EditWorkouts";
import History from "./components/Workouts/History";
import WorkoutInProgress from "./components/Workouts/WorkoutInProgress";
import Workout from "./components/Workouts/Workouts";
import EditHistoryWorkout from "./components/Workouts/EditHistoryWorkout";
import ProfileEdit from "./components/Profile/ProfileEdit";
import ProfileView from "./components/Profile/ProfileView";
import { useAuth } from "./hooks/useAuth";
import AnalyseWorkouts from "./components/Workouts/AnalyseWorkouts";
import useTheme from "./hooks/useTheme";

/**
 * Fallback-Komponente für nicht gefundene Routen (404 Error).
 * Wird nur angezeigt, wenn ein authentifizierter Benutzer eine ungültige URL aufruft.
 */
const NotFound = () => (
  <div>
    <h1 className="page-title">404 - Nicht gefunden</h1>
  </div>
);

/**
 * Hauptkomponente der Anwendung (Root-Level).
 * Initialisiert den React Router und definiert die gesamte Navigationsstruktur.
 *
 * Kernfunktionen:
 * - Blockiert das Rendering (zeigt einen Ladebildschirm), bis der initiale Auth-Check beendet ist.
 * - Wendet das globale Theme als CSS-Klasse auf den Hauptcontainer an.
 * - Trennt strikt zwischen öffentlichen Routen (Login/Register) und geschützten Routen (Dashboard etc.).
 * - Fängt ungültige URLs ab und leitet entsprechend dem Login-Status um.
 */
function App() {
  // Lädt Benutzerstatus und Ladezustand aus dem Auth-Context
  const { user, loading } = useAuth();
  // Lädt das aktuell aktive Theme aus dem Theme-Context
  const { theme } = useTheme();

  // Zeigt einen Ladescreen, solange das Backend die bestehende Session validiert
  if (loading) {
    return <div className={`app-container ${theme} authPage`}>Lade...</div>;
  }

  return (
    <div className={`app-container ${theme}`}>
      <BrowserRouter future={{ v7_relativeSplatPath: true }}>
        <Routes>
          {/* ==========================================
              Geschützte Routen (Nur für eingeloggte User)
              ========================================== */}
          <Route element={<ProtectedRoute />}>
            {/* Das Layout umschließt alle Unterseiten mit Sidebar und Header */}
            <Route path="/" element={<Layout />}>
              {/* Root-URL leitet standardmäßig auf das Dashboard weiter */}
              <Route index element={<Navigate to="/dashboard" replace />} />

              <Route path="dashboard" element={<Dashboard />} />

              <Route path="exercises" element={<Exercise />} />
              <Route
                path="exercises/edit-exercises"
                element={<EditExercise />}
              />
              <Route
                path="exercises/create-exercises"
                element={<CreateExercise />}
              />

              <Route path="workouts" element={<Workout />} />
              <Route path="workouts/edit-workouts" element={<EditWorkouts />} />
              <Route
                path="workouts/create-workouts"
                element={<CreateWorkouts />}
              />
              <Route
                path="workouts/start-workouts"
                element={<WorkoutInProgress />}
              />

              <Route path="history" element={<History />} />
              <Route
                path="/history/edit/:id"
                element={<EditHistoryWorkout />}
              />

              <Route path="/analyse" element={<AnalyseWorkouts />} />

              <Route path="/profile" element={<ProfileView />} />
              <Route path="/profile/edit" element={<ProfileEdit />} />
            </Route>
          </Route>

          {/* ==========================================
              Öffentliche Routen (Nur für NICHT eingeloggte User)
              ========================================== */}
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<AuthPage />} />
            <Route path="/register" element={<AuthPage isRegister />} />
          </Route>

          {/* ==========================================
              Catch-All (404 Fallback)
              ========================================== */}
          <Route
            path="*"
            element={user ? <NotFound /> : <Navigate to="/login" />}
          />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
