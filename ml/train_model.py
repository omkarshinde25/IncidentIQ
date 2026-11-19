import os

import joblib
import pandas as pd

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline


# ------------------------------------------------
# Paths
# ------------------------------------------------

DATA_PATH = os.path.join(
    "data",
    "incidentiq_synthetic_9600.csv"
)

MODEL_DIRECTORY = os.path.join(
    "ml",
    "artifacts"
)

MODEL_PATH = os.path.join(
    MODEL_DIRECTORY,
    "rca_model.joblib"
)


# ------------------------------------------------
# Load Dataset
# ------------------------------------------------

def load_dataset():

    print("Loading IncidentIQ CSV dataset...")

    dataframe = pd.read_csv(DATA_PATH)

    print(
        f"Total incidents: {len(dataframe)}"
    )

    return dataframe


# ------------------------------------------------
# Prepare Dataset
# ------------------------------------------------

def prepare_dataset(dataframe):

    dataframe = dataframe.fillna("")

    dataframe["incident_text"] = (
        dataframe["title"]
        + " "
        + dataframe["description"]
        + " "
        + dataframe["category"]
        + " "
        + dataframe["subcategory"]
        + " "
        + dataframe["affected_service"]
    )

    X = dataframe["incident_text"]

    y = dataframe["root_cause"]

    return X, y


# ------------------------------------------------
# Train Model
# ------------------------------------------------

def train_model():

    dataframe = load_dataset()

    X, y = prepare_dataset(
        dataframe
    )

    print(
        f"Root cause classes: {y.nunique()}"
    )

    print("\nRoot cause distribution:")

    print(
        y.value_counts()
    )

    # --------------------------------------------
    # Train/Test Split
    # --------------------------------------------

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.20,
        random_state=42,
        stratify=y
    )

    print(
        f"\nTraining records: {len(X_train)}"
    )

    print(
        f"Testing records: {len(X_test)}"
    )

    # --------------------------------------------
    # ML Pipeline
    # --------------------------------------------

    model = Pipeline(
        [
            (
                "tfidf",
                TfidfVectorizer(
                    stop_words="english",
                    ngram_range=(1, 2)
                )
            ),
            (
                "classifier",
                LogisticRegression(
                    max_iter=1000,
                    random_state=42
                )
            )
        ]
    )

    # --------------------------------------------
    # Train
    # --------------------------------------------

    print(
        "\nTraining RCA model..."
    )

    model.fit(
        X_train,
        y_train
    )

    # --------------------------------------------
    # Prediction on Test Dataset
    # --------------------------------------------

    predictions = model.predict(
        X_test
    )

    # --------------------------------------------
    # Accuracy
    # --------------------------------------------

    accuracy = accuracy_score(
        y_test,
        predictions
    )

    print("\n-----------------------------")
    print("MODEL EVALUATION")
    print("-----------------------------")

    print(
        f"Accuracy: {accuracy:.4f}"
    )

    print(
        f"Accuracy Percentage: {accuracy * 100:.2f}%"
    )

    # --------------------------------------------
    # Precision / Recall / F1
    # --------------------------------------------

    print(
        "\nClassification Report:"
    )

    print(
        classification_report(
            y_test,
            predictions
        )
    )

    # --------------------------------------------
    # Confusion Matrix
    # --------------------------------------------

    print(
        "\nConfusion Matrix:"
    )

    print(
        confusion_matrix(
            y_test,
            predictions
        )
    )

    # --------------------------------------------
    # Save Model
    # --------------------------------------------

    os.makedirs(
        MODEL_DIRECTORY,
        exist_ok=True
    )

    joblib.dump(
        model,
        MODEL_PATH
    )

    print(
        "\nRCA model saved successfully."
    )

    print(
        f"Model path: {MODEL_PATH}"
    )


# ------------------------------------------------
# Run
# ------------------------------------------------

if __name__ == "__main__":
    train_model()