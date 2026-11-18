/* =========================================================
   Kairós · Agente de check-in (simulado)
   En producción, cada turno se enviaría a Gemini (Vertex AI)
   y la respuesta llegaría como JSON estructurado.
   ========================================================= */

const Agente = (() => {
    const preguntas = KAIROS_DATA.preguntas;
    let paso = 0, resp = {}, seleccion = new Set(), alTerminar = null, enCurso = false;

    const chat = () => document.getElementById('chat');
    const quick = () => document.getElementById('quick');
    const input = () => document.getElementById('chat-input');
    const enviar = () => document.getElementById('chat-send');
    const esperar = ms => new Promise(r => setTimeout(r, ms));

    function burbuja(clase, contenido, esHTML = false) {
        const div = document.createElement('div');
        div.className = `msg ${clase}`;
        if (esHTML) div.innerHTML = contenido; else div.textContent = contenido; // textContent evita inyectar HTML del usuario
        chat().appendChild(div);
        chat().scrollTop = chat().scrollHeight;
        return div;
    }

    // Muestra "escribiendo…" y luego el mensaje del bot
    async function bot(contenido, esHTML = false, ms = 650) {
        const escribiendo = burbuja('bot typing', '<span></span><span></span><span></span>', true);
        await esperar(ms);
        escribiendo.remove();
        burbuja('bot', contenido, esHTML);
    }

    function progreso() {
        document.getElementById('agent-step').textContent = `${paso}/${preguntas.length}`;
        document.getElementById('agent-bar').style.width = (paso / preguntas.length) * 100 + '%';
    }

    function bloquear(bloqueado, placeholder) {
        input().disabled = bloqueado;
        enviar().disabled = bloqueado;
        if (placeholder) input().placeholder = placeholder;
        if (!bloqueado) input().focus();
    }

    function chip(texto, accion, variante = '', valor = '') {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = `chip-opt ${variante}`;
        b.textContent = texto;
        b.dataset.v = valor;
        b.addEventListener('click', () => accion(b));
        quick().appendChild(b);
        return b;
    }

    async function iniciar(callback) {
        if (enCurso) return;
        enCurso = true; alTerminar = callback; paso = 0; resp = {};
        chat().innerHTML = ''; quick().innerHTML = '';
        progreso();
        await bot(`¡Hola, ${KAIROS_DATA.usuario.nombre}! 👋 Soy Kairós IA. Te haré ${preguntas.length} preguntas rápidas para estimar tu fatiga cognitiva. No hay respuestas buenas ni malas.`, false, 500);
        preguntar();
    }

    async function preguntar() {
        const q = preguntas[paso];
        quick().innerHTML = '';
        bloquear(true, 'Elige una opción…');
        await bot(q.texto);

        if (q.tipo === 'single') {
            q.opciones.forEach(o => chip(o.t, () => responder(q.id, o.v, o.t)));
        } else if (q.tipo === 'multi') {
            seleccion = new Set();
            q.opciones.forEach(o => chip(o.t, b => alternar(o.v, b), 'toggle', o.v));
            chip('Continuar →', b => confirmarMulti(q, b), 'primary');
        } else {
            bloquear(false, q.placeholder);
            chip('Omitir', () => responderTexto(''));
        }
    }

    function responder(id, valor, etiqueta) {
        resp[id] = valor;
        quick().innerHTML = '';
        burbuja('user', etiqueta);
        paso++; progreso();
        paso < preguntas.length ? preguntar() : finalizar();
    }

    // Selección múltiple de síntomas ("Ninguno" es excluyente)
    function alternar(valor, boton) {
        const toggles = [...quick().querySelectorAll('.toggle')];
        if (valor === 'ninguno') { seleccion.clear(); toggles.forEach(t => t.classList.remove('on')); }
        else { seleccion.delete('ninguno'); toggles.find(t => t.dataset.v === 'ninguno')?.classList.remove('on'); }
        if (seleccion.has(valor)) { seleccion.delete(valor); boton.classList.remove('on'); }
        else { seleccion.add(valor); boton.classList.add('on'); }
    }

    function confirmarMulti(q, boton) {
        if (!seleccion.size) { boton.classList.remove('shake'); void boton.offsetWidth; boton.classList.add('shake'); return; }
        const valores = [...seleccion].filter(v => v !== 'ninguno');
        const etiqueta = valores.length ? q.opciones.filter(o => valores.includes(o.v)).map(o => o.t).join(', ') : 'Ninguno';
        responder(q.id, valores, etiqueta);
    }

    async function responderTexto(texto) {
        bloquear(true, 'Analizando…');
        quick().innerHTML = '';
        resp.texto = texto;
        paso++; progreso();

        if (texto) {
            burbuja('user', texto);
            const entidades = KairosML.extraerEntidades(texto);
            // Los síntomas detectados se suman a los que eligió el usuario
            const sintomas = new Set(resp.sintomas || []);
            entidades.forEach(e => { if (['cabeza', 'ojos', 'concentracion', 'ansiedad'].includes(e.clave)) sintomas.add(e.clave); });
            resp.sintomas = [...sintomas];
            resp.extraNLP = entidades.filter(e => ['sueno', 'cansancio'].includes(e.clave)).length;

            if (entidades.length) {
                const chips = entidades.map(e => `<span class="ent">${e.etiqueta}</span>`).join('');
                await bot(`Gracias por contarme. Detecté estas señales en tu mensaje:<div class="ents">${chips}</div>`, true, 900);
            } else {
                await bot('Gracias por contarme. No detecté señales adicionales en tu mensaje.', false, 800);
            }
        }
        finalizar();
    }

    // Llamado desde el formulario del chat
    function enviarTexto() {
        const t = input().value.trim();
        if (!enCurso || input().disabled || !t) return;
        input().value = '';
        responderTexto(t);
    }

    async function finalizar() {
        bloquear(true, 'Check-in completado');
        await bot('<i class="fa-solid fa-microchip"></i> Ejecutando el modelo de Machine Learning con tus respuestas…', true, 700);
        await esperar(900);
        const r = KairosML.predecir(resp);
        const frase = r.burnout >= 0.6 ? 'Hoy tu cuerpo te pide un descanso, y está bien dárselo.'
                    : r.burnout >= 0.35 ? 'Vas acumulando fatiga; una pausa pronto te hará bien.'
                    : '¡Vas muy bien! Mantén tus pausas.';
        await bot(`Listo. Tu índice de desgaste es <b>${r.desgaste}/100</b>. ${frase} Abajo tienes tu análisis completo.`, true, 600);
        enCurso = false;
        chip('Ver mis hábitos recomendados', () => mostrarSeccion('habitos'), 'primary');
        alTerminar?.(r, { ...resp });
    }

    return { iniciar, enviarTexto, enCurso: () => enCurso };
})();
