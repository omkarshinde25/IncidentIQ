import { useState } from "react";


function RelatedIncidents({
  incidents = [],
}) {
  const [isExpanded, setIsExpanded] =
    useState(false);


  // ------------------------------------------------
  // Safe Incident List
  // ------------------------------------------------

  const relatedIncidents =
    Array.isArray(incidents)
      ? incidents
      : [];


  const relatedCount =
    relatedIncidents.length;


  // ------------------------------------------------
  // Nothing to Show
  // ------------------------------------------------

  if (relatedCount === 0) {
    return null;
  }


  // ------------------------------------------------
  // UI
  // ------------------------------------------------

  return (
    <div className="related-pattern-incidents">

      {/* Header */}

      <div className="related-incidents-header">

        <div>

          <span className="detail-label">
            Related Incidents
          </span>

          <small>
            {relatedCount} incidents
          </small>

        </div>


        <button
          type="button"
          className="related-incidents-toggle"
          onClick={() =>
            setIsExpanded(
              (current) => !current
            )
          }
          aria-expanded={isExpanded}
        >

          {isExpanded
            ? "Hide Related Incidents"
            : `View Related Incidents (${relatedCount})`}

        </button>

      </div>


      {/* Incidents appear only after click */}

      {isExpanded && (

        <div className="related-incident-list">

          {relatedIncidents.map(
            (incident, index) => {

              const incidentKey =
                incident?.id ||
                incident?.incident_number ||
                `related-${index}`;


              const statusClass =
                String(
                  incident?.status || ""
                )
                  .toLowerCase()
                  .replace(/\s+/g, "-");


              return (

                <div
                  className="related-incident-item"
                  key={incidentKey}
                >

                  {/* Incident information */}

                  <div>

                    <strong>
                      {
                        incident?.incident_number ||
                        "Incident N/A"
                      }
                    </strong>

                    <span>
                      {
                        incident?.title ||
                        "Untitled Incident"
                      }
                    </span>

                  </div>


                  {/* Priority + Status */}

                  <div className="related-incident-meta">

                    <span>
                      {
                        incident?.priority ||
                        "N/A"
                      }
                    </span>

                    <span
                      className={
                        `related-status ${statusClass}`
                      }
                    >
                      {
                        incident?.status ||
                        "Unknown"
                      }
                    </span>

                  </div>

                </div>

              );
            }
          )}

        </div>

      )}

    </div>
  );
}


export default RelatedIncidents;