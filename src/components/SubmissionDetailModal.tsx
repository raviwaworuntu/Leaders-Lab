import React, { useState } from 'react';
import { X, User, School, Calendar, Heart, Shield, Save, Check, Trash2, BookOpen } from 'lucide-react';
import { Submission, SeminarSession } from '../types';

interface SubmissionDetailModalProps {
  submission: Submission | null;
  session?: SeminarSession;
  onClose: () => void;
  onUpdate: (updated: Partial<Submission>) => Promise<void>;
  onDelete: (id: string) => void;
}

export const SubmissionDetailModal: React.FC<SubmissionDetailModalProps> = ({
  submission,
  session,
  onClose,
  onUpdate,
  onDelete
}) => {
  if (!submission) return null;

  const [catatan, setCatatan] = useState<string>(submission.catatanPembimbing || '');
  const [status, setStatus] = useState<string>(submission.statusSpiritual || 'Baru Bertumbuh');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const handleSaveNotes = async () => {
    setIsSaving(true);
    try {
      await onUpdate({
        catatanPembimbing: catatan.trim(),
        statusSpiritual: status as any
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    } catch (err) {
      console.error('Error updating note:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const formatDateTime = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleString('id-ID', {
        dateStyle: 'full',
        timeStyle: 'medium'
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
              <BookOpen className="w-4 h-4" />
              Detail Jawaban • Sesi {submission.sessionId}
            </div>
            <h3 className="text-xl font-bold text-white">
              {submission.nama}
            </h3>
            <p className="text-xs text-slate-300 flex items-center gap-2 mt-1">
              <span>{submission.asalKampus}</span>
              <span>•</span>
              <span className="text-slate-400">{formatDateTime(submission.timestamp)}</span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Sesi Context Box */}
          {session && (
            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs">
              <span className="font-bold text-amber-900 block mb-0.5">
                {session.title} ({session.scripture})
              </span>
              <p className="text-slate-700 italic">
                Pertanyaan: "{session.question}"
              </p>
            </div>
          )}

          {/* Jawaban Lengkap */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Jawaban & Refleksi Hasil Belajar Peserta:
            </label>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-sm leading-relaxed whitespace-pre-wrap font-serif">
              "{submission.jawaban}"
            </div>
          </div>

          {/* Komitmen Pribadi / Pokok Doa */}
          {submission.komitmenPribadi && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-rose-700 mb-2 flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-rose-600" />
                Komitmen Pribadi / Permohonan Doa Khusus:
              </label>
              <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200 text-rose-950 text-xs leading-relaxed whitespace-pre-wrap">
                {submission.komitmenPribadi}
              </div>
            </div>
          )}

          {/* Coordinator / Mentor Spiritual Tracking Section */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
                <Shield className="w-4 h-4 text-amber-600" />
                Catatan Koordinator & Status Pertumbuhan Rohani
              </div>
              {savedSuccess && (
                <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Tersimpan!
                </span>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Klasifikasi Status Rohani Peserta:
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium text-slate-900 focus:ring-2 focus:ring-amber-500"
              >
                <option value="Baru Bertumbuh">Baru Bertumbuh (Perlu Pengenalan Dasar)</option>
                <option value="Aktif Terbina">Aktif Terbina (Konsisten Ikut Pembinaan)</option>
                <option value="Butuh Pendampingan">Butuh Pendampingan (Sedang Ada Pergumulan Khusus)</option>
                <option value="Pemimpin Mahasiswa">Pemimpin Mahasiswa (Potensi Pelayan/Mentor Senior)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Catatan Evaluasi / Rekomendasi Follow Up:
              </label>
              <textarea
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Tuliskan catatan khusus untuk pembimbing, evaluasi kematangan rohani, atau tindak lanjut PA/pemuridan..."
                rows={3}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-amber-500 placeholder:text-slate-400"
              />
            </div>

            <button
              onClick={handleSaveNotes}
              disabled={isSaving}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Menyimpan Catatan...' : 'Simpan Catatan & Status Pertumbuhan'}</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={() => {
              if (window.confirm(`Yakin ingin menghapus jawaban dari ${submission.nama}?`)) {
                onDelete(submission.id);
                onClose();
              }
            }}
            className="text-xs text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-rose-50 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Hapus Data Ini</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow transition"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
