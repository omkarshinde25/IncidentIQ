function IncidentTable({ incidents = [] }) {
  if (!Array.isArray(incidents) || incidents.length === 0) {
    return (
      <div className="empty-state">
        <h3>No incidents found</h3>
        <p>Create a new incident to display it here.</p>
      </div>
    );
  }

  return (
    <div className="incident-table-container">
      <table className="incident-table">
        <thead>
          <tr>
            <th>Incident ID</th>
            <th>Title</th>
            <th>Category</th>
            <th>Severity</th>
            <th>Status</th>
            <th>Root Cause</th>
          </tr>
        </thead>

        <tbody>
          {incidents.map((incident, index) => {
            const incidentId =
              incident.incident_id ||
              incident.id ||
              `INC-${String(index + 1).padStart(4, "0")}`;

            return (
              <tr key={incidentId}>
                <td>{incidentId}</td>
                <td>{incident.title || "Not available"}</td>
                <td>{incident.category || "Uncategorized"}</td>

                <td>
                  <span
                    className={`severity-badge severity-${String(
                      incident.severity || "unknown"
                    ).toLowerCase()}`}
                  >
                    {incident.severity || "Unknown"}
                  </span>
                </td>

                <td>
                  <span
                    className={`status-badge status-${String(
                      incident.status || "unknown"
                    )
                      .toLowerCase()
                      .replaceAll(" ", "-")}`}
                  >
                    {incident.status || "Unknown"}
                  </span>
                </td>

                <td>
                  {incident.root_cause ||
                    incident.predicted_root_cause ||
                    "Not identified"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default IncidentTable;