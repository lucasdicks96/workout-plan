import React from "react";
import ReactDOM from "react-dom/client";
// import App from "./App.tsx";
import "./index.css";
import "./components/LandingPage.module.css";
import LandingPage from "./components/LandingPage/LandingPage.tsx";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <LandingPage />
    {/* <App /> */}
  </React.StrictMode>
);
