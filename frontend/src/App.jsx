import {
  useEffect,
  useState,
} from "react";

import Sidebar from "./components/Sidebar";
import Header from "./components/Header";

import Dashboard from "./pages/Dashboard";
import Incidents from "./pages/Incidents";
import NewIncident from "./pages/NewIncident";
import Correlation from "./pages/Correlation";
import RCAAnalysis from "./pages/RCAAnalysis";
import MLPrediction from "./pages/MLPrediction";
import Patterns from "./pages/Patterns";

import "./App.css";


function App() {
  const [activePage, setActivePage] =
    useState("Dashboard");

  // ------------------------------------------------
  // Theme
  // ------------------------------------------------

  const [theme, setTheme] = useState(() => {
    const savedTheme =
      localStorage.getItem(
        "incidentiq-theme"
      );

    return savedTheme || "dark";
  });


  // ------------------------------------------------
  // Apply Theme
  // ------------------------------------------------

  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      theme
    );

    localStorage.setItem(
      "incidentiq-theme",
      theme
    );
  }, [theme]);


  // ------------------------------------------------
  // Toggle Theme
  // ------------------------------------------------

  const toggleTheme = () => {
    setTheme(
      (currentTheme) =>
        currentTheme === "dark"
          ? "light"
          : "dark"
    );
  };


  // ------------------------------------------------
  // Render Page
  // ------------------------------------------------

  const renderPage = () => {
    switch (activePage) {

      case "Dashboard":
        return <Dashboard />;

      case "Incidents":
        return <Incidents />;

      case "New Incident":
        return <NewIncident />;

      case "Correlation":
        return <Correlation />;

      case "RCA Analysis":
        return <RCAAnalysis />;

      case "ML Prediction":
        return <MLPrediction />;

      case "Patterns":
        return <Patterns />;

      default:
        return <Dashboard />;
    }
  };


  return (
    <div
      className="app-layout"
      data-theme={theme}
    >

      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
      />


      <main className="main-content">

        <Header
          title={activePage}
          theme={theme}
          onToggleTheme={toggleTheme}
          onNewIncident={() =>
            setActivePage(
              "New Incident"
            )
          }
        />


        <div className="page-content">
          {renderPage()}
        </div>

      </main>

    </div>
  );
}


export default App;