export type ExperienceType = 'podcast' | 'booktuber' | 'diario_personaje' | 'instagram_personaje' | 'juicio_personaje';

export interface ExperienceDefinition {
  nombre: string;
  emoji: string;
  descripcion: string;
  campos_para_claude: string[];
}

export const EXPERIENCE_TEMPLATES: Record<ExperienceType, ExperienceDefinition> = {
  podcast: {
    nombre: 'Podcast Literario',
    emoji: '🎙️',
    descripcion: 'Los alumnos crean un episodio de podcast analizando el libro.',
    campos_para_claude: ['titulo_episodio', 'gancho_inicial', 'segmento_presentacion', 'segmento_personajes', 'segmento_tema_central', 'segmento_opinion', 'cierre', 'roles', 'duracion_sugerida', 'instrucciones_docente'],
  },
  booktuber: {
    nombre: 'Booktuber',
    emoji: '🎥',
    descripcion: 'Guión de video estilo BookTube para reseñar el libro.',
    campos_para_claude: ['titulo_video', 'gancho', 'sinopsis_sin_spoilers', 'analisis_personaje_favorito', 'tema_impactante', 'recomendacion_final', 'hashtags', 'duracion_sugerida', 'instrucciones_docente'],
  },
  diario_personaje: {
    nombre: 'Diario del Personaje',
    emoji: '📔',
    descripcion: 'El alumno escribe entradas de diario desde la perspectiva de un personaje.',
    campos_para_claude: ['personaje_elegido', 'entradas', 'instrucciones_alumno', 'pauta_evaluacion'],
    // entradas: array de 5 objetos { fecha_ficticia, estado_emocional, evento, reflexion }
  },
  instagram_personaje: {
    nombre: 'Instagram del Personaje',
    emoji: '📱',
    descripcion: 'El alumno crea el perfil de Instagram de un personaje del libro.',
    campos_para_claude: ['personaje', 'username', 'bio', 'posts', 'stories', 'comentarios_de_otros', 'instrucciones_alumno'],
    // posts: array de 3 { texto, descripcion_imagen, likes, comentarios }
  },
  juicio_personaje: {
    nombre: 'Juicio al Personaje',
    emoji: '⚖️',
    descripcion: 'Simulación de juicio oral donde los alumnos defienden o acusan a un personaje.',
    campos_para_claude: ['personaje_acusado', 'cargo', 'argumentos_fiscal', 'argumentos_defensa', 'testigos', 'preguntas_jurado', 'veredicto_opciones', 'instrucciones_juez_docente', 'roles_clase'],
  },
};
