/* =========================================================
   Kairós · Datos simulados (mock)
   En producción vendrían de Supabase (tablas: usuarios,
   checkins, habitos_usuario, amistades) y de BigQuery.
   ========================================================= */

const KAIROS_DATA = {
    usuario: { nombre: 'Ana', iniciales: 'AN', carrera: 'MAC', semestre: 5 },

    // Estado inicial del usuario demo (luego se guarda en localStorage)
    estadoInicial: {
        racha: 5,
        xp: 340,
        historial: [false, true, true, true, true, true], // 6 días previos a hoy
        ultimoCheckin: null,
        tareas: 9,
        descansos: 14,
        minutosSinPantalla: 260,
        resultado: null,
        respuestas: null,
        plan: [],
        invitaciones: []
    },

    insignias: [
        { icon: 'fa-seedling',       nombre: 'Primer paso',        desc: 'Tu primer check-in',        meta: e => e.racha >= 1 },
        { icon: 'fa-calendar-check', nombre: 'Primera semana',     desc: '7 días de racha',           meta: e => e.racha >= 7 },
        { icon: 'fa-mug-hot',        nombre: 'Descanso sin culpa', desc: '15 descansos registrados',  meta: e => e.descansos >= 15 },
        { icon: 'fa-bullseye',       nombre: 'Modo enfoque',       desc: '10 tareas terminadas',      meta: e => e.tareas >= 10 },
        { icon: 'fa-list-check',     nombre: 'Plan activo',        desc: '3 hábitos en tu plan',      meta: e => e.plan.length >= 3 },
        { icon: 'fa-crown',          nombre: 'Constancia',         desc: '30 días de racha',          meta: e => e.racha >= 30 }
    ],

    // Preguntas del agente de check-in
    preguntas: [
        { id: 'pantalla', tipo: 'single', texto: 'Para empezar: ¿cuántas horas has usado pantallas hoy (celular, compu, tablet)?',
          opciones: [{ t: 'Menos de 3 h', v: 2 }, { t: '3 a 5 h', v: 4 }, { t: '5 a 8 h', v: 6.5 }, { t: 'Más de 8 h', v: 9 }] },
        { id: 'sueno', tipo: 'single', texto: '¿Cuántas horas dormiste anoche?',
          opciones: [{ t: 'Menos de 5 h', v: 4.5 }, { t: '5 a 6 h', v: 5.5 }, { t: '6 a 7 h', v: 6.5 }, { t: '7 h o más', v: 7.5 }] },
        { id: 'pausas', tipo: 'single', texto: 'Mientras estudias o trabajas, ¿cada cuánto haces pausas?',
          opciones: [{ t: 'Casi nunca', v: 0 }, { t: 'Cada 2–3 h', v: 1 }, { t: 'Cada hora', v: 2 }, { t: 'Cada 25–50 min', v: 3 }] },
        { id: 'redes', tipo: 'single', texto: '¿Cuánto tiempo pasaste hoy en redes sociales?',
          opciones: [{ t: 'Menos de 1 h', v: 0.5 }, { t: '1 a 2 h', v: 1.5 }, { t: '2 a 4 h', v: 3 }, { t: 'Más de 4 h', v: 5 }] },
        { id: 'carga', tipo: 'single', texto: '¿Cómo describirías tu carga académica esta semana?',
          opciones: [{ t: 'Ligera', v: 1 }, { t: 'Normal', v: 2 }, { t: 'Pesada', v: 3 }, { t: 'Semana de finales 😵', v: 4 }] },
        { id: 'sintomas', tipo: 'multi', texto: '¿Has sentido alguno de estos síntomas hoy? Puedes elegir varios.',
          opciones: [{ t: 'Dolor de cabeza', v: 'cabeza' }, { t: 'Ojos cansados o secos', v: 'ojos' }, { t: 'Me cuesta concentrarme', v: 'concentracion' }, { t: 'Ansiedad o estrés', v: 'ansiedad' }, { t: 'Ninguno', v: 'ninguno' }] },
        { id: 'texto', tipo: 'texto', texto: 'Por último, cuéntame con tus palabras cómo te sientes. Lo analizo con NLP para detectar señales extra.',
          placeholder: 'Ej: Me duele la cabeza y no puedo concentrarme…' }
    ],

    // Datos agregados de la comunidad (anónimos)
    comunidad: {
        kpis:        { fatiga: 6.8, pantalla: 7.4, sueno: 6.1, rachas: 1240, checkins: 386 },
        tendencias:  { fatiga: 12,  pantalla: -5,  sueno: -3,  rachas: 8,    checkins: 15 },
        horas: ['7 am', '9 am', '11 am', '1 pm', '3 pm', '5 pm', '7 pm', '9 pm', '11 pm'],
        fatigaHora: [2.1, 3.0, 4.2, 5.1, 5.6, 6.4, 7.2, 7.8, 7.1],
        distractores: { labels: ['Redes sociales', 'Streaming', 'Mensajería', 'Videojuegos', 'Otros'], data: [41, 22, 16, 13, 8] },
        // dir: 1 si los valores altos indican más fatiga, -1 si indican menos
        respuestas: {
            pantalla: { titulo: 'Horas de pantalla al día', labels: ['< 3 h', '3–5 h', '5–8 h', '> 8 h'], data: [8, 24, 42, 26], dir: 1 },
            sueno:    { titulo: 'Horas de sueño',           labels: ['< 5 h', '5–6 h', '6–7 h', '7 h o más'], data: [18, 34, 29, 19], dir: -1 },
            pausas:   { titulo: 'Frecuencia de pausas',     labels: ['Casi nunca', 'Cada 2–3 h', 'Cada hora', 'Pomodoro'], data: [31, 38, 19, 12], dir: -1 },
            carga:    { titulo: 'Carga académica',          labels: ['Ligera', 'Normal', 'Pesada', 'Finales'], data: [9, 33, 38, 20], dir: 1 },
            sintomas: { titulo: 'Síntomas reportados (%)',  labels: ['Dolor de cabeza', 'Ojos cansados', 'Concentración', 'Ansiedad', 'Ninguno'], data: [46, 61, 57, 49, 14], dir: 0 }
        },
        habitos: {
            labels: ['Pausas activas', 'Sueño ≥ 7 h', 'Sin pantalla al dormir', 'Límite en redes', 'Actividad física', 'Modo concentración'],
            data: [34, 29, 22, 27, 41, 36]
        }
    },

    carreras: ['Todas', 'MAC', 'Actuaría', 'Derecho', 'Arquitectura', 'Pedagogía', 'Economía', 'Diseño Gráfico'],

    // Catálogo de hábitos. "cuando(f, p)" decide si aplica según las variables del check-in.
    habitos: {
        hacer: [
            { id: 'h-avion', icon: 'fa-plane', titulo: 'Desconexión de 20 min en modo avión', impacto: 'Alto',
              desc: 'Una pausa real, sin notificaciones, reduce la activación del sistema de estrés.', cuando: (f, p) => p >= 0.35 || f.pantalla >= 6.5 },
            { id: 'h-202020', icon: 'fa-eye', titulo: 'Regla 20-20-20', impacto: 'Alto',
              desc: 'Cada 20 min mira algo a 6 metros durante 20 segundos para descansar la vista.', cuando: f => f.ojos || f.pantalla >= 5 },
            { id: 'h-sueno', icon: 'fa-bed', titulo: 'Apaga pantallas 1 h antes de dormir', impacto: 'Alto',
              desc: 'Dormir mejor es una de las formas más efectivas de bajar el cortisol al día siguiente.', cuando: f => f.sueno < 7 },
            { id: 'h-culpa', icon: 'fa-mug-hot', titulo: 'Agenda un descanso sin culpa', impacto: 'Alto',
              desc: 'Bloquea 30 min en tu calendario solo para ti. Descansar también es parte del plan.', cuando: (f, p) => p >= 0.6 },
            { id: 'h-pomodoro', icon: 'fa-stopwatch', titulo: 'Bloques de 50/10 minutos', impacto: 'Medio',
              desc: 'Estudia 50 min y descansa 10 lejos de la pantalla para sostener la concentración.', cuando: f => f.pausas <= 1 },
            { id: 'h-respira', icon: 'fa-wind', titulo: 'Respiración en caja (4 min)', impacto: 'Medio',
              desc: 'Inhala 4 s, sostén 4 s, exhala 4 s, sostén 4 s. Ideal antes de un examen.', cuando: f => f.ansiedad || f.carga >= 3 },
            { id: 'h-tres', icon: 'fa-list-ol', titulo: 'Lista de 3 tareas prioritarias', impacto: 'Medio',
              desc: 'Dividir el trabajo en 3 pasos concretos reduce la procrastinación y el agobio.', cuando: f => f.concentracion || f.redes >= 3 },
            { id: 'h-camina', icon: 'fa-person-walking', titulo: 'Caminata de 10 min sin celular', impacto: 'Medio',
              desc: 'Moverte y recibir luz natural ayuda a regular tu energía y tu estado de ánimo.', cuando: () => true },
            { id: 'h-agua', icon: 'fa-glass-water', titulo: 'Hidrátate y estira cuello y hombros', impacto: 'Bajo',
              desc: 'La tensión muscular y la deshidratación suelen acompañar al dolor de cabeza.', cuando: f => f.cabeza }
        ],
        evitar: [
            { id: 'e-scroll', icon: 'fa-mobile-screen', titulo: 'Scrollear redes durante tus descansos',
              desc: 'No es descanso: tu cerebro sigue procesando estímulos y la fatiga se acumula.', cuando: f => f.redes >= 1.5 },
            { id: 'e-cama', icon: 'fa-moon', titulo: 'Usar el celular en la cama',
              desc: 'La luz y el contenido estimulante retrasan el sueño y reducen su calidad.', cuando: f => f.sueno < 7 },
            { id: 'e-sinpausa', icon: 'fa-hourglass-end', titulo: 'Más de 2 h seguidas frente a la pantalla',
              desc: 'Sin pausas, la fatiga visual y mental crece aunque no lo notes.', cuando: f => f.pausas <= 1 || f.pantalla >= 6.5 },
            { id: 'e-notif', icon: 'fa-bell', titulo: 'Estudiar con notificaciones activas',
              desc: 'Cada interrupción cuesta varios minutos para recuperar la concentración.', cuando: f => f.concentracion || f.pausas <= 1 },
            { id: 'e-despertar', icon: 'fa-sun', titulo: 'Revisar el celular al despertar',
              desc: 'Empezar el día con correos y redes eleva el estrés desde temprano.', cuando: f => f.ansiedad || f.carga >= 3 },
            { id: 'e-cafe', icon: 'fa-mug-saucer', titulo: 'Cafeína después de las 5 pm',
              desc: 'Puede dificultar el sueño y aumentar la sensación de ansiedad.', cuando: f => f.sueno < 7 || f.ansiedad },
            { id: 'e-maraton', icon: 'fa-tv', titulo: 'Maratones de series entre semana',
              desc: 'Suman horas de pantalla y suelen robarle tiempo al sueño.', cuando: f => f.pantalla >= 8 }
        ]
    },

    amigos: [
        { nombre: 'Valeria M.', ini: 'VM', color: '#ec4899', racha: 21, tareas: 11, descansos: 23, sinPantalla: 510 },
        { nombre: 'Diego R.',   ini: 'DR', color: '#3b82f6', racha: 12, tareas: 15, descansos: 19, sinPantalla: 420 },
        { nombre: 'Sofía G.',   ini: 'SG', color: '#8b5cf6', racha: 8,  tareas: 8,  descansos: 16, sinPantalla: 330 },
        { nombre: 'Luis A.',    ini: 'LA', color: '#f59e0b', racha: 3,  tareas: 17, descansos: 6,  sinPantalla: 150 },
        { nombre: 'Emilio T.',  ini: 'ET', color: '#14b8a6', racha: 1,  tareas: 5,  descansos: 4,  sinPantalla: 90 }
    ],

    retos: [
        { icon: 'fa-moon',        color: 'violet', titulo: 'Sin pantallas después de las 11 pm', meta: 7,  unidad: 'noches',    xp: 120, actual: () => 4 },
        { icon: 'fa-check-double', color: 'blue',  titulo: 'Termina 15 tareas esta semana',     meta: 15, unidad: 'tareas',    xp: 100, actual: e => e.tareas },
        { icon: 'fa-mug-hot',     color: 'green',  titulo: '20 descansos sin culpa',            meta: 20, unidad: 'descansos', xp: 150, actual: e => e.descansos }
    ],

    // Etapas de IA/ML (sección "IA aplicada")
    pipeline: [
        { icon: 'fa-comments', color: 'blue', titulo: 'Check-in conversacional', tech: 'Gemini · Vertex AI',
          desc: 'Un agente hace 7 preguntas breves y empáticas sobre pantalla, sueño, pausas, carga y síntomas.',
          detalle: ['Prompt de sistema con tono empático y sin emitir diagnósticos médicos', 'Respuestas estructuradas en JSON (function calling)', 'En el MVP: flujo guiado en agent.js con respuestas rápidas'] },
        { icon: 'fa-tags', color: 'violet', titulo: 'Extracción de síntomas (NLP)', tech: 'Gemini · Natural Language API',
          desc: 'Del texto libre se extraen señales como “dolor de cabeza”, “ojos cansados” o “ansiedad”.',
          detalle: ['Normalización: minúsculas, sin acentos y sinónimos', 'Cada entidad se convierte en una variable del modelo', 'En el MVP: léxico de palabras clave en ml.js (pruébalo abajo)'] },
        { icon: 'fa-table', color: 'sky', titulo: 'Ingeniería de variables', tech: 'Supabase (PostgreSQL) · BigQuery',
          desc: 'Las respuestas se convierten en un vector numérico: pantalla, sueño, pausas, redes, carga y síntomas.',
          detalle: ['Tabla checkins: una fila por usuario y día', 'Variables derivadas: tendencia de 7 días y racha', 'Identificadores cifrados para el análisis anónimo'] },
        { icon: 'fa-diagram-project', color: 'orange', titulo: 'Modelo predictivo', tech: 'Vertex AI Endpoints',
          desc: 'Una regresión logística estima la probabilidad de desgaste y 5 riesgos asociados. Random Forest se evalúa como alternativa.',
          detalle: ['Entrenamiento con la encuesta del proyecto + check-ins', 'Métricas: AUC-ROC y recall en la clase de riesgo alto', 'Explicabilidad: contribución de cada variable'] },
        { icon: 'fa-wand-magic-sparkles', color: 'green', titulo: 'Recomendaciones', tech: 'Reglas + ranking',
          desc: 'Según la predicción y tus variables, se priorizan hábitos para bajar el cortisol y hábitos digitales a evitar.',
          detalle: ['Reglas transparentes y revisables por coordinadores', 'Retroalimentación: hábitos que agregas a tu plan', 'Mensaje central: descansar sin culpa'] },
        { icon: 'fa-chart-line', color: 'red', titulo: 'Analítica comunitaria', tech: 'BigQuery · Looker Studio',
          desc: 'Los check-ins se agregan de forma anónima para el dashboard de escuelas, familias y autoridades.',
          detalle: ['Solo se muestran grupos de 20 o más personas (k-anonimato)', 'Filtros por carrera, semestre y periodo', 'Alertas tempranas en semanas de exámenes'] }
    ],

    // Arquitectura cloud. estado: 'mvp' (ya se usa) o 'gcp' (propuesto)
    cloud: {
        capas: [
            { nombre: 'Cliente', nodos: ['usuarios', 'vercel'] },
            { nombre: 'Aplicación e IA', nodos: ['cloudrun', 'vertex', 'maps'] },
            { nombre: 'Datos', nodos: ['supabase', 'bigquery', 'storage'] }
        ],
        transversales: ['iam', 'logging', 'github'],
        nodos: {
            usuarios: { icon: 'fa-users', nombre: 'Estudiantes y escuelas', rol: 'Web y móvil', estado: 'mvp',
                desc: 'Estudiantes, familias, coordinadores y autoridades acceden desde el navegador; cada perfil ve solo lo que le corresponde.',
                detalle: ['Estudiante: check-in, racha, hábitos y amigos', 'Coordinador: dashboard agregado de su plantel', 'Autoridad educativa: indicadores por municipio'] },
            vercel: { icon: 'fa-rocket', nombre: 'Vercel', rol: 'Frontend (HTML, CSS, JS)', estado: 'mvp',
                desc: 'Hospeda la interfaz con despliegue automático desde GitHub y CDN global.',
                detalle: ['Deploy en cada push a main', 'Previews por rama para revisar cambios', 'Alternativa en GCP: Firebase Hosting'] },
            cloudrun: { icon: 'fa-server', nombre: 'Cloud Run', rol: 'API en contenedores', estado: 'gcp',
                desc: 'Backend en Node.js o Python (FastAPI) que recibe el check-in, llama a Vertex AI y guarda resultados.',
                detalle: ['Escala a cero cuando no hay tráfico (bajo costo)', 'Endpoints: /checkin, /prediccion, /dashboard', 'Alternativa: App Engine'] },
            vertex: { icon: 'fa-brain', nombre: 'Vertex AI', rol: 'Gemini + modelo de ML', estado: 'gcp',
                desc: 'Aloja el agente conversacional (Gemini) y el endpoint del modelo predictivo de desgaste.',
                detalle: ['Gemini para el diálogo y la extracción de síntomas', 'Endpoint del modelo (scikit-learn) con versiones', 'Model Monitoring para detectar cambios en los datos'] },
            maps: { icon: 'fa-map-location-dot', nombre: 'Maps API', rol: 'Mapa por plantel', estado: 'gcp',
                desc: 'Componente opcional: mapa de calor de la fatiga promedio por plantel o municipio para autoridades educativas.',
                detalle: ['Solo datos agregados, nunca ubicaciones individuales', 'Útil para planear campañas de bienestar', 'Fase 2 del proyecto'] },
            supabase: { icon: 'fa-database', nombre: 'Supabase · PostgreSQL', rol: 'Auth y base de datos', estado: 'mvp',
                desc: 'Guarda usuarios, check-ins, rachas, hábitos y amistades. Incluye autenticación y Row Level Security.',
                detalle: ['RLS: cada estudiante solo lee sus propios registros', 'Vistas agregadas para el dashboard anónimo', 'Migrable a Cloud SQL para PostgreSQL'] },
            bigquery: { icon: 'fa-chart-simple', nombre: 'BigQuery', rol: 'Analítica y entrenamiento', estado: 'gcp',
                desc: 'Almacén analítico con el histórico anonimizado; alimenta el dashboard y el reentrenamiento del modelo.',
                detalle: ['Carga diaria desde PostgreSQL', 'KPIs por carrera, semestre y periodo', 'BigQuery ML para prototipar modelos'] },
            storage: { icon: 'fa-box-archive', nombre: 'Cloud Storage', rol: 'Reportes y archivos', estado: 'gcp',
                desc: 'Reportes PDF semanales para escuelas, datasets de entrenamiento y archivos del modelo.',
                detalle: ['Reportes semanales automáticos', 'Versionado de datasets', 'Reglas para borrar datos antiguos'] },
            iam: { icon: 'fa-shield-halved', nombre: 'IAM / IAP', rol: 'Control de acceso', estado: 'gcp',
                desc: 'Define quién puede ver qué: estudiantes, coordinadores y administradores con permisos mínimos.',
                detalle: ['IAP protege el panel institucional', 'Cuentas de servicio con mínimo privilegio', 'Secret Manager para las llaves de API'] },
            logging: { icon: 'fa-wave-square', nombre: 'Logging y Monitoring', rol: 'Observabilidad', estado: 'gcp',
                desc: 'Registra errores, latencia de la API y uso del modelo, con alertas automáticas.',
                detalle: ['Alertas si la API falla o se vuelve lenta', 'Tableros de check-ins diarios', 'Auditoría de accesos a datos'] },
            github: { icon: 'fa-brands fa-github', nombre: 'GitHub + Cloud Build', rol: 'Código y CI/CD', estado: 'mvp',
                desc: 'Repositorio del proyecto; cada cambio dispara pruebas y despliegues.',
                detalle: ['Repositorio actual del equipo', 'GitHub Actions o Cloud Build para CI/CD', 'Imagen del backend en Artifact Registry'] }
        },
        flujo: [
            'El estudiante abre Kairós (Vercel) e inicia sesión con Supabase Auth.',
            'Responde el check-in; Gemini estructura sus respuestas en JSON.',
            'Cloud Run recibe el JSON y construye el vector de variables.',
            'Vertex AI devuelve la probabilidad de desgaste y los riesgos.',
            'El resultado se guarda en PostgreSQL y se actualiza la racha.',
            'Cada noche los datos anonimizados pasan a BigQuery para el dashboard.',
            'Logging y Monitoring vigilan errores, latencia y uso.'
        ]
    }
};
