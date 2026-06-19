import os
import requests
import zipfile
import pandas as pd
from database import init_db, get_db_engine, User, Movie, Rating
from sqlalchemy.orm import sessionmaker

MOVIELENS_URL = "https://files.grouplens.org/datasets/movielens/ml-100k.zip"
DATA_DIR = "ml-100k-data"
ZIP_FILE = "ml-100k.zip"

def download_data():
    if not os.path.exists(ZIP_FILE):
        print(f"Downloading {MOVIELENS_URL}...")
        response = requests.get(MOVIELENS_URL)
        with open(ZIP_FILE, "wb") as f:
            f.write(response.content)
    
    if not os.path.exists(DATA_DIR):
        print(f"Extracting {ZIP_FILE}...")
        with zipfile.ZipFile(ZIP_FILE, 'r') as zip_ref:
            zip_ref.extractall(DATA_DIR)

def load_to_db():
    engine = get_db_engine()
    init_db()
    
    base_path = os.path.join(DATA_DIR, "ml-100k")
    
    # Load Users
    print("Loading users...")
    u_cols = ['user_id', 'age', 'gender', 'occupation', 'zip_code']
    users = pd.read_csv(os.path.join(base_path, 'u.user'), sep='|', names=u_cols, encoding='latin-1')
    users.rename(columns={'user_id': 'id'}, inplace=True)
    users.to_sql('users', engine, if_exists='replace', index=False)
    
    # Load Movies
    print("Loading movies...")
    m_cols = ['movie_id', 'title', 'release_date', 'video_release_date', 'imdb_url'] + [f'genre_{i}' for i in range(19)]
    movies = pd.read_csv(os.path.join(base_path, 'u.item'), sep='|', names=m_cols, encoding='latin-1')
    movies_subset = movies[['movie_id', 'title', 'release_date']]
    movies_subset.rename(columns={'movie_id': 'id'}, inplace=True)
    movies_subset.to_sql('movies', engine, if_exists='replace', index=False)
    
    # Load Ratings
    print("Loading ratings...")
    r_cols = ['user_id', 'movie_id', 'rating', 'timestamp']
    ratings = pd.read_csv(os.path.join(base_path, 'u.data'), sep='\t', names=r_cols, encoding='latin-1')
    ratings.to_sql('ratings', engine, if_exists='replace', index=False)
    
    print("Data loading complete.")

if __name__ == "__main__":
    download_data()
    load_to_db()
