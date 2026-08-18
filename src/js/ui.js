/* CAPA DE PANTALLA — todo lo que toca el DOM vive aquí y solo aquí.
   Hasta Dónde — https://github.com/  ·  licencia MIT  */

import { CONFIG, RANGO_DEDUCIBLE, cop, copCorto } from './config.js';
import { calcular, calcularRango } from './motor.js';
import { RAMOS } from './catalogo.js';
import { GLOSARIO } from './glosario.js';
import { CLAUSULADOS_SEED } from './clausulados.js';
import { PLAZOS } from './plazos.js';
import { ASESOR, DOCUMENTOS, PROCESO } from './asesor.js';

function pintarCinta(elCinta, elRegla, r) {
  const T = Math.max(r.perdida, 1);
  const seg = [
    { c:'d', v: r.deducible,      t:'Deducible' },
    { c:'i', v: r.porInfraseguro, t:'Infraseguro' },
    { c:'x', v: r.porTope || 0,    t:'Sobre el límite' },
    { c:'r', v: r.indemnizacion,  t:'Recibes' }
  ].filter(s => s.v > 0);

  elCinta.innerHTML = seg.map(s => {
    const pc = s.v / T * 100;
    return `<div class="seg ${s.c}" style="width:${pc}%" title="${s.t}: ${cop(s.v)}">
      <span>${pc > 22 ? s.t + ' ' + copCorto(s.v) : (pc > 9 ? copCorto(s.v) : '')}</span></div>`;
  }).join('') || '<div class="seg d" style="width:100%"><span>Sin datos</span></div>';

  if (elRegla) {
    let h = '';
    for (let i = 0; i <= 20; i++) {
      const may = i % 5 === 0;
      h += `<i class="${may?'mayor':''}" style="left:${i*5}%;height:${may?12:6}px"></i>`;
    }
    elRegla.innerHTML = h;
  }
}

(function heroDemo(){
  const r = calcular({ perdida:80e6, valorAsegurado:2000e6, valorReal:2000e6,
                       baseDeducible:'valorAsegurado', dedPct:2, dedMinSMMLV:3 });
  pintarCinta(document.getElementById('heroCinta'), document.getElementById('heroRegla'), r);
  document.getElementById('heroSub').textContent =
    `Edificio asegurado en $2.000 M · deducible 2% del valor asegurado · recibes ${cop(r.indemnizacion)}`;
})();

/* ============================================================
   4. COMPARADOR DE DEDUCIBLES
   ============================================================ */
(function susto(){
  const sVal=document.getElementById('sVal'), sPer=document.getElementById('sPer'), sDed=document.getElementById('sDed');
  function upd(){
    const VA = +sVal.value * 1e6, P = +sPer.value * 1e6, pct = +sDed.value;
    document.getElementById('sValTxt').textContent = cop(VA);
    document.getElementById('sPerTxt').textContent = cop(P);
    document.getElementById('sDedTxt').textContent = pct.toString().replace('.',',') + '%';

    const creido = Math.max(0, P - P*pct/100);
    const rReal  = calcular({perdida:P, valorAsegurado:VA, valorReal:VA, baseDeducible:'valorAsegurado', dedPct:pct, dedMinSMMLV:3});

    document.getElementById('sCreias').textContent = cop(creido);
    const el = document.getElementById('sReal');
    el.textContent = cop(rReal.indemnizacion);
    document.getElementById('sMinimo').textContent = rReal.indemnizacion === 0
      ? `Con estos números la indemnización es CERO: el deducible (${cop(rReal.deducibleTeorico)}) se come toda la pérdida. Diferencia con lo que creías: ${cop(creido)}.`
      : `Deducible real: ${cop(rReal.deducibleTeorico)}${rReal.mandaMinimo?' (manda el mínimo de 3 SMMLV)':''}. Diferencia con lo que creías: ${cop(creido - rReal.indemnizacion)} menos en tu bolsillo.`;
  }
  [sVal,sPer,sDed].forEach(s=>s.addEventListener('input',upd)); upd();
})();

