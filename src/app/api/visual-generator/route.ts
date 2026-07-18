import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { checkTrialLimit, incrementCounter } from '@/lib/trialGuard';

// pdf-parse must be required dynamically to avoid Next.js bundling issues


// ─── Constants ────────────────────────────────────────────────────────────────

type VisualTipo = 'infografia' | 'linea_tiempo' | 'flashcards' | 'afiche';

const VALID_TIPOS = new Set<VisualTipo>([
  'infografia',
  'linea_tiempo',
  'flashcards',
  'afiche',
]);

/** Auto-detection rules applied server-side — never exposed to the frontend. */
const TIPO_KEYWORD_RULES: Array<{ keywords: string[]; tipo: VisualTipo }> = [
  {
    keywords: ['biografía', 'autor', 'vida', 'nació', 'murió', 'trayectoria'],
    tipo: 'linea_tiempo',
  },
  {
    keywords: ['afiche', 'folleto', 'aviso', 'publicitario'],
    tipo: 'afiche',
  },
  {
    keywords: ['figura', 'metáfora', 'vocabulario', 'concepto', 'término', 'definición'],
    tipo: 'flashcards',
  },
  {
    keywords: ['mito', 'leyenda', 'categorías', 'tipos', 'clases', 'elementos',
               'argumento', 'opinión', 'postura', 'debat', 'persuad'],
    tipo: 'infografia',
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeSupabaseClient(token: string) {
  if (token === 'mock-access-token' && process.env.NODE_ENV === 'development') {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
}

function extractToken(req: NextRequest): string | null {
  const auth = req.headers.get('authorization') ?? '';
  if (auth.startsWith('Bearer ')) return auth.slice(7).trim() || null;
  if (process.env.NODE_ENV === 'development') {
    return 'mock-access-token';
  }
  return null;
}

/** Strips markdown code-fence wrappers so JSON.parse succeeds on Claude output. */
function sanitizeJson(raw: string): string {
  return raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

/**
 * Detects the visual tipo from a tema string using keyword rules.
 * Falls back to 'infografia' when no keyword matches.
 */
function autoDetectTipo(tema: string): VisualTipo {
  const lower = tema.toLowerCase();
  for (const rule of TIPO_KEYWORD_RULES) {
    if (rule.keywords.some((kw) => lower.includes(kw))) {
      return rule.tipo;
    }
  }
  return 'infografia';
}

// ─── Step 1: Claude generates structured content JSON ────────────────────────

const CONTENT_SCHEMAS: Record<VisualTipo, string> = {
  infografia: JSON.stringify({
    titulo: '',
    subtitulo: '',
    secciones: [{ titulo: '', puntos: ['...', '...'] }],
    conclusion: '',
    paleta: 'azul-blanco',
  }),
  linea_tiempo: JSON.stringify({
    titulo: '',
    eventos: [{ año: '', titulo: '', descripcion: '' }],
    paleta: 'cronologica',
  }),
  flashcards: JSON.stringify({
    titulo: '',
    tarjetas: [{ termino: '', definicion: '', ejemplo: '' }],
    paleta: 'multicolor',
  }),
  afiche: JSON.stringify({
    titulo: '',
    subtitulo: '',
    mensaje_central: '',
    puntos_clave: ['...'],
    llamada_accion: '',
    paleta: 'impactante',
  }),
};

async function generateContentJson(
  anthropic: Anthropic,
  tipo: VisualTipo,
  tema: string,
  textoReferencia: string,
  estilo: string,
  paleta: string,
  formatoLayout: string
): Promise<Record<string, unknown>> {
  const schema = CONTENT_SCHEMAS[tipo];
  const userMessage =
    textoReferencia
      ? `Tema: ${tema}\n\nTexto de referencia adicional:\n${textoReferencia}`
      : `Tema: ${tema}`;

  const model = 'claude-sonnet-4-6';

  const response = await anthropic.messages.create({
    model: model,
    max_tokens: 2048,
    system:
      `Eres un experto en diseño de contenido educativo. ` +
      `Genera contenido estructurado para un recurso visual de tipo "${tipo}" ` +
      `sobre el tema indicado. ` +
      `Aplica el estilo visual "${estilo}", la paleta de colores "${paleta}" y el formato layout "${formatoLayout}" en la densidad del contenido y tono. ` +
      `Si el estilo es "minimalista" o "editorial_clean", mantén la información muy concisa, con ideas cortas y espaciadas. ` +
      `Si el estilo es "para_pequenos", utiliza explicaciones muy sencillas, lenguaje infantil y lúdico. ` +
      `Si es "profesional" o "notebooklm", enfócate en datos clave, conceptos formales y estructura rigurosa. ` +
      `Si es "innovador" o "futuro_tech", usa ideas directas, de vanguardia. ` +
      `Si es "colorido" o "canva_educativo", destaca elementos dinámicos. ` +
      `Devuelve SOLO JSON válido con este formato exacto, sin texto adicional:\n${schema}`,
    messages: [{ role: 'user', content: userMessage }],
  });

  const rawText =
    response.content[0]?.type === 'text' ? response.content[0].text : '{}';
  return JSON.parse(sanitizeJson(rawText));
}

// ─── Step 2: Claude generates image prompt ────────────────────────────────────

async function generateImagePrompt(
  anthropic: Anthropic,
  tipo: VisualTipo,
  tema: string,
  contentJson: Record<string, unknown>,
  estilo: string,
  paleta: string,
  formatoLayout: string
): Promise<string> {
  const model = 'claude-sonnet-4-6';

  let palettePrompt = '';
  switch (paleta) {
    case 'elegante_institucional':
      palettePrompt = 'sober corporate colors (navy blue headers, clean slate grey backgrounds/accents, white paper cards, light blue details)';
      break;
    case 'canva_educativo':
      palettePrompt = 'vibrant educational tones (coral red/pink, teal turquois, light yellow cream card background blocks, high visual interest)';
      break;
    case 'tierra_premium':
      palettePrompt = 'organic natural colors (sandy beige, warm terracota orange, olive green, cream and clay borders)';
      break;
    case 'dark_tech':
      palettePrompt = 'futurism dark theme (charcoal black background, illuminated neon cyan, neon magenta/violet glowing accents)';
      break;
    case 'minimal_luxury':
      palettePrompt = 'high-end minimalist look (clean paper white background, black bold headers, soft champagne gold accents, luxurious feel)';
      break;
    case 'alto_contraste':
      palettePrompt = 'ultra high contrast design (stark black and white layout with vivid red or yellow key highlights)';
      break;
    case 'humana_suave':
      palettePrompt = 'gentle humanistic colors (soft cream base, lavender purple borders, warm rose pink accents)';
      break;
    default:
      palettePrompt = 'white or light background with two or three clean contrast accent colors suitable for education';
  }

  let layoutPrompt = '';
  switch (formatoLayout) {
    case 'infografia_vertical':
      layoutPrompt = 'tall vertical educational infographic, organized sequentially top-to-bottom with dividers, boxes, or numbers';
      break;
    case 'linea_tiempo_horizontal':
      layoutPrompt = 'horizontal timeline, showing events chronologically from left to right along a central timeline axis path';
      break;
    case 'mapa_conceptual':
      layoutPrompt = 'concept map hierarchical structure, showing concept nodes connected by labeled lines/arrows';
      break;
    case 'cuadrado':
      layoutPrompt = 'square 1:1 post layout, balanced, compact, educational card frame';
      break;
    default:
      layoutPrompt = 'clean structured educational layout, sections clearly delimited';
  }

  let illustrationPrompt = 'simple icon-style flat illustrations for each key concept';
  if (estilo === 'notebooklm') {
    illustrationPrompt = 'no characters, no teacher drawings, keep the bottom-right corner completely clean and empty';
  } else if (estilo === 'sketchnote') {
    illustrationPrompt = 'no hand-drawn doodles, no sketches, keep the bottom-right corner completely clean and empty';
  }

  let typographyPrompt = 'clean sans-serif, large bold headings, medium body text, high contrast';
  if (estilo === 'minimalista') {
    layoutPrompt = 'spacious, minimalist, high negative space, simple structure';
    typographyPrompt = 'very large elegant sans-serif header, small neat body text';
  } else if (estilo === 'colorido') {
    layoutPrompt = 'fun, high-energy layout with decorative shapes, circles, waves, and colorful border blocks';
  } else if (estilo === 'profesional') {
    layoutPrompt = 'structured grid layout, clean corporate dividers, focus on tables, charts, or ordered lists';
    typographyPrompt = 'formal corporate serif headings, very clean sans-serif body';
  } else if (estilo === 'innovador' || estilo === 'futuro_tech') {
    layoutPrompt = 'asymmetric modern tech deck style, bold neon gradient shapes, futurist AI vibes';
    typographyPrompt = 'enormous futuristic bold sans-serif headings, cyan monospaced body text';
  } else if (estilo === 'para_pequenos') {
    layoutPrompt = 'playful curved blocks, rounded cards, dashed boarders, clouds, stars';
    illustrationPrompt = 'cute childlike flat cartoon drawings, toys, friendly animals, hand-drawn look';
    typographyPrompt = 'cute rounded typography, bubble letter style headers, simple readable text';
  }

  const response = await anthropic.messages.create({
    model: model,
    max_tokens: 512,
    system:
      `You are an expert at writing image generation prompts for educational infographics. ` +
      `Given structured content JSON, write a single detailed English prompt for an AI image model. ` +
      `The prompt must describe: ` +
      `(1) overall layout — ${layoutPrompt}; ` +
      `(2) typography — ${typographyPrompt}; ` +
      `(3) color palette — ${palettePrompt}; ` +
      `(4) sections clearly delimited; ` +
      `(5) illustrations — ${illustrationPrompt}; ` +
      `(6) professional infographic aesthetic, print-ready; ` +
      `(7) include the instruction: "All text in the image must be in Spanish and clearly legible". ` +
      `Output ONLY the prompt text, no preamble.`,
    messages: [
      {
        role: 'user',
        content:
          `Visual type: ${tipo}\nTopic: ${tema}\nContent JSON:\n${JSON.stringify(contentJson, null, 2)}`,
      },
    ],
  });

  return response.content[0]?.type === 'text' ? response.content[0].text.trim() : '';
}

// ─── Fallback: generate HTML/CSS infographic ──────────────────────────────────

function generateHtmlFallback(
  tipo: VisualTipo,
  tema: string,
  contentJson: Record<string, unknown>,
  estilo: string,
  paleta: string,
  formatoLayout: string
): string {
  // Determine colors based on paleta
  let colors = {
    primary: '#2563EB',
    secondary: '#3B82F6',
    bg: '#F9FAFB',
    card: '#FFFFFF',
    text: '#1F2937',
    border: '#E5E7EB'
  };

  switch (paleta) {
    case 'elegante_institucional':
      colors = {
        primary: '#0F172A',
        secondary: '#0284C7',
        bg: estilo === 'futuro_tech' ? '#0F172A' : '#F8FAFC',
        card: '#FFFFFF',
        text: estilo === 'futuro_tech' ? '#FFFFFF' : '#1E293B',
        border: '#E2E8F0'
      };
      break;
    case 'canva_educativo':
      colors = {
        primary: '#06B6D4',
        secondary: '#F43F5E',
        bg: estilo === 'futuro_tech' ? '#1E1B4B' : '#FFFBEB',
        card: '#FFFFFF',
        text: estilo === 'futuro_tech' ? '#FFFFFF' : '#1E293B',
        border: '#FEF3C7'
      };
      break;
    case 'tierra_premium':
      colors = {
        primary: '#854D0E',
        secondary: '#C2410C',
        bg: estilo === 'futuro_tech' ? '#1C1917' : '#FAF7F2',
        card: '#EFEAE2',
        text: estilo === 'futuro_tech' ? '#FAF7F2' : '#292524',
        border: '#EFEAE2'
      };
      break;
    case 'dark_tech':
      colors = {
        primary: '#06B6D4',
        secondary: '#D946EF',
        bg: '#090D16',
        card: '#1E293B',
        text: '#F1F5F9',
        border: '#1E293B'
      };
      break;
    case 'minimal_luxury':
      colors = {
        primary: '#D4AF37',
        secondary: '#1A1A1A',
        bg: estilo === 'futuro_tech' ? '#171717' : '#FFFFFF',
        card: '#F3F4F6',
        text: estilo === 'futuro_tech' ? '#F3F4F6' : '#1A1A1A',
        border: '#E5E7EB'
      };
      break;
    case 'alto_contraste':
      colors = {
        primary: '#000000',
        secondary: '#EF4444',
        bg: estilo === 'futuro_tech' ? '#000000' : '#FFFFFF',
        card: '#FFFFFF',
        text: estilo === 'futuro_tech' ? '#FFFFFF' : '#000000',
        border: '#000000'
      };
      break;
    case 'humana_suave':
      colors = {
        primary: '#8B5CF6',
        secondary: '#EC4899',
        bg: estilo === 'futuro_tech' ? '#2E1065' : '#FAF5FF',
        card: '#FFFFFF',
        text: estilo === 'futuro_tech' ? '#FAF5FF' : '#3B0764',
        border: '#F3E8FF'
      };
      break;
  }

  // Determine styles based on estilo
  let fontFamily = "'Segoe UI', system-ui, -apple-system, sans-serif";
  let bodyStyle = `background: ${colors.bg}; color: ${colors.text};`;
  let cardClass = `max-width: 800px; margin: 0 auto; background: ${colors.card}; padding: 32px; border-radius: 16px; border: 1px solid ${colors.border}; box-shadow: 0 4px 20px rgba(0,0,0,0.05);`;
  let borderStyle = `border: none; border-bottom: 2px solid ${colors.border}; margin: 20px 0;`;

  if (estilo === 'notebooklm') {
    fontFamily = "'Georgia', serif";
    bodyStyle = `background: #FCFBF7; background-image: radial-gradient(#cbd5e1 1px, transparent 1px); background-size: 12px 12px; color: ${colors.text};`;
    cardClass = `max-width: 800px; margin: 0 auto; background: #FFFFFF; border: 2px solid #E6E4DD; padding: 40px; border-radius: 8px; box-shadow: 0 8px 16px rgba(0,0,0,0.02); position: relative;`;
    borderStyle = `border: none; border-bottom: 2px solid #cbd5e1; margin: 24px 0;`;
  } else if (estilo === 'editorial_clean') {
    fontFamily = "'Inter', system-ui, sans-serif";
    cardClass = `max-width: 800px; margin: 0 auto; background: ${colors.card}; padding: 40px; border-radius: 0px; border: none; border-bottom: 4px solid ${colors.primary};`;
    borderStyle = `border: none; border-bottom: 1px solid ${colors.border}; margin: 24px 0;`;
  } else if (estilo === 'canva_educativo') {
    fontFamily = "'Outfit', 'Plus Jakarta Sans', sans-serif";
    cardClass = `max-width: 800px; margin: 0 auto; background: ${colors.card}; padding: 32px; border-radius: 24px; border: 3px solid ${colors.primary}; box-shadow: 0 10px 30px rgba(0,0,0,0.03);`;
    borderStyle = `border: none; height: 4px; background: linear-gradient(to right, ${colors.primary}, ${colors.secondary}); margin: 24px 0;`;
  } else if (estilo === 'futuro_tech') {
    fontFamily = "'Fira Code', 'Courier New', monospace";
    bodyStyle = `background: #020617; color: ${colors.text};`;
    cardClass = `max-width: 800px; margin: 0 auto; background: ${colors.card}; border-left: 6px solid ${colors.secondary}; padding: 32px; border-radius: 12px; border-top: 1px solid ${colors.border}; border-right: 1px solid ${colors.border}; border-bottom: 1px solid ${colors.border};`;
    borderStyle = `border: none; height: 1px; background: ${colors.border}; margin: 24px 0;`;
  } else if (estilo === 'sketchnote') {
    fontFamily = "'Segoe Script', 'Comic Sans MS', cursive";
    bodyStyle = `background: #FAF6E8; color: #2D2D2D;`;
    cardClass = `max-width: 800px; margin: 0 auto; background: #FFFFFF; padding: 36px; border-radius: 20px; border: 2px solid #D1C59F; box-shadow: 5px 5px 0px #D1C59F;`;
    borderStyle = `border: none; border-bottom: 2px dashed #D1C59F; margin: 24px 0;`;
  } else if (estilo === 'roadmap') {
    fontFamily = "'Segoe UI', system-ui, sans-serif";
    cardClass = `max-width: 800px; margin: 0 auto; background: ${colors.card}; padding: 32px; border-radius: 12px; border-top: 8px solid ${colors.secondary}; border-left: 1px solid ${colors.border}; border-right: 1px solid ${colors.border}; border-bottom: 1px solid ${colors.border};`;
  } else if (estilo === 'para_pequenos') {
    fontFamily = "'Nunito', 'Comic Sans MS', sans-serif";
    cardClass = `max-width: 800px; margin: 0 auto; background: ${colors.card}; padding: 32px; border-radius: 32px; border: 4px dashed ${colors.secondary}; box-shadow: 0 6px 0px ${colors.secondary};`;
    borderStyle = `border: none; border-bottom: 4px dashed ${colors.border}; margin: 24px 0;`;
  } else if (estilo === 'revista_visual') {
    fontFamily = "'Playfair Display', 'Georgia', serif";
    cardClass = `max-width: 800px; margin: 0 auto; background: ${colors.card}; padding: 48px; border-radius: 4px; border: 1px solid ${colors.border}; line-height: 1.8;`;
  }

  // Handle format layout constraints
  if (formatoLayout === 'cuadrado') {
    cardClass += ' aspect-ratio: 1/1; max-width: 600px; height: 600px; overflow: hidden;';
  }

  const renderContent = (): string => {
    // Check if style is notebooklm or sketchnote, and include transparent illustration decorations
    let illustrationHtml = '';
    if (estilo === 'notebooklm') {
      illustrationHtml = `
        <div style="position: absolute; bottom: 20px; right: 20px; width: 150px; height: 150px; opacity: 0.95; pointer-events: none; z-index: 100;">
          <img src="/assets/styles/notebooklm/character.png" style="width: 100%; height: 100%; object-fit: contain;" alt="NotebookLM character" />
        </div>
      `;
    } else if (estilo === 'sketchnote') {
      illustrationHtml = `
        <div style="position: absolute; bottom: 20px; right: 20px; width: 150px; height: 150px; opacity: 0.8; pointer-events: none; z-index: 100;">
          <img src="/assets/styles/sketchnote/sketch.png" style="width: 100%; height: 100%; object-fit: contain;" alt="Sketchnote sketch" />
        </div>
      `;
    }

    if (tipo === 'infografia') {
      const { titulo, subtitulo, secciones, conclusion } = contentJson as {
        titulo?: string;
        subtitulo?: string;
        secciones?: Array<{ titulo: string; puntos: string[] }>;
        conclusion?: string;
      };
      const seccionesHtml = (secciones ?? [])
        .map(
          (s) => `
        <div style="margin-bottom:20px; position: relative; z-index: 10;">
          <h3 style="color:${colors.secondary};margin:0 0 10px;font-size:18px;font-weight:700;">${s.titulo}</h3>
          <ul style="margin:0;padding-left:20px;line-height:1.6;">
            ${(s.puntos ?? []).map((p) => `<li style="margin-bottom:6px;">${p}</li>`).join('')}
          </ul>
        </div>`
        )
        .join('');
      return `
        ${illustrationHtml}
        <h1 style="color:${colors.primary};text-align:center;font-size:26px;margin-top:0;font-weight:900;">${titulo ?? tema}</h1>
        ${subtitulo ? `<p style="text-align:center;opacity:0.8;font-size:16px;margin-top:-8px;font-style:italic;">${subtitulo}</p>` : ''}
        <hr style="${borderStyle}">
        ${seccionesHtml}
        ${conclusion ? `<div style="background:rgba(0,0,0,0.02);border-left:4px solid ${colors.secondary};padding:16px;border-radius:8px;margin-top:24px;position:relative;z-index:10;"><strong>Conclusión:</strong> ${conclusion}</div>` : ''}
      `;
    }

    if (tipo === 'linea_tiempo') {
      const { titulo, eventos } = contentJson as {
        titulo?: string;
        eventos?: Array<{ año: string; titulo: string; descripcion: string }>;
      };

      if (formatoLayout === 'linea_tiempo_horizontal') {
        const eventosHtml = (eventos ?? [])
          .map(
            (e) => `
          <div style="flex: 0 0 220px; background: rgba(0,0,0,0.015); border: 1px solid ${colors.border}; border-radius: 12px; padding: 16px; scroll-snap-align: start; text-align: left; position: relative;">
            <div style="background:${colors.primary};color:#fff;border-radius:6px;padding:4px 8px;font-weight:bold;font-size:12px;display:inline-block;margin-bottom:8px;">${e.año}</div>
            <h4 style="margin:0 0 8px;font-size:14px;color:${colors.secondary};font-weight:bold;">${e.titulo}</h4>
            <p style="margin:0;font-size:11px;line-height:1.4;opacity:0.95;">${e.descripcion}</p>
          </div>`
          )
          .join('');
        return `
          ${illustrationHtml}
          <h1 style="color:${colors.primary};text-align:center;margin-top:0;font-weight:900;">${titulo ?? tema}</h1>
          <hr style="${borderStyle}">
          <div style="display:flex; gap:16px; overflow-x:auto; padding: 8px 4px; scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch; margin-bottom: 12px;">
            ${eventosHtml}
          </div>
        `;
      }

      const eventosHtml = (eventos ?? [])
        .map(
          (e) => `
        <div style="display:flex;gap:16px;margin-bottom:20px;align-items:flex-start;position: relative;z-index:10;">
          <div style="min-width:90px;background:${colors.primary};color:#fff;border-radius:8px;padding:6px 12px;text-align:center;font-weight:bold;font-size:14px;box-shadow:0 2px 4px rgba(0,0,0,0.05);">${e.año}</div>
          <div>
            <strong style="font-size:16px;color:${colors.secondary};">${e.titulo}</strong>
            <p style="margin:6px 0 0;opacity:0.9;">${e.descripcion}</p>
          </div>
        </div>`
        )
        .join('');
      return `
        ${illustrationHtml}
        <h1 style="color:${colors.primary};text-align:center;margin-top:0;font-weight:900;">${titulo ?? tema}</h1>
        <hr style="${borderStyle}">
        ${eventosHtml}
      `;
    }

    if (tipo === 'flashcards') {
      const { titulo, tarjetas } = contentJson as {
        titulo?: string;
        tarjetas?: Array<{ termino: string; definicion: string; ejemplo?: string }>;
      };
      const tarjetasHtml = (tarjetas ?? [])
        .map(
          (t, i) => `
        <div style="border:1px solid ${colors.border};border-radius:12px;padding:18px;margin-bottom:14px;background:${i % 2 === 0 ? 'rgba(0,0,0,0.015)' : '#fff'};box-shadow: 0 2px 5px rgba(0,0,0,0.01);position:relative;z-index:10;">
          <h3 style="color:${colors.secondary};margin:0 0 8px;font-size:16px;font-weight:700;">${t.termino}</h3>
          <p style="margin:0 0 8px;line-height:1.5;">${t.definicion}</p>
          ${t.ejemplo ? `<p style="opacity:0.75;font-style:italic;margin:0;font-size:12px;"><strong>Ejemplo:</strong> ${t.ejemplo}</p>` : ''}
        </div>`
        )
        .join('');
      return `
        ${illustrationHtml}
        <h1 style="color:${colors.primary};text-align:center;margin-top:0;font-weight:900;">${titulo ?? tema}</h1>
        <hr style="${borderStyle}">
        ${tarjetasHtml}
      `;
    }

    if (tipo === 'afiche') {
      const { titulo, subtitulo, mensaje_central, puntos_clave, llamada_accion } =
        contentJson as {
          titulo?: string;
          subtitulo?: string;
          mensaje_central?: string;
          puntos_clave?: string[];
          llamada_accion?: string;
        };
      return `
        ${illustrationHtml}
        <div style="text-align:center;position:relative;z-index:10;">
          <h1 style="color:${colors.primary};font-size:30px;margin:0 0 8px;font-weight:900;">${titulo ?? tema}</h1>
          ${subtitulo ? `<h2 style="opacity:0.8;font-size:16px;margin:0 0 20px;">${subtitulo}</h2>` : ''}
          <div style="background:${colors.primary};color:${estilo === 'futuro_tech' || paleta === 'dark_tech' ? '#000000' : '#ffffff'};padding:20px;border-radius:14px;font-size:18px;font-weight:bold;margin:20px 0;box-shadow: 0 4px 10px rgba(0,0,0,0.03);">${mensaje_central ?? ''}</div>
          <ul style="text-align:left;display:inline-block;margin:0 auto;padding-left:20px;font-size:14px;line-height:1.7;">
            ${(puntos_clave ?? []).map((p) => `<li style="margin-bottom:8px;">${p}</li>`).join('')}
          </ul>
          ${llamada_accion ? `<div style="margin-top:24px;background:rgba(251,191,36,0.15);border:2px solid #fbbf24;color:#b45309;padding:12px;border-radius:10px;font-size:16px;font-weight:bold;">${llamada_accion}</div>` : ''}
        </div>
      `;
    }

    return `<p>Contenido no disponible</p>`;
  };

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${tema}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: ${fontFamily};
      ${bodyStyle}
      margin: 0;
      padding: 24px;
      line-height: 1.6;
    }
    .card {
      ${cardClass}
    }
  </style>
</head>
<body>
  <div class="card">
    ${renderContent()}
  </div>
</body>
</html>`;
}

// ─── POST /api/visual-generator ───────────────────────────────────────────────
/**
 * Generates a visual educational resource using a 3-step AI pipeline:
 *   1. Claude → structured content JSON
 *   2. Claude → image generation prompt
 *   3. OpenAI gpt-image-2 → image (base64)
 *   4. Upload to Supabase Storage bucket 'recursos-visuales'
 *   5. Save record in recursos_visuales table
 *
 * Fallback: if image generation fails, generates an HTML/CSS template.
 *
 * FormData fields:
 *   - tema              (required) string
 *   - tipo              (optional) 'infografia'|'linea_tiempo'|'flashcards'|'afiche'
 *   - planning_id       (optional) UUID
 *   - texto_referencia  (optional) string
 *   - file              (optional) File — PDF or plain text
 */
export async function POST(req: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const token = extractToken(req);
  if (!token) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  if (token === 'mock-access-token' && process.env.NODE_ENV === 'development' && !req.headers.get('x-force-real-api')) {
    let formData: FormData;
    try { formData = await req.formData(); } catch { formData = new FormData(); }
    const tema = (formData.get('tema') as string) || 'Infografía';
    const tipo = (formData.get('tipo') as string) || 'infografia';
    const estilo = (formData.get('estilo') as string) || 'minimalista';
    const paleta = (formData.get('paleta') as string) || 'elegante_institucional';
    const formatoLayout = (formData.get('formatoLayout') as string) || 'infografia_vertical';

    let mockImg = '';
    if (estilo === 'minimalista') {
      mockImg = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=600&auto=format&fit=crop';
    } else if (estilo === 'colorido') {
      mockImg = 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=600&auto=format&fit=crop';
    } else if (estilo === 'profesional') {
      mockImg = 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?q=80&w=600&auto=format&fit=crop';
    } else if (estilo === 'innovador' || estilo === 'futuro_tech') {
      mockImg = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop';
    } else if (estilo === 'para_pequenos') {
      mockImg = 'https://images.unsplash.com/photo-1515488042361-404e9250afef?q=80&w=600&auto=format&fit=crop';
    } else if (estilo === 'notebooklm') {
      mockImg = 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=600&auto=format&fit=crop';
    } else if (estilo === 'sketchnote') {
      mockImg = 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?q=80&w=600&auto=format&fit=crop';
    } else {
      mockImg = 'https://images.unsplash.com/photo-1546026423-cc4642628d2b?q=80&w=600&auto=format&fit=crop';
    }

    const resolvedTipo = (VALID_TIPOS.has(tipo as VisualTipo) ? tipo : 'infografia') as VisualTipo;
    
    let contentJson: Record<string, any> = {};
    if (resolvedTipo === 'infografia') {
      contentJson = {
        titulo: 'Recurso Visual: ' + (tema.includes('[TEMA PRINCIPAL]') ? tema.split('[TEMA PRINCIPAL]')[1]?.trim() : tema),
        subtitulo: 'Material educativo adaptado',
        secciones: [
          { titulo: '1. Introducción y Conceptos', puntos: ['Definición principal del eje central.', 'Aspectos clave y bases teóricas de la materia.'] },
          { titulo: '2. Desarrollo y Aplicación', puntos: ['Ejemplo práctico de andamiaje curricular.', 'Pasos para resolver ejercicios guiados en el aula.'] }
        ],
        conclusion: 'El aprendizaje activo mejora significativamente la retención del contenido.'
      };
    } else if (resolvedTipo === 'linea_tiempo') {
      contentJson = {
        titulo: 'Línea de Tiempo: ' + (tema.includes('[TEMA PRINCIPAL]') ? tema.split('[TEMA PRINCIPAL]')[1]?.trim() : tema),
        eventos: [
          { año: 'Etapa 1', titulo: 'Inicio y Fundamentos', descripcion: 'Fijación de los objetivos de la materia y saberes previos.' },
          { año: 'Etapa 2', titulo: 'Desarrollo Conceptual', descripcion: 'Modelación del docente y práctica guiada independiente.' },
          { año: 'Etapa 3', titulo: 'Consolidación', descripcion: 'Evaluación formativa y ticket de salida de la sesión.' }
        ]
      };
    } else if (resolvedTipo === 'flashcards') {
      contentJson = {
        titulo: 'Flashcards de Conceptos: ' + (tema.includes('[TEMA PRINCIPAL]') ? tema.split('[TEMA PRINCIPAL]')[1]?.trim() : tema),
        tarjetas: [
          { termino: 'Concepto Clave A', definicion: 'Explicación del primer término fundamental.', ejemplo: 'Ejemplo didáctico en la sala de clases.' },
          { termino: 'Concepto Clave B', definicion: 'Explicación del segundo término fundamental.', ejemplo: 'Aplicación real de la definición.' }
        ]
      };
    } else if (resolvedTipo === 'afiche') {
      contentJson = {
        titulo: 'Afiche Educativo: ' + (tema.includes('[TEMA PRINCIPAL]') ? tema.split('[TEMA PRINCIPAL]')[1]?.trim() : tema),
        subtitulo: '¡Aprende Jugando!',
        mensaje_central: 'La educación es el arma más poderosa para cambiar el mundo.',
        puntos_clave: ['Ideas claras y precisas', 'Tipografía y diseño atractivo', 'Fácil de leer para todos los niveles'],
        llamada_accion: '¡Pregunta al docente si tienes dudas!'
      };
    }

    if (estilo === 'notebooklm' || estilo === 'sketchnote') {
      try {
        console.log(`[visual-generator-backend-mock] Compositing static Gemini asset on mock image. Style: ${estilo}`);
        const { Jimp } = require('jimp');
        const path = require('path');
        let mainImage;
        try {
          mainImage = await Jimp.read(mockImg);
        } catch (readErr) {
          console.warn('[visual-generator-backend-mock] Could not read Unsplash image, creating fallback in-memory canvas:', readErr);
          mainImage = new Jimp({ width: 800, height: 800, color: estilo === 'notebooklm' ? 0xFCFBF7FF : 0xFAF6E8FF });
        }
        
        const overlayPath = estilo === 'notebooklm'
          ? path.join(process.cwd(), 'public', 'assets', 'styles', 'notebooklm', 'character.png')
          : path.join(process.cwd(), 'public', 'assets', 'styles', 'sketchnote', 'sketch.png');
          
        const overlayImage = await Jimp.read(overlayPath);
        
        const mainW = mainImage.width;
        const mainH = mainImage.height;
        const overlayW = Math.round(mainW * (estilo === 'notebooklm' ? 0.20 : 0.22));
        
        overlayImage.resize({ w: overlayW });
        
        const padding = Math.round(mainW * 0.03);
        const x = mainW - overlayImage.width - padding;
        const y = mainH - overlayImage.height - padding;
        
        const opacity = estilo === 'sketchnote' ? 0.8 : 0.95;
        
        mainImage.composite(overlayImage, x, y, {
          opacitySource: opacity
        });
        
        const buffer = await mainImage.getBuffer('image/png');
        mockImg = `data:image/png;base64,${buffer.toString('base64')}`;
        console.log('[visual-generator-backend-mock] Mock composition successful.');
      } catch (err) {
        console.error('[visual-generator-backend-mock] Mock composition failed:', err);
      }
    }

    const htmlFallback = generateHtmlFallback(resolvedTipo, tema, contentJson, estilo, paleta, formatoLayout);

    const mockRecord = {
      id: 'mock-vis-' + Date.now(),
      tipo: resolvedTipo,
      tema: tema.includes('[TEMA PRINCIPAL]') ? tema.split('[TEMA PRINCIPAL]')[1]?.trim() : tema,
      imagen_url: mockImg,
      html_fallback: htmlFallback,
      contenido_json: {
        ...contentJson,
        estilo,
        paleta,
        formato: formatoLayout
      },
      created_at: new Date().toISOString()
    };
    return NextResponse.json(mockRecord, { status: 200 });
  }

  const supabase = makeSupabaseClient(token);
  let userId: string;

  if (token === 'mock-access-token' && process.env.NODE_ENV === 'development') {
    userId = 'a06a2e45-d28c-4f7f-8d96-e2a27b87fcf9';
  } else {
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) {
      return NextResponse.json({ error: 'Token inválido o expirado' }, { status: 401 });
    }
    userId = userData.user.id;
  }

  // ── Parse FormData ────────────────────────────────────────────────────────
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'FormData inválida' }, { status: 400 });
  }

  const temaRaw = (formData.get('tema') as string | null)?.trim() ?? '';
  if (!temaRaw) {
    return NextResponse.json({ error: 'El campo "tema" es obligatorio' }, { status: 400 });
  }

  const tipoRaw = (formData.get('tipo') as string | null)?.trim() ?? '';
  const planningId = (formData.get('planning_id') as string | null)?.trim() || null;
  let textoReferencia = (formData.get('texto_referencia') as string | null)?.trim() ?? '';
  const estilo = (formData.get('estilo') as string | null)?.trim() ?? 'minimalista';
  const paleta = (formData.get('paleta') as string | null)?.trim() ?? 'elegante_institucional';
  const formatoLayout = (formData.get('formatoLayout') as string | null)?.trim() ?? 'infografia_vertical';

  // If a file was attached, extract its text and append to textoReferencia
  const file = formData.get('file');
  if (file instanceof File && file.size > 0) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const mimeType = file.type.toLowerCase();
      const fileName = file.name.toLowerCase();

      if (mimeType === 'application/pdf' || fileName.endsWith('.pdf')) {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const pdfParse = require('pdf-parse');
        const pdfData = await pdfParse(buffer);
        textoReferencia += `\n\n${pdfData.text ?? ''}`;
      } else {
        // Treat as plain text / UTF-8
        textoReferencia += `\n\n${buffer.toString('utf-8')}`;
      }
    } catch (fileErr) {
      console.warn('[visual-generator] Could not extract file text:', fileErr);
    }
  }

  // Resolve tipo — validate if provided, auto-detect otherwise
  let tipo: VisualTipo;
  if (tipoRaw && VALID_TIPOS.has(tipoRaw as VisualTipo)) {
    tipo = tipoRaw as VisualTipo;
  } else {
    tipo = autoDetectTipo(temaRaw + ' ' + textoReferencia);
  }

  // ── Trial limit check ─────────────────────────────────────────────────────
  const guard = await checkTrialLimit(supabase, userId, 'presentations_generated');
  if (guard.blocked) {
    const isActive = guard.profile?.plan_status === 'active';
    return NextResponse.json(
      {
        error: 'limite_alcanzado',
        reason: guard.reason,              // 'trial_expired' | 'limit_reached'
        tipo: 'presentations_generated',
        limit: isActive ? 24 : 10,
        current: guard.profile?.presentations_generated ?? 0,
        plan_status: guard.profile?.plan_status,
        renewal_date: guard.renewalDate,
      },
      { status: 403 }
    );
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  // ── STEP 1: Claude → structured content JSON ──────────────────────────────
  let contenidoJson: Record<string, unknown>;
  try {
    contenidoJson = await generateContentJson(anthropic, tipo, temaRaw, textoReferencia, estilo, paleta, formatoLayout);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[visual-generator] Step 1 failed:', message);
    return NextResponse.json(
      { error: 'Error al generar contenido estructurado', detail: message },
      { status: 500 }
    );
  }

  // ── STEP 2: Claude → image generation prompt ──────────────────────────────
  let imagePrompt: string;
  try {
    imagePrompt = await generateImagePrompt(anthropic, tipo, temaRaw, contenidoJson, estilo, paleta, formatoLayout);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[visual-generator] Step 2 failed:', message);
    return NextResponse.json(
      { error: 'Error al generar el prompt de imagen', detail: message },
      { status: 500 }
    );
  }

  // ── STEP 3: OpenAI gpt-image-2 → image ───────────────────────────────────
  let imagenUrl: string | null = null;
  let htmlFallback: string | null = null;
  const isFallback = false;

  try {
    let imageSize: '1024x1024' | '1024x1536' | '1536x1024' = '1024x1024';
    if (formatoLayout === 'infografia_vertical') {
      imageSize = '1024x1536';
    } else if (formatoLayout === 'linea_tiempo_horizontal') {
      imageSize = '1536x1024';
    }

    const premiumPrompt = `${imagePrompt}. High-quality visual style similar to Canva and NotebookLM templates. Clean, modern educational design, professional graphic design, vector icons, no photo-realistic faces, print-ready.`;

    console.log(`[visual-generator] Calling OpenAI gpt-image-2 with size: ${imageSize}`);
    const imageResult = await openai.images.generate({
      model: 'gpt-image-2',
      prompt: premiumPrompt,
      size: imageSize,
      quality: 'medium',
    } as any);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const b64 = (imageResult.data?.[0] as any)?.b64_json as string | undefined;
    const imageUrl = (imageResult.data?.[0] as any)?.url as string | undefined;

    let imageBuffer: Buffer;
    if (b64) {
      imageBuffer = Buffer.from(b64, 'base64');
    } else if (imageUrl) {
      console.log(`[visual-generator] Image URL returned: ${imageUrl}. Fetching image buffer...`);
      const imageFetchRes = await fetch(imageUrl);
      if (!imageFetchRes.ok) {
        throw new Error(`Failed to fetch image from OpenAI URL: ${imageFetchRes.statusText}`);
      }
      const arrayBuffer = await imageFetchRes.arrayBuffer();
      imageBuffer = Buffer.from(arrayBuffer);
    } else {
      throw new Error('No se recibió la imagen (ni en b64_json ni en url) desde la API de OpenAI');
    }

    // ── STEP 4: Upload to Supabase Storage ─────────────────────────────────

    if (estilo === 'notebooklm' || estilo === 'sketchnote') {
      try {
        console.log(`[visual-generator-backend] Compositing static Gemini asset on backend. Style: ${estilo}`);
        const { Jimp } = require('jimp');
        const path = require('path');
        const mainImage = await Jimp.read(imageBuffer);
        
        const overlayPath = estilo === 'notebooklm'
          ? path.join(process.cwd(), 'public', 'assets', 'styles', 'notebooklm', 'character.png')
          : path.join(process.cwd(), 'public', 'assets', 'styles', 'sketchnote', 'sketch.png');
          
        const overlayImage = await Jimp.read(overlayPath);
        
        const mainW = mainImage.width;
        const mainH = mainImage.height;
        const overlayW = Math.round(mainW * (estilo === 'notebooklm' ? 0.20 : 0.22));
        
        overlayImage.resize({ w: overlayW });
        
        const padding = Math.round(mainW * 0.03);
        const x = mainW - overlayImage.width - padding;
        const y = mainH - overlayImage.height - padding;
        
        const opacity = estilo === 'sketchnote' ? 0.8 : 0.95;
        
        mainImage.composite(overlayImage, x, y, {
          opacitySource: opacity
        });
        
        imageBuffer = await mainImage.getBuffer('image/png');
        console.log('[visual-generator-backend] Backend composition successful.');
      } catch (err) {
        console.error('[visual-generator-backend] Backend composition failed:', err);
      }
    }
    const timestamp = Date.now();
    const storagePath = `${userId}/${timestamp}-${tipo}.png`;

    const { error: uploadError } = await supabase.storage
      .from('recursos-visuales')
      .upload(storagePath, imageBuffer, {
        contentType: 'image/png',
        upsert: false,
      });

    if (uploadError) {
      console.warn('[visual-generator] Storage upload failed:', uploadError.message);
      if (process.env.NODE_ENV === 'development') {
        console.log('[visual-generator] Development mode: Falling back to base64 data URL for image_url.');
        imagenUrl = `data:image/png;base64,${imageBuffer.toString('base64')}`;
      } else {
        throw new Error(`Storage upload failed: ${uploadError.message}`);
      }
    } else {
      const { data: publicUrlData } = supabase.storage
        .from('recursos-visuales')
        .getPublicUrl(storagePath);
      imagenUrl = publicUrlData?.publicUrl ?? null;
    }

  } catch (imgErr) {
    const message = imgErr instanceof Error ? imgErr.message : String(imgErr);
    console.error('[visual-generator] OpenAI Image generation/upload failed:', message);
    return NextResponse.json(
      { error: 'Error al generar la imagen con OpenAI (gpt-image-2). Por favor verifica tu API Key o saldo.', detail: message },
      { status: 502 }
    );
  }

  // Save the style preference inside the JSON object
  const finalContenidoJson = { ...contenidoJson, estilo, paleta, formato: formatoLayout };

  // ── STEP 5: Save record in DB ─────────────────────────────────────────────
  const { data: record, error: dbError } = await supabase
    .from('recursos_visuales')
    .insert({
      user_id: userId,
      planning_id: planningId,
      tipo,
      tema: temaRaw,
      contenido_json: finalContenidoJson,
      imagen_url: imagenUrl,
      html_fallback: htmlFallback,
      prompt_imagen: imagePrompt,
    })
    .select('id, tipo, tema, imagen_url, html_fallback, contenido_json, created_at')
    .single();

  let resolvedRecord = record;

  if (dbError) {
    console.warn('[visual-generator] DB insert error (likely foreign key/RLS in dev):', dbError.message);
    if (process.env.NODE_ENV === 'development') {
      resolvedRecord = {
        id: 'dev-vis-' + Date.now(),
        tipo,
        tema: temaRaw,
        imagen_url: imagenUrl,
        html_fallback: htmlFallback,
        contenido_json: finalContenidoJson,
        created_at: new Date().toISOString()
      };
    } else {
      return NextResponse.json(
        { error: 'Error al guardar el recurso visual', detail: dbError.message },
        { status: 500 }
      );
    }
  }

  // ── Increment usage counter (after successful generation, including fallback) ──
  // The fallback still consumed a Claude call, so it counts against the trial limit.
  await incrementCounter(supabase, userId, 'presentations_generated');

  // ── Return ────────────────────────────────────────────────────────────────
  return NextResponse.json(
    { ...resolvedRecord, fallback: isFallback },
    { status: 201 }
  );
}
