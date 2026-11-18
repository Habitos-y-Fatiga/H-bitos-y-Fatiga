/* =========================================================
   Kairós · Lógica principal de la interfaz
   Módulos: navegación, dashboard, racha, resultado, hábitos,
   amigos, IA aplicada y arquitectura cloud.
   ========================================================= */

/* ---------- Utilidades ---------- */
const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
const ico = n => (n.includes(' ') ? n : `fa-solid ${n}`);
const esc = t => String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pct = p => Math.round(p * 100);
const nivelRiesgo = p => (p >= 0.6 ? 'alto' : p >= 0.35 ? 'medio' : 'bajo');
const colorRiesgo = p => (p >= 0.6 ? 'var(--red)' : p >= 0.35 ? 'var(--amber)' : 'var(--green)');

function hoyISO() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
// Hash y generador pseudoaleatorio con semilla: mismos filtros = mismos datos
function hash(s) { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
function rng(seed) {
    return () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

function toast(mensaje, icono = 'fa-circle-check') {
    const t = $('#toast');
    t.innerHTML = `<i class="${ico(icono)}"></i>`;
    t.append(mensaje); // texto plano, seguro aunque venga del usuario
    t.classList.add('show');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => t.classList.remove('show'), 2800);
}

function animarNumero(el, fin, { dec = 0, suf = '', dur = 900 } = {}) {
    if (!el) return;
    const inicio = performance.now();
    const paso = ahora => {
        const k = Math.min(1, (ahora - inicio) / dur);
        const v = fin * (1 - Math.pow(1 - k, 3));
        el.textContent = v.toLocaleString('es-MX', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suf;
        if (k < 1) requestAnimationFrame(paso);
    };
    requestAnimationFrame(paso);
}

/* ---------- Estado persistente (localStorage) ---------- */
const Store = {
    clave: 'kairos-estado-v1',
    cargar() {
        const base = JSON.parse(JSON.stringify(KAIROS_DATA.estadoInicial));
        try { const raw = localStorage.getItem(this.clave); if (raw) return { ...base, ...JSON.parse(raw) }; } catch (e) { /* almacenamiento no disponible */ }
        return base;
    },
    guardar(e) { try { localStorage.setItem(this.clave, JSON.stringify(e)); } catch (err) { /* sin persistencia */ } },
    borrar() { try { localStorage.removeItem(this.clave); } catch (e) { /* nada */ } }
};
let estado = Store.cargar();
const guardar = () => Store.guardar(estado);

function actualizarHeader() {
    $('#top-racha b').textContent = estado.racha;
    $('#top-xp').textContent = estado.xp;
    $('#nav-racha').textContent = estado.racha;
}

/* ---------- Navegación ---------- */
const alMostrar = {
    inicio: () => Inicio.render(),
    dashboard: () => Dashboard.render(),
    racha: () => Racha.render(),
    habitos: () => Habitos.render(),
    amigos: () => Amigos.render(),
    ia: () => IA.render(),
    cloud: () => Cloud.render()
};

function mostrarSeccion(id) {
    const sec = document.getElementById(id);
    if (!sec || !sec.classList.contains('section')) return;
    $$('.section').forEach(s => s.classList.toggle('active', s === sec));
    $$('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.section === id));
    $('#page-title').textContent = sec.dataset.title;
    $('#page-sub').textContent = sec.dataset.sub;
    document.body.classList.remove('menu-open');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    history.replaceState(null, '', '#' + id);
    alMostrar[id]?.();
}

/* ---------- Inicio ---------- */
const Inicio = {
    render() {
        $$('#inicio [data-count]').forEach(el => animarNumero(el, +el.dataset.count, { dec: +(el.dataset.dec || 0), suf: el.dataset.suffix || '' }));
    }
};

/* ---------- Dashboard comunitario ---------- */
const Dashboard = {
    filtros: { periodo: 'semana', carrera: 'Todas', semestre: 'todos', pregunta: 'pantalla' },
    listo: false,

    init() {
        $('#f-carrera').innerHTML = KAIROS_DATA.carreras.map(c => `<option>${c}</option>`).join('');
        $('#f-pregunta').innerHTML = Object.entries(KAIROS_DATA.comunidad.respuestas).map(([k, v]) => `<option value="${k}">${v.titulo}</option>`).join('');
        $$('#f-periodo button').forEach(b => b.addEventListener('click', () => {
            $$('#f-periodo button').forEach(x => x.classList.toggle('active', x === b));
            this.filtros.periodo = b.dataset.v; this.render();
        }));
        $('#f-carrera').addEventListener('change', e => { this.filtros.carrera = e.target.value; this.render(); });
        $('#f-semestre').addEventListener('change', e => { this.filtros.semestre = e.target.value; this.render(); });
        $('#f-pregunta').addEventListener('change', e => { this.filtros.pregunta = e.target.value; this.renderRespuestas(); });
        this.listo = true;
    },

    // Factor de ajuste según los filtros (simula consultas distintas a la base de datos)
    factor() {
        const fl = this.filtros;
        let f = { semana: 1, mes: 0.95, finales: 1.2 }[fl.periodo];
        if (fl.carrera !== 'Todas') f *= 0.88 + (hash(fl.carrera) % 26) / 100;
        if (fl.semestre !== 'todos') f *= 0.92 + (hash(fl.semestre) % 17) / 100;
        return f;
    },
    hayFiltro() { const fl = this.filtros; return fl.carrera !== 'Todas' || fl.semestre !== 'todos' || fl.periodo !== 'semana'; },
    etiquetaFiltro() {
        const fl = this.filtros;
        return [fl.carrera !== 'Todas' ? fl.carrera : null, fl.semestre !== 'todos' ? `${fl.semestre}.º sem.` : null, fl.periodo !== 'semana' ? (fl.periodo === 'mes' ? 'Mes' : 'Finales') : null].filter(Boolean).join(' · ');
    },

    render() {
        if (!this.listo) this.init();
        const C = KAIROS_DATA.comunidad, fl = this.filtros, f = this.factor();
        const tamano = (fl.carrera === 'Todas' ? 1 : 0.14) * (fl.semestre === 'todos' ? 1 : 0.3) * (fl.periodo === 'finales' ? 1.2 : 1);
        const v = {
            fatiga: Math.min(9.6, C.kpis.fatiga * f),
            pantalla: C.kpis.pantalla * (0.55 + 0.45 * f),
            sueno: C.kpis.sueno / (0.7 + 0.3 * f),
            rachas: Math.round(C.kpis.rachas * tamano),
            checkins: Math.round(C.kpis.checkins * tamano)
        };
        const defs = [
            { k: 'fatiga',   titulo: 'Fatiga promedio',  icon: 'fa-battery-quarter',       color: 'orange', dec: 1, suf: '/10', subeEsBueno: false },
            { k: 'pantalla', titulo: 'Pantalla diaria',  icon: 'fa-mobile-screen-button', color: 'blue',   dec: 1, suf: ' h',  subeEsBueno: false },
            { k: 'sueno',    titulo: 'Sueño promedio',   icon: 'fa-moon',                  color: 'violet', dec: 1, suf: ' h',  subeEsBueno: true },
            { k: 'rachas',   titulo: 'Rachas activas',   icon: 'fa-fire',                  color: 'amber',  dec: 0, suf: '',    subeEsBueno: true },
            { k: 'checkins', titulo: 'Check-ins hoy',    icon: 'fa-clipboard-check',       color: 'green',  dec: 0, suf: '',    subeEsBueno: true }
        ];
        $('#kpis').innerHTML = defs.map(d => {
            const t = Math.round(C.tendencias[d.k] * (d.k === 'fatiga' ? f : 1));
            const bueno = d.subeEsBueno ? t >= 0 : t <= 0;
            return `<div class="panel kpi lift">
                <div class="kpi-top"><span class="ic ic-${d.color}"><i class="${ico(d.icon)}"></i></span>
                <span class="trend ${bueno ? 'good' : 'bad'}"><i class="fa-solid fa-arrow-${t >= 0 ? 'up' : 'down'}"></i> ${Math.abs(t)}%</span></div>
                <span class="kpi-title">${d.titulo}</span><span class="kpi-val" data-k="${d.k}">0</span></div>`;
        }).join('');
        defs.forEach(d => animarNumero($(`.kpi-val[data-k="${d.k}"]`), v[d.k], { dec: d.dec, suf: d.suf }));

        // Gráficas
        const r = estado.resultado;
        const fatiga = C.fatigaHora.map(x => +Math.min(10, x * f).toFixed(1));
        const tu = r ? C.fatigaHora.map(x => +Math.min(10, x * (0.45 + r.desgaste / 80)).toFixed(1)) : null;
        Charts.fatiga(C.horas, fatiga, tu);
        Charts.distractores(C.distractores.labels, C.distractores.data.map((x, i) => (i === 0 ? Math.round(x * f) : x)));
        this.renderRespuestas();
        Charts.habitos(C.habitos.labels, C.habitos.data.map(x => Math.round(Math.min(95, x / f))), r ? this.habitosUsuario(r.f) : null);
        this.renderTabla();
    },

    renderRespuestas() {
        const q = KAIROS_DATA.comunidad.respuestas[this.filtros.pregunta];
        const filtrado = this.hayFiltro() ? this.desplazar(q, this.factor()) : null;
        Charts.respuestas(q.labels, q.data, filtrado, this.etiquetaFiltro());
    },

    // Desplaza la distribución de respuestas hacia más o menos fatiga
    desplazar(q, f) {
        if (q.dir === 0) return q.data.map(x => Math.round(Math.min(95, x * f)));
        const medio = (q.data.length - 1) / 2;
        const w = q.data.map((x, i) => x * Math.pow(f, (i - medio) * 1.6 * q.dir));
        const total = w.reduce((a, b) => a + b, 0);
        return w.map(x => Math.round((x / total) * 100));
    },

    // Traduce las respuestas del usuario a la escala del radar (0-100)
    habitosUsuario(f) {
        return [
            Math.round((f.pausas / 3) * 100),
            f.sueno >= 7 ? 90 : f.sueno >= 6 ? 55 : 20,
            f.sueno >= 7 ? 70 : 30,
            f.redes <= 1.5 ? 85 : f.redes <= 3 ? 45 : 15,
            50,
            f.concentracion ? 25 : 65
        ];
    },

    renderTabla() {
        const fl = this.filtros, f = this.factor();
        const aleatorio = rng(hash(JSON.stringify(fl)));
        const carreras = KAIROS_DATA.carreras.slice(1);
        const filas = Array.from({ length: 8 }, () => {
            const fat = Math.min(9.8, Math.max(1.5, (3.8 + aleatorio() * 5) * f));
            const pan = Math.max(2, Math.min(13, fat * 0.9 + aleatorio() * 3));
            const sue = Math.max(4, Math.min(8.5, 9 - fat * 0.4 - aleatorio() * 1.2));
            const id = '#' + Math.floor(aleatorio() * 0xffffff).toString(16).padStart(6, '0').toUpperCase();
            const car = fl.carrera === 'Todas' ? carreras[Math.floor(aleatorio() * carreras.length)] : fl.carrera;
            const [a, b] = fl.semestre === 'todos' ? [1, 9] : fl.semestre.split('-').map(Number);
            const sem = a + Math.floor(aleatorio() * (b - a + 1));
            const racha = Math.floor(aleatorio() * 25);
            const nivel = fat >= 7.5 ? 'alto' : fat >= 5 ? 'medio' : 'bajo';
            return `<tr>
                <td class="mono">${id}</td><td>${car}</td><td>${sem}.º</td>
                <td><span class="mini-bar"><i style="width:${fat * 10}%;background:${colorRiesgo(fat / 10)}"></i></span>${fat.toFixed(1)}</td>
                <td>${pan.toFixed(1)} h</td><td>${sue.toFixed(1)} h</td>
                <td><i class="fa-solid fa-fire" style="color:var(--orange)"></i> ${racha}</td>
                <td><span class="risk ${nivel}">${nivel[0].toUpperCase() + nivel.slice(1)}</span></td></tr>`;
        });
        $('#tabla-anon').innerHTML = filas.join('');
    }
};

/* ---------- Mi racha ---------- */
const Racha = {
    render() {
        const hecho = estado.ultimoCheckin === hoyISO();
        $('#racha-num').textContent = estado.racha;

        // Últimos 7 días (6 del historial + hoy)
        const letras = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
        const hoy = new Date();
        $('#week').innerHTML = [...estado.historial, hecho].map((ok, i) => {
            const d = new Date(hoy); d.setDate(hoy.getDate() - (6 - i));
            return `<div class="day ${ok ? 'done' : ''} ${i === 6 ? 'today' : ''}"><span>${i === 6 ? 'Hoy' : letras[d.getDay()]}</span><i class="fa-solid ${ok ? 'fa-fire' : 'fa-circle'}"></i></div>`;
        }).join('');

        // Nivel y XP (200 XP por nivel)
        const resto = estado.xp % 200;
        $('#nivel').textContent = Math.floor(estado.xp / 200) + 1;
        $('#xp-txt').textContent = `${resto}/200 XP`;
        setTimeout(() => { $('#xp-bar').style.width = resto / 2 + '%'; }, 60);

        $('#btn-checkin').innerHTML = hecho ? '<i class="fa-solid fa-rotate"></i> Repetir mi check-in' : '<i class="fa-solid fa-robot"></i> Hacer mi check-in de hoy';
        $('#checkin-estado').innerHTML = hecho
            ? '<i class="fa-solid fa-circle-check" style="color:var(--green)"></i>¡Check-in de hoy completado! Tu racha está a salvo.'
            : '<i class="fa-solid fa-triangle-exclamation" style="color:var(--orange)"></i>Aún no haces tu check-in de hoy. ¡No pierdas tu racha!';

        $('#insignias').innerHTML = KAIROS_DATA.insignias.map(i => {
            const on = i.meta(estado);
            return `<div class="insignia ${on ? 'on' : ''}" title="${i.desc}"><i class="${ico(i.icon)}"></i><b>${i.nombre}</b><small>${on ? 'Desbloqueada' : i.desc}</small></div>`;
        }).join('');

        if (estado.resultado && !Agente.enCurso()) Resultado.render(estado.resultado);
    },

    iniciarCheckin() {
        if (Agente.enCurso()) return;
        $('#resultado').classList.add('hidden');
        $('#agent').scrollIntoView({ behavior: 'smooth', block: 'start' });
        Agente.iniciar(completarCheckin);
    }
};

function completarCheckin(resultado, respuestas) {
    const nuevo = estado.ultimoCheckin !== hoyISO();
    if (nuevo) { estado.racha += 1; estado.xp += 50; estado.ultimoCheckin = hoyISO(); }
    estado.resultado = resultado;
    estado.respuestas = respuestas;
    guardar();
    actualizarHeader();
    Racha.render();
    if (nuevo) {
        const n = $('#racha-num');
        n.classList.remove('bump'); void n.offsetWidth; n.classList.add('bump');
        toast(`¡Racha de ${estado.racha} días! +50 XP`, 'fa-fire');
    }
    setTimeout(() => $('#resultado').scrollIntoView({ behavior: 'smooth', block: 'start' }), 500);
}

/* ---------- Resultado del modelo ---------- */
const VEREDICTOS = {
    alto:  { titulo: 'Necesitas descansar ahora, y está bien.', texto: 'Tu nivel de desgaste es alto. Un descanso real ahora te hará rendir más después que seguir forzándote.', min: 30, cortisol: 'Alto' },
    medio: { titulo: 'Tómate una pausa pronto.', texto: 'Vas acumulando fatiga. Una pausa sin pantallas en la próxima hora te ayudará a recuperar el enfoque.', min: 15, cortisol: 'Moderado' },
    bajo:  { titulo: '¡Vas muy bien! Sigue así.', texto: 'Tu desgaste es bajo. Mantén tus pausas regulares para que siga así toda la semana.', min: 10, cortisol: 'Bajo' }
};

const Resultado = {
    render(r) {
        const nivel = nivelRiesgo(r.burnout);
        const V = VEREDICTOS[nivel];
        const suben = r.contribuciones.filter(c => c.v > 0.05).slice(0, 3);
        const protegen = r.contribuciones.filter(c => c.v < -0.05).slice(0, 3);
        const el = $('#resultado');
        el.classList.remove('hidden');
        el.innerHTML = `
            <div class="result-head">
                <h3><i class="fa-solid fa-microchip"></i> Tu análisis de hoy</h3>
                <span class="badge badge-blue"><i class="fa-solid fa-diagram-project"></i> Regresión logística v1.2 · datos simulados</span>
            </div>
            <div class="result-grid">
                <div class="panel verdict ${nivel}">
                    <div class="gauge"><span>${r.desgaste}<small>de 100</small></span></div>
                    <div>
                        <h4>${V.titulo}</h4>
                        <p>${V.texto}</p>
                        <button class="btn btn-primary" id="btn-descanso"><i class="fa-solid fa-mug-hot"></i> Iniciar descanso de ${V.min} min</button>
                    </div>
                </div>
                <div class="panel">
                    <div class="metric">
                        <div class="metric-head"><span>Probabilidad de burnout</span><b>${pct(r.burnout)}%</b></div>
                        <div class="bar"><div class="bar-fill" data-w="${pct(r.burnout)}" style="background:${colorRiesgo(r.burnout)}"></div></div>
                    </div>
                    <div class="metric">
                        <div class="metric-head"><span>Nivel de cortisol estimado</span><b>${V.cortisol}</b></div>
                        <div class="bar"><div class="bar-fill" data-w="${Math.max(18, pct(r.burnout))}" style="background:linear-gradient(90deg,var(--green),var(--amber),var(--red))"></div></div>
                    </div>
                    <span class="small muted">Lo que más sube tu riesgo</span>
                    <div class="factors">${suben.map(c => `<span class="factor up"><i class="fa-solid fa-arrow-up"></i> ${c.nombre}</span>`).join('') || '<span class="small muted">Nada destacable</span>'}</div>
                    <span class="small muted" style="display:block;margin-top:.8rem">Lo que te protege</span>
                    <div class="factors">${protegen.map(c => `<span class="factor down"><i class="fa-solid fa-shield-heart"></i> ${c.nombre}</span>`).join('') || '<span class="small muted">Aún nada: ¡empieza con una pausa!</span>'}</div>
                </div>
                <div class="panel">
                    <div class="panel-head"><h3>Riesgos que podrías desarrollar</h3></div>
                    <ul class="risk-list">${r.riesgos.map(x => `
                        <li class="risk-item">
                            <span class="ic ic-${nivelRiesgo(x.p) === 'alto' ? 'red' : nivelRiesgo(x.p) === 'medio' ? 'amber' : 'green'}"><i class="${ico(x.icon)}"></i></span>
                            <div><b>${x.nombre}</b><div class="bar thin"><div class="bar-fill" data-w="${pct(x.p)}" style="background:${colorRiesgo(x.p)}"></div></div></div>
                            <span>${pct(x.p)}%</span>
                        </li>`).join('')}
                    </ul>
                </div>
                <div class="panel">
                    <div class="panel-head"><h3>Tú vs. la comunidad</h3><span class="muted small">Promedios anónimos</span></div>
                    <div class="chart-wrap" style="height:240px"><canvas id="chart-comparacion"></canvas></div>
                </div>
            </div>
            <p class="disclaimer"><i class="fa-solid fa-circle-info"></i> Kairós no sustituye una valoración médica o psicológica. Si el malestar persiste, acude a los servicios de salud de tu facultad.</p>
            <div class="result-cta">
                <button class="btn btn-soft" data-go="habitos"><i class="fa-solid fa-seedling"></i> Ver mis hábitos recomendados</button>
                <button class="btn btn-ghost" data-go="dashboard"><i class="fa-solid fa-chart-column"></i> Compararme en el dashboard</button>
            </div>`;

        setTimeout(() => {
            $('.gauge', el).style.setProperty('--val', r.desgaste);
            $$('.bar-fill[data-w]', el).forEach(b => { b.style.width = b.dataset.w + '%'; });
        }, 60);
        const C = KAIROS_DATA.comunidad.kpis;
        Charts.comparacion([r.f.pantalla, r.f.sueno, r.f.redes, +(r.desgaste / 10).toFixed(1)], [C.pantalla, C.sueno, 2.6, C.fatiga]);
        $('#btn-descanso').addEventListener('click', () => Descanso.alternar(V.min));
        if (Descanso.timer) Descanso.tick();
    }
};

/* Temporizador de descanso: al terminar suma un descanso y XP */
const Descanso = {
    timer: null, fin: 0, inicio: 0,
    alternar(min) {
        if (this.timer) return this.terminar();
        this.inicio = Date.now();
        this.fin = this.inicio + min * 60000;
        this.tick();
        this.timer = setInterval(() => this.tick(), 1000);
        toast('Descanso iniciado. Aléjate de la pantalla 🌿', 'fa-leaf');
    },
    tick() {
        const s = Math.max(0, Math.round((this.fin - Date.now()) / 1000));
        const b = $('#btn-descanso');
        if (b) b.innerHTML = `<i class="fa-solid fa-stop"></i> <span class="timer">${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}</span> · Terminar`;
        if (s <= 0) this.terminar();
    },
    terminar() {
        clearInterval(this.timer); this.timer = null;
        estado.descansos += 1;
        estado.xp += 20;
        estado.minutosSinPantalla += Math.max(1, Math.round((Date.now() - this.inicio) / 60000));
        guardar(); actualizarHeader();
        const b = $('#btn-descanso');
        if (b) { b.innerHTML = '<i class="fa-solid fa-check"></i> Descanso registrado'; b.disabled = true; }
        toast('Descanso registrado, sin culpa. +20 XP', 'fa-mug-hot');
    }
};

/* ---------- Hábitos ---------- */
const Habitos = {
    render() {
        const r = estado.resultado, f = r?.f, p = r?.burnout ?? 0;
        $('#habitos-aviso').innerHTML = r
            ? `<span class="ic ic-green"><i class="fa-solid fa-wand-magic-sparkles"></i></span>
               <p><b>Recomendaciones personalizadas</b> a partir de tu último check-in (desgaste ${r.desgaste}/100). Los marcados como <span class="tag tag-green">Para ti</span> responden a tus respuestas.</p>
               <button class="btn btn-ghost btn-sm" data-go="racha"><i class="fa-solid fa-rotate"></i> Actualizar check-in</button>`
            : `<span class="ic ic-orange"><i class="fa-solid fa-circle-info"></i></span>
               <p><b>Estas son recomendaciones generales.</b> Completa tu check-in para que el modelo las ordene según tu nivel de fatiga.</p>
               <button class="btn btn-fire btn-sm" data-go="racha"><i class="fa-solid fa-robot"></i> Hacer check-in</button>`;

        const ordenar = lista => lista.map(h => ({ ...h, match: f ? !!h.cuando(f, p) : false })).sort((a, b) => b.match - a.match);
        const tarjeta = (h, tipo) => {
            const enPlan = estado.plan.includes(h.id);
            return `<article class="habit ${tipo} ${h.match ? 'match' : ''}">
                <span class="ic"><i class="${ico(h.icon)}"></i></span>
                <div class="habit-body">
                    <div class="habit-top"><h4>${h.titulo}</h4>
                        ${h.match ? `<span class="tag ${tipo === 'hacer' ? 'tag-green' : 'tag-red'}">Para ti</span>` : ''}
                        ${h.impacto ? `<span class="tag">Impacto ${h.impacto.toLowerCase()}</span>` : ''}</div>
                    <p>${h.desc}</p>
                </div>
                ${tipo === 'hacer' ? `<button class="add-btn ${enPlan ? 'on' : ''}" data-habito="${h.id}" title="${enPlan ? 'Quitar de mi plan' : 'Agregar a mi plan'}"><i class="fa-solid ${enPlan ? 'fa-check' : 'fa-plus'}"></i></button>` : ''}
            </article>`;
        };
        $('#habitos-hacer').innerHTML = ordenar(KAIROS_DATA.habitos.hacer).map(h => tarjeta(h, 'hacer')).join('');
        $('#habitos-evitar').innerHTML = ordenar(KAIROS_DATA.habitos.evitar).map(h => tarjeta(h, 'evitar')).join('');

        const enPlan = KAIROS_DATA.habitos.hacer.filter(h => estado.plan.includes(h.id));
        $('#plan').innerHTML = `
            <div class="panel-head"><h3><i class="fa-solid fa-list-check" style="color:var(--green)"></i> Mi plan de hoy</h3><span class="badge badge-green">${enPlan.length} hábito${enPlan.length === 1 ? '' : 's'}</span></div>
            ${enPlan.length
                ? `<div class="plan-list">${enPlan.map(h => `<span class="chip"><i class="${ico(h.icon)}"></i> ${h.titulo}</span>`).join('')}</div>`
                : '<p class="small muted">Usa el botón <b>+</b> en los hábitos de la izquierda para armar tu plan del día.</p>'}`;
    },
    alternar(id) {
        const i = estado.plan.indexOf(id);
        if (i >= 0) estado.plan.splice(i, 1);
        else { estado.plan.push(id); estado.xp += 5; toast('Hábito agregado a tu plan. +5 XP', 'fa-seedling'); }
        guardar(); actualizarHeader(); this.render();
    }
};

/* ---------- Amigos y retos ---------- */
const Amigos = {
    metrica: 'racha',
    render() {
        const m = this.metrica;
        const yo = { nombre: 'Tú', ini: KAIROS_DATA.usuario.iniciales, color: '#10b981', racha: estado.racha, tareas: estado.tareas, descansos: estado.descansos, sinPantalla: estado.minutosSinPantalla, yo: true };
        const lista = [...KAIROS_DATA.amigos, yo].sort((a, b) => b[m] - a[m]);
        const unidad = { racha: 'días', tareas: 'tareas', descansos: 'descansos', sinPantalla: 'min' }[m];
        const max = lista[0][m] || 1;
        const medallas = ['🥇', '🥈', '🥉'];
        $('#leaderboard').innerHTML = lista.map((a, i) => `
            <li class="lb-row ${a.yo ? 'me' : ''}" style="animation-delay:${i * 40}ms">
                <span class="lb-pos">${medallas[i] || i + 1}</span>
                <span class="avatar sm" style="background:${a.color}">${a.ini}</span>
                <div class="lb-info"><b>${a.nombre}</b><div class="bar thin"><div class="bar-fill" style="width:${(a[m] / max) * 100}%"></div></div></div>
                <span class="lb-val">${a[m]} <small>${unidad}</small></span>
            </li>`).join('');

        $('#retos').innerHTML = KAIROS_DATA.retos.map(r => {
            const actual = Math.min(r.meta, r.actual(estado));
            const completo = actual >= r.meta;
            return `<div class="reto ${completo ? 'completo' : ''}">
                <div class="reto-top"><span class="ic ic-${r.color}"><i class="${ico(completo ? 'fa-trophy' : r.icon)}"></i></span><b>${r.titulo}</b></div>
                <div class="bar"><div class="bar-fill" style="width:${(actual / r.meta) * 100}%"></div></div>
                <div class="reto-meta"><span>${actual}/${r.meta} ${r.unidad}</span><span>${completo ? '¡Completado!' : '+' + r.xp + ' XP'}</span></div>
            </div>`;
        }).join('');

        $('#pendientes').innerHTML = estado.invitaciones.map(n => `<li><span><i class="fa-solid fa-user-clock" style="color:var(--amber)"></i> ${esc(n)}</span><span class="tag">Pendiente</span></li>`).join('');
    },
    registrar(tipo) {
        if (tipo === 'tarea') { estado.tareas += 1; estado.xp += 10; toast('¡Tarea terminada! +10 XP', 'fa-check-double'); }
        else { estado.descansos += 1; estado.minutosSinPantalla += 10; estado.xp += 10; toast('Descanso registrado, sin culpa. +10 XP', 'fa-mug-hot'); }
        guardar(); actualizarHeader(); this.render();
    },
    invitar(nombre) {
        if (!nombre) return;
        if (estado.invitaciones.includes(nombre)) { toast('Ya invitaste a esa persona', 'fa-circle-info'); return; }
        estado.invitaciones.unshift(nombre);
        guardar(); this.render();
        toast(`Invitación enviada a ${nombre}`, 'fa-paper-plane');
    }
};

/* ---------- IA aplicada ---------- */
const IA = {
    listo: false,
    render() {
        if (!this.listo) {
            $('#pipeline').innerHTML = KAIROS_DATA.pipeline.map((p, i) => `
                <article class="panel pipe lift">
                    <span class="pipe-n">0${i + 1}</span>
                    <div class="pipe-head"><span class="ic ic-${p.color}"><i class="${ico(p.icon)}"></i></span><div><h4>${p.titulo}</h4><span class="tech">${p.tech}</span></div></div>
                    <p>${p.desc}</p>
                    <div class="pipe-more"><ul>${p.detalle.map(d => `<li>${d}</li>`).join('')}</ul></div>
                    <span class="pipe-toggle">Ver detalle <i class="fa-solid fa-chevron-down"></i></span>
                </article>`).join('');
            $('#pipeline').addEventListener('click', e => e.target.closest('.pipe')?.classList.toggle('open'));
            $('#nlp-btn').addEventListener('click', () => this.nlp());
            this.nlp();
            this.listo = true;
        }
        Charts.pesos(KairosML.importancia());
    },
    nlp() {
        const entidades = KairosML.extraerEntidades($('#nlp-input').value);
        const json = JSON.stringify({ sintomas: entidades.map(e => e.clave), total: entidades.length }, null, 2);
        $('#nlp-out').innerHTML = entidades.length
            ? `<span class="small muted">Entidades detectadas:</span><div class="ents">${entidades.map(e => `<span class="ent">${e.etiqueta}</span>`).join('')}</div>
               <pre class="code" style="margin-top:.8rem">${esc(json)}</pre>`
            : '<p class="small muted">No se detectaron síntomas. Prueba con palabras como “cansado”, “ojos”, “ansiedad” o “no puedo dormir”.</p>';
    }
};

/* ---------- Arquitectura cloud ---------- */
const Cloud = {
    listo: false,
    render() {
        if (this.listo) return;
        const C = KAIROS_DATA.cloud;
        const nodo = id => {
            const n = C.nodos[id];
            return `<button class="node ${n.estado}" data-node="${id}"><span class="ic"><i class="${ico(n.icon)}"></i></span><span><b>${n.nombre}</b><small>${n.rol}</small></span></button>`;
        };
        $('#arch').innerHTML = C.capas.map(c => `<div class="layer"><span class="layer-title">${c.nombre}</span>${c.nodos.map(nodo).join('')}</div>`).join('');
        $('#arch-cross').innerHTML = C.transversales.map(nodo).join('');
        $('#flow').innerHTML = C.flujo.map(p => `<li>${p}</li>`).join('');
        $('#cloud').addEventListener('click', e => { const b = e.target.closest('[data-node]'); if (b) this.detalle(b.dataset.node); });
        this.detalle('cloudrun');
        this.listo = true;
    },
    detalle(id) {
        const n = KAIROS_DATA.cloud.nodos[id];
        const mvp = n.estado === 'mvp';
        $$('.node').forEach(b => b.classList.toggle('selected', b.dataset.node === id));
        $('#arch-detalle').innerHTML = `
            <div class="panel-head">
                <div style="display:flex;gap:.8rem;align-items:center"><span class="ic ${mvp ? 'ic-green' : 'ic-blue'}"><i class="${ico(n.icon)}"></i></span>
                <div><h3>${n.nombre}</h3><span class="small muted">${n.rol}</span></div></div>
                <span class="badge ${mvp ? 'badge-green' : 'badge-blue'}">${mvp ? 'Activo en el MVP' : 'Propuesto en GCP'}</span>
            </div>
            <p>${n.desc}</p>
            <ul class="detail-list">${n.detalle.map(d => `<li><i class="fa-solid fa-check"></i><span>${d}</span></li>`).join('')}</ul>`;
    }
};

/* ---------- Eventos globales e inicio ---------- */
document.addEventListener('DOMContentLoaded', () => {
    actualizarHeader();

    // Navegación: cualquier elemento con data-section o data-go
    document.addEventListener('click', e => {
        const nav = e.target.closest('[data-section], [data-go]');
        if (nav) mostrarSeccion(nav.dataset.section || nav.dataset.go);
        const hab = e.target.closest('[data-habito]');
        if (hab) Habitos.alternar(hab.dataset.habito);
    });

    // Menú móvil
    $('#menu-btn').addEventListener('click', () => document.body.classList.toggle('menu-open'));
    $('#overlay').addEventListener('click', () => document.body.classList.remove('menu-open'));

    // Check-in
    $('#btn-checkin').addEventListener('click', () => Racha.iniciarCheckin());
    $('#chat-form').addEventListener('submit', e => { e.preventDefault(); Agente.enviarTexto(); });

    // Amigos
    $$('#lb-metrica button').forEach(b => b.addEventListener('click', () => {
        $$('#lb-metrica button').forEach(x => x.classList.toggle('active', x === b));
        Amigos.metrica = b.dataset.v; Amigos.render();
    }));
    $('#add-tarea').addEventListener('click', () => Amigos.registrar('tarea'));
    $('#add-descanso').addEventListener('click', () => Amigos.registrar('descanso'));
    $('#invite-form').addEventListener('submit', e => {
        e.preventDefault();
        Amigos.invitar($('#invite-input').value.trim().slice(0, 40));
        $('#invite-input').value = '';
    });
    $('#copy-link').addEventListener('click', async () => {
        const link = `${location.origin}${location.pathname}?invita=${KAIROS_DATA.usuario.iniciales}-${hash(hoyISO()).toString(36).slice(0, 4).toUpperCase()}`;
        try { await navigator.clipboard.writeText(link); toast('Enlace de invitación copiado', 'fa-link'); }
        catch (e) { toast('Copia este enlace: ' + link, 'fa-link'); }
    });

    // Reiniciar la demo (útil para presentar)
    $('#reset-demo').addEventListener('click', () => { Store.borrar(); location.hash = ''; location.reload(); });

    // Sección inicial (respeta el #hash de la URL)
    const inicial = location.hash.slice(1);
    mostrarSeccion(document.getElementById(inicial)?.classList.contains('section') ? inicial : 'inicio');
});
