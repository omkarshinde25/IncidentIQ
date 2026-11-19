from threading import Lock
from typing import Any

import numpy as np
from sentence_transformers import SentenceTransformer


# ---------------------------------------------------------
# Embedding Model Configuration
# ---------------------------------------------------------

MODEL_NAME = (
    "sentence-transformers/"
    "all-MiniLM-L6-v2"
)

EMBEDDING_BATCH_SIZE = 64


# Load the model once when FastAPI starts.
model = SentenceTransformer(
    MODEL_NAME
)


# ---------------------------------------------------------
# In-Memory Historical Embedding Cache
# ---------------------------------------------------------

# Structure:
#
# {
#     incident_key: {
#         "text": "incident combined text",
#         "embedding": numpy_array
#     }
# }

_embedding_cache = {}

_cache_lock = Lock()


# ---------------------------------------------------------
# Safe Text Helper
# ---------------------------------------------------------

def safe_text(
    value: Any,
) -> str:
    """
    Safely convert any incident value
    into clean text.
    """

    if value is None:
        return ""

    return str(value).strip()


# ---------------------------------------------------------
# Build Incident Text
# ---------------------------------------------------------

def build_incident_text(
    incident,
) -> str:
    """
    Combine meaningful incident fields
    into one text string for embedding.
    """

    title = safe_text(
        getattr(
            incident,
            "title",
            "",
        )
    )

    description = safe_text(
        getattr(
            incident,
            "description",
            "",
        )
    )

    category = safe_text(
        getattr(
            incident,
            "category",
            "",
        )
    )

    subcategory = safe_text(
        getattr(
            incident,
            "subcategory",
            "",
        )
    )

    affected_service = safe_text(
        getattr(
            incident,
            "affected_service",
            "",
        )
    )

    parts = [
        title,
        description,
        category,
        subcategory,
        affected_service,
    ]

    clean_parts = [
        part
        for part in parts
        if part
    ]

    return " ".join(
        clean_parts
    )


# ---------------------------------------------------------
# Incident Cache Key
# ---------------------------------------------------------

def get_incident_cache_key(
    incident,
) -> str:
    """
    Create a stable cache key for an incident.
    """

    incident_id = getattr(
        incident,
        "id",
        None,
    )

    if incident_id is not None:
        return f"id:{incident_id}"

    incident_number = safe_text(
        getattr(
            incident,
            "incident_number",
            "",
        )
    )

    if incident_number:
        return (
            f"number:{incident_number}"
        )

    incident_text = build_incident_text(
        incident
    )

    return f"text:{incident_text}"


# ---------------------------------------------------------
# Generate Text Embedding
# ---------------------------------------------------------

def generate_embedding(
    text: str,
) -> np.ndarray:
    """
    Convert one text value into a normalized
    embedding vector.
    """

    clean_text = safe_text(
        text
    )

    if not clean_text:
        raise ValueError(
            "Cannot generate embedding "
            "from empty text."
        )

    embedding = model.encode(
        clean_text,
        convert_to_numpy=True,
        normalize_embeddings=True,
        show_progress_bar=False,
    )

    return np.asarray(
        embedding,
        dtype=np.float32,
    )


# ---------------------------------------------------------
# Generate Incident Embedding
# ---------------------------------------------------------

def generate_incident_embedding(
    incident,
) -> np.ndarray:
    """
    Generate an embedding for one incident.
    """

    incident_text = build_incident_text(
        incident
    )

    if not incident_text:
        raise ValueError(
            "Incident does not contain "
            "enough text to generate "
            "an embedding."
        )

    return generate_embedding(
        incident_text
    )


# ---------------------------------------------------------
# Batch Generate Embeddings
# ---------------------------------------------------------

def generate_batch_embeddings(
    texts,
) -> np.ndarray:
    """
    Generate normalized embeddings for many
    incident texts in one model call.
    """

    if not texts:
        return np.empty(
            (0, 0),
            dtype=np.float32,
        )

    embeddings = model.encode(
        texts,
        batch_size=EMBEDDING_BATCH_SIZE,
        convert_to_numpy=True,
        normalize_embeddings=True,
        show_progress_bar=False,
    )

    return np.asarray(
        embeddings,
        dtype=np.float32,
    )


# ---------------------------------------------------------
# Cosine Similarity
# ---------------------------------------------------------

def cosine_similarity(
    embedding_a: np.ndarray,
    embedding_b: np.ndarray,
) -> float:
    """
    Calculate cosine similarity between
    two embedding vectors.
    """

    vector_a = np.asarray(
        embedding_a,
        dtype=np.float32,
    )

    vector_b = np.asarray(
        embedding_b,
        dtype=np.float32,
    )

    if vector_a.shape != vector_b.shape:
        raise ValueError(
            "Embedding dimensions "
            "do not match."
        )

    norm_a = np.linalg.norm(
        vector_a
    )

    norm_b = np.linalg.norm(
        vector_b
    )

    if norm_a == 0 or norm_b == 0:
        return 0.0

    score = np.dot(
        vector_a,
        vector_b,
    ) / (
        norm_a * norm_b
    )

    score = np.clip(
        score,
        -1.0,
        1.0,
    )

    return float(
        score
    )


# ---------------------------------------------------------
# Compare Two Incidents
# ---------------------------------------------------------

def calculate_incident_similarity(
    incident_a,
    incident_b,
) -> float:
    """
    Compare two incidents semantically.
    """

    embedding_a = (
        generate_incident_embedding(
            incident_a
        )
    )

    embedding_b = (
        generate_incident_embedding(
            incident_b
        )
    )

    return cosine_similarity(
        embedding_a,
        embedding_b,
    )


# ---------------------------------------------------------
# Prepare Historical Embeddings
# ---------------------------------------------------------

