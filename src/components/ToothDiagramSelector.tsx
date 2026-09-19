import React, { useState, useMemo, useEffect } from 'react';
import { 
  Check, 
  RotateCcw, 
  Layers, 
  Baby, 
  Sparkles,
  Info,
  ChevronDown,
  ChevronUp,
  Eye
} from 'lucide-react';
import { DisciplineType } from '../types';
import { safeLocalStorage } from '../lib/safeStorage';

export interface ToothInfo {
  fdi: string;
  universal: string;
  palmer: string;
  digitalPalmer: string;
  name: string;
  type: 'molar' | 'premolar' | 'canine' | 'incisor';
  subType?: 'central' | 'lateral' | 'canine' | 'pm1' | 'pm2' | 'm1' | 'm2' | 'm3';
  quadrant: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  quadrantName: string;
  palmerSymbol: string;
  isPediatric?: boolean;
}

// Permanent Teeth Data (32 teeth)
export const PERMANENT_TEETH: ToothInfo[] = [
  // Quadrant 1: Upper Right (18 to 11) - Third molar to central incisor
  { fdi: '18', universal: '1', palmer: '8', digitalPalmer: 'UR8', palmerSymbol: '8┘', name: 'Maxillary Right 3rd Molar', type: 'molar', subType: 'm3', quadrant: 1, quadrantName: 'UR (Q1)' },
  { fdi: '17', universal: '2', palmer: '7', digitalPalmer: 'UR7', palmerSymbol: '7┘', name: 'Maxillary Right 2nd Molar', type: 'molar', subType: 'm2', quadrant: 1, quadrantName: 'UR (Q1)' },
  { fdi: '16', universal: '3', palmer: '6', digitalPalmer: 'UR6', palmerSymbol: '6┘', name: 'Maxillary Right 1st Molar', type: 'molar', subType: 'm1', quadrant: 1, quadrantName: 'UR (Q1)' },
  { fdi: '15', universal: '4', palmer: '5', digitalPalmer: 'UR5', palmerSymbol: '5┘', name: 'Maxillary Right 2nd Premolar', type: 'premolar', subType: 'pm2', quadrant: 1, quadrantName: 'UR (Q1)' },
  { fdi: '14', universal: '5', palmer: '4', digitalPalmer: 'UR4', palmerSymbol: '4┘', name: 'Maxillary Right 1st Premolar', type: 'premolar', subType: 'pm1', quadrant: 1, quadrantName: 'UR (Q1)' },
  { fdi: '13', universal: '6', palmer: '3', digitalPalmer: 'UR3', palmerSymbol: '3┘', name: 'Maxillary Right Canine', type: 'canine', subType: 'canine', quadrant: 1, quadrantName: 'UR (Q1)' },
  { fdi: '12', universal: '7', palmer: '2', digitalPalmer: 'UR2', palmerSymbol: '2┘', name: 'Maxillary Right Lateral Incisor', type: 'incisor', subType: 'lateral', quadrant: 1, quadrantName: 'UR (Q1)' },
  { fdi: '11', universal: '8', palmer: '1', digitalPalmer: 'UR1', palmerSymbol: '1┘', name: 'Maxillary Right Central Incisor', type: 'incisor', subType: 'central', quadrant: 1, quadrantName: 'UR (Q1)' },

  // Quadrant 2: Upper Left (21 to 28) - Central incisor to third molar
  { fdi: '21', universal: '9', palmer: '1', digitalPalmer: 'UL1', palmerSymbol: '└1', name: 'Maxillary Left Central Incisor', type: 'incisor', subType: 'central', quadrant: 2, quadrantName: 'UL (Q2)' },
  { fdi: '22', universal: '10', palmer: '2', digitalPalmer: 'UL2', palmerSymbol: '└2', name: 'Maxillary Left Lateral Incisor', type: 'incisor', subType: 'lateral', quadrant: 2, quadrantName: 'UL (Q2)' },
  { fdi: '23', universal: '11', palmer: '3', digitalPalmer: 'UL3', palmerSymbol: '└3', name: 'Maxillary Left Canine', type: 'canine', subType: 'canine', quadrant: 2, quadrantName: 'UL (Q2)' },
  { fdi: '24', universal: '12', palmer: '4', digitalPalmer: 'UL4', palmerSymbol: '└4', name: 'Maxillary Left 1st Premolar', type: 'premolar', subType: 'pm1', quadrant: 2, quadrantName: 'UL (Q2)' },
  { fdi: '25', universal: '13', palmer: '5', digitalPalmer: 'UL5', palmerSymbol: '└5', name: 'Maxillary Left 2nd Premolar', type: 'premolar', subType: 'pm2', quadrant: 2, quadrantName: 'UL (Q2)' },
  { fdi: '26', universal: '14', palmer: '6', digitalPalmer: 'UL6', palmerSymbol: '└6', name: 'Maxillary Left 1st Molar', type: 'molar', subType: 'm1', quadrant: 2, quadrantName: 'UL (Q2)' },
  { fdi: '27', universal: '15', palmer: '7', digitalPalmer: 'UL7', palmerSymbol: '└7', name: 'Maxillary Left 2nd Molar', type: 'molar', subType: 'm2', quadrant: 2, quadrantName: 'UL (Q2)' },
  { fdi: '28', universal: '16', palmer: '8', digitalPalmer: 'UL8', palmerSymbol: '└8', name: 'Maxillary Left 3rd Molar', type: 'molar', subType: 'm3', quadrant: 2, quadrantName: 'UL (Q2)' },

  // Quadrant 4: Lower Right (48 to 41) - Third molar to central incisor
  { fdi: '48', universal: '32', palmer: '8', digitalPalmer: 'LR8', palmerSymbol: '8┐', name: 'Mandibular Right 3rd Molar', type: 'molar', subType: 'm3', quadrant: 4, quadrantName: 'LR (Q4)' },
  { fdi: '47', universal: '31', palmer: '7', digitalPalmer: 'LR7', palmerSymbol: '7┐', name: 'Mandibular Right 2nd Molar', type: 'molar', subType: 'm2', quadrant: 4, quadrantName: 'LR (Q4)' },
  { fdi: '46', universal: '30', palmer: '6', digitalPalmer: 'LR6', palmerSymbol: '6┐', name: 'Mandibular Right 1st Molar', type: 'molar', subType: 'm1', quadrant: 4, quadrantName: 'LR (Q4)' },
  { fdi: '45', universal: '29', palmer: '5', digitalPalmer: 'LR5', palmerSymbol: '5┐', name: 'Mandibular Right 2nd Premolar', type: 'premolar', subType: 'pm2', quadrant: 4, quadrantName: 'LR (Q4)' },
  { fdi: '44', universal: '28', palmer: '4', digitalPalmer: 'LR4', palmerSymbol: '4┐', name: 'Mandibular Right 1st Premolar', type: 'premolar', subType: 'pm1', quadrant: 4, quadrantName: 'LR (Q4)' },
  { fdi: '43', universal: '27', palmer: '3', digitalPalmer: 'LR3', palmerSymbol: '3┐', name: 'Mandibular Right Canine', type: 'canine', subType: 'canine', quadrant: 4, quadrantName: 'LR (Q4)' },
  { fdi: '42', universal: '26', palmer: '2', digitalPalmer: 'LR2', palmerSymbol: '2┐', name: 'Mandibular Right Lateral Incisor', type: 'incisor', subType: 'lateral', quadrant: 4, quadrantName: 'LR (Q4)' },
  { fdi: '41', universal: '25', palmer: '1', digitalPalmer: 'LR1', palmerSymbol: '1┐', name: 'Mandibular Right Central Incisor', type: 'incisor', subType: 'central', quadrant: 4, quadrantName: 'LR (Q4)' },

  // Quadrant 3: Lower Left (31 to 38) - Central incisor to third molar
  { fdi: '31', universal: '24', palmer: '1', digitalPalmer: 'LL1', palmerSymbol: '┌1', name: 'Mandibular Left Central Incisor', type: 'incisor', subType: 'central', quadrant: 3, quadrantName: 'LL (Q3)' },
  { fdi: '32', universal: '23', palmer: '2', digitalPalmer: 'LL2', palmerSymbol: '┌2', name: 'Mandibular Left Lateral Incisor', type: 'incisor', subType: 'lateral', quadrant: 3, quadrantName: 'LL (Q3)' },
  { fdi: '33', universal: '22', palmer: '3', digitalPalmer: 'LL3', palmerSymbol: '┌3', name: 'Mandibular Left Canine', type: 'canine', subType: 'canine', quadrant: 3, quadrantName: 'LL (Q3)' },
  { fdi: '34', universal: '21', palmer: '4', digitalPalmer: 'LL4', palmerSymbol: '┌4', name: 'Mandibular Left 1st Premolar', type: 'premolar', subType: 'pm1', quadrant: 3, quadrantName: 'LL (Q3)' },
  { fdi: '35', universal: '20', palmer: '5', digitalPalmer: 'LL5', palmerSymbol: '┌5', name: 'Mandibular Left 2nd Premolar', type: 'premolar', subType: 'pm2', quadrant: 3, quadrantName: 'LL (Q3)' },
  { fdi: '36', universal: '19', palmer: '6', digitalPalmer: 'LL6', palmerSymbol: '┌6', name: 'Mandibular Left 1st Molar', type: 'molar', subType: 'm1', quadrant: 3, quadrantName: 'LL (Q3)' },
  { fdi: '37', universal: '18', palmer: '7', digitalPalmer: 'LL7', palmerSymbol: '┌7', name: 'Mandibular Left 2nd Molar', type: 'molar', subType: 'm2', quadrant: 3, quadrantName: 'LL (Q3)' },
  { fdi: '38', universal: '17', palmer: '8', digitalPalmer: 'LL8', palmerSymbol: '┌8', name: 'Mandibular Left 3rd Molar', type: 'molar', subType: 'm3', quadrant: 3, quadrantName: 'LL (Q3)' },
];

