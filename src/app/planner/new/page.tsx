'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  Sparkles,
  ArrowLeft,
  BookOpen,
  GraduationCap,
  FileText,
  Link as LinkIcon,
  ChevronRight,
  Loader2,
  FileCode2,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  BookMarked,
  Shield,
  Download,
  Printer,
  Sparkle,
  Lock,
  Zap,
  X,
  Presentation,
  Clock,
  CreditCard,
  Megaphone,
  GitCommit,
  Tv,
  Copy,
  Check,
  ExternalLink,
  Info
} from 'lucide-react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';

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

// ─── Interfaces ──────────────────────────────────────────────────────────────

interface Indicador {
  id: number;
  texto: string;
}

interface ObjetivoAprendizaje {
  id: number;
  codigo: string;
  texto: string;
  tipo: string;
  indicadores_evaluacion: Indicador[];
}

interface Eje {
  id: number;
  nombre: string;
  descripcion: string | null;
  objetivos_aprendizaje: ObjetivoAprendizaje[];
}

interface HorarioDia {
  dia_semana: string;
  n_bloques: number;
  tipo_bloque: string;
}

interface Curso {
  id: string;
  nombre: string;
  nivel: string;
  seccion: string | null;
  horario: HorarioDia[];
}

type PlanningScope = 'clase' | 'semana';

const LOADING_STEPS = [
  'Analizando datos de la asignatura y nivel...',
  'Procesando material de referencia...',
  'Diseñando secuencia de aprendizaje inverso (Backward Design)...',
  'Generando adaptaciones DUA (Universal Design)...',
  'Estructurando niveles de apoyo diferenciados...',
  'Agregando mecánicas de gamificación del aula...',
  'Integrando anclajes de PNL para motivación...',
  'Calculando nivel de lectura estimado y alertas de adecuación...',
  'Finalizando y guardando planificación...',
];

const CURRICULUM_SUBJECT = 'Lenguaje y Comunicación';