let estado = { ramo:null, paso:0, datos:{} };
const $ = id => document.getElementById(id);

function pasosDe() {
  if (!estado.ramo) return [];
  return RAMOS[estado.ramo].pasos;
}

function pintarWizard() {
  const cuerpo = $('cuerpoPaso'), nav = $('wizNav'), pips = $('pasos');

  // Paso 0: escoger ramo
  if (!estado.ramo) {
    pips.innerHTML = '<span class="pcount">Empecemos</span>';
    cuerpo.innerHTML = `
      <div class="preg">¿Qué póliza vamos a revisar?</div>
      <p class="ayuda">Escoge una. Puedes volver y revisar otra cuando quieras: nada se guarda en ningún servidor.</p>
      <div class="ops">${Object.entries(RAMOS).map(([k,r])=>`
        <button class="op" data-ramo="${k}"><b>${r.nombre}</b><i>${r.intro.slice(0,72)}…</i></button>`).join('')}</div>`;
    nav.innerHTML = '';
    cuerpo.querySelectorAll('[data-ramo]').forEach(b => b.onclick = () => {
      estado.ramo = b.dataset.ramo; estado.paso = 0; estado.datos = {};
      $('res').classList.remove('on'); pintarWizard();
    });
    return;
  }

  const pasos = pasosDe(), p = pasos[estado.paso], d = estado.datos;

  pips.innerHTML = pasos.map((_,i)=>`<span class="pip ${i<estado.paso?'done':i===estado.paso?'on':''}"></span>`).join('')
    + `<span class="pcount">${estado.paso+1} / ${pasos.length}</span>`;

  let html = `<div class="preg">${p.preg}</div>`;
  if (p.ayuda) html += `<p class="ayuda">${p.ayuda}</p>`;

  if (p.tipo === 'opciones') {
    html += `<div class="ops">${p.ops.map(([v,t,s])=>`
      <button class="op ${d[p.k]===v?'sel':''}" data-v="${v}"><b>${t}</b>${s?`<i>${s}</i>`:''}</button>`).join('')}</div>`;
  } else if (p.tipo === 'multi') {
    const sel = d[p.k] || [];
    html += `<div class="ops">${p.ops.map(([v,t,s])=>`
      <button class="op ${sel.includes(v)?'sel':''}" data-m="${v}"><b>${sel.includes(v)?'✓ ':''}${t}</b>${s?`<i>${s}</i>`:''}</button>`).join('')}</div>`;
  } else if (p.tipo === 'campos') {
    html += `<div class="campos">${p.campos.map(c=>{
      if (c.tipo === 'select') return `<div class="campo"><label for="f_${c.k}">${c.l}</label>
        <select id="f_${c.k}" data-k="${c.k}">${c.ops.map(([v,t])=>`<option value="${v}" ${d[c.k]===v?'selected':''}>${t}</option>`).join('')}</select>
        <div class="pista">${c.pista||''}</div></div>`;
      const val = d[c.k] !== undefined ? d[c.k] : (c.def !== undefined ? c.def : '');
      return `<div class="campo"><label for="f_${c.k}">${c.l}</label>
        <input id="f_${c.k}" data-k="${c.k}" type="number" inputmode="decimal" step="${c.paso||1000000}" value="${val}" placeholder="0">
        <div class="pista">${c.pista||''}</div></div>`;
    }).join('')}</div>`;
  }
  cuerpo.innerHTML = html;

  // Listeners
  cuerpo.querySelectorAll('[data-v]').forEach(b => b.onclick = () => {
    d[p.k] = b.dataset.v; avanzar();
  });
  cuerpo.querySelectorAll('[data-m]').forEach(b => b.onclick = () => {
    const s = new Set(d[p.k] || []);
    const v = b.dataset.m;
    if (v === 'ninguno') { d[p.k] = s.has('ninguno') ? [] : ['ninguno']; }
    else { s.delete('ninguno'); s.has(v) ? s.delete(v) : s.add(v); d[p.k] = [...s]; }
    pintarWizard();
  });
  cuerpo.querySelectorAll('[data-k]').forEach(i => {
    i.oninput = () => { d[i.dataset.k] = i.type === 'number' ? +i.value : i.value; };
    if (d[i.dataset.k] === undefined && i.value !== '') d[i.dataset.k] = i.type === 'number' ? +i.value : i.value;
  });

  // Navegación
  const ultimo = estado.paso === pasos.length - 1;
  nav.innerHTML = `
    <button class="btn ${ultimo?'verde':''}" id="bSig">${ultimo ? 'Ver mi radiografía →' : 'Continuar →'}</button>
    ${estado.paso > 0 ? '<button class="link-btn" id="bAtras">Atrás</button>' : ''}
    <button class="link-btn" id="bReset" style="margin-left:auto">Cambiar de póliza</button>`;
  $('bSig').onclick = avanzar;
  if ($('bAtras')) $('bAtras').onclick = () => { estado.paso--; pintarWizard(); };
  $('bReset').onclick = () => { estado = {ramo:null,paso:0,datos:{}}; $('res').classList.remove('on'); pintarWizard(); };
}