// Primary / Pediatric Teeth (20 teeth)
export const DECIDUOUS_TEETH: ToothInfo[] = [
  // Quad 5: Upper Right
  { fdi: '55', universal: 'A', palmer: 'E', digitalPalmer: 'URE', palmerSymbol: 'E┘', name: 'Primary Maxillary Right 2nd Molar', type: 'molar', subType: 'm2', quadrant: 5, quadrantName: 'UR (Q5)', isPediatric: true },
  { fdi: '54', universal: 'B', palmer: 'D', digitalPalmer: 'URD', palmerSymbol: 'D┘', name: 'Primary Maxillary Right 1st Molar', type: 'molar', subType: 'm1', quadrant: 5, quadrantName: 'UR (Q5)', isPediatric: true },
  { fdi: '53', universal: 'C', palmer: 'C', digitalPalmer: 'URC', palmerSymbol: 'C┘', name: 'Primary Maxillary Right Canine', type: 'canine', subType: 'canine', quadrant: 5, quadrantName: 'UR (Q5)', isPediatric: true },
  { fdi: '52', universal: 'D', palmer: 'B', digitalPalmer: 'URB', palmerSymbol: 'B┘', name: 'Primary Maxillary Right Lateral Incisor', type: 'incisor', subType: 'lateral', quadrant: 5, quadrantName: 'UR (Q5)', isPediatric: true },
  { fdi: '51', universal: 'E', palmer: 'A', digitalPalmer: 'URA', palmerSymbol: 'A┘', name: 'Primary Maxillary Right Central Incisor', type: 'incisor', subType: 'central', quadrant: 5, quadrantName: 'UR (Q5)', isPediatric: true },

  // Quad 6: Upper Left
  { fdi: '61', universal: 'F', palmer: 'A', digitalPalmer: 'ULA', palmerSymbol: '└A', name: 'Primary Maxillary Left Central Incisor', type: 'incisor', subType: 'central', quadrant: 6, quadrantName: 'UL (Q6)', isPediatric: true },
  { fdi: '62', universal: 'G', palmer: 'B', digitalPalmer: 'ULB', palmerSymbol: '└B', name: 'Primary Maxillary Left Lateral Incisor', type: 'incisor', subType: 'lateral', quadrant: 6, quadrantName: 'UL (Q6)', isPediatric: true },
  { fdi: '63', universal: 'H', palmer: 'C', digitalPalmer: 'ULC', palmerSymbol: '└C', name: 'Primary Maxillary Left Canine', type: 'canine', subType: 'canine', quadrant: 6, quadrantName: 'UL (Q6)', isPediatric: true },
  { fdi: '64', universal: 'I', palmer: 'D', digitalPalmer: 'ULD', palmerSymbol: '└D', name: 'Primary Maxillary Left 1st Molar', type: 'molar', subType: 'm1', quadrant: 6, quadrantName: 'UL (Q6)', isPediatric: true },
  { fdi: '65', universal: 'J', palmer: 'E', digitalPalmer: 'ULE', palmerSymbol: '└E', name: 'Primary Maxillary Left 2nd Molar', type: 'molar', subType: 'm2', quadrant: 6, quadrantName: 'UL (Q6)', isPediatric: true },

  // Quad 8: Lower Right
  { fdi: '85', universal: 'T', palmer: 'E', digitalPalmer: 'LRE', palmerSymbol: 'E┐', name: 'Primary Mandibular Right 2nd Molar', type: 'molar', subType: 'm2', quadrant: 8, quadrantName: 'LR (Q8)', isPediatric: true },
  { fdi: '84', universal: 'S', palmer: 'D', digitalPalmer: 'LRD', palmerSymbol: 'D┐', name: 'Primary Mandibular Right 1st Molar', type: 'molar', subType: 'm1', quadrant: 8, quadrantName: 'LR (Q8)', isPediatric: true },
  { fdi: '83', universal: 'R', palmer: 'C', digitalPalmer: 'LRC', palmerSymbol: 'C┐', name: 'Primary Mandibular Right Canine', type: 'canine', subType: 'canine', quadrant: 8, quadrantName: 'LR (Q8)', isPediatric: true },
  { fdi: '82', universal: 'Q', palmer: 'B', digitalPalmer: 'LRB', palmerSymbol: 'B┐', name: 'Primary Mandibular Right Lateral Incisor', type: 'incisor', subType: 'lateral', quadrant: 8, quadrantName: 'LR (Q8)', isPediatric: true },
  { fdi: '81', universal: 'P', palmer: 'A', digitalPalmer: 'LRA', palmerSymbol: 'A┐', name: 'Primary Mandibular Right Central Incisor', type: 'incisor', subType: 'central', quadrant: 8, quadrantName: 'LR (Q8)', isPediatric: true },

  // Quad 7: Lower Left
  { fdi: '71', universal: 'O', palmer: 'A', digitalPalmer: 'LLA', palmerSymbol: '┌A', name: 'Primary Mandibular Left Central Incisor', type: 'incisor', subType: 'central', quadrant: 7, quadrantName: 'LL (Q7)', isPediatric: true },
  { fdi: '72', universal: 'N', palmer: 'B', digitalPalmer: 'LLB', palmerSymbol: '┌B', name: 'Primary Mandibular Left Lateral Incisor', type: 'incisor', subType: 'lateral', quadrant: 7, quadrantName: 'LL (Q7)', isPediatric: true },
  { fdi: '73', universal: 'M', palmer: 'C', digitalPalmer: 'LLC', palmerSymbol: '┌C', name: 'Primary Mandibular Left Canine', type: 'canine', subType: 'canine', quadrant: 7, quadrantName: 'LL (Q7)', isPediatric: true },
  { fdi: '74', universal: 'L', palmer: 'D', digitalPalmer: 'LLD', palmerSymbol: '┌D', name: 'Primary Mandibular Left 1st Molar', type: 'molar', subType: 'm1', quadrant: 7, quadrantName: 'LL (Q7)', isPediatric: true },
  { fdi: '75', universal: 'K', palmer: 'E', digitalPalmer: 'LLE', palmerSymbol: '┌E', name: 'Primary Mandibular Left 2nd Molar', type: 'molar', subType: 'm2', quadrant: 7, quadrantName: 'LL (Q7)', isPediatric: true },
];

