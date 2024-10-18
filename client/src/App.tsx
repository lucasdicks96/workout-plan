import { BrowserRouter, Route, Routes } from "react-router-dom";
// import ProtectedRoute from "./Router/ProtectedRoute";
import Form from "./components/landingPage/form/Form";
import LandingPage from "./components/landingPage/LandingPage";
// import RegisterForm from "./components/LandingPage/Register/RegisterForm";
import Dashboard from "./components/dashboard/Dashboard";
import Exercises from "./components/exercises/Exercises";
import CreateExercises from "./components/exercises/CreateExercises";
import EditExercises from "./components/exercises/EditExercises";
import NotFound from "./components/NotFound";
import History from "./components/workouts/History";
import Workouts from "./components/workouts/Workouts";
import CreateWorkouts from "./components/workouts/CreateWorkouts";
import EditWorkouts from "./components/workouts/EditWorkouts";
// import './App.css'

function App() {
  // const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  // const navigate = useNavigate();
  // useEffect(() => {
  //   const loggedIn = async () => {
  //     try {
  //       const result = await axios.get("http://localhost:5000/dashboard");
  //       console.log(result);
  //       if (result.status === 200) {
  //         setIsLoggedIn(true);
  //       } else {
  //         setIsLoggedIn(false);
  //       }
  //     } catch (error) {
  //       setIsLoggedIn(false);
  //       navigate("/");
  //       console.error("Not logged in", error);
  //     }
  //   };

  //   loggedIn(); // Call the async function to check authentication
  // }, [navigate]); // Empty dependency array ensures the effect runs once
  // const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  // async function checkAuth() {
  //   try {
  //     const check = await axios.get("http://localhost:5000/auth");
  //     console.log("check status", check.data);
  //     if (check.status === 200) setIsAuthenticated(true);
  //     else setIsAuthenticated(false);
  //   } catch (error) {
  //     console.error("auth error", error);
  //   }
  // }
  // useEffect(() => {
  //   checkAuth();
  // });

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

        {/* <Route path="/dashboard" element={<ProtectedRoute />}> */}
        {/* <Route index element={<Dashboard />} /> */}
        {/* <Route element={<ProtectedRoute isAuthenticated={isAuthenticated} />}> */}
        <Route path="/users" element={<Dashboard />}>
          <Route path="exercises" element={<Exercises />} />
          <Route path="edit-exercises" element={<EditExercises />} />
          <Route path="create-exercises" element={<CreateExercises />} />
          <Route path="workouts" element={<Workouts />} />
          <Route path="edit-workouts" element={<EditWorkouts />} />
          <Route path="create-workouts" element={<CreateWorkouts />} />
          <Route path="history" element={<History />} />
        </Route>
        {/* </Route> */}

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
