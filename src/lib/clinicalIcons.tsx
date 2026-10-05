import React from 'react';
import { 
  Crown, 
  Layers,
  PlusCircle, 
  UserPlus, 
  CalendarClock, 
  Camera, 
  ClipboardCheck, 
  FileSignature, 
  UploadCloud, 
  Flag, 
  CheckCircle2, 
  AlertTriangle, 
  FileDown, 
  FileCheck2, 
  Clock, 
  AlertCircle, 
  Calendar, 
  CalendarDays, 
  LayoutDashboard, 
  Stethoscope, 
  FolderHeart, 
  FileText, 
  Settings, 
  Activity 
} from 'lucide-react';
import { DisciplineType } from '../types';

export interface ClinicalIconProps {
  className?: string;
  'aria-hidden'?: boolean | 'true' | 'false';
}

/**
 * Universal Anatomical Tooth Icon matching Lucide's 24x24 2px stroke geometry.
 * Represents a dental molar with anatomical cusps, developmental groove, and root bifurcation.
 */
export const ToothIcon: React.FC<ClinicalIconProps> = ({
  className = 'w-4 h-4',
  'aria-hidden': ariaHidden = true,
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden={ariaHidden}
  >
    <path d="M4.5 10.5C3.5 7 4 4 7 3c2.5-.8 4 .5 5 1.5 1-1 2.5-2.3 5-1.5 3 1 3.5 4 2.5 7.5-.8 2.8-2 6-3 10.5-1 0-1.8-1.5-2.5-4-.5-1.8-1.2-3-2-3s-1.5 1.2-2 3c-.7 2.5-1.5 4-2.5 4-1-4.5-2.2-7.7-3-10.5z" />
  </svg>
);

/**
 * Endodontics Icon: Anatomical tooth showing internal pulp chamber and root canal pathways.
 */
export const EndoToothIcon: React.FC<ClinicalIconProps> = ({
  className = 'w-4 h-4',
  'aria-hidden': ariaHidden = true,
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden={ariaHidden}
  >
    <path d="M4.5 10.5C3.5 7 4 4 7 3c2.5-.8 4 .5 5 1.5 1-1 2.5-2.3 5-1.5 3 1 3.5 4 2.5 7.5-.8 2.8-2 6-3 10.5-1 0-1.8-1.5-2.5-4-.5-1.8-1.2-3-2-3s-1.5 1.2-2 3c-.7 2.5-1.5 4-2.5 4-1-4.5-2.2-7.7-3-10.5z" />
    <path d="M12 6.5v4" />
    <path d="M11 10.5c-.6 2.2-1.3 4.5-2.2 7.5" />
    <path d="M13 10.5c.6 2.2 1.3 4.5 2.2 7.5" />
  </svg>
);

/**
 * Operative / Restorative Icon: Tooth with anatomical cavity preparation and occlusal restoration.
 */
export const OperativeToothIcon: React.FC<ClinicalIconProps> = ({
  className = 'w-4 h-4',
  'aria-hidden': ariaHidden = true,
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden={ariaHidden}
  >
    <path d="M4.5 10.5C3.5 7 4 4 7 3c2.5-.8 4 .5 5 1.5 1-1 2.5-2.3 5-1.5 3 1 3.5 4 2.5 7.5-.8 2.8-2 6-3 10.5-1 0-1.8-1.5-2.5-4-.5-1.8-1.2-3-2-3s-1.5 1.2-2 3c-.7 2.5-1.5 4-2.5 4-1-4.5-2.2-7.7-3-10.5z" />
    <path d="M9 5h6l-1 4.5h-4z" />
    <line x1="9" y1="7" x2="15" y2="7" />
  </svg>
);

/**
 * Removable Prosthodontics Icon: Prosthetic dental arch / denture perimeter with artificial teeth units.
 */
export const RemovableDentureIcon: React.FC<ClinicalIconProps> = ({
  className = 'w-4 h-4',
  'aria-hidden': ariaHidden = true,
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden={ariaHidden}
  >
    <path d="M3 18C3 10 7 4 12 4s9 6 9 14" />
    <path d="M6 18c0-5 2.7-9 6-9s6 4 6 9" />
    <line x1="9" y1="9" x2="9" y2="13" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="15" y1="9" x2="15" y2="13" />
  </svg>
);

/**
 * Periodontics Icon: Tooth anatomy anchored in the gingival margin / periodontal tissue crest.
 */
export const PeriodonticIcon: React.FC<ClinicalIconProps> = ({
  className = 'w-4 h-4',
  'aria-hidden': ariaHidden = true,
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden={ariaHidden}
  >
    <path d="M5.5 10C4.8 7 5.2 4.5 7.5 3.5c2-.8 3.2.3 4.5 1.2 1.3-.9 2.5-2 4.5-1.2 2.3 1 2.7 3.5 2 6.5-.6 2.4-1.6 5-2.5 8.5-.8 0-1.5-1.2-2-3-.4-1.5-1-2.5-1.7-2.5s-1.3 1-1.7 2.5c-.5 1.8-1.2 3-2 3-.9-3.5-1.9-6.1-2.6-8.5z" />
    <path d="M2 13c2.5 1.5 5-.5 7.5 0s4 2.5 7 1c2.5-1.2 4-1 5.5 0" />
  </svg>
);

/**
 * Oral Surgery Icon: Tooth extraction / surgical elevation vector (replaces arbitrary scissors).
 */
export const OralSurgeryIcon: React.FC<ClinicalIconProps> = ({
  className = 'w-4 h-4',
  'aria-hidden': ariaHidden = true,
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden={ariaHidden}
  >
    <path d="M5.5 13C4.8 10.5 5.2 8.5 7.5 7.5c2-.7 3.2.3 4.5 1.2 1.3-.9 2.5-1.9 4.5-1.2 2.3 1 2.7 3 2 5.5-.6 2-1.6 4.5-2.5 7.5-.8 0-1.5-1-2-2.5-.4-1.2-1-2-1.7-2s-1.3.8-1.7 2c-.5 1.5-1.2 2.5-2 2.5-.9-3-1.9-5.5-2.6-7.5z" />
    <line x1="12" y1="6" x2="12" y2="1.5" />
    <polyline points="9 3.5 12 1 15 3.5" />
  </svg>
);

/**
 * Pediatric Dentistry Icon: Primary deciduous tooth with gentle friendly pediatric sparkle.
 */
export const PediatricToothIcon: React.FC<ClinicalIconProps> = ({
  className = 'w-4 h-4',
  'aria-hidden': ariaHidden = true,
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden={ariaHidden}
  >
    <path d="M5.5 11C4.7 8.5 5 6 7.5 5c2-.8 3.2.4 4.5 1.2 1.3-.8 2.5-2 4.5-1.2 2.5 1 2.8 3.5 2 6-.7 2.2-1.6 5-2.5 8-.7 0-1.3-1-1.8-2.5-.4-1.2-1-2-1.7-2s-1.3.8-1.7 2c-.5 1.5-1.1 2.5-1.8 2.5-.9-3-1.8-5.8-2.5-8z" />
    <path d="M19 2.5v3m-1.5-1.5h3" />
  </svg>
);

/**
 * Orthodontics Icon: Orthodontic brackets and continuous archwire.
 */
export const OrthodonticsIcon: React.FC<ClinicalIconProps> = ({
  className = 'w-4 h-4',
  'aria-hidden': ariaHidden = true,
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden={ariaHidden}
  >
    <line x1="2" y1="12" x2="22" y2="12" />
    <rect x="4" y="9" width="4" height="6" rx="1" />
    <line x1="6" y1="9" x2="6" y2="15" />
    <rect x="10" y="9" width="4" height="6" rx="1" />
    <line x1="12" y1="9" x2="12" y2="15" />
    <rect x="16" y="9" width="4" height="6" rx="1" />
    <line x1="18" y1="9" x2="18" y2="15" />
  </svg>
);

/**
 * Returns a deliberate, clinically authentic icon component for each clinical discipline.
 * Consistently used across cases, cards, templates, and schedules.
 */
export function getDisciplineIcon(
  discipline: DisciplineType | string,
  className: string = 'w-4 h-4'
): React.ReactElement {
  const disc = (discipline || '').toLowerCase();

  if (disc.includes('fixed') || disc.includes('crown') || disc.includes('bridge')) {
    return <Crown className={className} aria-hidden="true" />;
  }
  if (disc.includes('endo') || disc.includes('root') || disc.includes('rct') || disc.includes('pulpotomy')) {
    return <EndoToothIcon className={className} aria-hidden="true" />;
  }
  if (disc.includes('operative') || disc.includes('restorative') || disc.includes('filling') || disc.includes('composite')) {
    return <OperativeToothIcon className={className} aria-hidden="true" />;
  }
  if (disc.includes('removable') || disc.includes('denture') || disc.includes('rpd') || disc.includes('complete denture')) {
    return <RemovableDentureIcon className={className} aria-hidden="true" />;
  }
  if (disc.includes('perio') || disc.includes('scaling') || disc.includes('srp') || disc.includes('gingiv')) {
    return <PeriodonticIcon className={className} aria-hidden="true" />;
  }
  if (disc.includes('surgery') || disc.includes('extraction') || disc.includes('surgical')) {
    return <OralSurgeryIcon className={className} aria-hidden="true" />;
  }
  if (disc.includes('pedo') || disc.includes('pediatric') || disc.includes('child')) {
    return <PediatricToothIcon className={className} aria-hidden="true" />;
  }
  if (disc.includes('ortho') || disc.includes('braces') || disc.includes('bracket')) {
    return <OrthodonticsIcon className={className} aria-hidden="true" />;
  }
  if (disc.includes('comprehensive')) {
    return <Layers className={className} aria-hidden="true" />;
  }

  return <ToothIcon className={className} aria-hidden="true" />;
}

/**
 * Returns a procedure-level icon resolving down through clinical discipline hierarchy.
 */
export function getProcedureIcon(
  procedureOrTitle: { discipline?: string; title?: string } | string,
  className: string = 'w-4 h-4'
): React.ReactElement {
  let text = '';
  if (typeof procedureOrTitle === 'string') {
    text = procedureOrTitle;
  } else {
    text = `${procedureOrTitle.title || ''} ${procedureOrTitle.discipline || ''}`;
  }
  return getDisciplineIcon(text, className);
}

/**
 * Returns standard clinical action icons.
 */
export function getClinicalActionIcon(
  action: 
    | 'add-procedure' 
    | 'add-case' 
    | 'plan-next-visit' 
    | 'evidence' 
    | 'rubric' 
    | 'signature' 
    | 'moodle' 
    | 'tooth' 
    | 'milestone' 
    | 'completed' 
    | 'missing-signatures'
    | 'export'
    | string,
  className: string = 'w-4 h-4'
): React.ReactElement {
  switch (action) {
    case 'add-procedure':
      return <PlusCircle className={className} aria-hidden="true" />;
    case 'add-case':
      return <UserPlus className={className} aria-hidden="true" />;
    case 'plan-next-visit':
      return <CalendarClock className={className} aria-hidden="true" />;
    case 'evidence':
      return <Camera className={className} aria-hidden="true" />;
    case 'rubric':
      return <ClipboardCheck className={className} aria-hidden="true" />;
    case 'signature':
      return <FileSignature className={className} aria-hidden="true" />;
    case 'moodle':
      return <UploadCloud className={className} aria-hidden="true" />;
    case 'tooth':
      return <ToothIcon className={className} aria-hidden="true" />;
    case 'milestone':
      return <Flag className={className} aria-hidden="true" />;
    case 'completed':
      return <CheckCircle2 className={className} aria-hidden="true" />;
    case 'missing-signatures':
      return <AlertTriangle className={className} aria-hidden="true" />;
    case 'export':
      return <FileDown className={className} aria-hidden="true" />;
    default:
      return <Activity className={className} aria-hidden="true" />;
  }
}

/**
 * Returns a centralized semantic status icon.
 */
export function getStatusIcon(
  status: string,
  className: string = 'w-4 h-4'
): React.ReactElement {
  const s = (status || '').toLowerCase();
  if (s.includes('complete') || s === 'submitted') {
    return <CheckCircle2 className={className} aria-hidden="true" />;
  }
  if (s.includes('missing') || s.includes('pending') || s.includes('awaiting signatures')) {
    return <AlertTriangle className={className} aria-hidden="true" />;
  }
  if (s.includes('moodle') || s.includes('ready')) {
    return <FileCheck2 className={className} aria-hidden="true" />;
  }
  if (s.includes('progress') || s.includes('active')) {
    return <Clock className={className} aria-hidden="true" />;
  }
  if (s.includes('attention') || s.includes('urgent') || s.includes('overdue')) {
    return <AlertCircle className={className} aria-hidden="true" />;
  }
  if (s.includes('schedule') || s.includes('visit') || s.includes('planned')) {
    return <Calendar className={className} aria-hidden="true" />;
  }
  return <Clock className={className} aria-hidden="true" />;
}

/**
 * Returns the primary navigation icon component.
 */
export function getNavigationIcon(
  tabId: 'dashboard' | 'today' | 'cases' | 'documents' | 'schedule' | 'settings' | string,
  className: string = 'w-5 h-5'
): React.ReactElement {
  switch (tabId) {
    case 'dashboard':
      return <LayoutDashboard className={className} aria-hidden="true" />;
    case 'today':
      return <Stethoscope className={className} aria-hidden="true" />;
    case 'cases':
      return <FolderHeart className={className} aria-hidden="true" />;
    case 'documents':
      return <FileText className={className} aria-hidden="true" />;
    case 'schedule':
      return <CalendarDays className={className} aria-hidden="true" />;
    case 'settings':
      return <Settings className={className} aria-hidden="true" />;
    default:
      return <Activity className={className} aria-hidden="true" />;
  }
}