export type NumberingSystem = 'palmer' | 'fdi' | 'universal';

interface ToothDiagramSelectorProps {
  value: string;
  onChange: (value: string) => void;
  discipline?: DisciplineType;
  label?: string;
  allowSurfaces?: boolean;
  notation?: 'palmer' | 'fdi';
}

const COMMON_SURFACES = ['O', 'MO', 'DO', 'MOD', 'B', 'L', 'P', 'Class I', 'Class II', 'Class III', 'Class IV', 'Class V'];

/* -------------------------------------------------------------------------- */
/*                        ANATOMICAL TOOTH SVG ARTWORK                        */
/* -------------------------------------------------------------------------- */

interface ToothGraphicProps {
  tooth: ToothInfo;
  isUpper: boolean;
  isSelected: boolean;
}

/**
 * BUCCAL (FACIAL) ASPECT SVG
 * Shows anatomical root(s) and crown contours.
 * Upper teeth: Root points UP, Crown points DOWN towards occlusal plane.
 * Lower teeth: Crown points UP towards occlusal plane, Root points DOWN.
 */
const ToothBuccalSVG: React.FC<ToothGraphicProps> = ({ tooth, isUpper, isSelected }) => {
  const crownFill = isSelected ? '#0284c7' : '#f8fafc';
  const crownStroke = isSelected ? '#0369a1' : '#64748b';
  const rootFill = isSelected ? '#38bdf8' : '#fef3c7';
  const rootStroke = isSelected ? '#0284c7' : '#94a3b8';
  const highlight = isSelected ? 'rgba(255,255,255,0.45)' : '#ffffff';
  const detailStroke = isSelected ? '#bae6fd' : '#cbd5e1';

  // Determine specific tooth morphology
  const sub = tooth.subType || 'central';

  // SVG dimensions: 42 x 46. Upper teeth are oriented normally (root top, crown bottom).
  // Lower teeth use transform="rotate(180 21 23)" so crown points up towards occlusal plane!
  const rotation = isUpper ? '' : 'rotate(180 21 23)';

  return (
    <svg 
      viewBox="0 0 42 46" 
      className="w-full h-full drop-shadow-2xs overflow-visible"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g transform={rotation}>
        {/* 1. CENTRAL INCISOR: Broad spade crown, straight incisal edge, single tapering conical root */}
        {sub === 'central' && (
          <g>
            {/* Root */}
            <path
              d="M 15 22 C 16 12, 19 3, 21 2 C 23 3, 26 12, 27 22 Z"
              fill={rootFill}
              stroke={rootStroke}
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
            {/* Crown: Broad trapezoid with nearly 90 deg mesial angle and slight distal rounding */}
            <path
              d="M 14 22 C 18 24, 24 24, 28 22 L 30 38 C 30 40, 29 42, 28 42 L 14 42 C 13 42, 12 41, 12 39 Z"
              fill={crownFill}
              stroke={crownStroke}
              strokeWidth="1.3"
              strokeLinejoin="round"
            />
            {/* Developmental Mamelons / Grooves */}
            <line x1="18" y1="28" x2="18" y2="40" stroke={detailStroke} strokeWidth="0.8" strokeDasharray="2,2" />
            <line x1="24" y1="28" x2="24" y2="40" stroke={detailStroke} strokeWidth="0.8" strokeDasharray="2,2" />
            {/* Enamel Highlight */}
            <path d="M 15 26 L 15 38" stroke={highlight} strokeWidth="1.2" strokeLinecap="round" />
          </g>
        )}

        {/* 2. LATERAL INCISOR: Narrower crown, rounded disto-incisal angle, slender root curved distally */}
        {sub === 'lateral' && (
          <g>
            {/* Root with slight apical curve */}
            <path
              d="M 16 22 C 17 12, 19 4, 23 3 C 24 4, 25 12, 26 22 Z"
              fill={rootFill}
              stroke={rootStroke}
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
            {/* Crown: Rounded disto-incisal angle */}
            <path
              d="M 15 22 C 18 24, 24 24, 27 22 L 28 37 C 28 41, 26 42, 24 42 L 16 42 C 14 42, 14 40, 14 38 Z"
              fill={crownFill}
              stroke={crownStroke}
              strokeWidth="1.3"
              strokeLinejoin="round"
            />
            <line x1="21" y1="28" x2="21" y2="39" stroke={detailStroke} strokeWidth="0.8" strokeDasharray="2,2" />
            <path d="M 16 26 L 16 36" stroke={highlight} strokeWidth="1.1" strokeLinecap="round" />
          </g>
        )}

        {/* 3. CANINE: Distinct spearhead cusp tip, prominent labial ridge, stout longest root */}
        {sub === 'canine' && (
          <g>
            {/* Long stout root */}
            <path
              d="M 15 21 C 16 10, 19 2, 21 1.5 C 23 2, 26 10, 27 21 Z"
              fill={rootFill}
              stroke={rootStroke}
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
            {/* Crown: Pentagonal spear with pointed cusp tip */}
            <path
              d="M 14 21 C 18 23, 24 23, 28 21 L 30 34 L 21 43 L 12 34 Z"
              fill={crownFill}
              stroke={crownStroke}
              strokeWidth="1.3"
              strokeLinejoin="round"
            />
            {/* Prominent Labial Ridge */}
            <line x1="21" y1="24" x2="21" y2="41" stroke={detailStroke} strokeWidth="1" />
            <path d="M 15 25 L 14 33" stroke={highlight} strokeWidth="1.2" strokeLinecap="round" />
          </g>
        )}

        {/* 4. PREMOLAR 1: Bicuspid crown, bifurcated / tapered double root appearance */}
        {sub === 'pm1' && (
          <g>
            {/* Bifurcated / double apex root */}
            <path
              d="M 14 21 C 15 11, 16 5, 17 4 C 19 6, 20 13, 21 15 C 22 13, 23 6, 25 4 C 26 5, 27 11, 28 21 Z"
              fill={rootFill}
              stroke={rootStroke}
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
            {/* Crown: Buccal cusp with shoulder slopes */}
            <path
              d="M 13 21 C 18 23, 24 23, 29 21 L 30 33 L 21 42 L 12 33 Z"
              fill={crownFill}
              stroke={crownStroke}
              strokeWidth="1.3"
              strokeLinejoin="round"
            />
            <line x1="21" y1="25" x2="21" y2="39" stroke={detailStroke} strokeWidth="0.8" />
            <path d="M 15 25 L 14 32" stroke={highlight} strokeWidth="1.1" strokeLinecap="round" />
          </g>
        )}

        {/* 5. PREMOLAR 2: Compact bicuspid crown, single sturdy root */}
        {sub === 'pm2' && (
          <g>
            {/* Single tapering root */}
            <path
              d="M 15 21 C 16 11, 19 3, 21 3 C 23 3, 26 11, 27 21 Z"
              fill={rootFill}
              stroke={rootStroke}
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
            {/* Crown */}
            <path
              d="M 13 21 C 18 23, 24 23, 29 21 L 30 33 L 21 41.5 L 12 33 Z"
              fill={crownFill}
              stroke={crownStroke}
              strokeWidth="1.3"
              strokeLinejoin="round"
            />
            <line x1="21" y1="25" x2="21" y2="39" stroke={detailStroke} strokeWidth="0.8" />
            <path d="M 15 24 L 14 32" stroke={highlight} strokeWidth="1" strokeLinecap="round" />
          </g>
        )}

        {/* 6. MOLAR 1: Wide crown with multiple buccal cusps, multi-rooted (upper 3 roots, lower 2 roots) */}
        {sub === 'm1' && (
          <g>
            {/* Multi-rooted system */}
            {isUpper ? (
              // Upper Molar: 3 roots (Mesiobuccal, Distobuccal, central Palatal shadow)
              <g>
                <path d="M 18 16 C 19 8, 20 3, 21 2 C 22 3, 23 8, 24 16 Z" fill={rootFill} stroke={rootStroke} strokeWidth="0.9" opacity="0.85" />
                <path d="M 9 20 C 11 9, 13 4, 15 3 C 16 6, 17 12, 18 19 Z" fill={rootFill} stroke={rootStroke} strokeWidth="1.1" />
                <path d="M 24 19 C 25 12, 26 6, 27 3 C 29 4, 31 9, 33 20 Z" fill={rootFill} stroke={rootStroke} strokeWidth="1.1" />
              </g>
            ) : (
              // Lower Molar: 2 broad divergent roots with deep furcation
              <g>
                <path d="M 10 20 C 11 10, 13 4, 15 3 C 17 6, 18 13, 19 18 Z" fill={rootFill} stroke={rootStroke} strokeWidth="1.1" />
                <path d="M 23 18 C 24 13, 25 6, 27 3 C 29 4, 31 10, 32 20 Z" fill={rootFill} stroke={rootStroke} strokeWidth="1.1" />
              </g>
            )}
            {/* Wide Crown with 2 Buccal Cusps separated by developmental groove */}
            <path
              d="M 8 20 C 15 23, 27 23, 34 20 L 35 34 C 35 38, 30 42, 28 42 L 21 40 L 14 42 C 12 42, 7 38, 7 34 Z"
              fill={crownFill}
              stroke={crownStroke}
              strokeWidth="1.3"
              strokeLinejoin="round"
            />
            {/* Buccal Developmental Groove */}
            <path d="M 21 22 L 21 37" stroke={detailStroke} strokeWidth="1" />
            <path d="M 10 24 L 9 32" stroke={highlight} strokeWidth="1.2" strokeLinecap="round" />
          </g>
        )}

        {/* 7. MOLAR 2: 4 cusps, slightly more compact, converging roots */}
        {sub === 'm2' && (
          <g>
            {/* Converging roots */}
            <path d="M 11 20 C 13 10, 15 5, 17 4 C 19 7, 20 13, 21 18 Z" fill={rootFill} stroke={rootStroke} strokeWidth="1.1" />
            <path d="M 21 18 C 22 13, 23 7, 25 4 C 27 5, 29 10, 31 20 Z" fill={rootFill} stroke={rootStroke} strokeWidth="1.1" />
            {/* Crown */}
            <path
              d="M 9 20 C 15 23, 27 23, 33 20 L 34 34 C 34 38, 29 41.5, 27 41.5 L 21 39.5 L 15 41.5 C 13 41.5, 8 38, 8 34 Z"
              fill={crownFill}
              stroke={crownStroke}
              strokeWidth="1.3"
              strokeLinejoin="round"
            />
            <path d="M 21 22 L 21 36" stroke={detailStroke} strokeWidth="1" />
            <path d="M 11 24 L 10 32" stroke={highlight} strokeWidth="1" strokeLinecap="round" />
          </g>
        )}

        {/* 8. MOLAR 3 (Wisdom): Fused/curved roots, rounded compact crown */}
        {sub === 'm3' && (
          <g>
            {/* Fused root trunk */}
            <path
              d="M 12 20 C 14 10, 18 4, 21 4 C 24 4, 28 10, 30 20 Z"
              fill={rootFill}
              stroke={rootStroke}
              strokeWidth="1.1"
              strokeLinejoin="round"
            />
            {/* Rounded Crown */}
            <path
              d="M 10 20 C 16 23, 26 23, 32 20 L 33 33 C 33 38, 29 41, 26 41 L 21 39.5 L 16 41 C 13 41, 9 38, 9 33 Z"
              fill={crownFill}
              stroke={crownStroke}
              strokeWidth="1.3"
              strokeLinejoin="round"
            />
            <path d="M 21 23 L 21 35" stroke={detailStroke} strokeWidth="0.8" />
          </g>
        )}
      </g>
    </svg>
  );
};