function avanzar() {
  const pasos = pasosDe();
  if (estado.paso < pasos.length - 1) { estado.paso++; pintarWizard(); }
  else { mostrarResultado(); }
}

/* ============================================================
   10. RESULTADO
   ============================================================ */
function mostrarResultado() {
  const d = estado.datos, ramo = RAMOS[estado.ramo];
  const sinDato = d.dedConocido === 'no';
  const rg = sinDato ? calcularRango(d, estado.ramo) : null;
  const r = sinDato ? rg.pesimista : calcular(d);
  const sem = ramo.reglas(d);
  const respuestas = generarRespuestas(d, r);
  const docs = [...DOCUMENTOS.comun, ...(DOCUMENTOS[estado.ramo] || [])];

  $('res').classList.add('on');
  $('res').innerHTML = `
    <div style="margin-top:40px">
      <span class="eyebrow">Tu radiografía · ${ramo.nombre} · ${new Date().toLocaleDateString('es-CO')}</span>
      <h2 style="font-size:clamp(26px,4.6vw,42px);max-width:22ch">${titular(r, rg)}</h2>

      <div class="cinta-caja" style="margin-top:26px">
        <div class="cinta-top">
          <div><span class="rot">Cómo se reparte tu pérdida</span>
          <div class="mono" style="font-size:15px;margin-top:4px">Pérdida declarada: ${cop(r.perdida)}</div></div>
          <div class="mono" style="font-size:13px;color:var(--tinta2)">Recuperas el ${r.pctRecuperado.toFixed(1).replace('.',',')}%</div>
        </div>
        <div class="regla" id="resRegla" aria-hidden="true"></div>
        <div class="cinta" id="resCinta" role="img" aria-label="Reparto de la pérdida"></div>
        <div class="leyenda">
          <b><i class="dot d"></i> Deducible ${cop(r.deducible)}</b>
          ${r.porInfraseguro>0?`<b><i class="dot i"></i> Infraseguro ${cop(r.porInfraseguro)}</b>`:''}
          <b><i class="dot r"></i> Indemnización ${cop(r.indemnizacion)}</b>
        </div>
      </div>

      ${sinDato ? `<div class="aviso" style="background:var(--fuera-luz);border-color:var(--fuera)">
        <b>Ojo: esta no es tu cifra, es un rango.</b>
        Como no tenemos tu deducible, calculamos los dos extremos que se ven en el mercado para ${ramo.nombre.toLowerCase()}:
        desde ${RANGO_DEDUCIBLE[estado.ramo].min.pct}% con mínimo de ${RANGO_DEDUCIBLE[estado.ramo].min.smmlv} SMMLV, hasta ${RANGO_DEDUCIBLE[estado.ramo].max.pct}% con mínimo de ${RANGO_DEDUCIBLE[estado.ramo].max.smmlv} SMMLV.
        Tu póliza tiene un número exacto y está en la carátula. Hasta que lo tengas, trata esto como una idea de magnitud, no como una respuesta.
      </div>` : ''}

      <div class="res-cifras">
        ${sinDato ? `
        <div class="cifra destacada"><span class="eyebrow">En el peor caso</span><div class="num">${cop(rg.pesimista.indemnizacion)}</div></div>
        <div class="cifra destacada"><span class="eyebrow">En el mejor caso</span><div class="num">${cop(rg.optimista.indemnizacion)}</div></div>
        <div class="cifra"><span class="eyebrow">Dato que falta</span><div class="num" style="font-size:20px;line-height:1.3">Tu deducible de terremoto</div></div>` : `
        <div class="cifra destacada"><span class="eyebrow">Recibirías aprox.</span><div class="num">${cop(r.indemnizacion)}</div></div>
        <div class="cifra"><span class="eyebrow">Sale de tu bolsillo</span><div class="num">${cop(r.deTuBolsillo)}</div></div>
        <div class="cifra"><span class="eyebrow">Deducible aplicado</span><div class="num">${cop(r.deducibleTeorico)}</div></div>`}
      </div>

      ${r.hayInfra ? `<div class="aviso"><b>Tienes infraseguro: estás asegurado al ${(r.factor*100).toFixed(0)}% de lo que vale.</b>
        Por eso te descuentan ${cop(r.porInfraseguro)} antes de aplicar el deducible, aunque la pérdida sea parcial. Es la regla proporcional del art. 1102 del Código de Comercio. Actualizar el valor asegurado en la renovación es la corrección más barata que existe.</div>` : ''}
      ${r.mandaMinimo ? `<div class="aviso"><b>En tu caso manda el deducible mínimo, no el porcentaje.</b>
        El mínimo en SMMLV (${cop((+d.dedMinSMMLV||0)*CONFIG.SMMLV)}) resultó mayor que el porcentaje pactado. Por eso el descuento es más alto de lo que esperabas.</div>` : ''}
      ${r.indemnizacion === 0 ? `<div class="aviso"><b>Repórtalo de todas formas.</b>
        El deducible absorbe toda la pérdida. Esto no significa que no debas avisar el siniestro: avísalo igual, porque los números cambian cuando el ajustador valora el daño real, y porque el aviso protege tus plazos.</div>` : ''}

      <h3 style="font-size:24px;margin:34px 0 12px">Tu semáforo</h3>
      <div class="semaforo">
        ${sem.map(([tipo,tag,tit,txt])=>`
          <div class="fila ${tipo}"><div class="ico">${tipo==='si'?'SÍ':tipo==='ojo'?'OJO':'NO'} · ${tag}</div>
          <div><b>${tit}</b><span>${txt}</span></div></div>`).join('')}
      </div>

      <h3 style="font-size:24px;margin:34px 0 12px">Lo que ya está respondido</h3>
      <p style="font-size:15px;color:var(--tinta2);max-width:62ch">Estas son las dudas que le salen a todo el mundo al llegar aquí. Están resueltas para tu caso.</p>
      <div class="grid g2" style="margin-top:14px">
        ${respuestas.map(([t,x])=>`<div class="card"><h3>${t}</h3><p>${x}</p></div>`).join('')}
      </div>

      <h3 style="font-size:24px;margin:34px 0 8px">Tu carpeta</h3>
      <p style="font-size:15px;color:var(--tinta2);max-width:62ch">Esto es lo único que depende de ti, y es lo que más demora una reclamación cuando queda incompleto. Ve marcando.</p>
      <div class="card" style="margin-top:12px">
        <div class="checklist">
          ${docs.map((doc,i)=>`<label class="chk"><input type="checkbox" data-doc="${i}"><span>${doc}</span></label>`).join('')}
        </div>
        <div class="progreso"><div class="barra"><i id="barraDocs"></i></div><span class="mono" id="txtDocs">0 de ${docs.length}</span></div>
      </div>

      <h3 style="font-size:24px;margin:34px 0 8px">Qué sigue, y quién lo hace</h3>
      <div class="semaforo" style="margin-top:12px">
        ${PROCESO.map(([quien,que,x])=>`
          <div class="fila si"><div class="ico">${quien.toUpperCase()}</div>
          <div><b>${que}</b><span>${x}</span></div></div>`).join('')}
      </div>

      <div class="cta-row no-print" style="margin-top:26px">
        <button class="btn verde" onclick="window.print()">Descargar / imprimir mi reporte</button>
        ${ASESOR.mostrar ? `<button class="btn" id="bEnviar">Enviar esto a ${ASESOR.nombre}</button>` : ''}
        <button class="btn ghost" id="bCopiar">Copiar el resumen</button>
        <button class="btn ghost" id="bOtra">Revisar otra póliza</button>
      </div>

      ${cajaAsesor()}
    </div>`;

  pintarCinta($('resCinta'), $('resRegla'), r);
  $('bOtra').onclick = () => { estado={ramo:null,paso:0,datos:{}}; $('res').classList.remove('on'); pintarWizard(); $('diagnostico').scrollIntoView({behavior:'smooth'}); };
  const resumen = () =>
    `PRE-DIAGNÓSTICO — Hasta Dónde\n` +
    `Póliza: ${ramo.nombre}\n` +
    `Fecha: ${new Date().toLocaleDateString('es-CO')}\n\n` +
    `Valor asegurado: ${cop(+d.valorAsegurado || 0)}\n` +
    `Valor real estimado: ${cop(+d.valorReal || 0)}\n` +
    `Pérdida estimada: ${cop(r.perdida)}\n` +
    `Deducible informado: ${(+d.dedPct || 0)}% sobre ${d.baseDeducible === 'perdida' ? 'la pérdida' : 'el valor asegurado'}, mínimo ${(+d.dedMinSMMLV || 0)} SMMLV\n\n` +
    `Deducible calculado: ${sinDato ? 'DATO FALTANTE — el cliente no conoce su deducible' : cop(r.deducibleTeorico)}\n` +
    (r.hayInfra ? `Infraseguro: asegurado al ${(r.factor * 100).toFixed(0)}% (${cop(r.porInfraseguro)})\n` : '') +
    `Indemnización estimada: ${sinDato ? `entre ${cop(rg.pesimista.indemnizacion)} y ${cop(rg.optimista.indemnizacion)} (rango de mercado)` : cop(r.indemnizacion)}\n\n` +
    `Documentos pendientes: ${docs.length - marcados().length} de ${docs.length}\n` +
    marcados('pendientes').map(t => `- ${t}`).join('\n') +
    `\n\nCifras ingresadas por el cliente. Sujetas a verificación contra la carátula y el clausulado.`;

  const marcados = (modo) => {
    const cajas = [...document.querySelectorAll('[data-doc]')];
    return cajas.filter(c => modo === 'pendientes' ? !c.checked : c.checked)
                .map(c => c.parentElement.querySelector('span').textContent);
  };

  const actualizarDocs = () => {
    const total = docs.length, hechos = marcados().length;
    const b = $('barraDocs'); if (b) b.style.width = (hechos / total * 100) + '%';
    const t = $('txtDocs'); if (t) t.textContent = `${hechos} de ${total}`;
  };
  document.querySelectorAll('[data-doc]').forEach(c => c.onchange = actualizarDocs);

  $('bCopiar').onclick = () => {
    navigator.clipboard.writeText(resumen()).then(() => {
      $('bCopiar').textContent = 'Copiado ✓';
      setTimeout(() => $('bCopiar').textContent = 'Copiar el resumen', 2000);
    });
  };

  if ($('bEnviar')) $('bEnviar').onclick = () => {
    const texto = encodeURIComponent(resumen());
    window.open(ASESOR.whatsapp
      ? `https://wa.me/${ASESOR.whatsapp}?text=${texto}`
      : `mailto:${ASESOR.correo}?subject=${encodeURIComponent('Pre-diagnóstico — ' + ramo.nombre)}&body=${texto}`,
      '_blank');
  };

  $('res').scrollIntoView({behavior:'smooth'});
}