def prepare_historical_embeddings(
    historical_incidents,
):
    """
    Return incidents and their cached embeddings.

    Only new incidents or incidents whose text
    changed are encoded again.
    """

    valid_records = []

    active_keys = set()

    missing_keys = []
    missing_texts = []


    # Build incident text and identify cache misses.
    for incident in historical_incidents:

        incident_text = (
            build_incident_text(
                incident
            )
        )

        if not incident_text:
            continue

        cache_key = (
            get_incident_cache_key(
                incident
            )
        )

        active_keys.add(
            cache_key
        )

        valid_records.append(
            {
                "key": cache_key,
                "text": incident_text,
                "incident": incident,
            }
        )


    with _cache_lock:

        for record in valid_records:

            cache_key = record["key"]

            incident_text = (
                record["text"]
            )

            cached_item = (
                _embedding_cache.get(
                    cache_key
                )
            )

            # Encode when:
            # 1. Incident is not in cache.
            # 2. Incident text changed.
            if (
                cached_item is None
                or cached_item["text"]
                != incident_text
            ):
                missing_keys.append(
                    cache_key
                )

                missing_texts.append(
                    incident_text
                )


        # Generate all missing embeddings
        # in one batch call.
        if missing_texts:

            new_embeddings = (
                generate_batch_embeddings(
                    missing_texts
                )
            )

            for (
                cache_key,
                incident_text,
                embedding,
            ) in zip(
                missing_keys,
                missing_texts,
                new_embeddings,
            ):
                _embedding_cache[
                    cache_key
                ] = {
                    "text": incident_text,
                    "embedding": embedding,
                }


        # Remove cache entries for incidents
        # no longer present in the database list.
        stale_keys = [
            cache_key
            for cache_key
            in _embedding_cache
            if cache_key not in active_keys
        ]

        for cache_key in stale_keys:
            del _embedding_cache[
                cache_key
            ]


        incidents = []

        embeddings = []

        for record in valid_records:

            cached_item = (
                _embedding_cache.get(
                    record["key"]
                )
            )

            if cached_item is None:
                continue

            incidents.append(
                record["incident"]
            )

            embeddings.append(
                cached_item["embedding"]
            )


    if not embeddings:
        return (
            [],
            np.empty(
                (0, 0),
                dtype=np.float32,
            ),
        )


    embedding_matrix = np.vstack(
        embeddings
    ).astype(
        np.float32
    )


    return (
        incidents,
        embedding_matrix,
    )


# ---------------------------------------------------------
# Find Similar Incidents
# ---------------------------------------------------------

def find_similar_incidents(
    target_incident,
    historical_incidents,
    top_k: int = 5,
    min_similarity: float = 0.50,
):
    """
    Find semantically similar historical
    incidents using cached normalized
    embeddings and vectorized similarity.
    """

    if target_incident is None:
        raise ValueError(
            "Target incident is required."
        )

    if not historical_incidents:
        return []

    if top_k < 1:
        raise ValueError(
            "top_k must be at least 1."
        )

    if (
        min_similarity < 0.0
        or min_similarity > 1.0
    ):
        raise ValueError(
            "min_similarity must be "
            "between 0.0 and 1.0."
        )


    # Generate only one target embedding.
    target_embedding = (
        generate_incident_embedding(
            target_incident
        )
    )


    # Get cached historical embeddings.
    (
        valid_incidents,
        historical_matrix,
    ) = prepare_historical_embeddings(
        historical_incidents
    )


    if (
        len(valid_incidents) == 0
        or historical_matrix.size == 0
    ):
        return []


    # Embeddings are normalized, so matrix
    # multiplication produces cosine scores.
    similarity_scores = (
        historical_matrix
        @ target_embedding
    )


    target_id = getattr(
        target_incident,
        "id",
        None,
    )


    # Sort highest score first.
    sorted_indexes = np.argsort(
        similarity_scores
    )[::-1]


    results = []


    for index in sorted_indexes:

        incident = (
            valid_incidents[
                int(index)
            ]
        )

        incident_id = getattr(
            incident,
            "id",
            None,
        )


        # Do not correlate an incident
        # with itself.
        if (
            target_id is not None
            and incident_id == target_id
        ):
            continue


        similarity = float(
            similarity_scores[
                int(index)
            ]
        )


        similarity = float(
            np.clip(
                similarity,
                -1.0,
                1.0,
            )
        )


        if similarity < min_similarity:
            continue


        result = {
            "id": incident_id,

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

            "category": getattr(
                incident,
                "category",
                None,
            ),

            "subcategory": getattr(
                incident,
                "subcategory",
                None,
            ),

            "affected_service": getattr(
                incident,
                "affected_service",
                None,
            ),

            "priority": getattr(
                incident,
                "priority",
                None,
            ),

            "status": getattr(
                incident,
                "status",
                None,
            ),

            "root_cause": getattr(
                incident,
                "root_cause",
                None,
            ),

            "resolution": getattr(
                incident,
                "resolution",
                None,
            ),

            "similarity_score": round(
                similarity,
                4,
            ),

            "similarity_percentage": round(
                similarity * 100,
                2,
            ),
        }


        results.append(
            result
        )


        # Stop as soon as Top K matches
        # have been collected.
        if len(results) >= top_k:
            break


    return results


# ---------------------------------------------------------
# Cache Information
# ---------------------------------------------------------

def get_embedding_cache_size() -> int:
    """
    Return the number of historical incident
    embeddings currently cached.
    """

    with _cache_lock:
        return len(
            _embedding_cache
        )


# ---------------------------------------------------------
# Clear Cache
# ---------------------------------------------------------

def clear_embedding_cache():
    """
    Manually clear all cached embeddings.
    """

    with _cache_lock:
        _embedding_cache.clear()