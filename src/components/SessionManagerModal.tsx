import React, { useState, useEffect } from 'react';
import { X, Save, BookOpen, AlertCircle, PlusCircle, Sparkles, Trash2 } from 'lucide-react';
import { SeminarSession } from '../types';

interface SessionManagerModalProps {
  session?: SeminarSession | null;
  isCreateMode?: boolean;
  suggestedNextId?: number;
  onClose: () => void;
  onSave: (sessionData: Partial<SeminarSession>) => Promise<void>;
  onDelete?: (sessionId: number) => Promise<void>;
}

interface PresetTopic {
  title: string;
  theme: string;
  scripture: string;
  question: string;
}

const PRESET_TOPICS: PresetTopic[] = [
  {
    title: 'Pemberitaan Injil & Misi Pribadi',
    theme: 'Menjadi Saksi Kristus yang Efektif di Kampus',
    scripture: 'Matius 28:19-20; Kisah Para Rasul 1:8',
    question: 'Siapakah 3 orang rekan kampus yang Anda doakan, dan apa langkah nyata Anda untuk bersaksi kepada mereka?'
  },
  {
    title: 'Kekudusan Hidup & Pergaulan Mahasiswa',
    theme: 'Menjaga Kemurnian Hati dan Relasi bagi Kemuliaan Allah',
    scripture: '1 Korintus 6:18-20; 2 Timotius 2:22',
    question: 'Prinsip alkitabiah apa yang paling menegur dan menguatkan Anda dalam menjaga kekudusan pergaulan sehari-hari?'
  },
  {
    title: 'Kepemimpinan Kristiani yang Melayani',
    theme: 'Hati Hamba: Memimpin Menurut Teladan Yesus',
    scripture: 'Markus 10:42-45; Filipi 2:5-8',
    question: 'Bagaimana Anda akan mempraktikkan kepemimpinan yang melayani di kelompok kecil atau persekutuan kampus Anda?'
  },
  {
    title: 'Integritas Studi, Karier, & Panggilan Kerja',
    theme: 'Bekerja dan Belajar bagi Kemuliaan Allah (Coram Deo)',
    scripture: 'Kolose 3:23-24; Daniel 1:8',
    question: 'Bagaimana Anda mempertahankan standar integritas tinggi dalam ujian, tugas akademik, dan rencana karier masa depan?'
  },
  {
    title: 'Disiplin Rohani: Doa & Penggalian Firman',
    theme: 'Membangun Manusia Rohani yang Kokoh Melalui Firman',
    scripture: 'Mazmur 1:1-3; 2 Timotius 3:16-17',
    question: 'Komitmen waktu dan metode apa yang akan Anda tetapkan setiap hari untuk merenungkan Firman dan berdoa secara mendalam?'
  }
];

