import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./components/LandingPage/LandingPage";
import Form from "./components/LandingPage/Form/Form";
// import RegisterForm from "./components/LandingPage/Register/RegisterForm";
import Dashboard from "./components/Dashboard/Dashboard";
import NotFound from "./components/NotFound";
// import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={"/"} element={<LandingPage />} />
        <Route
          path={"/login"}
          element={<Form route="login" buttonName="Login" />}
        />
        <Route
          path={"/register"}
          element={<Form route="register" buttonName="Register" />}
        />
        <Route path={"/dashboard"} element={<Dashboard />} />
        <Route path={"*"} element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
