import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import DashboardLayout from "./components/Layout/DashboardLayout";
import AuthPage from "./components/LandingPage/AuthPage";
import Exercise from "./components/Exercises/ExercisesList";
import "./styles/global.css";
import CreateExercise from "./components/Exercises/CreateExercises";
import EditExercise from "./components/Exercises/EditExercises";

const Dashboard = () => (
  <div>
    <h1 className="pageTitle">Dashboard</h1>
  </div>
);
// const ExercisesList = () => (
//   <div>
//     <h1 className="pageTitle">Übungen</h1>
//   </div>
// );
const Workouts = () => (
  <div>
    <h1 className="pageTitle">Workouts</h1>
  </div>
);
const History = () => (
  <div>
    <h1 className="pageTitle">Verlauf</h1>
  </div>
);
const NotFound = () => (
  <div>
    <h1 className="pageTitle">404 - Nicht gefunden</h1>
  </div>
);

function App() {
  const { user, loading, theme } = useAuth();
  // console.log("App.tsx user:", user);

  if (loading) {
    return <div className={`app-container ${theme} authPage`}>Lade...</div>;
  }

  return (
    <div className={`app-container ${theme}`}>
      <BrowserRouter>
        <Routes>
          {user ? (
            <Route path="/" element={<DashboardLayout />}>
              <Route index element={<Navigate to="/dashboard" />} />
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
              <Route path="workouts" element={<Workouts />} />
              <Route path="history" element={<History />} />
            </Route>
          ) : (
            <>
              <Route path="/login" element={<AuthPage />} />
              <Route path="/register" element={<AuthPage isRegister />} />
              <Route path="*" element={<Navigate to="/login" />} />
            </>
          )}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
