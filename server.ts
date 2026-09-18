import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import * as XLSX from 'xlsx';
import QRCode from 'qrcode';

interface SeminarSession {
  id: number;
  title: string;
  theme: string;
  scripture: string;
  speaker?: string;
  question: string;
  description: string;
  isActive: boolean;
  order: number;
}

interface Submission {
  id: string;
  sessionId: number;
  nama: string;
  asalKampus: string;
  jawaban: string;
  komitmenPribadi?: string;
  catatanPembimbing?: string;
  statusSpiritual?: 'Baru Bertumbuh' | 'Aktif Terbina' | 'Butuh Pendampingan' | 'Pemimpin Mahasiswa';
  timestamp: string;
}

interface DataStore {
  sessions: SeminarSession[];
  submissions: Record<string, Submission[]>; // key is `session_${id}` (7 separate storage tables)
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'seminar_store.json');

const INITIAL_SESSIONS: SeminarSession[] = [
  {
    id: 1,
    title: 'Sesi 1: Fondasi Iman & Kasih Karunia',
    theme: 'Memahami Keselamatan Sejati di Dalam Kristus',
    scripture: 'Efesus 2:8-10',
    speaker: 'Pdt. Dr. Yohanes Surya, M.Th.',
    question: 'Apa pemahaman baru yang Anda peroleh mengenai kasih karunia Allah hari ini, dan bagaimana hal tersebut mengubah cara Anda memandang hidup Anda di hadapan Tuhan?',
    description: 'Membangun dasar iman kristiani yang kokoh berakar pada karya penebusan Kristus, bukan usaha manusia.',
    isActive: true,
    order: 1
  },
  {
    id: 2,
    title: 'Sesi 2: Menghidupi Firman di Tengah Kampus',
    theme: 'Otoritas & Kedalaman Firman Allah dalam Studi',
    scripture: 'Mazmur 119:9-11',
    speaker: 'Ev. Daniel Prasetya, M.Div.',
    question: 'Tantangan terbesar apa yang Anda hadapi saat berusaha taat pada kebenaran Firman Tuhan di lingkungan kampus, dan apa langkah konkret yang ingin Anda ambil?',
    description: 'Menjadikan Alkitab sebagai pelita langkah dan standar moral di tengah tantangan intelektual dan pergaulan masa kini.',
    isActive: true,
    order: 2
  },
  {
    id: 3,
    title: 'Sesi 3: Doa & Keintiman Pribadi dengan Allah',
    theme: 'Membangun Hubungan Riil Bukan Sekadar Rutinitas',
    scripture: 'Yohanes 15:5-7',
    speaker: 'Pdt. Maria Kristanti, S.Th.',
    question: 'Bagaimana kondisi kehidupan doa pribadi Anda saat ini? Apa tekad atau komitmen doa yang akan Anda bangun mulai minggu ini?',
    description: 'Membimbing mahasiswa memiliki mezbah doa pribadi yang hidup, mendengarkan Tuhan dan tinggal di dalam pokok anggur yang benar.',
    isActive: true,
    order: 3
  },
  {
    id: 4,
    title: 'Sesi 4: Karakter & Integritas Mahasiswa Kristen',
    theme: 'Garam dan Terang di Dunia Akademik',
    scripture: 'Matius 5:13-16; Daniel 1:8',
    speaker: 'Dr. Andreas Tanujaya, Ph.D.',
    question: 'Sebutkan 1 area konkret dalam kejujuran akademik atau relasi sosial di kampus di mana Anda bertekad untuk menunjukkan integritas Kristus.',
    description: 'Menolak kompromi dalam kejujuran ujian, tugas kuliah, dan karakter hidup sehari-hari yang memuliakan Allah.',
    isActive: true,
    order: 4
  },
  {
    id: 5,
    title: 'Sesi 5: Mengatasi Keraguan & Ujian Iman',
    theme: 'Berakar Kuat di Tengah Badai dan Krisis Hidup',
    scripture: '1 Petrus 1:6-7; Ibrani 11:1',
    speaker: 'Ev. Samuel Wibowo, M.Th.',
    question: 'Pernahkah Anda mengalami keraguan atau pergumulan iman yang berat? Apa yang Anda pelajari dari sesi ini untuk tetap berpegang teguh pada janji Tuhan?',
    description: 'Menjawab pertanyaan-pertanyaan sulit seputar penderitaan, keraguan iman, dan kepastian perlindungan Allah.',
    isActive: true,
    order: 5
  },
  {
    id: 6,
    title: 'Sesi 6: Panggilan Hidup & Visi Masa Depan',
    theme: 'Menemukan Rencana Allah bagi Profesi dan Studi',
    scripture: 'Yeremia 29:11; Kolose 3:23-24',
    speaker: 'Ir. Hendra Gunawan, M.M.',
    question: 'Bagaimana Anda melihat bidang studi/keahlian Anda saat ini sebagai sarana melayani Tuhan dan menjadi berkat bagi sesama?',
    description: 'Menghubungkan studi perkuliahan dengan mandat panggilan Allah dalam dunia profesional dan pelayanan.',
    isActive: true,
    order: 6
  },
  {
    id: 7,
    title: 'Sesi 7: Misi & Murid Kristus yang Mengutus',
    theme: 'Amanat Agung: Menjangkau Kampus bagi Kerajaan Allah',
    scripture: 'Matius 28:19-20; Kisah Para Rasul 1:8',
    speaker: 'Pdt. Jonathan Lie, D.Min.',
    question: 'Siapa nama rekan atau lingkungan di kampus yang terbeban di hati Anda untuk Anda doakan dan bagikan kasih Kristus setelah seminar ini?',
    description: 'Menjadikan setiap peserta sebagai murid yang memuridkan dan duta pembawa kabar baik di kampus masing-masing.',
    isActive: true,
    order: 7
  }
];

