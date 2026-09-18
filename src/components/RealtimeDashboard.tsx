import React from 'react';
import { 
  Users, 
  FileText, 
  School, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  ArrowRight, 
  Sparkles, 
  BookOpen, 
  Activity, 
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { SeminarSession, SeminarStats, Submission } from '../types';

interface RealtimeDashboardProps {
  sessions: SeminarSession[];
  stats: SeminarStats | null;
  onSelectSessionTab: (sessionId: number) => void;
  onOpenQRModal: (sessionId?: number) => void;
  onViewSubmissionDetail: (submission: Submission) => void;
  lastUpdated: Date;
  onRefresh: () => void;
  isLoading: boolean;
}

export const RealtimeDashboard: React.FC<RealtimeDashboardProps> = ({
  sessions,
  stats,
  onSelectSessionTab,
  onOpenQRModal,
  onViewSubmissionDetail,
  lastUpdated,
  onRefresh,
  isLoading
}) => {
  const totalSubmissions = stats?.totalSubmissions || 0;
  const totalParticipants = stats?.totalUniqueParticipants || 0;
  const totalCampuses = stats?.totalCampuses || 0;
  const avgPerSession = (totalSubmissions / 7).toFixed(1);

  // Calculate highest session count for relative progress bars
  const maxSessionCount = Math.max(
    ...(sessions.map((s) => stats?.sessionCounts[s.id] || 0)),
    1
  );

  const formatTimeAgo = (isoString: string) => {
    try {
      const diffSec = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
      if (diffSec < 60) return 'Baru saja';
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)} mnt lalu`;
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} jam lalu`;
      return new Date(isoString).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    } catch {
      return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Status Real-Time */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-slate-700/60">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs uppercase tracking-wider font-bold text-emerald-400">
              Live Monitoring Aktif
            </span>
            <span className="text-slate-400 text-xs">• Pembaruan otomatis setiap saat</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            Dashboard Progres Evaluasi 7 Sesi
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Pantau pertumbuhan rohani dan pemahaman Firman peserta seminar secara terpisah pada setiap sesi.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => onOpenQRModal()}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md transition cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Tampilkan QR Code Layar</span>
          </button>

          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="px-3 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
            title="Sinkronisasi Data Sekarang"
          >
            <Activity className={`w-3.5 h-3.5 text-emerald-400 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Jawaban Masuk
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-700 flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {totalSubmissions}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Dari 7 sesi seminar yang diselenggarakan
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Peserta Terdata
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-700 flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {totalParticipants}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Mahasiswa unik yang aktif merespons
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Kampus Terwakili
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-700 flex items-center justify-center font-bold">
              <School className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {totalCampuses}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Perguruan tinggi seluruh Indonesia
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Rata-rata per Sesi
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-700 flex items-center justify-center font-bold">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {avgPerSession}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Jawaban refleksi per sesi
          </p>
        </div>
      </div>

      {/* 7 Sesi Progress Monitor (Table-by-Table Overview) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5 pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-600" />
              Progres Jawaban 7 Sesi Secara Terpisah
            </h3>
            <p className="text-xs text-slate-500">
              Setiap sesi memiliki tabel penyimpanan terpisah untuk pemantauan rohani yang detail
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full w-fit">
            Klik sesi untuk buka tabel data
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3">
          {sessions.map((sesi) => {
            const count = stats?.sessionCounts[sesi.id] || 0;
            const percentOfMax = Math.round((count / maxSessionCount) * 100);

            return (
              <div
                key={sesi.id}
                onClick={() => onSelectSessionTab(sesi.id)}
                className="group relative bg-slate-50 hover:bg-amber-50/50 border border-slate-200 hover:border-amber-300 rounded-2xl p-4 transition-all duration-200 cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-800 bg-white px-2 py-0.5 rounded-md border border-slate-200 group-hover:border-amber-200">
                      Sesi {sesi.id}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        sesi.isActive
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {sesi.isActive ? 'Aktif' : 'Tutup'}
                    </span>
                  </div>

                  <h4 className="font-bold text-xs text-slate-900 line-clamp-2 mb-1 group-hover:text-amber-800">
                    {sesi.theme}
                  </h4>
                  <p className="text-[10px] text-slate-500 line-clamp-1 italic mb-3">
                    {sesi.scripture}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-200/60">
                  <div className="flex items-baseline justify-between mb-1.5">
                    <span className="text-xl font-extrabold text-slate-900">
                      {count}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      jawaban
                    </span>
                  </div>

                  {/* Relative bar */}
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(8, percentOfMax))}%` }}
                    />
                  </div>

                  <div className="mt-2 text-[10px] text-amber-700 font-semibold flex items-center justify-between opacity-80 group-hover:opacity-100">
                    <span>Lihat Tabel Data</span>
                    <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2 Column: Kampus Breakdown & Realtime Submissions Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Campus Distribution (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <School className="w-4 h-4 text-emerald-600" />
                Sebaran Kampus Peserta
              </h3>
              <p className="text-xs text-slate-500">
                Partisipasi berdasarkan asal universitas
              </p>
            </div>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
              {stats?.campusDistribution?.length || 0} Kampus
            </span>
          </div>

          <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
            {stats?.campusDistribution && stats.campusDistribution.length > 0 ? (
              stats.campusDistribution.slice(0, 10).map((item, idx) => {
                const percentage = totalSubmissions > 0
                  ? Math.round((item.count / totalSubmissions) * 100)
                  : 0;

                return (
                  <div key={item.campus} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <div className="flex items-center gap-2 truncate pr-2">
                        <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="font-semibold text-slate-800 truncate">
                          {item.campus}
                        </span>
                      </div>
                      <span className="font-bold text-slate-900 shrink-0">
                        {item.count} <span className="font-normal text-slate-500 text-[10px]">({percentage}%)</span>
                      </span>
                    </div>

                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-600 h-full rounded-full"
                        style={{ width: `${Math.min(100, Math.max(5, percentage))}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                Belum ada data kampus yang masuk.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Recent Submissions Live Stream (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                Jawaban Masuk Terbaru (Real-Time Feed)
              </h3>
              <p className="text-xs text-slate-500">
                Pantau langsung saat peserta mengirimkan jawaban dari smartphone mereka
              </p>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              Update: {lastUpdated.toLocaleTimeString('id-ID')}
            </span>
          </div>

          <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
            {stats?.recentSubmissions && stats.recentSubmissions.length > 0 ? (
              stats.recentSubmissions.map((sub) => {
                const sessionObj = sessions.find((s) => s.id === sub.sessionId);
                return (
                  <div
                    key={sub.id}
                    onClick={() => onViewSubmissionDetail(sub)}
                    className="p-3.5 rounded-xl border border-slate-200/80 hover:border-amber-300 bg-slate-50/50 hover:bg-amber-50/30 transition cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800">
                          Sesi {sub.sessionId}
                        </span>
                        <span className="font-bold text-xs text-slate-900">
                          {sub.nama}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          • {sub.asalKampus}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {formatTimeAgo(sub.timestamp)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 line-clamp-2 leading-relaxed italic">
                      "{sub.jawaban}"
                    </p>

                    {sub.komitmenPribadi && (
                      <div className="mt-2 text-[11px] text-rose-700 bg-rose-50/80 p-1.5 rounded-lg border border-rose-100 line-clamp-1">
                        <span className="font-semibold">Doa/Komitmen:</span> {sub.komitmenPribadi}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center text-xs text-slate-400">
                Belum ada jawaban yang masuk.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
