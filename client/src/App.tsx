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

const NotFound = () => (
  <div>
    <h1 className="pageTitle">404 - Nicht gefunden</h1>
  </div>
);

function App() {
  const { user, loading, theme } = useAuth();

  if (loading) {
    return <div className={`app-container ${theme} authPage`}>Lade...</div>;
  }

  return (
    <div className={`app-container ${theme}`}>
      <BrowserRouter future={{ v7_relativeSplatPath: true }}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Layout />}>
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
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<AuthPage />} />
            <Route path="/register" element={<AuthPage isRegister />} />
          </Route>
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