function titular(r, rg) {
  if (rg) return rg.optimista.indemnizacion === 0
    ? 'Falta un dato clave, y sin él no podemos decirte una cifra.'
    : `Entre ${cop(rg.pesimista.indemnizacion)} y ${cop(rg.optimista.indemnizacion)}, según cuál sea tu deducible.`;
  if (r.indemnizacion === 0) return 'Con los datos que pusiste, el deducible se llevaría toda la pérdida.';
  if (r.pctRecuperado < 35)  return `Recuperarías cerca de un tercio: ${cop(r.indemnizacion)}.`;
  if (r.pctRecuperado < 70)  return `Recuperarías ${cop(r.indemnizacion)} de ${cop(r.perdida)}.`;
  return `Tu póliza responde bien: ${cop(r.indemnizacion)}.`;
}

/* Respuestas anticipadas: lo que el cliente iba a llamar a preguntar. */
function generarRespuestas(d, r) {
  const a = [];

  if (d.dedConocido === 'no') {
    a.push(['¿Por qué me dan un rango y no una cifra?',
      'Porque tu deducible es el número que más mueve el resultado y no lo tenemos. Darte una cifra exacta sin ese dato sería inventarla, y con eso se toman malas decisiones. En cuanto aparezca la carátula, el cálculo deja de ser un rango.']);
    a.push(['¿Dónde encuentro ese número?',
      'En la primera hoja de la póliza, la carátula, bajo el título “deducibles”. Es una línea que dice algo como “2% del valor asegurable del ítem afectado, mínimo 3 SMMLV”. Si no tienes la póliza, la aseguradora o tu asesor te la reenvían.']);
  }
  if (d.dedConocido !== 'no') a.push(['¿Por qué el deducible es tan alto?',
    d.baseDeducible === 'perdida'
      ? `Tu deducible se calcula sobre el valor de la pérdida: ${(+d.dedPct||0)}% de ${cop(r.perdida)}. Además hay un mínimo en salarios mínimos, y se aplica el que resulte mayor de los dos.`
      : `Porque no se calcula sobre lo que perdiste sino sobre el valor asegurado del bien: ${(+d.dedPct||0)}% de ${cop(+d.valorAsegurado||0)} da ${cop(r.deducibleTeorico)}. Así funciona el amparo de terremoto en el mercado colombiano; no es un cobro nuevo ni una penalización por reclamar.`]);

  if (r.mandaMinimo) a.push(['¿Por qué no coincide con el porcentaje?',
    `Porque en tu caso pesa más el mínimo pactado: ${(+d.dedMinSMMLV||0)} SMMLV son ${cop((+d.dedMinSMMLV||0)*CONFIG.SMMLV)}, y eso supera al porcentaje. Siempre se aplica el mayor de los dos.`]);

  if (r.hayInfra) a.push(['¿Por qué me descuentan si la pérdida fue parcial?',
    `Es la regla proporcional del art. 1102 del Código de Comercio. Como el bien está asegurado al ${(r.factor*100).toFixed(0)}% de lo que vale, la indemnización se reduce en esa misma proporción. Se corrige actualizando el valor asegurado en la renovación, y suele costar mucho menos de lo que la gente imagina.`]);

  if (r.indemnizacion === 0) a.push(['Si no me van a pagar, ¿para qué reportar?',
    'Porque las cifras de arriba son tu estimado, no el del ajustador. Cuando valoran en sitio casi siempre aparecen daños que no se habían contado, y el número cambia. Reportar no cuesta nada y mantiene el caso vivo.']);

  a.push(['¿Cuánto se va a demorar?',
    'El mes que fija la ley empieza a correr cuando el expediente está completo, no desde el día del sismo. Con el volumen de esta emergencia las visitas de ajuste se corrieron, así que la parte que sí puedes acelerar es la carpeta.']);

  if (estado.ramo === 'ph') a.push(['¿A quién le llega la plata?',
    'A la copropiedad, no a cada propietario. En propiedad horizontal la indemnización se destina primero a reconstruir el edificio; solo si eso no ocurre se reparte según coeficiente de copropiedad.']);
  if (estado.ramo === 'pyme') a.push(['¿Me pagan lo que dejé de vender?',
    d.lucro === 'si' ? 'Sí, si tienes lucro cesante contratado, y se prueba con contabilidad: declaraciones, IVA y facturación de los 12 meses previos. Ese soporte es el que decide la cifra.'
                     : 'Solo si tienes contratado el amparo de lucro cesante. Sin él te reparan el local, pero los meses sin facturar corren por tu cuenta. Es lo que más conviene revisar en la renovación.']);
  if (estado.ramo === 'auto') a.push(['¿Me dan uno nuevo?',
    'No. Se indemniza el valor comercial del vehículo al día del siniestro según la guía de referencia, no lo que pagaste ni lo que cuesta uno nuevo. Y si declaran pérdida total y te quedas con los restos, se descuenta el salvamento.']);
  if (estado.ramo === 'hogar') a.push(['¿Y mis muebles?',
    'Contenidos y estructura son dos coberturas distintas. Si tu seguro viene del crédito hipotecario, lo más probable es que los contenidos no estén incluidos: eso se verifica en la carátula antes de armar el inventario.']);

  a.push(['¿Tengo que hablar yo con la aseguradora?',
    ASESOR.mostrar
      ? `No. ${ASESOR.nombre} radica el aviso, arma el expediente y hace el seguimiento. Lo que se necesita de ti son los documentos de la lista de abajo.`
      : 'No necesariamente. El aviso y el expediente los puede radicar tu intermediario; lo que se necesita de ti son los documentos de la lista de abajo.']);

  return a;
}

