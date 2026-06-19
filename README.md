# De-anonymization Attack Simulation Demo

Dự án này là một ứng dụng Proof-of-Concept (PoC) mô phỏng phương pháp tấn công giải ẩn danh (de-anonymization) trên các tập dữ liệu thưa (sparse datasets), dựa trên nghiên cứu nổi tiếng:
**"Robust De-anonymization of Large Sparse Datasets"** của Arvind Narayanan và Vitaly Shmatikov (The University of Texas at Austin).

Dự án sử dụng tập dữ liệu **MovieLens 100k** làm proxy để tái hiện lại cuộc tấn công lịch sử vào giải thưởng Netflix Prize.

## 🚀 Tính năng chính

- **Dashboard Thống kê**: Trực quan hóa độ thưa (Sparsity) của dữ liệu và phân phối "đuôi dài" (Heavy-tail).
- **Backend Attack Engine**: 
    - Thuật toán **Weighted Scoring** ưu tiên các thuộc tính hiếm.
    - Tiêu chí **Eccentricity** ($\varphi > 1.5$) để đảm bảo độ tin cậy của việc định danh.
    - Tối ưu hóa bằng Pandas Vectorization (xử lý 100k bản ghi trong < 30ms).
- **Frontend Trực quan**: Giao diện hiện đại (React + Tailwind CSS) cho phép kẻ tấn công nhập "tri thức bổ trợ" và theo dõi quá trình lộ lọt thông tin.

## 🛠️ Cài đặt & Khởi chạy

### 1. Cấu trúc thư mục
```
ANDD_demo/
├── backend/    # FastAPI Backend (Python)
└── frontend/   # Vite + React Frontend (JavaScript)
```

### 2. Thiết lập Backend
Yêu cầu: Python 3.8+

```bash
cd backend
# Tạo môi trường ảo
python -m venv venv
source venv/bin/activate  # Trên Windows dùng: venv\Scripts\activate

# Cài đặt dependency
pip install -r requirements.txt

# Khởi tạo dữ liệu (Tải MovieLens 100k và nạp vào SQLite)
python data_loader.py

# Chạy server
uvicorn main:app --reload
```
*Server sẽ chạy tại: `http://localhost:8000`*

### 3. Thiết lập Frontend
Yêu cầu: Node.js 18+

```bash
cd frontend
# Cài đặt dependency
npm install

# Chạy ứng dụng
npm run dev
```
*Ứng dụng sẽ chạy tại: `http://localhost:5173`*

## 🆕 Nâng cấp (bản báo cáo cuối kỳ)

So với bản demo ban đầu, phiên bản này được tối ưu cho đúng công trình gốc:

- **Sửa hàm cho điểm cho đúng paper**: dùng phép **cộng** `wt·(exp(-|Δr|/ρ₀) + exp(-|Δt|/d₀))` thay vì phép nhân, giúp thuật toán bền vững với nhiễu.
- **Chế độ không-ngày** (`use_dates`): mô phỏng kẻ tấn công chỉ biết phim + điểm.
- **Phơi bày trọng số độ hiếm** `wt(i)` và `support` của từng phim ngay trên giao diện.
- **Sinh nạn nhân thật + nhiễu** (`/auto_aux`, nút *Nạn nhân thật* / *Aux có nhiễu*) để demo lặp lại được và minh hoạ tính bền vững.
- **Module thực nghiệm định lượng** `experiment.py` + `plot_results.py`: đo tỉ lệ định danh trên 300 nạn nhân, sinh CSV và biểu đồ; `demo_attack.py` cho một phiên tấn công trên dòng lệnh.

Kết quả thật (300 nạn nhân): 8 phim → **98%** định danh đúng; không ngày → 93%; nhiễu (±1 điểm, ±14 ngày) → 72%; ưu tiên phim hiếm chỉ 2 phim → 59%.

## 📖 Kịch bản Demo chuẩn

Để chứng minh sức mạnh của thuật toán, hãy thử nhập "dấu vân tay" của **User #1** trong hệ thống:

1.  **Phim 1**: Tìm `Toy Story (1995)`, Rating: `5`, Date: `1997-09-22`
2.  **Phim 2**: Tìm `Three Colors: White (1994)`, Rating: `4`, Date: `1997-11-06`
3.  **Phim 3**: Tìm `Twelve Monkeys (1995)`, Rating: `4`, Date: `1997-09-22`

**Kết quả**: Hệ thống sẽ định danh chính xác User #1 với điểm **Eccentricity > 1.5** và phơi bày toàn bộ lịch sử xem phim (Exposed Private History) của người này.

## 🔬 Giải thích kỹ thuật

- **Sparsity**: Trong dataset MovieLens 100k, độ thưa đạt **93.7%**. Điều này nghĩa là hầu hết người dùng chỉ xem một phần cực nhỏ các phim hiện có, tạo ra các tổ hợp phim duy nhất.
- **Weighted Scoring**: $wt(i) = 1 / \log(|supp(i)|)$. Phim càng ít người xem thì càng có giá trị trong việc định danh.
- **Eccentricity**: Đo lường khoảng cách giữa ứng viên khớp nhất và phần còn lại của đám đông. Nếu khoảng cách này vượt quá 1.5 lần độ lệch chuẩn, danh tính được coi là bị lộ.

---
*Dự án được xây dựng phục vụ mục đích giáo dục và nghiên cứu về an toàn dữ liệu.*