export const SessionManagerModal: React.FC<SessionManagerModalProps> = ({
  session,
  isCreateMode = false,
  suggestedNextId = 1,
  onClose,
  onSave,
  onDelete
}) => {
  const isCreating = isCreateMode || !session;

  const [sessionId, setSessionId] = useState<number>(session ? session.id : suggestedNextId);
  const [title, setTitle] = useState<string>(
    session ? session.title : `Sesi ${suggestedNextId}: `
  );
  const [theme, setTheme] = useState<string>(session ? session.theme : '');
  const [scripture, setScripture] = useState<string>(session ? session.scripture : '');
  const [speaker, setSpeaker] = useState<string>(session?.speaker || '');
  const [question, setQuestion] = useState<string>(session ? session.question : '');
  const [description, setDescription] = useState<string>(session?.description || '');
  const [isActive, setIsActive] = useState<boolean>(session ? session.isActive : true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (session) {
      setSessionId(session.id);
      setTitle(session.title);
      setTheme(session.theme);
      setScripture(session.scripture);
      setSpeaker(session.speaker || '');
      setQuestion(session.question);
      setDescription(session.description || '');
      setIsActive(session.isActive);
    } else {
      setSessionId(suggestedNextId);
      setTitle(`Sesi ${suggestedNextId}: `);
    }
  }, [session, suggestedNextId]);

  const handleApplyPreset = (preset: PresetTopic) => {
    setTitle(`Sesi ${sessionId}: ${preset.title}`);
    setTheme(preset.theme);
    setScripture(preset.scripture);
    setQuestion(preset.question);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg(null);

    try {
      await onSave({
        id: sessionId,
        title: title.trim(),
        theme: theme.trim() || `Sesi ${sessionId}`,
        scripture: scripture.trim() || 'Alkitab',
        speaker: speaker.trim() || undefined,
        question: question.trim(),
        description: description.trim() || undefined,
        isActive
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan data sesi.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!session || !onDelete) return;
    if (
      window.confirm(
        `PERINGATAN: Apakah Anda yakin ingin MENGHAPUS Sesi ${session.id} (${session.title})? Seluruh data jawaban di sesi ini juga akan dihapus.`
      )
    ) {
      setIsDeleting(true);
      try {
        await onDelete(session.id);
        onClose();
      } catch (err: any) {
        setErrorMsg(err.message || 'Gagal menghapus sesi.');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              {isCreating ? <PlusCircle className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {isCreating ? 'Input Sesi Seminar Baru' : `Kelola Detail Sesi ${session?.id}`}
              </h3>
              <p className="text-xs text-slate-400">
                {isCreating
                  ? 'Tambah sesi baru dengan tabel penyimpanan jawaban terpisah'
                  : 'Atur tema, nats Firman, dan pertanyaan evaluasi hasil belajar'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Preset Topics for Quick Fill */}
          {isCreating && (
            <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-2xl">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Pilihan Topik Cepat (Klik untuk Mengisi Otomatis):</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_TOPICS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className="text-[11px] font-medium bg-white hover:bg-amber-100/80 text-amber-900 border border-amber-300/80 px-2.5 py-1 rounded-lg transition cursor-pointer"
                  >
                    + {preset.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Session Number & Title */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Nomor Sesi
              </label>
              <input
                type="number"
                min="1"
                value={sessionId}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val)) setSessionId(val);
                }}
                disabled={!isCreating}
                required
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 text-slate-900 focus:ring-2 focus:ring-amber-500 disabled:bg-slate-100 disabled:text-slate-500 font-bold text-center"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Judul Lengkap Sesi
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Sesi 8: Hidup yang Berbuah bagi Kristus"
                required
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 text-slate-900 focus:ring-2 focus:ring-amber-500 font-medium"
              />
            </div>
          </div>

          {/* Theme & Scripture */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Tema / Topik Utama
              </label>
              <input
                type="text"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                placeholder="Contoh: Buah Roh dalam Kehidupan Kampus"
                required
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 text-slate-900 focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Nats / Ayat Alkitab
              </label>
              <input
                type="text"
                value={scripture}
                onChange={(e) => setScripture(e.target.value)}
                placeholder="Contoh: Galatia 5:22-23; Yohanes 15:5"
                required
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 text-slate-900 focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Speaker */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Nama Pembicara / Pembimbing (Opsional)
            </label>
            <input
              type="text"
              value={speaker}
              onChange={(e) => setSpeaker(e.target.value)}
              placeholder="Contoh: Pdt. Dr. Yohanes Surya, M.Th."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 text-slate-900 focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Evaluation Question */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Pertanyaan Evaluasi Hasil Belajar Peserta
              </label>
              <span className="text-[11px] text-amber-700 font-medium">
                (Akan dijawab peserta via QR form)
              </span>
            </div>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={3}
              placeholder="Tuliskan pertanyaan refleksi atau pemahaman firman yang harus dijawab peserta setelah sesi ini selesai..."
              required
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 text-slate-900 focus:ring-2 focus:ring-amber-500 leading-relaxed"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Deskripsi / Sasaran Rohani Sesi (Opsional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Sasaran pembelajaran bagi pertumbuhan iman mahasiswa..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 text-slate-900 focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Status Active Switch */}
          <div className="pt-2">
            <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100/60 transition">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
              />
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  Status Penerimaan Jawaban: {isActive ? 'Aktif (Terbuka)' : 'Ditutup Sementara'}
                </span>
                <span className="text-[11px] text-slate-500">
                  {isActive
                    ? 'Peserta dapat langsung mengisi dan mengirimkan jawaban untuk sesi ini.'
                    : 'Form sesi ini ditutup sementara dari pengisian peserta.'}
                </span>
              </div>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex items-center justify-between gap-2 border-t border-slate-200">
            <div>
              {!isCreating && onDelete && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isDeleting ? 'Menghapus...' : 'Hapus Sesi Ini'}</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer transition"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow flex items-center gap-1.5 disabled:opacity-60 cursor-pointer transition"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Menyimpan...' : isCreating ? 'Simpan & Buka Sesi' : 'Simpan Perubahan'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