/* ============================================================
   11. GLOSARIO — render
   ============================================================ */
function pintarGlosario(filtro='') {
  const f = filtro.toLowerCase().trim();
  const items = GLOSARIO.filter(([t,c,l]) => !f || (t+c+l).toLowerCase().includes(f));
  $('listaGlosario').innerHTML = items.length ? items.map(([t,c,l,e])=>`
    <details class="term"><summary>${t}</summary>
      <div class="cuerpo"><div class="corto">${c}</div><div>${l}</div>
      ${e?`<div class="ej"><b>Ejemplo:</b> ${e}</div>`:''}</div></details>`).join('')
    : `<p style="color:var(--tinta2)">No encontramos ese término. Escríbelo y lo agregamos: el glosario también se nutre.</p>`;
}
$('buscaTermino').addEventListener('input', e => pintarGlosario(e.target.value));
pintarGlosario();

/* ============================================================
   12. CLAUSULADOS — render + nutrir
   ============================================================ */
let CLAUSULADOS = JSON.parse(JSON.stringify(CLAUSULADOS_SEED));

function pintarClausulados() {
  $('tablaClaus').innerHTML = `
    <thead><tr><th>Aseguradora</th><th>Producto</th><th>Ramo</th><th>Código</th>
    <th>Deducible terremoto</th><th>Mínimo</th><th>Notas</th></tr></thead>
    <tbody>${CLAUSULADOS.map(c=>`<tr>
      <td><b>${c.aseguradora}</b><br><span class="chip">${c.verificado?'verificado':'referencia de mercado'}</span></td>
      <td>${c.producto}</td><td>${c.ramo}</td><td class="mono">${c.codigo||'—'}</td>
      <td>${c.ded||'—'}</td><td class="mono">${c.min||'—'}</td>
      <td style="max-width:340px;color:var(--tinta2);font-size:13.5px">${c.notas||''}</td>
    </tr>`).join('')}</tbody>`;
}
pintarClausulados();