// Comprehensive local fallback catalog for 5° Básico to 2° Medio, Unidad 1 to 4
const FALLBACK_CATALOG: Record<string, Record<string, Array<{ titulo: string; oa_codes: string[]; isReal?: boolean; oa_basales?: string[]; oa_complementarios?: string[] }>>> = {
  '5° Básico': {
    'Unidad 1': [
      { 
        titulo: 'Lección 1: Fútbol y trabajo en equipo', 
        oa_codes: ['OA 1', 'OA 3', 'OA 4', 'OA 6', 'OA 7', 'OA 9', 'OA 2', 'OA 12'],
        isReal: true,
        oa_basales: ['OA 1', 'OA 3', 'OA 4', 'OA 6', 'OA 7', 'OA 9'],
        oa_complementarios: ['OA 2', 'OA 12']
      },
      { 
        titulo: 'Lección 2: Jugar como niña', 
        oa_codes: ['OA 6', 'OA 7', 'OA 24', 'OA 26', 'OA 12'],
        isReal: true,
        oa_basales: ['OA 6', 'OA 7', 'OA 24', 'OA 26'],
        oa_complementarios: ['OA 12']
      },
      { 
        titulo: 'Lección 3: Deporte y perseverancia', 
        oa_codes: ['OA 4', 'OA 11', 'OA 15', 'OA 17', 'OA 18', 'OA 12'],
        isReal: true,
        oa_basales: ['OA 4', 'OA 11', 'OA 15', 'OA 17', 'OA 18'],
        oa_complementarios: ['OA 12']
      }
    ],
    'Unidad 2': [
      { 
        titulo: 'Lección 4: Emociones en verso', 
        oa_codes: ['OA 1', 'OA 3', 'OA 5', 'OA 6', 'OA 7', 'OA 9', 'OA 24', 'OA 26', 'OA 2', 'OA 8', 'OA 12', 'OA 27'],
        isReal: true,
        oa_basales: ['OA 1', 'OA 3', 'OA 5', 'OA 6', 'OA 7', 'OA 9', 'OA 24', 'OA 26'],
        oa_complementarios: ['OA 2', 'OA 8', 'OA 12', 'OA 27']
      },
      { 
        titulo: 'Lección 5: Narrar para no olvidar', 
        oa_codes: ['OA 1', 'OA 3', 'OA 4', 'OA 6', 'OA 7', 'OA 14', 'OA 17', 'OA 18', 'OA 2', 'OA 8', 'OA 13'],
        isReal: true,
        oa_basales: ['OA 1', 'OA 3', 'OA 4', 'OA 6', 'OA 7', 'OA 14', 'OA 17', 'OA 18'],
        oa_complementarios: ['OA 2', 'OA 8', 'OA 13']
      },
      { 
        titulo: 'Lección 6: Vientos que arrasan', 
        oa_codes: ['OA 1', 'OA 2', 'OA 3', 'OA 4', 'OA 6', 'OA 7', 'OA 8', 'OA 16'],
        isReal: true,
        oa_basales: ['OA 1', 'OA 2', 'OA 3', 'OA 4', 'OA 6', 'OA 7'],
        oa_complementarios: ['OA 2', 'OA 8', 'OA 16']
      }
    ],
    'Unidad 3': [
      { 
        titulo: 'Lección 7: Coexistir en armonía', 
        oa_codes: ['OA 1', 'OA 2', 'OA 3', 'OA 4', 'OA 5', 'OA 9', 'OA 12'],
        isReal: true,
        oa_basales: ['OA 1', 'OA 2', 'OA 3', 'OA 4', 'OA 5', 'OA 9'],
        oa_complementarios: ['OA 2', 'OA 12']
      },
      { 
        titulo: 'Lección 8: Guardianes de la naturaleza', 
        oa_codes: ['OA 1', 'OA 2', 'OA 3', 'OA 4', 'OA 9', 'OA 24', 'OA 26', 'OA 12', 'OA 25', 'OA 27', 'OA 28'],
        isReal: true,
        oa_basales: ['OA 1', 'OA 2', 'OA 3', 'OA 4', 'OA 9', 'OA 24', 'OA 26'],
        oa_complementarios: ['OA 2', 'OA 12', 'OA 25', 'OA 27', 'OA 28']
      },
      { 
        titulo: 'Lección 9: Pueblos Originarios: Espíritu Verde', 
        oa_codes: ['OA 1', 'OA 2', 'OA 3', 'OA 6', 'OA 7', 'OA 9', 'OA 14', 'OA 17', 'OA 18', 'OA 8', 'OA 12'],
        isReal: true,
        oa_basales: ['OA 1', 'OA 2', 'OA 3', 'OA 6', 'OA 7', 'OA 9', 'OA 14', 'OA 17', 'OA 18'],
        oa_complementarios: ['OA 2', 'OA 8', 'OA 12']
      }
    ],
    'Unidad 4': [
      { 
        titulo: 'Lección 10: Viajar para volver a empezar', 
        oa_codes: ['OA 1', 'OA 3', 'OA 4', 'OA 9', 'OA 15', 'OA 17', 'OA 18', 'OA 2', 'OA 8', 'OA 12', 'OA 13', 'OA 16', 'OA 22'],
        isReal: true,
        oa_basales: ['OA 1', 'OA 3', 'OA 4', 'OA 9', 'OA 15', 'OA 17', 'OA 18'],
        oa_complementarios: ['OA 2', 'OA 8', 'OA 12', 'OA 13', 'OA 16', 'OA 22']
      },
      { 
        titulo: 'Lección 11: Viajes migratorios', 
        oa_codes: ['OA 1', 'OA 3', 'OA 4', 'OA 6', 'OA 7', 'OA 9', 'OA 11', 'OA 28', 'OA 2', 'OA 12'],
        isReal: true,
        oa_basales: ['OA 1', 'OA 3', 'OA 4', 'OA 6', 'OA 7', 'OA 9', 'OA 11', 'OA 28'],
        oa_complementarios: ['OA 2', 'OA 12']
      }
    ]
  },
  '6° Básico': {
    'Unidad 1': [
      {
        titulo: 'Lección 1: Juegos e imaginación',
        oa_codes: ['OA 1', 'OA 3', 'OA 4', 'OA 6', 'OA 7', 'OA 27', 'OA 2', 'OA 12', 'OA 13'],
        isReal: true,
        oa_basales: ['OA 1', 'OA 3', 'OA 4', 'OA 6', 'OA 7', 'OA 27'],
        oa_complementarios: ['OA 2', 'OA 12', 'OA 13']
      },
      {
        titulo: 'Lección 2: Creatividad e innovación',
        oa_codes: ['OA 1', 'OA 6', 'OA 7', 'OA 24', 'OA 27', 'OA 12', 'OA 13'],
        isReal: true,
        oa_basales: ['OA 1', 'OA 6', 'OA 7', 'OA 24', 'OA 27'],
        oa_complementarios: ['OA 12', 'OA 13']
      },
      {
        titulo: 'Lección 3: Aventuras y viajes en el tiempo',
        oa_codes: ['OA 1', 'OA 3', 'OA 4', 'OA 7', 'OA 14', 'OA 27', 'OA 2', 'OA 13', 'OA 19'],
        isReal: true,
        oa_basales: ['OA 1', 'OA 3', 'OA 4', 'OA 7', 'OA 14', 'OA 27'],
        oa_complementarios: ['OA 2', 'OA 13', 'OA 19']
      }
    ],
    'Unidad 2': [
      {
        titulo: 'Lección 4: El ser humano y la naturaleza',
        oa_codes: ['OA 1', 'OA 3', 'OA 4', 'OA 5', 'OA 6', 'OA 7', 'OA 27', 'OA 2', 'OA 12', 'OA 13'],
        isReal: true,
        oa_basales: ['OA 1', 'OA 3', 'OA 4', 'OA 5', 'OA 6', 'OA 7', 'OA 27'],
        oa_complementarios: ['OA 2', 'OA 12', 'OA 13']
      },
      {
        titulo: 'Lección 5: La conservación de la biodiversidad',
        oa_codes: ['OA 6', 'OA 7', 'OA 11', 'OA 24', 'OA 27', 'OA 29', 'OA 8', 'OA 10', 'OA 13', 'OA 17', 'OA 20'],
        isReal: true,
        oa_basales: ['OA 6', 'OA 7', 'OA 11', 'OA 24', 'OA 27', 'OA 29'],
        oa_complementarios: ['OA 8', 'OA 10', 'OA 13', 'OA 17', 'OA 20']
      },
      {
        titulo: 'Lección 6: Conectándonos con la naturaleza',
        oa_codes: ['OA 1', 'OA 3', 'OA 5', 'OA 6', 'OA 7', 'OA 11', 'OA 15', 'OA 18', 'OA 27', 'OA 2', 'OA 8', 'OA 12', 'OA 16'],
        isReal: true,
        oa_basales: ['OA 1', 'OA 3', 'OA 5', 'OA 6', 'OA 7', 'OA 11', 'OA 15', 'OA 18', 'OA 27'],
        oa_complementarios: ['OA 2', 'OA 8', 'OA 12', 'OA 16']
      }
    ],
    'Unidad 3': [
      {
        titulo: 'Lección 7: Investigando el universo',
        oa_codes: ['OA 1', 'OA 3', 'OA 4', 'OA 6', 'OA 7', 'OA 27', 'OA 2', 'OA 8', 'OA 12', 'OA 13'],
        isReal: true,
        oa_basales: ['OA 1', 'OA 3', 'OA 4', 'OA 6', 'OA 7', 'OA 27'],
        oa_complementarios: ['OA 2', 'OA 8', 'OA 12', 'OA 13']
      },
      {
        titulo: 'Lección 8: Distintas creencias sobre el cielo',
        oa_codes: ['OA 1', 'OA 6', 'OA 7', 'OA 24', 'OA 27', 'OA 12', 'OA 13'],
        isReal: true,
        oa_basales: ['OA 1', 'OA 6', 'OA 7', 'OA 24', 'OA 27'],
        oa_complementarios: ['OA 12', 'OA 13']
      },
      {
        titulo: 'Lección 9: Historias de vida',
        oa_codes: ['OA 1', 'OA 3', 'OA 4', 'OA 7', 'OA 11', 'OA 14', 'OA 24', 'OA 27', 'OA 2', 'OA 13', 'OA 19', 'OA 23'],
        isReal: true,
        oa_basales: ['OA 1', 'OA 3', 'OA 4', 'OA 7', 'OA 11', 'OA 14', 'OA 24', 'OA 27'],
        oa_complementarios: ['OA 2', 'OA 13', 'OA 19', 'OA 23']
      }
    ],
    'Unidad 4': [
      {
        titulo: 'Lección 10: Somos iguales',
        oa_codes: ['OA 1', 'OA 3', 'OA 4', 'OA 7', 'OA 27', 'OA 2', 'OA 12', 'OA 13'],
        isReal: true,
        oa_basales: ['OA 1', 'OA 3', 'OA 4', 'OA 7', 'OA 27'],
        oa_complementarios: ['OA 2', 'OA 12', 'OA 13']
      },
      {
        titulo: 'Lección 11: Mujeres activistas',
        oa_codes: ['OA 1', 'OA 6', 'OA 7', 'OA 11', 'OA 18', 'OA 24', 'OA 27', 'OA 8', 'OA 10', 'OA 12', 'OA 13', 'OA 17', 'OA 20'],
        isReal: true,
        oa_basales: ['OA 1', 'OA 6', 'OA 7', 'OA 11', 'OA 18', 'OA 24', 'OA 27'],
        oa_complementarios: ['OA 8', 'OA 10', 'OA 12', 'OA 13', 'OA 17', 'OA 20']
      }
    ]
  },
  '7° Básico': {
    'Unidad 1': [
      {
        titulo: 'Lección 1: Tener un amigo',
        oa_codes: ['OA 3', 'OA 7', 'OA 9', 'OA 20', 'OA 21', 'OA 11'],
        isReal: true,
        oa_basales: ['OA 3', 'OA 7', 'OA 9', 'OA 20', 'OA 21'],
        oa_complementarios: ['OA 11']
      },
      {
        titulo: 'Lección 2: Confiar y compartir',
        oa_codes: ['OA 3', 'OA 7', 'OA 9', 'OA 20', 'OA 21', 'OA 11'],
        isReal: true,
        oa_basales: ['OA 3', 'OA 7', 'OA 9', 'OA 20', 'OA 21'],
        oa_complementarios: ['OA 11']
      },
      {
        titulo: 'Lección 3: Expresar mi interior',
        oa_codes: ['OA 7', 'OA 14', 'OA 24', 'OA 4', 'OA 10', 'OA 25'],
        isReal: true,
        oa_basales: ['OA 7', 'OA 14', 'OA 24'],
        oa_complementarios: ['OA 4', 'OA 10', 'OA 25']
      },
      {
        titulo: 'Lección 4: Trabajar por mis metas',
        oa_codes: ['OA 9', 'OA 21', 'OA 13', 'OA 15', 'OA 16'],
        isReal: true,
        oa_basales: ['OA 9', 'OA 21'],
        oa_complementarios: ['OA 13', 'OA 15', 'OA 16']
      }
    ],
    'Unidad 2': [
      {
        titulo: 'Lección 1: Respetando mis derechos y los tuyos',
        oa_codes: ['OA 3', 'OA 7', 'OA 9', 'OA 21', 'OA 11'],
        isReal: true,
        oa_basales: ['OA 3', 'OA 7', 'OA 9', 'OA 21'],
        oa_complementarios: ['OA 11']
      },
      {
        titulo: 'Lección 2: Con todos los sentimientos',
        oa_codes: ['OA 10', 'OA 11'],
        isReal: true,
        oa_basales: [],
        oa_complementarios: ['OA 10', 'OA 11']
      },
      {
        titulo: 'Lección 3: Conociendo relatos ancestrales',
        oa_codes: ['OA 3', 'OA 24', 'OA 25'],
        isReal: true,
        oa_basales: ['OA 3', 'OA 24'],
        oa_complementarios: ['OA 25']
      },
      {
        titulo: 'Lección 4: Apoyándonos mutuamente',
        oa_codes: ['OA 8', 'OA 14', 'OA 15'],
        isReal: true,
        oa_basales: ['OA 8', 'OA 14'],
        oa_complementarios: ['OA 15']
      }
    ],
    'Unidad 3': [
      {
        titulo: 'Lección 1: Con el océano y sus habitantes',
        oa_codes: ['OA 3', 'OA 7', 'OA 20', 'OA 2'],
        isReal: true,
        oa_basales: ['OA 3', 'OA 7', 'OA 20'],
        oa_complementarios: ['OA 2']
      },
      {
        titulo: 'Lección 2: En nuevos territorios',
        oa_codes: ['OA 3', 'OA 7', 'OA 21', 'OA 11'],
        isReal: true,
        oa_basales: ['OA 3', 'OA 7', 'OA 21'],
        oa_complementarios: ['OA 11']
      },
      {
        titulo: 'Lección 3: En la creación literaria',
        oa_codes: ['OA 7', 'OA 24', 'OA 4', 'OA 10', 'OA 25'],
        isReal: true,
        oa_basales: ['OA 7', 'OA 24'],
        oa_complementarios: ['OA 4', 'OA 10', 'OA 25']
      },
      {
        titulo: 'Lección 4: Protegiendo los espacios naturales',
        oa_codes: ['OA 9', 'OA 14', 'OA 15', 'OA 17'],
        isReal: true,
        oa_basales: ['OA 9', 'OA 14'],
        oa_complementarios: ['OA 15', 'OA 17']
      }
    ],
    'Unidad 4': [
      {
        titulo: 'Lección 1: Historias del pasado',
        oa_codes: ['OA 7', 'OA 21', 'OA 2', 'OA 4', 'OA 5', 'OA 11'],
        isReal: true,
        oa_basales: ['OA 7', 'OA 21'],
        oa_complementarios: ['OA 2', 'OA 4', 'OA 5', 'OA 11']
      },
      {
        titulo: 'Lección 2: La visión popular',
        oa_codes: ['OA 24', 'OA 2', 'OA 5', 'OA 10', 'OA 25'],
        isReal: true,
        oa_basales: ['OA 24'],
        oa_complementarios: ['OA 2', 'OA 5', 'OA 10', 'OA 25']
      },
      {
        titulo: 'Lección 3: Mentiras y verdades',
        oa_codes: ['OA 9', 'OA 21', 'OA 20'],
        isReal: true,
        oa_basales: ['OA 9', 'OA 21'],
        oa_complementarios: ['OA 20']
      },
      {
        titulo: 'Lección 4: Representaciones de vida',
        oa_codes: ['OA 8', 'OA 9', 'OA 21', 'OA 17', 'OA 19', 'OA 22'],
        isReal: true,
        oa_basales: ['OA 8', 'OA 9', 'OA 21'],
        oa_complementarios: ['OA 17', 'OA 19', 'OA 22']
      }
    ]
  },
  '8° Básico': {
    'Unidad 1': [
      {
        titulo: 'Lección 1: En un instante mágico',
        oa_codes: ['OA 2', 'OA 3', 'OA 8', 'OA 11', 'OA 12', 'OA 13'],
        isReal: true,
        oa_basales: ['OA 2', 'OA 3', 'OA 8', 'OA 11', 'OA 12', 'OA 13'],
        oa_complementarios: []
      },
      {
        titulo: 'Lección 2: En un rincón cotidiano',
        oa_codes: ['OA 2', 'OA 3', 'OA 8', 'OA 11', 'OA 12', 'OA 22'],
        isReal: true,
        oa_basales: ['OA 2', 'OA 3', 'OA 8', 'OA 11', 'OA 12', 'OA 22'],
        oa_complementarios: []
      },
      {
        titulo: 'Lección 3: Poemas (lección de investigación)',
        oa_codes: ['OA 4', 'OA 8', 'OA 25', 'OA 26'],
        isReal: true,
        oa_basales: ['OA 4', 'OA 8', 'OA 25', 'OA 26'],
        oa_complementarios: []
      },
      {
        titulo: 'Lección 4: Entrevista a Elisa Avendaño',
        oa_codes: ['OA 10', 'OA 14', 'OA 16', 'OA 18', 'OA 21'],
        isReal: true,
        oa_basales: ['OA 10', 'OA 14', 'OA 16', 'OA 18', 'OA 21'],
        oa_complementarios: []
      }
    ],
    'Unidad 2': [
      {
        titulo: 'Lección 1: Lo que no queremos ver',
        oa_codes: ['OA 2', 'OA 5', 'OA 7', 'OA 8', 'OA 12'],
        isReal: true,
        oa_basales: ['OA 2', 'OA 5', 'OA 7', 'OA 8', 'OA 12'],
        oa_complementarios: []
      },
      {
        titulo: 'Lección 2: Lo que debemos descifrar',
        oa_codes: ['OA 2', 'OA 3', 'OA 8', 'OA 11', 'OA 12', 'OA 13'],
        isReal: true,
        oa_basales: ['OA 2', 'OA 3', 'OA 8', 'OA 11', 'OA 12', 'OA 13'],
        oa_complementarios: []
      },
      {
        titulo: 'Lección 3: Lo que vemos distinto (lección de investigación)',
        oa_codes: ['OA 8', 'OA 23', 'OA 25', 'OA 26'],
        isReal: true,
        oa_basales: ['OA 8', 'OA 23', 'OA 25', 'OA 26'],
        oa_complementarios: []
      },
      {
        titulo: 'Lección 4: Lo que nos quieren hacer creer',
        oa_codes: ['OA 9', 'OA 15', 'OA 16', 'OA 22'],
        isReal: true,
        oa_basales: ['OA 9', 'OA 15', 'OA 16', 'OA 22'],
        oa_complementarios: []
      }
    ],
    'Unidad 3': [
      {
        titulo: 'Lección 1: Aventuras que atraviesan el tiempo',
        oa_codes: ['OA 2', 'OA 3', 'OA 6', 'OA 12', 'OA 23'],
        isReal: true,
        oa_basales: ['OA 2', 'OA 3', 'OA 6', 'OA 12', 'OA 23'],
        oa_complementarios: []
      },
      {
        titulo: 'Lección 2: Heroísmos revisitados (lección de investigación)',
        oa_codes: ['OA 6', 'OA 14', 'OA 21', 'OA 25', 'OA 26'],
        isReal: true,
        oa_basales: ['OA 6', 'OA 14', 'OA 21', 'OA 25', 'OA 26'],
        oa_complementarios: []
      },
      {
        titulo: 'Lección 3: Historias de vidas y de pueblos',
        oa_codes: ['OA 2', 'OA 4', 'OA 8', 'OA 12', 'OA 24'],
        isReal: true,
        oa_basales: ['OA 2', 'OA 4', 'OA 8', 'OA 12', 'OA 24'],
        oa_complementarios: []
      },
      {
        titulo: 'Lección 4: Saberes ancestrales',
        oa_codes: ['OA 10', 'OA 14', 'OA 16', 'OA 20', 'OA 21', 'OA 22'],
        isReal: true,
        oa_basales: ['OA 10', 'OA 14', 'OA 16', 'OA 20', 'OA 21', 'OA 22'],
        oa_complementarios: []
      }
    ],
    'Unidad 4': [
      {
        titulo: 'Lección 1: Hacia un mundo distópico',
        oa_codes: ['OA 2', 'OA 3', 'OA 8', 'OA 22'],
        isReal: true,
        oa_basales: ['OA 2', 'OA 3', 'OA 8', 'OA 22'],
        oa_complementarios: []
      },
      {
        titulo: 'Lección 2: Más allá de lo imaginado (lección de investigación)',
        oa_codes: ['OA 2', 'OA 8', 'OA 25', 'OA 26'],
        isReal: true,
        oa_basales: ['OA 2', 'OA 8', 'OA 25', 'OA 26'],
        oa_complementarios: []
      },
      {
        titulo: 'Lección 3: A donde anhelamos llegar',
        oa_codes: ['OA 2', 'OA 3', 'OA 8', 'OA 12', 'OA 13'],
        isReal: true,
        oa_basales: ['OA 2', 'OA 3', 'OA 8', 'OA 12', 'OA 13'],
        oa_complementarios: []
      },
      {
        titulo: 'Lección 4: Construir un tiempo mejor',
        oa_codes: ['OA 9', 'OA 15', 'OA 16', 'OA 22'],
        isReal: true,
        oa_basales: ['OA 9', 'OA 15', 'OA 16', 'OA 22'],
        oa_complementarios: []
      }
    ]
  },
  '1° Medio': {
    'Unidad 1': [
      {
        titulo: 'Lección 1: En la naturaleza',
        oa_codes: ['OA 9', 'OA 21', 'OA 11'],
        isReal: true,
        oa_basales: ['OA 9', 'OA 21'],
        oa_complementarios: ['OA 11']
      },
      {
        titulo: 'Lección 2: En la ciudad',
        oa_codes: ['OA 3', 'OA 8', 'OA 12', 'OA 11'],
        isReal: true,
        oa_basales: ['OA 3', 'OA 8', 'OA 12'],
        oa_complementarios: ['OA 11']
      },
      {
        titulo: 'Lección 3: En el camino de las soluciones',
        oa_codes: ['OA 10', 'OA 15'],
        isReal: true,
        oa_basales: ['OA 10', 'OA 15'],
        oa_complementarios: []
      },
      {
        titulo: 'Lección 4: En lugares imaginarios',
        oa_codes: ['OA 12', 'OA 21', 'OA 24'],
        isReal: true,
        oa_basales: ['OA 12', 'OA 21', 'OA 24'],
        oa_complementarios: []
      },
      {
        titulo: 'Lección 5: En el camino de las redes',
        oa_codes: ['OA 12', 'OA 15', 'OA 17', 'OA 19'],
        isReal: true,
        oa_basales: ['OA 12', 'OA 15', 'OA 17', 'OA 19'],
        oa_complementarios: []
      }
    ],
    'Unidad 2': [
      {
        titulo: 'Lección 1: El viaje personal',
        oa_codes: ['OA 5', 'OA 21', 'OA 6', 'OA 11'],
        isReal: true,
        oa_basales: ['OA 5', 'OA 21'],
        oa_complementarios: ['OA 6', 'OA 11']
      },
      {
        titulo: 'Lección 2: La necesidad de movernos',
        oa_codes: ['OA 10', 'OA 11'],
        isReal: true,
        oa_basales: ['OA 10', 'OA 11'],
        oa_complementarios: []
      },
      {
        titulo: 'Lección 3: Ir y venir',
        oa_codes: ['OA 8', 'OA 21', 'OA 4'],
        isReal: true,
        oa_basales: ['OA 8', 'OA 21'],
        oa_complementarios: ['OA 4']
      },
      {
        titulo: 'Lección 4: Idiomas en movimiento',
        oa_codes: ['OA 12', 'OA 21', 'OA 24'],
        isReal: true,
        oa_basales: ['OA 12', 'OA 21', 'OA 24'],
        oa_complementarios: []
      },
      {
        titulo: 'Lección 5: El futuro en movimiento',
        oa_codes: ['OA 9', 'OA 12', 'OA 14', 'OA 15', 'OA 21'],
        isReal: true,
        oa_basales: ['OA 9', 'OA 12', 'OA 14', 'OA 15', 'OA 21'],
        oa_complementarios: []
      }
    ],
    'Unidad 3': [
      {
        titulo: 'Lección 1: El don de la palabra',
        oa_codes: ['OA 3', 'OA 8', 'OA 21', 'OA 11', 'OA 22'],
        isReal: true,
        oa_basales: ['OA 3', 'OA 8', 'OA 21'],
        oa_complementarios: ['OA 11', 'OA 22']
      },
      {
        titulo: 'Lección 2: Todos somos narradores',
        oa_codes: ['OA 9'],
        isReal: true,
        oa_basales: ['OA 9'],
        oa_complementarios: []
      },
      {
        titulo: 'Lección 3: Una historia que nos mueva',
        oa_codes: ['OA 10', 'OA 21'],
        isReal: true,
        oa_basales: ['OA 10', 'OA 21'],
        oa_complementarios: []
      },
      {
        titulo: 'Lección 4: Narradores orales',
        oa_codes: ['OA 10', 'OA 24'],
        isReal: true,
        oa_basales: ['OA 10', 'OA 24'],
        oa_complementarios: []
      },
      {
        titulo: 'Lección 5: Narrarnos a nosotros mismos',
        oa_codes: ['OA 9', 'OA 12', 'OA 14', 'OA 15', 'OA 21'],
        isReal: true,
        oa_basales: ['OA 9', 'OA 12', 'OA 14', 'OA 15', 'OA 21'],
        oa_complementarios: []
      }
    ],
    'Unidad 4': [
      {
        titulo: 'Lección 1: Una mirada hacia el futuro',
        oa_codes: ['OA 3', 'OA 8', 'OA 21', 'OA 11'],
        isReal: true,
        oa_basales: ['OA 3', 'OA 8', 'OA 21'],
        oa_complementarios: ['OA 11']
      },
      {
        titulo: 'Lección 2: El futuro es hoy',
        oa_codes: ['OA 3', 'OA 8', 'OA 19', 'OA 21', 'OA 11'],
        isReal: true,
        oa_basales: ['OA 3', 'OA 8', 'OA 19', 'OA 21'],
        oa_complementarios: ['OA 11']
      },
      {
        titulo: 'Lección 3: Soluciones para el mañana',
        oa_codes: ['OA 10'],
        isReal: true,
        oa_basales: ['OA 10'],
        oa_complementarios: []
      },
      {
        titulo: 'Lección 4: El futuro de los saberes ancestrales',
        oa_codes: ['OA 12', 'OA 24'],
        isReal: true,
        oa_basales: ['OA 12', 'OA 24'],
        oa_complementarios: []
      },
      {
        titulo: 'Lección 5: El futuro posible',
        oa_codes: ['OA 9', 'OA 12', 'OA 14', 'OA 15'],
        isReal: true,
        oa_basales: ['OA 9', 'OA 12', 'OA 14', 'OA 15'],
        oa_complementarios: []
      }
    ]
  },
  '2° Medio': {
    'Unidad 1': [
      {
        titulo: 'Lección 1: El lugar de la partida',
        oa_codes: ['OA 8', 'OA 21', 'OA 24', 'OA 2', 'OA 4'],
        isReal: true,
        oa_basales: ['OA 8', 'OA 21', 'OA 24'],
        oa_complementarios: ['OA 2', 'OA 4']
      },
      {
        titulo: 'Lección 2: Viaje en el tiempo',
        oa_codes: ['OA 3', 'OA 8', 'OA 19', 'OA 2'],
        isReal: true,
        oa_basales: ['OA 3', 'OA 8', 'OA 19'],
        oa_complementarios: ['OA 2']
      },
      {
        titulo: 'Lección 3: El idioma que vas hablando',
        oa_codes: ['OA 24', 'OA 22'],
        isReal: true,
        oa_basales: ['OA 24'],
        oa_complementarios: ['OA 22']
      },
      {
        titulo: 'Lección 4: Caminos anchos y diversos',
        oa_codes: ['OA 9', 'OA 19', 'OA 20'],
        isReal: true,
        oa_basales: ['OA 9', 'OA 19'],
        oa_complementarios: ['OA 20']
      },
      {
        titulo: 'Lección 5: Registros de mi andar',
        oa_codes: ['OA 12', 'OA 15', 'OA 19'],
        isReal: true,
        oa_basales: ['OA 12', 'OA 15', 'OA 19'],
        oa_complementarios: []
      }
    ],
    'Unidad 2': [
      {
        titulo: 'Lección 1: ¿Cuándo actuar?',
        oa_codes: ['OA 5', 'OA 8', 'OA 12', 'OA 2'],
        isReal: true,
        oa_basales: ['OA 5', 'OA 8', 'OA 12'],
        oa_complementarios: ['OA 2']
      },
      {
        titulo: 'Lección 2: Intentando acercarnos',
        oa_codes: ['OA 3', 'OA 8', 'OA 2'],
        isReal: true,
        oa_basales: ['OA 3', 'OA 8'],
        oa_complementarios: ['OA 2']
      },
      {
        titulo: 'Lección 3: Desafíos de ayer y hoy',
        oa_codes: ['OA 8', 'OA 24', 'OA 2'],
        isReal: true,
        oa_basales: ['OA 8', 'OA 24'],
        oa_complementarios: ['OA 2']
      },
      {
        titulo: 'Lección 4: Acción frente a la urgencia',
        oa_codes: ['OA 10', 'OA 19', 'OA 21'],
        isReal: true,
        oa_basales: ['OA 10', 'OA 19', 'OA 21'],
        oa_complementarios: []
      },
      {
        titulo: 'Lección 5: Compromiso con el cambio',
        oa_codes: ['OA 15', 'OA 17', 'OA 19'],
        isReal: true,
        oa_basales: ['OA 15', 'OA 17', 'OA 19'],
        oa_complementarios: []
      }
    ],
    'Unidad 3': [
      {
        titulo: 'Lección 1: ¿Individuos o prójimos?',
        oa_codes: ['OA 9', 'OA 21', 'OA 2'],
        isReal: true,
        oa_basales: ['OA 9', 'OA 21'],
        oa_complementarios: ['OA 2']
      },
      {
        titulo: 'Lección 2: Búsquedas y encuentros',
        oa_codes: ['OA 3', 'OA 8', 'OA 19', 'OA 2'],
        isReal: true,
        oa_basales: ['OA 3', 'OA 8', 'OA 19'],
        oa_complementarios: ['OA 2']
      },
      {
        titulo: 'Lección 3: Nuestra convivencia',
        oa_codes: ['OA 14', 'OA 15', 'OA 19'],
        isReal: true,
        oa_basales: ['OA 14', 'OA 15', 'OA 19'],
        oa_complementarios: []
      },
      {
        titulo: 'Lección 4: Convivir desde la naturaleza',
        oa_codes: ['OA 10', 'OA 21', 'OA 2'],
        isReal: true,
        oa_basales: ['OA 10', 'OA 21', 'OA 2'],
        oa_complementarios: []
      },
      {
        titulo: 'Lección 5: Visiones compartidas',
        oa_codes: ['OA 11', 'OA 24', 'OA 2'],
        isReal: true,
        oa_basales: ['OA 11', 'OA 24', 'OA 2'],
        oa_complementarios: []
      }
    ],
    'Unidad 4': [
      {
        titulo: 'Lección 1: Con el horizonte en la mirada',
        oa_codes: ['OA 3', 'OA 8', 'OA 12', 'OA 2'],
        isReal: true,
        oa_basales: ['OA 3', 'OA 8', 'OA 12'],
        oa_complementarios: ['OA 2']
      },
      {
        titulo: 'Lección 2: Cada uno es como es',
        oa_codes: ['OA 3', 'OA 8', 'OA 24'],
        isReal: true,
        oa_basales: ['OA 3', 'OA 8', 'OA 24'],
        oa_complementarios: []
      },
      {
        titulo: 'Lección 3: Aprendiendo a vivir',
        oa_codes: ['OA 3', 'OA 8', 'OA 21', 'OA 2'],
        isReal: true,
        oa_basales: ['OA 3', 'OA 8', 'OA 21'],
        oa_complementarios: ['OA 2']
      },
      {
        titulo: 'Lección 4: Acciones que inspiran',
        oa_codes: ['OA 9', 'OA 19'],
        isReal: true,
        oa_basales: ['OA 9', 'OA 19'],
        oa_complementarios: []
      },
      {
        titulo: 'Lección 5: Mis ideas cuentan',
        oa_codes: ['OA 9', 'OA 12', 'OA 14', 'OA 15', 'OA 19'],
        isReal: true,
        oa_basales: ['OA 9', 'OA 12', 'OA 14', 'OA 15', 'OA 19'],
        oa_complementarios: []
      }
    ]
  }
};