/**
 * OCCLUSAL (OR INCISAL) ASPECT SVG
 * Shows true anatomical biting morphology:
 * - Incisors: Incisal edge with labial curvature & lingual cingulum.
 * - Canines: Pointed cusp apex with radiating diamond ridges.
 * - Premolars: Bicuspid table with central groove & triangular pits.
 * - Upper Molars: Hallmark Oblique Ridge connecting ML to DB!
 * - Lower Molars: Classic 5-cusp Y or 4-cusp cross (+) fissure pattern!
 */
const ToothOcclusalSVG: React.FC<ToothGraphicProps> = ({ tooth, isUpper, isSelected }) => {
  const tableFill = isSelected ? '#0284c7' : '#ffffff';
  const tableStroke = isSelected ? '#0369a1' : '#64748b';
  const grooveStroke = isSelected ? '#e0f2fe' : '#94a3b8';
  const pitFill = isSelected ? '#ffffff' : '#64748b';
  const highlight = isSelected ? 'rgba(255,255,255,0.6)' : '#f8fafc';

  const sub = tooth.subType || 'central';

  return (
    <svg 
      viewBox="0 0 38 28" 
      className="w-full h-full drop-shadow-2xs overflow-visible"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 1. CENTRAL INCISOR: Thin wedge with incisal edge and lingual cingulum */}
      {sub === 'central' && (
        <g>
          <path
            d="M 6 14 C 6 8, 32 8, 32 14 C 32 19, 26 23, 19 23 C 12 23, 6 19, 6 14 Z"
            fill={tableFill}
            stroke={tableStroke}
            strokeWidth="1.2"
          />
          {/* Incisal edge ridge */}
          <line x1="8" y1="13" x2="30" y2="13" stroke={grooveStroke} strokeWidth="1.2" strokeLinecap="round" />
          {/* Cingulum convexity */}
          <path d="M 15 17 Q 19 20 23 17" stroke={grooveStroke} strokeWidth="0.9" fill="none" />
        </g>
      )}

      {/* 2. LATERAL INCISOR: Smaller rounded oval incisal profile */}
      {sub === 'lateral' && (
        <g>
          <path
            d="M 8 14 C 8 8, 30 8, 30 14 C 30 19, 25 22, 19 22 C 13 22, 8 19, 8 14 Z"
            fill={tableFill}
            stroke={tableStroke}
            strokeWidth="1.2"
          />
          <line x1="10" y1="13" x2="28" y2="13" stroke={grooveStroke} strokeWidth="1.2" strokeLinecap="round" />
          <path d="M 16 17 Q 19 19.5 22 17" stroke={grooveStroke} strokeWidth="0.8" fill="none" />
        </g>
      )}

      {/* 3. CANINE: Diamond / pentagon spear profile with central pointed cusp */}
      {sub === 'canine' && (
        <g>
          <polygon
            points="19,4 32,13 28,24 10,24 6,13"
            fill={tableFill}
            stroke={tableStroke}
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
          {/* Radiating Cusp Ridges */}
          <line x1="19" y1="4" x2="19" y2="15" stroke={grooveStroke} strokeWidth="1.2" />
          <line x1="6" y1="13" x2="19" y2="15" stroke={grooveStroke} strokeWidth="0.9" />
          <line x1="32" y1="13" x2="19" y2="15" stroke={grooveStroke} strokeWidth="0.9" />
          <line x1="19" y1="15" x2="19" y2="24" stroke={grooveStroke} strokeWidth="0.9" />
          <circle cx="19" cy="15" r="1.2" fill={pitFill} />
        </g>
      )}

      {/* 4. PREMOLAR 1: Bicuspid table with central groove and triangular fossae */}
      {sub === 'pm1' && (
        <g>
          {/* Oval Bicuspid Table */}
          <ellipse cx="19" cy="14" rx="14" ry="11" fill={tableFill} stroke={tableStroke} strokeWidth="1.2" />
          {/* Central Developmental Groove */}
          <line x1="11" y1="14" x2="27" y2="14" stroke={grooveStroke} strokeWidth="1.2" strokeLinecap="round" />
          {/* Mesial and Distal triangular grooves & pits */}
          <path d="M 12 11 L 11 14 L 12 17" stroke={grooveStroke} strokeWidth="0.9" fill="none" />
          <path d="M 26 11 L 27 14 L 26 17" stroke={grooveStroke} strokeWidth="0.9" fill="none" />
          <circle cx="12" cy="14" r="1" fill={pitFill} />
          <circle cx="26" cy="14" r="1" fill={pitFill} />
        </g>
      )}

      {/* 5. PREMOLAR 2: Rounded bicuspid with crescent or Y-shaped groove */}
      {sub === 'pm2' && (
        <g>
          <ellipse cx="19" cy="14" rx="13.5" ry="11.5" fill={tableFill} stroke={tableStroke} strokeWidth="1.2" />
          {/* Crescent / Central Groove */}
          <path d="M 12 14 Q 19 16 26 14" stroke={grooveStroke} strokeWidth="1.2" fill="none" />
          {/* Lingual groove for tricuspid variation */}
          <line x1="19" y1="15" x2="19" y2="24" stroke={grooveStroke} strokeWidth="0.9" />
          <circle cx="13" cy="14" r="1" fill={pitFill} />
          <circle cx="25" cy="14" r="1" fill={pitFill} />
        </g>
      )}

      {/* 6. MOLAR 1: 
          Upper Molar: Hallmark Rhomboid with Oblique Ridge (ML to DB) and Cusp of Carabelli!
          Lower Molar: 5 Cusps with Y-groove fissure pattern! 
      */}
      {sub === 'm1' && (
        <g>
          {isUpper ? (
            // UPPER 1ST MOLAR: Rhomboidal contour + OBLIQUE RIDGE
            <g>
              <polygon
                points="7,6 30,5 33,21 10,23"
                fill={tableFill}
                stroke={tableStroke}
                strokeWidth="1.3"
                strokeLinejoin="round"
              />
              {/* OBLIQUE RIDGE connecting Mesiolingual (bottom-left) to Distobuccal (top-right) */}
              <line x1="14" y1="18" x2="26" y2="9" stroke={grooveStroke} strokeWidth="1.6" strokeLinecap="round" />
              {/* Central pit & transverse grooves */}
              <circle cx="17" cy="11" r="1.3" fill={pitFill} />
              <path d="M 9 10 Q 17 11 19 6" stroke={grooveStroke} strokeWidth="1" fill="none" />
              {/* Distal groove */}
              <path d="M 23 15 Q 26 18 31 16" stroke={grooveStroke} strokeWidth="1" fill="none" />
              {/* Carabelli cusp crease on ML */}
              <path d="M 8 19 Q 12 21 11 23" stroke={grooveStroke} strokeWidth="0.8" fill="none" opacity="0.8" />
            </g>
          ) : (
            // LOWER 1ST MOLAR: 5 Cusps (MB, DB, Distal, ML, DL) with Y-groove pattern
            <g>
              <path
                d="M 6 6 L 31 6 C 34 11, 34 17, 31 22 L 6 22 Z"
                fill={tableFill}
                stroke={tableStroke}
                strokeWidth="1.3"
                strokeLinejoin="round"
              />
              {/* Central Mesiodistal groove */}
              <line x1="8" y1="14" x2="29" y2="14" stroke={grooveStroke} strokeWidth="1.2" />
              {/* Buccal grooves (2 for 3 buccal cusps) */}
              <line x1="15" y1="14" x2="15" y2="6" stroke={grooveStroke} strokeWidth="1.1" />
              <line x1="24" y1="14" x2="25" y2="6" stroke={grooveStroke} strokeWidth="1" />
              {/* Lingual groove */}
              <line x1="18" y1="14" x2="18" y2="22" stroke={grooveStroke} strokeWidth="1.1" />
              {/* Central fossa pit */}
              <circle cx="18" cy="14" r="1.2" fill={pitFill} />
            </g>
          )}
        </g>
      )}

      {/* 7. MOLAR 2: 
          Upper: 4 cusps, smaller distopalatal.
          Lower: Hallmark CROSS (+) FISSURE PATTERN dividing 4 equal cusps!
      */}
      {sub === 'm2' && (
        <g>
          {isUpper ? (
            // Upper 2nd Molar: Rhomboid with 4 cusps
            <g>
              <polygon
                points="8,6 29,6 31,21 10,22"
                fill={tableFill}
                stroke={tableStroke}
                strokeWidth="1.3"
                strokeLinejoin="round"
              />
              {/* Oblique ridge */}
              <line x1="14" y1="17" x2="25" y2="9" stroke={grooveStroke} strokeWidth="1.4" strokeLinecap="round" />
              <circle cx="17" cy="11" r="1.1" fill={pitFill} />
            </g>
          ) : (
            // Lower 2nd Molar: Classic CROSS (+) FISSURE dividing into 4 equal quadrants!
            <g>
              <rect x="6" y="5" width="26" height="18" rx="4" fill={tableFill} stroke={tableStroke} strokeWidth="1.3" />
              {/* Cross (+) fissure */}
              <line x1="7" y1="14" x2="31" y2="14" stroke={grooveStroke} strokeWidth="1.4" strokeLinecap="round" />
              <line x1="19" y1="6" x2="19" y2="22" stroke={grooveStroke} strokeWidth="1.4" strokeLinecap="round" />
              {/* Central pit at crosshair */}
              <circle cx="19" cy="14" r="1.3" fill={pitFill} />
            </g>
          )}
        </g>
      )}

      {/* 8. MOLAR 3: Compact multi-grooved occlusal table */}
      {sub === 'm3' && (
        <g>
          <ellipse cx="19" cy="14" rx="12" ry="9.5" fill={tableFill} stroke={tableStroke} strokeWidth="1.2" />
          <line x1="10" y1="14" x2="28" y2="14" stroke={grooveStroke} strokeWidth="1" />
          <line x1="19" y1="7" x2="19" y2="21" stroke={grooveStroke} strokeWidth="1" />
          <circle cx="19" cy="14" r="1" fill={pitFill} />
        </g>
      )}
    </svg>
  );
};

