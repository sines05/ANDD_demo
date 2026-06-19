import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Shield, Database, Activity, Github } from 'lucide-react';
import Dashboard from './components/Dashboard';
import AttackerConsole from './components/AttackerConsole';
import ProcessVisualizer from './components/ProcessVisualizer';

function App() {
  const [stats, setStats] = useState(null);
  const [attackResult, setAttackResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axios.get('/api/stats')
      .then(res => setStats(res.data))
      .catch(err => console.error("Failed to fetch stats", err));
  }, []);

  const handleAttack = async (auxInfo, options = {}) => {
    setLoading(true);
    try {
      const useDates = options.useDates !== false;
      const response = await axios.post(
        `/api/attack?use_dates=${useDates}`,
        { aux_info: auxInfo }
      );
      setAttackResult(response.data);
    } catch (err) {
      console.error("Attack failed", err);
      alert("Attack failed. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

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
            <span className="hover:text-blue-600 transition-colors flex items-center gap-2">
              <Database className="w-4 h-4" /> Dataset
            </span>
            <span className="hover:text-blue-600 transition-colors flex items-center gap-2">
              <Activity className="w-4 h-4" /> Scoreboard-RH
            </span>
            <Github className="w-5 h-5" />
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
              <AttackerConsole onAttack={handleAttack} loading={loading} />
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