$('btnAddClaus').onclick = () => {
  const g = (t,d='') => (prompt(t, d) || '').trim();
  const aseguradora = g('Aseguradora (ej. la que aparece en tu carátula):'); if (!aseguradora) return;
  const nuevo = {
    aseguradora,
    producto: g('Nombre del producto o póliza:'),
    ramo: g('Ramo (PH / PYME / Autos / Hogar):'),
    codigo: g('Código del clausulado (aparece al pie del clausulado):'),
    ded: g('Deducible de terremoto, tal cual está escrito:'),
    min: g('Deducible mínimo (ej. 3 SMMLV):'),
    notas: g('Notas, trampas o sublímites que valga la pena recordar:'),
    verificado: true
  };
  CLAUSULADOS.push(nuevo); pintarClausulados();
  alert('Agregado. Ahora exporta el JSON y guárdalo junto al archivo para que quede permanente.');
};

$('btnExport').onclick = () => {
  const blob = new Blob([JSON.stringify(CLAUSULADOS, null, 2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = 'clausulados.json'; a.click();
};

$('fileImport').onchange = e => {
  const f = e.target.files[0]; if (!f) return;
  const fr = new FileReader();
  fr.onload = () => {
    try {
      const arr = JSON.parse(fr.result);
      if (!Array.isArray(arr)) throw 0;
      CLAUSULADOS = arr; pintarClausulados();
    } catch { alert('Ese archivo no tiene el formato esperado. Debe ser una lista JSON como la que produce el botón Exportar.'); }
  };
  fr.readAsText(f);
};

/* Carga opcional de datos externos: si existe datos/clausulados.json, manda ese. */
fetch('datos/clausulados.json').then(r => r.ok ? r.json() : null).then(j => {
  if (Array.isArray(j) && j.length) { CLAUSULADOS = j; pintarClausulados(); }
}).catch(()=>{});

/* ============================================================
   12.b FIRMA DEL ASESOR
   ============================================================ */
function cajaAsesor() {
  if (!ASESOR.mostrar) return '';
  const enlace = ASESOR.whatsapp ? `https://wa.me/${ASESOR.whatsapp}` : `mailto:${ASESOR.correo}`;
  return `<div class="asesor-caja">
    <div class="quien"><span class="rot">Tu asesor en este caso</span>
      <b>${ASESOR.nombre}</b>${ASESOR.empresa ? `<i>${ASESOR.empresa}</i>` : ''}
      <p>${ASESOR.invitacion}</p></div>
    <a class="btn verde no-print" href="${enlace}" target="_blank" rel="noopener">Escribirle</a>
  </div>`;
}
if (ASESOR.mostrar && $('asesorTop'))
  $('asesorTop').innerHTML = `Herramienta de <b>${ASESOR.nombre}</b>`;

/* ============================================================
   13. PLAZOS — render
   ============================================================ */
$('lineaPlazos').innerHTML = PLAZOS.map(([p,t,x])=>`
  <div class="hito"><div class="plazo">${p}</div><h3>${t}</h3><p>${x}</p></div>`).join('');

/* ============================================================
   14. Arranque
   ============================================================ */
pintarWizard();
