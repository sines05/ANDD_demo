"""
Thực nghiệm định lượng trên MovieLens 100k, tái hiện kết quả chính của bài báo
Narayanan & Shmatikov (Fig.4, Fig.8): đo tỉ lệ giải ẩn danh thành công theo số
lượng phim mà kẻ tấn công biết, trong các kịch bản:

  - aux chính xác, CÓ ngày (sai số tuỳ chọn)
  - aux chính xác, KHÔNG ngày
  - aux có NHIỄU (sai rating +-1, sai ngày +-14) - kiểm tra tính bền vững

Kết quả ghi ra results/deanon_results.csv để vẽ biểu đồ trong báo cáo.
Một lần định danh tính là THÀNH CÔNG khi eccentricity > phi VÀ user được chọn
đúng là nạn nhân thật (true positive).
"""
import os
import csv
import numpy as np
import pandas as pd
from attack_engine import AttackEngine

RESULTS_DIR = os.path.join(os.path.dirname(__file__), "results")
os.makedirs(RESULTS_DIR, exist_ok=True)


def run_scenario(engine: AttackEngine, user_ids, num_movies, rating_error,
                 date_error_days, use_dates, prefer_rare, phi=1.5, seed0=1000):
    success = 0
    eccs = []
    for k, uid in enumerate(user_ids):
        aux = engine.sample_aux_from_user(
            uid, num_movies=num_movies, rating_error=rating_error,
            date_error_days=date_error_days, seed=seed0 + k, prefer_rare=prefer_rare,
        )
        if len(aux) < num_movies:
            continue
        res = engine.run_attack(aux, phi=phi, use_dates=use_dates)
        if "error" in res:
            continue
        eccs.append(res["eccentricity"])
        idu = res["identified_user"]
        if idu is not None and idu["user_id"] == uid:
            success += 1
    n = len(eccs)
    rate = success / n if n else 0.0
    return rate, (float(np.mean(eccs)) if eccs else 0.0), n


def main(num_users=300, seed=7):
    engine = AttackEngine()
    rng = np.random.RandomState(seed)
    all_users = engine.ratings_df["user_id"].unique()
    # Chỉ chọn người đã xem đủ nhiều phim để có thể lấy 8 phim làm aux
    counts = engine.ratings_df.groupby("user_id").size()
    eligible = counts[counts >= 8].index.values
    sample_users = rng.choice(eligible, size=min(num_users, len(eligible)),
                              replace=False)

    movie_counts = [2, 3, 4, 6, 8]
    scenarios = [
        ("exact_dates",   dict(rating_error=0, date_error_days=0,  use_dates=True,  prefer_rare=False)),
        ("exact_nodates", dict(rating_error=0, date_error_days=0,  use_dates=False, prefer_rare=False)),
        ("noisy_dates",   dict(rating_error=1, date_error_days=14, use_dates=True,  prefer_rare=False)),
        ("rare_nodates",  dict(rating_error=0, date_error_days=0,  use_dates=False, prefer_rare=True)),
    ]

    out_path = os.path.join(RESULTS_DIR, "deanon_results.csv")
    rows = []
    print(f"{'scenario':16} {'k':>3} {'rate':>8} {'mean_ecc':>10} {'n':>5}")
    for name, params in scenarios:
        for k in movie_counts:
            rate, mean_ecc, n = run_scenario(
                engine, sample_users, num_movies=k, **params)
            rows.append({"scenario": name, "num_movies": k,
                         "success_rate": round(rate, 4),
                         "mean_eccentricity": round(mean_ecc, 4), "n": n})
            print(f"{name:16} {k:>3} {rate:>8.3f} {mean_ecc:>10.3f} {n:>5}")

    with open(out_path, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=["scenario", "num_movies",
                                          "success_rate", "mean_eccentricity", "n"])
        w.writeheader()
        w.writerows(rows)
    print(f"\nĐã ghi {len(rows)} dòng vào {out_path}")


if __name__ == "__main__":
    main()