const INITIAL_SUBMISSIONS: Record<string, Submission[]> = {
  session_1: [],
  session_2: [],
  session_3: [],
  session_4: [],
  session_5: [],
  session_6: [],
  session_7: []
};

// Ensure data folder and storage file exist
function initializeStore(): DataStore {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw) as DataStore;
      // Ensure all 7 sessions exist
      if (!parsed.sessions || parsed.sessions.length < 7) {
        parsed.sessions = INITIAL_SESSIONS;
      }
      if (!parsed.submissions) {
        parsed.submissions = INITIAL_SUBMISSIONS;
      }
      for (let i = 1; i <= 7; i++) {
        if (!parsed.submissions[`session_${i}`]) {
          parsed.submissions[`session_${i}`] = [];
        }
      }
      return parsed;
    } else {
      const initialStore: DataStore = {
        sessions: INITIAL_SESSIONS,
        submissions: INITIAL_SUBMISSIONS
      };
      fs.writeFileSync(DATA_FILE, JSON.stringify(initialStore, null, 2), 'utf-8');
      return initialStore;
    }
  } catch (err) {
    console.error('Error initializing data store:', err);
    return {
      sessions: INITIAL_SESSIONS,
      submissions: INITIAL_SUBMISSIONS
    };
  }
}

let store: DataStore = initializeStore();

