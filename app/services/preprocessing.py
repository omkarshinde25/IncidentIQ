from collections import Counter, defaultdict


# ---------------------------------------------------------
# Normalize text values
# ---------------------------------------------------------

def safe_value(value, default="Unknown"):
    """
    Return a clean string value.
    """
    if value is None:
        return default

    value = str(value).strip()

    return value if value else default


# ---------------------------------------------------------
# Determine problem-candidate level
# ---------------------------------------------------------

def get_problem_level(
    incident_count: int,
) -> str:
    """
    Convert recurring incident count into a
    simple problem-candidate level.

    These are prototype thresholds and can
    be tuned later.
    """

    if incident_count >= 10:
        return "Critical"

    if incident_count >= 5:
        return "High"

    if incident_count >= 3:
        return "Medium"

    return "Low"


# ---------------------------------------------------------
# Detect recurring patterns
# ---------------------------------------------------------

def detect_recurring_patterns(
    incidents,
    minimum_count: int = 2,
):
    """
    Detect recurring incident patterns using:

    - Category
    - Subcategory
    - Affected service

    The function also identifies recurring
    patterns that may require Problem Management.
    """

    if not incidents:
        return {
            "total_incidents": 0,
            "total_patterns": 0,
            "problem_candidates": 0,
            "recurring_patterns": [],
            "category_summary": {},
            "service_summary": {},
        }

    if minimum_count < 1:
        minimum_count = 1


    # -----------------------------------------------------
    # Counters
    # -----------------------------------------------------

    category_counter = Counter()
    service_counter = Counter()
    pattern_counter = Counter()

    pattern_incidents = defaultdict(
        list
    )

    priority_counter = defaultdict(
        Counter
    )

    status_counter = defaultdict(
        Counter
    )


    # -----------------------------------------------------
    # Process incidents
    # -----------------------------------------------------

    for incident in incidents:

        category = safe_value(
            getattr(
                incident,
                "category",
                None,
            )
        )

        subcategory = safe_value(
            getattr(
                incident,
                "subcategory",
                None,
            )
        )

        service = safe_value(
            getattr(
                incident,
                "affected_service",
                None,
            )
        )

        priority = safe_value(
            getattr(
                incident,
                "priority",
                None,
            )
        )

        status = safe_value(
            getattr(
                incident,
                "status",
                None,
            )
        )


        # Summary counters

        category_counter[
            category
        ] += 1

        service_counter[
            service
        ] += 1


        # Pattern key

        pattern_key = (
            category,
            subcategory,
            service,
        )

        pattern_counter[
            pattern_key
        ] += 1


        # Priority distribution

        priority_counter[
            pattern_key
        ][priority] += 1


        # Status distribution

        status_counter[
            pattern_key
        ][status] += 1


        # Store related incident information

        pattern_incidents[
            pattern_key
        ].append(
            {
                "id": getattr(
                    incident,
                    "id",
                    None,
                ),

                "incident_number": getattr(
                    incident,
                    "incident_number",
                    None,
                ),

                "title": getattr(
                    incident,
                    "title",
                    None,
                ),

                "priority": priority,

                "status": status,
            }
        )


    # -----------------------------------------------------
    # Build recurring patterns
    # -----------------------------------------------------

    recurring_patterns = []

    for (
        pattern,
        count,
    ) in pattern_counter.items():

        if count < minimum_count:
            continue

        (
            category,
            subcategory,
            service,
        ) = pattern


        # ---------------------------------------------
        # Most common priority
        # ---------------------------------------------

        common_priority = (
            priority_counter[
                pattern
            ].most_common(1)
        )

        dominant_priority = (
            common_priority[0][0]
            if common_priority
            else "Unknown"
        )


        # ---------------------------------------------
        # Open / unresolved count
        # ---------------------------------------------

        statuses = status_counter[
            pattern
        ]

        open_count = (
            statuses.get(
                "Open",
                0,
            )
            +
            statuses.get(
                "Investigating",
                0,
            )
        )


        resolved_count = (
            statuses.get(
                "Resolved",
                0,
            )
            +
            statuses.get(
                "Closed",
                0,
            )
        )


        # ---------------------------------------------
        # Problem candidate
        # ---------------------------------------------

        is_problem_candidate = (
            count >= 3
        )

        problem_level = (
            get_problem_level(
                count
            )
            if is_problem_candidate
            else "Monitoring"
        )


        # ---------------------------------------------
        # Recommendation
        # ---------------------------------------------

        if is_problem_candidate:

            recommendation = (
                f"{count} similar incidents "
                f"were detected for "
                f"{service}. Consider creating "
                "a Problem Management investigation "
                "to identify and remove the "
                "underlying recurring cause."
            )

        else:

            recommendation = (
                "Continue monitoring this pattern. "
                "The current recurrence count is "
                "below the prototype Problem "
                "Candidate threshold."
            )


        # ---------------------------------------------
        # Human readable pattern
        # ---------------------------------------------

        pattern_name = (
            f"{category} - "
            f"{subcategory}"
        )


        recurring_patterns.append(
            {
                "pattern_name":
                    pattern_name,

                "category":
                    category,

                "subcategory":
                    subcategory,

                "affected_service":
                    service,

                "incident_count":
                    count,

                "dominant_priority":
                    dominant_priority,

                "open_incidents":
                    open_count,

                "resolved_incidents":
                    resolved_count,

                "problem_candidate":
                    is_problem_candidate,

                "problem_level":
                    problem_level,

                "recommendation":
                    recommendation,

                "related_incidents":
                    pattern_incidents[
                        pattern
                    ],
            }
        )


    # -----------------------------------------------------
    # Sort highest recurring patterns first
    # -----------------------------------------------------

    recurring_patterns.sort(
        key=lambda item: (
            item[
                "incident_count"
            ]
        ),
        reverse=True,
    )


    # -----------------------------------------------------
    # Count problem candidates
    # -----------------------------------------------------

    problem_candidate_count = sum(
        1
        for pattern
        in recurring_patterns
        if pattern[
            "problem_candidate"
        ]
    )


    # -----------------------------------------------------
    # Final response
    # -----------------------------------------------------

    return {
        "total_incidents":
            len(incidents),

        "total_patterns":
            len(
                recurring_patterns
            ),

        "problem_candidates":
            problem_candidate_count,

        "recurring_patterns":
            recurring_patterns,

        "category_summary":
            dict(
                category_counter
                .most_common()
            ),

        "service_summary":
            dict(
                service_counter
                .most_common()
            ),
    }