'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  Sparkles, 
  ArrowLeft, 
  BookOpen, 
  GraduationCap, 
  FileText, 
  Download, 
  AlertTriangle, 
  CheckCircle,
  Calendar,
  Layers,
  Gamepad2,
  Users,
  Compass,
  ListTodo,
  Loader2,
  MessageSquare,
  Send,
  History,
  X,
  ArrowUp,
  ArrowDown,
  Plus,
  BookOpenCheck,
  Gauge,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';

// Import client-side libraries dynamically to avoid SSR/bundle issues
let docxLib: any;
let jspdfLib: any;

interface SessionMetadata {
  title: string;
  tipoOa: string;
  objetivo: string;
  evaluacion: string;
}

interface AdaptationRow {
  level: string;
  materials: string;
  practice: string;
  ticket: string;
}

const extractMetadataBlock = (text: string): { metadata: SessionMetadata | null; rest: string } => {
  const lines = text.split('\n');
  let title = '';
  let tipoOa = '';
  let objetivo = '';
  let evaluacion = '';
  let headerEndIndex = -1;
  let parsedFromTable = false;

  // 1. Try to find the title line (starts with SESIÓN X)
  for (let i = 0; i < Math.min(lines.length, 25); i++) {
    const cleanLine = lines[i].replace(/\*\*|__/g, '').trim();
    if (/^SESI[ÓO]N\s+\d+/i.test(cleanLine)) {
      title = cleanLine;
      headerEndIndex = i;
      break;
    }
  }

  // 2. Try parsing from the old Markdown table style
  let tableStartIndex = -1;
  let tableEndIndex = -1;
  for (let i = 0; i < Math.min(lines.length, 25); i++) {
    const trimmed = lines[i].trim();
    if (trimmed.startsWith('|') && trimmed.includes('Curso') && trimmed.includes('|')) {
      tableStartIndex = i;
      break;
    }
  }

  if (tableStartIndex !== -1) {
    // Parse rows of the table
    for (let i = tableStartIndex; i < Math.min(lines.length, tableStartIndex + 15); i++) {
      const trimmed = lines[i].trim();
      if (!trimmed.startsWith('|')) {
        tableEndIndex = i - 1;
        break;
      }
      const parts = trimmed.split('|').map(p => p.trim());
      if (parts.length >= 3) {
        const field = parts[1].replace(/\*\*/g, '').trim().toLowerCase();
        const value = parts[2].trim();
        if (field.includes('tipo') || field.includes('oa')) {
          tipoOa = value;
        } else if (field.includes('objetivo')) {
          objetivo = value;
        } else if (field.includes('evaluacin') || field.includes('evaluación')) {
          evaluacion = value;
        }
      }
      tableEndIndex = i;
    }
    if (tipoOa || objetivo || evaluacion) {
      parsedFromTable = true;
      headerEndIndex = Math.max(headerEndIndex, tableEndIndex);
    }
  }

  // 3. If not parsed from table, try line-by-line key/value parsing
  if (!parsedFromTable) {
    for (let i = 0; i < Math.min(lines.length, 25); i++) {
      const cleanLine = lines[i].replace(/\*\*|__/g, '').trim();
      if (/^Tipo\s*\/\s*OA\s*:/i.test(cleanLine)) {
        tipoOa = cleanLine.replace(/^Tipo\s*\/\s*OA\s*:\s*/i, '').trim();
        headerEndIndex = Math.max(headerEndIndex, i);
      } else if (/^Objetivo\s*:/i.test(cleanLine)) {
        objetivo = cleanLine.replace(/^Objetivo\s*:\s*/i, '').trim();
        headerEndIndex = Math.max(headerEndIndex, i);
      } else if (/^Evaluaci[oó]n\s*:/i.test(cleanLine)) {
        evaluacion = cleanLine.replace(/^Evaluaci[oó]n\s*:\s*/i, '').trim();
        headerEndIndex = Math.max(headerEndIndex, i);
      }
    }
  }

  if (title || tipoOa || objetivo || evaluacion) {
    const restLines = lines.slice(headerEndIndex + 1);
    const cleanedRestLines = restLines.filter(line => {
      const trimmed = line.trim();
      if (parsedFromTable && trimmed.startsWith('|')) {
        return false;
      }
      return true;
    });

    return {
      metadata: {
        title: title || 'SESIÓN DE CLASE',
        tipoOa: tipoOa || 'No especificado',
        objetivo: cleanObjective(objetivo) || 'No especificado',
        evaluacion: evaluacion || 'Formativa'
      },
      rest: cleanedRestLines.join('\n').trim()
    };
  }

  return { metadata: null, rest: text };
};

const getAdaptationRows = (planning: any): AdaptationRow[] => {
  const content = planning.content;
  const dua = content.dua_adaptations;
  const rti = content.rti_supports;
  const technique = (content.writing_technique || 'RICE').toUpperCase();

  const rows: AdaptationRow[] = [];

  if (dua && typeof dua === 'object' && rti && typeof rti === 'object' && rti.n1) {
    rows.push({
      level: 'N1 — Universal',
      materials: dua.n1 || '',
      practice: rti.n1.practice || '',
      ticket: rti.n1.ticket || ''
    });
    rows.push({
      level: 'N2 — Con apoyos',
      materials: dua.n2 || '',
      practice: rti.n2.practice || '',
      ticket: rti.n2.ticket || ''
    });
    rows.push({
      level: 'N3 — Intensivo',
      materials: dua.n3 || '',
      practice: rti.n3.practice || '',
      ticket: rti.n3.ticket || ''
    });
  } else {
    let materialsN1 = '';
    let materialsN2 = '';
    let materialsN3 = '';

    if (typeof dua === 'string') {
      const n1Match = dua.match(/nivel\s*1\s*:\s*([^N\n]+)/i);
      const n2Match = dua.match(/nivel\s*2\s*:\s*([^N\n]+)/i);
      const n3Match = dua.match(/nivel\s*3\s*:\s*([^N\n]+)/i);

      materialsN1 = n1Match ? n1Match[1].trim() : dua;
      materialsN2 = n2Match ? n2Match[1].trim() : '';
      materialsN3 = n3Match ? n3Match[1].trim() : '';
    } else if (dua && typeof dua === 'object') {
      materialsN1 = dua.n1 || dua.general || '';
      materialsN2 = dua.n2 || dua.targeted || '';
      materialsN3 = dua.n3 || dua.intensive || '';
    }

    let p1 = '';
    let p2 = '';
    let p3 = '';

    if (rti && typeof rti === 'object') {
      p1 = rti.general || rti.n1 || '';
      p2 = rti.targeted || rti.n2 || '';
      p3 = rti.intensive || rti.n3 || '';
    } else if (typeof rti === 'string') {
      p1 = rti;
    }

    rows.push({
      level: 'N1 — Universal',
      materials: materialsN1,
      practice: p1,
      ticket: `Ticket ${technique} completo.`
    });
    rows.push({
      level: 'N2 — Con apoyos',
      materials: materialsN2 || 'Apoyos visuales y léxicos.',
      practice: p2,
      ticket: `Ticket ${technique} con andamios/frases de inicio.`
    });
    rows.push({
      level: 'N3 — Intensivo',
      materials: materialsN3 || 'Lectura compartida y texto simplificado.',
      practice: p3,
      ticket: `Ticket ${technique} simplificado (oral o completación).`
    });
  }

  return rows;
};

interface PlanningContent {
  writing_technique?: string;
  backward_design: {
    objective: string;
    assessment_evidence: string;
    activities_sequence: string;
  };
  dua_adaptations: any;
  rti_supports: any;
  gamification: string;
  nlp_technique: string;
  rubric: string;
  texto_sesion?: any;
  lirmi_summary?: {
    oa_numbers: string;
    class_objective: string;
    inicio: string;
    desarrollo: string;
    cierre: string;
  };
  utp_documentation?: {
    dua_adaptations: {
      representation: string;
      expression: string;
      engagement: string;
    };
    learning_adaptations: {
      dua_1: string;
      dua_2: string;
      dua_3: string;
    };
    nlp_technique: {
      opening: string;
      pause: string;
      closing: string;
    };
    rubric_summary: string;
  };
}

interface ReadingLevel {
  estimated_level: string;
  warning_alert: string;
}

interface Planning {
  id: string;
  created_at: string;
  subject: string;
  grade: string;
  learning_objective: string;
  unit: string;
  reference_url: string | null;
  reference_document_name: string | null;
  content: PlanningContent;
  reading_level: ReadingLevel;
}

interface ProcessedBlock {
  type: 'paragraph' | 'table';
  text?: string;
  rows?: string[][];
}

function parseMarkdownText(text: string): ProcessedBlock[] {
  const lines = text.split('\n');
  const blocks: ProcessedBlock[] = [];
  let currentTableRows: string[][] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    if (trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.length > 2) {
      const isSeparator = trimmed.replace(/[\s\-:|]/g, '') === '';
      if (isSeparator) {
        continue;
      }
      
      const cols = line.split('|').map(c => c.trim());
      if (cols.length >= 2) {
        cols.shift();
        cols.pop();
        currentTableRows.push(cols);
      }
    } else {
      if (currentTableRows.length > 0) {
        blocks.push({ type: 'table', rows: currentTableRows });
        currentTableRows = [];
      }
      blocks.push({ type: 'paragraph', text: line });
    }
  }
  
  if (currentTableRows.length > 0) {
    blocks.push({ type: 'table', rows: currentTableRows });
  }
  
  return blocks;
}

const UNIT_TITLES: Record<string, Record<string, string>> = {
  '5° Básico': {
    'Unidad 1': 'Unidad 1: La unión hace la fuerza',
    'Unidad 2': 'Unidad 2: Emociones que sanan',
    'Unidad 3': 'Unidad 3: Coexistir en armonía',
    'Unidad 4': 'Unidad 4: Un mundo en movimiento',
  },
  '6° Básico': {
    'Unidad 1': 'Unidad 1: El poder de la aventura, la imaginación y la creatividad',
    'Unidad 2': 'Unidad 2: El medioambiente y su protección',
    'Unidad 3': 'Unidad 3: El ser humano y su vínculo con el cosmos',
    'Unidad 4': 'Unidad 4: Respetar las diferencias y la igualdad de derechos',
  },
  '7° Básico': {
    'Unidad 1': 'Unidad 1: El héroe en distintas épocas',
    'Unidad 2': 'Unidad 2: La solidaridad y la amistad',
    'Unidad 3': 'Unidad 3: Mitología y relatos de creación',
    'Unidad 4': 'Unidad 4: La identidad: quién soy, cómo me ven los demás',
    'Unidad 5': 'Unidad 5: El romancero y la poesía popular',
    'Unidad 6': 'Unidad 6: El terror y lo extraño',
    'Unidad 7': 'Unidad 7: Medios de comunicación',
  },
  '8° Básico': {
    'Unidad 1': 'Unidad 1: Epopeya',
    'Unidad 2': 'Unidad 2: Experiencias del amor',
    'Unidad 3': 'Unidad 3: Relatos de misterio',
    'Unidad 4': 'Unidad 4: Naturaleza',
    'Unidad 5': 'Unidad 5: La comedia',
    'Unidad 6': 'Unidad 6: El mundo descabellado',
    'Unidad 7': 'Unidad 7: Medios de comunicación',
  },
  '1° Medio': {
    'Unidad 1': 'Unidad 1: Libertad',
    'Unidad 2': 'Unidad 2: Ciudadanos',
    'Unidad 3': 'Unidad 3: Relaciones humanas',
    'Unidad 4': 'Unidad 4: Sociedad',
  },
  '2° Medio': {
    'Unidad 1': 'Unidad 1: Ausencia',
    'Unidad 2': 'Unidad 2: Ciudadanía',
    'Unidad 3': 'Unidad 3: Lo divino',
    'Unidad 4': 'Unidad 4: Poder',
  }
};

const getFullUnitName = (grade: string, unitRaw: string): string => {
  if (!unitRaw) return '';
  const unitClean = unitRaw.split(':')[0].trim(); // e.g. "Unidad 2"
  const mapping = UNIT_TITLES[grade];
  if (mapping && mapping[unitClean]) {
    const remaining = unitRaw.substring(unitClean.length).replace(/^:/, '').trim();
    return `${mapping[unitClean]}${remaining ? `: ${remaining}` : ''}`;
  }
  return unitRaw;
};

const cleanObjective = (text: string): string => {
  if (!text) return '';
  
  // 1. Check for '||' separator
  if (text.includes('||')) {
    const parts = text.split('||');
    let candidate = parts[parts.length - 1].trim();
    // Remove metadata/docente prefixes if any
    candidate = candidate.replace(/^(?:meta de sesión|meta de la sesión|objetivo de sesión|objetivo de la sesión|objetivo de clase|objetivo de la clase|objetivo de la sesión \(para el docente\)|meta de sesión \(para el docente\))\s*:\s*/i, '');
    return candidate;
  }

  // 2. Check for long dash separator like ' — OBJETIVO' or ' — META'
  const dashMatch = text.match(/\s+[\u2014\u2013-]\s+(?:objetivo|meta)\s*(?:de\s+sesión|de\s+la\s+sesión|de\s+clase|de\s+la\s+clase)?\s*:\s*/i);
  if (dashMatch) {
    const idx = text.indexOf(dashMatch[0]);
    return text.substring(idx + dashMatch[0].length).trim();
  }

  // 3. Search for common target objective start phrases
  const keywords = [
    /el objetivo es/i,
    /el objetivo de esta sesión/i,
    /el objetivo de la sesión/i,
    /el objetivo de esta clase/i,
    /el objetivo de la clase/i,
    /objetivo de la clase/i,
    /objetivo de clase/i,
    /objetivo de la sesión/i,
    /objetivo de sesión/i,
    /meta de la sesión/i,
    /meta de sesión/i,
    /el estudiante/i,
    /al finalizar la clase/i,
    /al finalizar la sesión/i
  ];

  let earliestMatch = -1;

  for (const regex of keywords) {
    const match = text.match(regex);
    if (match && match.index !== undefined) {
      if (earliestMatch === -1 || match.index < earliestMatch) {
        earliestMatch = match.index;
      }
    }
  }

  if (earliestMatch !== -1) {
    let result = text.substring(earliestMatch).trim();
    // If it matched a prefix like "objetivo de clase: ", strip it if there's more text
    result = result.replace(/^(?:objetivo de clase|objetivo de la clase|objetivo de sesión|objetivo de la sesión|meta de sesión|meta de la sesión)\s*:\s*/i, '');
    return result;
  }

  return text;
};

