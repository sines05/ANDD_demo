import React, { useState, useEffect } from 'react';
import { Search, Plus, Trash2, Zap, ShieldAlert, Wand2, CalendarOff } from 'lucide-react';
import axios from 'axios';

const AttackerConsole = ({ onAttack, loading }) => {
  const [movies, setMovies] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [auxInfo, setAuxInfo] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [rating, setRating] = useState(5);
  const [date, setDate] = useState('1998-01-01');
  const [useDates, setUseDates] = useState(true);
  const [victimId, setVictimId] = useState(null);
  const [genLoading, setGenLoading] = useState(false);

  useEffect(() => {
    if (searchTerm.length > 2) {
      axios.get(`/api/movies/search?q=${searchTerm}`)
        .then(res => setMovies(res.data))
        .catch(err => console.error(err));
    } else {
      setMovies([]);
    }
  }, [searchTerm]);

  const addAux = () => {
    if (!selectedMovie) return;
    if (auxInfo.find(a => a.movie_id === selectedMovie.id)) return;

    setAuxInfo([...auxInfo, {
      movie_id: selectedMovie.id,
      title: selectedMovie.title,
      rating: parseInt(rating),
      date: date,
      weight: selectedMovie.weight,
      support: selectedMovie.support,
    }]);
    setSelectedMovie(null);
    setSearchTerm('');
  };

  const removeAux = (id) => {
    setAuxInfo(auxInfo.filter(a => a.movie_id !== id));
  };

  // Tự sinh "dấu vân tay" từ một nạn nhân CÓ THẬT, có thể thêm nhiễu để minh
  // hoạ tính bền vững của thuật toán (sai ±1 điểm, ±14 ngày).
  const autoFill = async (noisy) => {
    setGenLoading(true);
    try {
      const params = noisy
        ? 'num_movies=6&rating_error=1&date_error_days=14&prefer_rare=true'
        : 'num_movies=4&prefer_rare=true';
      const res = await axios.get(`/api/auto_aux?${params}&seed=${Math.floor(Math.random() * 10000)}`);
      setVictimId(res.data.victim_user_id);
      setAuxInfo(res.data.aux_info.map(a => ({
        movie_id: a.movie_id, title: a.title, rating: a.rating,
        date: a.date, weight: a.weight, support: a.support,
      })));
    } catch (e) {
      console.error(e);
    } finally {
      setGenLoading(false);
    }
  };

  return (
    <div id="attacker-console" className="bg-white p-6 rounded-xl border-2 border-red-200 shadow-sm">
      <div className="flex items-center gap-2 mb-6">
        <ShieldAlert className="text-red-600 w-6 h-6" />
        <h2 className="text-xl font-bold text-red-600 uppercase tracking-wider">Bảng điều khiển kẻ tấn công</h2>
      </div>

      {/* Tự nạp nạn nhân thật */}
      <div className="mb-6 p-3 rounded-lg bg-slate-50 border border-slate-200">
        <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Mô phỏng nhanh</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => autoFill(false)}
            disabled={genLoading}
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2 px-3 rounded-lg transition-colors disabled:opacity-50"
          >
            <Wand2 className="w-4 h-4" /> Nạn nhân thật
          </button>
          <button
            onClick={() => autoFill(true)}
            disabled={genLoading}
            className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold py-2 px-3 rounded-lg transition-colors disabled:opacity-50"
          >
            <Wand2 className="w-4 h-4" /> Aux có nhiễu
          </button>
        </div>
        {victimId && (
          <p className="text-xs text-slate-500 mt-2">
            Đã nạp dấu vân tay của một nạn nhân thật. ID thật sẽ được kiểm chứng
            sau khi tấn công.
          </p>
        )}
      </div>

      <div className="space-y-4 mb-8">
        <div className="relative">
          <label className="block text-sm font-medium text-slate-600 mb-1">Tìm phim (tri thức bổ trợ)</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              className="w-full bg-white border border-slate-300 rounded-lg py-2 pl-10 pr-4 text-slate-900 focus:ring-2 focus:ring-red-400 focus:border-transparent outline-none"
              placeholder="vd: Toy Story, Star Wars..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {movies.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-48 overflow-y-auto">
              {movies.map(m => (
                <div
                  key={m.id}
                  className="p-2 hover:bg-slate-50 cursor-pointer text-sm border-b border-slate-100 last:border-0 flex justify-between items-center"
                  onClick={() => {
                    setSelectedMovie(m);
                    setMovies([]);
                    setSearchTerm(m.title);
                  }}
                >
                  <span className="text-slate-700">{m.title} ({m.release_date?.split('-')[0]})</span>
                  {m.support !== undefined && (
                    <span className="text-xs text-slate-400 ml-2 shrink-0">
                      {m.support} views · wt {m.weight}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Điểm (1-5)</label>
            <input
              type="number"
              min="1"
              max="5"
              className="w-full bg-white border border-slate-300 rounded-lg py-2 px-4 text-slate-900 outline-none focus:ring-2 focus:ring-red-400"
              value={rating}
              onChange={(e) => setRating(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Ngày xem</label>
            <input
              type="date"
              className="w-full bg-white border border-slate-300 rounded-lg py-2 px-4 text-slate-900 outline-none focus:ring-2 focus:ring-red-400"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>

        <button
          onClick={addAux}
          disabled={!selectedMovie}
          className="w-full flex items-center justify-center gap-2 bg-slate-200 hover:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 font-bold py-2 px-4 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" /> Thêm vào tri thức
        </button>
      </div>

      <div className="space-y-2 mb-6">
        <h3 className="text-sm font-semibold text-slate-500 uppercase">Thông tin đã biết</h3>
        {auxInfo.length === 0 ? (
          <p className="text-slate-400 italic text-sm">Chưa có tri thức bổ trợ nào.</p>
        ) : (
          <div className="space-y-2">
            {auxInfo.map(a => (
              <div key={a.movie_id} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{a.title}</p>
                  <p className="text-xs text-slate-500">
                    Điểm: {a.rating} • Ngày: {a.date}
                    {a.support !== undefined && (
                      <span className="text-indigo-600 font-medium"> • {a.support} views · wt {a.weight}</span>
                    )}
                  </p>
                </div>
                <button onClick={() => removeAux(a.movie_id)} className="text-slate-400 hover:text-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Công tắc dùng ngày */}
      <label className="flex items-center gap-3 mb-6 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={useDates}
          onChange={(e) => setUseDates(e.target.checked)}
          className="w-4 h-4 accent-red-600"
        />
        <span className="text-sm text-slate-700 flex items-center gap-1">
          <CalendarOff className="w-4 h-4 text-slate-400" />
          Dùng thông tin ngày xem (bỏ chọn = chỉ phim + điểm)
        </span>
      </label>

      <button
        onClick={() => onAttack(auxInfo, { useDates })}
        disabled={auxInfo.length === 0 || loading}
        className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 px-4 rounded-xl shadow-md transition-all transform active:scale-95"
      >
        {loading ? (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
        ) : (
          <>
            <Zap className="w-5 h-5 fill-current" /> THỰC THI GIẢI ẨN DANH
          </>
        )}
      </button>
    </div>
  );
};

export default AttackerConsole;
