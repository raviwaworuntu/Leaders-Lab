/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  BookOpen, 
  QrCode, 
  Download, 
  LayoutDashboard, 
  Table, 
  Smartphone, 
  RefreshCw, 
  Shield, 
  Sparkles, 
  Activity, 
  Check, 
  HeartHandshake,
  FileSpreadsheet,
  Trash2,
  PlusCircle
} from 'lucide-react';
import { SeminarSession, Submission, SeminarStats } from './types';
import { 
  getSessions, 
  getStats, 
  getSubmissions, 
  deleteSubmission, 
  clearSessionSubmissions, 
  clearAllSubmissions, 
  updateSubmission, 
  updateSession,
  createSession,
  deleteSession
} from './api';
import { RealtimeDashboard } from './components/RealtimeDashboard';
import { SessionDataTable } from './components/SessionDataTable';
import { ParticipantForm } from './components/ParticipantForm';
import { QRCodeDisplay } from './components/QRCodeDisplay';
import { SubmissionDetailModal } from './components/SubmissionDetailModal';
import { SessionManagerModal } from './components/SessionManagerModal';

export default function App() {
  // Navigation & mode
  const [appMode, setAppMode] = useState<'admin' | 'form'>('admin');
  const [adminTab, setAdminTab] = useState<'dashboard' | 'tables' | 'qrcode'>('dashboard');
  const [activeSessionId, setActiveSessionId] = useState<number>(1);

  // Data states
  const [sessions, setSessions] = useState<SeminarSession[]>([]);
  const [sessionSubmissions, setSessionSubmissions] = useState<Submission[]>([]);
  const [stats, setStats] = useState<SeminarStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Modals
  const [showQRModal, setShowQRModal] = useState<boolean>(false);
  const [qrModalSessionId, setQrModalSessionId] = useState<number>(1);
  const [detailSubmission, setDetailSubmission] = useState<Submission | null>(null);
  const [editingSession, setEditingSession] = useState<SeminarSession | null>(null);
  const [isCreatingSession, setIsCreatingSession] = useState<boolean>(false);

  // Check URL query parameters for direct scan flow: e.g. /?mode=form&session=3
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const modeParam = params.get('mode');
    const sessionParam = params.get('session');

    if (modeParam === 'form' || sessionParam) {
      setAppMode('form');
    }
    if (sessionParam) {
      const parsedSId = parseInt(sessionParam, 10);
      if (!isNaN(parsedSId) && parsedSId >= 1) {
        setActiveSessionId(parsedSId);
        setQrModalSessionId(parsedSId);
      }
    }
  }, []);

  // Fetch sessions list
  const fetchSessions = useCallback(async () => {
    try {
      const data = await getSessions();
      if (data) {
        setSessions(data);
      }
    } catch {
      // Handled inside safeFetchJson
    }
  }, []);

  // Fetch real-time stats
  const fetchStats = useCallback(async () => {
    try {
      const data = await getStats();
      if (data) {
        setStats(data);
        setLastUpdated(new Date());
      }
    } catch {
      // Handled inside safeFetchJson
    }
  }, []);

  // Fetch submissions for currently active session
  const fetchSubmissionsForSession = useCallback(async (sId: number) => {
    if (!sId || isNaN(sId)) return;
    try {
      const data = await getSubmissions(sId);
      if (data) {
        setSessionSubmissions(data);
      }
    } catch {
      // Handled inside safeFetchJson
    }
  }, []);

  // Initial load
  useEffect(() => {
    let isMounted = true;
    const loadAll = async () => {
      setIsLoading(true);
      await Promise.all([fetchSessions(), fetchStats(), fetchSubmissionsForSession(activeSessionId)]);
      if (isMounted) {
        setIsLoading(false);
      }
    };
    loadAll();
    return () => {
      isMounted = false;
    };
  }, [fetchSessions, fetchStats, fetchSubmissionsForSession, activeSessionId]);

  // Real-time polling every 6 seconds in admin mode
  useEffect(() => {
    if (appMode !== 'admin') return;

    let isPolling = true;
    const interval = setInterval(async () => {
      if (!isPolling) return;
      await fetchStats();
      if (!isPolling) return;
      await fetchSubmissionsForSession(activeSessionId);
    }, 6000);

    return () => {
      isPolling = false;
      clearInterval(interval);
    };
  }, [appMode, activeSessionId, fetchStats, fetchSubmissionsForSession]);

  // Switch session tab
  const handleSelectSession = (sId: number) => {
    setActiveSessionId(sId);
    fetchSubmissionsForSession(sId);
  };

  // Open QR modal for specific session
  const handleOpenQRModal = (sId?: number) => {
    if (sId) setQrModalSessionId(sId);
    else setQrModalSessionId(activeSessionId);
    setShowQRModal(true);
  };

  // Export single session to Excel
  const handleExportSessionExcel = (sId: number) => {
    const downloadUrl = `/api/export/excel?sessionId=${sId}`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', `Rekapitulasi_Seminar_Sesi_${sId}.xlsx`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export master workbook with all 7 sessions to Excel
  const handleExportMasterExcel = () => {
    setIsExporting(true);
    const downloadUrl = `/api/export/excel`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', `Rekapitulasi_Seminar_Rohani_7_Sesi.xlsx`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => setIsExporting(false), 1500);
  };

  // Delete submission
  const handleDeleteSubmission = async (id: string) => {
    const ok = await deleteSubmission(id);
    if (ok) {
      fetchSubmissionsForSession(activeSessionId);
      fetchStats();
      fetchSessions();
    }
  };

  // Clear all submissions for a specific session
  const handleClearSessionSubmissions = async (sId: number) => {
    const ok = await clearSessionSubmissions(sId);
    if (ok) {
      fetchSubmissionsForSession(sId);
      fetchStats();
      fetchSessions();
    }
  };

  // Clear all submissions across all 7 sessions
  const handleClearAllSubmissions = async () => {
    const ok = await clearAllSubmissions();
    if (ok) {
      fetchSubmissionsForSession(activeSessionId);
      fetchStats();
      fetchSessions();
    }
  };

  // Update submission detail (notes, spiritual status)
  const handleUpdateSubmission = async (updated: Partial<Submission>) => {
    if (!detailSubmission) return;
    const updatedSub = await updateSubmission(detailSubmission.id, updated);
    if (updatedSub) {
      setDetailSubmission(updatedSub);
      fetchSubmissionsForSession(activeSessionId);
      fetchStats();
    }
  };

  // Update session settings
  const handleSaveSession = async (updatedSession: Partial<SeminarSession>) => {
    if (!editingSession) return;
    const updated = await updateSession(editingSession.id, updatedSession);
    if (updated) {
      await fetchSessions();
    }
  };

  // Create new session
  const handleCreateSession = async (newSessionData: Partial<SeminarSession>) => {
    const res = await createSession(newSessionData);
    if (res.success && res.data) {
      await fetchSessions();
      await fetchStats();
      setActiveSessionId(res.data.id);
      await fetchSubmissionsForSession(res.data.id);
      setIsCreatingSession(false);
    } else {
      throw new Error(res.error || 'Gagal menambahkan sesi baru.');
    }
  };

  // Delete session
  const handleDeleteSession = async (sessionId: number) => {
    const ok = await deleteSession(sessionId);
    if (ok) {
      await fetchSessions();
      await fetchStats();
      const remaining = sessions.filter((s) => s.id !== sessionId);
      if (remaining.length > 0) {
        setActiveSessionId(remaining[0].id);
        fetchSubmissionsForSession(remaining[0].id);
      }
      setEditingSession(null);
    } else {
      throw new Error('Gagal menghapus sesi.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 font-sans flex flex-col">
      {/* App Top Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Brand Identity */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-800 text-white flex items-center justify-center shadow-md shadow-amber-600/20 font-serif font-bold text-lg">
                ✝
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-extrabold text-sm sm:text-base text-slate-900 tracking-tight leading-none">
                    Portal Evaluasi Seminar Rohani
                  </h1>
                  <span className="hidden md:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                    {sessions.length} Sesi Belajar
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Pemantauan Hasil Belajar & Pertumbuhan Rohani Mahasiswa
                </p>
              </div>
            </div>

            {/* Mobile View Toggle */}
            <div className="sm:hidden">
              <button
                onClick={() => setAppMode(appMode === 'admin' ? 'form' : 'admin')}
                className="px-2.5 py-1.5 rounded-xl bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200 flex items-center gap-1"
              >
                {appMode === 'admin' ? <Smartphone className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
                <span>{appMode === 'admin' ? 'Form' : 'Admin'}</span>
              </button>
            </div>
          </div>

          {/* Navigation & Controls */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            {/* Mode Switcher Buttons */}
            <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200 text-xs font-semibold">
              <button
                onClick={() => setAppMode('admin')}
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                  appMode === 'admin'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-amber-600" />
                <span>Panel Koordinator</span>
              </button>

              <button
                onClick={() => setAppMode('form')}
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                  appMode === 'form'
                    ? 'bg-amber-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Mode Peserta (Form HP)</span>
              </button>
            </div>

            {/* Master Excel Export, Input Sesi & Reset Controls */}
            {appMode === 'admin' && (
              <div className="hidden sm:flex items-center gap-2">
                <button
                  onClick={() => setIsCreatingSession(true)}
                  title="Tambah / input sesi seminar rohani baru ke dalam sistem"
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm transition cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>+ Input Sesi Baru</span>
                </button>

                <button
                  onClick={handleExportMasterExcel}
                  disabled={isExporting}
                  title="Unduh seluruh rekapitulasi data jawaban seminar ke format Excel (.xlsx)"
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-sm transition cursor-pointer disabled:opacity-60"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>{isExporting ? 'Mengunduh...' : 'Ekspor Master Excel (.xlsx)'}</span>
                </button>

                {(stats?.totalSubmissions || 0) > 0 && (
                  <button
                    onClick={() => {
                      if (window.confirm(`PERINGATAN: Apakah Anda yakin ingin MENGHAPUS SEMUA DATA evaluasi di ${sessions.length} sesi seminar? Seluruh jawaban peserta akan dikosongkan. Tindakan ini tidak dapat dibatalkan.`)) {
                        handleClearAllSubmissions();
                      }
                    }}
                    title="Kosongkan seluruh data jawaban di semua sesi seminar"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 hover:border-rose-300 text-xs font-semibold transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Kosongkan Data</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {appMode === 'form' ? (
          /* Participant Form View */
          <ParticipantForm
            sessions={sessions}
            initialSessionId={activeSessionId}
            onSuccessSubmit={(sId) => {
              fetchStats();
              fetchSubmissionsForSession(sId);
            }}
            onBackToDashboard={() => setAppMode('admin')}
            isAdminViewing={true}
          />
        ) : (
          /* Admin / Coordinator View */
          <div className="space-y-6">
            {/* Secondary Admin Navigation Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAdminTab('dashboard')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                    adminTab === 'dashboard'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard Real-Time</span>
                </button>

                <button
                  onClick={() => setAdminTab('tables')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                    adminTab === 'tables'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <Table className="w-4 h-4" />
                  <span>Tabel 7 Sesi Terpisah</span>
                </button>

                <button
                  onClick={() => setAdminTab('qrcode')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                    adminTab === 'qrcode'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  <span>Layar QR Code</span>
                </button>
              </div>

              {/* Mobile Excel Export & Sync info */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportMasterExcel}
                  className="sm:hidden flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-700 text-white text-xs font-bold"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Ekspor Excel</span>
                </button>

                <div className="text-[11px] text-slate-500 flex items-center gap-1.5 px-2 py-1 bg-slate-50 rounded-lg">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                  <span className="hidden md:inline">Terakhir sinkron:</span>
                  <span>{lastUpdated.toLocaleTimeString('id-ID')}</span>
                </div>
              </div>
            </div>

            {/* Active Admin View */}
            {adminTab === 'dashboard' && (
              <RealtimeDashboard
                sessions={sessions}
                stats={stats}
                onSelectSessionTab={(sId) => {
                  handleSelectSession(sId);
                  setAdminTab('tables');
                }}
                onOpenQRModal={handleOpenQRModal}
                onOpenCreateSessionModal={() => setIsCreatingSession(true)}
                onViewSubmissionDetail={(sub) => setDetailSubmission(sub)}
                lastUpdated={lastUpdated}
                onRefresh={() => {
                  fetchStats();
                  fetchSubmissionsForSession(activeSessionId);
                }}
                isLoading={isLoading}
              />
            )}

            {adminTab === 'tables' && (
              <SessionDataTable
                sessions={sessions}
                activeSessionId={activeSessionId}
                onSelectSession={handleSelectSession}
                submissions={sessionSubmissions}
                onDeleteSubmission={handleDeleteSubmission}
                onClearSessionSubmissions={handleClearSessionSubmissions}
                onClearAllSubmissions={handleClearAllSubmissions}
                onViewSubmissionDetail={(sub) => setDetailSubmission(sub)}
                onOpenQRModal={handleOpenQRModal}
                onOpenEditSessionModal={(s) => setEditingSession(s)}
                onOpenCreateSessionModal={() => setIsCreatingSession(true)}
                onExportSessionExcel={handleExportSessionExcel}
                isLoading={isLoading}
              />
            )}

            {adminTab === 'qrcode' && (
              <QRCodeDisplay
                sessions={sessions}
                activeSessionId={activeSessionId}
                onSelectSession={handleSelectSession}
              />
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            © {new Date().getFullYear()} Sistem Informasi Seminar Rohani Kristen • Soli Deo Gloria
          </span>
          <span className="text-[11px] text-slate-400">
            Dikelola oleh Koordinator Rohani untuk pemantauan pertumbuhan peserta
          </span>
        </div>
      </footer>

      {/* Global QR Code Modal */}
      {showQRModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="max-w-3xl w-full my-8 animate-in fade-in zoom-in-95">
            <QRCodeDisplay
              sessions={sessions}
              activeSessionId={qrModalSessionId}
              onSelectSession={(sId) => setQrModalSessionId(sId)}
              isModal={true}
              onClose={() => setShowQRModal(false)}
            />
          </div>
        </div>
      )}

      {/* Submission Detail & Mentor Notes Modal */}
      {detailSubmission && (
        <SubmissionDetailModal
          submission={detailSubmission}
          session={sessions.find((s) => s.id === detailSubmission.sessionId)}
          onClose={() => setDetailSubmission(null)}
          onUpdate={handleUpdateSubmission}
          onDelete={handleDeleteSubmission}
        />
      )}

      {/* Session Create Modal */}
      {isCreatingSession && (
        <SessionManagerModal
          isCreateMode={true}
          suggestedNextId={sessions.length > 0 ? Math.max(...sessions.map((s) => s.id)) + 1 : 1}
          onClose={() => setIsCreatingSession(false)}
          onSave={handleCreateSession}
        />
      )}

      {/* Session Manager / Edit Modal */}
      {editingSession && (
        <SessionManagerModal
          session={editingSession}
          onClose={() => setEditingSession(null)}
          onSave={handleSaveSession}
          onDelete={handleDeleteSession}
        />
      )}
    </div>
  );
}
