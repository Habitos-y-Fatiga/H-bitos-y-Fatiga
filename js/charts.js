/* =========================================================
   Kairós · Gráficas (Chart.js)
   Cada función recibe datos ya calculados y dibuja/actualiza.
   ========================================================= */

const Charts = (() => {
    const C = { green: '#10b981', blue: '#3b82f6', sky: '#0ea5e9', orange: '#f97316', amber: '#f59e0b', red: '#ef4444', violet: '#8b5cf6', slate: '#cbd5e1' };
    const instancias = {};
    const disponible = typeof Chart !== 'undefined';

    if (disponible) {
        Chart.defaults.font.family = "'Plus Jakarta Sans', system-ui, sans-serif";
        Chart.defaults.color = '#64748b';
        Chart.defaults.plugins.legend.labels.usePointStyle = true;
        Chart.defaults.plugins.legend.labels.boxWidth = 8;
        Chart.defaults.plugins.tooltip.backgroundColor = '#0f172a';
        Chart.defaults.plugins.tooltip.padding = 10;
        Chart.defaults.plugins.tooltip.cornerRadius = 8;
    }

    // Crea la gráfica (o la reemplaza si ya existía)
    function dibujar(id, config) {
        const canvas = document.getElementById(id);
        if (!canvas) return;
        if (!disponible) {
            canvas.parentElement.innerHTML = '<p class="small muted">No se pudo cargar Chart.js. Revisa tu conexión a internet.</p>';
            return;
        }
        if (instancias[id]) instancias[id].destroy();
        config.options = { responsive: true, maintainAspectRatio: false, ...config.options };
        instancias[id] = new Chart(canvas, config);
    }

    // Relleno degradado vertical para gráficas de línea
    const degradado = color => ({ chart }) => {
        const { ctx, chartArea } = chart;
        if (!chartArea) return color + '22';
        const g = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
        g.addColorStop(0, color + '55');
        g.addColorStop(1, color + '00');
        return g;
    };
    const ejes = (extra = {}) => ({
        x: { grid: { display: false }, border: { display: false } },
        y: { grid: { color: '#eef2f0' }, border: { display: false }, beginAtZero: true, ...extra }
    });

    return {
        fatiga(labels, comunidad, tu) {
            const datasets = [{
                label: 'Comunidad', data: comunidad, borderColor: C.orange, backgroundColor: degradado(C.orange),
                fill: true, tension: .4, borderWidth: 2.5, pointRadius: 3, pointBackgroundColor: '#fff', pointBorderWidth: 2
            }];
            if (tu) datasets.push({ label: 'Tú (estimado hoy)', data: tu, borderColor: C.blue, borderDash: [6, 4], tension: .4, borderWidth: 2, pointRadius: 0, fill: false });
            dibujar('chart-fatiga', { type: 'line', data: { labels, datasets }, options: { scales: ejes({ max: 10 }), plugins: { legend: { position: 'bottom' } } } });
        },

        distractores(labels, data) {
            dibujar('chart-distractores', {
                type: 'doughnut',
                data: { labels, datasets: [{ data, backgroundColor: [C.red, C.amber, C.sky, C.violet, C.slate], borderWidth: 3, borderColor: '#fff', hoverOffset: 8 }] },
                options: { cutout: '68%', plugins: { legend: { position: 'right' }, tooltip: { callbacks: { label: c => ` ${c.label}: ${c.parsed}%` } } } }
            });
        },

        respuestas(labels, institucion, filtrado, etiquetaFiltro) {
            const datasets = [{ label: 'Toda la institución', data: institucion, backgroundColor: C.green, borderRadius: 8, maxBarThickness: 38 }];
            if (filtrado) datasets.push({ label: etiquetaFiltro, data: filtrado, backgroundColor: C.blue, borderRadius: 8, maxBarThickness: 38 });
            dibujar('chart-respuestas', {
                type: 'bar', data: { labels, datasets },
                options: { scales: ejes({ ticks: { callback: v => v + '%' } }), plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: c => ` ${c.dataset.label}: ${c.parsed.y}%` } } } }
            });
        },

        habitos(labels, comunidad, tu) {
            const datasets = [{ label: 'Comunidad', data: comunidad, borderColor: C.green, backgroundColor: C.green + '33', borderWidth: 2, pointBackgroundColor: C.green }];
            if (tu) datasets.push({ label: 'Tú', data: tu, borderColor: C.blue, backgroundColor: C.blue + '22', borderWidth: 2, pointBackgroundColor: C.blue });
            dibujar('chart-habitos', {
                type: 'radar', data: { labels, datasets },
                options: { scales: { r: { min: 0, max: 100, ticks: { display: false, stepSize: 25 }, grid: { color: '#e5ece9' }, angleLines: { color: '#e5ece9' }, pointLabels: { font: { size: 11, weight: 600 } } } }, plugins: { legend: { position: 'bottom' } } }
            });
        },

        comparacion(tu, comunidad) {
            dibujar('chart-comparacion', {
                type: 'bar',
                data: {
                    labels: ['Pantalla (h)', 'Sueño (h)', 'Redes (h)', 'Desgaste (/10)'],
                    datasets: [
                        { label: 'Tú', data: tu, backgroundColor: C.blue, borderRadius: 8, maxBarThickness: 30 },
                        { label: 'Comunidad', data: comunidad, backgroundColor: C.slate, borderRadius: 8, maxBarThickness: 30 }
                    ]
                },
                options: { scales: ejes(), plugins: { legend: { position: 'bottom' } } }
            });
        },

        pesos(items) {
            dibujar('chart-pesos', {
                type: 'bar',
                data: { labels: items.map(i => i.nombre), datasets: [{ data: items.map(i => i.peso), backgroundColor: items.map(i => (i.peso > 0 ? C.red : C.green)), borderRadius: 6, maxBarThickness: 26 }] },
                options: {
                    indexAxis: 'y',
                    scales: { x: { grid: { color: '#eef2f0' }, border: { display: false } }, y: { grid: { display: false }, border: { display: false } } },
                    plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => (c.parsed.x > 0 ? ' Aumenta el riesgo: +' : ' Protege: ') + c.parsed.x } } }
                }
            });
        }
    };
})();
