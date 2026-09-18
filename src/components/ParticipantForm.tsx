import React, { useState, useEffect } from 'react';
import { BookOpen, Send, CheckCircle2, User, School, Sparkles, Heart, AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { SeminarSession } from '../types';
import { postSubmission } from '../api';

interface ParticipantFormProps {
  sessions: SeminarSession[];
  initialSessionId?: number;
  onSuccessSubmit?: (sessionId: number) => void;
  onBackToDashboard?: () => void;
  isAdminViewing?: boolean;
}

const COMMON_CAMPUSES = [
  'Universitas Indonesia (UI)',
  'Institut Teknologi Bandung (ITB)',
  'Universitas Gadjah Mada (UGM)',
  'Universitas Kristen Petra',
  'Universitas Pelita Harapan (UPH)',
  'Universitas Airlangga (UNAIR)',
  'Universitas Diponegoro (UNDIP)',
  'Institut Teknologi Sepuluh Nopember (ITS)',
  'Universitas Sebelas Maret (UNS)',
  'Universitas Brawijaya (UB)',
  'Universitas Kristen Satya Wacana (UKSW)',
  'Universitas Kristen Maranatha',
  'Universitas Padjadjaran (UNPAD)',
  'Universitas Sumatera Utara (USU)'
];

export const ParticipantForm: React.FC<ParticipantFormProps> = ({
  sessions,
  initialSessionId = 1,
  onSuccessSubmit,
  onBackToDashboard,
  isAdminViewing = false
}) => {
  const [selectedSessionId, setSelectedSessionId] = useState<number>(initialSessionId);
  const [nama, setNama] = useState<string>('');
  const [asalKampus, setAsalKampus] = useState<string>('');
  const [jawaban, setJawaban] = useState<string>('');
  const [komitmenPribadi, setKomitmenPribadi] = useState<string>('');
  
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submittedSuccess, setSubmittedSuccess] = useState<boolean>(false);
  const [showCampusSuggestions, setShowCampusSuggestions] = useState<boolean>(false);

  useEffect(() => {
    if (initialSessionId && initialSessionId >= 1 && initialSessionId <= 7) {
      setSelectedSessionId(initialSessionId);
    }
  }, [initialSessionId]);

  // Read saved name & campus from localStorage for participant's convenience across multiple sessions
  useEffect(() => {
    const savedName = localStorage.getItem('seminar_participant_name');
    const savedCampus = localStorage.getItem('seminar_participant_campus');
    if (savedName) setNama(savedName);
    if (savedCampus) setAsalKampus(savedCampus);
  }, []);

  const currentSession = sessions.find((s) => s.id === selectedSessionId) || sessions[0];

  const filteredCampuses = COMMON_CAMPUSES.filter(
    (c) => asalKampus && c.toLowerCase().includes(asalKampus.toLowerCase()) && c !== asalKampus
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!nama.trim()) {
      setErrorMsg('Nama lengkap wajib diisi.');
      return;
    }
    if (!asalKampus.trim()) {
      setErrorMsg('Asal kampus / universitas wajib diisi.');
      return;
    }
    if (!jawaban.trim()) {
      setErrorMsg('Jawaban / hasil belajar sesi ini wajib diisi.');
      return;
    }

    setSubmitting(true);

    try {
      const result = await postSubmission({
        sessionId: selectedSessionId,
        nama: nama.trim(),
        asalKampus: asalKampus.trim(),
        jawaban: jawaban.trim(),
        komitmenPribadi: komitmenPribadi.trim() || undefined
      });

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Gagal mengirim jawaban.');
      }

      // Save name & campus to facilitate filling the remaining sessions
      localStorage.setItem('seminar_participant_name', nama.trim());
      localStorage.setItem('seminar_participant_campus', asalKampus.trim());

      setSubmittedSuccess(true);
      if (onSuccessSubmit) {
        onSuccessSubmit(selectedSessionId);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan jaringan.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetForNextSession = () => {
    setJawaban('');
    setKomitmenPribadi('');
    setSubmittedSuccess(false);
    // Suggest next session
    if (selectedSessionId < 7) {
      setSelectedSessionId((prev) => prev + 1);
    }
  };

  if (submittedSuccess) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12">
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Puji Tuhan, Jawaban Terkirim!
          </h2>
          <p className="text-sm text-slate-600 mb-6 leading-relaxed">
            Terima kasih, Saudara <span className="font-semibold text-slate-800">{nama}</span> ({asalKampus}).
            Refleksi hasil belajar untuk <span className="font-semibold text-amber-700">{currentSession?.title}</span> telah
            tersimpan ke dalam database evaluasi rohani koordinator seminar.
          </p>

          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-left mb-6">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-800 uppercase mb-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              Doa & Firman Penguat
            </div>
            <p className="text-xs italic text-slate-700 leading-relaxed mb-1">
              "Tetapi bertumbuhlah dalam kasih karunia dan dalam pengenalan akan Tuhan dan Juruselamat kita, Yesus Kristus. Bagi-Nya kemuliaan, sekarang dan sampai selama-lamanya."
            </p>
            <p className="text-[11px] font-semibold text-amber-700 text-right">— 2 Petrus 3:18</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {selectedSessionId < 7 ? (
              <button
                onClick={handleResetForNextSession}
                className="flex-1 px-5 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm shadow-md transition flex items-center justify-center gap-2"
              >
                <span>Lanjut Isi Sesi {selectedSessionId + 1}</span>
              </button>
            ) : (
              <button
                onClick={() => setSubmittedSuccess(false)}
                className="flex-1 px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm shadow-md transition"
              >
                Isi Sesi Lainnya
              </button>
            )}

            {onBackToDashboard && (
              <button
                onClick={onBackToDashboard}
                className="px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition"
              >
                Kembali ke Dashboard
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Top Banner & Session Indicator */}
      <div className="mb-6 flex items-center justify-between">
        {onBackToDashboard && (
          <button
            onClick={onBackToDashboard}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition py-1 px-2.5 rounded-lg bg-white border border-slate-200 shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {isAdminViewing ? 'Kembali ke Panel Koordinator' : 'Beranda Seminar'}
          </button>
        )}

        <div className="ml-auto text-xs text-slate-500 font-medium bg-amber-50 text-amber-800 px-3 py-1 rounded-full border border-amber-200">
          Form Peserta • 7 Sesi Pembelajaran
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        {/* Header decoration */}
        <div className="bg-gradient-to-r from-amber-700 via-amber-800 to-slate-900 p-6 text-white relative">
          <div className="flex items-center gap-2 text-amber-200 text-xs font-bold tracking-wider uppercase mb-1">
            <BookOpen className="w-4 h-4" />
            Seminar Rohani Mahasiswa Kristen
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            Form Hasil Belajar & Pertumbuhan Rohani
          </h1>
          <p className="text-xs text-amber-100/90 mt-1 max-w-xl">
            Tuliskan apa yang Tuhan taruh di hati Saudara melalui sesi ini. Jawaban ini menjadi bekal doa dan perhatian bagi koordinator rohani.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          {errorMsg && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. Sesi Selector (1 through 7) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Pilih Sesi Seminar (Sesi 1 s/d 7):
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
              {sessions.map((sesi) => {
                const isSelected = selectedSessionId === sesi.id;
                return (
                  <button
                    key={sesi.id}
                    type="button"
                    onClick={() => setSelectedSessionId(sesi.id)}
                    className={`py-2 px-2 rounded-xl text-xs font-semibold transition border ${
                      isSelected
                        ? 'bg-amber-600 text-white border-amber-600 shadow-md ring-2 ring-amber-300'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div>Sesi {sesi.id}</div>
                    <div className="text-[10px] opacity-80 truncate">
                      {sesi.title.replace(`Sesi ${sesi.id}:`, '').trim()}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sesi Detail Spotlight */}
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-slate-800">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-amber-800">
                {currentSession?.title}
              </span>
              <span className="text-[11px] font-semibold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-md">
                Nats: {currentSession?.scripture}
              </span>
            </div>
            <div className="text-sm font-semibold text-slate-900 mb-2">
              Tema: "{currentSession?.theme}"
            </div>
            <div className="text-xs font-medium text-slate-700 bg-white p-3 rounded-xl border border-amber-200/60 shadow-xs">
              <span className="font-bold text-amber-800 block mb-1">Pertanyaan Evaluasi Sesi Ini:</span>
              <p className="italic text-slate-800">"{currentSession?.question}"</p>
            </div>
          </div>

          {/* 2. Detail Peserta: Nama & Asal Kampus */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-500" />
                Nama Lengkap Peserta <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="Contoh: Jonathan Aditya"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition"
              />
            </div>

            <div className="relative">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                <School className="w-3.5 h-3.5 text-slate-500" />
                Asal Kampus / Universitas <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={asalKampus}
                onChange={(e) => {
                  setAsalKampus(e.target.value);
                  setShowCampusSuggestions(true);
                }}
                onFocus={() => setShowCampusSuggestions(true)}
                onBlur={() => setTimeout(() => setShowCampusSuggestions(false), 250)}
                placeholder="Contoh: Universitas Indonesia"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition"
              />

              {/* Suggestions Dropdown */}
              {showCampusSuggestions && filteredCampuses.length > 0 && (
                <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                  {filteredCampuses.slice(0, 6).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onMouseDown={() => {
                        setAsalKampus(c);
                        setShowCampusSuggestions(false);
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-amber-50 hover:text-amber-900 transition flex items-center justify-between"
                    >
                      <span>{c}</span>
                      <span className="text-[10px] text-slate-400">Pilih</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 3. Detail: Jawaban Peserta */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                Jawaban Hasil Belajar & Refleksi Rohani <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400">
                {jawaban.length} karakter
              </span>
            </div>
            <textarea
              value={jawaban}
              onChange={(e) => setJawaban(e.target.value)}
              placeholder="Tuliskan pemahaman Firman, hikmat baru, atau teguran Roh Kudus yang Anda dapatkan dari materi sesi ini..."
              rows={5}
              required
              className="w-full px-3.5 py-3 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition placeholder:text-slate-400 leading-relaxed"
            />
          </div>

          {/* 4. Optional: Komitmen Rohani / Pokok Doa */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-rose-500" />
              Komitmen Pribadi / Pokok Doa untuk Pembimbing (Opsional)
            </label>
            <textarea
              value={komitmenPribadi}
              onChange={(e) => setKomitmenPribadi(e.target.value)}
              placeholder="Ada pergumulan pribadi atau komitmen khusus yang ingin Saudara doakan bersama koordinator/pembimbing rohani?"
              rows={2}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition placeholder:text-slate-400 leading-relaxed"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 px-6 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-[0.99] text-white font-bold text-sm shadow-lg shadow-amber-600/25 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {submitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Menyimpan Jawaban ke Tabel Sesi {selectedSessionId}...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Kirim Jawaban Hasil Belajar Sesi {selectedSessionId}</span>
              </>
            )}
          </button>

          <p className="text-[11px] text-center text-slate-500">
            Jawaban Saudara disimpan ke dalam tabel terpisah Sesi {selectedSessionId} dan hanya dapat diakses oleh tim koordinator seminar demi perhatian rohani.
          </p>
        </form>
      </div>
    </div>
  );
};
