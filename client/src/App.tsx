import { BrowserRouter, Route, Routes } from "react-router-dom";
// import ProtectedRoute from "./Router/ProtectedRoute";
import Form from "./components/landingPage/form/Form";
import LandingPage from "./components/landingPage/LandingPage";
// import RegisterForm from "./components/LandingPage/Register/RegisterForm";
import Dashboard from "./components/dashboard/Dashboard";
import CreateExercises from "./components/exercises/CreateExercises";
import EditExercises from "./components/exercises/EditExercises";
import Exercises from "./components/exercises/Exercises";
import NotFound from "./components/NotFound";
import CreateWorkouts from "./components/workouts/CreateWorkouts";
import EditWorkouts from "./components/workouts/EditWorkouts";
import History from "./components/workouts/History";
import Workouts from "./components/workouts/Workouts";
// import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/login"
          element={<Form route="login" buttonName="Login" />}
        />
        <Route
          path="/register"
          element={<Form route="register" buttonName="Register" />}
        />
        <Route path="/users" element={<Dashboard />}>
          <Route path="exercises" element={<Exercises />}>
            <Route path="edit-exercises" element={<EditExercises />} />
            <Route path="create-exercises" element={<CreateExercises />} />
          </Route>
          <Route path="workouts" element={<Workouts />}>
            <Route path="edit-workouts" element={<EditWorkouts />} />
            <Route path="create-workouts" element={<CreateWorkouts />} />
          </Route>
          <Route path="history" element={<History />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
