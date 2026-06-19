import pandas as pd
from database import get_db_engine

def get_sparsity_stats():
    engine = get_db_engine()
    
    # Load data into DataFrames
    users_df = pd.read_sql("SELECT id FROM users", engine)
    movies_df = pd.read_sql("SELECT id FROM movies", engine)
    ratings_df = pd.read_sql("SELECT user_id, movie_id, rating FROM ratings", engine)
    
    num_users = len(users_df)
    num_movies = len(movies_df)
    num_ratings = len(ratings_df)
    
    possible_ratings = num_users * num_movies
    sparsity = 1 - (num_ratings / possible_ratings)
    
    # Format rating distribution for Recharts
    dist = ratings_df['rating'].value_counts().sort_index().to_dict()
    rating_dist = [{"rating": float(r), "count": int(c)} for r, c in dist.items()]
    
    stats = {
        "total_users": num_users,
        "total_movies": num_movies,
        "total_ratings": num_ratings,
        "sparsity": sparsity,
        "rating_distribution": rating_dist
    }
    
    return stats

if __name__ == "__main__":
    stats = get_sparsity_stats()
    print("MovieLens 100k Statistics:")
    print(f"Users: {stats['total_users']}")
    print(f"Movies: {stats['total_movies']}")
    print(f"Ratings: {stats['total_ratings']}")
    print(f"Sparsity: {stats['sparsity']:.4f}")
    print(f"Rating Distribution: {stats['rating_distribution']}")
