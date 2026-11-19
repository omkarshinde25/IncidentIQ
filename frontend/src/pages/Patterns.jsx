import { useEffect, useState } from "react";

import RelatedIncidents from "../components/RelatedIncidents";

import {
  getRecurringPatterns,
} from "../services/api";


function Patterns() {
  const [minimumCount, setMinimumCount] =
    useState(2);

  const [data, setData] = useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  // ------------------------------------------------
  // Load Pattern Data
  // ------------------------------------------------

  const loadPatterns = async () => {
    setLoading(true);
    setError("");

    try {
      const result =
        await getRecurringPatterns(
          Number(minimumCount)
        );

      setData(result);

    } catch (err) {
      console.error(
        "Pattern loading error:",
        err
      );

      setError(
        err?.message ||
          "Unable to load recurring patterns."
      );

    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadPatterns();
  }, []);


  // ------------------------------------------------
  // Safe Data
  // ------------------------------------------------

  const recurringPatterns =
    data?.recurring_patterns || [];

  const categorySummary =
    data?.category_summary || {};

  const serviceSummary =
    data?.service_summary || {};


  // ------------------------------------------------
  // Problem Level CSS Class
  // ------------------------------------------------

  const getProblemClass = (level) => {
    switch (
      String(level || "").toLowerCase()
    ) {
      case "critical":
        return "critical";

      case "high":
        return "high";

      case "medium":
        return "medium";

      case "low":
        return "low";

      default:
        return "monitoring";
    }
  };


  return (
    <div className="patterns-page">

      {/* ======================================== */}
      {/* Controls */}
      {/* ======================================== */}

      <section className="panel patterns-control">

        <div className="panel-header">

          <div>

            <span className="section-eyebrow">
              INCIDENT INTELLIGENCE
            </span>

            <h3>
              Recurring Pattern Detection
            </h3>

            <p>
              Identify repeated incidents and
              potential Problem Management
              candidates across services.
            </p>

          </div>

        </div>


        <div className="patterns-form">

          <div className="form-group">

            <label htmlFor="minimum-count">
              Minimum Occurrences
            </label>

            <select
              id="minimum-count"
              value={minimumCount}
              onChange={(event) => {
                setMinimumCount(
                  Number(
                    event.target.value
                  )
                );
              }}
            >

              <option value={2}>
                2 or more
              </option>

              <option value={3}>
                3 or more
              </option>

              <option value={5}>
                5 or more
              </option>

              <option value={10}>
                10 or more
              </option>

            </select>

          </div>


          <button
            type="button"
            className="new-incident-btn patterns-button"
            onClick={loadPatterns}
            disabled={loading}
          >

            {loading
              ? "Analyzing..."
              : "Detect Patterns"}

          </button>

        </div>

      </section>


      {/* ======================================== */}
      {/* Error */}
      {/* ======================================== */}

      {error && (
        <div className="form-message error">
          {error}
        </div>
      )}


      {/* ======================================== */}
      {/* Results */}
      {/* ======================================== */}

      {!loading && data && (
        <>

          {/* ==================================== */}
          {/* Statistics */}
          {/* ==================================== */}

          <section className="patterns-stats">

            <div className="panel pattern-stat-card">

              <span>
                Total Incidents
              </span>

              <strong>
                {data.total_incidents || 0}
              </strong>

            </div>


            <div className="panel pattern-stat-card">

              <span>
                Recurring Patterns
              </span>

              <strong className="purple-text">

                {
                  data.total_patterns ??
                  recurringPatterns.length
                }

              </strong>

            </div>


            <div className="panel pattern-stat-card">

              <span>
                Problem Candidates
              </span>

              <strong className="problem-count">

                {
                  data.problem_candidates ||
                  0
                }

              </strong>

            </div>


            <div className="panel pattern-stat-card">

              <span>
                Categories
              </span>

              <strong>

                {
                  Object.keys(
                    categorySummary
                  ).length
                }

              </strong>

            </div>

          </section>


          {/* ==================================== */}
          {/* Recurring Problems */}
          {/* ==================================== */}

          <section className="patterns-results-section">

            <div className="patterns-section-header">

              <div>

                <span className="section-eyebrow">
                  RECURRING ISSUES
                </span>

                <h3>
                  Problem Candidates
                </h3>

                <p>
                  Patterns with at least{" "}
                  <strong>
                    {minimumCount}
                  </strong>{" "}
                  recorded occurrences.
                </p>

              </div>


              <span className="result-count">

                {
                  recurringPatterns.length
                }{" "}
                patterns

              </span>

            </div>


            {/* No Patterns */}

            {recurringPatterns.length === 0 ? (

              <div className="panel empty-patterns">

                <h4>
                  No recurring patterns found
                </h4>

                <p>
                  No patterns met the selected
                  occurrence threshold.
                </p>

              </div>

            ) : (

              <div className="problem-pattern-list">

                {recurringPatterns.map(
                  (pattern, index) => {

                    const problemClass =
                      getProblemClass(
                        pattern.problem_level
                      );


                    const patternKey =
                      `${pattern.category}-` +
                      `${pattern.subcategory}-` +
                      `${pattern.affected_service}-` +
                      `${index}`;


                    return (

                      <article
                        className="panel problem-pattern-card"
                        key={patternKey}
                      >

                        {/* ------------------------ */}
                        {/* Top */}
                        {/* ------------------------ */}

                        <div className="problem-pattern-header">

                          <div className="pattern-rank">

                            #{index + 1}

                          </div>


                          <div className="problem-pattern-title">

                            <span className="pattern-category">

                              {
                                pattern.category ||
                                "Unknown"
                              }

                            </span>


                            <h3>

                              {
                                pattern.pattern_name ||
                                `${pattern.category} - ${pattern.subcategory}`
                              }

                            </h3>


                            <p>

                              {
                                pattern.affected_service ||
                                "Service not specified"
                              }

                            </p>

                          </div>


                          <div
                            className={
                              `problem-level-badge ${problemClass}`
                            }
                          >

                            {
                              pattern.problem_level ||
                              "Monitoring"
                            }

                          </div>

                        </div>


                        {/* ------------------------ */}
                        {/* Metrics */}
                        {/* ------------------------ */}

                        <div className="problem-pattern-metrics">

                          <div>

                            <span>
                              Incidents
                            </span>

                            <strong>

                              {
                                pattern.incident_count ||
                                0
                              }

                            </strong>

                          </div>


                          <div>

                            <span>
                              Priority
                            </span>

                            <strong>

                              {
                                pattern.dominant_priority ||
                                "N/A"
                              }

                            </strong>

                          </div>


                          <div>

                            <span>
                              Open
                            </span>

                            <strong className="open-count">

                              {
                                pattern.open_incidents ||
                                0
                              }

                            </strong>

                          </div>


                          <div>

                            <span>
                              Resolved
                            </span>

                            <strong className="resolved-count">

                              {
                                pattern.resolved_incidents ||
                                0
                              }

                            </strong>

                          </div>

                        </div>


                        {/* ------------------------ */}
                        {/* Problem Candidate */}
                        {/* ------------------------ */}

                        {pattern.problem_candidate && (

                          <div className="problem-candidate-row">

                            <span className="problem-candidate-badge">
                              Problem Candidate
                            </span>

                            <span>
                              Repeated incidents may
                              indicate an underlying
                              recurring problem.
                            </span>

                          </div>

                        )}


                        {/* ------------------------ */}
                        {/* Recommendation */}
                        {/* ------------------------ */}

                        <div className="pattern-recommendation">

                          <span className="detail-label">
                            Recommended Next Step
                          </span>

                          <p>

                            {
                              pattern.recommendation ||
                              "Continue monitoring this pattern."
                            }

                          </p>

                        </div>


                        {/* ------------------------ */}
                        {/* Related Incidents */}
                        {/* ------------------------ */}

                        <RelatedIncidents
                          incidents={
                            pattern.related_incidents ||
                            []
                          }
                        />

                      </article>

                    );
                  }
                )}

              </div>

            )}

          </section>


          {/* ==================================== */}
          {/* Breakdowns */}
          {/* ==================================== */}

          <section className="pattern-summary-grid">

            {/* Category Breakdown */}

            <div className="panel pattern-summary-card">

              <div className="panel-header">

                <div>

                  <span className="section-eyebrow">
                    CATEGORY BREAKDOWN
                  </span>

                  <h3>
                    Incident Categories
                  </h3>

                </div>

              </div>


              <div className="summary-list">

                {Object.entries(
                  categorySummary
                ).map(
                  ([category, count]) => (

                    <div
                      className="summary-row"
                      key={category}
                    >

                      <span>
                        {category}
                      </span>

                      <strong>
                        {count}
                      </strong>

                    </div>

                  )
                )}

              </div>

            </div>


            {/* Service Breakdown */}

            <div className="panel pattern-summary-card">

              <div className="panel-header">

                <div>

                  <span className="section-eyebrow">
                    SERVICE BREAKDOWN
                  </span>

                  <h3>
                    Affected Services
                  </h3>

                </div>

              </div>


              <div className="summary-list">

                {Object.entries(
                  serviceSummary
                ).map(
                  ([service, count]) => (

                    <div
                      className="summary-row"
                      key={service}
                    >

                      <span>
                        {service}
                      </span>

                      <strong>
                        {count}
                      </strong>

                    </div>

                  )
                )}

              </div>

            </div>

          </section>

        </>
      )}

    </div>
  );
}


export default Patterns;