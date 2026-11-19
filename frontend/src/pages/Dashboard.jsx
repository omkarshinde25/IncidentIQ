import { useEffect, useState } from "react";

import StatCard from "../components/StatCard";

import {
  getIncidents,
  getDashboardSummary,
} from "../services/api";


function Dashboard() {
  const [incidents, setIncidents] = useState([]);
  const [summary, setSummary] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  // ------------------------------------------------
  // Load Dashboard Data
  // ------------------------------------------------

  const loadDashboardData = async () => {
    setLoading(true);
    setError("");

    try {
      const [
        incidentsData,
        summaryData,
      ] = await Promise.all([
        // Dashboard only needs latest 5 incidents.
        getIncidents(0, 5),

        // KPI values come directly from SQLite.
        getDashboardSummary(),
      ]);

      setIncidents(
        Array.isArray(incidentsData)
          ? incidentsData
          : []
      );

      setSummary(
        summaryData || null
      );

    } catch (err) {
      console.error(
        "Dashboard loading error:",
        err
      );

      setError(
        err?.message ||
          "Unable to load dashboard data."
      );

    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadDashboardData();
  }, []);


  // ------------------------------------------------
  // Dashboard KPI Values
  // ------------------------------------------------

  const totalIncidents =
    summary?.total_incidents ?? 0;

  const criticalIncidents =
    summary?.critical_p1 ?? 0;

  const recurringPatternCount =
    summary?.recurring_patterns ?? 0;

  const mlModelStatus =
    summary?.ml_model || "Unavailable";

  const mlModelType =
    summary?.ml_model_type ||
    "TF-IDF + Logistic Regression";


  // ------------------------------------------------
  // Recent Incidents
  // ------------------------------------------------

  const recentIncidents =
    incidents.slice(0, 5);


  // ------------------------------------------------
  // Loading
  // ------------------------------------------------

  if (loading) {
    return (
      <div className="dashboard-page">

        <div className="panel coming-soon">

          <h2>
            Loading Dashboard...
          </h2>

          <p>
            Retrieving live incident intelligence
            from IncidentIQ.
          </p>

        </div>

      </div>
    );
  }


  return (
    <div className="dashboard-page">

      {/* ======================================== */}
      {/* Error */}
      {/* ======================================== */}

      {error && (
        <div className="form-message error">
          {error}
        </div>
      )}


      {/* ======================================== */}
      {/* KPI Statistics */}
      {/* ======================================== */}

      <section className="stats-grid">

        <StatCard
          title="Total Incidents"
          value={totalIncidents}
          subtitle="Incidents stored in SQLite"
          icon="▤"
          color="blue"
        />


        <StatCard
          title="Critical P1"
          value={criticalIncidents}
          subtitle="Critical-priority incidents"
          icon="!"
          color="red"
        />


        <StatCard
          title="Recurring Patterns"
          value={recurringPatternCount}
          subtitle={
            recurringPatternCount === 1
              ? "Pattern detected"
              : "Patterns detected"
          }
          icon="⌁"
          color="purple"
        />


        <StatCard
          title="ML Model"
          value={mlModelStatus}
          subtitle={mlModelType}
          icon="✦"
          color="green"
        />

      </section>


      {/* ======================================== */}
      {/* Dashboard Main Area */}
      {/* ======================================== */}

      <section className="dashboard-grid">

        {/* -------------------------------------- */}
        {/* Recent Incidents */}
        {/* -------------------------------------- */}

        <div className="panel recent-panel">

          <div className="panel-header">

            <div>

              <h3>
                Recent Incidents
              </h3>

              <p>
                Latest incidents stored
                in IncidentIQ
              </p>

            </div>


            <button
              type="button"
              className="secondary-button"
              onClick={loadDashboardData}
            >
              Refresh
            </button>

          </div>


          <div className="incident-table">

            <div className="incident-row table-heading">

              <span>
                Incident
              </span>

              <span>
                Category
              </span>

              <span>
                Priority
              </span>

              <span>
                Status
              </span>

            </div>


            {recentIncidents.length === 0 ? (

              <div className="empty-incidents">
                No incidents available.
              </div>

            ) : (

              recentIncidents.map(
                (incident) => (

                  <div
                    className="incident-row"
                    key={incident.id}
                  >

                    <div className="incident-name">

                      <strong>
                        {incident.incident_number}
                      </strong>

                      <span>
                        {incident.title}
                      </span>

                    </div>


                    <span>
                      {
                        incident.category ||
                        "Uncategorized"
                      }
                    </span>


                    <span
                      className={
                        `priority-badge ${
                          incident.priority
                            ?.toLowerCase() || ""
                        }`
                      }
                    >
                      {
                        incident.priority ||
                        "N/A"
                      }
                    </span>


                    <span
                      className={
                        `status-badge ${
                          incident.status
                            ?.toLowerCase() || ""
                        }`
                      }
                    >
                      {
                        incident.status ||
                        "Unknown"
                      }
                    </span>

                  </div>

                )
              )

            )}

          </div>

        </div>


        {/* -------------------------------------- */}
        {/* Incident Intelligence */}
        {/* -------------------------------------- */}

        <div className="panel intelligence-panel">

          <div className="panel-header">

            <div>

              <h3>
                Incident Intelligence
              </h3>

              <p>
                Intelligent incident analysis
              </p>

            </div>

          </div>


          <div className="intelligence-item">

            <div className="intelligence-icon blue">
              ◎
            </div>

            <div>

              <strong>
                Incident Correlation
              </strong>

              <p>
                Find semantically similar
                historical incidents using
                SentenceTransformer embeddings.
              </p>

            </div>

          </div>


          <div className="intelligence-item">

            <div className="intelligence-icon purple">
              ◇
            </div>

            <div>

              <strong>
                Root Cause Analysis
              </strong>

              <p>
                Identify likely root causes using
                historical incidents, previous
                root causes and resolutions.
              </p>

            </div>

          </div>


          <div className="intelligence-item">

            <div className="intelligence-icon green">
              ✦
            </div>

            <div>

              <strong>
                ML Prediction
              </strong>

              <p>
                Predict likely root-cause classes
                using TF-IDF and Logistic
                Regression.
              </p>

            </div>

          </div>


          <div className="intelligence-item">

            <div className="intelligence-icon orange">
              ⌁
            </div>

            <div>

              <strong>
                Pattern Detection
              </strong>

              <p>
                Detect recurring problems across
                affected services, categories
                and subcategories.
              </p>

            </div>

          </div>

        </div>

      </section>


      {/* ======================================== */}
      {/* ML Model */}
      {/* ======================================== */}

      <section className="panel model-panel">

        <div>

          <span className="section-eyebrow">
            ML ENGINE
          </span>

          <h3>
            Root Cause Prediction Model
          </h3>

          <p>
            {mlModelType} classifier for
            IncidentIQ root-cause prediction.
          </p>

        </div>


        <div className="model-status">

          <span className="model-dot">
          </span>

          <div>

            <strong>
              Model {mlModelStatus}
            </strong>

            <span>
              RCA prediction service available
            </span>

          </div>

        </div>

      </section>

    </div>
  );
}


export default Dashboard;