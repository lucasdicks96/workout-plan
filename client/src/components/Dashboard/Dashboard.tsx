// import React from "react";
// import ReactDom from "reac-dom/client";
import Footer from "../Footer";
import Header from "../Header";
import LandingPagestyles from "../LandingPage/LandingPage.module.css";

export default function Dashboard() {
  return (
    <div className={LandingPagestyles.body}>
      <Header />
      <>DASHBOARD</>
      <Footer />
    </div>
  );
}
