from fastapi import FastAPI, Body, Query
from fastapi.middleware.cors import CORSMiddleware
from stats import get_sparsity_stats
from attack_engine import AttackEngine
from database import get_db_engine
from typing import Dict, Any
import pandas as pd

app = FastAPI(title="De-anonymization Demo API")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Attack Engine (nạp dữ liệu một lần khi khởi động)
attack_engine = AttackEngine()


@app.get("/stats")
async def get_stats():
    """Trả về thống kê tập dữ liệu: độ thưa và phân phối điểm."""
    try:
        return get_sparsity_stats()
    except Exception as e:
        return {"error": str(e)}


@app.get("/movies/search")
async def search_movies(q: str = Query(..., min_length=1)):
    """Tìm phim theo tên, kèm support và trọng số wt(i) của từng phim."""
    try:
        engine = get_db_engine()
        query = "SELECT id, title, release_date FROM movies WHERE title LIKE ? LIMIT 10"
        movies = pd.read_sql(query, engine, params=(f"%{q}%",))
        records = movies.to_dict(orient="records")
        for r in records:
            s, w = attack_engine.get_movie_weight(r["id"])
            r["support"] = s
            r["weight"] = round(w, 4)
        return records
    except Exception as e:
        return {"error": str(e)}


@app.post("/attack")
async def run_attack(
    payload: Dict[str, Any] = Body(...),
    rho_0: float = 1.5,
    d_0_days: float = 30.0,
    phi: float = 1.5,
    use_dates: bool = True,
):
    """Thực thi tấn công giải ẩn danh dựa trên tri thức bổ trợ đã biết."""
    try:
        aux_info = payload.get("aux_info", [])
        if not aux_info:
            return {"error": "No auxiliary information provided"}

        processed = []
        for item in aux_info:
            rec = {"movie_id": item["movie_id"], "rating": float(item["rating"])}
            if "date" in item and item["date"]:
                rec["timestamp"] = int(pd.to_datetime(item["date"]).timestamp())
            elif "timestamp" in item:
                rec["timestamp"] = int(item["timestamp"])
            else:
                rec["timestamp"] = 883612800  # mặc định 1998-01-01
            processed.append(rec)

        d_0 = d_0_days * 24 * 3600
        return attack_engine.run_attack(
            processed, rho_0=rho_0, d_0=d_0, phi=phi, use_dates=use_dates
        )
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return {"error": str(e)}


@app.get("/auto_aux")
async def auto_aux(
    user_id: int = Query(None, description="ID nạn nhân; bỏ trống = chọn ngẫu nhiên"),
    num_movies: int = 3,
    rating_error: int = 0,
    date_error_days: int = 0,
    prefer_rare: bool = False,
    seed: int = 42,
):
    """
    Sinh "tri thức bổ trợ" từ một người dùng CÓ THẬT, cho phép thêm nhiễu để
    minh hoạ tính bền vững. Trả về danh sách phim kèm tên để nạp thẳng vào
    bảng tri thức của kẻ tấn công.
    """
    try:
        engine = get_db_engine()
        if user_id is None:
            import numpy as np
            rng = np.random.RandomState(seed)
            uids = pd.read_sql("SELECT DISTINCT user_id FROM ratings", engine)["user_id"]
            user_id = int(uids.iloc[rng.randint(0, len(uids))])

        aux = attack_engine.sample_aux_from_user(
            user_id, num_movies=num_movies, rating_error=rating_error,
            date_error_days=date_error_days, seed=seed, prefer_rare=prefer_rare,
        )
        for a in aux:
            row = pd.read_sql(
                "SELECT title FROM movies WHERE id = ?", engine, params=(a["movie_id"],)
            )
            a["title"] = row["title"].iloc[0] if not row.empty else f"#{a['movie_id']}"
            a["date"] = pd.to_datetime(a["timestamp"], unit="s").strftime("%Y-%m-%d")
            s, w = attack_engine.get_movie_weight(a["movie_id"])
            a["support"] = s
            a["weight"] = round(w, 4)
        return {"victim_user_id": user_id, "aux_info": aux}
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return {"error": str(e)}


@app.get("/")
async def root():
    return {
        "message": "De-anonymization Demo API is running",
        "endpoints": ["/stats", "/movies/search", "/attack", "/auto_aux"],
    }