const TIPOS_RECURSO = [
  { id: 'Diapositivas', label: 'Diapositivas', icon: Presentation, desc: 'Esquema de diapositivas estructurado por sesión.' },
  { id: 'Línea de tiempo', label: 'Línea de tiempo', icon: Clock, desc: 'Hitos cronológicos verticales de progreso.' },
  { id: 'Flashcards', label: 'Flashcards', icon: CreditCard, desc: 'Pares conceptuales de pregunta y respuesta.' },
  { id: 'Póster', label: 'Póster', icon: FileText, desc: 'Lámina de alto impacto con idea fuerza central.' },
  { id: 'Afiche', label: 'Afiche', icon: Megaphone, desc: 'Convocatoria o anuncio con llamado a la acción.' },
  { id: 'Infografía', label: 'Infografía', icon: BookOpen, desc: 'Organización modular de conceptos en bloques.' },
  { id: 'Organizador visual', label: 'Organizador visual', icon: GitCommit, desc: 'Secuencia pedagógica de pasos o procesos.' },
  { id: 'Cómic', label: 'Cómic', icon: Tv, desc: 'Secuencia narrativa visual cuadro a cuadro.' },
];

const DESTINOS = [
  { id: 'ChatGPT', label: 'ChatGPT', desc: 'Formato narrativo para interactuar.' },
  { id: 'Canva', label: 'Canva', desc: 'Formato estructurado por capas y colores.' },
  { id: 'NotebookLM', label: 'NotebookLM', desc: 'Formato ideal para subir como fuente.' },
  { id: 'Gamma', label: 'Gamma', desc: 'Formato optimizado para tarjetas de IA.' },
];