function saveStore(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving store to file:', err);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // CORS and iframe embed friendly headers
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // ----------------------------------------------------
  // API ROUTES
  // ----------------------------------------------------

  // 1. Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // 2. Get all sessions with submission counts
  app.get('/api/sessions', (req, res) => {
    try {
      const sessionsWithCount = store.sessions.map((session) => {
        const submissions = (store.submissions && store.submissions[`session_${session.id}`]) || [];
        return {
          ...session,
          submissionCount: submissions.length,
          uniqueCampuses: new Set(
            submissions.map((s) => (s && s.asalKampus ? s.asalKampus.trim().toLowerCase() : '')).filter(Boolean)
          ).size
        };
      });
      res.json({ success: true, data: sessionsWithCount });
    } catch (err: any) {
      console.error('Error in /api/sessions:', err);
      res.status(500).json({ success: false, error: 'Gagal memuat sesi seminar' });
    }
  });

  // 2b. Add / Input a new seminar session
  app.post('/api/sessions', (req, res) => {
    try {
      const { title, theme, scripture, speaker, question, description, isActive, id } = req.body;

      if (!title || !title.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Judul sesi wajib diisi.'
        });
      }

      if (!question || !question.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Pertanyaan evaluasi / refleksi hasil belajar peserta wajib diisi.'
        });
      }

      // Determine ID (either user-specified or next available)
      let newId: number;
      if (id !== undefined && id !== '' && !isNaN(parseInt(id, 10))) {
        newId = parseInt(id, 10);
      } else {
        const existingIds = store.sessions.map((s) => s.id);
        newId = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;
      }

      // Check for duplicate ID
      if (store.sessions.some((s) => s.id === newId)) {
        return res.status(400).json({
          success: false,
          error: `Sesi dengan nomor ID ${newId} sudah terdaftar. Silakan gunakan nomor lain.`
        });
      }

      const newSession: SeminarSession = {
        id: newId,
        title: String(title).trim(),
        theme: theme && String(theme).trim() ? String(theme).trim() : `Sesi ${newId}`,
        scripture: scripture && String(scripture).trim() ? String(scripture).trim() : 'Alkitab',
        speaker: speaker && String(speaker).trim() ? String(speaker).trim() : undefined,
        question: String(question).trim(),
        description: description ? String(description).trim() : '',
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        order: newId
      };

      store.sessions.push(newSession);
      store.sessions.sort((a, b) => a.id - b.id);

      // Initialize dedicated storage table for this new session
      if (!store.submissions[`session_${newId}`]) {
        store.submissions[`session_${newId}`] = [];
      }

      saveStore();

      res.status(201).json({
        success: true,
        message: `Sesi ${newId} berhasil ditambahkan!`,
        data: newSession
      });
    } catch (err: any) {
      console.error('Error in POST /api/sessions:', err);
      res.status(500).json({ success: false, error: 'Gagal menambahkan sesi baru' });
    }
  });

  // 2c. Delete a session
  app.delete('/api/sessions/:id', (req, res) => {
    try {
      const sessionId = parseInt(req.params.id, 10);
      const index = store.sessions.findIndex((s) => s.id === sessionId);

      if (index === -1) {
        return res.status(404).json({ success: false, error: 'Sesi tidak ditemukan' });
      }

      const deletedSession = store.sessions.splice(index, 1)[0];
      delete store.submissions[`session_${sessionId}`];
      saveStore();

      res.json({
        success: true,
        message: `Sesi ${deletedSession.title} berhasil dihapus.`,
        data: deletedSession
      });
    } catch (err: any) {
      console.error('Error in DELETE /api/sessions/:id:', err);
      res.status(500).json({ success: false, error: 'Gagal menghapus sesi' });
    }
  });

  // 3. Update a session (title, question prompt, scripture, etc.)
  app.put('/api/sessions/:id', (req, res) => {
    try {
      const sessionId = parseInt(req.params.id, 10);
      const sessionIndex = store.sessions.findIndex((s) => s.id === sessionId);

      if (sessionIndex === -1) {
        return res.status(404).json({ success: false, error: 'Sesi tidak ditemukan' });
      }

      const { title, theme, scripture, speaker, question, description, isActive } = req.body;

      store.sessions[sessionIndex] = {
        ...store.sessions[sessionIndex],
        title: title !== undefined ? title : store.sessions[sessionIndex].title,
        theme: theme !== undefined ? theme : store.sessions[sessionIndex].theme,
        scripture: scripture !== undefined ? scripture : store.sessions[sessionIndex].scripture,
        speaker: speaker !== undefined ? speaker : store.sessions[sessionIndex].speaker,
        question: question !== undefined ? question : store.sessions[sessionIndex].question,
        description: description !== undefined ? description : store.sessions[sessionIndex].description,
        isActive: isActive !== undefined ? Boolean(isActive) : store.sessions[sessionIndex].isActive
      };

      saveStore();
      res.json({ success: true, data: store.sessions[sessionIndex] });
    } catch (err: any) {
      console.error('Error in PUT /api/sessions/:id:', err);
      res.status(500).json({ success: false, error: 'Gagal memperbarui sesi' });
    }
  });

  // 4. Get submissions (filtered by session, search, or all)
  app.get('/api/submissions', (req, res) => {
    try {
      const sessionIdParam = req.query.sessionId as string;
      const search = ((req.query.search as string) || '').toLowerCase().trim();
      const campus = ((req.query.campus as string) || '').toLowerCase().trim();

      let allResults: Submission[] = [];

      if (sessionIdParam) {
        const sId = parseInt(sessionIdParam, 10);
        allResults = (store.submissions && store.submissions[`session_${sId}`]) || [];
      } else {
        // Gather all submissions across all registered session tables
        store.sessions.forEach((s) => {
          const list = (store.submissions && store.submissions[`session_${s.id}`]) || [];
          allResults = allResults.concat(list);
        });
      }

      if (search) {
        allResults = allResults.filter(
          (sub) =>
            (sub.nama && sub.nama.toLowerCase().includes(search)) ||
            (sub.asalKampus && sub.asalKampus.toLowerCase().includes(search)) ||
            (sub.jawaban && sub.jawaban.toLowerCase().includes(search)) ||
            (sub.komitmenPribadi && sub.komitmenPribadi.toLowerCase().includes(search))
        );
      }

      if (campus) {
        allResults = allResults.filter(
          (sub) => sub.asalKampus && sub.asalKampus.toLowerCase().includes(campus)
        );
      }

      // Sort latest first
      allResults.sort((a, b) => {
        const tA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const tB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return tB - tA;
      });

      res.json({ success: true, count: allResults.length, data: allResults });
    } catch (err: any) {
      console.error('Error in /api/submissions:', err);
      res.status(500).json({ success: false, error: 'Gagal memuat jawaban peserta' });
    }
  });

  // 5. Submit participant answers (Flow: Nama, Asal Kampus, Jawaban)
  app.post('/api/submissions', (req, res) => {
    try {
      const { sessionId, nama, asalKampus, jawaban, komitmenPribadi } = req.body;

      if (!sessionId || !nama || !asalKampus || !jawaban) {
        return res.status(400).json({
          success: false,
          error: 'Mohon lengkapi Nama, Asal Kampus, dan Jawaban Anda.'
        });
      }

      const sId = parseInt(sessionId, 10);
      const targetSession = store.sessions.find((s) => s.id === sId);
      if (!targetSession) {
        return res.status(400).json({
          success: false,
          error: `Sesi ${sId} tidak ditemukan dalam daftar seminar.`
        });
      }

      if (!targetSession.isActive) {
        return res.status(400).json({
          success: false,
          error: `Maaf, ${targetSession.title} saat ini sedang ditutup untuk pengisian jawaban.`
        });
      }

      const newSubmission: Submission = {
        id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        sessionId: sId,
        nama: String(nama).trim(),
        asalKampus: String(asalKampus).trim(),
        jawaban: String(jawaban).trim(),
        komitmenPribadi: komitmenPribadi ? String(komitmenPribadi).trim() : undefined,
        statusSpiritual: 'Baru Bertumbuh',
        timestamp: new Date().toISOString()
      };

      if (!store.submissions[`session_${sId}`]) {
        store.submissions[`session_${sId}`] = [];
      }

      store.submissions[`session_${sId}`].unshift(newSubmission);
      saveStore();

      res.status(201).json({
        success: true,
        message: 'Puji Tuhan, jawaban dan refleksi Anda berhasil tersimpan.',
        data: newSubmission
      });
    } catch (err: any) {
      console.error('Error in POST /api/submissions:', err);
      res.status(500).json({ success: false, error: 'Gagal menyimpan jawaban peserta' });
    }
  });

  // 6. Admin update submission (catatan pembimbing, status spiritual)
  app.put('/api/submissions/:id', (req, res) => {
    try {
      const id = req.params.id;
      const { catatanPembimbing, statusSpiritual, nama, asalKampus, jawaban } = req.body;

      let found = false;
      let updatedSub: Submission | null = null;

      for (const session of store.sessions) {
        const list = store.submissions[`session_${session.id}`] || [];
        const idx = list.findIndex((s) => s.id === id);
        if (idx !== -1) {
          list[idx] = {
            ...list[idx],
            catatanPembimbing: catatanPembimbing !== undefined ? catatanPembimbing : list[idx].catatanPembimbing,
            statusSpiritual: statusSpiritual !== undefined ? statusSpiritual : list[idx].statusSpiritual,
            nama: nama !== undefined ? nama : list[idx].nama,
            asalKampus: asalKampus !== undefined ? asalKampus : list[idx].asalKampus,
            jawaban: jawaban !== undefined ? jawaban : list[idx].jawaban
          };
          updatedSub = list[idx];
          found = true;
          break;
        }
      }

      if (!found) {
        return res.status(404).json({ success: false, error: 'Data jawaban tidak ditemukan' });
      }

      saveStore();
      res.json({ success: true, data: updatedSub });
    } catch (err: any) {
      console.error('Error in PUT /api/submissions/:id:', err);
      res.status(500).json({ success: false, error: 'Gagal memperbarui jawaban' });
    }
  });

  // 7a. Admin clear all submissions or clear specific session submissions
  app.delete('/api/submissions', (req, res) => {
    try {
      const sessionIdParam = req.query.sessionId as string;
      if (sessionIdParam) {
        const sId = parseInt(sessionIdParam, 10);
        const validSession = store.sessions.find((s) => s.id === sId);
        if (validSession) {
          store.submissions[`session_${sId}`] = [];
          saveStore();
          return res.json({ success: true, message: `Semua data jawaban Sesi ${sId} berhasil dikosongkan.` });
        } else {
          return res.status(400).json({ success: false, error: 'ID sesi tidak valid' });
        }
      }

      // Clear all sessions
      store.sessions.forEach((session) => {
        store.submissions[`session_${session.id}`] = [];
      });
      saveStore();
      res.json({ success: true, message: 'Semua data jawaban seluruh sesi seminar berhasil dikosongkan.' });
    } catch (err: any) {
      console.error('Error in DELETE /api/submissions:', err);
      res.status(500).json({ success: false, error: 'Gagal mengosongkan data jawaban' });
    }
  });

  // 7b. Admin delete single submission
  app.delete('/api/submissions/:id', (req, res) => {
    try {
      const id = req.params.id;
      let deleted = false;

      for (const session of store.sessions) {
        const list = store.submissions[`session_${session.id}`] || [];
        const idx = list.findIndex((s) => s.id === id);
        if (idx !== -1) {
          list.splice(idx, 1);
          deleted = true;
          break;
        }
      }

      if (!deleted) {
        return res.status(404).json({ success: false, error: 'Data jawaban tidak ditemukan' });
      }

      saveStore();
      res.json({ success: true, message: 'Jawaban peserta berhasil dihapus' });
    } catch (err: any) {
      console.error('Error in DELETE /api/submissions/:id:', err);
      res.status(500).json({ success: false, error: 'Gagal menghapus jawaban' });
    }
  });

  // 8. Real-time seminar statistics
  app.get('/api/stats', (req, res) => {
    try {
      let totalSubmissions = 0;
      const participantsSet = new Set<string>();
      const campusesMap: Record<string, number> = {};
      const sessionCounts: Record<number, number> = {};
      let allSubs: Submission[] = [];

      for (const session of store.sessions) {
        const list = (store.submissions && store.submissions[`session_${session.id}`]) || [];
        sessionCounts[session.id] = list.length;
        totalSubmissions += list.length;
        allSubs = allSubs.concat(list);

        list.forEach((sub) => {
          if (sub && sub.nama) {
            participantsSet.add(sub.nama.trim().toLowerCase());
          }
          if (sub && sub.asalKampus) {
            const cKey = sub.asalKampus.trim();
            if (cKey) {
              campusesMap[cKey] = (campusesMap[cKey] || 0) + 1;
            }
          }
        });
      }

      allSubs.sort((a, b) => {
        const tA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const tB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return tB - tA;
      });

      const campusDistribution = Object.entries(campusesMap)
        .map(([campus, count]) => ({ campus, count }))
        .sort((a, b) => b.count - a.count);

      res.json({
        success: true,
        data: {
          totalSubmissions,
          totalUniqueParticipants: participantsSet.size,
          totalCampuses: Object.keys(campusesMap).length,
          sessionCounts,
          campusDistribution,
          recentSubmissions: allSubs.slice(0, 10)
        }
      });
    } catch (err: any) {
      console.error('Error in /api/stats:', err);
      res.status(500).json({ success: false, error: 'Gagal memuat statistik seminar' });
    }
  });

  // 9. Generate QR Code image (Data URL) for a given session or general form
  app.get('/api/qrcode', async (req, res) => {
    try {
      const sessionId = req.query.sessionId as string;
      const origin = `${req.protocol}://${req.get('host')}`;
      const targetUrl = sessionId
        ? `${origin}/?mode=form&session=${sessionId}`
        : `${origin}/?mode=form`;

      const qrDataUrl = await QRCode.toDataURL(targetUrl, {
        width: 480,
        margin: 2,
        color: {
          dark: '#1e293b', // slate-800
          light: '#ffffff'
        }
      });

      res.json({
        success: true,
        url: targetUrl,
        dataUrl: qrDataUrl
      });
    } catch (err) {
      console.error('Error creating QR Code:', err);
      res.status(500).json({ success: false, error: 'Gagal membuat QR Code' });
    }
  });

  // 10. Export to Excel format (.xlsx) with separated sheets for each of the 7 sessions
  app.get('/api/export/excel', (req, res) => {
    try {
      const sessionIdParam = req.query.sessionId as string;
      const workbook = XLSX.utils.book_new();

      const formatDateTime = (isoString: string) => {
        try {
          const d = new Date(isoString);
          return d.toLocaleString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
        } catch {
          return isoString;
        }
      };

      if (sessionIdParam) {
        // Single session export
        const sId = parseInt(sessionIdParam, 10);
        const session = store.sessions.find((s) => s.id === sId);
        const submissions = store.submissions[`session_${sId}`] || [];

        const sheetData = submissions.map((sub, idx) => ({
          'No': idx + 1,
          'Waktu Kirim': formatDateTime(sub.timestamp),
          'Nama Peserta': sub.nama,
          'Asal Kampus': sub.asalKampus,
          'Jawaban / Pemahaman Belajar': sub.jawaban,
          'Komitmen Pribadi': sub.komitmenPribadi || '-',
          'Status Pembinaan Rohani': sub.statusSpiritual || '-',
          'Catatan Pembimbing': sub.catatanPembimbing || '-'
        }));

        const sheet = XLSX.utils.json_to_sheet(sheetData);
        // Column widths
        sheet['!cols'] = [
          { wch: 6 },
          { wch: 20 },
          { wch: 25 },
          { wch: 30 },
          { wch: 55 },
          { wch: 35 },
          { wch: 25 },
          { wch: 35 }
        ];

        const sheetName = `Sesi ${sId}`;
        XLSX.utils.book_append_sheet(workbook, sheet, sheetName);

        const filename = `Rekapitulasi_Seminar_Sesi_${sId}.xlsx`;
        const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        return res.send(buffer);
      } else {
        // Complete Master Workbook with separate sheets for all 7 sessions + Overview

        // 1. Overview Sheet
        const summaryData: any[] = [
          { 'Kategori / Parameter': 'Total Jawaban Terkumpul', 'Nilai': 0 },
          { 'Kategori / Parameter': 'Jumlah Peserta Terdaftar', 'Nilai': 0 },
          { 'Kategori / Parameter': 'Jumlah Kampus Terwakili', 'Nilai': 0 },
          { 'Kategori / Parameter': 'Waktu Ekspor Rekapitulasi', 'Nilai': new Date().toLocaleString('id-ID') },
          { 'Kategori / Parameter': '', 'Nilai': '' },
          { 'Kategori / Parameter': '--- PROGRESS TIAP SESI ---', 'Nilai': '' }
        ];

        let grandTotal = 0;
        const allParticipants = new Set<string>();
        const allCampuses = new Set<string>();

        store.sessions.forEach((s) => {
          const list = store.submissions[`session_${s.id}`] || [];
          grandTotal += list.length;
          list.forEach((sub) => {
            allParticipants.add(sub.nama.trim().toLowerCase());
            allCampuses.add(sub.asalKampus.trim().toLowerCase());
          });
          summaryData.push({
            'Kategori / Parameter': `${s.title} (${s.theme})`,
            'Nilai': `${list.length} Jawaban`
          });
        });

        summaryData[0]['Nilai'] = grandTotal;
        summaryData[1]['Nilai'] = allParticipants.size;
        summaryData[2]['Nilai'] = allCampuses.size;

        const summarySheet = XLSX.utils.json_to_sheet(summaryData);
        summarySheet['!cols'] = [{ wch: 50 }, { wch: 30 }];
        XLSX.utils.book_append_sheet(workbook, summarySheet, 'Ringkasan Eksekutif');

        // 2. Individual Dedicated Sheet for Each Session
        store.sessions.forEach((session) => {
          const list = store.submissions[`session_${session.id}`] || [];

          const sheetData = list.map((sub, idx) => ({
            'No': idx + 1,
            'Waktu Masuk': formatDateTime(sub.timestamp),
            'Nama Peserta': sub.nama,
            'Asal Kampus': sub.asalKampus,
            'Jawaban Hasil Belajar': sub.jawaban,
            'Komitmen Pribadi': sub.komitmenPribadi || '-',
            'Status Rohani': sub.statusSpiritual || 'Baru Bertumbuh',
            'Catatan Koordinator / Pembimbing': sub.catatanPembimbing || '-'
          }));

          const sheet = XLSX.utils.json_to_sheet(sheetData);
          sheet['!cols'] = [
            { wch: 6 },
            { wch: 20 },
            { wch: 25 },
            { wch: 30 },
            { wch: 55 },
            { wch: 35 },
            { wch: 22 },
            { wch: 35 }
          ];

          const tabName = `Sesi ${session.id}`;
          XLSX.utils.book_append_sheet(workbook, sheet, tabName);
        });

        const filename = `Rekapitulasi_Seminar_Rohani_${store.sessions.length}_Sesi.xlsx`;
        const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        return res.send(buffer);
      }
    } catch (err) {
      console.error('Error generating Excel file:', err);
      res.status(500).json({ success: false, error: 'Gagal membuat file Excel rekapitulasi' });
    }
  });

  // ----------------------------------------------------
  // API FALLBACK & ERROR HANDLERS (ALWAYS RETURN JSON, NEVER HTML)
  // ----------------------------------------------------
  app.all('/api/*', (req, res) => {
    res.status(404).json({ success: false, error: `Endpoint ${req.method} ${req.path} tidak ditemukan` });
  });

  app.use('/api', (err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('API Error:', err);
    res.status(500).json({ success: false, error: err?.message || 'Terjadi kesalahan internal server' });
  });

  // ----------------------------------------------------
  // VITE / STATIC FILE SERVING
  // ----------------------------------------------------
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Seminar Rohani Server is running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
