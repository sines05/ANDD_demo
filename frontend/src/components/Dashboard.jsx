import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Info } from 'lucide-react';

const Dashboard = ({ stats }) => {
  if (!stats) return <div className="p-4 text-slate-500">Đang tải thống kê...</div>;

  const sparsityPercentage = ((1 - stats.total_ratings / (stats.total_users * stats.total_movies)) * 100).toFixed(4);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-blue-700">Độ thưa dữ liệu</h2>
          <Info className="text-slate-400 w-5 h-5" />
        </div>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <p className="text-slate-500 text-sm">Người dùng</p>
            <p className="text-2xl font-mono font-bold text-slate-900">{stats.total_users.toLocaleString()}</p>
          </div>
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <p className="text-slate-500 text-sm">Phim</p>
            <p className="text-2xl font-mono font-bold text-slate-900">{stats.total_movies.toLocaleString()}</p>
          </div>
        </div>

        <div className="relative pt-1">
          <div className="flex mb-2 items-center justify-between">
            <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-700 bg-blue-100">
              Mức độ thưa
            </span>
            <span className="text-sm font-bold inline-block text-blue-700 font-mono">
              {sparsityPercentage}%
            </span>
          </div>
          <div className="overflow-hidden h-2.5 mb-4 text-xs flex rounded bg-slate-200">
            <div style={{ width: `${sparsityPercentage}%` }} className="flex flex-col justify-center bg-blue-600 rounded"></div>
          </div>
          <p className="text-xs text-slate-500 italic">
            Độ thưa cao (trên 90%) khiến mỗi người dùng gần như duy nhất và dễ bị giải ẩn danh.
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-xl font-bold text-purple-700 mb-4">Phân phối điểm đánh giá</h2>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.rating_distribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="rating" stroke="#475569" />
              <YAxis stroke="#475569" />
              <Tooltip
                contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px' }}
                itemStyle={{ color: '#0f172a' }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {stats.rating_distribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={['#ef4444', '#f97316', '#f59e0b', '#10b981', '#3b82f6'][index]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
