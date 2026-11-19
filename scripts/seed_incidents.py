import csv
import os

from app import crud, models, schemas
from app.database import SessionLocal


# ------------------------------------------------
# CSV Path
# ------------------------------------------------

CSV_PATH = os.path.join(
    "data",
    "IncidentIQ_1500_Realistic_Incidents.csv",
)


# ------------------------------------------------
# Seed Incidents
# ------------------------------------------------

def seed_incidents():

    # Check CSV exists
    if not os.path.exists(CSV_PATH):
        print(
            f"CSV file not found: {CSV_PATH}"
        )
        return

    db = SessionLocal()

    created_count = 0
    skipped_count = 0

    try:

        print(
            "Loading IncidentIQ demo incidents..."
        )

        print(
            f"CSV: {CSV_PATH}"
        )

        print(
            "--------------------------------"
        )

        with open(
            CSV_PATH,
            mode="r",
            encoding="utf-8-sig",
            newline="",
        ) as csv_file:

            reader = csv.DictReader(
                csv_file
            )

            for row in reader:

                title = row["title"].strip()

                description = (
                    row["description"].strip()
                )


                # --------------------------------
                # Duplicate Protection
                # --------------------------------

                existing_incident = (
                    db.query(models.Incident)
                    .filter(
                        models.Incident.title
                        == title
                    )
                    .filter(
                        models.Incident.description
                        == description
                    )
                    .first()
                )


                if existing_incident:

                    skipped_count += 1

                    print(
                        f"Skipped duplicate: "
                        f"{existing_incident.incident_number} "
                        f"- {title}"
                    )

                    continue


                # --------------------------------
                # Prepare Incident
                # --------------------------------

                incident = schemas.IncidentCreate(

                    title=title,

                    description=description,

                    category=(
                        row["category"].strip()
                    ),

                    subcategory=(
                        row["subcategory"].strip()
                        or None
                    ),

                    affected_service=(
                        row[
                            "affected_service"
                        ].strip()
                    ),

                    priority=(
                        row["priority"].strip()
                    ),

                    status=(
                        row["status"].strip()
                    ),

                    root_cause=(
                        row["root_cause"].strip()
                        or None
                    ),

                    resolution=(
                        row["resolution"].strip()
                        or None
                    ),
                )


                # --------------------------------
                # Create Incident
                # Incident number generated
                # automatically by CRUD
                # --------------------------------

                created_incident = (
                    crud.create_incident(
                        db=db,
                        incident=incident,
                    )
                )

                created_count += 1


                print(
                    f"Created: "
                    f"{created_incident.incident_number} "
                    f"- {created_incident.title}"
                )


        # ----------------------------------------
        # Final Result
        # ----------------------------------------

        print()

        print(
            "================================"
        )

        print(
            "INCIDENTIQ SEEDING COMPLETE"
        )

        print(
            "================================"
        )

        print(
            f"Created incidents: "
            f"{created_count}"
        )

        print(
            f"Skipped duplicates: "
            f"{skipped_count}"
        )

        print(
            f"Processed total: "
            f"{created_count + skipped_count}"
        )

        print(
            "================================"
        )


    except Exception as error:

        db.rollback()

        print()

        print(
            "Incident seeding failed."
        )

        print(
            f"Error: {error}"
        )

        raise


    finally:

        db.close()


# ------------------------------------------------
# Run Script
# ------------------------------------------------

if __name__ == "__main__":

    seed_incidents()