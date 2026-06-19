export class AttackEngine {
  constructor(movies, movieRatings) {
    this.movies = movies; // array of movie objects: { id, title, release_date, support, weight }
    this.movieRatings = movieRatings; // map of movie_id -> list of [user_id, rating, timestamp]
    
    // Create quick lookups
    this.movieMap = new Map(movies.map(m => [m.id, m]));
    
    // Build userRatings index: user_id -> array of { movieId, rating, timestamp }
    this.userRatings = {};
    for (const [movieIdStr, ratings] of Object.entries(movieRatings)) {
      const movieId = parseInt(movieIdStr);
      for (const [userId, rating, timestamp] of ratings) {
        if (!this.userRatings[userId]) {
          this.userRatings[userId] = [];
        }
        this.userRatings[userId].push({ movieId, rating, timestamp });
      }
    }
  }

  getMovieWeight(movieId) {
    const m = this.movieMap.get(movieId);
    if (!m) return { support: 0, weight: 0.0 };
    return { support: m.support, weight: m.weight };
  }

  runAttack(knownRatings, { rho_0 = 1.5, d_0 = 30 * 24 * 3600, phi = 1.5, useDates = true } = {}) {
    if (!knownRatings || knownRatings.length === 0) {
      return { error: "No known ratings provided" };
    }

    const userScores = {}; // userId -> score
    let denom = 0.0;
    const auxWeights = [];

    for (const kr of knownRatings) {
      const mId = kr.movie_id;
      const r_v = kr.rating;
      
      // Parse timestamp
      let t_v = null;
      if (kr.timestamp) {
        t_v = kr.timestamp;
      } else if (kr.date) {
        t_v = Math.floor(new Date(kr.date).getTime() / 1000);
      }
      
      const m = this.movieMap.get(mId);
      const wt = m ? m.weight : 0.0;
      const support = m ? m.support : 0;
      
      auxWeights.push({
        movie_id: mId,
        support: support,
        weight: wt
      });

      if (wt === 0) continue;

      const ratings = this.movieRatings[mId];
      if (!ratings || ratings.length === 0) continue;

      // Increment denom
      denom += wt;
      if (useDates && t_v !== null) {
        denom += wt;
      }

      for (const [userId, rating, timestamp] of ratings) {
        // Rating sim: exp(-|rho - rho'| / rho_0)
        const r_diff = Math.abs(rating - r_v);
        let sim = Math.exp(-r_diff / rho_0);

        // Date sim: exp(-|d - d'| / d_0)
        if (useDates && t_v !== null) {
          const t_diff = Math.abs(timestamp - t_v);
          sim += Math.exp(-t_diff / d_0);
        }

        if (!userScores[userId]) userScores[userId] = 0.0;
        userScores[userId] += wt * sim;
      }
    }

    const userIds = Object.keys(userScores);
    if (userIds.length === 0 || denom === 0) {
      return { error: "No scores calculated" };
    }

    // Normalize scores and construct sorting list
    const candidates = userIds.map(userId => {
      const uId = parseInt(userId);
      return {
        user_id: uId,
        similarity: userScores[userId] / denom
      };
    });

    // Sort descending
    candidates.sort((a, b) => b.similarity - a.similarity);

    const max_score = candidates[0].similarity;
    let eccentricity = 0.0;

    if (candidates.length > 1) {
      const max2_score = candidates[1].similarity;
      // Calculate standard deviation of scores (using N-1 sample std dev)
      const mean = candidates.reduce((sum, c) => sum + c.similarity, 0) / candidates.length;
      const variance = candidates.reduce((sum, c) => sum + Math.pow(c.similarity - mean, 2), 0) / (candidates.length - 1);
      const sigma = Math.sqrt(variance);
      eccentricity = sigma > 0 ? (max_score - max2_score) / sigma : 0.0;
    } else {
      eccentricity = 100.0; // Only one candidate
    }

    let identifiedUser = null;
    let fullHistory = [];

    if (eccentricity > phi) {
      const uId = candidates[0].user_id;
      identifiedUser = {
        user_id: uId,
        similarity: max_score
      };
      
      // Get user's ratings history and join movie titles
      const uRatings = this.userRatings[uId] || [];
      // Sort by timestamp desc
      uRatings.sort((a, b) => b.timestamp - a.timestamp);
      
      fullHistory = uRatings.map(ur => {
        const m = this.movieMap.get(ur.movieId);
        return {
          title: m ? m.title : `Movie #${ur.movieId}`,
          rating: ur.rating,
          timestamp: ur.timestamp
        };
      });
    }

    return {
      top_candidates: candidates.slice(0, 10),
      eccentricity: eccentricity,
      identified_user: identifiedUser,
      full_history: fullHistory,
      total_candidates: candidates.length,
      aux_weights: auxWeights,
      use_dates: useDates
    };
  }

  sampleAuxFromUser(userId, { numMovies = 3, ratingError = 0, dateErrorDays = 0, seed = null, preferRare = false } = {}) {
    // Basic LCG random generator for reproducibility with seed
    let rand = Math.random;
    if (seed !== null) {
      let currSeed = seed;
      rand = () => {
        const x = Math.sin(currSeed++) * 10000;
        return x - Math.floor(x);
      };
    }

    let urows = this.userRatings[userId] || [];
    if (urows.length === 0) return [];

    // Clone rows
    let rows = [...urows];

    if (preferRare) {
      // Sort by weight desc (rarer movies have higher weight)
      rows.sort((a, b) => {
        const wA = this.movieMap.get(a.movieId)?.weight || 0;
        const wB = this.movieMap.get(b.movieId)?.weight || 0;
        return wB - wA;
      });
      rows = rows.slice(0, numMovies);
    } else {
      // Random shuffle and slice
      for (let i = rows.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        [rows[i], rows[j]] = [rows[j], rows[i]];
      }
      rows = rows.slice(0, numMovies);
    }

    const aux = [];
    for (const r of rows) {
      let rating = r.rating;
      if (ratingError > 0) {
        // rating error in range [-ratingError, ratingError]
        const err = Math.floor(rand() * (ratingError * 2 + 1)) - ratingError;
        rating = Math.min(5, Math.max(1, rating + err));
      }
      
      let ts = r.timestamp;
      if (dateErrorDays > 0) {
        // date error in seconds
        const secErr = (Math.floor(rand() * (dateErrorDays * 2 + 1)) - dateErrorDays) * 86400;
        ts += secErr;
      }

      const m = this.movieMap.get(r.movieId);
      aux.push({
        movie_id: r.movieId,
        title: m ? m.title : `Movie #${r.movieId}`,
        rating: rating,
        timestamp: ts,
        date: new Date(ts * 1000).toISOString().split('T')[0],
        support: m ? m.support : 0,
        weight: m ? m.weight : 0
      });
    }

    return aux;
  }
}
