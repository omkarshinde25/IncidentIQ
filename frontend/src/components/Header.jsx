import { useEffect, useState } from "react";
import { checkHealth } from "../services/api";


function Header({
  title = "Dashboard",
  onNewIncident,
  theme = "dark",
  onToggleTheme,
}) {
  const [apiStatus, setApiStatus] =
    useState("checking");


  // ------------------------------------------------
  // API Health Check
  // ------------------------------------------------

  useEffect(() => {
    let isMounted = true;

    const checkApi = async () => {
      try {
        const result =
          await checkHealth();

        if (!isMounted) {
          return;
        }

        if (
          result?.status === "healthy"
        ) {
          setApiStatus(
            "connected"
          );
        } else {
          setApiStatus(
            "offline"
          );
        }

      } catch (error) {
        console.error(
          "API health check failed:",
          error
        );

        if (isMounted) {
          setApiStatus(
            "offline"
          );
        }
      }
    };


    checkApi();


    const interval =
      setInterval(
        checkApi,
        30000
      );


    return () => {
      isMounted = false;

      clearInterval(
        interval
      );
    };

  }, []);


  // ------------------------------------------------
  // API Status Text
  // ------------------------------------------------

  const getStatusText = () => {
    if (
      apiStatus === "connected"
    ) {
      return "API Connected";
    }

    if (
      apiStatus === "offline"
    ) {
      return "API Offline";
    }

    return "Checking API...";
  };


  // ------------------------------------------------
  // UI
  // ------------------------------------------------

  return (
    <header className="top-header">

      {/* Left Side */}

      <div>

        <p className="header-label">
          Incident Intelligence Platform
        </p>

        <h2>
          {title}
        </h2>

      </div>


      {/* Right Side */}

      <div className="header-actions">

        {/* API Status */}

        <div
          className={
            `api-status ${apiStatus}`
          }
        >

          <span
            className={
              `status-indicator ${apiStatus}`
            }
          />

          {getStatusText()}

        </div>


        {/* Theme Toggle */}

        <button
          type="button"
          className="theme-toggle"
          onClick={
            onToggleTheme
          }
          title={
            theme === "dark"
              ? "Switch to Light Mode"
              : "Switch to Dark Mode"
          }
          aria-label={
            theme === "dark"
              ? "Switch to Light Mode"
              : "Switch to Dark Mode"
          }
        >

          <span className="theme-icon">

            {theme === "dark"
              ? "☀"
              : "☾"}

          </span>

        </button>


        {/* New Incident */}

        <button
          type="button"
          className="new-incident-btn"
          onClick={
            onNewIncident
          }
        >
          + New Incident
        </button>

      </div>

    </header>
  );
}


export default Header;