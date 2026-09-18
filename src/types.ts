export interface SeminarSession {
  id: number; // 1 through 7
  title: string;
  theme: string;
  scripture: string;
  speaker?: string;
  question: string;
  description: string;
  isActive: boolean;
  order: number;
  submissionCount?: number;
  uniqueCampuses?: number;
}

export interface Submission {
  id: string;
  sessionId: number; // 1 to 7, each session has its own table
  nama: string;
  asalKampus: string;
  jawaban: string;
  komitmenPribadi?: string;
  catatanPembimbing?: string;
  statusSpiritual?: 'Baru Bertumbuh' | 'Aktif Terbina' | 'Butuh Pendampingan' | 'Pemimpin Mahasiswa';
  timestamp: string;
}

export interface SessionStats {
  sessionId: number;
  sessionTitle: string;
  count: number;
  uniqueCampuses: number;
}

export interface SeminarStats {
  totalSubmissions: number;
  totalUniqueParticipants: number;
  totalCampuses: number;
  sessionCounts: Record<number, number>;
  campusDistribution: { campus: string; count: number }[];
  recentSubmissions: Submission[];
}
