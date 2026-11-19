import { useEffect, useState } from "react";

import {
  getIncidents,
  predictRootCause,
} from "../services/api";


function MLPrediction() {
  const [incidents, setIncidents] = useState([]);
  const [selectedIncidentId, setSelectedIncidentId] =
    useState("");

  const [result, setResult] = useState(null);

  const [loading, setLoading] = useState(true);
  const [predicting, setPredicting] =
    useState(false);

  const [error, setError] = useState("");


  // ------------------------------------------------
  // Load Incidents
  // ------------------------------------------------

  useEffect(() => {
    const loadIncidents = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await getIncidents(
          0,
          100
        );

        const incidentList =
          Array.isArray(data)
            ? data
            : [];

        setIncidents(
          incidentList
        );

        if (incidentList.length > 0) {
          setSelectedIncidentId(
            String(
              incidentList[0].id
            )
          );
        }

      } catch (err) {
        console.error(
          "Load incidents error:",
          err
        );

        setError(
          err?.message ||
            "Unable to load incidents."
        );

      } finally {
        setLoading(false);
      }
    };

    loadIncidents();

  }, []);


  // ------------------------------------------------
  // Run ML Prediction
  // ------------------------------------------------

  const handlePrediction = async () => {
    if (!selectedIncidentId) {
      setError(
        "Please select an incident."
      );

      return;
    }

    setPredicting(true);
    setError("");
    setResult(null);

    try {
      const data = await predictRootCause(
        Number(selectedIncidentId)
      );

      setResult(data);

    } catch (err) {
      console.error(
        "ML prediction error:",
        err
      );

      setError(
        err?.message ||
          "ML prediction failed."
      );

    } finally {
      setPredicting(false);
    }
  };


  // ------------------------------------------------
  // Confidence
  // ------------------------------------------------

  const getConfidencePercentage = () => {
    const confidence = Number(
      result?.ml_prediction
        ?.prediction_confidence || 0
    );

    return Math.min(
      Math.max(
        confidence * 100,
        0
      ),
      100
    );
  };


  const getConfidenceLevel = (
    percentage
  ) => {
    if (percentage >= 85) {
      return "Very High";
    }

    if (percentage >= 70) {
      return "High";
    }

    if (percentage >= 50) {
      return "Medium";
    }

    return "Low";
  };


  const getConfidenceClass = (
    level
  ) => {
    return String(level || "")
      .toLowerCase()
      .replace(/\s+/g, "-");
  };


  // ------------------------------------------------
  // Loading
  // ------------------------------------------------

  if (loading) {
    return (
      <div className="panel coming-soon">

        <h2>
          Loading ML Prediction...
        </h2>

        <p>
          Retrieving incidents from
          IncidentIQ.
        </p>

      </div>
    );
  }


  const confidencePercentage =
    getConfidencePercentage();

  const confidenceLevel =
    getConfidenceLevel(
      confidencePercentage
    );


  // ------------------------------------------------
  // UI
  // ------------------------------------------------

  return (
    <div className="ml-page">

      {/* ======================================== */}
      {/* Prediction Controls */}
      {/* ======================================== */}

      <section className="panel ml-control">

        <div className="panel-header">

          <div>

            <span className="section-eyebrow">
              MACHINE LEARNING
            </span>

            <h3>
              Root Cause Prediction
            </h3>

            <p>
              Predict a likely root-cause class
              from the selected incident using
              the trained IncidentIQ ML model.
            </p>

          </div>

        </div>


        {error && (
          <div className="form-message error">
            {error}
          </div>
        )}


        {incidents.length === 0 ? (

          <div className="empty-incidents">
            No incidents are available
            for ML prediction.
          </div>

        ) : (

          <div className="ml-form">

            <div className="form-group">

              <label htmlFor="ml-incident">
                Select Incident
              </label>

              <select
                id="ml-incident"
                value={selectedIncidentId}
                onChange={(event) => {
                  setSelectedIncidentId(
                    event.target.value
                  );

                  setResult(null);
                  setError("");
                }}
              >

                {incidents.map(
                  (incident) => (

                    <option
                      key={incident.id}
                      value={incident.id}
                    >
                      {
                        incident.incident_number
                      }
                      {" - "}
                      {incident.title}
                    </option>

                  )
                )}

              </select>

            </div>


            <button
              type="button"
              className="new-incident-btn ml-predict-button"
              onClick={handlePrediction}
              disabled={
                predicting ||
                incidents.length === 0
              }
            >

              {predicting
                ? "Predicting..."
                : "Predict Root Cause"}

            </button>

          </div>
        )}

      </section>


      {/* ======================================== */}
      {/* Prediction Results */}
      {/* ======================================== */}

      {result && (

        <div className="ml-results">

          {/* ------------------------------------ */}
          {/* Target Incident */}
          {/* ------------------------------------ */}

          <section className="panel target-incident-card">

            <span className="section-eyebrow">
              TARGET INCIDENT
            </span>


            <div className="target-header">

              <div>

                <h3>
                  {
                    result.incident
                      ?.incident_number
                  }
                </h3>

                <p>
                  {
                    result.incident
                      ?.title
                  }
                </p>

              </div>


              <div className="target-meta">

                <span>
                  {
                    result.incident
                      ?.category ||
                    "Uncategorized"
                  }
                </span>

                <span>
                  {
                    result.incident
                      ?.affected_service ||
                    "Service N/A"
                  }
                </span>

                <span>
                  {
                    result.incident
                      ?.priority ||
                    "Priority N/A"
                  }
                </span>

                <span>
                  {
                    result.incident
                      ?.status ||
                    "Status N/A"
                  }
                </span>

              </div>

            </div>


            {result.incident
              ?.description && (

              <div className="ml-incident-description">

                <span className="detail-label">
                  Incident Description
                </span>

                <p>
                  {
                    result.incident
                      .description
                  }
                </p>

              </div>

            )}

          </section>


          {/* ------------------------------------ */}
          {/* ML Prediction */}
          {/* ------------------------------------ */}

          <section className="panel ml-prediction-result">

            <div className="ml-prediction-main">

              <span className="section-eyebrow">
                PREDICTED ROOT CAUSE
              </span>

              <h2>
                {
                  result.ml_prediction
                    ?.predicted_root_cause ||
                  "Prediction unavailable"
                }
              </h2>

              <p>
                This is the most likely
                root-cause class predicted
                from the incident information.
              </p>

            </div>


            <div className="ml-confidence-result">

              <span className="detail-label">
                Prediction Confidence
              </span>

              <strong>
                {
                  confidencePercentage
                    .toFixed(2)
                }
                %
              </strong>

              <span
                className={
                  `ml-confidence-level ${
                    getConfidenceClass(
                      confidenceLevel
                    )
                  }`
                }
              >
                {confidenceLevel}
              </span>

            </div>

          </section>


          {/* ------------------------------------ */}
          {/* Engineer Validation */}
          {/* ------------------------------------ */}

          <section className="panel ml-validation-card">

            <div>

              <span className="section-eyebrow">
                ENGINEER VALIDATION
              </span>

              <h3>
                Prediction Requires Verification
              </h3>

              <p>
                IncidentIQ provides the ML
                prediction as investigation
                support. The support engineer
                should verify logs, service
                health, recent changes and
                other incident evidence before
                confirming the final root cause.
              </p>

            </div>


            <span className="ml-review-badge">
              Review Required
            </span>

          </section>


          {/* ------------------------------------ */}
          {/* Model Information */}
          {/* ------------------------------------ */}

          <section className="panel ml-model-info">

            <div>

              <span className="section-eyebrow">
                MODEL INFORMATION
              </span>

              <h3>
                {
                  result.ml_prediction
                    ?.model_type ||
                  "TF-IDF + Logistic Regression"
                }
              </h3>

              <p>
                TF-IDF converts incident
                text into numerical features.
                Logistic Regression uses
                those features to predict
                the most likely root-cause
                category learned during
                model training.
              </p>

            </div>


            <div className="model-status">

              <span className="model-dot">
              </span>

              <div>

                <strong>
                  Model Active
                </strong>

                <span>
                  Root-cause classifier
                </span>

              </div>

            </div>

          </section>

        </div>
      )}

    </div>
  );
}


export default MLPrediction;