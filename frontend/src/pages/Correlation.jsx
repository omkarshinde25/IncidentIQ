import { useEffect, useState } from "react";

import {
  getIncidents,
  correlateIncident,
} from "../services/api";


function Correlation() {
  const [incidents, setIncidents] = useState([]);
  const [selectedIncidentId, setSelectedIncidentId] =
    useState("");

  const [topK, setTopK] = useState(5);
  const [minSimilarity, setMinSimilarity] =
    useState(0.5);

  const [result, setResult] = useState(null);

  const [loadingIncidents, setLoadingIncidents] =
    useState(true);

  const [analyzing, setAnalyzing] =
    useState(false);

  const [error, setError] = useState("");


  // ------------------------------------------------
  // Load Incidents
  // ------------------------------------------------

  const loadIncidents = async () => {
    setLoadingIncidents(true);
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

      setIncidents(incidentList);

      if (incidentList.length > 0) {
        setSelectedIncidentId(
          String(incidentList[0].id)
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
      setLoadingIncidents(false);
    }
  };


  useEffect(() => {
    loadIncidents();
  }, []);


  // ------------------------------------------------
  // Run Correlation
  // ------------------------------------------------

  const handleCorrelation = async () => {
    if (!selectedIncidentId) {
      setError(
        "Please select an incident."
      );

      return;
    }

    setAnalyzing(true);
    setError("");
    setResult(null);

    try {
      const data =
        await correlateIncident(
          Number(selectedIncidentId),
          Number(topK),
          Number(minSimilarity)
        );

      setResult(data);

    } catch (err) {
      console.error(
        "Correlation error:",
        err
      );

      setError(
        err?.message ||
          "Unable to correlate incident."
      );

    } finally {
      setAnalyzing(false);
    }
  };


  // ------------------------------------------------
  // Similarity Helpers
  // ------------------------------------------------

  const getSimilarityPercentage = (
    incident
  ) => {
    if (
      incident?.similarity_percentage !==
      undefined
    ) {
      return Number(
        incident.similarity_percentage
      );
    }

    return Number(
      (
        (incident?.similarity_score || 0) *
        100
      ).toFixed(2)
    );
  };


  const getSimilarityLevel = (
    incident
  ) => {
    if (incident?.similarity_level) {
      return incident.similarity_level;
    }

    const percentage =
      getSimilarityPercentage(
        incident
      );

    if (percentage >= 85) {
      return "Very High";
    }

    if (percentage >= 70) {
      return "High";
    }

    if (percentage >= 60) {
      return "Medium";
    }

    if (percentage >= 50) {
      return "Low";
    }

    return "Very Low";
  };


  const getSimilarityClass = (
    level
  ) => {
    return String(level || "")
      .toLowerCase()
      .replace(/\s+/g, "-");
  };


  // ------------------------------------------------
  // Loading
  // ------------------------------------------------

  if (loadingIncidents) {
    return (
      <div className="panel coming-soon">
        <h2>Loading Incidents...</h2>

        <p>
          Retrieving available incidents
          for correlation.
        </p>
      </div>
    );
  }


  // ------------------------------------------------
  // UI
  // ------------------------------------------------

  return (
    <div className="correlation-page">

      {/* ------------------------------------------ */}
      {/* Configuration */}
      {/* ------------------------------------------ */}

      <section className="panel correlation-control">

        <div className="panel-header">
          <div>

            <span className="section-eyebrow">
              SEMANTIC ANALYSIS
            </span>

            <h3>
              Incident Correlation
            </h3>

            <p>
              Find semantically similar historical
              incidents using embeddings and
              cosine similarity.
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
            for correlation.
          </div>

        ) : (

          <div className="correlation-form">

            {/* Incident */}

            <div className="form-group">

              <label
                htmlFor="correlation-incident"
              >
                Select Incident
              </label>

              <select
                id="correlation-incident"
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
                      {incident.incident_number}
                      {" - "}
                      {incident.title}
                    </option>

                  )
                )}

              </select>
            </div>


            {/* Top K */}

            <div className="form-group">

              <label htmlFor="top-k">
                Similar Incidents
              </label>

              <select
                id="top-k"
                value={topK}
                onChange={(event) => {
                  setTopK(
                    Number(
                      event.target.value
                    )
                  );

                  setResult(null);
                }}
              >

                <option value={3}>
                  Top 3
                </option>

                <option value={5}>
                  Top 5
                </option>

                <option value={10}>
                  Top 10
                </option>

              </select>

            </div>


            {/* Similarity Threshold */}

            <div className="form-group">

              <label
                htmlFor="similarity-threshold"
              >
                Minimum Match
              </label>

              <select
                id="similarity-threshold"
                value={minSimilarity}
                onChange={(event) => {
                  setMinSimilarity(
                    Number(
                      event.target.value
                    )
                  );

                  setResult(null);
                }}
              >

                <option value={0.5}>
                  50%
                </option>

                <option value={0.6}>
                  60%
                </option>

                <option value={0.7}>
                  70%
                </option>

                <option value={0.8}>
                  80%
                </option>

              </select>

            </div>


            {/* Run */}

            <button
              type="button"
              className="new-incident-btn correlation-button"
              onClick={handleCorrelation}
              disabled={
                analyzing ||
                incidents.length === 0
              }
            >

              {analyzing
                ? "Analyzing..."
                : "Run Correlation"}

            </button>

          </div>
        )}

      </section>


      {/* ------------------------------------------ */}
      {/* Results */}
      {/* ------------------------------------------ */}

      {result && (

        <section className="correlation-results">

          {/* -------------------------------------- */}
          {/* Target Incident */}
          {/* -------------------------------------- */}

          <div className="panel target-incident-card">

            <span className="section-eyebrow">
              TARGET INCIDENT
            </span>


            <div className="target-header">

              <div>

                <h3>
                  {
                    result.target_incident
                      ?.incident_number
                  }
                </h3>

                <p>
                  {
                    result.target_incident
                      ?.title
                  }
                </p>

              </div>


              <div className="target-meta">

                <span>
                  {
                    result.target_incident
                      ?.category ||
                    "Uncategorized"
                  }
                </span>

                <span>
                  {
                    result.target_incident
                      ?.affected_service ||
                    "Service not specified"
                  }
                </span>

                <span>
                  {
                    result.target_incident
                      ?.priority ||
                    "Priority N/A"
                  }
                </span>

                <span>
                  {
                    result.target_incident
                      ?.status ||
                    "Status N/A"
                  }
                </span>

              </div>

            </div>

          </div>


          {/* -------------------------------------- */}
          {/* Correlation Summary */}
          {/* -------------------------------------- */}

          <div className="panel correlation-summary-card">

            <span className="section-eyebrow">
              ANALYSIS SUMMARY
            </span>


            <div className="correlation-summary-grid">

              <div>
                <span>Matches Found</span>

                <strong>
                  {
                    result.correlation_summary
                      ?.matches_found ?? 0
                  }
                </strong>
              </div>


              <div>
                <span>Requested Matches</span>

                <strong>
                  {
                    result.correlation_summary
                      ?.requested_top_k ??
                    topK
                  }
                </strong>
              </div>


              <div>
                <span>Minimum Match</span>

                <strong>
                  {
                    result.correlation_summary
                      ?.minimum_similarity_percentage ??
                    minSimilarity * 100
                  }
                  %
                </strong>
              </div>

            </div>

          </div>


          {/* -------------------------------------- */}
          {/* Results Heading */}
          {/* -------------------------------------- */}

          <div className="correlation-heading">

            <div>

              <span className="section-eyebrow">
                CORRELATION RESULTS
              </span>

              <h3>
                Similar Historical Incidents
              </h3>

              <p>
                Ranked by semantic similarity
                to the selected incident.
              </p>

            </div>


            <span className="result-count">

              {
                result.similar_incidents
                  ?.length || 0
              }{" "}
              matches

            </span>

          </div>


          {/* -------------------------------------- */}
          {/* No Results */}
          {/* -------------------------------------- */}

          {(
            result.similar_incidents
              ?.length || 0
          ) === 0 ? (

            <div className="panel empty-incidents">

              <h4>
                No similar incidents found
              </h4>

              <p>
                No historical incidents met
                the selected similarity
                threshold.
              </p>

            </div>

          ) : (

            /* ------------------------------------ */
            /* Similar Incident Cards */
            /* ------------------------------------ */

            <div className="correlation-list">

              {result.similar_incidents.map(
                (incident, index) => {

                  const percentage =
                    getSimilarityPercentage(
                      incident
                    );

                  const level =
                    getSimilarityLevel(
                      incident
                    );

                  const levelClass =
                    getSimilarityClass(
                      level
                    );

                  const hasRootCause =
                    Boolean(
                      incident.root_cause
                    );

                  const hasResolution =
                    Boolean(
                      incident.resolution
                    );

                  return (

                    <div
                      className="panel correlation-card"
                      key={
                        incident.incident_id ||
                        incident.incident_number
                      }
                    >

                      {/* Card Header */}

                      <div className="correlation-card-top">

                        <div className="correlation-rank">
                          #{index + 1}
                        </div>


                        <div className="correlation-title">

                          <strong>
                            {
                              incident.incident_number
                            }
                          </strong>

                          <h4>
                            {incident.title}
                          </h4>

                        </div>


                        <div className="similarity-score">

                          <span>
                            Similarity
                          </span>

                          <strong>
                            {percentage.toFixed(2)}
                            %
                          </strong>

                          <span
                            className={`similarity-level ${levelClass}`}
                          >
                            {level} Match
                          </span>

                        </div>

                      </div>


                      {/* Similarity Bar */}

                      <div className="similarity-bar">

                        <div
                          className="similarity-fill"
                          style={{
                            width: `${Math.min(
                              Math.max(
                                percentage,
                                0
                              ),
                              100
                            )}%`,
                          }}
                        />

                      </div>


                      {/* Incident Metadata */}

                      <div className="correlation-meta">

                        <span>
                          Category:{" "}
                          <strong>
                            {
                              incident.category ||
                              "N/A"
                            }
                          </strong>
                        </span>


                        <span>
                          Service:{" "}
                          <strong>
                            {
                              incident.affected_service ||
                              "N/A"
                            }
                          </strong>
                        </span>


                        <span>
                          Priority:{" "}
                          <strong>
                            {
                              incident.priority ||
                              "N/A"
                            }
                          </strong>
                        </span>


                        <span>
                          Status:{" "}
                          <strong>
                            {
                              incident.status ||
                              "N/A"
                            }
                          </strong>
                        </span>

                      </div>


                      {/* Historical Intelligence */}

                      <div className="correlation-details">

                        <div
                          className={
                            hasRootCause
                              ? "correlation-detail available"
                              : "correlation-detail unavailable"
                          }
                        >

                          <span className="detail-label">
                            Historical Root Cause
                          </span>

                          <p>
                            {
                              hasRootCause
                                ? incident.root_cause
                                : "Root cause not yet recorded for this historical incident."
                            }
                          </p>

                        </div>


                        <div
                          className={
                            hasResolution
                              ? "correlation-detail available"
                              : "correlation-detail unavailable"
                          }
                        >

                          <span className="detail-label">
                            Previous Resolution
                          </span>

                          <p>
                            {
                              hasResolution
                                ? incident.resolution
                                : "Resolution not yet recorded for this historical incident."
                            }
                          </p>

                        </div>

                      </div>


                      {/* Historical Evidence */}

                      {(
                        hasRootCause ||
                        hasResolution
                      ) && (

                        <div className="historical-evidence">

                          <span>
                            Historical Evidence Available
                          </span>

                          <p>
                            Review this previous
                            incident during the current
                            investigation. The engineer
                            should validate the root
                            cause before applying any
                            previous resolution.
                          </p>

                        </div>

                      )}

                    </div>

                  );
                }
              )}

            </div>
          )}

        </section>
      )}

    </div>
  );
}


export default Correlation;