import React, { useState, useEffect } from 'react';
import { 
  QrCode, 
  Copy, 
  Check, 
  ExternalLink, 
  Download, 
  Maximize2, 
  Minimize2, 
  Sparkles, 
  BookOpen,
  Globe,
  Share2,
  AlertTriangle,
  Info,
  Settings2
} from 'lucide-react';
import QRCode from 'qrcode';
import { SeminarSession } from '../types';

interface QRCodeDisplayProps {
  sessions: SeminarSession[];
  activeSessionId?: number;
  onSelectSession?: (id: number) => void;
  isModal?: boolean;
  onClose?: () => void;
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  sessions,
  activeSessionId = 1,
  onSelectSession,
  isModal = false,
  onClose
}) => {
  const [selectedSessionId, setSelectedSessionId] = useState<number>(activeSessionId);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [includeSpecificSession, setIncludeSpecificSession] = useState<boolean>(true);
  const [showUrlSettings, setShowUrlSettings] = useState<boolean>(false);

  const currentSession = sessions.find((s) => s.id === selectedSessionId) || sessions[0];

  // Calculate target URL safely
  const getOrigin = () => {
    try {
      if (typeof window !== 'undefined' && window.location.origin && window.location.origin !== 'null') {
        return window.location.origin;
      }
      return `${window.location.protocol}//${window.location.host}`;
    } catch {
      return '';
    }
  };

  const rawOrigin = getOrigin();
  const isAisDev = rawOrigin.includes('ais-dev-');
  const suggestedPublicOrigin = isAisDev 
    ? rawOrigin.replace('ais-dev-', 'ais-pre-') 
    : rawOrigin;

  // Base URL state: 'public' (ais-pre for general participants), 'dev' (current origin), or 'custom'
  const [urlMode, setUrlMode] = useState<'public' | 'dev' | 'custom'>(() => {
    const saved = localStorage.getItem('seminar_qr_url_mode');
    if (saved === 'public' || saved === 'dev' || saved === 'custom') return saved;
    return isAisDev ? 'public' : 'dev';
  });

  const [customBaseUrl, setCustomBaseUrl] = useState<string>(() => {
    return localStorage.getItem('seminar_qr_custom_base_url') || (isAisDev ? suggestedPublicOrigin : rawOrigin);
  });

  // Determine active base domain
  const activeBaseDomain = urlMode === 'public'
    ? suggestedPublicOrigin
    : urlMode === 'dev'
    ? rawOrigin
    : customBaseUrl.trim();

  // Clean trailing slash
  const cleanBaseDomain = activeBaseDomain.replace(/\/+$/, '');

  const targetUrl = includeSpecificSession
    ? `${cleanBaseDomain}/?mode=form&session=${selectedSessionId}`
    : `${cleanBaseDomain}/?mode=form`;

  useEffect(() => {
    setSelectedSessionId(activeSessionId);
  }, [activeSessionId]);

  // Persist URL mode selection
  const handleSelectUrlMode = (mode: 'public' | 'dev' | 'custom') => {
    setUrlMode(mode);
    localStorage.setItem('seminar_qr_url_mode', mode);
  };

  const handleSaveCustomUrl = (newUrl: string) => {
    setCustomBaseUrl(newUrl);
    localStorage.setItem('seminar_qr_custom_base_url', newUrl);
  };

  useEffect(() => {
    QRCode.toDataURL(targetUrl, {
      width: 650,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#1e1b4b', // deep indigo/slate
        light: '#ffffff'
      }
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('QR code generation error', err));
  }, [targetUrl]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(targetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadQR = () => {
    const link = document.createElement('a');
    link.download = `QRCode_Seminar_Sesi_${selectedSessionId}.png`;
    link.href = qrDataUrl;
    link.click();
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      const elem = document.getElementById('qr-presenter-box');
      if (elem?.requestFullscreen) {
        elem.requestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  return (
    <div
      id="qr-presenter-box"
      className={`bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden transition-all ${
        isFullscreen ? 'fixed inset-0 z-50 p-6 sm:p-8 flex flex-col justify-center items-center bg-slate-950 text-white overflow-y-auto' : 'p-6'
      }`}
    >
      {/* Header */}
      <div className={`flex items-center justify-between pb-4 border-b ${isFullscreen ? 'border-slate-800 w-full max-w-4xl' : 'border-slate-100'} mb-5`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 font-bold">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h3 className={`font-bold text-lg leading-tight ${isFullscreen ? 'text-white' : 'text-slate-900'}`}>
              QR Code Pengisian Formulir Peserta
            </h3>
            <p className={`text-xs ${isFullscreen ? 'text-slate-400' : 'text-slate-500'}`}>
              Tampilkan di proyektor agar peserta langsung scan dari smartphone
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isFullscreen && (
            <button
              onClick={() => setShowUrlSettings(!showUrlSettings)}
              className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                showUrlSettings
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
              title="Pengaturan Domain & URL QR Code"
            >
              <Settings2 className="w-4 h-4 text-amber-600" />
              <span className="hidden sm:inline">Pilihan Link HP</span>
            </button>
          )}

          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Keluar Layar Penuh' : 'Mode Layar Penuh Proyektor'}
            className={`p-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
              isFullscreen
                ? 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span className="hidden sm:inline">{isFullscreen ? 'Kecilkan' : 'Layar Penuh'}</span>
          </button>

          {isModal && onClose && (
            <button
              onClick={onClose}
              className="p-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
            >
              Tutup
            </button>
          )}
        </div>
      </div>

      {/* URL Setting & Error Prevention Banner */}
      {!isFullscreen && (
        <div className="mb-5 space-y-3">
          {/* Diagnostic Info Banner for Mobile Scan Error */}
          {urlMode === 'dev' && isAisDev ? (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-bold text-rose-900">
                  Penyebab Peserta Gagal / Error Saat Scan di HP:
                </div>
                <p className="text-rose-700 leading-relaxed">
                  Kode QR saat ini mengarah ke link pengembang (<code className="font-semibold text-rose-900">ais-dev-...</code>) yang meminta login akun Google pemilik project.
                  Gantilah ke <strong>"URL Publik (ais-pre)"</strong> di bawah agar peserta seminar dapat membukanya dengan lancar tanpa cookie error.
                </p>
                <button
                  onClick={() => handleSelectUrlMode('public')}
                  className="mt-1 px-3 py-1 bg-rose-700 hover:bg-rose-800 text-white rounded-lg font-bold text-[11px] shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Alihkan ke URL Publik Sekarang (Disarankan)</span>
                </button>
              </div>
            </div>
          ) : urlMode === 'public' && isAisDev ? (
            <div className="p-3.5 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
              <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-amber-900">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  QR Code Siap untuk Peserta (URL Publik Tanpa Login)
                </div>
                <p className="text-amber-800/90 leading-relaxed">
                  Kode QR diarahkan ke link publik (<code className="font-semibold text-amber-950">ais-pre-...</code>).
                  Pastikan Anda sudah mengklik tombol <strong>"Share"</strong> di pojok kanan atas Google AI Studio agar link publik ini aktif dan dapat diakses peserta dari semua smartphone.
                </p>
              </div>
            </div>
          ) : null}

          {/* Quick Base URL Switcher Tabs */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 font-bold text-slate-700">
              <Globe className="w-4 h-4 text-amber-600" />
              <span>Target URL Peserta:</span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleSelectUrlMode('public')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  urlMode === 'public'
                    ? 'bg-amber-600 text-white shadow-xs font-bold'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Check className={`w-3.5 h-3.5 ${urlMode === 'public' ? 'opacity-100' : 'opacity-0'}`} />
                <span>URL Publik (ais-pre)</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectUrlMode('dev')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  urlMode === 'dev'
                    ? 'bg-slate-800 text-white shadow-xs font-bold'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Check className={`w-3.5 h-3.5 ${urlMode === 'dev' ? 'opacity-100' : 'opacity-0'}`} />
                <span>URL Dev (ais-dev)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  handleSelectUrlMode('custom');
                  setShowUrlSettings(true);
                }}
                className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  urlMode === 'custom'
                    ? 'bg-amber-700 text-white shadow-xs font-bold'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Check className={`w-3.5 h-3.5 ${urlMode === 'custom' ? 'opacity-100' : 'opacity-0'}`} />
                <span>Kustom URL</span>
              </button>
            </div>
          </div>

          {/* Custom URL Input Field (if selected or toggled) */}
          {(showUrlSettings || urlMode === 'custom') && (
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2 text-xs">
              <label className="block font-bold text-slate-700">
                Alamat Domain / Host Manual (jika memakai domain sendiri atau URL lain):
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customBaseUrl}
                  onChange={(e) => handleSaveCustomUrl(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
                <button
                  type="button"
                  onClick={() => handleSelectUrlMode('custom')}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg cursor-pointer transition"
                >
                  Terapkan
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                URL aktif saat ini: <span className="font-mono text-amber-700 font-semibold">{cleanBaseDomain}</span>
              </p>
            </div>
          )}
        </div>
      )}

      {/* Sesi selector pills */}
      <div className={`mb-6 ${isFullscreen ? 'w-full max-w-4xl' : ''}`}>
        <div className="flex items-center justify-between mb-2">
          <label className={`text-xs font-semibold uppercase tracking-wider ${isFullscreen ? 'text-slate-400' : 'text-slate-500'}`}>
            Pilih Target Sesi ({sessions.length} Sesi Terdaftar):
          </label>
          <label className="flex items-center gap-2 text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={includeSpecificSession}
              onChange={(e) => setIncludeSpecificSession(e.target.checked)}
              className="rounded text-amber-600 focus:ring-amber-500"
            />
            <span className={isFullscreen ? 'text-slate-300' : 'text-slate-600'}>Kunci langsung ke sesi ini</span>
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          {sessions.map((sesi) => {
            const isSelected = selectedSessionId === sesi.id;
            return (
              <button
                key={sesi.id}
                onClick={() => {
                  setSelectedSessionId(sesi.id);
                  if (onSelectSession) onSelectSession(sesi.id);
                }}
                className={`flex-1 min-w-[100px] px-3 py-2 rounded-xl text-xs font-semibold transition flex flex-col items-center text-center cursor-pointer ${
                  isSelected
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20 ring-2 ring-amber-400'
                    : isFullscreen
                    ? 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                    : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>Sesi {sesi.id}</span>
                <span className="text-[10px] opacity-80 truncate max-w-full font-normal">
                  {sesi.title.split(':')[1]?.trim() || `Sesi ${sesi.id}`}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content & QR Card */}
      <div className={`flex flex-col md:flex-row items-center justify-center gap-8 ${isFullscreen ? 'w-full max-w-4xl py-4' : ''}`}>
        {/* The QR Code frame */}
        <div className="flex flex-col items-center">
          <div className="p-4 bg-white rounded-2xl shadow-lg border border-slate-200 relative group">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`QR Code Sesi ${selectedSessionId}`}
                className="w-56 h-56 sm:w-64 sm:h-64 object-contain rounded-lg"
              />
            ) : (
              <div className="w-56 h-56 flex items-center justify-center text-slate-400 text-sm">
                Membuat QR Code...
              </div>
            )}
            <div className="absolute inset-x-0 bottom-6 flex justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition">
              <span className="px-3 py-1 bg-slate-900/90 text-white text-[11px] rounded-full shadow pointer-events-auto">
                Scan via Kamera / Google Lens
              </span>
            </div>
          </div>

          <p className={`mt-3 text-xs text-center font-medium ${isFullscreen ? 'text-slate-400' : 'text-slate-500'}`}>
            Arahkan kamera HP peserta ke kode QR di atas
          </p>
        </div>

        {/* Instructions & Session Info */}
        <div className="flex-1 max-w-md text-left">
          <div className={`p-4 rounded-xl border ${isFullscreen ? 'bg-slate-900 border-slate-800' : 'bg-amber-50/70 border-amber-200/80'} mb-4`}>
            <div className="flex items-center gap-2 mb-1.5">
              <BookOpen className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wide">
                {currentSession?.title}
              </span>
            </div>
            <h4 className={`text-base font-bold mb-1 ${isFullscreen ? 'text-white' : 'text-slate-900'}`}>
              {currentSession?.theme}
            </h4>
            <p className={`text-xs mb-2 ${isFullscreen ? 'text-slate-300' : 'text-slate-600'}`}>
              Nats Alkitab: <span className="font-semibold text-amber-600">{currentSession?.scripture}</span>
            </p>
            <div className={`p-2.5 rounded-lg text-xs italic ${isFullscreen ? 'bg-slate-950 text-slate-300 border border-slate-800' : 'bg-white text-slate-700 border border-amber-100'}`}>
              "{currentSession?.question}"
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyLink}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Tautan Berhasil Disalin!' : 'Salin Tautan Form Peserta'}</span>
              </button>

              <button
                onClick={handleDownloadQR}
                title="Unduh Gambar QR (PNG)"
                className={`p-2.5 rounded-xl border transition cursor-pointer ${
                  isFullscreen
                    ? 'bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Download className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-between text-[11px] px-1 text-slate-500">
              <span className="truncate max-w-[240px] font-mono text-[10px]" title={targetUrl}>
                {targetUrl}
              </span>
              <a
                href={targetUrl}
                target="_blank"
                rel="noreferrer"
                className="text-amber-600 hover:underline flex items-center gap-1 font-medium ml-2 shrink-0"
              >
                Uji Buka di Tab Baru <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

