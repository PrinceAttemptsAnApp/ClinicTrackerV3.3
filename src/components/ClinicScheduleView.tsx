import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Upload, 
  CheckCircle2, 
  Sparkles, 
  Plus, 
  Trash2,
  Stethoscope
} from 'lucide-react';
import { ClinicSession, ClinicPlace, DisciplineType, StudentProfile } from '../types';
import { SchedulePdfUploader } from './SchedulePdfUploader';

interface ClinicScheduleViewProps {
  schedule: ClinicSession[];
  onUpdateSchedule: (newSchedule: ClinicSession[]) => void;
  onNavigateToClinic: (place: ClinicPlace) => void;
  profile?: StudentProfile;
  onUpdateProfile?: (profile: StudentProfile) => void;
  onNavigateToSettings?: () => void;
}

const CLINICS: ClinicPlace[] = ['A', 'C', 'B', 'M', 'N', 'G'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Saturday'] as const;

export const ClinicScheduleView: React.FC<ClinicScheduleViewProps> = ({
  schedule,
  onUpdateSchedule,
  onNavigateToClinic,
  profile,
  onUpdateProfile,
  onNavigateToSettings,
}) => {
  const [isAddingSession, setIsAddingSession] = useState(false);
  const [day, setDay] = useState<(typeof DAYS)[number]>('Sunday');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('12:30');
  const [discipline, setDiscipline] = useState<DisciplineType>('Fixed');
  const [clinicPlace, setClinicPlace] = useState<ClinicPlace>('A');
  const [notes, setNotes] = useState('');

  const handleAddSession = (e: React.FormEvent) => {
    e.preventDefault();
    const newSession: ClinicSession = {
      id: `sess-${Date.now()}`,
      dayOfWeek: day,
      startTime,
      endTime,
      discipline,
      clinicPlace,
      chairCount: 2,
      notes: notes.trim(),
    };
    onUpdateSchedule([...schedule, newSession]);
    setIsAddingSession(false);
    setNotes('');
  };

  const handleDeleteSession = (id: string) => {
    onUpdateSchedule(schedule.filter((s) => s.id !== id));
  };

  const handleScheduleExtracted = (
    newSessions: ClinicSession[],
    meta: {
      fileName: string;
      uploadedAt: string;
      sessionCount: number;
      studentName?: string;
      studentId?: string;
      university?: string;
      faculty?: string;
      semester?: string;
    }
  ) => {
    onUpdateSchedule(newSessions);
    if (profile && onUpdateProfile) {
      const updatedProfile: StudentProfile = {
        ...profile,
        schedulePdfUploaded: true,
        schedulePdfMeta: meta,
      };

      if (
        meta.studentName &&
        (!profile.studentName ||
          profile.studentName === 'Dental Student' ||
          profile.studentName.includes('Amir'))
      ) {
        updatedProfile.studentName = meta.studentName;
      }
      if (meta.studentId && !profile.studentId) {
        updatedProfile.studentId = meta.studentId;
      }
      if (meta.university && (!profile.university || profile.university === 'Dental Faculty')) {
        updatedProfile.university = meta.university;
      }

      onUpdateProfile(updatedProfile);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Card */}
      <div className="frosted-card rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-800">
              5th-Year Clinical Timetable
            </h2>
            <p className="text-xs text-slate-500">
              Weekly clinical duty schedule & assigned clinic stations (A, C, B, M, N, G)
            </p>
          </div>

          <button
            onClick={() => setIsAddingSession(!isAddingSession)}
            className="neu-btn-primary px-4 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer self-start sm:self-auto shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Session</span>
          </button>
        </div>

        {/* Schedule PDF Extractor or Active Schedule Link to Settings */}
        {(!schedule || schedule.length === 0) ? (
          <div className="mt-4 pt-3 border-t border-slate-200/70">
            <SchedulePdfUploader
              isAlreadyUploaded={false}
              metadata={profile?.schedulePdfMeta}
              onScheduleExtracted={handleScheduleExtracted}
              variant="schedule"
            />
          </div>
        ) : (
          <div className="mt-4 pt-3 border-t border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
              <span className="font-semibold text-slate-700">
                {schedule.length} clinical sessions active • {profile?.schedulePdfMeta?.fileName || 'Timetable Loaded'}
              </span>
            </div>
            {onNavigateToSettings && (
              <button
                type="button"
                onClick={onNavigateToSettings}
                className="neu-btn px-3 py-1.5 rounded-xl text-xs font-bold text-sky-700 hover:text-sky-900 border border-sky-300/70 flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto"
                title="Update your schedule in Settings"
              >
                <span>Update Schedule in Settings &rarr;</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Add Session Form */}
      {isAddingSession && (
        <form onSubmit={handleAddSession} className="frosted-card rounded-2xl p-5 space-y-3 text-xs animate-in fade-in">
          <h3 className="font-bold text-sm text-slate-800">Add Clinical Session</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Day of Week</label>
              <select
                value={day}
                onChange={(e) => setDay(e.target.value as any)}
                className="neu-input w-full px-3 py-2 rounded-xl bg-white/80"
              >
                {DAYS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Clinic Place</label>
              <select
                value={clinicPlace}
                onChange={(e) => setClinicPlace(e.target.value as any)}
                className="neu-input w-full px-3 py-2 rounded-xl bg-white/80"
              >
                {CLINICS.map((c) => (
                  <option key={c} value={c}>
                    Clinic {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Discipline / Specialty</label>
              <select
                value={discipline}
                onChange={(e) => setDiscipline(e.target.value as any)}
                className="neu-input w-full px-3 py-2 rounded-xl bg-white/80"
              >
                <option value="Fixed">Fixed Prosthodontics</option>
                <option value="Operative">Operative Dentistry</option>
                <option value="Endo">Endodontics</option>
                <option value="Removable">Removable Prosthodontics</option>
                <option value="Perio">Periodontics</option>
                <option value="Oral Surgery">Oral Surgery</option>
                <option value="Pediatric Dentistry">Pediatric Dentistry</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="neu-input w-full px-3 py-2 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">End Time</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="neu-input w-full px-3 py-2 rounded-xl"
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block font-medium text-slate-700 mb-1">Session Notes (Optional)</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Bring typodont, 2 chairs assigned"
                className="neu-input w-full px-3 py-2 rounded-xl"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddingSession(false)}
              className="neu-btn px-4 py-2 rounded-xl text-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="neu-btn-primary px-5 py-2 rounded-xl text-white font-bold shadow-sm"
            >
              Save Session
            </button>
          </div>
        </form>
      )}

      {/* Timetable Days Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {DAYS.map((d) => {
          const daySessions = schedule.filter((s) => s.dayOfWeek === d);

          return (
            <div key={d} className="frosted-card rounded-2xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/70">
                  <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-sky-600" />
                    {d}
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {daySessions.length} sessions
                  </span>
                </div>

                <div className="mt-3 space-y-2">
                  {daySessions.length > 0 ? (
                    daySessions.map((sess) => (
                      <div
                        key={sess.id}
                        className="p-3 rounded-xl bg-white/75 border border-slate-200/80 shadow-2xs space-y-1.5 group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-800">
                            {sess.discipline}
                          </span>
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-sky-100 text-sky-800">
                            Clinic {sess.clinicPlace}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{sess.startTime} – {sess.endTime}</span>
                          <span>•</span>
                          <span>2 Chairs</span>
                        </div>

                        {sess.notes && (
                          <p className="text-[11px] text-slate-600 italic">
                            {sess.notes}
                          </p>
                        )}

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                          <button
                            onClick={() => onNavigateToClinic(sess.clinicPlace)}
                            className="text-[11px] font-bold text-sky-600 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <Stethoscope className="w-3 h-3" />
                            <span>Open Today&apos;s Clinic &rarr;</span>
                          </button>

                          <button
                            onClick={() => handleDeleteSession(sess.id)}
                            className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                            title="Delete session"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 italic py-4 text-center">
                      No scheduled clinical duty
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