/* -------------------------------------------------------------------------- */
/*                       MAIN TOOTH DIAGRAM SELECTOR                          */
/* -------------------------------------------------------------------------- */

/**
 * Strict parser to extract FDI tooth numbers from the formatted case string.
 * Supports Palmer symbols (1┘, └2, etc.), FDI numbers (11, 21), and Universal numbers.
 */
function parseFdiFromValue(val: string, isPediatric: boolean): string[] {
  if (!val || typeof val !== 'string') return [];
  const trimmed = val.trim();
  if (!trimmed) return [];

  const validTeeth = isPediatric ? DECIDUOUS_TEETH : PERMANENT_TEETH;

  // 1. Direct match from Digital Palmer (e.g. "UL3", "LL5", "LR6", "UR1", "ULA")
  const digitalPalmerMatches = validTeeth.filter((t) => {
    const regex = new RegExp(`\\b${t.digitalPalmer}\\b`, 'i');
    return regex.test(trimmed);
  });
  if (digitalPalmerMatches.length > 0) {
    return digitalPalmerMatches.map((t) => t.fdi);
  }

  // 2. Direct match from legacy Palmer symbols (e.g. "Tooth 1┘", "Teeth 1┘, 2┘", "└A")
  const palmerMatches = validTeeth.filter((t) => trimmed.includes(t.palmerSymbol));
  if (palmerMatches.length > 0) {
    return palmerMatches.map((t) => t.fdi);
  }

  // 3. Direct match from "(FDI 11, 21)" or "(FDI 14, #12)" format
  const fdiSection = trimmed.match(/FDI\s+([0-9,\s]+)/i);
  if (fdiSection) {
    const ids = fdiSection[1]
      .split(',')
      .map((s) => s.trim())
      .filter((s) => /^\d{2}$/.test(s));
    if (ids.length > 0) return Array.from(new Set(ids));
  }

  // 4. Direct 2-digit FDI numbers: e.g. "Tooth 16" or "11, 21" or "46"
  const twoDigitMatches = trimmed.match(/\b([1-8][1-8])\b/g);
  if (twoDigitMatches && twoDigitMatches.length > 0) {
    const validIds = twoDigitMatches.filter((id) => validTeeth.some((t) => t.fdi === id));
    if (validIds.length > 0) return Array.from(new Set(validIds));
  }

  // 5. Universal notation: e.g. "#14", "#8"
  const uniMatches = trimmed.match(/#([0-9]{1,2}|[A-T])/gi);
  if (uniMatches) {
    const matched: string[] = [];
    uniMatches.forEach((u) => {
      const cleanU = u.replace('#', '').toUpperCase();
      const t = validTeeth.find((item) => item.universal.toUpperCase() === cleanU);
      if (t) matched.push(t.fdi);
    });
    if (matched.length > 0) return Array.from(new Set(matched));
  }

  return [];
}

export const ToothDiagramSelector: React.FC<ToothDiagramSelectorProps> = ({
  value,
  onChange,
  discipline,
  label = 'Tooth Selection (Quadrant Diagram)',
  allowSurfaces = true,
  notation,
}) => {
  // Pediatric teeth are ONLY shown when Pediatric Dentistry is selected.
  // When Pediatric Dentistry is selected, adult teeth are hidden and only pediatric teeth are shown.
  // For all other disciplines, pediatric teeth are hidden and adult teeth are shown.
  const isPediatric = discipline ? discipline === 'Pediatric Dentistry' : /primary|pediatric|deciduous/i.test(value);

  // Active tooth numbering notation preference: Palmer (default) or FDI 2-digit
  const effectiveNotation: 'palmer' | 'fdi' =
    notation ||
    (safeLocalStorage.getItem('dentatrack_notation') as 'palmer' | 'fdi') ||
    'palmer';

  const [selectedSurface, setSelectedSurface] = useState<string>('');
  const [hoveredTooth, setHoveredTooth] = useState<ToothInfo | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  // Local state for exact selected FDI numbers
  const [selectedFdis, setSelectedFdis] = useState<string[]>(() => {
    return parseFdiFromValue(value, isPediatric);
  });

  // Synchronize when value or discipline changes
  useEffect(() => {
    const parsed = parseFdiFromValue(value, isPediatric);
    setSelectedFdis(parsed);
  }, [value, isPediatric]);

  // Teeth dataset according to dentition mode
  const currentTeeth = isPediatric ? DECIDUOUS_TEETH : PERMANENT_TEETH;

  // Quadrants breakdown
  const qUpperRight = useMemo(() => {
    const quadId = isPediatric ? 5 : 1;
    return currentTeeth.filter((t) => t.quadrant === quadId);
  }, [currentTeeth, isPediatric]);

  const qUpperLeft = useMemo(() => {
    const quadId = isPediatric ? 6 : 2;
    return currentTeeth.filter((t) => t.quadrant === quadId);
  }, [currentTeeth, isPediatric]);

  const qLowerRight = useMemo(() => {
    const quadId = isPediatric ? 8 : 4;
    return currentTeeth.filter((t) => t.quadrant === quadId);
  }, [currentTeeth, isPediatric]);

  const qLowerLeft = useMemo(() => {
    const quadId = isPediatric ? 7 : 3;
    return currentTeeth.filter((t) => t.quadrant === quadId);
  }, [currentTeeth, isPediatric]);

  // Format the resulting string representation according to the chosen notation
  const updateToothString = (fdiList: string[], surface: string = selectedSurface) => {
    if (fdiList.length === 0) {
      onChange(surface ? surface : '');
      return;
    }

    if (fdiList.length === 1) {
      const tooth = currentTeeth.find((t) => t.fdi === fdiList[0]);
      if (tooth) {
        let labelStr = effectiveNotation === 'palmer'
          ? `Tooth ${tooth.digitalPalmer}`
          : `Tooth #${tooth.fdi}`;
        if (surface) {
          labelStr += ` [${surface}]`;
        }
        onChange(labelStr);
        return;
      }
    }

    // Multiple teeth selected
    const sorted = [...fdiList].sort();
    let labelStr = '';
    if (effectiveNotation === 'palmer') {
      const palmerSymbols = sorted.map((fdi) => {
        const t = currentTeeth.find((item) => item.fdi === fdi);
        return t ? t.digitalPalmer : fdi;
      });
      labelStr = `Teeth ${palmerSymbols.join(', ')}`;
    } else {
      labelStr = `Teeth #${sorted.join(', #')}`;
    }

    if (surface) {
      labelStr += ` [${surface}]`;
    }
    onChange(labelStr);
  };

  // Toggle single tooth selection: pressing on a selected tooth DESELECTS it immediately
  const handleToggleTooth = (fdi: string) => {
    const isCurrentlySelected = selectedFdis.includes(fdi);
    let nextList: string[];
    if (isCurrentlySelected) {
      // Deselect
      nextList = selectedFdis.filter((id) => id !== fdi);
    } else {
      // Select
      nextList = [...selectedFdis, fdi];
    }
    setSelectedFdis(nextList);
    updateToothString(nextList);
  };

  // Preset arch / quadrant selections
  const handleSelectQuadrant = (teethInQuad: ToothInfo[]) => {
    const quadFdi = teethInQuad.map((t) => t.fdi);
    const allSelected = quadFdi.every((id) => selectedFdis.includes(id));
    let nextList: string[];
    if (allSelected) {
      nextList = selectedFdis.filter((id) => !quadFdi.includes(id));
    } else {
      nextList = Array.from(new Set([...selectedFdis, ...quadFdi]));
    }
    setSelectedFdis(nextList);
    updateToothString(nextList);
  };

  const handleSelectArch = (arch: 'upper' | 'lower') => {
    const archTeeth = arch === 'upper' 
      ? [...qUpperRight, ...qUpperLeft] 
      : [...qLowerRight, ...qLowerLeft];
    const archFdi = archTeeth.map((t) => t.fdi);
    const allSelected = archFdi.every((id) => selectedFdis.includes(id));
    
    let nextList: string[];
    if (allSelected) {
      nextList = selectedFdis.filter((id) => !archFdi.includes(id));
    } else {
      nextList = Array.from(new Set([...selectedFdis, ...archFdi]));
    }
    setSelectedFdis(nextList);
    updateToothString(nextList);
  };

  const handleSelectFullMouth = () => {
    const allFdi = currentTeeth.map((t) => t.fdi);
    const allSelected = allFdi.every((id) => selectedFdis.includes(id));
    if (allSelected) {
      setSelectedFdis([]);
      onChange('');
    } else {
      setSelectedFdis(allFdi);
      updateToothString(allFdi);
    }
  };

  const handleClear = () => {
    setSelectedFdis([]);
    setSelectedSurface('');
    onChange('');
  };

  const handleSelectSurface = (surf: string) => {
    const nextSurface = selectedSurface === surf ? '' : surf;
    setSelectedSurface(nextSurface);
    updateToothString(selectedFdis, nextSurface);
  };

  // Renders a single tooth card displaying both Buccal & Occlusal views + single chosen notation below
  const renderToothCard = (tooth: ToothInfo, isUpper: boolean) => {
    const isSelected = selectedFdis.includes(tooth.fdi);

    // Authentic Palmer Bracket borders:
    let palmerBracketClass = '';
    if (tooth.quadrant === 1 || tooth.quadrant === 5) {
      palmerBracketClass = 'border-b sm:border-b-2 border-r sm:border-r-2 pr-0.5 pb-0.5';
    } else if (tooth.quadrant === 2 || tooth.quadrant === 6) {
      palmerBracketClass = 'border-b sm:border-b-2 border-l sm:border-l-2 pl-0.5 pb-0.5';
    } else if (tooth.quadrant === 4 || tooth.quadrant === 8) {
      palmerBracketClass = 'border-t sm:border-t-2 border-r sm:border-r-2 pr-0.5 pt-0.5';
    } else if (tooth.quadrant === 3 || tooth.quadrant === 7) {
      palmerBracketClass = 'border-t sm:border-t-2 border-l sm:border-l-2 pl-0.5 pt-0.5';
    }

    return (
      <button
        key={tooth.fdi}
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleToggleTooth(tooth.fdi);
        }}
        onMouseEnter={() => setHoveredTooth(tooth)}
        onMouseLeave={() => setHoveredTooth(null)}
        className={`w-full min-w-0 p-0.5 sm:p-1 rounded-md sm:rounded-xl flex flex-col items-center justify-between transition-colors cursor-pointer relative select-none touch-manipulation active:opacity-85 ${
          isSelected
            ? 'bg-sky-100 border-2 border-sky-500 shadow-sm ring-1 ring-sky-300 z-10'
            : 'bg-white hover:bg-sky-50/50 border border-slate-200 hover:border-sky-300'
        }`}
        title={`${tooth.name} • Digital Palmer: ${tooth.digitalPalmer} • FDI #${tooth.fdi} • Universal #${tooth.universal}`}
      >
        {/* UPPER ARCH: Buccal on top, Occlusal below */}
        {isUpper ? (
          <>
            {/* 1. Buccal Aspect */}
            <div className="w-full h-7 xs:h-8 sm:h-11 flex items-center justify-center pointer-events-none relative">
              <ToothBuccalSVG tooth={tooth} isUpper={true} isSelected={isSelected} />
              <span className="hidden md:block absolute top-0 right-0 text-[6px] text-slate-400 font-bold bg-slate-100/90 px-0.5 rounded pointer-events-none">
                B
              </span>
            </div>

            {/* 2. Occlusal Aspect */}
            <div className="w-full h-4 xs:h-5 sm:h-7 flex items-center justify-center my-0.5 pointer-events-none relative">
              <ToothOcclusalSVG tooth={tooth} isUpper={true} isSelected={isSelected} />
              <span className="hidden md:block absolute top-0 right-0 text-[6px] text-slate-400 font-bold bg-slate-100/90 px-0.5 rounded pointer-events-none">
                O
              </span>
            </div>

            {/* 3. Notation Labeled Below the Picture (Digital Palmer OR FDI) */}
            <div className="w-full pt-0.5 sm:pt-1 border-t border-slate-100 flex items-center justify-center pointer-events-none min-h-[22px]">
              {effectiveNotation === 'palmer' ? (
                <span 
                  className={`font-black text-[10px] sm:text-[12px] leading-tight tracking-tight ${
                    isSelected ? 'text-sky-700 font-extrabold' : 'text-slate-800'
                  }`}
                >
                  {tooth.digitalPalmer}
                </span>
              ) : (
                <span className={`font-black text-[11px] sm:text-[12px] leading-none ${
                  isSelected ? 'text-sky-700' : 'text-slate-800'
                }`}>
                  #{tooth.fdi}
                </span>
              )}
            </div>
          </>
        ) : (
          /* LOWER ARCH: Occlusal on top, Buccal below */
          <>
            {/* 1. Occlusal Aspect */}
            <div className="w-full h-4 xs:h-5 sm:h-7 flex items-center justify-center my-0.5 pointer-events-none relative">
              <ToothOcclusalSVG tooth={tooth} isUpper={false} isSelected={isSelected} />
              <span className="hidden md:block absolute top-0 right-0 text-[6px] text-slate-400 font-bold bg-slate-100/90 px-0.5 rounded pointer-events-none">
                O
              </span>
            </div>

            {/* 2. Buccal Aspect */}
            <div className="w-full h-7 xs:h-8 sm:h-11 flex items-center justify-center pointer-events-none relative">
              <ToothBuccalSVG tooth={tooth} isUpper={false} isSelected={isSelected} />
              <span className="hidden md:block absolute bottom-0 right-0 text-[6px] text-slate-400 font-bold bg-slate-100/90 px-0.5 rounded pointer-events-none">
                B
              </span>
            </div>

            {/* 3. Notation Labeled Below the Picture (Digital Palmer OR FDI) */}
            <div className="w-full pt-0.5 sm:pt-1 border-t border-slate-100 flex items-center justify-center pointer-events-none min-h-[22px]">
              {effectiveNotation === 'palmer' ? (
                <span 
                  className={`font-black text-[10px] sm:text-[12px] leading-tight tracking-tight ${
                    isSelected ? 'text-sky-700 font-extrabold' : 'text-slate-800'
                  }`}
                >
                  {tooth.digitalPalmer}
                </span>
              ) : (
                <span className={`font-black text-[11px] sm:text-[12px] leading-none ${
                  isSelected ? 'text-sky-700' : 'text-slate-800'
                }`}>
                  #{tooth.fdi}
                </span>
              )}
            </div>
          </>
        )}

        {/* Selection Checkmark Badge */}
        {isSelected && (
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-sky-600 text-white rounded-full flex items-center justify-center text-[8px] sm:text-[9px] shadow-xs pointer-events-none font-bold">
            ✓
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="rounded-2xl bg-white/95 border border-sky-200/90 shadow-xs p-2.5 sm:p-4 space-y-2.5 sm:space-y-3 w-full">
      {/* Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-sky-600" />
            <span>{label}</span>
          </span>
          {value && (
            <span className="px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 text-[10px] sm:text-[11px] font-bold">
              {value}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-[11px]">
          {/* Dentition Indicator (Context-Aware: Pediatric vs Adult) */}
          {isPediatric ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 font-bold text-[10px] sm:text-[11px] border border-amber-200 shadow-2xs">
              <Baby className="w-3.5 h-3.5 text-amber-600" />
              <span>Pediatric Dentition (20)</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold text-[10px] sm:text-[11px] border border-slate-200">
              <span>Adult Dentition (32)</span>
            </span>
          )}

          {/* Notation Indicator Badge */}
          <span className="px-2 py-1 rounded-lg bg-sky-50 text-sky-700 font-bold text-[10px] sm:text-[11px] border border-sky-200">
            {effectiveNotation === 'palmer' ? 'Digital Palmer' : 'FDI Notation'}
          </span>

          {/* Expand / Collapse Button */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            title={isExpanded ? 'Collapse Diagram' : 'Expand Diagram'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-2 sm:space-y-3 animate-in fade-in duration-150 w-full">
          {/* Quick Presets & Clear */}
          <div className="flex flex-wrap items-center justify-between gap-1.5 text-[11px]">
            <div className="flex flex-wrap items-center gap-1 text-slate-600">
              <span className="font-semibold text-slate-400 mr-0.5">Quick Presets:</span>
              <button
                type="button"
                onClick={() => handleSelectArch('upper')}
                className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-sky-50 hover:text-sky-700 border border-slate-200/80 transition cursor-pointer font-medium text-[10px] sm:text-[11px]"
              >
                Maxillary (Upper)
              </button>
              <button
                type="button"
                onClick={() => handleSelectArch('lower')}
                className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-sky-50 hover:text-sky-700 border border-slate-200/80 transition cursor-pointer font-medium text-[10px] sm:text-[11px]"
              >
                Mandibular (Lower)
              </button>
              <button
                type="button"
                onClick={handleSelectFullMouth}
                className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-purple-50 hover:text-purple-700 border border-slate-200/80 transition cursor-pointer font-medium text-[10px] sm:text-[11px]"
              >
                Full Mouth
              </button>
            </div>

            {selectedFdis.length > 0 && (
              <button
                type="button"
                onClick={handleClear}
                className="text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1 font-semibold cursor-pointer ml-auto text-[10px] sm:text-[11px]"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Clear</span>
              </button>
            )}
          </div>

          {/* Orientation & Legend Notice */}
          <div className="flex flex-wrap items-center justify-between text-[9px] sm:text-[10px] font-bold text-slate-400 px-0.5 uppercase tracking-wider">
            <span>← Patient&apos;s Right (UR / LR)</span>
            <div className="flex items-center gap-2 sm:gap-3 normal-case font-medium text-slate-500">
              <span className="flex items-center gap-0.5">
                <span className="font-bold text-slate-700">B</span> = Buccal
              </span>
              <span className="flex items-center gap-0.5">
                <span className="font-bold text-slate-700">O</span> = Occlusal
              </span>
              <span className="text-sky-700 font-bold hidden xs:inline">
                {effectiveNotation === 'palmer' ? 'Digital Palmer (UR / UL / LL / LR)' : 'FDI 2-Digit System'}
              </span>
            </div>
            <span>Patient&apos;s Left (UL / LL) →</span>
          </div>

          {/* 
            DENTAL ODONTOGRAM GRID:
            Guaranteed responsive fit on all screens (mobile to desktop) with ZERO horizontal scrolling needed!
            The horizontal line separating upper and lower is the border-b-2 of the upper arch.
            The vertical midline separating right and left is the border-r-2 of the right quadrants.
          */}
          <div className="rounded-xl sm:rounded-2xl bg-[#f8fbfe] border border-sky-200 p-1 sm:p-2.5 w-full overflow-hidden">
            <div className="w-full mx-auto select-none space-y-0">
              
              {/* UPPER ARCH (MAXILLARY) */}
              <div className="grid grid-cols-2 border-b-2 border-sky-400 pb-1 sm:pb-2">
                {/* Quadrant 1 / 5: Upper Right */}
                <div className="border-r-2 border-sky-400 pr-1 sm:pr-2 flex flex-col justify-between">
                  <div className="w-full flex items-center justify-between pb-0.5 px-0.5">
                    <button
                      type="button"
                      onClick={() => handleSelectQuadrant(qUpperRight)}
                      className="text-[9px] sm:text-[10px] font-extrabold text-sky-800 hover:text-sky-600 uppercase tracking-wider hover:underline cursor-pointer flex items-center gap-0.5"
                    >
                      <span>{isPediatric ? (effectiveNotation === 'palmer' ? 'Q5: UR' : 'Q5 (51-55)') : (effectiveNotation === 'palmer' ? 'Q1: UR' : 'Q1 (11-18)')}</span>
                      {effectiveNotation === 'palmer' && <span className="text-sky-500 font-normal">┘</span>}
                    </button>
                    <span className="text-[8px] sm:text-[9px] text-slate-400 font-medium hidden xs:inline">Midline →</span>
                  </div>
                  {/* Teeth columns */}
                  <div className={`grid ${isPediatric ? 'grid-cols-5' : 'grid-cols-8'} gap-0.5 sm:gap-1 w-full`}>
                    {qUpperRight.map((tooth) => renderToothCard(tooth, true))}
                  </div>
                </div>

                {/* Quadrant 2 / 6: Upper Left */}
                <div className="pl-1 sm:pl-2 flex flex-col justify-between">
                  <div className="w-full flex items-center justify-between pb-0.5 px-0.5">
                    <span className="text-[8px] sm:text-[9px] text-slate-400 font-medium hidden xs:inline">← Midline</span>
                    <button
                      type="button"
                      onClick={() => handleSelectQuadrant(qUpperLeft)}
                      className="text-[9px] sm:text-[10px] font-extrabold text-sky-800 hover:text-sky-600 uppercase tracking-wider hover:underline cursor-pointer flex items-center gap-0.5"
                    >
                      {effectiveNotation === 'palmer' && <span className="text-sky-500 font-normal">└</span>}
                      <span>{isPediatric ? (effectiveNotation === 'palmer' ? 'Q6: UL' : 'Q6 (61-65)') : (effectiveNotation === 'palmer' ? 'Q2: UL' : 'Q2 (21-28)')}</span>
                    </button>
                  </div>
                  {/* Teeth columns */}
                  <div className={`grid ${isPediatric ? 'grid-cols-5' : 'grid-cols-8'} gap-0.5 sm:gap-1 w-full`}>
                    {qUpperLeft.map((tooth) => renderToothCard(tooth, true))}
                  </div>
                </div>
              </div>

              {/* HORIZONTAL OCCLUSAL DIVIDER LABEL */}
              <div className="relative h-3.5 sm:h-4 flex items-center justify-center my-0.5">
                <span className="bg-sky-100 text-sky-800 border border-sky-300 text-[8px] sm:text-[9px] font-black uppercase px-1.5 sm:px-2 py-0.2 rounded-full tracking-wider shadow-2xs z-10">
                  Occlusal Plane (Midline)
                </span>
              </div>

              {/* LOWER ARCH (MANDIBULAR) */}
              <div className="grid grid-cols-2 border-t-2 border-sky-400 pt-1 sm:pt-2">
                {/* Quadrant 4 / 8: Lower Right */}
                <div className="border-r-2 border-sky-400 pr-1 sm:pr-2 flex flex-col justify-between">
                  {/* Teeth columns */}
                  <div className={`grid ${isPediatric ? 'grid-cols-5' : 'grid-cols-8'} gap-0.5 sm:gap-1 w-full`}>
                    {qLowerRight.map((tooth) => renderToothCard(tooth, false))}
                  </div>
                  <div className="w-full flex items-center justify-between pt-0.5 px-0.5">
                    <button
                      type="button"
                      onClick={() => handleSelectQuadrant(qLowerRight)}
                      className="text-[9px] sm:text-[10px] font-extrabold text-sky-800 hover:text-sky-600 uppercase tracking-wider hover:underline cursor-pointer flex items-center gap-0.5"
                    >
                      <span>{isPediatric ? (effectiveNotation === 'palmer' ? 'Q8: LR' : 'Q8 (81-85)') : (effectiveNotation === 'palmer' ? 'Q4: LR' : 'Q4 (41-48)')}</span>
                      {effectiveNotation === 'palmer' && <span className="text-sky-500 font-normal">┐</span>}
                    </button>
                    <span className="text-[8px] sm:text-[9px] text-slate-400 font-medium hidden xs:inline">Midline →</span>
                  </div>
                </div>

                {/* Quadrant 3 / 7: Lower Left */}
                <div className="pl-1 sm:pl-2 flex flex-col justify-between">
                  {/* Teeth columns */}
                  <div className={`grid ${isPediatric ? 'grid-cols-5' : 'grid-cols-8'} gap-0.5 sm:gap-1 w-full`}>
                    {qLowerLeft.map((tooth) => renderToothCard(tooth, false))}
                  </div>
                  <div className="w-full flex items-center justify-between pt-0.5 px-0.5">
                    <span className="text-[8px] sm:text-[9px] text-slate-400 font-medium hidden xs:inline">← Midline</span>
                    <button
                      type="button"
                      onClick={() => handleSelectQuadrant(qLowerLeft)}
                      className="text-[9px] sm:text-[10px] font-extrabold text-sky-800 hover:text-sky-600 uppercase tracking-wider hover:underline cursor-pointer flex items-center gap-0.5"
                    >
                      {effectiveNotation === 'palmer' && <span className="text-sky-500 font-normal">┌</span>}
                      <span>{isPediatric ? (effectiveNotation === 'palmer' ? 'Q7: LL' : 'Q7 (71-75)') : (effectiveNotation === 'palmer' ? 'Q3: LL' : 'Q3 (31-38)')}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Hovered / Selected Tooth Anatomical Detail Bar */}
          <div className="min-h-5 flex flex-wrap items-center justify-between text-[10px] sm:text-[11px] px-1 text-slate-600">
            {hoveredTooth ? (
              <span className="font-semibold text-sky-800 flex items-center gap-1.5 animate-in fade-in duration-100">
                <Sparkles className="w-3.5 h-3.5 text-sky-500" />
                <span>
                  <strong>{hoveredTooth.name}</strong> • {effectiveNotation === 'palmer' ? `Palmer: ${hoveredTooth.palmerSymbol}` : `FDI: ${hoveredTooth.fdi}`}
                </span>
              </span>
            ) : selectedFdis.length > 0 ? (
              <span className="text-slate-600 font-medium">
                {selectedFdis.length} {selectedFdis.length === 1 ? 'tooth' : 'teeth'} selected: {value}
              </span>
            ) : (
              <span className="text-slate-400 italic">
                Tap any tooth in the diagram to select or deselect.
              </span>
            )}
          </div>

          {/* Cavity / Restoration Surface Chips */}
          {allowSurfaces && (
            <div className="pt-2 border-t border-slate-100 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700">
                  Cavity / Surface Classification (Optional):
                </span>
                {selectedSurface && (
                  <button
                    type="button"
                    onClick={() => handleSelectSurface('')}
                    className="text-[10px] text-slate-400 hover:text-rose-600 hover:underline cursor-pointer"
                  >
                    Clear Surface
                  </button>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-1">
                {COMMON_SURFACES.map((surf) => {
                  const isSurfSelected = selectedSurface === surf;
                  return (
                    <button
                      key={surf}
                      type="button"
                      onClick={() => handleSelectSurface(surf)}
                      className={`px-2 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                        isSurfSelected
                          ? 'bg-purple-600 text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {surf}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