export default function NewPlannerPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Form states in exact order
  const [planningScope, setPlanningScope] = useState<PlanningScope>('clase');
  const [grade, setGrade] = useState('5° Básico');
  const [unit, setUnit] = useState('Unidad 1');
  const [themeMode, setThemeMode] = useState<'select' | 'manual'>('select');
  const [selectedTheme, setSelectedTheme] = useState('');
  const [manualTheme, setManualTheme] = useState('');
  const [suggestedOAs, setSuggestedOAs] = useState<ObjetivoAprendizaje[]>([]);
  const [suggestingOAs, setSuggestingOAs] = useState(false);
  const [validatedOA, setValidatedOA] = useState(true);
  const [writingTechnique, setWritingTechnique] = useState('oreo');

  // Optional course / reference states
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [selectedCursoId, setSelectedCursoId] = useState<string>('');
  const [referenceUrl, setReferenceUrl] = useState('');
  const [referenceFile, setReferenceFile] = useState<File | null>(null);

  // Raw curriculum ejes from DB (loaded once subject+grade is ready)
  const [curriculumEjes, setCurriculumEjes] = useState<Eje[] | null>(null);
  const [realLecciones, setRealLecciones] = useState<any[]>([]);
  const [isRealLesson, setIsRealLesson] = useState(false);
  const [oaBasales, setOaBasales] = useState<string[]>([]);
  const [oaComplementarios, setOaComplementarios] = useState<string[]>([]);

  // Unidades y lecciones de la base de datos (con fallbacks)
  const [unidadesList, setUnidadesList] = useState<any[]>([]);
  const [leccionesList, setLeccionesList] = useState<any[]>([]);
  const [selectedLeccionId, setSelectedLeccionId] = useState<string | number>('');
  const [selectedOaIds, setSelectedOaIds] = useState<(number | string)[]>([]);

  const basalesOAs = suggestedOAs.filter(oa => oaBasales.includes(oa.codigo));
  const compOAs = suggestedOAs.filter(oa => oaComplementarios.includes(oa.codigo));

  // Preview generated plan states
  const [showPreview, setShowPreview] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<any | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationPhase, setGenerationPhase] = useState('');
  const [generationError, setGenerationError] = useState<string | null>(null);

  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState<'trial_expired' | 'limit_reached'>('limit_reached');
  const [upgradePlanStatus, setUpgradePlanStatus] = useState<'trial' | 'active'>('trial');
  const [upgradeRenewalDate, setUpgradeRenewalDate] = useState<string | null>(null);
  const [upgradeLimit, setUpgradeLimit] = useState<number>(24);

  // Sub-module tab: 'planner' | 'visuals'
  const [activeSubModule, setActiveSubModule] = useState<'planner' | 'visuals'>('planner');

  // Prompt Generator States
  const [promptOrigen, setPromptOrigen] = useState<'planificacion' | 'tema'>('planificacion');
  const [promptPlanningId, setPromptPlanningId] = useState<string>('');
  const [promptTemaLibre, setPromptTemaLibre] = useState<string>('');
  const [promptTipo, setPromptTipo] = useState<string>('Diapositivas');
  const [promptDestino, setPromptDestino] = useState<string>('ChatGPT');
  const [promptGenerating, setPromptGenerating] = useState(false);
  const [promptResult, setPromptResult] = useState<string>('');
  const [promptCopied, setPromptCopied] = useState(false);
  const [promptPlannings, setPromptPlannings] = useState<any[]>([]);

  const loadPromptPlannings = async (userId: string) => {
    if (!userId) return;
    try {
      if (userId === 'mock-user-123') {
        const mockPlannings = [
          {
            id: 'mock-id-123',
            unit: 'Unidad 3: Comprensión de Textos Narrativos',
            subject: 'Lenguaje y Comunicación',
            grade: '2° Medio',
            learning_objective: 'OA 3: Analizar las narraciones leídas para enriquecer su comprensión.',
            content: {
              backward_design: {
                activities_sequence: 'Inicio: Motivación y pregunta del día. Desarrollo: Análisis de Bernardo. Cierre: RICE.',
                objective: 'Objetivo de clase detallado.',
                assessment_evidence: 'Ticket de salida RICE.'
              },
              lirmi_summary: {
                cierre: 'Ticket de salida RICE.'
              }
            }
          }
        ];
        setPromptPlannings(mockPlannings);
        setPromptPlanningId('mock-id-123');
        return;
      }

      const { data: planningsData, error } = await supabase
        .from('plannings')
        .select('id, unit, subject, grade, learning_objective, content, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const parsedPlannings = (planningsData || []).map((p: any) => ({
        id: p.id,
        unit: p.unit,
        subject: p.subject,
        grade: p.grade,
        learning_objective: p.learning_objective,
        created_at: p.created_at,
        content: typeof p.content === 'string' ? JSON.parse(p.content) : p.content
      }));

      setPromptPlannings(parsedPlannings);
      if (parsedPlannings.length > 0) {
        setPromptPlanningId(parsedPlannings[0].id);
      }
    } catch (err) {
      console.warn('Error loading user plannings for prompt generator:', err);
    }
  };

  const isCurriculumMode = grade && grade !== 'Otra';

  // Load official curriculum ejes for database alignment
  const loadCurriculumEjes = useCallback(async (lvl: string) => {
    try {
      setCurriculumEjes(null);
      setRealLecciones([]);
      const params = new URLSearchParams({ asignatura: CURRICULUM_SUBJECT, nivel: lvl, _t: String(Date.now()) });
      const res = await fetch(`/api/curriculum?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setCurriculumEjes(data.ejes || []);
        setRealLecciones(data.lecciones || []);
      }
    } catch (err) {
      console.warn('Error fetching curriculum ejes:', err);
    }
  }, []);

  const loadUnidades = useCallback(async (lvl: string) => {
    try {
      setUnidadesList([]);
      setLeccionesList([]);
      setSelectedLeccionId('');
      setSelectedOaIds([]);
      
      const res = await fetch(`/api/curriculum/unidades?nivel=${encodeURIComponent(lvl)}`);
      if (res.ok) {
        const data = await res.json();
        setUnidadesList(data || []);
        if (data && data.length > 0) {
          setUnit(`Unidad ${data[0].numero}`);
        }
      }
    } catch (err) {
      console.warn('Error loading units:', err);
    }
  }, []);

  const loadLecciones = useCallback(async (lvl: string, uni: string) => {
    try {
      setLeccionesList([]);
      setSelectedLeccionId('');
      setSelectedOaIds([]);
      
      const match = uni.match(/\d+/);
      const unitNum = match ? match[0] : uni;

      const res = await fetch(`/api/curriculum/lecciones?nivel=${encodeURIComponent(lvl)}&unidad=${encodeURIComponent(unitNum)}`);
      if (res.ok) {
        const data = await res.json();
        setLeccionesList(data || []);
      }
    } catch (err) {
      console.warn('Error loading lessons:', err);
    }
  }, []);

  const handleLeccionChange = (leccionId: string) => {
    setSelectedLeccionId(leccionId);
    const leccion = leccionesList.find(l => String(l.id) === String(leccionId));
    if (leccion && leccion.oas) {
      const oas = leccion.oas as any[];
      setSelectedOaIds(oas.map(oa => oa.id));
      setSuggestedOAs(oas);
      setOaBasales(oas.map(oa => oa.codigo));
      setOaComplementarios([]);
      setManualTheme(leccion.titulo);
      setThemeMode('manual');
      setIsRealLesson(true);
    } else {
      setSelectedOaIds([]);
      setSuggestedOAs([]);
      setOaBasales([]);
      setOaComplementarios([]);
    }
  };

  const handleOaToggle = (oaId: number | string, checked: boolean) => {
    let nextOaIds = [...selectedOaIds];
    if (checked) {
      if (!nextOaIds.includes(oaId)) {
        nextOaIds.push(oaId);
      }
    } else {
      nextOaIds = nextOaIds.filter(id => id !== oaId);
    }
    setSelectedOaIds(nextOaIds);

    const leccion = leccionesList.find(l => String(l.id) === String(selectedLeccionId));
    if (leccion && leccion.oas) {
      const matched = (leccion.oas as any[]).filter(oa => nextOaIds.includes(oa.id));
      setSuggestedOAs(matched);
      setOaBasales(matched.map(oa => oa.codigo));
    }
  };

  useEffect(() => {
    if (grade) {
      setSelectedTheme('');
      setManualTheme('');
      setSuggestedOAs([]);
      setOaBasales([]);
      setOaComplementarios([]);
      setIsRealLesson(false);
      setSelectedCursoId('');
      loadCurriculumEjes(grade);
      loadUnidades(grade);
    }
  }, [grade, loadCurriculumEjes, loadUnidades]);

  useEffect(() => {
    if (grade && unit) {
      setSelectedTheme('');
      setManualTheme('');
      setSuggestedOAs([]);
      setOaBasales([]);
      setOaComplementarios([]);
      setIsRealLesson(false);
      loadLecciones(grade, unit);
    }
  }, [grade, unit, loadLecciones]);


  // Auth check + fetch courses
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('[Bypass] Planner auth bypass activated');
        const mockUser = { id: 'mock-user-123', email: 'guest@reidocente.cl' };
        setUser(mockUser);
        loadPromptPlannings(mockUser.id);
      } else {
        setUser(user);
        loadPromptPlannings(user.id);
        try {
          const { data: session } = await supabase.auth.getSession();
          const token = session.session?.access_token;
          const res = await fetch('/api/cursos', {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          if (res.ok) {
            const data = await res.json();
            setCursos(data.cursos ?? []);
          }
        } catch (e) {
          // ignore optional course fetch errors
        }
      }
    };
    checkAuth();
  }, [router]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('tab') === 'visuals') {
        setActiveSubModule('visuals');
      }
    }
  }, []);

  const handlePromptGenerate = async () => {
    setPromptGenerating(true);
    setPromptResult('');

    let finalTema = '';
    let finalCurso = '2° Medio';
    let finalOa = 'OA General';
    let finalContenido = '';
    let finalUnidad = '';
    let finalActividades = '';
    let finalEvaluacion = '';
    let finalTicketSalida = '';

    if (promptOrigen === 'planificacion' && promptPlanningId) {
      const plan = promptPlannings.find(p => p.id === promptPlanningId);
      if (plan) {
        finalTema = plan.unit || `${plan.subject} - ${plan.grade}`;
        finalCurso = plan.grade;
        finalOa = plan.learning_objective;
        finalContenido = plan.content?.texto_sesion || plan.content?.backward_design?.objective || '';
        finalUnidad = plan.unit || '';
        finalActividades = plan.content?.backward_design?.activities_sequence || '';
        finalEvaluacion = plan.content?.backward_design?.assessment_evidence || '';
        finalTicketSalida = plan.content?.lirmi_summary?.cierre || plan.content?.backward_design?.assessment_evidence || '';
      }
    } else {
      finalTema = promptTemaLibre.trim() || 'Tema General';
      finalCurso = '2° Medio';
      finalOa = 'OA de la sesión';
      finalContenido = 'Desarrollo conceptual libre sobre el tema.';
      finalUnidad = 'Unidad General';
      finalActividades = 'Actividades del tema.';
      finalEvaluacion = 'Evaluación formativa.';
      finalTicketSalida = 'Ticket de salida reflexivo.';
    }

    try {
      const res = await fetch('/api/presentations/prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tipo: promptTipo,
          destino: promptDestino,
          tema: finalTema,
          curso: finalCurso,
          oa: finalOa,
          contenido: finalContenido,
          unidad: finalUnidad,
          actividades: finalActividades,
          evaluacion: finalEvaluacion,
          ticket_salida: finalTicketSalida
        }),
      });

      if (!res.ok) {
        throw new Error('Error al generar el prompt.');
      }

      const data = await res.json();
      setPromptResult(data.prompt);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Ocurrió un error al generar el prompt.');
    } finally {
      setPromptGenerating(false);
    }
  };

  const handlePromptCopy = () => {
    navigator.clipboard.writeText(promptResult);
    setPromptCopied(true);
    setTimeout(() => setPromptCopied(false), 2000);
  };

  // Dynamic themes catalog loader
  const [catalogThemes, setCatalogThemes] = useState<Array<{ titulo: string; oa_codes: string[]; isReal?: boolean; oa_basales?: string[]; oa_complementarios?: string[] }>>([]);

  const loadThemesForSelection = useCallback(async () => {
    // 1. Check if course has mapas_ruta in Supabase
    if (selectedCursoId && unit) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        const res = await fetch(`/api/cursos/mapa-ruta?cursoId=${selectedCursoId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          if (data.mapa?.unidades) {
            const unitNum = parseInt(unit.replace(/\D/g, ''), 10) || 1;
            const uData = data.mapa.unidades.find((u: any) => u.numero === unitNum);
            if (uData && uData.sesiones) {
              setCatalogThemes(uData.sesiones.map((s: any) => ({
                titulo: s.titulo,
                oa_codes: s.oa_codes || []
              })));
              return;
            }
          }
        }
      } catch (err) {
        console.warn('Error loading custom mapas_ruta themes:', err);
      }
    }

    // 2. Check if we have real database lessons for this unit
    const unitNum = parseInt(unit.replace(/\D/g, ''), 10) || 1;
    const unitLessons = realLecciones.filter(l => l.unidad_numero === unitNum);
    if (unitLessons.length > 0) {
      setCatalogThemes(unitLessons.map(l => ({
        titulo: `Lección ${l.leccion_numero}: ${l.titulo_leccion}`,
        oa_codes: [...(l.oa_basales || []), ...(l.oa_complementarios || [])],
        isReal: true,
        oa_basales: l.oa_basales,
        oa_complementarios: l.oa_complementarios
      })));
      return;
    }

    // 3. Fall back to local JSON catalog
    const gradeKey = grade;
    const unitKey = unit;
    if (FALLBACK_CATALOG[gradeKey] && FALLBACK_CATALOG[gradeKey][unitKey]) {
      setCatalogThemes(FALLBACK_CATALOG[gradeKey][unitKey]);
    } else {
      setCatalogThemes([]);
    }
  }, [selectedCursoId, grade, unit, realLecciones]);

  useEffect(() => {
    loadThemesForSelection();
  }, [loadThemesForSelection]);

  // Automated simulated suggestion of OAs when theme changes
  const runSimulatedSuggestion = useCallback(async (themeTitle: string, selectedOaCodes: string[]) => {
    if (!themeTitle) {
      setSuggestedOAs([]);
      return;
    }

    setSuggestingOAs(true);
    // Simulate short network/processing delay (800ms)
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Align codes from the database curriculum_ejes
    let matchedOas: ObjetivoAprendizaje[] = [];
    if (curriculumEjes) {
      curriculumEjes.forEach((eje) => {
        eje.objetivos_aprendizaje.forEach((oa) => {
          if (selectedOaCodes.includes(oa.codigo)) {
            matchedOas.push(oa);
          }
        });
      });
    }

    // If no curriculum match yet, create simple mock OAs matching the codes
    if (matchedOas.length === 0) {
      selectedOaCodes.forEach((code, index) => {
        matchedOas.push({
          id: index + 9999,
          codigo: code,
          texto: `Objetivo de Aprendizaje sugerido por IA enfocado en ${themeTitle.toLowerCase()}. Permite al docente desarrollar comprensión crítica e interpretación didáctica del texto literario o informativo.`,
          tipo: 'Sugerido',
          indicadores_evaluacion: [
            { id: 1, texto: 'Formula respuestas que demuestran comprensión literal e inferencial.' },
            { id: 2, texto: 'Explica los recursos de estilo y lenguaje figurado empleados en el recurso.' }
          ]
        });
      });
    }

    setSuggestedOAs(matchedOas);
    setSuggestingOAs(false);
    setValidatedOA(true);
  }, [curriculumEjes]);

  // Automatically trigger when theme changes
  useEffect(() => {
    if (themeMode === 'select' && selectedTheme) {
      const selectedObj = catalogThemes.find(t => t.titulo === selectedTheme);
      if (selectedObj) {
        setIsRealLesson(!!selectedObj.isReal);
        setOaBasales(selectedObj.oa_basales || []);
        setOaComplementarios(selectedObj.oa_complementarios || []);
        runSimulatedSuggestion(selectedTheme, selectedObj.oa_codes);
      }
    } else {
      setIsRealLesson(false);
      setOaBasales([]);
      setOaComplementarios([]);
    }
  }, [selectedTheme, themeMode, catalogThemes, runSimulatedSuggestion]);

  // Handle manual theme input text change
  const handleManualThemeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setManualTheme(val);
  };

  // Trigger manual suggestion button
  const triggerManualSuggestion = () => {
    if (!manualTheme.trim()) return;
    // Map custom theme to a default OA depending on unit (e.g. Unit 1 gets OA 3, Unit 2 gets OA 6, etc.)
    let codes = ['OA 3'];
    if (unit.includes('2')) codes = ['OA 6'];
    if (unit.includes('3')) codes = ['OA 5'];
    if (unit.includes('4')) codes = ['OA 3'];
    
    runSimulatedSuggestion(manualTheme, codes);
  };

  // Loading animation interval
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % LOADING_STEPS.length);
      }, 2500);
    } else {
      setLoadingStep(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setReferenceFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const themeText = themeMode === 'select' ? selectedTheme : manualTheme;
    if (!themeText) {
      setError('Por favor escribe o selecciona un tema didáctico.');
      return;
    }

    if (suggestedOAs.length === 0) {
      setError('Falta el Objetivo de Aprendizaje sugerido por la IA. Selecciona un tema o presiona "Sugerir OA".');
      return;
    }

    setError(null);

    try {
      const formData = new FormData();
      formData.append('subject', CURRICULUM_SUBJECT);
      formData.append('grade', grade);
      formData.append('unit', `${unit}: ${themeText}`);
      formData.append('referenceUrl', referenceUrl);
      if (referenceFile) {
        formData.append('referenceFile', referenceFile);
      }
      formData.append('curriculum_mode', 'true');
      formData.append('is_real_lesson', isRealLesson ? 'true' : 'false');
      formData.append('oa_basales_json', JSON.stringify(oaBasales));
      formData.append('oa_complementarios_json', JSON.stringify(oaComplementarios));
      
      const oasCodigos = suggestedOAs.map((o) => o.codigo).join(', ');
      const oasTextos = suggestedOAs.map((o) => `${o.codigo}: ${o.texto}`).join('\n');
      formData.append('oa_codigo', oasCodigos);
      formData.append('oa_texto', oasTextos);
      formData.append('oa_eje', 'Lectura'); // Main default axis
      
      const allIndicators = suggestedOAs.flatMap(o => o.indicadores_evaluacion.map(i => i.texto));
      formData.append('indicadores_json', JSON.stringify(allIndicators));
      formData.append('learningObjective', `${oasCodigos} — ${suggestedOAs.map(o => o.texto).join(' | ')}`);

      formData.append('planning_scope', planningScope);
      formData.append('duracion_bloque_min', '90');
      formData.append('writing_technique', writingTechnique);

      // Fetch session token
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      setIsGenerating(true);
      setGenerationProgress(15);
      setGenerationPhase('Generando texto de sesión...');
      setGenerationError(null);

      const emptyPlan = {
        backward_design: {
          objective: '',
          assessment_evidence: '',
          activities_sequence: '',
        },
        dua_adaptations: {
          n1: '',
          n2: '',
          n3: '',
        },
        rti_supports: {
          n1: { practice: '', ticket: '' },
          n2: { practice: '', ticket: '' },
          n3: { practice: '', ticket: '' },
        },
        nlp_technique: '',
        rubric: '',
        reading_level_eval: {
          estimated_level: '',
          warning_alert: '',
        },
        curricular_summary: '',
        texto_sesion: {
          tipo: '',
          titulo: '',
          autor: '',
          cuerpo: '',
        }
      };
      setGeneratedPlan(emptyPlan);
      setShowPreview(true);

      // Call API generate with timeout
      const controller = new AbortController();
      const abortTimeoutId = setTimeout(() => {
        controller.abort();
      }, 90000); // 90 seconds timeout

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
        signal: controller.signal,
      });

      if (!response.ok) {
        clearTimeout(abortTimeoutId);
        const errData = await response.json().catch(() => ({}));
        if (response.status === 403 && errData.error === 'limite_alcanzado') {
          setUpgradeReason(errData.reason === 'trial_expired' ? 'trial_expired' : 'limit_reached');
          setUpgradePlanStatus(errData.plan_status || 'trial');
          setUpgradeRenewalDate(errData.renewal_date || null);
          setUpgradeLimit(errData.limit || 24);
          setShowUpgradeModal(true);
          setIsGenerating(false);
          setShowPreview(false);
          return;
        }
        throw new Error(errData.error || errData.message || 'Ocurrió un error al generar la planificación.');
      }

      // Start 5 minute timeout detector
      const timeoutId = setTimeout(() => {
        setIsGenerating(false);
        setGenerationError('La generación tardó más de lo esperado. Intenta nuevamente.');
      }, 300000); // 5 minutes

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let finalPlanJson: any = null;
      let streamedActivities = '';

      if (!reader) throw new Error('No se pudo inicializar el lector de stream.');

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          let currentEvent = '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('event:')) {
              currentEvent = trimmed.slice(6).trim();
            } else if (trimmed.startsWith('data:')) {
              const dataStr = trimmed.slice(5).trim();
              try {
                const data = JSON.parse(dataStr);

                if (currentEvent === 'status') {
                  const stepName = data.step;
                  setGenerationPhase(data.message);
                  if (stepName === 'Paso 0: Texto de la Sesión') {
                    setGenerationProgress(15);
                  } else if (stepName === 'Paso 1: Estructura Base') {
                    setGenerationProgress(35);
                  } else if (stepName === 'Paso 2: Adaptaciones de Accesibilidad') {
                    setGenerationProgress(80);
                  } else if (stepName === 'Paso 3: Apoyos por Nivel') {
                    setGenerationProgress(85);
                  } else if (stepName === 'Paso 4: Cierre y Rúbrica') {
                    setGenerationProgress(90);
                  }
                } else if (currentEvent === 'chunk') {
                  const { field, chunk } = data;
                  
                  if (field === 'activities_sequence') {
                    const currentVal = streamedActivities;
                    streamedActivities += chunk;
                    const nextVal = streamedActivities;
                    if (nextVal.toUpperCase().includes('DESARROLLO') && !currentVal.toUpperCase().includes('DESARROLLO')) {
                      setGenerationPhase('Diseñando actividades DESARROLLO...');
                      setGenerationProgress(55);
                    } else if (nextVal.toUpperCase().includes('CIERRE') && !currentVal.toUpperCase().includes('CIERRE')) {
                      setGenerationPhase('Diseñando actividades CIERRE...');
                      setGenerationProgress(75);
                    }
                  }

                  setGeneratedPlan((prev: any) => {
                    if (!prev) return prev;
                    const next = { ...prev };
                    const parts = field.split('.');
                    
                    let curr = next;
                    for (let i = 0; i < parts.length - 1; i++) {
                      if (!curr[parts[i]]) {
                        curr[parts[i]] = {};
                      }
                      curr[parts[i]] = { ...curr[parts[i]] };
                      curr = curr[parts[i]];
                    }
                    
                    const lastKey = parts[parts.length - 1];
                    curr[lastKey] = (curr[lastKey] || '') + chunk;
                    return next;
                  });

                } else if (currentEvent === 'step_complete') {
                  const { json } = data;
                  setGeneratedPlan((prev: any) => {
                    return {
                      ...prev,
                      ...json,
                      texto_sesion: json.texto_sesion || prev.texto_sesion,
                      backward_design: json.backward_design ? { ...prev.backward_design, ...json.backward_design } : prev.backward_design,
                      dua_adaptations: json.dua_adaptations || prev.dua_adaptations,
                      rti_supports: json.rti_supports || prev.rti_supports,
                    };
                  });
                } else if (currentEvent === 'complete') {
                  finalPlanJson = data.json;
                  clearTimeout(timeoutId);
                  clearTimeout(abortTimeoutId);
                } else if (currentEvent === 'error') {
                  throw new Error(data.message || 'Error en la generación.');
                }
              } catch (e) {
                // Ignore incomplete JSON chunks
              }
            }
          }
        }

        clearTimeout(timeoutId);
        clearTimeout(abortTimeoutId);

        if (!finalPlanJson) {
          throw new Error('No se recibió la planificación completa.');
        }

        // Save in Supabase
        const learningObjectiveForDB = `${suggestedOAs.map(o => o.codigo).join(', ')} — ${suggestedOAs.map(o => o.texto).join(' | ')}`;
        const { reading_level_eval, ...contentOnly } = finalPlanJson;

        const { data: savedData, error: dbError } = await supabase
          .from('plannings')
          .insert({
            user_id: user.id,
            curso_id: selectedCursoId || null,
            subject: CURRICULUM_SUBJECT,
            grade,
            learning_objective: learningObjectiveForDB,
            unit: `${unit}: ${themeText}`,
            reference_url: referenceUrl || null,
            reference_document_name: referenceFile ? referenceFile.name : null,
            content: {
              ...contentOnly,
              writing_technique: writingTechnique,
            },
            reading_level: reading_level_eval || {
              estimated_level: 'Séptimo básico',
              warning_alert: 'Nivel adecuado de lectura estimado.',
            },
          })
          .select('id')
          .single();

        if (dbError) throw dbError;

        setGeneratedPlan(finalPlanJson);
        setSavedId(savedData.id);
        setIsGenerating(false);
        setGenerationProgress(100);
        setGenerationPhase('¡Planificación lista!');

      } catch (err: any) {
        clearTimeout(timeoutId);
        clearTimeout(abortTimeoutId);
        setIsGenerating(false);
        const errMsg = err.name === 'AbortError'
          ? 'La generación tardó más de lo esperado. Intenta nuevamente.'
          : (err.message || 'Ocurrió un error al procesar el flujo de generación.');
        setGenerationError(errMsg);
        throw err;
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error de conexión. Inténtalo de nuevo.');
    }
  };

  const handleDownload = (type: 'pdf' | 'word') => {
    if (!savedId) return;
    // Open in a new tab to trigger the auto-download code we just wrote!
    window.open(`/planner/${savedId}?download=${type}`, '_blank');
  };

  // Loading screen layout
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9FC] text-slate-800 flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="relative inline-flex items-center justify-center p-6 bg-violet-50 rounded-full border border-violet-100 mb-2 shadow-xs">
            <Loader2 className="w-10 h-10 text-violet-600 animate-spin" />
            <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-violet-400 animate-bounce" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-black text-slate-800">Diseñando Kit de Clase</h2>
            <p className="text-slate-500 text-xs h-12 flex items-center justify-center font-medium leading-relaxed">
              {LOADING_STEPS[loadingStep]}
            </p>
          </div>

          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200/50">
            <div
              className="bg-gradient-to-r from-violet-600 to-pink-500 h-full transition-all duration-500 rounded-full"
              style={{ width: `${((loadingStep + 1) / LOADING_STEPS.length) * 100}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">REI Docente — IA en Acción</p>
        </div>
      </div>
    );
  }

  const UpgradeModal = () => {
    const formattedRenewalDate = upgradeRenewalDate
      ? new Date(upgradeRenewalDate).toLocaleDateString('es-CL', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        })
      : '';

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
        <div className="relative w-full max-w-md bg-white border border-[#E2E8F0] rounded-3xl p-8 shadow-2xl text-center space-y-5">
          <button
            onClick={() => setShowUpgradeModal(false)}
            className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="inline-flex items-center justify-center w-16 h-16 bg-violet-50 border border-violet-100 rounded-2xl mx-auto">
            <Lock className="w-8 h-8 text-violet-600" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">
              {upgradePlanStatus === 'active'
                ? 'Cupo mensual alcanzado'
                : upgradeReason === 'trial_expired'
                ? 'Tu período de prueba ha terminado'
                : 'Límite de planificaciones alcanzado'}
            </h2>
            <p className="text-slate-500 text-sm leading-relaxed">
              {upgradePlanStatus === 'active'
                ? `Has alcanzado tu cupo mensual de ${upgradeLimit} planificaciones en tu suscripción. Tu cupo se renovará automáticamente en tu próximo ciclo el ${formattedRenewalDate}.`
                : upgradeReason === 'trial_expired'
                ? 'Tu trial gratuito de 7 días ha expirado. Actualiza tu plan para seguir generando recursos visuales, planificaciones y más.'
                : `Has generado 10 planificaciones en tu trial gratuito. Los demás módulos siguen funcionando con sus propios límites. Actualiza para generación ilimitada.`}
            </p>
          </div>

          <div className="space-y-3 pt-1">
            {upgradePlanStatus === 'active' ? (
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="flex items-center justify-center gap-2 w-full py-3 px-6 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-2xl shadow-md transition-all duration-200"
              >
                Entendido
              </button>
            ) : (
              <a
                href="/upgrade"
                className="flex items-center justify-center gap-2 w-full py-3 px-6 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-2xl shadow-md transition-all duration-200"
              >
                <Zap className="w-4 h-4" />
                Actualizar Plan — Generación Ilimitada
              </a>
            )}
            <button
              onClick={() => setShowUpgradeModal(false)}
              className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
            >
              {upgradePlanStatus === 'active' ? 'Volver' : 'Volver al planificador'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#FAF9FC] text-slate-700 flex font-sans antialiased selection:bg-violet-100 selection:text-violet-950 overflow-x-hidden">
      {showUpgradeModal && <UpgradeModal />}
      
      {/* Shared Sidebar Component */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main Container */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        
        {/* Mobile Header */}
        <header className="lg:hidden bg-white border-b border-[#E2E8F0]/70 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button className="text-slate-500 hover:text-slate-800" onClick={() => setSidebarOpen(true)}>
              <span className="text-xl font-bold">☰</span>
            </button>
            <span className="text-base font-bold bg-gradient-to-r from-violet-700 to-indigo-600 bg-clip-text text-transparent">
              REI DOCENTE
            </span>
          </div>
        </header>

        {/* PNL BANNER */}
        <div className="px-6 md:px-8 pt-8">
          <div className="bg-gradient-to-r from-violet-50 via-purple-50/60 to-pink-50/30 border border-violet-100/50 rounded-3xl p-5 flex items-center justify-between relative overflow-hidden shadow-xs">
            <div className="space-y-1 z-10 max-w-2xl">
              <span className="text-[9px] font-black uppercase tracking-wider text-violet-600">MENSAJE DEL DÍA</span>
              <p className="text-slate-800 text-xs md:text-sm font-semibold italic">
                "Hoy avanzamos juntos, paso a paso, con energía y ligereza."
              </p>
            </div>
            <div className="hidden md:flex w-10 h-10 rounded-full bg-white items-center justify-center shrink-0 shadow-xs border border-violet-50">
              <Sparkle className="w-5 h-5 text-violet-600" />
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <main className="flex-1 p-6 md:p-8 space-y-8 max-w-4xl w-full mx-auto">
          
          {/* Sub-module tab switcher */}
          <div className="flex gap-2 border-b border-slate-100 pb-3">
            <button
              onClick={() => {
                setActiveSubModule('planner');
                if (typeof window !== 'undefined') {
                  window.history.pushState(null, '', '/planner/new');
                }
              }}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                activeSubModule === 'planner'
                  ? 'bg-violet-600 text-white shadow-sm shadow-violet-600/10'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Planificador de Clase
            </button>
            <button
              onClick={() => {
                setActiveSubModule('visuals');
                if (typeof window !== 'undefined') {
                  window.history.pushState(null, '', '/planner/new?tab=visuals');
                }
              }}
              id="visuals-tab-btn"
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                activeSubModule === 'visuals'
                  ? 'bg-violet-600 text-white shadow-sm shadow-violet-600/10'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Recursos Visuales
            </button>
          </div>

          {activeSubModule === 'visuals' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              {/* Config Form */}
              <section className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-xs space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-violet-600" /> Recursos Visuales y Prompts
                  </h2>
                  <p className="text-slate-500 text-xs leading-normal font-semibold">
                    Configura tu recurso visual para generar un prompt profesional listo para Canva, Gamma, NotebookLM y ChatGPT.
                  </p>
                </div>

                {/* Question 3: Origen del contenido */}
                <div className="space-y-3">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                    1. Origen del contenido
                  </label>
                  <div className="flex gap-2 p-1 bg-[#FAF9FC] rounded-2xl border border-slate-200/50">
                    <button
                      type="button"
                      onClick={() => setPromptOrigen('planificacion')}
                      className={`flex-1 py-2 px-4 text-xs font-bold rounded-xl transition-all duration-200 ${
                        promptOrigen === 'planificacion'
                          ? 'bg-white text-violet-750 shadow-xs border border-slate-150'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Planificación Creada
                    </button>
                    <button
                      type="button"
                      onClick={() => setPromptOrigen('tema')}
                      className={`flex-1 py-2 px-4 text-xs font-bold rounded-xl transition-all duration-200 ${
                        promptOrigen === 'tema'
                          ? 'bg-white text-violet-750 shadow-xs border border-slate-150'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Tema Libre
                    </button>
                  </div>

                  {promptOrigen === 'planificacion' ? (
                    promptPlannings.length > 0 ? (
                      <select
                        value={promptPlanningId}
                        onChange={(e) => setPromptPlanningId(e.target.value)}
                        className="w-full bg-[#FAF9FC] border border-slate-200 rounded-2xl px-4 py-3 text-xs text-slate-800 font-semibold focus:outline-none focus:border-violet-500 cursor-pointer"
                      >
                        {promptPlannings.map((p) => {
                          const dateStr = p.created_at
                            ? new Date(p.created_at).toLocaleDateString('es-CL', {
                                day: '2-digit',
                                month: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : '';
                          return (
                            <option key={p.id} value={p.id}>
                              {p.grade} - {p.subject} (Unidad: {p.unit.substring(0, 30)}... {dateStr ? `| ${dateStr}` : ''})
                            </option>
                          );
                        })}
                      </select>
                    ) : (
                      <div className="text-xs text-rose-500 bg-rose-50 border border-rose-100 p-4 rounded-2xl font-semibold">
                        Aún no has creado planificaciones. Usa "Tema Libre" o crea un Kit de Clase primero.
                      </div>
                    )
                  ) : (
                    <input
                      type="text"
                      placeholder="Ej: La revolución industrial y sus consecuencias sociales"
                      value={promptTemaLibre}
                      onChange={(e) => setPromptTemaLibre(e.target.value)}
                      className="w-full bg-[#FAF9FC] border border-slate-200 rounded-2xl px-4 py-3.5 text-xs text-slate-800 placeholder-slate-400 font-semibold focus:outline-none focus:border-violet-500"
                    />
                  )}
                </div>

                {/* Question 1: ¿Qué recurso deseas crear? */}
                <div className="space-y-3">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                    2. ¿Qué recurso deseas crear?
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {TIPOS_RECURSO.map((item) => {
                      const Icon = item.icon;
                      const active = promptTipo === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setPromptTipo(item.id)}
                          className={`flex flex-col items-start gap-1.5 p-3 border rounded-2xl text-left transition-all duration-200 active:scale-[0.98] ${
                            active
                              ? 'border-violet-500 bg-violet-50/40 text-violet-950 font-bold shadow-xs'
                              : 'border-slate-150 bg-white hover:bg-slate-50/60 text-slate-650'
                          }`}
                        >
                          <Icon className={`w-4.5 h-4.5 ${active ? 'text-violet-600' : 'text-slate-450'}`} />
                          <div className="min-w-0">
                            <span className="block text-xs font-black leading-none">{item.label}</span>
                            <span className="text-[9px] text-slate-400 font-medium block mt-1 leading-tight">{item.desc}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Question 2: ¿Dónde utilizarás el prompt? */}
                <div className="space-y-3">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                    3. ¿Dónde utilizarás el prompt?
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {DESTINOS.map((item) => {
                      const active = promptDestino === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setPromptDestino(item.id)}
                          className={`flex flex-col items-center justify-center p-3 border rounded-2xl text-center transition-all duration-200 active:scale-[0.98] ${
                            active
                              ? 'border-violet-500 bg-violet-50/40 text-violet-950 font-bold shadow-xs'
                              : 'border-slate-150 bg-white hover:bg-slate-50/60 text-slate-650'
                          }`}
                        >
                          <span className="block text-xs font-black leading-none">{item.label}</span>
                          <span className="text-[9px] text-slate-400 font-medium block mt-1 leading-tight">{item.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Submit button */}
                <button
                  onClick={handlePromptGenerate}
                  disabled={promptGenerating || (promptOrigen === 'tema' && !promptTemaLibre.trim())}
                  className="w-full py-4 bg-gradient-to-r from-violet-600 via-purple-600 to-pink-500 hover:from-violet-750 hover:to-pink-600 text-white font-bold rounded-2xl text-xs uppercase tracking-wider transition-all duration-300 shadow-md shadow-violet-600/10 active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  {promptGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Generando Prompt...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Generar Prompt</span>
                    </>
                  )}
                </button>
              </section>

              {/* Prompt Result section */}
              <section className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-xs min-h-[500px] flex flex-col justify-between">
                <div className="space-y-4">
                  <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider pb-3 border-b border-slate-100 flex items-center justify-between">
                    <span>Prompt Generado</span>
                    {promptResult && (
                      <button
                        onClick={handlePromptCopy}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 text-violet-750 hover:bg-violet-100 rounded-xl text-xs font-bold transition-all active:scale-[0.97]"
                      >
                        {promptCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>¡Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copiar Prompt</span>
                          </>
                        )}
                      </button>
                    )}
                  </h2>

                  {promptResult ? (
                    <div className="relative border border-slate-150 rounded-2xl overflow-hidden bg-slate-50">
                      <textarea
                        readOnly
                        value={promptResult}
                        className="w-full h-[400px] p-4 text-xs font-mono text-slate-700 bg-transparent focus:outline-none resize-none leading-relaxed"
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center py-24 px-6 space-y-4">
                      <div className="w-12 h-12 rounded-2xl bg-violet-50 flex items-center justify-center text-violet-600 animate-pulse border border-violet-100/50">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-xs font-black text-slate-700">Listo para Generar</h3>
                        <p className="text-[11px] text-slate-400 font-medium max-w-xs leading-normal">
                          Completa las preguntas de configuración a la izquierda y presiona "Generar Prompt" para obtener las instrucciones profesionales listas para copiar.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {promptResult && (
                  <div className="pt-6 border-t border-slate-100 space-y-3 animate-in fade-in duration-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Acceso directo a herramientas externas:
                    </span>
                    <div className="flex flex-wrap gap-2.5">
                      {promptDestino === 'Canva' && (
                        <a
                          href="https://canva.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-4.5 py-2.5 bg-sky-50 border border-sky-150 hover:bg-sky-100 text-sky-700 text-xs font-bold rounded-xl transition-all"
                        >
                          Abrir Canva <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {promptDestino === 'Gamma' && (
                        <a
                          href="https://gamma.app"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-4.5 py-2.5 bg-rose-50 border border-rose-150 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl transition-all"
                        >
                          Abrir Gamma <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {promptDestino === 'NotebookLM' && (
                        <a
                          href="https://notebooklm.google.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-4.5 py-2.5 bg-teal-50 border border-teal-150 hover:bg-teal-100 text-teal-750 text-xs font-bold rounded-xl transition-all"
                        >
                          Abrir NotebookLM <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </section>
            </div>
          ) : (
            !showPreview ? (
            <div className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-xs space-y-6">
              
              <div className="border-b border-slate-100 pb-4">
                <h1 className="text-xl font-extrabold text-slate-800">Asistente de Kit de Clase</h1>
                <p className="text-slate-500 text-xs leading-relaxed font-semibold">
                  Genera una planificación curricular completa que incluye diseño invertido, adecuaciones DUA, rúbricas de cierre y apoyo RTI.
                </p>
              </div>

              {error && (
                <div className="bg-rose-50 border border-rose-100 text-rose-700 p-4 rounded-2xl flex items-start gap-3 text-xs">
                  <AlertTriangle className="w-4.5 h-4.5 text-rose-500 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* 1. Curso Selector */}
                <div className="space-y-2">
                  <label htmlFor="grade" className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                    1. Curso / Nivel
                  </label>
                  <select
                    id="grade"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full bg-[#FAF9FC] border border-slate-200 rounded-2xl py-3.5 px-4 text-xs text-slate-800 font-semibold focus:outline-none focus:border-violet-500 appearance-none cursor-pointer"
                  >
                    <option value="5° Básico">5° Básico</option>
                    <option value="6° Básico">6° Básico</option>
                    <option value="7° Básico">7° Básico</option>
                    <option value="8° Básico">8° Básico</option>
                    <option value="1° Medio">1° Medio</option>
                    <option value="2° Medio">2° Medio</option>
                  </select>
                </div>

                {/* 2. Unidad Selector */}
                <div className="space-y-2">
                  <label htmlFor="unit" className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                    2. Unidad Curricular
                  </label>
                  <select
                    id="unit"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full bg-[#FAF9FC] border border-slate-200 rounded-2xl py-3.5 px-4 text-xs text-slate-800 font-semibold focus:outline-none focus:border-violet-500 appearance-none cursor-pointer"
                  >
                    {unidadesList.length > 0 ? (
                      unidadesList.map((u) => {
                        const val = `Unidad ${u.numero}`;
                        return (
                          <option key={u.id} value={val}>
                            Unidad {u.numero}: {u.titulo || `Unidad ${u.numero}`}
                          </option>
                        );
                      })
                    ) : (
                      <>
                        <option value="Unidad 1">{getFullUnitName(grade, 'Unidad 1') || 'Unidad 1'}</option>
                        <option value="Unidad 2">{getFullUnitName(grade, 'Unidad 2') || 'Unidad 2'}</option>
                        <option value="Unidad 3">{getFullUnitName(grade, 'Unidad 3') || 'Unidad 3'}</option>
                        <option value="Unidad 4">{getFullUnitName(grade, 'Unidad 4') || 'Unidad 4'}</option>
                      </>
                    )}
                  </select>
                </div>

                {/* Lección Selector */}
                <div className="space-y-2">
                  <label htmlFor="leccion" className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                    3. Lección Curricular
                  </label>
                  <select
                    id="leccion"
                    value={selectedLeccionId}
                    onChange={(e) => handleLeccionChange(e.target.value)}
                    className="w-full bg-[#FAF9FC] border border-slate-200 rounded-2xl py-3.5 px-4 text-xs text-slate-800 font-semibold focus:outline-none focus:border-violet-500 appearance-none cursor-pointer"
                  >
                    <option value="">-- Elige una lección --</option>
                    {leccionesList.map((l) => (
                      <option key={l.id} value={l.id}>
                        Lección {l.numero}: {l.titulo}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Técnica de Escritura Selector */}
                <div className="space-y-2">
                  <label htmlFor="writing-technique" className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                    Técnica de Escritura
                  </label>
                  <select
                    id="writing-technique"
                    value={writingTechnique}
                    onChange={(e) => setWritingTechnique(e.target.value)}
                    className="w-full bg-[#FAF9FC] border border-slate-200 rounded-2xl py-3.5 px-4 text-xs text-slate-800 font-semibold focus:outline-none focus:border-violet-500 appearance-none cursor-pointer"
                  >
                    <option value="oreo">Técnica OREO (Opinión, Razón, Ejemplo, Opinión)</option>
                    <option value="rice">Técnica RICE (Repetir, Incluir, Citar, Explicar)</option>
                  </select>
                </div>

                {/* Tema de la Clase */}
                <div className="space-y-2 bg-[#FAF9FC]/35 border border-slate-200/60 rounded-2xl p-4">
                  <label htmlFor="manual-theme-input" className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                    Tema o Foco de la Clase
                  </label>
                  <input
                    id="manual-theme-input"
                    type="text"
                    value={manualTheme}
                    onChange={handleManualThemeChange}
                    placeholder="Ej: Juegos e imaginación..."
                    className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 font-semibold focus:outline-none focus:border-violet-500 shadow-xs"
                  />
                </div>

                {/* 4. Objetivo de Aprendizaje sugerido por IA */}
                <div className="space-y-2 border-t border-slate-100 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      4. Alineación Curricular (MINEDUC)
                    </span>
                    {isRealLesson ? (
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full text-emerald-700 bg-emerald-50 border border-emerald-200">
                        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                        <span>Currículum Oficial MINEDUC</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full text-violet-600 bg-violet-50">
                        <Shield className="w-2.5 h-2.5" />
                        <span>Sugerido por IA</span>
                      </span>
                    )}
                  </div>

                  {selectedLeccionId ? (
                    <div className="border border-slate-100 bg-[#FAF9FC]/30 rounded-2xl p-4 space-y-4">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        Objetivos de Aprendizaje de la Lección (Auto-seleccionados, editable, máx 3)
                      </p>
                      
                      <div className="space-y-3">
                        {(() => {
                          const leccion = leccionesList.find(l => String(l.id) === String(selectedLeccionId));
                          const oas = leccion?.oas || [];
                          if (oas.length === 0) {
                            return <p className="text-xs text-slate-400 italic">No hay OAs pre-asignados a esta lección.</p>;
                          }
                          return oas.map((oa: any) => {
                            const isChecked = selectedOaIds.includes(oa.id);
                            return (
                              <label
                                key={oa.id}
                                className="flex items-start gap-2.5 p-3 bg-white border border-slate-150 rounded-xl cursor-pointer hover:bg-slate-50 transition-all duration-150 select-none shadow-xs"
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => handleOaToggle(oa.id, e.target.checked)}
                                  className="mt-0.5 w-4 h-4 rounded text-violet-600 border-slate-300 focus:ring-violet-500 focus:ring-offset-0"
                                />
                                <div className="text-xs min-w-0">
                                  <span className="inline-flex items-center px-1.5 py-0.5 bg-violet-50 border border-violet-100 text-violet-750 font-black text-[9px] rounded-md mr-1.5 uppercase">
                                    {oa.codigo}
                                  </span>
                                  <span className="text-slate-700 leading-relaxed font-semibold">
                                    {oa.texto}
                                  </span>
                                </div>
                              </label>
                            );
                          });
                        })()}
                      </div>

                      <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                        <input
                          type="checkbox"
                          id="validate-oa-check"
                          checked={validatedOA}
                          onChange={(e) => setValidatedOA(e.target.checked)}
                          className="w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500 focus:ring-offset-0"
                        />
                        <label htmlFor="validate-oa-check" className="text-[10px] font-extrabold cursor-pointer text-emerald-800 select-none">
                          Confirmar y validar alineación para el Kit de Clase
                        </label>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl text-xs text-slate-450 font-semibold italic">
                      Selecciona una lección curricular arriba para cargar y seleccionar sus OAs oficiales.
                    </div>
                  )}

                </div>

                {/* Optional Configuration Section (Collapsed by default) */}
                <div className="border-t border-slate-100 pt-4 space-y-3">
                  <p className="text-[10px] font-bold text-slate-400">MATERIAL DE APOYO & HORARIOS (OPCIONAL)</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Course select */}
                    <div className="space-y-1">
                      <label htmlFor="curso-selector" className="text-[9px] font-bold text-slate-500 block">
                        Vincular a Horario de Curso
                      </label>
                      <select
                        id="curso-selector"
                        value={selectedCursoId}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSelectedCursoId(val);
                          if (val) {
                            const course = cursos.find(c => c.id === val);
                            if (course && course.nivel) {
                              setGrade(course.nivel);
                            }
                          }
                        }}
                        className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800"
                      >
                        <option value="">Sin horario vinculado</option>
                        {cursos.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.nombre} ({c.nivel})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Reference URL */}
                    <div className="space-y-1">
                      <label htmlFor="ref-url" className="text-[9px] font-bold text-slate-500 block">
                        URL de Referencia Didáctica
                      </label>
                      <input
                        id="ref-url"
                        type="url"
                        placeholder="https://ejemplo.cl/recurso"
                        value={referenceUrl}
                        onChange={(e) => setReferenceUrl(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800"
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Action Bar */}
                <div className="border-t border-slate-100 pt-6 flex justify-end gap-3">
                  <Link
                    href="/"
                    className="px-5 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-all"
                  >
                    Cancelar
                  </Link>
                  <button
                    type="submit"
                    id="generate-plan-btn"
                    disabled={!validatedOA}
                    className="inline-flex items-center gap-2 px-7 py-2.5 bg-gradient-to-r from-violet-600 via-purple-600 to-pink-500 hover:from-violet-700 hover:to-pink-600 text-white font-bold text-xs rounded-2xl shadow-md transition-all disabled:opacity-40"
                  >
                    Generar Kit de Clase
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

              </form>
            </div>
          ) : (
            // PREVIEW PANE DIRECTLY IN WIZARD
            <div className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-xs space-y-6">
              
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[9px] font-black uppercase tracking-wider text-violet-600">KIT GENERADO</span>
                  <h1 className="text-xl font-extrabold text-slate-800">Vista Previa del Kit de Clase</h1>
                </div>
                <div className="flex gap-2">
                  <button
                    disabled={isGenerating || !savedId}
                    onClick={() => handleDownload('word')}
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition-all ${
                      isGenerating || !savedId
                        ? 'opacity-50 cursor-not-allowed bg-slate-100 border-slate-200 text-slate-400'
                        : 'bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700'
                    }`}
                  >
                    <Download className="w-3.5 h-3.5" />
                    Word
                  </button>
                  <button
                    disabled={isGenerating || !savedId}
                    onClick={() => handleDownload('pdf')}
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition-all ${
                      isGenerating || !savedId
                        ? 'opacity-50 cursor-not-allowed bg-slate-100 border-slate-200 text-slate-400'
                        : 'bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-700'
                    }`}
                  >
                    <Download className="w-3.5 h-3.5" />
                    PDF
                  </button>
                </div>
              </div>

              {/* Quick Summary Card */}
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2">
                <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-500">
                  <div>Curso: <span className="text-slate-800">{grade}</span></div>
                  <div>Asignatura: <span className="text-slate-800">{CURRICULUM_SUBJECT}</span></div>
                </div>
                <div className="text-xs font-semibold text-slate-500">
                  Objetivo: <span className="text-slate-800">{suggestedOAs.map(o => `${o.codigo}: ${o.texto}`).join(' | ')}</span>
                </div>
              </div>

              {/* Progressive Loading Progress Bar */}
              {(isGenerating || generationError || generationProgress < 100) && (
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 space-y-4">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-1.5 text-violet-750">
                      {isGenerating && <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-650" />}
                      {generationError ? 'Error en la generación' : generationPhase || 'Generando planificación...'}
                    </span>
                    <span className="text-[10px] font-extrabold text-slate-500">{generationProgress}%</span>
                  </div>

                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden border border-slate-300/30">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${
                        generationError ? 'bg-rose-500' : 'bg-gradient-to-r from-violet-650 to-pink-500'
                      }`}
                      style={{ width: `${generationProgress}%` }}
                    />
                  </div>

                  {generationError ? (
                    <div className="space-y-3">
                      <p className="text-xs text-rose-600 font-semibold leading-relaxed">
                        {generationError}
                      </p>
                      <button
                        onClick={handleSubmit}
                        className="px-4 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl transition-all"
                      >
                        Reintentar
                      </button>
                    </div>
                  ) : (
                    isGenerating && (
                      <p className="text-[10px] text-slate-500 font-semibold italic">
                        Esto toma aproximadamente 2–3 minutos. El texto aparecerá en tiempo real abajo.
                      </p>
                    )
                  )}
                </div>
              )}

              {/* Rendered Preview Sections */}
              <div className="space-y-6">

                {/* Texto de la Sesión */}
                {(generatedPlan?.texto_sesion?.cuerpo || (isGenerating && generationProgress <= 25)) && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Texto de la Sesión</h3>
                    <div className="border border-slate-100 rounded-2xl p-4 bg-white space-y-2 text-xs text-slate-650">
                      <div><strong>Tipo:</strong> {generatedPlan?.texto_sesion?.tipo || (isGenerating ? 'Generando...' : 'Lectura')}</div>
                      <div><strong>Título:</strong> {generatedPlan?.texto_sesion?.titulo || (isGenerating ? 'Generando...' : 'Sin título')}</div>
                      <div><strong>Autor:</strong> {generatedPlan?.texto_sesion?.autor || (isGenerating ? 'Generando...' : 'Anónimo')}</div>
                      <div className="pt-2 whitespace-pre-line border-t border-slate-50 mt-2 leading-relaxed font-medium text-slate-650">
                        {generatedPlan?.texto_sesion?.cuerpo || (isGenerating ? 'Cargando texto de lectura...' : '')}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* 1. Backward Design */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">1. Secuencia de Aprendizaje Inverso (Backward Design)</h3>
                  <div className="border border-slate-100 rounded-2xl p-4 space-y-3 bg-white">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 mb-1">Evidencia de Evaluación:</h4>
                      <p className="text-xs text-slate-650 leading-relaxed font-medium">
                        {generatedPlan?.backward_design?.assessment_evidence || 
                         (isGenerating ? 'Esperando evidencia...' : 'Los estudiantes elaboran un informe escrito aplicando rúbricas detalladas.')}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 mb-1">Secuencia Didáctica General:</h4>
                      <div className="text-xs text-slate-650 leading-relaxed font-medium whitespace-pre-line">
                        {generatedPlan?.backward_design?.activities_sequence || 
                         (isGenerating ? 'Esperando secuencia de actividades...' : 'Inicio: Activación de saberes previos. Desarrollo: Modelado de lectura. Cierre: Ticket de salida.')}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. DUA Adaptations */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">2. Adaptaciones DUA (Universal Design)</h3>
                  <div className="border border-slate-100 rounded-2xl p-4 bg-white text-xs text-slate-650 leading-relaxed font-medium">
                    {generatedPlan?.dua_adaptations ? (
                      typeof generatedPlan.dua_adaptations === 'string' ? (
                        generatedPlan.dua_adaptations
                      ) : (
                        <div className="space-y-3">
                          <div>
                            <strong className="text-emerald-600 block text-[10px] uppercase font-bold">N1 — Universal</strong>
                            <p className="mt-0.5">{generatedPlan.dua_adaptations.n1}</p>
                          </div>
                          <div>
                            <strong className="text-amber-600 block text-[10px] uppercase font-bold">N2 — Con apoyos</strong>
                            <p className="mt-0.5">{generatedPlan.dua_adaptations.n2}</p>
                          </div>
                          <div>
                            <strong className="text-rose-600 block text-[10px] uppercase font-bold">N3 — Intensivo</strong>
                            <p className="mt-0.5">{generatedPlan.dua_adaptations.n3}</p>
                          </div>
                        </div>
                      )
                    ) : (
                      isGenerating ? 'Esperando adaptaciones DUA...' : 'Se proveen múltiples medios de representación y expresión.'
                    )}
                  </div>
                </div>

                {/* 3. RTI Supports */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">3. Apoyo Diferenciado (RTI)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Nivel 1 */}
                    <div className="border border-slate-100 rounded-2xl p-4 bg-white">
                      <span className="text-[9px] font-black uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Nivel 1 (General)</span>
                      <p className="text-xs text-slate-500 mt-2 font-medium">
                        {generatedPlan?.rti_supports?.n1 && typeof generatedPlan.rti_supports.n1 === 'object' ? (
                          <>
                            <strong>Práctica:</strong> {generatedPlan.rti_supports.n1.practice}<br/>
                            <strong>Ticket:</strong> {generatedPlan.rti_supports.n1.ticket}
                          </>
                        ) : (
                          generatedPlan?.rti_supports?.general || generatedPlan?.rti_supports?.n1 || (isGenerating ? 'Cargando...' : 'Apoyo universal en el aula.')
                        )}
                      </p>
                    </div>
                    {/* Nivel 2 */}
                    <div className="border border-slate-100 rounded-2xl p-4 bg-white">
                      <span className="text-[9px] font-black uppercase text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Nivel 2 (Focalizado)</span>
                      <p className="text-xs text-slate-500 mt-2 font-medium">
                        {generatedPlan?.rti_supports?.n2 && typeof generatedPlan.rti_supports.n2 === 'object' ? (
                          <>
                            <strong>Práctica:</strong> {generatedPlan.rti_supports.n2.practice}<br/>
                            <strong>Ticket:</strong> {generatedPlan.rti_supports.n2.ticket}
                          </>
                        ) : (
                          generatedPlan?.rti_supports?.targeted || generatedPlan?.rti_supports?.n2 || (isGenerating ? 'Cargando...' : 'Guías adaptadas.')
                        )}
                      </p>
                    </div>
                    {/* Nivel 3 */}
                    <div className="border border-slate-100 rounded-2xl p-4 bg-white">
                      <span className="text-[9px] font-black uppercase text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">Nivel 3 (Intensivo)</span>
                      <p className="text-xs text-slate-500 mt-2 font-medium">
                        {generatedPlan?.rti_supports?.n3 && typeof generatedPlan.rti_supports.n3 === 'object' ? (
                          <>
                            <strong>Práctica:</strong> {generatedPlan.rti_supports.n3.practice}<br/>
                            <strong>Ticket:</strong> {generatedPlan.rti_supports.n3.ticket}
                          </>
                        ) : (
                          generatedPlan?.rti_supports?.intensive || generatedPlan?.rti_supports?.n3 || (isGenerating ? 'Cargando...' : 'Tutorías personalizadas.')
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="border-t border-slate-100 pt-6 flex justify-between items-center">
                <button
                  disabled={isGenerating}
                  onClick={() => setShowPreview(false)}
                  className={`px-5 py-2.5 border rounded-2xl text-xs font-bold transition-all ${
                    isGenerating
                      ? 'opacity-50 cursor-not-allowed border-slate-150 text-slate-400'
                      : 'border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  ← Editar Formulario
                </button>
                <div className="flex gap-3">
                  <Link
                    href="/"
                    className="px-5 py-2.5 bg-slate-800 text-white font-bold text-xs rounded-2xl shadow-xs transition-all hover:bg-slate-700"
                  >
                    Volver a Inicio
                  </Link>
                </div>
              </div>
            </div>
          )
          )}

        </main>
      </div>
    </div>
  );
}
