# IncidentIQ

IncidentIQ is an intelligent IT incident analysis platform that helps support engineers investigate incidents faster by using historical data, semantic similarity, Root Cause Analysis, Machine Learning, recommendations, and recurring pattern detection.

1. Create and Manage Incidents
Users can create incidents with title, description, category, subcategory, affected service, priority, and status. Incident numbers are generated automatically, while root cause and resolution remain empty until investigation is completed.

2. Historical Incident Dataset
The project uses more than 1,500 realistic synthetic IT incident records containing services, priorities, statuses, detailed root causes, and resolutions. This data supports correlation, RCA, ML prediction, recommendations, and pattern detection.

3. Semantic Incident Correlation
IncidentIQ uses the SentenceTransformer all-MiniLM-L6-v2 model to convert incident text into embeddings. Cosine similarity compares the new incident with historical incidents and returns the strongest matches with similarity percentages.

4. Root Cause Analysis
The RCA feature uses the strongest similar historical incidents as evidence. It shows the likely root cause, confidence level, evidence incident, historical root cause, previous resolution, and related incidents. Engineer validation is always required.

5. Recommendation System
IncidentIQ uses previous root causes and successful resolutions to suggest investigation actions. Recommendations support the engineer but do not automatically apply fixes or confirm the final root cause.

6. Machine Learning Prediction
The ML feature uses TF-IDF and Logistic Regression to predict a likely root-cause class from incident text. The trained model is stored in ml/artifacts/rca_model.joblib and returns the predicted class with confidence.

7. Recurring Pattern Detection
The system groups incidents using Category + Subcategory + Affected Service. Repeated groups are shown as recurring patterns and, based on occurrence count, may be marked as Problem Management candidates.

8. Dashboard and User Interface
The React frontend includes Dashboard, Incidents, New Incident, Correlation, RCA Analysis, ML Prediction, and Patterns pages. It supports pagination, accurate SQLite KPIs, collapsible related incidents, and Light/Dark modes.

9. Backend and APIs
The backend uses Python and FastAPI. Main APIs support health checking, creating and retrieving incidents, correlation, analysis, ML prediction, recurring patterns, and dashboard summaries. SQLAlchemy connects FastAPI with SQLite.

10. Technology Stack and Running the Project
Frontend: React.js, Vite, CSS, JavaScript
Backend: Python, FastAPI, Uvicorn, Pydantic
Database: SQLite, SQLAlchemy
AI/ML: SentenceTransformers, all-MiniLM-L6-v2, Embeddings, Cosine Similarity, NumPy, TF-IDF, Logistic Regression, scikit-learn, Joblib
Testing: Pytest and Swagger UI
