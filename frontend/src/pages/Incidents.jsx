import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getIncidents,
  getDashboardSummary,
} from "../services/api";


const PAGE_SIZE = 50;


function Incidents() {
  const [incidents, setIncidents] =
    useState([]);

  const [totalIncidents, setTotalIncidents] =
    useState(0);

  const [currentPage, setCurrentPage] =
    useState(1);

  const [search, setSearch] =
    useState("");

  const [priority, setPriority] =
    useState("All");

  const [status, setStatus] =
    useState("All");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  // ------------------------------------------------
  // Pagination Calculations
  // ------------------------------------------------

  const totalPages = Math.max(
    1,
    Math.ceil(
      totalIncidents / PAGE_SIZE
    )
  );

  const skip =
    (currentPage - 1) * PAGE_SIZE;


  // ------------------------------------------------
  // Load Incidents
  // ------------------------------------------------

  const loadIncidents = async () => {
    setLoading(true);
    setError("");

    try {
      const [
        incidentsData,
        summaryData,
      ] = await Promise.all([
        getIncidents(
          skip,
          PAGE_SIZE
        ),

        getDashboardSummary(),
      ]);


      if (Array.isArray(incidentsData)) {
        setIncidents(
          incidentsData
        );

      } else if (
        Array.isArray(
          incidentsData?.incidents
        )
      ) {
        setIncidents(
          incidentsData.incidents
        );

      } else {
        setIncidents([]);
      }


      setTotalIncidents(
        Number(
          summaryData?.total_incidents ||
          0
        )
      );

    } catch (err) {
      console.error(
        "Load incidents error:",
        err
      );

      setError(
        err?.message ||
          "Unable to load incidents. Please check the backend API."
      );

      setIncidents([]);

    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadIncidents();
  }, [currentPage]);


  // ------------------------------------------------
  // Filter Current Page
  // ------------------------------------------------

  const filteredIncidents =
    useMemo(() => {
      const searchText =
        search
          .toLowerCase()
          .trim();

      return incidents.filter(
        (incident) => {
          const incidentNumber =
            String(
              incident?.incident_number ||
              ""
            ).toLowerCase();

          const title =
            String(
              incident?.title || ""
            ).toLowerCase();

          const category =
            String(
              incident?.category || ""
            ).toLowerCase();

          const affectedService =
            String(
              incident?.affected_service ||
              ""
            ).toLowerCase();

          const incidentPriority =
            String(
              incident?.priority || ""
            );

          const incidentStatus =
            String(
              incident?.status || ""
            );


          const matchesSearch =
            !searchText ||
            incidentNumber.includes(
              searchText
            ) ||
            title.includes(
              searchText
            ) ||
            category.includes(
              searchText
            ) ||
            affectedService.includes(
              searchText
            );


          const matchesPriority =
            priority === "All" ||
            incidentPriority
              .toLowerCase() ===
            priority.toLowerCase();


          const matchesStatus =
            status === "All" ||
            incidentStatus
              .toLowerCase() ===
            status.toLowerCase();


          return (
            matchesSearch &&
            matchesPriority &&
            matchesStatus
          );
        }
      );

    }, [
      incidents,
      search,
      priority,
      status,
    ]);


  // ------------------------------------------------
  // Reset Filters
  // ------------------------------------------------

  const resetFilters = () => {
    setSearch("");
    setPriority("All");
    setStatus("All");
  };


  // ------------------------------------------------
  // CSS Helpers
  // ------------------------------------------------

  const getPriorityClass = (
    value = ""
  ) => {
    return String(value)
      .toLowerCase()
      .replace(/\s+/g, "-");
  };


  const getStatusClass = (
    value = ""
  ) => {
    return String(value)
      .toLowerCase()
      .replace(/\s+/g, "-");
  };


  // ------------------------------------------------
  // Pagination Actions
  // ------------------------------------------------

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(
        currentPage - 1
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };


  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(
        currentPage + 1
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };


  const goToPage = (pageNumber) => {
    if (
      pageNumber >= 1 &&
      pageNumber <= totalPages
    ) {
      setCurrentPage(
        pageNumber
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };


  // ------------------------------------------------
  // Visible Page Numbers
  // ------------------------------------------------

  const getVisiblePages = () => {
    const pages = [];

    const startPage = Math.max(
      1,
      currentPage - 2
    );

    const endPage = Math.min(
      totalPages,
      currentPage + 2
    );

    for (
      let page = startPage;
      page <= endPage;
      page += 1
    ) {
      pages.push(page);
    }

    return pages;
  };


  // ------------------------------------------------
  // Record Range
  // ------------------------------------------------

  const firstRecord =
    totalIncidents === 0
      ? 0
      : skip + 1;

  const lastRecord = Math.min(
    skip + incidents.length,
    totalIncidents
  );


  // ------------------------------------------------
  // Loading
  // ------------------------------------------------

  if (
    loading &&
    incidents.length === 0
  ) {
    return (
      <div className="incidents-page">

        <div className="panel coming-soon">

          <h2>
            Loading Incidents...
          </h2>

          <p>
            Retrieving incidents from
            IncidentIQ.
          </p>

        </div>

      </div>
    );
  }


  // ------------------------------------------------
  // UI
  // ------------------------------------------------

  return (
    <div className="incidents-page">

      <div className="panel">

        {/* ====================================== */}
        {/* Header */}
        {/* ====================================== */}

        <div className="panel-header">

          <div>

            <span className="section-eyebrow">
              INCIDENT MANAGEMENT
            </span>

            <h3>
              All Incidents
            </h3>

            <p>
              Search, filter and review
              incidents stored in IncidentIQ.
            </p>

          </div>


          <button
            type="button"
            className="secondary-button"
            onClick={loadIncidents}
            disabled={loading}
          >
            {loading
              ? "Refreshing..."
              : "Refresh"}
          </button>

        </div>


        {/* ====================================== */}
        {/* Error */}
        {/* ====================================== */}

        {error && (

          <div className="form-message error">

            <strong>
              Unable to load incidents.
            </strong>

            <div>
              {error}
            </div>

            <button
              type="button"
              className="secondary-button"
              onClick={loadIncidents}
            >
              Try Again
            </button>

          </div>

        )}


        {!error && (
          <>

            {/* ================================== */}
            {/* Filters */}
            {/* ================================== */}

            <div className="incident-filters">

              <input
                type="text"
                placeholder="Search this page by incident, title, category or service..."
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                autoComplete="off"
              />


              <select
                value={priority}
                onChange={(event) =>
                  setPriority(
                    event.target.value
                  )
                }
              >

                <option value="All">
                  All Priorities
                </option>

                <option value="P1">
                  P1
                </option>

                <option value="P2">
                  P2
                </option>

                <option value="P3">
                  P3
                </option>

                <option value="P4">
                  P4
                </option>

              </select>


              <select
                value={status}
                onChange={(event) =>
                  setStatus(
                    event.target.value
                  )
                }
              >

                <option value="All">
                  All Statuses
                </option>

                <option value="Open">
                  Open
                </option>

                <option value="Investigating">
                  Investigating
                </option>

                <option value="Resolved">
                  Resolved
                </option>

                <option value="Closed">
                  Closed
                </option>

              </select>


              <button
                type="button"
                className="secondary-button"
                onClick={resetFilters}
              >
                Reset Filters
              </button>

            </div>


            {/* ================================== */}
            {/* Summary */}
            {/* ================================== */}

            <div className="incidents-summary">

              <span>
                Showing{" "}
                <strong>
                  {firstRecord}
                </strong>
                {" - "}
                <strong>
                  {lastRecord}
                </strong>
                {" of "}
                <strong>
                  {totalIncidents}
                </strong>
                {" incidents"}
              </span>


              <span>
                Page{" "}
                <strong>
                  {currentPage}
                </strong>
                {" of "}
                <strong>
                  {totalPages}
                </strong>
              </span>


              {(search ||
                priority !== "All" ||
                status !== "All") && (

                <span>
                  <strong>
                    {
                      filteredIncidents.length
                    }
                  </strong>
                  {" matches on this page"}
                </span>

              )}

            </div>


            {/* ================================== */}
            {/* Incident Table */}
            {/* ================================== */}

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


              {filteredIncidents.length === 0 ? (

                <div className="empty-incidents">

                  <h4>
                    No incidents found
                  </h4>

                  <p>
                    No incidents on this page
                    match the selected filters.
                  </p>

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={resetFilters}
                  >
                    Clear Filters
                  </button>

                </div>

              ) : (

                filteredIncidents.map(
                  (incident, index) => {
                    const incidentKey =
                      incident?.id ||
                      incident?.incident_number ||
                      `incident-${index}`;

                    return (
                      <div
                        className="incident-row"
                        key={incidentKey}
                      >

                        <div className="incident-name">

                          <strong>
                            {
                              incident
                                ?.incident_number ||
                              "Incident N/A"
                            }
                          </strong>

                          <span>
                            {
                              incident?.title ||
                              "Untitled Incident"
                            }
                          </span>

                          <small>
                            {
                              incident
                                ?.affected_service ||
                              "Service not specified"
                            }
                          </small>

                        </div>


                        <span>
                          {
                            incident?.category ||
                            "Uncategorized"
                          }
                        </span>


                        <span
                          className={
                            `priority-badge ${
                              getPriorityClass(
                                incident?.priority
                              )
                            }`
                          }
                        >
                          {
                            incident?.priority ||
                            "N/A"
                          }
                        </span>


                        <span
                          className={
                            `status-badge ${
                              getStatusClass(
                                incident?.status
                              )
                            }`
                          }
                        >
                          {
                            incident?.status ||
                            "Unknown"
                          }
                        </span>

                      </div>
                    );
                  }
                )

              )}

            </div>


            {/* ================================== */}
            {/* Pagination */}
            {/* ================================== */}

            <div className="incidents-pagination">

              <button
                type="button"
                className="pagination-button"
                onClick={goToPreviousPage}
                disabled={
                  currentPage === 1 ||
                  loading
                }
              >
                Previous
              </button>


              <div className="pagination-pages">

                {getVisiblePages().map(
                  (pageNumber) => (

                    <button
                      type="button"
                      key={pageNumber}
                      className={
                        pageNumber ===
                        currentPage
                          ? "pagination-number active"
                          : "pagination-number"
                      }
                      onClick={() =>
                        goToPage(
                          pageNumber
                        )
                      }
                      disabled={loading}
                    >
                      {pageNumber}
                    </button>

                  )
                )}

              </div>


              <button
                type="button"
                className="pagination-button"
                onClick={goToNextPage}
                disabled={
                  currentPage ===
                    totalPages ||
                  loading
                }
              >
                Next
              </button>

            </div>

          </>
        )}

      </div>

    </div>
  );
}


export default Incidents;