const isAlreadyStructured = (text: string): boolean => {
  if (!text) return false;
  return /##\s*(?:inicio|desarrollo|cierre)/i.test(text) || /\*\*(?:inicio|desarrollo|cierre)/i.test(text);
};

interface ActivityBlocks {
  inicio: string;
  desarrollo: {
    general?: string;
    modelado?: string;
    practicaGuiada?: string;
    practicaAutonoma?: string;
  };
  cierre: string;
}

const parseActivitiesSequence = (text: string): ActivityBlocks => {
  const cleanedText = removePlaceholders(text);
  const blocks: ActivityBlocks = {
    inicio: '',
    desarrollo: {},
    cierre: ''
  };

  if (!cleanedText) return blocks;

  const getIndex = (t: string, pattern: RegExp) => {
    const match = t.match(pattern);
    return match ? { index: match.index ?? -1, length: match[0].length } : { index: -1, length: 0 };
  };

  let inicioMatch = getIndex(cleanedText, /inicio\s*:/i);
  let desarrolloMatch = getIndex(cleanedText, /desarrollo\s*:/i);
  let cierreMatch = getIndex(cleanedText, /cierre\s*:/i);

  if (inicioMatch.index === -1 && desarrolloMatch.index === -1 && cierreMatch.index === -1) {
    inicioMatch = getIndex(cleanedText, /\b(?:inicio)\b/i);
    desarrolloMatch = getIndex(cleanedText, /\b(?:desarrollo)\b/i);
    cierreMatch = getIndex(cleanedText, /\b(?:cierre)\b/i);
  }

  if (inicioMatch.index !== -1) {
    const endIdx = desarrolloMatch.index !== -1 ? desarrolloMatch.index : (cierreMatch.index !== -1 ? cierreMatch.index : cleanedText.length);
    blocks.inicio = cleanedText.substring(inicioMatch.index + inicioMatch.length, endIdx).trim();
  } else {
    if (desarrolloMatch.index !== -1) {
      blocks.inicio = cleanedText.substring(0, desarrolloMatch.index).trim();
    }
  }

  if (cierreMatch.index !== -1) {
    blocks.cierre = cleanedText.substring(cierreMatch.index + cierreMatch.length).trim();
  }

  let desarrolloText = '';
  if (desarrolloMatch.index !== -1) {
    const endIdx = cierreMatch.index !== -1 ? cierreMatch.index : cleanedText.length;
    desarrolloText = cleanedText.substring(desarrolloMatch.index + desarrolloMatch.length, endIdx).trim();
  } else if (inicioMatch.index === -1 && cierreMatch.index === -1) {
    desarrolloText = cleanedText.trim();
  }

  if (desarrolloText) {
    const modeladoMatch = getIndex(desarrolloText, /(?:modelado del docente|modelado docente|modelado)\s*:/i);
    const guiadaMatch = getIndex(desarrolloText, /(?:práctica guiada|practica guiada|práctica co-construida|practica co-construida)\s*:/i);
    const autonomaMatch = getIndex(desarrolloText, /(?:práctica autónoma|practica autonoma|práctica independiente|practica independiente)\s*:/i);

    const subMatches = [
      { key: 'modelado', match: modeladoMatch },
      { key: 'practicaGuiada', match: guiadaMatch },
      { key: 'practicaAutonoma', match: autonomaMatch }
    ].filter(sm => sm.match.index !== -1)
     .sort((a, b) => a.match.index - b.match.index);

    if (subMatches.length === 0) {
      const softModelado = getIndex(desarrolloText, /(?:modelado del docente|modelado docente|modelado)\b/i);
      const softGuiada = getIndex(desarrolloText, /(?:práctica guiada|practica guiada|práctica co-construida|practica co-construida)\b/i);
      const softAutonoma = getIndex(desarrolloText, /(?:práctica autónoma|practica autonoma|práctica independiente|practica independiente)\b/i);

      const softMatches = [
        { key: 'modelado', match: softModelado },
        { key: 'practicaGuiada', match: softGuiada },
        { key: 'practicaAutonoma', match: softAutonoma }
      ].filter(sm => sm.match.index !== -1)
       .sort((a, b) => a.match.index - b.match.index);

      if (softMatches.length > 0) {
        for (let i = 0; i < softMatches.length; i++) {
          const current = softMatches[i];
          const next = softMatches[i + 1];
          const start = current.match.index;
          const end = next ? next.match.index : desarrolloText.length;
          
          let content = desarrolloText.substring(start, end).trim();
          if (content.startsWith('.') || content.startsWith(',') || content.startsWith(';')) {
            content = content.substring(1).trim();
          }
          
          if (current.key === 'modelado') blocks.desarrollo.modelado = content;
          else if (current.key === 'practicaGuiada') blocks.desarrollo.practicaGuiada = content;
          else if (current.key === 'practicaAutonoma') blocks.desarrollo.practicaAutonoma = content;
        }
        
        const firstStart = softMatches[0].match.index;
        if (firstStart > 0) {
          blocks.desarrollo.general = desarrolloText.substring(0, firstStart).trim();
        }
      } else {
        blocks.desarrollo.general = desarrolloText;
      }
    } else {
      for (let i = 0; i < subMatches.length; i++) {
        const current = subMatches[i];
        const next = subMatches[i + 1];
        const start = current.match.index + current.match.length;
        const end = next ? next.match.index : desarrolloText.length;
        const content = desarrolloText.substring(start, end).trim();

        if (current.key === 'modelado') blocks.desarrollo.modelado = content;
        else if (current.key === 'practicaGuiada') blocks.desarrollo.practicaGuiada = content;
        else if (current.key === 'practicaAutonoma') blocks.desarrollo.practicaAutonoma = content;
      }

      const firstStart = subMatches[0].match.index;
      if (firstStart > 0) {
        blocks.desarrollo.general = desarrolloText.substring(0, firstStart).trim();
      }
    }
  }

  return blocks;
};

const removePlaceholders = (text: string): string => {
  if (!text) return '';
  let cleaned = text.replace(/\[\s*(?:adaptaci[óo]n|por\s+completar|completar|dua|rti)[^\]]*\]/gi, '');
  cleaned = cleaned.replace(/\s+/g, ' ');
  cleaned = cleaned.replace(/\s+([.,;:!%])/g, '$1');
  cleaned = cleaned.replace(/\.+/g, '.');
  return cleaned.trim();
};

interface HeaderDetectionResult {
  isHeader: boolean;
  type: 'session' | 'section' | 'nivel1' | 'nivel2' | 'nivel3' | 'subsection' | null;
}

