// simple helper
async function fetchJson(url, opts = {}) {
  const res = await fetch(url, opts);
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

let chartCategoria = null;
let chartProducto = null;

function drawBarChart(ctx, labels, data, title) {
  if (ctx._chart) ctx._chart.destroy();
  ctx._chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: title,
        backgroundColor: '#2E7D32',
        data
      }]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });
  return ctx._chart;
}

async function loadData() {
  const from = document.getElementById('fromDate').value;
  const to = document.getElementById('toDate').value;
  const q = (p) => (p ? `?from=${from}&to=${to}` : '');

  try {
    const cat = await fetchJson(`/api/reportes/ventas/categoria/${q(true)}`);
    const labelsCat = cat.map(r => r.categoria);
    const dataCat = cat.map(r => r.total);
    const ctxC = document.getElementById('chartCategoria');
    drawBarChart(ctxC, labelsCat, dataCat, 'Ventas por categoría');

    const prod = await fetchJson(`/api/reportes/ventas/producto/${q(true)}`);
    const labelsP = prod.map(r => r.nombre);
    const dataP = prod.map(r => r.total);
    const ctxP = document.getElementById('chartProducto');
    drawBarChart(ctxP, labelsP, dataP, 'Ventas por producto');
  } catch (err) {
    console.error('loadData', err);
    alert('Error cargando datos. Revisa la consola.');
  }
}

async function requestExport(report_type) {
  const from = document.getElementById('fromDate').value;
  const to = document.getElementById('toDate').value;
  try {
    const res = await fetch('/api/reportes/export/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ report_type, params: { from, to } })
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    // poll status
    const id = data.id;
    const poll = setInterval(async () => {
      const status = await fetchJson(`/api/reportes/export/${id}/`);
      if (status.status === 'done') {
        clearInterval(poll);
        window.location.href = status.file_path;
      } else if (status.status === 'error') {
        clearInterval(poll);
        alert('Export failed: ' + (status.error || 'error'));
      }
    }, 2000);
  } catch (err) {
    console.error('requestExport', err);
    alert('Error solicitando exportación');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btnLoad').addEventListener('click', loadData);
  document.getElementById('btnExportCategoria').addEventListener('click', () => requestExport('ventas_por_categoria'));
  document.getElementById('btnExportProducto').addEventListener('click', () => requestExport('ventas_por_producto'));
  // initial load (last 30 days)
  const today = new Date();
  const prior = new Date(); prior.setDate(today.getDate()-30);
  document.getElementById('toDate').value = today.toISOString().slice(0,10);
  document.getElementById('fromDate').value = prior.toISOString().slice(0,10);
  loadData();
});