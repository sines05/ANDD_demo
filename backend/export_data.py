import os
import json
import sqlite3
import pandas as pd
import numpy as np

# Path configurations
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, 'movielens.db')
OUTPUT_DIR = os.path.join(BASE_DIR, '..', 'frontend', 'public', 'data')

os.makedirs(OUTPUT_DIR, exist_ok=True)

conn = sqlite3.connect(DB_PATH)

# 1. Load ratings
print("Loading ratings...")
ratings_df = pd.read_sql("SELECT user_id, movie_id, rating, timestamp FROM ratings", conn)

# Compute support and weights
supp = ratings_df.groupby("movie_id").size()
movie_weights = 1.0 / np.log(supp + 1)

# 2. Load movies
print("Loading movies...")
movies_df = pd.read_sql("SELECT id, title, release_date FROM movies", conn)

movies_list = []
for _, row in movies_df.iterrows():
    m_id = int(row['id'])
    m_supp = int(supp.get(m_id, 0))
    m_wt = float(movie_weights.get(m_id, 0.0))
    movies_list.append({
        "id": m_id,
        "title": str(row['title']),
        "release_date": str(row['release_date']),
        "support": m_supp,
        "weight": round(m_wt, 4)
    })

# Write movies.json
print("Writing movies.json...")
with open(os.path.join(OUTPUT_DIR, 'movies.json'), 'w', encoding='utf-8') as f:
    json.dump(movies_list, f, ensure_ascii=False)

# 3. Group ratings by movie_id
print("Grouping ratings by movie_id...")
movie_ratings = {}
for m_id, group in ratings_df.groupby("movie_id"):
    movie_ratings[int(m_id)] = group[['user_id', 'rating', 'timestamp']].values.tolist()

# Write movie_ratings.json
print("Writing movie_ratings.json...")
with open(os.path.join(OUTPUT_DIR, 'movie_ratings.json'), 'w', encoding='utf-8') as f:
    json.dump(movie_ratings, f, ensure_ascii=False)

print("Export complete!")
print(f"Movies count: {len(movies_list)}")
print(f"Movie ratings count: {len(movie_ratings)}")