function detectHeader(line: string): HeaderDetectionResult {
  const trimmed = line.trim();
  
  // Check if it starts with markdown header symbols or is wrapped in bold stars
  const isMarkdownHeader = trimmed.startsWith('#');
  const hasBoldWrap = trimmed.startsWith('**') && trimmed.endsWith('**');
  
  if (!hasBoldWrap && !isMarkdownHeader) {
    // Check if it is a standalone section header like INICIO (12 min) or CIERRE
    const cleanUpperRaw = trimmed.replace(/^[#\*\s—\-\•]+|[#\*\s—\-\•]+$/g, '').trim().toUpperCase();
    if (/^(INICIO|DESARROLLO|CIERRE)\b/i.test(cleanUpperRaw)) {
      return { isHeader: true, type: 'section' };
    }
    return { isHeader: false, type: null };
  }
  
  // Clean header text by removing leading/trailing #, *
  const cleanText = trimmed.replace(/^[#\*\s]+|[#\*\s]+$/g, '').trim();
  const cleanUpper = cleanText.toUpperCase();
  
  const isSessionHeader = /^SESI[ÓO]N\b/i.test(cleanText);
  const maxLength = isSessionHeader ? 100 : 80;
  
  if (cleanText.length > maxLength) {
    return { isHeader: false, type: null };
  }
  
  if (isSessionHeader) {
    return { isHeader: true, type: 'session' };
  }
  
  if (/^(INICIO|DESARROLLO|CIERRE)\b/i.test(cleanText)) {
    return { isHeader: true, type: 'section' };
  }
  
  if (
    /^(ADAPTACI[ÓO]N\s+DUA\s+1|GU[ÍI]A\s+NIVEL\s+1|NIVEL\s+1)\b/i.test(cleanText) ||
    (cleanUpper.includes('NIVEL 1') && cleanUpper.includes('UNIVERSAL'))
  ) {
    return { isHeader: true, type: 'nivel1' };
  }
  
  if (/^(ADAPTACI[ÓO]N\s+DUA\s+2|GU[ÍI]A\s+NIVEL\s+2|NIVEL\s+2)\b/i.test(cleanText)) {
    return { isHeader: true, type: 'nivel2' };
  }
  
  if (/^(ADAPTACI[ÓO]N\s+DUA\s+3|GU[ÍI]A\s+NIVEL\s+3|NIVEL\s+3)\b/i.test(cleanText)) {
    return { isHeader: true, type: 'nivel3' };
  }

  if (isMarkdownHeader) {
    return { isHeader: true, type: 'subsection' };
  }
  
  return { isHeader: false, type: null };
}

export default function PlanningDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const [planning, setPlanning] = useState<Planning | null>(null);
  const [loading, setLoading] = useState(true);
  const [exportingWord, setExportingWord] = useState(false);
  const [copiedImagePrompt, setCopiedImagePrompt] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  // Prompt Generator States
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [promptTipo, setPromptTipo] = useState('Diapositivas');
  const [promptDestino, setPromptDestino] = useState('ChatGPT');
  const [generatedPromptText, setGeneratedPromptText] = useState('');
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  // Tab & Summarization States
  const [activeTab, setActiveTab] = useState<'complete' | 'brief' | 'utp'>('complete');
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  // States for IA Adjustments Sidebar
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [chatInstruction, setChatInstruction] = useState('');
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [adjustmentError, setAdjustmentError] = useState<string | null>(null);
  const [showComplexityOptions, setShowComplexityOptions] = useState(false);
  const [activeInstructionText, setActiveInstructionText] = useState('');
  const [sessionHistory, setSessionHistory] = useState<Array<{
    id: string;
    timestamp: Date;
    request: string;
  }>>([]);
  const [pendingConfirmation, setPendingConfirmation] = useState<{ instruction: string; warning: string } | null>(null);

  // Brief Registration States
  const [briefLogText, setBriefLogText] = useState<string | null>(null);
  const [isGeneratingBriefLog, setIsGeneratingBriefLog] = useState(false);
  const [briefLogError, setBriefLogError] = useState<string | null>(null);

  const handleGenerateBriefLog = async () => {
    if (!planning) return;
    setIsGeneratingBriefLog(true);
    setBriefLogText(null);
    setBriefLogError(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        throw new Error('No se encontró una sesión activa de docente.');
      }

      const response = await fetch('/api/planner/brief', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: planning.content
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Error al generar el registro breve.');
      }

      setBriefLogText(data.briefText);
    } catch (err: any) {
      console.error('Error generating brief log:', err);
      setBriefLogError(err.message || 'Error de conexión al generar el registro breve.');
    } finally {
      setIsGeneratingBriefLog(false);
    }
  };

  const handleGeneratePrompt = async () => {
    if (!planning) return;
    setIsGeneratingPrompt(true);
    setGeneratedPromptText('');

    try {
      const response = await fetch('/api/presentations/prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tipo: promptTipo,
          destino: promptDestino,
          tema: planning.unit || planning.subject,
          curso: planning.grade,
          oa: planning.learning_objective,
          contenido: planning.content?.backward_design?.activities_sequence || ''
        })
      });

      const result = await response.json();
      if (result.error) {
        alert(result.error);
      } else {
        setGeneratedPromptText(result.prompt);
      }
    } catch (err) {
      console.error('Error generating presentation prompt:', err);
      alert('Error de red al generar el prompt.');
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  const handleSendInstruction = async (text: string, isConfirmed = false) => {
    if (!planning || !text.trim() || isAdjusting) return;

    setIsAdjusting(true);
    setAdjustmentError(null);
    setActiveInstructionText(text);
    setShowComplexityOptions(false);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) {
        throw new Error('No se encontró una sesión activa de docente.');
      }

      const response = await fetch('/api/planner/adjust', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          planningId: id,
          subject: planning.subject,
          grade: planning.grade,
          unit: planning.unit,
          learningObjective: planning.learning_objective,
          currentContent: planning.content,
          currentReadingLevel: planning.reading_level,
          instruction: text,
          confirmed: isConfirmed
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al ajustar la planificación.');
      }

      // Check if it triggered a curricular warning and it was not confirmed yet
      const warningAlert = data.reading_level_eval?.warning_alert || '';
      if (!isConfirmed && warningAlert.includes('⚠️ [Advertencia Curricular]')) {
        setPendingConfirmation({
          instruction: text,
          warning: warningAlert
        });
        setIsAdjusting(false);
        setActiveInstructionText('');
        return;
      }

      // Separate reading level and content from adjusted plan response
      const { reading_level_eval, ...contentOnly } = data;

      // Save the updated planning in Supabase to keep it permanent
      const { error: dbError } = await supabase
        .from('plannings')
        .update({
          content: contentOnly,
          reading_level: reading_level_eval || {
            estimated_level: 'No evaluado',
            warning_alert: 'Sin alertas'
          }
        })
        .eq('id', id);

      if (dbError) {
        throw new Error(`Guardado fallido en base de datos: ${dbError.message}`);
      }

      // Update state
      setPlanning(prev => {
        if (!prev) return null;
        return {
          ...prev,
          content: contentOnly,
          reading_level: reading_level_eval || {
            estimated_level: 'No evaluado',
            warning_alert: 'Sin alertas'
          }
        };
      });

      // Add to session history
      setSessionHistory(prev => [
        {
          id: Math.random().toString(36).substr(2, 9),
          timestamp: new Date(),
          request: text
        },
        ...prev
      ]);

      // Clear pending confirmation if it was successfully applied
      setPendingConfirmation(null);

      // Clear input
      setChatInstruction('');

    } catch (err: any) {
      console.error('Error adjusting planning:', err);
      setAdjustmentError(err.message || 'Error de conexión. Por favor, intenta de nuevo.');
    } finally {
      setIsAdjusting(false);
      setActiveInstructionText('');
    }
  };

  const ensureSummaryGenerated = async (currentPlanning: Planning) => {
    if (currentPlanning.content.lirmi_summary && currentPlanning.content.utp_documentation) {
      return;
    }

    setLoadingSummary(true);
    setSummaryError(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const authHeaders: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (token) {
        authHeaders['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/planner/summarize', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          planningId: currentPlanning.id,
          currentContent: currentPlanning.content
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al generar el resumen para Lirmi/UTP.');
      }

      setPlanning(prev => {
        if (!prev) return null;
        return {
          ...prev,
          content: {
            ...prev.content,
            lirmi_summary: data.lirmi_summary,
            utp_documentation: data.utp_documentation
          }
        };
      });
    } catch (err: any) {
      console.error('Error generating planning summary:', err);
      setSummaryError(err.message || 'Error de conexión al generar el resumen.');
      setActiveTab('complete');
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleTabChange = async (tab: 'complete' | 'brief' | 'utp') => {
    setActiveTab(tab);
    if ((tab === 'brief' || tab === 'utp') && planning) {
      await ensureSummaryGenerated(planning);
    }
  };

  useEffect(() => {
    // Load docx and jspdf client-side
    Promise.all([
      import('docx').then(module => { 
        docxLib = module; 
        console.log('[Page] docx loaded client-side!');
      }),
      import('jspdf').then(module => { 
        jspdfLib = module; 
        console.log('[Page] jspdf loaded client-side!');
      })
    ]).catch(err => console.error('Failed to load libraries client-side', err));

    const fetchPlanning = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }

        const { data, error } = await supabase
          .from('plannings')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        setPlanning(data);
      } catch (err) {
        console.error('Error fetching planning:', err);
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    fetchPlanning();
  }, [id, router]);

  // Handle automatic download from query parameter
  useEffect(() => {
    if (!loading && planning) {
      const searchParams = new URLSearchParams(window.location.search);
      const downloadType = searchParams.get('download');
      
      const checkAndDownload = () => {
        if (downloadType === 'pdf' && jspdfLib) {
          exportToPdf();
          // Clean URL so refresh doesn't trigger download again
          const newUrl = window.location.pathname;
          window.history.replaceState({}, '', newUrl);
        } else if (downloadType === 'word' && docxLib) {
          exportToWord();
          const newUrl = window.location.pathname;
          window.history.replaceState({}, '', newUrl);
        }
      };

      // If libraries are already loaded, download, otherwise wait
      if ((downloadType === 'pdf' && jspdfLib) || (downloadType === 'word' && docxLib)) {
        checkAndDownload();
      } else if (downloadType) {
        // Poll for libraries loading (usually takes < 100ms)
        const interval = setInterval(() => {
          if ((downloadType === 'pdf' && jspdfLib) || (downloadType === 'word' && docxLib)) {
            checkAndDownload();
            clearInterval(interval);
          }
        }, 100);
        return () => clearInterval(interval);
      }
    }
  }, [loading, planning, docxLib, jspdfLib]);

  // WORD EXPORT (.docx)
  const copyImagePrompt = async () => {
    const ts = planning?.content?.texto_sesion;
    if (!ts || !ts.cuerpo) {
      alert('Esta planificación no tiene texto de sesión. Genera primero el Kit completo.');
      return;
    }
    const grade = planning?.grade || planning?.curso || '2° Medio';
    const prompt = `Tengo el siguiente texto educativo para estudiantes de ${grade}:

---
Tipo: ${ts.tipo || 'Texto'}
Título: ${ts.titulo || 'Sin título'}
Autor: ${ts.autor || 'Anónimo'}

${ts.cuerpo}
---

Por favor, indica en qué partes del texto sería útil agregar una imagen y describe exactamente qué debe mostrar cada imagen para que sea relevante y atractiva para los estudiantes. No cambies el texto original. Solo señala los lugares insertando [IMAGEN: descripción detallada de la imagen] en el punto exacto donde debe ir cada imagen, describiendo el contenido con suficiente detalle para generarla con una IA de imágenes.`;

    try {
      await navigator.clipboard.writeText(prompt);
      setCopiedImagePrompt(true);
      setTimeout(() => setCopiedImagePrompt(false), 3000);
      window.open('https://chat.openai.com/', '_blank');
    } catch {
      const ta = document.createElement('textarea');
      ta.value = prompt;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiedImagePrompt(true);
      setTimeout(() => setCopiedImagePrompt(false), 3000);
      window.open('https://chat.openai.com/', '_blank');
    }
  };

  const exportToWord = async () => {
    if (!planning || !docxLib) return;
    setExportingWord(true);

    try {
      const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, AlignmentType } = docxLib;

      const createSectionHeaderWord = (title: string, bgColor = "F1F5F9", textColor = "1E293B") => {
        return new Table({
          width: { size: 9360, type: WidthType.DXA },
          borders: {
            top: { style: "none" },
            bottom: { style: "none" },
            left: { style: "none" },
            right: { style: "none" },
            insideHorizontal: { style: "none" },
            insideVertical: { style: "none" }
          },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 9360, type: WidthType.DXA },
                  shading: { fill: bgColor },
                  margins: { top: 120, bottom: 120, left: 180, right: 180 },
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({ text: title, bold: true, color: textColor, size: 22 })
                      ],
                      spacing: { before: 40, after: 40 }
                    })
                  ]
                })
              ]
            })
          ]
        });
      };

      const createSessionMetadataBlockWord = (metadata: SessionMetadata) => {
        return new Table({
          width: { size: 9360, type: WidthType.DXA },
          borders: {
            top: { style: "none" },
            bottom: { style: "none" },
            left: { style: "single", size: 36, color: "0369A1" }, // thick left border
            right: { style: "none" },
            insideHorizontal: { style: "none" },
            insideVertical: { style: "none" }
          },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 9360, type: WidthType.DXA },
                  shading: { fill: "E0F2FE" }, // light blue
                  margins: { top: 120, bottom: 120, left: 180, right: 180 },
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({ text: metadata.title, bold: true, color: "0369A1", size: 21 })
                      ],
                      spacing: { after: 80 }
                    }),
                    new Paragraph({
                      children: [
                        new TextRun({ text: "Tipo / OA: ", bold: true, color: "1E293B", size: 19 }),
                        new TextRun({ text: " " + metadata.tipoOa, color: "334155", size: 19 })
                      ],
                      spacing: { after: 60 }
                    }),
                    new Paragraph({
                      children: [
                        new TextRun({ text: "Objetivo: ", bold: true, color: "1E293B", size: 19 }),
                        new TextRun({ text: " " + metadata.objetivo, color: "334155", size: 19 })
                      ],
                      spacing: { after: 60 }
                    }),
                    new Paragraph({
                      children: [
                        new TextRun({ text: "Evaluación: ", bold: true, color: "1E293B", size: 19 }),
                        new TextRun({ text: " " + metadata.evaluacion, color: "334155", size: 19 })
                      ],
                      spacing: { after: 40 }
                    })
                  ]
                })
              ]
            })
          ]
        });
      };

      const createRtiTableWord = (title: string, text: string, bgColor = "F1F5F9", textColor = "1E293B") => {
        return new Table({
          width: { size: 9360, type: WidthType.DXA },
          borders: {
            top: { style: "single", size: 4, color: "CBD5E1" },
            bottom: { style: "single", size: 4, color: "CBD5E1" },
            left: { style: "single", size: 4, color: "CBD5E1" },
            right: { style: "single", size: 4, color: "CBD5E1" },
            insideHorizontal: { style: "single", size: 4, color: "CBD5E1" },
            insideVertical: { style: "single", size: 4, color: "CBD5E1" }
          },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 9360, type: WidthType.DXA },
                  shading: { fill: bgColor },
                  margins: { top: 100, bottom: 100, left: 120, right: 120 },
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({ text: title, bold: true, color: textColor, size: 20 })
                      ],
                      spacing: { before: 40, after: 40 }
                    })
                  ]
                })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 9360, type: WidthType.DXA },
                  margins: { top: 100, bottom: 100, left: 120, right: 120 },
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({ text: text, size: 19 })
                      ],
                      spacing: { before: 40, after: 40 }
                    })
                  ]
                })
              ]
            })
          ]
        });
      };

      const renderWordTable = (rows: string[][]) => {
        const numCols = rows[0].length;
        let colWidths: number[] = Array(numCols).fill(Math.floor(9360 / numCols));
        if (numCols === 3) {
          colWidths = [1872, 6552, 936]; // exactly 9360 total
        } else if (numCols === 2) {
          colWidths = [2808, 6552]; // exactly 9360 total
        } else if (numCols === 4) {
          colWidths = [1560, 2600, 2600, 2600]; // exactly 9360 total (1560 + 2600*3 = 9360)
        }

        return new Table({
          width: { size: 9360, type: WidthType.DXA },
          borders: {
            top: { style: "single", size: 4, color: "CBD5E1" },
            bottom: { style: "single", size: 4, color: "CBD5E1" },
            left: { style: "single", size: 4, color: "CBD5E1" },
            right: { style: "single", size: 4, color: "CBD5E1" },
            insideHorizontal: { style: "single", size: 4, color: "CBD5E1" },
            insideVertical: { style: "single", size: 4, color: "CBD5E1" }
          },
          rows: rows.map((row, rowIndex) => {
            return new TableRow({
              children: row.map((cellText, colIdx) => {
                return new TableCell({
                  width: { size: colWidths[colIdx] ?? Math.floor(9360 / numCols), type: WidthType.DXA },
                  shading: rowIndex === 0 ? { fill: "F1F5F9" } : undefined,
                  margins: { top: 100, bottom: 100, left: 120, right: 120 },
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: cellText.replace(/\*/g, '').replace(/__/g, ''),
                          bold: rowIndex === 0 || cellText.startsWith('**'),
                          size: 19
                        })
                      ],
                      spacing: { before: 40, after: 40 }
                    })
                  ]
                });
              })
            });
          })
        });
      };

      const renderParagraphInWord = (line: string) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('```')) {
          return null;
        }
        if (/^[-—_*\s]{3,}$/.test(trimmed)) {
          return null;
        }

        const cleanedLine = removePlaceholders(line);
        const cleanLine = cleanedLine.replace(/\*\*|__/g, '').trim();
        if (cleanLine === '') {
          return new Paragraph({ spacing: { after: 50 } });
        }

        const headerInfo = detectHeader(cleanedLine);

        if (headerInfo.isHeader) {
          const cleanHeaderText = cleanedLine.replace(/^[#\*\s]+|[#\*\s]+$/g, '').replace(/\*/g, '').replace(/__/g, '').trim();
          if (cleanHeaderText === '') return null;

          if (headerInfo.type === 'subsection') {
            return new Paragraph({
              children: [
                new TextRun({
                  text: cleanHeaderText,
                  bold: true,
                  size: 21,
                  color: "1E293B" // slate-800
                })
              ],
              spacing: { before: 120, after: 60 }
            });
          }

          let bgColor = "F1F5F9";
          let textColor = "334155";
          if (headerInfo.type === 'session') {
            bgColor = "E0F2FE";
            textColor = "0369A1";
          } else if (headerInfo.type === 'nivel1') {
            bgColor = "E2F0D9";
            textColor = "385723";
          } else if (headerInfo.type === 'nivel2') {
            bgColor = "FFF2CC";
            textColor = "7F6000";
          } else if (headerInfo.type === 'nivel3') {
            bgColor = "F2DCDB";
            textColor = "C00000";
          }
          return createSectionHeaderWord(cleanHeaderText, bgColor, textColor);
        }

        const isBullet = cleanedLine.trim().startsWith('•') || cleanedLine.trim().startsWith('—') || cleanedLine.trim().startsWith('*') || cleanedLine.trim().startsWith('-');
        let textToShow = cleanedLine.trim();
        if (isBullet) {
          textToShow = textToShow.substring(1).trim();
        }
        textToShow = textToShow.replace(/^[#\*\s—\-\•]+|[#\*\s—\-\•]+$/g, '').trim();
        textToShow = textToShow.replace(/^\*|\*$/g, '').trim();

        if (textToShow === '') return null;

        return new Paragraph({
          bullet: isBullet ? { level: 0 } : undefined,
          children: [
            new TextRun({
              text: textToShow.replace(/\*/g, '').replace(/__/g, ''),
              bold: cleanedLine.startsWith('**') && cleanedLine.endsWith('**'),
              size: 20
            })
          ],
          spacing: { after: 60 }
        });
      };

      const parseAndRenderTextWord = (text: string) => {
        const blocks = parseMarkdownText(text);
        const rendered: any[] = [];
        blocks.forEach(block => {
          if (block.type === 'table' && block.rows) {
            rendered.push(renderWordTable(block.rows));
            rendered.push(new Paragraph({ spacing: { before: 100 } }));
          } else {
            const p = renderParagraphInWord(block.text ?? '');
            if (p) {
              rendered.push(p);
            }
          }
        });
        return rendered;
      };

      const formatActivitiesSequenceWord = (text: string) => {
        const blocks = parseActivitiesSequence(text);
        const rendered: any[] = [];

        if (blocks.inicio) {
          rendered.push(createSectionHeaderWord("Inicio", "E0F2FE", "0369A1"));
          rendered.push(new Paragraph({ text: "", spacing: { after: 50 } }));
          rendered.push(...parseAndRenderTextWord(blocks.inicio));
          rendered.push(new Paragraph({ text: "", spacing: { after: 100 } }));
        }

        if (blocks.desarrollo.general || blocks.desarrollo.modelado || blocks.desarrollo.practicaGuiada || blocks.desarrollo.practicaAutonoma) {
          rendered.push(createSectionHeaderWord("Desarrollo", "F1F5F9", "334155"));
          rendered.push(new Paragraph({ text: "", spacing: { after: 50 } }));
          if (blocks.desarrollo.general) {
            rendered.push(...parseAndRenderTextWord(blocks.desarrollo.general));
            rendered.push(new Paragraph({ text: "", spacing: { after: 80 } }));
          }
          if (blocks.desarrollo.modelado) {
            rendered.push(new Paragraph({ children: [new TextRun({ text: "• Modelado docente:", bold: true })] }));
            rendered.push(...parseAndRenderTextWord(blocks.desarrollo.modelado));
            rendered.push(new Paragraph({ text: "", spacing: { after: 80 } }));
          }
          if (blocks.desarrollo.practicaGuiada) {
            rendered.push(new Paragraph({ children: [new TextRun({ text: "• Práctica guiada:", bold: true })] }));
            rendered.push(...parseAndRenderTextWord(blocks.desarrollo.practicaGuiada));
            rendered.push(new Paragraph({ text: "", spacing: { after: 80 } }));
          }
          if (blocks.desarrollo.practicaAutonoma) {
            rendered.push(new Paragraph({ children: [new TextRun({ text: "• Práctica autónoma:", bold: true })] }));
            rendered.push(...parseAndRenderTextWord(blocks.desarrollo.practicaAutonoma));
            rendered.push(new Paragraph({ text: "", spacing: { after: 80 } }));
          }
        }

        if (blocks.cierre) {
          rendered.push(createSectionHeaderWord("Cierre", "FFF2CC", "7F6000"));
          rendered.push(new Paragraph({ text: "", spacing: { after: 50 } }));
          rendered.push(...parseAndRenderTextWord(blocks.cierre));
        }

        return rendered;
      };

      let documentChildren: any[] = [];

      if (activeTab === 'complete') {
        const oaCodes = planning.learning_objective.split(' — ')[0];
        const mappedUnit = getFullUnitName(planning.grade, planning.unit);

        documentChildren = [
          // Header title
          new Paragraph({
            text: "REI DOCENTE - PLANIFICACIÓN DE CLASE",
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 }
          }),
          
          // Metadata Table
          new Table({
            width: { size: 9360, type: WidthType.DXA },
            borders: {
              top: { style: "single", size: 4, color: "CBD5E1" },
              bottom: { style: "single", size: 4, color: "CBD5E1" },
              left: { style: "single", size: 4, color: "CBD5E1" },
              right: { style: "single", size: 4, color: "CBD5E1" },
              insideHorizontal: { style: "single", size: 4, color: "CBD5E1" },
              insideVertical: { style: "single", size: 4, color: "CBD5E1" }
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 4680, type: WidthType.DXA },
                    margins: { top: 80, bottom: 80, left: 100, right: 100 },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ text: "Establecimiento: ", bold: true }),
                          new TextRun({ text: "[Completar por docente]" })
                        ]
                      })
                    ]
                  }),
                  new TableCell({
                    width: { size: 4680, type: WidthType.DXA },
                    margins: { top: 80, bottom: 80, left: 100, right: 100 },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ text: "Docente: ", bold: true }),
                          new TextRun({ text: "[Completar por docente]" })
                        ]
                      })
                    ]
                  })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 4680, type: WidthType.DXA },
                    margins: { top: 80, bottom: 80, left: 100, right: 100 },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ text: "Asignatura: ", bold: true }),
                          new TextRun({ text: planning.subject })
                        ]
                      })
                    ]
                  }),
                  new TableCell({
                    width: { size: 4680, type: WidthType.DXA },
                    margins: { top: 80, bottom: 80, left: 100, right: 100 },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ text: "Curso/Nivel: ", bold: true }),
                          new TextRun({ text: planning.grade })
                        ]
                      })
                    ]
                  })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 4680, type: WidthType.DXA },
                    margins: { top: 80, bottom: 80, left: 100, right: 100 },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ text: "Período: ", bold: true }),
                          new TextRun({ text: "[Completar por docente]" })
                        ]
                      })
                    ]
                  }),
                  new TableCell({
                    width: { size: 4680, type: WidthType.DXA },
                    margins: { top: 80, bottom: 80, left: 100, right: 100 },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ text: "OA trabajados (códigos): ", bold: true }),
                          new TextRun({ text: oaCodes })
                        ]
                      })
                    ]
                  })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 4680, type: WidthType.DXA },
                    margins: { top: 80, bottom: 80, left: 100, right: 100 },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ text: "Foco: ", bold: true }),
                          new TextRun({ text: mappedUnit })
                        ]
                      })
                    ]
                  }),
                  new TableCell({
                    width: { size: 4680, type: WidthType.DXA },
                    margins: { top: 80, bottom: 80, left: 100, right: 100 },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ text: "Sistema pedagógico: ", bold: true }),
                          new TextRun({ text: `Técnica ${planning.content.writing_technique?.toUpperCase() ?? 'OREO'} · Didáctica Inversa` })
                        ]
                      })
                    ]
                  })
                ]
              })
            ]
          }),
          
          new Paragraph({ text: "", spacing: { after: 200 } }),
          
          // Learning Objective (OA)
          createSectionHeaderWord("Objetivo de Aprendizaje (OA)", "E0F2FE", "0369A1"),
          new Paragraph({ text: "", spacing: { after: 50 } }),
          new Paragraph({
            children: [
              new TextRun({ text: oaCodes, italics: true }),
              new TextRun({ text: "\nObjetivo de clase: ", bold: true }),
              new TextRun({ text: cleanObjective(planning.content.backward_design.objective) })
            ]
          }),
          
          new Paragraph({ text: "", spacing: { after: 150 } }),

          // Reading level evaluation
          createSectionHeaderWord("Evaluación del Nivel Lector", "E0F2FE", "0369A1"),
          new Paragraph({ text: "", spacing: { after: 50 } }),
          new Paragraph({
            children: [
              new TextRun({ text: "Nivel lector estimado: ", bold: true }),
              new TextRun({ text: planning.reading_level.estimated_level })
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Alerta pedagógica: ", bold: true }),
              new TextRun({ text: planning.reading_level.warning_alert })
            ]
          }),

          new Paragraph({ text: "", spacing: { after: 150 } }),

          // Section 1: Backward Design
          createSectionHeaderWord("1. Diseño Curricular Inverso (Backward Design)", "F1F5F9", "334155"),
          new Paragraph({ text: "", spacing: { after: 50 } }),
          new Paragraph({
            children: [
              new TextRun({ text: "Objetivo de la sesión:", bold: true })
            ],
            spacing: { after: 50 }
          }),
          new Paragraph({ text: cleanObjective(planning.content.backward_design.objective) }),
          
          new Paragraph({
            children: [
              new TextRun({ text: "Evidencia de evaluación:", bold: true })
            ],
            spacing: { before: 100, after: 50 }
          }),
          new Paragraph({ text: planning.content.backward_design.assessment_evidence }),

          ...(() => {
            const { metadata, rest } = extractMetadataBlock(planning.content.backward_design.activities_sequence);
            const rendered: any[] = [];
            
            if (metadata) {
              rendered.push(createSessionMetadataBlockWord(metadata));
              rendered.push(new Paragraph({ text: "", spacing: { after: 150 } }));
            }

            if (planning.content.texto_sesion && planning.content.texto_sesion.cuerpo) {
              rendered.push(
                createSectionHeaderWord("Texto de la Sesión", "F1F5F9", "334155"),
                new Paragraph({ text: "", spacing: { after: 50 } }),
                new Paragraph({
                  children: [
                    new TextRun({ text: "Tipo: ", bold: true, size: 19 }),
                    new TextRun({ text: planning.content.texto_sesion.tipo || 'Lectura', size: 19 }),
                  ],
                  spacing: { after: 40 }
                }),
                new Paragraph({
                  children: [
                    new TextRun({ text: "Título: ", bold: true, size: 19 }),
                    new TextRun({ text: planning.content.texto_sesion.titulo || 'Sin título', size: 19 }),
                  ],
                  spacing: { after: 40 }
                }),
                new Paragraph({
                  children: [
                    new TextRun({ text: "Autor: ", bold: true, size: 19 }),
                    new TextRun({ text: planning.content.texto_sesion.autor || 'Anónimo', size: 19 }),
                  ],
                  spacing: { after: 40 }
                }),
                new Paragraph({
                  children: [
                    new TextRun({ text: "Fuente: ", bold: true, size: 19 }),
                    new TextRun({ text: "Texto generado para uso pedagógico — REI Docente", italic: true, size: 19 }),
                  ],
                  spacing: { after: 120 }
                }),
                ...planning.content.texto_sesion.cuerpo.split('\n').filter((p: string) => p.trim()).map((p: string) => {
                  return new Paragraph({
                    children: [
                      new TextRun({ text: p.trim(), size: 19 })
                    ],
                    spacing: { after: 100 }
                  });
                }),
                new Paragraph({ text: "", spacing: { after: 150 } })
              );
            }

            rendered.push(
              new Paragraph({
                children: [
                  new TextRun({ text: "Secuencia de actividades:", bold: true })
                ],
                spacing: { before: 100, after: 50 }
              })
            );

            if (isAlreadyStructured(rest)) {
              rendered.push(...parseAndRenderTextWord(rest));
            } else {
              rendered.push(...formatActivitiesSequenceWord(rest));
            }

            return rendered;
          })(),

          new Paragraph({ text: "", spacing: { after: 150 } }),

          // Section 2: Adaptaciones de Aprendizaje y Accesibilidad
          createSectionHeaderWord("2. Adaptaciones de Aprendizaje y Accesibilidad", "F1F5F9", "334155"),
          new Paragraph({ text: "", spacing: { after: 100 } }),
          renderWordTable([
            ["Nivel", "Texto y materiales", "Práctica autónoma", `Ticket ${(planning.content.writing_technique || 'RICE').toUpperCase()}`],
            ...getAdaptationRows(planning).map(r => [r.level, r.materials, r.practice, r.ticket])
          ]),

          new Paragraph({ text: "", spacing: { after: 150 } }),

          // Section 3: Rúbrica de Cierre
          createSectionHeaderWord("3. Rúbrica de Cierre", "F1F5F9", "334155"),
          new Paragraph({ text: "", spacing: { after: 50 } }),
          ...parseAndRenderTextWord(planning.content.rubric)
        ];
      } else if (activeTab === 'brief') {
        const lirmi = planning.content.lirmi_summary ?? {
          oa_numbers: planning.learning_objective.match(/OA\s*\d+/gi)?.join(', ') || 'No especificados',
          class_objective: 'Objetivo de clase no generado.',
          inicio: 'Inicio no generado.',
          desarrollo: 'Desarrollo no generado.',
          cierre: 'Cierre no generado.'
        };
        documentChildren = [
          new Paragraph({
            text: "REI DOCENTE - SESIÓN BREVE · LIBRO DE CLASES",
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 }
          }),
          createSectionHeaderWord("Sesión Breve · Libro de Clases", "E0F2FE", "0369A1"),
          new Paragraph({ text: "", spacing: { after: 100 } }),
          new Paragraph({
            children: [
              new TextRun({ text: "OA: ", bold: true }),
              new TextRun({ text: lirmi.oa_numbers })
            ],
            spacing: { after: 100 }
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Objetivo de clase: ", bold: true }),
              new TextRun({ text: cleanObjective(lirmi.class_objective) })
            ],
            spacing: { after: 100 }
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Inicio: ", bold: true }),
              new TextRun({ text: lirmi.inicio })
            ],
            spacing: { after: 100 }
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Desarrollo: ", bold: true }),
              new TextRun({ text: lirmi.desarrollo })
            ],
            spacing: { after: 100 }
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Cierre: ", bold: true }),
              new TextRun({ text: lirmi.cierre })
            ],
            spacing: { after: 100 }
          })
        ];
      } else if (activeTab === 'utp') {
        const utp = planning.content.utp_documentation ?? {
          dua_adaptations: { representation: '', expression: '', engagement: '' },
          learning_adaptations: { dua_1: '', dua_2: '', dua_3: '' },
          nlp_technique: { opening: '', pause: '', closing: '' },
          rubric_summary: ''
        };
        documentChildren = [
          new Paragraph({
            text: "REI DOCENTE - DOCUMENTACIÓN UTP",
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 }
          }),
          
          createSectionHeaderWord("Adaptaciones de Accesibilidad (Decreto 83 / DUA)", "F1F5F9", "334155"),
          new Paragraph({ text: "", spacing: { after: 50 } }),
          new Paragraph({
            children: [
              new TextRun({ text: "• Representación: ", bold: true }),
              new TextRun({ text: utp.dua_adaptations.representation })
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "• Expresión: ", bold: true }),
              new TextRun({ text: utp.dua_adaptations.expression })
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "• Compromiso: ", bold: true }),
              new TextRun({ text: utp.dua_adaptations.engagement })
            ],
            spacing: { after: 150 }
          }),

          createSectionHeaderWord("Adaptaciones de Aprendizaje", "F1F5F9", "334155"),
          new Paragraph({ text: "", spacing: { after: 50 } }),
          new Paragraph({
            children: [
              new TextRun({ text: "• Adaptación DUA 1: ", bold: true }),
              new TextRun({ text: utp.learning_adaptations.dua_1 })
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "• Adaptación DUA 2: ", bold: true }),
              new TextRun({ text: utp.learning_adaptations.dua_2 })
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "• Adaptación DUA 3: ", bold: true }),
              new TextRun({ text: utp.learning_adaptations.dua_3 })
            ],
            spacing: { after: 150 }
          }),

          createSectionHeaderWord("Técnicas de Anclaje", "F1F5F9", "334155"),
          new Paragraph({ text: "", spacing: { after: 50 } }),
          new Paragraph({
            children: [
              new TextRun({ text: "• Apertura: ", bold: true }),
              new TextRun({ text: utp.nlp_technique.opening })
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "• Pausa: ", bold: true }),
              new TextRun({ text: utp.nlp_technique.pause })
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "• Cierre: ", bold: true }),
              new TextRun({ text: utp.nlp_technique.closing })
            ],
            spacing: { after: 150 }
          }),

          createSectionHeaderWord("Rúbrica de Cierre", "F1F5F9", "334155"),
          new Paragraph({ text: "", spacing: { after: 50 } }),
          new Paragraph({
            children: [
              new TextRun({ text: utp.rubric_summary })
            ]
          })
        ];
      }

      const doc = new Document({
        sections: [
          {
            properties: {},
            children: documentChildren
          }
        ]
      });

      const blob = await Packer.toBlob(doc);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Rei_Docente_Planificacion_${planning.subject.replace(/\s+/g, '_')}_${planning.grade.replace(/\s+/g, '_')}.docx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error generating Word document:', err);
      alert('Error al exportar a Word.');
    } finally {
      setExportingWord(false);
    }
  };

  const exportToPdf = () => {
    if (!planning || !jspdfLib) return;
    setExportingPdf(true);

    try {
      const { jsPDF } = jspdfLib;
      const doc = new jsPDF();
      
      let cursorY = 20;
      const marginX = 15;
      const maxLineWidth = 180;
      const pageHeight = 280;

      const sanitizeForPdf = (str: string): string => {
        if (!str) return '';
        return str
          .replace(/\*/g, '')
          .replace(/⚠️/g, '[Alerta]')
          .replace(/☐/g, '[ ]')
          .replace(/☑/g, '[x]')
          .replace(/🌹/g, '[Rosa]')
          .replace(/⏳/g, '[Tiempo]')
          .replace(/✒️/g, '[Pluma]')
          .replace(/✓/g, '[OK]')
          .replace(/→/g, '->')
          .replace(/←/g, '<-')
          .replace(/⇒/g, '=>')
          .replace(/⇔/g, '<=>')
          .replace(/[^\x00-\xff\u2022\u2014\u2013\u201c\u201d\u2018\u2019]/gu, '');
      };

      const checkPageBreak = (neededSpace: number) => {
        if (cursorY + neededSpace > pageHeight) {
          doc.addPage();
          cursorY = 20;
        }
      };

      const writeHeader = (title: string, size = 16, style = 'bold') => {
        const sanitizedTitle = sanitizeForPdf(title);
        checkPageBreak(15);
        doc.setFont('Helvetica', style);
        doc.setFontSize(size);
        doc.setTextColor(30, 41, 59);
        doc.text(sanitizedTitle, marginX, cursorY);
        cursorY += 8;
      };

      const writeText = (text: string, size = 10, style = 'normal', color = [71, 85, 105]) => {
        const sanitizedText = sanitizeForPdf(text);
        doc.setFont('Helvetica', style);
        doc.setFontSize(size);
        doc.setTextColor(color[0], color[1], color[2]);
        
        const lines = doc.splitTextToSize(sanitizedText, maxLineWidth);
        for (const line of lines) {
          checkPageBreak(6);
          doc.text(line, marginX, cursorY);
          cursorY += 6;
        }
        cursorY += 2;
      };

      const writeSectionHeaderPdf = (title: string, bgColor = [241, 245, 249], textColor = [30, 41, 59]) => {
        const sanitizedTitle = sanitizeForPdf(title);
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(10);
        
        const bannerPadding = 3;
        const lines = doc.splitTextToSize(sanitizedTitle.replace(/\*\*|__/g, ''), maxLineWidth - bannerPadding * 2) as string[];
        const bannerHeight = lines.length * 5 + 3;
        
        checkPageBreak(bannerHeight + 6);
        
        doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
        doc.rect(marginX, cursorY, maxLineWidth, bannerHeight, 'F');
        
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        lines.forEach((lineText, idx) => {
          doc.text(lineText, marginX + bannerPadding, cursorY + bannerPadding + 3.5 + (idx * 5));
        });
        
        cursorY += bannerHeight + 5;
      };

      const writeMetadataTablePdf = () => {
        checkPageBreak(50);
        const colWidth = maxLineWidth / 2;
        const rowHeight = 9;
        const padding = 2;
        
        const metadataRows = [
          [
            { label: "Establecimiento: ", val: "[Completar por docente]" },
            { label: "Docente: ", val: "[Completar por docente]" }
          ],
          [
            { label: "Asignatura: ", val: planning.subject },
            { label: "Curso/Nivel: ", val: planning.grade }
          ],
          [
            { label: "Período: ", val: "[Completar por docente]" },
            { label: "OA trabajados (códigos): ", val: planning.learning_objective.split(' — ')[0] }
          ],
          [
            { label: "Foco: ", val: getFullUnitName(planning.grade, planning.unit) },
            { label: "Sistema pedagógico: ", val: `Técnica ${planning.content.writing_technique?.toUpperCase() ?? 'OREO'} · Didáctica Inversa` }
          ]
        ];

        metadataRows.forEach((row, rowIndex) => {
          doc.setDrawColor(203, 213, 225);
          doc.setLineWidth(0.1);
          
          row.forEach((cell, colIdx) => {
            const x = marginX + colIdx * colWidth;
            const y = cursorY;
            
            // Draw box
            doc.rect(x, y, colWidth, rowHeight);
            
            // Draw text
            doc.setFont('Helvetica', 'bold');
            doc.setFontSize(8.5);
            doc.setTextColor(30, 41, 59);
            doc.text(cell.label, x + padding, y + 5.5);
            
            const labelWidth = doc.getTextWidth(cell.label);
            doc.setFont('Helvetica', 'normal');
            doc.setTextColor(71, 85, 105);
            const cleanVal = sanitizeForPdf(cell.val);
            const valLines = doc.splitTextToSize(cleanVal, colWidth - labelWidth - padding * 2);
            doc.text(valLines[0] || '', x + padding + labelWidth, y + 5.5);
          });
          
          cursorY += rowHeight;
        });
        cursorY += 6;
      };

      const writeRtiTablePdf = (title: string, text: string, bgColor: number[], textColor: number[]) => {
        checkPageBreak(35);
        
        // Header Row
        doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
        doc.rect(marginX, cursorY, maxLineWidth, 8, 'F');
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        doc.text(sanitizeForPdf(title), marginX + 3, cursorY + 5.5);
        
        doc.setDrawColor(203, 213, 225);
        doc.setLineWidth(0.1);
        doc.rect(marginX, cursorY, maxLineWidth, 8);
        cursorY += 8;
        
        // Content Row
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(9.5);
        doc.setTextColor(71, 85, 105);
        const sanitizedText = sanitizeForPdf(text);
        const lines = doc.splitTextToSize(sanitizedText, maxLineWidth - 6);
        const contentHeight = lines.length * 5.5 + 4;
        
        checkPageBreak(contentHeight);
        doc.setFillColor(255, 255, 255);
        doc.rect(marginX, cursorY, maxLineWidth, contentHeight, 'F');
        
        lines.forEach((line: string, idx: number) => {
          doc.text(line, marginX + 3, cursorY + 4.5 + (idx * 5.5));
        });
        
        doc.rect(marginX, cursorY, maxLineWidth, contentHeight);
        cursorY += contentHeight + 4;
      };

      const writeSessionMetadataBlockPdf = (metadata: SessionMetadata) => {
        checkPageBreak(50);

        // Calculate height
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(10);
        const titleLines = doc.splitTextToSize(metadata.title, maxLineWidth - 10) as string[];
        
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(9);
        const tipoLines = doc.splitTextToSize(`Tipo / OA: ${metadata.tipoOa}`, maxLineWidth - 10) as string[];
        const objLines = doc.splitTextToSize(`Objetivo: ${metadata.objetivo}`, maxLineWidth - 10) as string[];
        const evalLines = doc.splitTextToSize(`Evaluación: ${metadata.evaluacion}`, maxLineWidth - 10) as string[];

        const padding = 5;
        const spacingBetween = 4;
        const totalHeight = 
          titleLines.length * 5 + 
          tipoLines.length * 4.5 + 
          objLines.length * 4.5 + 
          evalLines.length * 4.5 + 
          padding * 2 + 
          spacingBetween * 3;

        // Draw light blue background rectangle
        doc.setFillColor(224, 242, 254); // Light blue
        doc.rect(marginX, cursorY, maxLineWidth, totalHeight, 'F');

        // Draw left border: dark blue, 2mm width
        doc.setFillColor(3, 105, 161); // Dark blue
        doc.rect(marginX, cursorY, 2, totalHeight, 'F');

        let currentY = cursorY + padding + 3;

        // Print Title
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(3, 105, 161); // Dark blue text
        titleLines.forEach(line => {
          doc.text(line, marginX + padding + 2, currentY);
          currentY += 5;
        });
        currentY += spacingBetween - 2;

        // Print Tipo / OA
        doc.setTextColor(15, 23, 42); // slate-800
        doc.setFontSize(9);
        tipoLines.forEach((line, idx) => {
          if (idx === 0) {
            doc.setFont('Helvetica', 'bold');
            const labelWidth = doc.getTextWidth("Tipo / OA: x") - doc.getTextWidth("x");
            doc.text("Tipo / OA: ", marginX + padding + 2, currentY);
            doc.setFont('Helvetica', 'normal');
            doc.text(line.replace(/^Tipo\s*\/\s*OA\s*:\s*/i, ''), marginX + padding + 2 + labelWidth, currentY);
          } else {
            doc.setFont('Helvetica', 'normal');
            doc.text(line, marginX + padding + 2, currentY);
          }
          currentY += 4.5;
        });
        currentY += spacingBetween - 2.5;

        // Print Objetivo
        objLines.forEach((line, idx) => {
          if (idx === 0) {
            doc.setFont('Helvetica', 'bold');
            const labelWidth = doc.getTextWidth("Objetivo: x") - doc.getTextWidth("x");
            doc.text("Objetivo: ", marginX + padding + 2, currentY);
            doc.setFont('Helvetica', 'normal');
            doc.text(line.replace(/^Objetivo\s*:\s*/i, ''), marginX + padding + 2 + labelWidth, currentY);
          } else {
            doc.setFont('Helvetica', 'normal');
            doc.text(line, marginX + padding + 2, currentY);
          }
          currentY += 4.5;
        });
        currentY += spacingBetween - 2.5;

        // Print Evaluación
        evalLines.forEach((line, idx) => {
          if (idx === 0) {
            doc.setFont('Helvetica', 'bold');
            const labelWidth = doc.getTextWidth("Evaluación: x") - doc.getTextWidth("x");
            doc.text("Evaluación: ", marginX + padding + 2, currentY);
            doc.setFont('Helvetica', 'normal');
            doc.text(line.replace(/^Evaluaci[oó]n\s*:\s*/i, ''), marginX + padding + 2 + labelWidth, currentY);
          } else {
            doc.setFont('Helvetica', 'normal');
            doc.text(line, marginX + padding + 2, currentY);
          }
          currentY += 4.5;
        });

        cursorY += totalHeight + 8;
      };

      const writeTablePdf = (rows: string[][]) => {
        const numCols = rows[0].length;
        let colWidths = Array(numCols).fill(maxLineWidth / numCols);
        if (numCols === 3) {
          colWidths = [35, 130, 15];
        } else if (numCols === 2) {
          colWidths = [50, 130];
        } else if (numCols === 4) {
          colWidths = [30, 50, 50, 50];
        }
        const cellMargin = 2;
        
        for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
          const row = rows[rowIndex];
          
          const colLines = row.map((cellText, colIdx) => {
            doc.setFont('Helvetica', rowIndex === 0 ? 'bold' : 'normal');
            doc.setFontSize(9);
            const sanitizedCell = sanitizeForPdf(cellText);
            const textToSplit = sanitizedCell.replace(/\*/g, '').replace(/__/g, '');
            return doc.splitTextToSize(textToSplit, (colWidths[colIdx] ?? (maxLineWidth / numCols)) - cellMargin * 2) as string[];
          });
          
          const maxLines = Math.max(...colLines.map(lines => lines.length));
          const rowHeight = maxLines * 5 + 4;
          
          checkPageBreak(rowHeight);
          
          if (rowIndex === 0) {
            doc.setFillColor(241, 245, 249);
            doc.rect(marginX, cursorY, maxLineWidth, rowHeight, 'F');
          }
          
          let colX = marginX;
          for (let colIdx = 0; colIdx < row.length; colIdx++) {
            const width = colWidths[colIdx] ?? (maxLineWidth / numCols);
            const lines = colLines[colIdx];
            
            doc.setFont('Helvetica', rowIndex === 0 ? 'bold' : 'normal');
            doc.setFontSize(9);
            doc.setTextColor(51, 65, 85);
            
            lines.forEach((lineText, lineIdx) => {
              doc.text(lineText, colX + cellMargin, cursorY + cellMargin + 3 + (lineIdx * 5));
            });
            
            doc.setDrawColor(203, 213, 225);
            doc.setLineWidth(0.1);
            doc.rect(colX, cursorY, width, rowHeight);
            
            colX += width;
          }
          
          cursorY += rowHeight;
        }
        cursorY += 4;
      };

      const writeParagraphPdf = (line: string) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('```')) {
          return;
        }
        if (/^[-—_*\s]{3,}$/.test(trimmed)) {
          checkPageBreak(5);
          doc.setDrawColor(226, 232, 240); // light gray
          doc.setLineWidth(0.5);
          doc.line(marginX, cursorY, marginX + maxLineWidth, cursorY);
          cursorY += 6;
          return;
        }

        const cleanedLine = removePlaceholders(line);
        const sanitizedLine = sanitizeForPdf(cleanedLine);
        const cleanLine = sanitizedLine.replace(/\*\*|__/g, '').trim();
        if (cleanLine === '') {
          cursorY += 4;
          return;
        }

        const headerInfo = detectHeader(cleanedLine);

        if (headerInfo.isHeader) {
          const cleanHeaderText = sanitizedLine.replace(/^[#\*\s]+|[#\*\s]+$/g, '').replace(/\*\*|__/g, '').trim();
          if (cleanHeaderText === '') return;

          if (headerInfo.type === 'subsection') {
            checkPageBreak(8);
            doc.setFont('Helvetica', 'bold');
            doc.setFontSize(10.5);
            doc.setTextColor(15, 23, 42); // slate-800
            doc.text(cleanHeaderText, marginX, cursorY);
            cursorY += 6.5;
            return;
          }

          let bgColor = [241, 245, 249];
          let textColor = [51, 65, 85];
          if (headerInfo.type === 'session') {
            bgColor = [224, 242, 254];
            textColor = [3, 105, 161];
          } else if (headerInfo.type === 'nivel1') {
            bgColor = [226, 240, 217];
            textColor = [56, 87, 35];
          } else if (headerInfo.type === 'nivel2') {
            bgColor = [255, 242, 204];
            textColor = [127, 96, 0];
          } else if (headerInfo.type === 'nivel3') {
            bgColor = [242, 220, 219];
            textColor = [192, 0, 0];
          }
          writeSectionHeaderPdf(cleanHeaderText, bgColor, textColor);
          return;
        }

        const isBullet = cleanedLine.trim().startsWith('•') || cleanedLine.trim().startsWith('—') || cleanedLine.trim().startsWith('*') || cleanedLine.trim().startsWith('-');
        let textToShow = cleanedLine.trim();
        if (isBullet) {
          textToShow = textToShow.substring(1).trim();
        }
        textToShow = textToShow.replace(/^[#\*\s—\-\•]+|[#\*\s—\-\•]+$/g, '').trim();
        textToShow = textToShow.replace(/^\*|\*$/g, '').trim();

        if (textToShow === '') return;

        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(9.5);
        doc.setTextColor(71, 85, 105);

        const textFinal = isBullet ? `• ${textToShow}` : textToShow;
        const sanitizedFinal = sanitizeForPdf(textFinal);

        const lines = doc.splitTextToSize(sanitizedFinal.replace(/\*/g, '').replace(/__/g, ''), maxLineWidth - (isBullet ? 5 : 0));
        for (const l of lines) {
          checkPageBreak(6);
          doc.text(l, marginX + (isBullet ? 5 : 0), cursorY);
          cursorY += 5.5;
        }
        cursorY += 1.5;
      };

      const parseAndRenderTextPdf = (text: string) => {
        const blocks = parseMarkdownText(text);
        blocks.forEach(block => {
          if (block.type === 'table' && block.rows) {
            writeTablePdf(block.rows);
          } else {
            writeParagraphPdf(block.text ?? '');
          }
        });
      };

      const formatActivitiesSequencePdf = (text: string) => {
        const blocks = parseActivitiesSequence(text);

        if (blocks.inicio) {
          writeSectionHeaderPdf("Inicio", [224, 242, 254], [3, 105, 161]);
          parseAndRenderTextPdf(blocks.inicio);
          cursorY += 4;
        }

        if (blocks.desarrollo.general || blocks.desarrollo.modelado || blocks.desarrollo.practicaGuiada || blocks.desarrollo.practicaAutonoma) {
          writeSectionHeaderPdf("Desarrollo", [241, 245, 249], [51, 65, 85]);
          if (blocks.desarrollo.general) {
            parseAndRenderTextPdf(blocks.desarrollo.general);
            cursorY += 2;
          }
          if (blocks.desarrollo.modelado) {
            writeText("• Modelado docente:", 10, 'bold', [15, 23, 42]);
            parseAndRenderTextPdf(blocks.desarrollo.modelado);
            cursorY += 2;
          }
          if (blocks.desarrollo.practicaGuiada) {
            writeText("• Práctica guiada:", 10, 'bold', [15, 23, 42]);
            parseAndRenderTextPdf(blocks.desarrollo.practicaGuiada);
            cursorY += 2;
          }
          if (blocks.desarrollo.practicaAutonoma) {
            writeText("• Práctica autónoma:", 10, 'bold', [15, 23, 42]);
            parseAndRenderTextPdf(blocks.desarrollo.practicaAutonoma);
            cursorY += 2;
          }
        }

        if (blocks.cierre) {
          writeSectionHeaderPdf("Cierre", [255, 242, 204], [127, 96, 0]);
          parseAndRenderTextPdf(blocks.cierre);
          cursorY += 4;
        }
      };

      let suffix = '';

      if (activeTab === 'complete') {
        const oaCodes = planning.learning_objective.split(' — ')[0];

        writeHeader("REI DOCENTE - PLANIFICACIÓN DE CLASE", 18);
        cursorY += 4;
        
        writeMetadataTablePdf();

        writeSectionHeaderPdf("Objetivo de Aprendizaje (OA)", [224, 242, 254], [3, 105, 161]);
        writeText(oaCodes, 10, 'italic');
        writeText("Objetivo de clase: " + cleanObjective(planning.content.backward_design.objective), 10, 'normal');
        cursorY += 4;

        writeSectionHeaderPdf("Evaluación de Nivel Lector", [224, 242, 254], [3, 105, 161]);
        writeText(`Nivel de lectura estimado: ${planning.reading_level.estimated_level}`);
        writeText(`Alerta pedagógica: ${planning.reading_level.warning_alert}`);
        cursorY += 4;

        writeSectionHeaderPdf("1. Diseño Curricular Inverso (Backward Design)", [241, 245, 249], [51, 65, 85]);
        writeText("Objetivo de la sesión:", 10, 'bold', [15, 23, 42]);
        writeText(cleanObjective(planning.content.backward_design.objective));
        cursorY += 2;
        writeText("Evidencia de evaluación:", 10, 'bold', [15, 23, 42]);
        writeText(planning.content.backward_design.assessment_evidence);
        cursorY += 2;
        
        const { metadata, rest } = extractMetadataBlock(planning.content.backward_design.activities_sequence);
        if (metadata) {
          writeSessionMetadataBlockPdf(metadata);
        }

        if (planning.content.texto_sesion && planning.content.texto_sesion.cuerpo) {
          writeSectionHeaderPdf("Texto de la Sesión", [241, 245, 249], [51, 65, 85]);
          writeText(`Tipo: ${planning.content.texto_sesion.tipo || 'Lectura'}`, 9.5, 'bold', [15, 23, 42]);
          writeText(`Título: ${planning.content.texto_sesion.titulo || 'Sin título'}`, 9.5, 'bold', [15, 23, 42]);
          writeText(`Autor: ${planning.content.texto_sesion.autor || 'Anónimo'}`, 9.5, 'bold', [15, 23, 42]);
          writeText(`Fuente: Texto generado para uso pedagógico — REI Docente`, 9.5, 'italic', [15, 23, 42]);
          cursorY += 4;

          const paragraphs = planning.content.texto_sesion.cuerpo.split('\n');
          paragraphs.forEach((p: string) => {
            const trimmed = p.trim();
            if (trimmed) {
              writeParagraphPdf(trimmed);
              cursorY += 2;
            }
          });
          cursorY += 4;
        }

        writeText("Secuencia de actividades:", 10, 'bold', [15, 23, 42]);
        if (isAlreadyStructured(rest)) {
          parseAndRenderTextPdf(rest);
        } else {
          formatActivitiesSequencePdf(rest);
        }
        cursorY += 4;

        writeSectionHeaderPdf("2. Adaptaciones de Aprendizaje y Accesibilidad", [241, 245, 249], [51, 65, 85]);
        cursorY += 2;

        const adaptationRows = getAdaptationRows(planning);
        const header = ["Nivel", "Texto y materiales", "Práctica autónoma", `Ticket ${(planning.content.writing_technique || 'RICE').toUpperCase()}`];
        const tableRows = [
          header,
          ...adaptationRows.map(r => [r.level, r.materials, r.practice, r.ticket])
        ];
        writeTablePdf(tableRows);
        cursorY += 4;

        writeSectionHeaderPdf("3. Rúbrica de Cierre", [241, 245, 249], [51, 65, 85]);
        parseAndRenderTextPdf(planning.content.rubric);
      } else if (activeTab === 'brief') {
        suffix = '_Breve';
        const lirmi = planning.content.lirmi_summary ?? {
          oa_numbers: planning.learning_objective.match(/OA\s*\d+/gi)?.join(', ') || 'No especificados',
          class_objective: 'Objetivo de clase no generado.',
          inicio: 'Inicio no generado.',
          desarrollo: 'Desarrollo no generado.',
          cierre: 'Cierre no generado.'
        };
        
        writeHeader("REI DOCENTE - SESIÓN BREVE · LIBRO DE CLASES", 18);
        cursorY += 4;
        
        writeText(`Asignatura: ${planning.subject}  |  Curso: ${planning.grade}`, 10, 'bold', [15, 23, 42]);
        writeText(`Unidad: ${planning.unit}  |  Fecha: ${new Date(planning.created_at).toLocaleDateString('es-CL')}`, 10, 'bold', [15, 23, 42]);
        cursorY += 6;

        writeSectionHeaderPdf("Sesión Breve · Libro de Clases", [224, 242, 254], [3, 105, 161]);
        
        writeText("OA:", 10, 'bold', [15, 23, 42]);
        writeText(lirmi.oa_numbers);
        cursorY += 2;
        
         writeText("Objetivo de clase:", 10, 'bold', [15, 23, 42]);
        writeText(cleanObjective(lirmi.class_objective));
        cursorY += 2;
        
        writeText("Inicio:", 10, 'bold', [15, 23, 42]);
        writeText(lirmi.inicio);
        cursorY += 2;
        
        writeText("Desarrollo:", 10, 'bold', [15, 23, 42]);
        writeText(lirmi.desarrollo);
        cursorY += 2;
        
        writeText("Cierre:", 10, 'bold', [15, 23, 42]);
        writeText(lirmi.cierre);
      } else if (activeTab === 'utp') {
        suffix = '_UTP';
        const utp = planning.content.utp_documentation ?? {
          dua_adaptations: { representation: '', expression: '', engagement: '' },
          learning_adaptations: { dua_1: '', dua_2: '', dua_3: '' },
          nlp_technique: { opening: '', pause: '', closing: '' },
          rubric_summary: ''
        };

        writeHeader("REI DOCENTE - DOCUMENTACIÓN UTP", 18);
        cursorY += 4;
        
        writeText(`Asignatura: ${planning.subject}  |  Curso: ${planning.grade}`, 10, 'bold', [15, 23, 42]);
        writeText(`Unidad: ${planning.unit}  |  Fecha: ${new Date(planning.created_at).toLocaleDateString('es-CL')}`, 10, 'bold', [15, 23, 42]);
        cursorY += 6;

        writeSectionHeaderPdf("Adaptaciones de Accesibilidad (Decreto 83 / DUA)", [241, 245, 249], [51, 65, 85]);
        writeText("• Representación: ", 10, 'bold', [15, 23, 42]);
        writeText(utp.dua_adaptations.representation);
        cursorY += 2;
        writeText("• Expresión: ", 10, 'bold', [15, 23, 42]);
        writeText(utp.dua_adaptations.expression);
        cursorY += 2;
        writeText("• Compromiso: ", 10, 'bold', [15, 23, 42]);
        writeText(utp.dua_adaptations.engagement);
        cursorY += 4;

        writeSectionHeaderPdf("Adaptaciones de Aprendizaje", [241, 245, 249], [51, 65, 85]);
        writeText("• Adaptación DUA 1: ", 10, 'bold', [15, 23, 42]);
        writeText(utp.learning_adaptations.dua_1);
        cursorY += 2;
        writeText("• Adaptación DUA 2: ", 10, 'bold', [15, 23, 42]);
        writeText(utp.learning_adaptations.dua_2);
        cursorY += 2;
        writeText("• Adaptación DUA 3: ", 10, 'bold', [15, 23, 42]);
        writeText(utp.learning_adaptations.dua_3);
        cursorY += 4;

        writeSectionHeaderPdf("Técnicas de Anclaje", [241, 245, 249], [51, 65, 85]);
        writeText("• Apertura: ", 10, 'bold', [15, 23, 42]);
        writeText(utp.nlp_technique.opening);
        cursorY += 2;
        writeText("• Pausa: ", 10, 'bold', [15, 23, 42]);
        writeText(utp.nlp_technique.pause);
        cursorY += 2;
        writeText("• Cierre: ", 10, 'bold', [15, 23, 42]);
        writeText(utp.nlp_technique.closing);
        cursorY += 4;

        writeSectionHeaderPdf("Rúbrica de Cierre", [241, 245, 249], [51, 65, 85]);
        writeText(utp.rubric_summary);
      }

      doc.save(`Rei_Docente_Planificacion${suffix}_${planning.subject.replace(/\s+/g, '_')}_${planning.grade.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Error al exportar a PDF.');
    } finally {
      setExportingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9FC] text-slate-800 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mx-auto" />
          <p className="text-slate-600 text-sm">Cargando detalles de planificación...</p>
        </div>
      </div>
    );
  }

  if (!planning) {
    return (
      <div className="min-h-screen bg-[#FAF9FC] text-slate-800 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-rose-600">No se encontró la planificación seleccionada.</p>
          <Link href="/" className="text-indigo-600 hover:underline">Volver al Dashboard</Link>
        </div>
      </div>
    );
  }

  const isLevelWarning = 
    planning.reading_level?.warning_alert?.toLowerCase().includes('alerta') ||
    planning.reading_level?.warning_alert?.toLowerCase().includes('avanzado') ||
    planning.reading_level?.warning_alert?.toLowerCase().includes('simple') ||
    planning.reading_level?.warning_alert?.toLowerCase().includes('diferencia') || false;

  return (
    <div className="relative min-h-screen bg-[#FAF9FC] text-slate-800 flex flex-col">
      {/* Background glow effects */}
      <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-violet-200/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-pink-200/20 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#FAF9FC]/80 backdrop-blur-md border-b border-[#E2E8F0]/60 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="p-2 bg-white hover:bg-slate-800 rounded-xl border border-[#E2E8F0]/70 text-slate-600 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-slate-100 to-indigo-200 bg-clip-text text-transparent">
            Planificación Generada
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          {/* Sidebar Toggle Button */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`inline-flex items-center gap-2 px-3 py-2 bg-white border rounded-xl text-xs font-semibold transition-all duration-300 ${
              isSidebarOpen 
                ? 'border-indigo-500/40 text-indigo-600 bg-indigo-900/5' 
                : 'border-[#E2E8F0]/70 text-slate-600 hover:text-slate-800 hover:border-[#E2E8F0]/70'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ajustar Planificación</span>
          </button>

          {/* Word Download */}
          <button
            onClick={exportToWord}
            disabled={exportingWord}
            id="export-word-btn"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-[#E2E8F0]/70 hover:border-indigo-500/30 text-indigo-600 hover:text-indigo-300 rounded-xl text-sm font-semibold transition-all duration-300 disabled:opacity-50"
          >
            {exportingWord ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Word
          </button>

          {/* PDF Download */}
          <button
            onClick={exportToPdf}
            disabled={exportingPdf}
            id="export-pdf-btn"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-[#E2E8F0]/70 hover:border-indigo-500/30 text-indigo-600 rounded-xl text-sm font-semibold transition-all duration-300 disabled:opacity-50"
          >
            {exportingPdf ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            PDF
          </button>

        </div>
      </header>

      {/* Main Content Layout with Sidebar */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-[1400px] w-full mx-auto px-6 py-8 gap-6 z-10 relative">
        
        {/* Left Side: Planning Detail */}
        <main className="flex-1 min-w-0 space-y-6 relative">
          {/* Overlay loading state when adjusting */}
          {isAdjusting && (
            <div className="absolute inset-0 bg-[#FAF9FC]/70 backdrop-blur-sm z-40 rounded-3xl flex flex-col items-center justify-center gap-4 text-center p-6 border border-indigo-150">
              <div className="p-4 bg-indigo-50 rounded-full border border-indigo-150 animate-pulse">
                <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-800">Ajustando tu planificación...</h3>
                <p className="text-sm text-slate-600 max-w-md">
                  Claude está procesando el ajuste: <span className="text-indigo-300 italic">"{activeInstructionText}"</span>. Esto puede tardar unos segundos.
                </p>
              </div>
            </div>
          )}

          {/* Core Metadata Card */}
          <div className="bg-slate-50/50 backdrop-blur-sm border border-[#E2E8F0]/60 rounded-3xl p-6 md:p-8 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-3.5 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-lg border border-indigo-500/10 uppercase tracking-wider">
                {planning.subject}
              </span>
              <span className="px-3.5 py-1 bg-slate-850 text-slate-700 text-xs font-bold rounded-lg uppercase tracking-wider flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5" />
                {planning.grade}
              </span>
              <span className="px-3.5 py-1 bg-white text-slate-600 text-xs rounded-lg flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(planning.created_at).toLocaleDateString('es-CL', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric'
                })}
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800">
              Unidad: {planning.unit}
            </h1>

            <div className="bg-[#FAF9FC]/60 rounded-2xl p-4 border border-[#E2E8F0]/60">
              <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
                Objetivo de Aprendizaje (OA) / Estándar Curricular
              </h3>
              <p className="text-sm text-slate-700 italic">
                {planning.learning_objective}
              </p>
            </div>
          </div>

          {/* Reading Level Evaluator */}
          <div 
            className={`p-6 rounded-3xl border flex items-start gap-4 transition-all duration-300 ${
              isLevelWarning 
                ? 'bg-amber-950/20 border-amber-900/40 text-amber-200' 
                : 'bg-emerald-950/20 border-emerald-900/40 text-emerald-200'
            }`}
            id="level-evaluator-panel"
          >
            {isLevelWarning ? (
              <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <h3 className="font-bold text-sm uppercase tracking-wider">
                Evaluación de Nivel Lector de la Lección
              </h3>
              <p className="text-xs text-slate-700">
                <strong className="text-slate-800">Nivel estimado:</strong> {planning.reading_level.estimated_level}
              </p>
              <p className="text-xs text-slate-700">
                <strong className="text-slate-800">Adecuación:</strong> {planning.reading_level.warning_alert}
              </p>
            </div>
          </div>

          {/* Tab Selection Bar */}
          <div className="bg-white backdrop-blur-sm border border-[#E2E8F0]/60 rounded-2xl p-1.5 flex flex-wrap gap-2">
            <button
              onClick={() => handleTabChange('complete')}
              className={`flex-1 min-w-[120px] py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                activeTab === 'complete'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10'
                  : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <Layers className="w-4 h-4" />
              Planificación Completa
            </button>
            <button
              onClick={() => handleTabChange('brief')}
              className={`flex-1 min-w-[120px] py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                activeTab === 'brief'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10'
                  : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Sesión Breve · Libro de Clases
            </button>
          </div>

          {/* Active Tab Content */}
          {loadingSummary ? (
            <div className="bg-white/20 backdrop-blur-sm border border-[#E2E8F0]/60/60 rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-4 border-indigo-500/10">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-800">Generando resumen inteligente...</p>
                <p className="text-xs text-slate-600">Claude está sintetizando la información para esta vista.</p>
              </div>
            </div>
          ) : summaryError ? (
            <div className="bg-white/20 backdrop-blur-sm border border-[#E2E8F0]/60/60 rounded-3xl p-8 text-center flex flex-col items-center justify-center gap-4 text-rose-600">
              <AlertTriangle className="w-8 h-8 text-rose-500" />
              <div className="space-y-1">
                <p className="text-sm font-semibold">Error al cargar la vista sintetizada</p>
                <p className="text-xs text-slate-600">{summaryError}</p>
              </div>
              <button
                onClick={() => handleTabChange(activeTab)}
                className="mt-2 px-4 py-2 bg-white hover:bg-slate-800 border border-[#E2E8F0]/70 hover:border-[#E2E8F0]/70 text-xs font-semibold rounded-xl text-slate-600 transition-all"
              >
                Reintentar generación
              </button>
            </div>
          ) : activeTab === 'complete' ? (
            <div className="space-y-6">
              {/* Section 1: Backward Design */}
              <section className="bg-white backdrop-blur-sm border border-[#E2E8F0]/60 rounded-3xl p-6 md:p-8 space-y-4">
                <h2 className="text-lg font-extrabold flex items-center gap-2 text-indigo-600 border-b border-[#E2E8F0]/70 pb-3">
                  <Layers className="w-5 h-5" />
                  1. Diseño Curricular Inverso (Backward Design)
                </h2>
                <div className="space-y-4 text-sm text-slate-700">
                  <div>
                    <strong className="text-slate-800 block mb-1">Objetivo del Estudiante:</strong>
                    <p className="bg-[#FAF9FC]/40 border border-[#E2E8F0]/60 p-4 rounded-xl">{planning.content.backward_design.objective}</p>
                  </div>
                  <div>
                    <strong className="text-slate-800 block mb-1">Evidencia de Evaluación:</strong>
                    <p className="bg-[#FAF9FC]/40 border border-[#E2E8F0]/60 p-4 rounded-xl">{planning.content.backward_design.assessment_evidence}</p>
                  </div>
                  <div>
                    <strong className="text-slate-800 block mb-1">Secuencia de Actividades (Inicio, Desarrollo, Cierre):</strong>
                    <div className="bg-[#FAF9FC]/40 border border-[#E2E8F0]/60 p-4 rounded-xl whitespace-pre-line leading-relaxed">
                      {planning.content.backward_design.activities_sequence}
                    </div>
                  </div>
                </div>
              </section>

              {/* Section 2: DUA Adaptations */}
              <section className="bg-white backdrop-blur-sm border border-[#E2E8F0]/60 rounded-3xl p-6 md:p-8 space-y-4">
                <h2 className="text-lg font-extrabold flex items-center gap-2 text-indigo-600 border-b border-[#E2E8F0]/70 pb-3">
                  <Users className="w-5 h-5" />
                  2. Adaptaciones DUA (Diseño Universal de Aprendizaje)
                </h2>
                {typeof planning.content.dua_adaptations === 'string' ? (
                  <div className="bg-[#FAF9FC]/40 border border-[#E2E8F0]/60 p-4 rounded-xl text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                    {planning.content.dua_adaptations}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-700">
                    <div className="bg-emerald-50/30 border border-emerald-100 p-4 rounded-xl space-y-1">
                      <strong className="text-emerald-600 text-xs uppercase font-bold block">N1 — Universal</strong>
                      <p className="text-xs leading-relaxed">{planning.content.dua_adaptations?.n1}</p>
                    </div>
                    <div className="bg-amber-50/30 border border-amber-100 p-4 rounded-xl space-y-1">
                      <strong className="text-amber-600 text-xs uppercase font-bold block">N2 — Con apoyos</strong>
                      <p className="text-xs leading-relaxed">{planning.content.dua_adaptations?.n2}</p>
                    </div>
                    <div className="bg-rose-50/30 border border-rose-100 p-4 rounded-xl space-y-1">
                      <strong className="text-rose-600 text-xs uppercase font-bold block">N3 — Intensivo</strong>
                      <p className="text-xs leading-relaxed">{planning.content.dua_adaptations?.n3}</p>
                    </div>
                  </div>
                )}
              </section>

              {/* Section 3: Learning Adaptations */}
              <section className="bg-white backdrop-blur-sm border border-[#E2E8F0]/60 rounded-3xl p-6 md:p-8 space-y-4">
                <h2 className="text-lg font-extrabold flex items-center gap-2 text-indigo-600 border-b border-[#E2E8F0]/70 pb-3">
                  <Compass className="w-5 h-5" />
                  3. Adaptaciones de Aprendizaje
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-700">
                  <div className="bg-[#FAF9FC]/40 border border-emerald-100 p-4 rounded-xl space-y-2">
                    <strong className="text-emerald-600 text-xs uppercase font-bold block">Adaptación DUA 1</strong>
                    {planning.content.rti_supports?.n1 && typeof planning.content.rti_supports.n1 === 'object' ? (
                      <div className="space-y-1 text-xs">
                        <p><span className="font-semibold text-slate-500">Práctica:</span> {planning.content.rti_supports.n1.practice}</p>
                        <p><span className="font-semibold text-slate-500">Ticket:</span> {planning.content.rti_supports.n1.ticket}</p>
                      </div>
                    ) : (
                      <p className="text-xs leading-relaxed">
                        {planning.content.rti_supports?.general || planning.content.rti_supports?.n1 || 'Sin especificar'}
                      </p>
                    )}
                  </div>
                  <div className="bg-[#FAF9FC]/40 border border-amber-100 p-4 rounded-xl space-y-2">
                    <strong className="text-amber-600 text-xs uppercase font-bold block">Adaptación DUA 2</strong>
                    {planning.content.rti_supports?.n2 && typeof planning.content.rti_supports.n2 === 'object' ? (
                      <div className="space-y-1 text-xs">
                        <p><span className="font-semibold text-slate-500">Práctica:</span> {planning.content.rti_supports.n2.practice}</p>
                        <p><span className="font-semibold text-slate-500">Ticket:</span> {planning.content.rti_supports.n2.ticket}</p>
                      </div>
                    ) : (
                      <p className="text-xs leading-relaxed">
                        {planning.content.rti_supports?.targeted || planning.content.rti_supports?.n2 || 'Sin especificar'}
                      </p>
                    )}
                  </div>
                  <div className="bg-[#FAF9FC]/40 border border-rose-100 p-4 rounded-xl space-y-2">
                    <strong className="text-rose-600 text-xs uppercase font-bold block">Adaptación DUA 3</strong>
                    {planning.content.rti_supports?.n3 && typeof planning.content.rti_supports.n3 === 'object' ? (
                      <div className="space-y-1 text-xs">
                        <p><span className="font-semibold text-slate-500">Práctica:</span> {planning.content.rti_supports.n3.practice}</p>
                        <p><span className="font-semibold text-slate-500">Ticket:</span> {planning.content.rti_supports.n3.ticket}</p>
                      </div>
                    ) : (
                      <p className="text-xs leading-relaxed">
                        {planning.content.rti_supports?.intensive || planning.content.rti_supports?.n3 || 'Sin especificar'}
                      </p>
                    )}
                  </div>
                </div>
              </section>

              {/* Section 4: NLP Technique */}
              <section className="bg-white backdrop-blur-sm border border-[#E2E8F0]/60 rounded-3xl p-6 md:p-8 space-y-4">
                <h2 className="text-lg font-extrabold flex items-center gap-2 text-indigo-600 border-b border-[#E2E8F0]/70 pb-3">
                  <Sparkles className="w-5 h-5" />
                  4. Técnicas de Anclaje
                </h2>
                <div className="bg-[#FAF9FC]/40 border border-[#E2E8F0]/60 p-4 rounded-xl text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                  {planning.content.nlp_technique}
                </div>
              </section>

              {/* Section 5: Rubric */}
              <section className="bg-white backdrop-blur-sm border border-[#E2E8F0]/60 rounded-3xl p-6 md:p-8 space-y-4">
                <h2 className="text-lg font-extrabold flex items-center gap-2 text-indigo-600 border-b border-[#E2E8F0]/70 pb-3">
                  <ListTodo className="w-5 h-5" />
                  5. Rúbrica de Cierre de Sesión
                </h2>
                <div className="bg-[#FAF9FC]/40 border border-[#E2E8F0]/60 p-4 rounded-xl text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                  {planning.content.rubric}
                </div>
              </section>
            </div>
          ) : activeTab === 'brief' ? (
            <div className="space-y-6">
              {/* Sesión Breve Card */}
              <section className="bg-white backdrop-blur-sm border border-[#E2E8F0]/60 rounded-3xl p-6 md:p-8 space-y-5">
                <h2 className="text-lg font-extrabold flex items-center gap-2 text-indigo-600 border-b border-[#E2E8F0]/70 pb-3">
                  <BookOpen className="w-5 h-5" />
                  Sesión Breve · Libro de Clases
                </h2>
                
                <div className="grid grid-cols-1 gap-4 text-sm text-slate-700">
                  <div className="bg-[#FAF9FC]/40 border border-[#E2E8F0]/60 p-4 rounded-xl">
                    <strong className="text-slate-800 block mb-1">OA:</strong>
                    <p className="text-sm font-medium text-slate-800">{planning.content.lirmi_summary?.oa_numbers}</p>
                  </div>
                  
                  <div className="bg-[#FAF9FC]/40 border border-[#E2E8F0]/60 p-4 rounded-xl">
                    <strong className="text-slate-800 block mb-1">Objetivo de Clase:</strong>
                    <p className="text-sm text-slate-800 leading-relaxed">{planning.content.lirmi_summary?.class_objective}</p>
                  </div>

                  <div className="bg-[#FAF9FC]/40 border border-[#E2E8F0]/60 p-4 rounded-xl">
                    <strong className="text-slate-800 block mb-1">Inicio:</strong>
                    <p className="text-xs leading-relaxed text-slate-700">{planning.content.lirmi_summary?.inicio}</p>
                  </div>

                  <div className="bg-[#FAF9FC]/40 border border-[#E2E8F0]/60 p-4 rounded-xl">
                    <strong className="text-slate-800 block mb-1">Desarrollo:</strong>
                    <p className="text-xs leading-relaxed text-slate-700">{planning.content.lirmi_summary?.desarrollo}</p>
                  </div>

                  <div className="bg-[#FAF9FC]/40 border border-[#E2E8F0]/60 p-4 rounded-xl">
                    <strong className="text-slate-800 block mb-1">Cierre:</strong>
                    <p className="text-xs leading-relaxed text-slate-700">{planning.content.lirmi_summary?.cierre}</p>
                  </div>
                </div>
              </section>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Documentación UTP Card */}
              <section className="bg-white backdrop-blur-sm border border-[#E2E8F0]/60 rounded-3xl p-6 md:p-8 space-y-5">
                <h2 className="text-lg font-extrabold flex items-center gap-2 text-indigo-600 border-b border-[#E2E8F0]/70 pb-3">
                  <FileText className="w-5 h-5" />
                  Documentación de Apoyos y Adaptaciones (UTP)
                </h2>
                
                <div className="space-y-4 text-sm text-slate-700">
                  {/* DUA Accesibilidad */}
                  <div className="bg-[#FAF9FC]/40 border border-[#E2E8F0]/60 p-5 rounded-xl space-y-3">
                    <strong className="text-indigo-300 text-xs uppercase font-bold block">Adaptaciones de Accesibilidad (Decreto 83 / DUA)</strong>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs leading-relaxed">
                      <div>
                        <span className="font-semibold text-slate-800 block mb-0.5">• Representación</span>
                        {planning.content.utp_documentation?.dua_adaptations.representation}
                      </div>
                      <div>
                        <span className="font-semibold text-slate-800 block mb-0.5">• Expresión</span>
                        {planning.content.utp_documentation?.dua_adaptations.expression}
                      </div>
                      <div>
                        <span className="font-semibold text-slate-800 block mb-0.5">• Compromiso</span>
                        {planning.content.utp_documentation?.dua_adaptations.engagement}
                      </div>
                    </div>
                  </div>

                  {/* Adaptaciones de Aprendizaje (labels correct) */}
                  <div className="bg-[#FAF9FC]/40 border border-[#E2E8F0]/60 p-5 rounded-xl space-y-3">
                    <strong className="text-indigo-300 text-xs uppercase font-bold block">Adaptaciones de Aprendizaje</strong>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs leading-relaxed">
                      <div className="border-l-2 border-emerald-500 pl-3">
                        <span className="font-semibold text-emerald-450 block mb-0.5">Adaptación DUA 1</span>
                        {planning.content.utp_documentation?.learning_adaptations.dua_1}
                      </div>
                      <div className="border-l-2 border-amber-500 pl-3">
                        <span className="font-semibold text-amber-405 block mb-0.5">Adaptación DUA 2</span>
                        {planning.content.utp_documentation?.learning_adaptations.dua_2}
                      </div>
                      <div className="border-l-2 border-rose-500 pl-3">
                        <span className="font-semibold text-rose-600 block mb-0.5">Adaptación DUA 3</span>
                        {planning.content.utp_documentation?.learning_adaptations.dua_3}
                      </div>
                    </div>
                  </div>

                  {/* Técnicas de Anclaje */}
                  <div className="bg-[#FAF9FC]/40 border border-[#E2E8F0]/60 p-5 rounded-xl space-y-3">
                    <strong className="text-indigo-300 text-xs uppercase font-bold block">Técnicas de Anclaje</strong>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs leading-relaxed">
                      <div>
                        <span className="font-semibold text-slate-800 block mb-0.5">• Apertura</span>
                        {planning.content.utp_documentation?.nlp_technique.opening}
                      </div>
                      <div>
                        <span className="font-semibold text-slate-800 block mb-0.5">• Pausa</span>
                        {planning.content.utp_documentation?.nlp_technique.pause}
                      </div>
                      <div>
                        <span className="font-semibold text-slate-800 block mb-0.5">• Cierre</span>
                        {planning.content.utp_documentation?.nlp_technique.closing}
                      </div>
                    </div>
                  </div>

                  {/* Rúbrica de Cierre */}
                  <div className="bg-[#FAF9FC]/40 border border-[#E2E8F0]/60 p-5 rounded-xl space-y-2">
                    <strong className="text-indigo-300 text-xs uppercase font-bold block">Rúbrica de Cierre</strong>
                    <p className="text-xs leading-relaxed">{planning.content.utp_documentation?.rubric_summary}</p>
                  </div>
                </div>
              </section>
            </div>
          )}
        </main>

        {/* Right Side: Chat Panel / Sidebar */}
        <aside
          className={`
            fixed lg:relative inset-y-0 right-0 z-50 lg:z-0
            w-[85vw] max-w-[380px] lg:w-[380px]
            bg-white/95 lg:bg-white backdrop-blur-xl lg:backdrop-blur-sm
            border-l lg:border border-[#E2E8F0]/70 lg:border-[#E2E8F0]/60 rounded-l-3xl lg:rounded-3xl
            p-5 flex flex-col gap-5 shadow-md lg:shadow-none
            transition-transform duration-300 ease-in-out
            ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full lg:hidden'}
          `}
        >
          {/* Sidebar Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-50 rounded-xl border border-indigo-150">
                <MessageSquare className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-xs font-extrabold text-slate-800">Ajustes con IA</h2>
                <p className="text-[9px] text-slate-600 font-medium">Personaliza tu planificación</p>
              </div>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-600 hover:text-slate-800 rounded-lg border border-[#E2E8F0]/70 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Sidebar Body */}
          <div className="flex-1 overflow-y-auto space-y-5 pr-1 custom-scrollbar">
            
            {/* Quick Action Buttons */}
            <div className="space-y-2">
              <h3 className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Acciones rápidas</h3>
              
              {/* Action 2: Complexity Level */}
              <div className="space-y-1">
                <button
                  onClick={() => setShowComplexityOptions(!showComplexityOptions)}
                  disabled={isAdjusting || pendingConfirmation !== null}
                  className={`w-full text-left inline-flex items-center justify-between p-3 bg-[#FAF9FC]/60 hover:bg-indigo-550 border ${showComplexityOptions ? 'border-indigo-500/30 text-indigo-600 bg-indigo-50/50' : 'border-[#E2E8F0]/70 text-slate-700 hover:text-indigo-300 hover:border-indigo-150'} rounded-xl text-xs font-semibold transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none`}
                >
                  <div className="flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-indigo-600" />
                    <span>Ajustar nivel de complejidad</span>
                  </div>
                  {showComplexityOptions ? (
                    <ChevronUp className="w-3.5 h-3.5 text-indigo-600" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-600" />
                  )}
                </button>

                {showComplexityOptions && (
                  <div className="grid grid-cols-2 gap-2 pl-2">
                    <button
                      onClick={() => handleSendInstruction("Ajustar nivel de complejidad: Subir complejidad de las actividades y vocabulario para desafiar a los alumnos")}
                      disabled={isAdjusting || pendingConfirmation !== null}
                      className="inline-flex items-center justify-center gap-1 py-1.5 px-2 bg-[#FAF9FC] hover:bg-emerald-50/50 border border-[#E2E8F0]/70 hover:border-emerald-100 text-[9px] font-bold text-slate-700 hover:text-emerald-300 rounded-lg transition-all"
                    >
                      <ArrowUp className="w-2.5 h-2.5" />
                      Subir nivel
                    </button>
                    <button
                      onClick={() => handleSendInstruction("Ajustar nivel de complejidad: Bajar complejidad de las actividades y simplificar vocabulario para andamiaje adicional")}
                      disabled={isAdjusting || pendingConfirmation !== null}
                      className="inline-flex items-center justify-center gap-1 py-1.5 px-2 bg-[#FAF9FC] hover:bg-amber-50/50 border border-[#E2E8F0]/70 hover:border-amber-100 text-[9px] font-bold text-slate-700 hover:text-amber-300 rounded-lg transition-all"
                    >
                      <ArrowDown className="w-2.5 h-2.5" />
                      Bajar nivel
                    </button>
                  </div>
                )}
              </div>

              {/* Action 4: Sesión breve para registrar en libro */}
              <div className="space-y-2">
                <button
                  onClick={handleGenerateBriefLog}
                  disabled={isGeneratingBriefLog || isAdjusting || pendingConfirmation !== null}
                  className="w-full text-left inline-flex items-center justify-between p-3 bg-[#FAF9FC]/60 hover:bg-indigo-50 border border-[#E2E8F0]/70 hover:border-indigo-150 rounded-xl text-xs font-semibold text-slate-700 hover:text-indigo-300 transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none group"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    <span>{isGeneratingBriefLog ? 'Generando...' : 'Sesión breve para registrar en libro'}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:translate-x-0.5 transition-transform" />
                </button>

                {briefLogText && (
                  <div className="p-3 bg-[#FAF9FC] border border-indigo-100 rounded-xl space-y-2">
                    <div className="flex justify-between items-center pb-1.5 border-b border-slate-100">
                      <span className="text-[9px] font-bold text-indigo-600 uppercase">Registro de Libro</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(briefLogText);
                          alert('¡Copiado al portapapeles!');
                        }}
                        className="text-[8px] font-extrabold text-indigo-600 hover:text-indigo-700 underline"
                      >
                        Copiar texto
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-755 whitespace-pre-line leading-relaxed italic font-medium">
                      {briefLogText}
                    </p>
                  </div>
                )}

                {briefLogError && (
                  <p className="text-[9px] text-rose-500 font-medium pl-1">{briefLogError}</p>
                )}
              </div>
            </div>

            {/* Error Message */}
            {adjustmentError && (
              <div className="p-3 bg-rose-950/20 border border-rose-900/30 text-rose-200 rounded-xl flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <h4 className="text-[10px] font-bold text-rose-305">Ocurrió un error</h4>
                  <p className="text-[9px] text-slate-700 leading-normal">{adjustmentError}</p>
                </div>
              </div>
            )}

            {/* Curricular Warning & Confirmation */}
            {pendingConfirmation && (
              <div className="p-3 bg-amber-950/30 border border-amber-900/40 text-amber-250 rounded-xl flex flex-col gap-2.5">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="text-[10px] font-bold text-amber-300">Riesgo de desalineación curricular</h4>
                    <p className="text-[9.5px] text-slate-700 leading-relaxed whitespace-pre-line">
                      {pendingConfirmation.warning}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 justify-end pt-1 border-t border-amber-100">
                  <button
                    onClick={() => {
                      setPendingConfirmation(null);
                    }}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-750 text-slate-700 rounded text-[9px] font-bold transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => {
                      handleSendInstruction(pendingConfirmation.instruction, true);
                    }}
                    className="px-2.5 py-1 bg-amber-600 hover:bg-amber-550 text-white rounded text-[9px] font-bold transition-colors shadow-lg shadow-amber-600/10"
                  >
                    Sí, aplícalo igual
                  </button>
                </div>
              </div>
            )}

            {/* Textarea Input Form */}
            <div className="space-y-2">
              <h3 className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Ajuste libre</h3>
              <div className="bg-[#FAF9FC]/60 border border-[#E2E8F0]/70 rounded-2xl p-2.5 flex flex-col gap-2 focus-within:border-indigo-500/40 transition-colors">
                <textarea
                  value={chatInstruction}
                  onChange={(e) => setChatInstruction(e.target.value)}
                  placeholder="¿Qué quieres ajustar? (Ej: agrega un ticket de salida de 3 minutos...)"
                  disabled={isAdjusting || pendingConfirmation !== null}
                  className="w-full bg-transparent resize-none text-[11px] text-slate-800 placeholder-slate-500 focus:outline-none min-h-[60px] custom-scrollbar leading-relaxed"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (!isAdjusting && pendingConfirmation === null) {
                        handleSendInstruction(chatInstruction);
                      }
                    }
                  }}
                />
                <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                  <span className="text-[8px] text-slate-600">Presiona Enter para enviar</span>
                  <button
                    onClick={() => handleSendInstruction(chatInstruction)}
                    disabled={isAdjusting || pendingConfirmation !== null || !chatInstruction.trim()}
                    className="p-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white disabled:text-slate-600 rounded-lg transition-colors flex items-center justify-center shadow-lg shadow-indigo-600/10"
                  >
                    <Send className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* Session History */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-slate-450">
                <History className="w-3.5 h-3.5" />
                <h3 className="text-[10px] font-bold uppercase tracking-wider">Historial de cambios</h3>
              </div>
              {sessionHistory.length === 0 ? (
                <p className="text-[9px] text-slate-600 italic pl-1">Aún no has realizado cambios en esta sesión.</p>
              ) : (
                <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-0.5 custom-scrollbar">
                  {sessionHistory.map((item) => (
                    <div key={item.id} className="p-2 bg-[#FAF9FC]/40 border border-slate-100 rounded-xl flex flex-col gap-0.5">
                      <div className="flex justify-between items-center">
                        <span className="text-[8px] text-slate-600 font-medium">
                          {item.timestamp.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="px-1 py-0.2 bg-indigo-50 text-indigo-600 text-[8px] rounded">
                          Aplicado
                        </span>
                      </div>
                      <p className="text-[9.5px] text-slate-600 line-clamp-2 italic leading-relaxed">
                        "{item.request}"
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </aside>

      </div>

      {/* Floating Action Button (FAB) on mobile when sidebar is closed */}
      {!isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="fixed bottom-6 right-6 p-4 bg-indigo-600 hover:bg-indigo-550 rounded-full shadow-md border border-indigo-400/20 z-40 text-white flex items-center justify-center transition-all duration-300 hover:scale-105"
          title="Abrir panel de ajustes"
        >
          <MessageSquare className="w-6 h-6 animate-pulse" />
        </button>
      )}

      {/* Visual Resource Prompt Generator Modal */}
      {isPromptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 space-y-6 relative animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-violet-600" /> Generador de Prompts para Presentaciones
                </h2>
                <p className="text-xs text-slate-400">Diseña el prompt óptimo para tu recurso visual basándote en esta planificación.</p>
              </div>
              <button
                onClick={() => setIsPromptModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-650 hover:bg-slate-50 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Selectors */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">¿Qué tipo de recurso quieres crear?</label>
                <select
                  value={promptTipo}
                  onChange={(e) => setPromptTipo(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200/70 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-violet-600 font-semibold"
                >
                  <option value="Diapositivas">Diapositivas</option>
                  <option value="Línea de tiempo">Línea de tiempo</option>
                  <option value="Flashcards">Flashcards</option>
                  <option value="Póster">Póster</option>
                  <option value="Afiche">Afiche</option>
                  <option value="Infografía">Infografía</option>
                  <option value="Organizador visual">Organizador visual</option>
                  <option value="Cómic">Cómic</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Herramienta de destino</label>
                <select
                  value={promptDestino}
                  onChange={(e) => setPromptDestino(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200/70 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-violet-600 font-semibold"
                >
                  <option value="ChatGPT">ChatGPT</option>
                  <option value="Canva">Canva</option>
                  <option value="NotebookLM">NotebookLM</option>
                  <option value="Gamma">Gamma</option>
                </select>
              </div>
            </div>

            {/* Generate Action Button */}
            <button
              onClick={handleGeneratePrompt}
              disabled={isGeneratingPrompt}
              className="w-full py-3 bg-gradient-to-r from-violet-600 via-purple-600 to-pink-500 hover:from-violet-750 hover:to-pink-600 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all duration-300 shadow-md shadow-violet-600/10 active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isGeneratingPrompt ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generando Prompt y Dirección Creativa...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generar Prompt</span>
                </>
              )}
            </button>

            {/* Result box */}
            {generatedPromptText && (
              <div className="space-y-4 pt-4 border-t border-slate-100 animate-in fade-in duration-200">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Prompt Optimizado</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generatedPromptText);
                      setCopiedPrompt(true);
                      setTimeout(() => setCopiedPrompt(false), 2000);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 text-violet-700 hover:bg-violet-100 rounded-lg text-xs font-bold transition-all"
                  >
                    {copiedPrompt ? "¡Copiado!" : "Copiar prompt"}
                  </button>
                </div>

                <div className="relative">
                  <textarea
                    readOnly
                    value={generatedPromptText}
                    className="w-full h-64 bg-slate-50 border border-slate-150 rounded-2xl p-4 text-xs font-mono text-slate-700 focus:outline-none resize-none leading-relaxed"
                  />
                </div>

                {/* Quick links */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Acceso Directo a la Herramienta:</span>
                  <div className="flex flex-wrap gap-2">
                    {promptDestino === 'Canva' && (
                      <a
                        href="https://canva.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-sky-50 border border-sky-150 hover:bg-sky-100 text-sky-700 text-xs font-bold rounded-xl transition-all"
                      >
                        Abrir Canva <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {promptDestino === 'Gamma' && (
                      <a
                        href="https://gamma.app"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-rose-50 border border-rose-150 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl transition-all"
                      >
                        Abrir Gamma <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {promptDestino === 'NotebookLM' && (
                      <a
                        href="https://notebooklm.google.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-teal-50 border border-teal-150 hover:bg-teal-100 text-teal-750 text-xs font-bold rounded-xl transition-all"
                      >
                        Abrir NotebookLM <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {promptDestino === 'ChatGPT' && (
                      <a
                        href="https://chatgpt.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-50 border border-emerald-150 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl transition-all"
                      >
                        Abrir ChatGPT <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
