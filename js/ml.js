/* =========================================================
   Kairós · Modelo de ML simulado + extractor NLP
   En producción: el modelo vive en un endpoint de Vertex AI
   y la extracción de síntomas la hace Gemini.
   ========================================================= */

const KairosML = (() => {
    const sigmoide = z => 1 / (1 + Math.exp(-z));

    // Coeficientes de la regresión logística (simulados)
    const W = { intercepto: -4.5, pantalla: 0.28, sueno: -0.55, pausas: -0.45, sintomas: 0.55, carga: 0.45, redes: 0.22, nlp: 0.3 };

    // "Estudiante promedio": sirve para explicar qué variables suben o bajan tu riesgo
    const BASE = { pantalla: 5, sueno: 7, pausas: 1.5, sintomas: 1, carga: 2.5, redes: 2 };
    const NOMBRES = { pantalla: 'Horas de pantalla', sueno: 'Horas de sueño', pausas: 'Pausas', sintomas: 'Síntomas', carga: 'Carga académica', redes: 'Redes sociales' };
    // Desviaciones estándar aproximadas (para importancia estandarizada)
    const STD = { pantalla: 2.2, sueno: 1.1, pausas: 1.0, sintomas: 1.2, carga: 0.9, redes: 1.4 };

    // Léxico para la extracción de entidades (simula a Gemini)
    const LEXICO = {
        cabeza:        { etiqueta: 'Dolor de cabeza',         palabras: ['cabeza', 'migrana', 'jaqueca'] },
        ojos:          { etiqueta: 'Fatiga visual',           palabras: ['ojo', 'vista', 'vision', 'arden', 'ardor', 'borros'] },
        concentracion: { etiqueta: 'Falta de concentración',  palabras: ['concentr', 'enfoc', 'distra', 'olvid', 'no rindo', 'bloque'] },
        ansiedad:      { etiqueta: 'Estrés o ansiedad',       palabras: ['ansi', 'estres', 'nervio', 'preocup', 'agobi', 'abrum', 'presion'] },
        sueno:         { etiqueta: 'Problemas de sueño',      palabras: ['dorm', 'insomn', 'desvel', 'sueno', 'desperte'] },
        cansancio:     { etiqueta: 'Cansancio general',       palabras: ['cansad', 'agotad', 'fatig', 'exhaust', 'sin energia', 'quemad'] }
    };
    const normalizar = t => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

    function extraerEntidades(texto = '') {
        const t = normalizar(texto);
        return Object.entries(LEXICO)
            .filter(([, v]) => v.palabras.some(p => t.includes(p)))
            .map(([clave, v]) => ({ clave, etiqueta: v.etiqueta }));
    }

    // Convierte respuestas del check-in en variables del modelo
    function variables(r) {
        const s = r.sintomas || [];
        return {
            pantalla: r.pantalla, sueno: r.sueno, pausas: r.pausas, carga: r.carga, redes: r.redes,
            sintomas: s.length, nlp: r.extraNLP || 0,
            cabeza: s.includes('cabeza'), ojos: s.includes('ojos'),
            concentracion: s.includes('concentracion'), ansiedad: s.includes('ansiedad')
        };
    }

    function predecir(respuestas) {
        const f = variables(respuestas);
        const z = W.intercepto + W.pantalla * f.pantalla + W.sueno * (f.sueno - 7) + W.pausas * f.pausas
                + W.sintomas * f.sintomas + W.carga * f.carga + W.redes * f.redes + W.nlp * f.nlp;
        const burnout = sigmoide(z);

        const b = v => (v ? 1 : 0);
        const riesgos = [
            { nombre: 'Fatiga visual digital',        icon: 'fa-eye',             p: sigmoide(-3 + 0.4 * f.pantalla + 1.5 * b(f.ojos) - 0.3 * f.pausas) },
            { nombre: 'Sueño insuficiente',           icon: 'fa-moon',            p: sigmoide(-1.5 - 0.9 * (f.sueno - 7) + 0.25 * f.redes) },
            { nombre: 'Dolor de cabeza tensional',    icon: 'fa-head-side-virus', p: sigmoide(-3 + 1.6 * b(f.cabeza) + 0.25 * f.pantalla - 0.3 * f.pausas + 0.3 * f.carga) },
            { nombre: 'Estrés y ansiedad',            icon: 'fa-heart-pulse',     p: sigmoide(-3 + 1.5 * b(f.ansiedad) + 0.5 * f.carga + 0.25 * f.redes - 0.4 * (f.sueno - 7)) },
            { nombre: 'Procrastinación',              icon: 'fa-hourglass-half',  p: sigmoide(-2.5 + 0.4 * f.redes + 1.0 * b(f.concentracion) + 0.2 * f.pantalla) }
        ].sort((a, c) => c.p - a.p);

        // Contribución de cada variable respecto al estudiante promedio
        const contribuciones = Object.keys(BASE)
            .map(k => ({ k, nombre: NOMBRES[k], v: W[k] * (f[k] - BASE[k]) }))
            .sort((a, c) => Math.abs(c.v) - Math.abs(a.v));

        const promedioRiesgos = riesgos.reduce((s, r) => s + r.p, 0) / riesgos.length;
        const desgaste = Math.round(100 * (0.6 * burnout + 0.4 * promedioRiesgos));

        return { burnout, desgaste, riesgos, contribuciones, f, fecha: new Date().toISOString() };
    }

    // Importancia estandarizada (para la gráfica de la sección IA)
    function importancia() {
        return Object.keys(BASE).map(k => ({ nombre: NOMBRES[k], peso: +(W[k] * STD[k]).toFixed(2) }))
            .sort((a, b) => Math.abs(b.peso) - Math.abs(a.peso));
    }

    return { predecir, extraerEntidades, importancia };
})();
