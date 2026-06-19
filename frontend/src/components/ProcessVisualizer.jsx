import React from 'react';
import { Target, Users, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

const ProcessVisualizer = ({ result }) => {
  if (!result) return (
    <div className="h-full flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl p-12">
      <Target className="w-16 h-16 mb-4 opacity-30" />
      <p className="text-lg font-medium">Chờ thực thi tấn công...</p>
      <p className="text-sm">Nhập tri thức bổ trợ và nhấn "Thực thi" để bắt đầu.</p>
    </div>
  );

  const { top_candidates, eccentricity, identified_user, full_history, total_candidates, use_dates } = result;
  const isSuccessful = identified_user !== null;

  return (
    <div className="space-y-6 pb-4">
      <div id="result-card" className={`p-6 rounded-xl border-2 ${isSuccessful ? 'bg-emerald-50 border-emerald-400' : 'bg-rose-50 border-rose-300'}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {isSuccessful ? (
              <CheckCircle2 className="text-emerald-600 w-8 h-8" />
            ) : (
              <XCircle className="text-rose-600 w-8 h-8" />
            )}
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                {isSuccessful ? 'Đã định danh người dùng!' : 'Định danh thất bại'}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {total_candidates} ứng viên · chế độ {use_dates ? 'có ngày' : 'KHÔNG ngày'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500 uppercase font-bold">Điểm Eccentricity</p>
            <p className={`text-3xl font-mono font-bold ${eccentricity > 1.5 ? 'text-emerald-600' : 'text-amber-600'}`}>
              {eccentricity.toFixed(4)}
            </p>
          </div>
        </div>

        {isSuccessful && (
          <div className="bg-white p-4 rounded-lg border border-emerald-200 mb-2">
            <p className="text-sm text-slate-500">ID người dùng mục tiêu</p>
            <p className="text-4xl font-mono font-bold text-slate-900">#{identified_user.user_id}</p>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-3 rounded border border-slate-200">
                <p className="text-xs text-slate-500">Độ tương tự</p>
                <p className="text-xl font-mono text-emerald-600">{identified_user.similarity.toFixed(6)}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded border border-slate-200">
                <p className="text-xs text-slate-500">Độ tin cậy</p>
                <p className="text-xl font-mono text-blue-600">Cao</p>
              </div>
            </div>
          </div>
        )}

        {!isSuccessful && (
          <div className="flex items-start gap-3 bg-white p-4 rounded-lg border border-rose-200">
            <AlertTriangle className="text-rose-500 w-5 h-5 mt-0.5" />
            <div>
              <p className="text-sm text-slate-700 font-medium">Eccentricity thấp</p>
              <p className="text-xs text-slate-500">Tri thức bổ trợ chưa đủ đặc trưng để tách một người dùng khỏi đám đông. Hãy thêm các phim hoặc ngày cụ thể hơn.</p>
            </div>
          </div>
        )}
      </div>

      {isSuccessful && full_history && full_history.length > 0 && (
        <div id="exposed-history" className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Target className="text-red-500 w-5 h-5" />
            <h3 className="text-lg font-bold text-slate-900">Lịch sử riêng tư bị phơi bày <span className="text-sm font-normal text-slate-500">({full_history.length} lượt xem)</span></h3>
          </div>
          <div className="max-h-96 overflow-y-auto rounded-lg border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-600 sticky top-0">
                <tr>
                  <th className="px-4 py-2 border-b border-slate-200">Tên phim</th>
                  <th className="px-4 py-2 border-b border-slate-200">Điểm</th>
                  <th className="px-4 py-2 border-b border-slate-200">Ngày</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {full_history.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 text-slate-700">
                    <td className="px-4 py-2">{row.title}</td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-1">
                        <span className="text-amber-500">★</span>
                        {row.rating}
                      </div>
                    </td>
                    <td className="px-4 py-2 text-xs font-mono text-slate-500">
                      {new Date(row.timestamp * 1000).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div id="top-candidates" className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Users className="text-blue-500 w-5 h-5" />
          <h3 className="text-lg font-bold text-slate-900">Các ứng viên hàng đầu</h3>
        </div>
        <div className="space-y-3">
          {top_candidates.map((c, i) => (
            <div key={c.user_id} className={`relative overflow-hidden p-4 rounded-lg border ${i === 0 && isSuccessful ? 'border-emerald-400 bg-emerald-50 ring-1 ring-emerald-300' : 'border-slate-200 bg-slate-50'}`}>
              <div className="flex justify-between items-center relative z-10">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase mr-2">Hạng {i + 1}</span>
                  <span className="text-lg font-mono font-bold text-slate-900">User #{c.user_id}</span>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">Độ tương tự</p>
                  <p className="text-sm font-mono text-blue-600">{c.similarity.toFixed(6)}</p>
                </div>
              </div>
              <div
                className="absolute left-0 top-0 bottom-0 bg-blue-100/60"
                style={{ width: `${(c.similarity / top_candidates[0].similarity) * 100}%` }}
              ></div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Cơ chế hoạt động</h3>
        <div className="space-y-4 text-sm text-slate-600">
          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white shrink-0">1</div>
            <p>Thuật toán tính <span className="text-blue-700 font-medium">độ tương tự hàm mũ</span> giữa tri thức bổ trợ và mọi người dùng, gán trọng số phim theo độ hiếm (nghịch đảo log support).</p>
          </div>
          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white shrink-0">2</div>
            <p>Kết hợp độ gần về điểm và thời gian bằng hàm mũ suy giảm để tìm các khớp tốt nhất.</p>
          </div>
          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white shrink-0">3</div>
            <p><span className="text-purple-700 font-medium">Eccentricity</span> đo khoảng cách giữa khớp tốt nhất và phần còn lại. Giá trị cao nghĩa là đã tách được một cá nhân duy nhất.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProcessVisualizer;
