"""
Demo nhanh trên dòng lệnh: lấy "dấu vân tay" 4 phim của một người dùng thật
(thêm nhiễu nhẹ) rồi chạy thuật toán Scoreboard-RH để giải ẩn danh.
"""
from attack_engine import AttackEngine
import pandas as pd

VICTIM = 200  # một người dùng có thật trong MovieLens 100k

eng = AttackEngine()
aux = eng.sample_aux_from_user(VICTIM, num_movies=6, rating_error=0,
                               date_error_days=0, seed=2024, prefer_rare=False)

titles = pd.read_sql("SELECT id, title FROM movies", eng.engine).set_index("id")["title"]
print(f"\n[+] Nan nhan that: user #{VICTIM}")
print("[+] Tri thuc bo tro (aux) ke tan cong nam giu (6 phim, chinh xac):")
for a in aux:
    s, w = eng.get_movie_weight(a["movie_id"])
    print(f"      - {titles.get(a['movie_id'],'?'):42} rating={a['rating']:.0f}  "
          f"support={s:<4} wt={w:.3f}")

res = eng.run_attack(aux, phi=1.5)
idu = res["identified_user"]
print(f"\n[+] Tong so ung vien xet den : {res['total_candidates']}")
print(f"[+] Eccentricity            : {res['eccentricity']:.4f}  (nguong phi=1.5)")
print(f"[+] Top-3 ung vien          :")
for i, c in enumerate(res["top_candidates"][:3]):
    print(f"      #{i+1}  user {c['user_id']:<4}  similarity={c['similarity']:.4f}")

if idu:
    ok = "DUNG" if idu["user_id"] == VICTIM else "SAI"
    print(f"\n[!] DINH DANH THANH CONG -> user #{idu['user_id']}  ({ok} nan nhan)")
    print(f"[!] Da phoi bay {len(res['full_history'])} luot xem phim rieng tu cua nan nhan.")
else:
    print("\n[-] Khong du eccentricity de dinh danh.")
