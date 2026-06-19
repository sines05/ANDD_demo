import pandas as pd
import numpy as np
from database import get_db_engine


class AttackEngine:
    """
    Cài đặt thuật toán giải ẩn danh Scoreboard-RH của Narayanan & Shmatikov
    ("Robust De-anonymization of Large Sparse Datasets", 2008) trên tập
    MovieLens 100k.

    Hàm cho điểm theo đúng công thức trong bài báo (mục 5):

        Score(aux, r') = sum_{i in supp(aux)} wt(i) * (
                            exp(-|rho_i - rho'_i| / rho_0)
                          + exp(-|d_i  - d'_i | / d_0)
                         )

    với trong so wt(i) = 1 / log(|supp(i)|) (phim cang it nguoi xem cang nang).
    Tieu chi nhan dang (eccentricity):

        ecc = (max1 - max2) / sigma  > phi  thi ket luan dinh danh duoc.
    """

    def __init__(self):
        self.engine = get_db_engine()
        self.ratings_df = None
        self.movie_weights = None
        self.load_data()

    def load_data(self):
        """Nạp toàn bộ ratings vào RAM và tính sẵn trọng số mỗi phim."""
        print("Loading ratings data into memory...")
        self.ratings_df = pd.read_sql(
            "SELECT user_id, movie_id, rating, timestamp FROM ratings", self.engine
        )

        # wt(i) = 1 / log(|supp(i)|); supp(i) = số người đã xem phim i.
        # Dùng log(supp + 1) để ổn định số học (tránh chia cho log(1) = 0).
        supp = self.ratings_df.groupby("movie_id").size()
        self.movie_supp = supp
        self.movie_weights = 1.0 / np.log(supp + 1)
        print(f"Loaded {len(self.ratings_df)} ratings for {len(supp)} movies.")

    def get_movie_weight(self, movie_id):
        """Trả về (support, weight) của một phim để hiển thị trên giao diện."""
        s = int(self.movie_supp.get(movie_id, 0))
        w = float(self.movie_weights.get(movie_id, 0.0))
        return s, w

    def run_attack(self, known_ratings, rho_0=1.5, d_0=30 * 24 * 3600,
                   phi=1.5, use_dates=True):
        """
        Thực thi tấn công giải ẩn danh.

        known_ratings: list dict [{'movie_id', 'rating', 'timestamp'}]
        rho_0:   hệ số co giãn về rating (paper dùng 1.5)
        d_0:     hệ số co giãn về thời gian, đơn vị giây (paper dùng 30 ngày)
        phi:     ngưỡng eccentricity (paper dùng 1.5)
        use_dates: nếu False thì bỏ hẳn thành phần ngày (kịch bản kẻ tấn công
                   chỉ biết phim + điểm, tái hiện Fig.8 của bài báo).
        """
        if not known_ratings:
            return {"error": "No known ratings provided"}

        target_movie_ids = [r["movie_id"] for r in known_ratings]
        relevant = self.ratings_df[
            self.ratings_df["movie_id"].isin(target_movie_ids)
        ].copy()

        if relevant.empty:
            return {"error": "No matching movies found in database"}

        unique_users = relevant["user_id"].unique()
        user_scores = pd.Series(0.0, index=unique_users)

        # Chuẩn hoá điểm về [0, 1] để hiển thị: mỗi phim đóng góp tối đa
        # (2*wt nếu tính ngày, ngược lại wt). Eccentricity không phụ thuộc
        # phép chuẩn hoá này (nó chia cho độ lệch chuẩn).
        denom = 0.0
        aux_weights = []

        for kr in known_ratings:
            m_id = kr["movie_id"]
            r_v = kr["rating"]
            t_v = kr.get("timestamp")
            wt = float(self.movie_weights.get(m_id, 0.0))
            aux_weights.append({"movie_id": m_id,
                                "support": int(self.movie_supp.get(m_id, 0)),
                                "weight": wt})
            if wt == 0:
                continue

            m_ratings = relevant[relevant["movie_id"] == m_id]
            if m_ratings.empty:
                continue

            # Thành phần rating: exp(-|rho - rho'| / rho_0)
            r_diff = np.abs(m_ratings["rating"] - r_v)
            sim = np.exp(-r_diff / rho_0)
            denom += wt

            # Thành phần thời gian (cộng vào, theo đúng công thức paper)
            if use_dates and t_v is not None:
                t_diff = np.abs(m_ratings["timestamp"] - t_v)
                sim = sim + np.exp(-t_diff / d_0)
                denom += wt

            temp = pd.Series((wt * sim).values, index=m_ratings["user_id"])
            user_scores = user_scores.add(temp, fill_value=0)

        if user_scores.empty or denom == 0:
            return {"error": "No scores calculated"}

        # Chuẩn hoá hiển thị
        norm_scores = user_scores / denom
        sorted_scores = norm_scores.sort_values(ascending=False)

        max_score = sorted_scores.iloc[0]
        if len(sorted_scores) > 1:
            max2_score = sorted_scores.iloc[1]
            sigma = sorted_scores.std()
            eccentricity = (max_score - max2_score) / sigma if sigma > 0 else 0.0
        else:
            eccentricity = 100.0  # Chỉ có duy nhất một ứng viên

        identified_user = None
        full_history = []
        if eccentricity > phi:
            u_id = int(sorted_scores.index[0])
            identified_user = {
                "user_id": u_id,
                "similarity": float(sorted_scores.iloc[0]),
            }
            history_query = """
                SELECT m.title, r.rating, r.timestamp
                FROM ratings r
                JOIN movies m ON r.movie_id = m.id
                WHERE r.user_id = ?
                ORDER BY r.timestamp DESC
            """
            history_df = pd.read_sql(history_query, self.engine, params=(u_id,))
            full_history = history_df.to_dict(orient="records")

        return {
            "top_candidates": [
                {"user_id": int(u_id), "similarity": float(score)}
                for u_id, score in sorted_scores.head(10).items()
            ],
            "eccentricity": float(eccentricity),
            "identified_user": identified_user,
            "full_history": full_history,
            "total_candidates": int(len(sorted_scores)),
            "aux_weights": aux_weights,
            "use_dates": bool(use_dates),
        }

    # ------------------------------------------------------------------
    # Tiện ích phục vụ kịch bản demo & thực nghiệm
    # ------------------------------------------------------------------
    def sample_aux_from_user(self, user_id, num_movies=3, rating_error=0,
                             date_error_days=0, seed=None, prefer_rare=False):
        """
        Sinh "tri thức bổ trợ" (aux) từ một người dùng có thật trong CSDL,
        có thể thêm nhiễu (sai số rating, sai số ngày) để chứng minh tính
        BỀN VỮNG của thuật toán trước thông tin không chính xác — đúng tinh
        thần Định lý 1 của bài báo.
        """
        rng = np.random.RandomState(seed)
        urows = self.ratings_df[self.ratings_df["user_id"] == user_id]
        if urows.empty:
            return []
        if prefer_rare:
            # Ưu tiên phim hiếm (ít người xem) - mạnh hơn cho định danh
            urows = urows.assign(
                _w=urows["movie_id"].map(self.movie_weights).fillna(0)
            ).sort_values("_w", ascending=False)
            picked = urows.head(num_movies)
        else:
            n = min(num_movies, len(urows))
            idx = rng.choice(len(urows), size=n, replace=False)
            picked = urows.iloc[idx]

        aux = []
        for row in picked.itertuples():
            rating = float(row.rating)
            if rating_error > 0:
                rating += rng.randint(-rating_error, rating_error + 1)
                rating = float(min(5, max(1, rating)))
            ts = int(row.timestamp)
            if date_error_days > 0:
                ts += int(rng.randint(-date_error_days, date_error_days + 1)) * 86400
            aux.append({"movie_id": int(row.movie_id),
                        "rating": rating, "timestamp": ts})
        return aux
