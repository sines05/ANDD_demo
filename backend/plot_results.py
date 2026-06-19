"""Vẽ biểu đồ kết quả thực nghiệm để đưa vào báo cáo."""
import os
import csv
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

HERE = os.path.dirname(__file__)
CSV = os.path.join(HERE, "results", "deanon_results.csv")
OUTDIR = os.path.join(HERE, "results")

rows = list(csv.DictReader(open(CSV)))
scen = {}
for r in rows:
    scen.setdefault(r["scenario"], []).append(
        (int(r["num_movies"]), float(r["success_rate"]), float(r["mean_eccentricity"]))
    )
for k in scen:
    scen[k].sort()

labels = {
    "exact_dates":   ("Chính xác + có ngày",        "#16a34a", "o-"),
    "exact_nodates": ("Chính xác, KHÔNG ngày",      "#2563eb", "s-"),
    "noisy_dates":   ("Nhiễu (±1 điểm, ±14 ngày)",  "#dc2626", "^-"),
    "rare_nodates":  ("Ưu tiên phim hiếm, KHÔNG ngày", "#9333ea", "d-"),
}

# --- Biểu đồ 1: tỉ lệ thành công theo số phim ---
plt.figure(figsize=(7, 4.3))
for name, (lab, color, style) in labels.items():
    if name not in scen:
        continue
    xs = [p[0] for p in scen[name]]
    ys = [p[1] * 100 for p in scen[name]]
    plt.plot(xs, ys, style, color=color, label=lab, linewidth=2, markersize=7)
plt.xlabel("Số phim kẻ tấn công biết (kích thước aux)")
plt.ylabel("Tỉ lệ định danh đúng (%)")
plt.title("Tỉ lệ giải ẩn danh thành công trên MovieLens 100k (300 nạn nhân)")
plt.grid(True, alpha=0.3)
plt.legend(fontsize=9, loc="lower right")
plt.ylim(0, 105)
plt.xticks([2, 3, 4, 6, 8])
plt.tight_layout()
p1 = os.path.join(OUTDIR, "success_rate.png")
plt.savefig(p1, dpi=150)
print("Saved", p1)

# --- Biểu đồ 2: eccentricity trung bình theo số phim ---
plt.figure(figsize=(7, 4.3))
for name, (lab, color, style) in labels.items():
    if name not in scen:
        continue
    xs = [p[0] for p in scen[name]]
    ys = [p[2] for p in scen[name]]
    plt.plot(xs, ys, style, color=color, label=lab, linewidth=2, markersize=7)
plt.axhline(1.5, color="black", linestyle="--", alpha=0.6,
            label="Ngưỡng φ = 1.5")
plt.xlabel("Số phim kẻ tấn công biết (kích thước aux)")
plt.ylabel("Eccentricity trung bình")
plt.title("Độ 'nổi bật' của ứng viên đúng theo lượng tri thức bổ trợ")
plt.grid(True, alpha=0.3)
plt.legend(fontsize=9, loc="upper left")
plt.xticks([2, 3, 4, 6, 8])
plt.tight_layout()
p2 = os.path.join(OUTDIR, "eccentricity.png")
plt.savefig(p2, dpi=150)
print("Saved", p2)
