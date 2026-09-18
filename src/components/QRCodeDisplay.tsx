import React, { useState, useEffect } from 'react';
import { QrCode, Copy, Check, ExternalLink, Download, Maximize2, Minimize2, Sparkles, BookOpen } from 'lucide-react';
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

  const origin = getOrigin();
  const targetUrl = includeSpecificSession
    ? `${origin}/?mode=form&session=${selectedSessionId}`
    : `${origin}/?mode=form`;

  useEffect(() => {
    setSelectedSessionId(activeSessionId);
  }, [activeSessionId]);

  useEffect(() => {
    QRCode.toDataURL(targetUrl, {
      width: 600,
      margin: 2,
      color: {
        dark: '#1e1b4b', // deep indigo/slate
        light: '#ffffff'
      }
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('QR code error', err));
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
        isFullscreen ? 'fixed inset-0 z-50 p-8 flex flex-col justify-center items-center bg-slate-900 text-white' : 'p-6'
      }`}
    >
      {/* Header */}
      <div className={`flex items-center justify-between pb-4 border-b ${isFullscreen ? 'border-slate-800 w-full max-w-4xl' : 'border-slate-100'} mb-6`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 font-bold">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h3 className={`font-bold text-lg leading-tight ${isFullscreen ? 'text-white' : 'text-slate-900'}`}>
              QR Code Pengisian Jawaban Peserta
            </h3>
            <p className={`text-xs ${isFullscreen ? 'text-slate-400' : 'text-slate-500'}`}>
              Tampilkan di proyektor agar peserta langsung scan dari smartphone
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Keluar Fullscreen' : 'Layar Penuh Proyektor'}
            className={`p-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
              isFullscreen
                ? 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span className="hidden sm:inline">{isFullscreen ? 'Kecilkan' : 'Mode Proyektor'}</span>
          </button>

          {isModal && onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold"
            >
              Tutup
            </button>
          )}
        </div>
      </div>

      {/* Sesi selector pills */}
      <div className={`mb-6 ${isFullscreen ? 'w-full max-w-4xl' : ''}`}>
        <div className="flex items-center justify-between mb-2">
          <label className={`text-xs font-semibold uppercase tracking-wider ${isFullscreen ? 'text-slate-400' : 'text-slate-500'}`}>
            Pilih Target Sesi ({sessions.length} Sesi):
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

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
          {sessions.map((sesi) => {
            const isSelected = selectedSessionId === sesi.id;
            return (
              <button
                key={sesi.id}
                onClick={() => {
                  setSelectedSessionId(sesi.id);
                  if (onSelectSession) onSelectSession(sesi.id);
                }}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition flex flex-col items-center text-center ${
                  isSelected
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20 ring-2 ring-amber-400'
                    : isFullscreen
                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
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
          <div className={`p-4 rounded-xl border ${isFullscreen ? 'bg-slate-800/80 border-slate-700' : 'bg-amber-50/70 border-amber-200/80'} mb-4`}>
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
            <div className={`p-2.5 rounded-lg text-xs italic ${isFullscreen ? 'bg-slate-900/70 text-slate-300' : 'bg-white text-slate-700 border border-amber-100'}`}>
              "{currentSession?.question}"
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyLink}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Tautan Berhasil Disalin!' : 'Salin Tautan Form Peserta'}
              </button>

              <button
                onClick={handleDownloadQR}
                title="Unduh Gambar QR (PNG)"
                className={`p-2.5 rounded-xl border transition ${
                  isFullscreen
                    ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Download className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-between text-[11px] px-1 text-slate-500">
              <span className="truncate max-w-[260px]">
                URL: {targetUrl}
              </span>
              <a
                href={targetUrl}
                target="_blank"
                rel="noreferrer"
                className="text-amber-600 hover:underline flex items-center gap-1 font-medium ml-2 shrink-0"
              >
                Buka Langsung <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
