import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Shield, Database, Activity, Github } from 'lucide-react';
import Dashboard from './components/Dashboard';
import AttackerConsole from './components/AttackerConsole';
import ProcessVisualizer from './components/ProcessVisualizer';
import { AttackEngine } from './utils/attackEngine';

function App() {
  const [stats, setStats] = useState(null);
  const [attackResult, setAttackResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [attackEngine, setAttackEngine] = useState(null);
  const [dbLoading, setDbLoading] = useState(true);
  const [dbError, setDbError] = useState(null);

  useEffect(() => {
    const loadDatabase = async () => {
      try {
        setDbLoading(true);
        const [moviesRes, ratingsRes] = await Promise.all([
          axios.get('/data/movies.json'),
          axios.get('/data/movie_ratings.json')
        ]);
        
        const engine = new AttackEngine(moviesRes.data, ratingsRes.data);
        setAttackEngine(engine);
        
        setStats({
          total_users: 943,
          total_movies: 1682,
          total_ratings: 100000,
          sparsity: 0.93695330634278,
          rating_distribution: [
            { rating: 1, count: 6110 },
            { rating: 2, count: 11370 },
            { rating: 3, count: 27145 },
            { rating: 4, count: 34174 },
            { rating: 5, count: 21201 }
          ]
        });
      } catch (err) {
        console.error("Failed to load MovieLens data files", err);
        setDbError("Không thể tải cơ sở dữ liệu MovieLens. Vui lòng tải lại trang.");
      } finally {
        setDbLoading(false);
      }
    };

    loadDatabase();
  }, []);

  const handleAttack = (auxInfo, options = {}) => {
    if (!attackEngine) return;
    setLoading(true);
    setTimeout(() => {
      try {
        const useDates = options.useDates !== false;
        const res = attackEngine.runAttack(auxInfo, { useDates });
        setAttackResult(res);
      } catch (err) {
        console.error("Attack failed", err);
        alert("Có lỗi xảy ra khi thực thi thuật toán giải ẩn danh.");
      } finally {
        setLoading(false);
      }
    }, 450);
  };

  if (dbLoading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center font-sans">
        <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-2xl flex flex-col items-center max-w-md text-center">
          <div className="bg-blue-600 p-3 rounded-2xl mb-6 animate-pulse">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
          <h2 className="text-xl font-bold mb-2">Đang tải cơ sở dữ liệu...</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Đang nạp toàn bộ 100.000 đánh giá và 1.682 bộ phim của tập MovieLens 100k vào trình duyệt để chạy mô phỏng trực tiếp tại máy của bạn.
          </p>
        </div>
      </div>
    );
  }

  if (dbError) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center font-sans">
        <div className="bg-slate-800 p-8 rounded-2xl border border-red-500/30 shadow-2xl flex flex-col items-center max-w-md text-center">
          <div className="bg-red-500/20 p-3 rounded-2xl mb-6">
            <Shield className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold mb-2 text-red-500">Lỗi tải dữ liệu</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            {dbError}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">Mô phỏng Tấn công Giải ẩn danh</h1>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">Tập dữ liệu MovieLens 100k</p>
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm font-medium text-slate-500">
            <a 
              href="https://grouplens.org/datasets/movielens/100k/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-blue-600 transition-colors flex items-center gap-2"
            >
              <Database className="w-4 h-4" /> Dataset
            </a>
            <a 
              href="https://doi.org/10.1109/SP.2008.33" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-blue-600 transition-colors flex items-center gap-2"
            >
              <Activity className="w-4 h-4" /> Scoreboard-RH
            </a>
            <a 
              href="https://github.com/sines05/ANDD_demo" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-slate-900 transition-colors flex items-center"
            >
              <Github className="w-5 h-5" />
            </a>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Left Column: Stats & Input */}
          <div className="lg:col-span-4 space-y-8">
            <section>
              <h2 className="text-sm font-bold text-slate-500 uppercase mb-4 tracking-widest">Trạng thái hệ thống</h2>
              <Dashboard stats={stats} />
            </section>

            <section>
              <h2 className="text-sm font-bold text-slate-500 uppercase mb-4 tracking-widest">Vector tấn công</h2>
              <AttackerConsole onAttack={handleAttack} loading={loading} attackEngine={attackEngine} />
            </section>
          </div>

          {/* Right Column: Visualization */}
          <div className="lg:col-span-8">
            <section className="h-full">
              <h2 className="text-sm font-bold text-slate-500 uppercase mb-4 tracking-widest">Trực quan hóa quá trình</h2>
              <div id="viz-panel" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 min-h-[600px]">
                <ProcessVisualizer result={attackResult} />
              </div>
            </section>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 mt-12 py-8 bg-white">
        <div className="container mx-auto px-6 text-center">
          <p className="text-slate-500 text-sm">
            Demo nghiên cứu giải ẩn danh - dựa trên Narayanan &amp; Shmatikov (2008). Xây dựng bằng React, FastAPI và SQLite.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
