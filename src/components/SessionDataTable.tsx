import React, { useState } from 'react';
import { 
  Download, 
  Search, 
  Filter, 
  Trash2, 
  Eye, 
  MessageSquare, 
  BookOpen, 
  QrCode, 
  Edit3, 
  Check, 
  UserCheck, 
  AlertCircle,
  Clock,
  Sparkles,
  PlusCircle
} from 'lucide-react';
import { SeminarSession, Submission } from '../types';

interface SessionDataTableProps {
  sessions: SeminarSession[];
  activeSessionId: number;
  onSelectSession: (id: number) => void;
  submissions: Submission[];
  onDeleteSubmission: (id: string) => void;
  onClearSessionSubmissions?: (sessionId: number) => void;
  onClearAllSubmissions?: () => void;
  onViewSubmissionDetail: (submission: Submission) => void;
  onOpenQRModal: (sessionId: number) => void;
  onOpenEditSessionModal: (session: SeminarSession) => void;
  onOpenCreateSessionModal?: () => void;
  onExportSessionExcel: (sessionId: number) => void;
  isLoading: boolean;
  stats?: any;
}

export const SessionDataTable: React.FC<SessionDataTableProps> = ({
  sessions,
  activeSessionId,
  onSelectSession,
  submissions,
  onDeleteSubmission,
  onClearSessionSubmissions,
  onClearAllSubmissions,
  onViewSubmissionDetail,
  onOpenQRModal,
  onOpenEditSessionModal,
  onOpenCreateSessionModal,
  onExportSessionExcel,
  isLoading,
  stats
}) => {
  const [search, setSearch] = useState<string>('');
  const [campusFilter, setCampusFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const currentSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];

  // Get distinct campuses for this session's submissions
  const distinctCampuses = Array.from(new Set(submissions.map((s) => s.asalKampus))).sort();

  // Filter submissions
  const filteredSubmissions = submissions.filter((item) => {
    const matchesSearch =
      search === '' ||
      item.nama.toLowerCase().includes(search.toLowerCase()) ||
      item.asalKampus.toLowerCase().includes(search.toLowerCase()) ||
      item.jawaban.toLowerCase().includes(search.toLowerCase()) ||
      (item.komitmenPribadi && item.komitmenPribadi.toLowerCase().includes(search.toLowerCase()));

    const matchesCampus = campusFilter === 'ALL' || item.asalKampus === campusFilter;
    const matchesStatus = statusFilter === 'ALL' || item.statusSpiritual === statusFilter;

    return matchesSearch && matchesCampus && matchesStatus;
  });

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'Pemimpin Mahasiswa':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Aktif Terbina':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Butuh Pendampingan':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Baru Bertumbuh':
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const formatDateTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-6">
      {/* Session Tabs Navigation */}
      <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1 py-1.5 border-b border-slate-100 mb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Tabel Penyimpanan Data Terpisah ({sessions.length} Sesi):
            </span>
            <span className="text-xs text-amber-700 font-semibold bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              Tabel Sesi {activeSessionId} Terpilih
            </span>
          </div>

          {onOpenCreateSessionModal && (
            <button
              onClick={onOpenCreateSessionModal}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ Input Sesi Baru</span>
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {sessions.map((sesi) => {
            const isSelected = activeSessionId === sesi.id;
            const count = (stats?.sessionCounts && stats.sessionCounts[sesi.id] !== undefined)
              ? stats.sessionCounts[sesi.id]
              : (sesi.submissionCount || 0);

            return (
              <button
                key={sesi.id}
                onClick={() => onSelectSession(sesi.id)}
                className={`flex-1 min-w-[110px] px-3 py-2.5 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center text-center cursor-pointer ${
                  isSelected
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20 ring-2 ring-amber-400'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span>Sesi {sesi.id}</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    isSelected
                      ? 'bg-amber-800 text-white'
                      : count > 0
                      ? 'bg-amber-100 text-amber-900 border border-amber-200'
                      : 'bg-slate-200 text-slate-600'
                  }`}>
                    {count}
                  </span>
                </div>
                <div className={`text-[10px] font-normal truncate max-w-full ${isSelected ? 'text-amber-100' : 'text-slate-500'}`}>
                  {sesi.title.split(':')[1]?.trim() || `Sesi ${sesi.id}`}
                </div>
              </button>
            );
          })}

          {onOpenCreateSessionModal && (
            <button
              onClick={onOpenCreateSessionModal}
              className="min-w-[110px] px-3 py-2 rounded-xl text-xs font-bold border border-dashed border-amber-300 text-amber-800 bg-amber-50/50 hover:bg-amber-100/80 flex flex-col items-center justify-center transition cursor-pointer"
              title="Input sesi seminar baru"
            >
              <div className="flex items-center gap-1">
                <PlusCircle className="w-3.5 h-3.5 text-amber-600" />
                <span>+ Sesi Baru</span>
              </div>
              <div className="text-[10px] font-normal text-amber-700/80">Input sesi</div>
            </button>
          )}
        </div>
      </div>

      {/* Selected Session Info Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">
                Tabel Penyimpanan: Sesi {currentSession?.id}
              </span>
              <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                Nats: {currentSession?.scripture}
              </span>
              {currentSession?.speaker && (
                <span className="text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
                  Pembicara: {currentSession.speaker}
                </span>
              )}
            </div>

            <h2 className="text-xl font-bold text-slate-900">
              {currentSession?.title}
            </h2>
            <p className="text-xs text-slate-600">
              Tema: <span className="font-semibold text-slate-800">{currentSession?.theme}</span>
            </p>

            <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/80 text-xs text-slate-800">
              <span className="font-bold text-amber-900 block mb-0.5">Pertanyaan Evaluasi Peserta:</span>
              <p className="italic">"{currentSession?.question}"</p>
            </div>
          </div>

          {/* Action Bar for this session */}
          <div className="flex flex-wrap lg:flex-col gap-2 shrink-0">
            <button
              onClick={() => onExportSessionExcel(activeSessionId)}
              className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-sm transition"
              title="Ekspor tabel sesi ini ke spreadsheet Excel"
            >
              <Download className="w-4 h-4" />
              <span>Ekspor Sesi {activeSessionId} ke Excel</span>
            </button>

            <button
              onClick={() => onOpenQRModal(activeSessionId)}
              className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition"
            >
              <QrCode className="w-4 h-4 text-amber-400" />
              <span>Buka QR Code Sesi {activeSessionId}</span>
            </button>

            <button
              onClick={() => onOpenEditSessionModal(currentSession)}
              className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Ubah Pertanyaan / Tema</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, kampus, atau isi jawaban..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Kampus:</span>
            <select
              value={campusFilter}
              onChange={(e) => setCampusFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="ALL">Semua Kampus ({distinctCampuses.length})</option>
              {distinctCampuses.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="ALL">Semua Status</option>
              <option value="Baru Bertumbuh">Baru Bertumbuh</option>
              <option value="Aktif Terbina">Aktif Terbina</option>
              <option value="Butuh Pendampingan">Butuh Pendampingan</option>
              <option value="Pemimpin Mahasiswa">Pemimpin Mahasiswa</option>
            </select>
          </div>

          <span className="text-xs font-semibold text-slate-500 ml-auto">
            {filteredSubmissions.length} dari {submissions.length} data
          </span>
        </div>
      </div>

      {/* Main Table for Current Session */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-bold">
                <th className="py-3.5 px-4 w-12 text-center">No</th>
                <th className="py-3.5 px-4 w-44">Peserta & Kampus</th>
                <th className="py-3.5 px-4 min-w-[280px]">Jawaban Hasil Belajar</th>
                <th className="py-3.5 px-4 w-40">Status & Komitmen</th>
                <th className="py-3.5 px-4 w-32">Waktu Masuk</th>
                <th className="py-3.5 px-4 w-28 text-center">Aksi Kelola</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Memuat data jawaban sesi {activeSessionId}...
                  </td>
                </tr>
              ) : filteredSubmissions.length > 0 ? (
                filteredSubmissions.map((sub, index) => (
                  <tr
                    key={sub.id}
                    className="hover:bg-amber-50/30 transition-colors"
                  >
                    <td className="py-3.5 px-4 text-center font-semibold text-slate-500">
                      {index + 1}
                    </td>

                    {/* Participant Details */}
                    <td className="py-3.5 px-4 align-top">
                      <div className="font-bold text-slate-900 text-sm">
                        {sub.nama}
                      </div>
                      <div className="text-slate-600 font-medium text-[11px] mt-0.5">
                        {sub.asalKampus}
                      </div>
                    </td>

                    {/* Participant Answer */}
                    <td className="py-3.5 px-4 align-top">
                      <p className="text-slate-800 leading-relaxed line-clamp-3">
                        {sub.jawaban}
                      </p>
                      {sub.catatanPembimbing && (
                        <div className="mt-2 p-2 bg-amber-50/70 border border-amber-200 rounded-lg text-[11px] text-amber-900">
                          <span className="font-bold">Catatan Koordinator:</span> {sub.catatanPembimbing}
                        </div>
                      )}
                    </td>

                    {/* Status & Commitment */}
                    <td className="py-3.5 px-4 align-top space-y-1.5">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(sub.statusSpiritual)}`}>
                        {sub.statusSpiritual || 'Baru Bertumbuh'}
                      </span>
                      {sub.komitmenPribadi ? (
                        <div className="text-[11px] text-rose-700 italic line-clamp-2">
                          "{sub.komitmenPribadi}"
                        </div>
                      ) : (
                        <div className="text-[10px] text-slate-400">-</div>
                      )}
                    </td>

                    {/* Timestamp */}
                    <td className="py-3.5 px-4 align-top text-slate-500 whitespace-nowrap text-[11px]">
                      {formatDateTime(sub.timestamp)}
                    </td>

                    {/* Action buttons */}
                    <td className="py-3.5 px-4 align-top text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onViewSubmissionDetail(sub)}
                          title="Lihat Detail & Beri Catatan Pembimbing"
                          className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 transition"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => {
                            if (window.confirm(`Yakin ingin menghapus jawaban dari ${sub.nama}?`)) {
                              onDeleteSubmission(sub.id);
                            }
                          }}
                          title="Hapus Jawaban"
                          className="p-1.5 rounded-lg bg-slate-50 hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="max-w-sm mx-auto space-y-3">
                      <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
                        <BookOpen className="w-6 h-6" />
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm">
                        Belum ada jawaban di Sesi {activeSessionId}
                      </h4>
                      <p className="text-xs text-slate-500">
                        Peserta dapat memindai QR Code di layar untuk mulai mengirimkan refleksi belajar mereka.
                      </p>
                      <button
                        onClick={() => onOpenQRModal(activeSessionId)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-semibold shadow hover:bg-amber-700 transition"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        Tampilkan QR Code Sesi {activeSessionId}
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="p-4 bg-slate-50/60 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <span>
            Menampilkan <b>{filteredSubmissions.length}</b> dari total <b>{submissions.length}</b> jawaban di Tabel Sesi {activeSessionId}
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            {submissions.length > 0 && onClearSessionSubmissions && (
              <button
                onClick={() => {
                  if (window.confirm(`PERINGATAN: Apakah Anda yakin ingin menghapus & MENGOSONGKAN SELURUH JAWABAN di Sesi ${activeSessionId}? Tindakan ini tidak dapat dibatalkan.`)) {
                    onClearSessionSubmissions(activeSessionId);
                  }
                }}
                className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1.5 rounded-xl border border-rose-200 font-semibold flex items-center gap-1.5 transition cursor-pointer"
                title={`Kosongkan seluruh data jawaban di Sesi ${activeSessionId}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Kosongkan Sesi Ini</span>
              </button>
            )}
            <button
              onClick={() => onExportSessionExcel(activeSessionId)}
              className="text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh Rekap Sesi Ini (.xlsx)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
