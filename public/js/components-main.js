// Visual CMS 360° — Editor CMS local com suporte a tours virtuais 360°
// Copyright (C) 2025  Gerson Luis Vertematti <gersonlv@gmail.com>
//
// Este programa é software livre: você pode redistribuí-lo e/ou modificá-lo
// sob os termos da GNU General Public License conforme publicada pela Free
// Software Foundation, na versão 3 da Licença, ou (a seu critério) qualquer
// versão posterior.
//
// Este programa é distribuído na esperança de que seja útil, mas SEM QUALQUER
// GARANTIA. Veja a GNU General Public License para mais detalhes.
//
// <https://www.gnu.org/licenses/gpl-3.0.html>

    // ── State ─────────────────────────────────────────────────────────────────
    let currentComponent = null;
    let componentList    = {};
    let availablePages   = ['index'];

    // ── Load component library ─────────────────────────────────────────────────
    async function loadLibrary() {
      try {
        const res  = await fetch('/api/components/load');
        componentList = await res.json();
      } catch {}
      try {
        const pRes = await fetch('/api/load?slug=index');
        const pData = await pRes.json();
        if (pData.availablePages) availablePages = pData.availablePages;
      } catch {}
      refreshComponentSelect();
    }

    function refreshComponentSelect() {
      const sel = document.getElementById('comp-selector');
      if (!sel) return;
      const names = Object.keys(componentList);
      sel.innerHTML =
        '<option value="">— Novo componente —</option>' +
        names.map(n => `<option value="${n}"${n === currentComponent ? ' selected' : ''}>${n}</option>`).join('');
    }

    // ── Verificar se os scripts carregaram ────────────────────────────────────
    if (typeof grapesjs === 'undefined') {
      document.getElementById('gjs-comp').innerHTML =
        '<div style="padding:40px;font-family:sans-serif;color:#c00;text-align:center;">' +
        '<h2>Erro: GrapesJS não carregou</h2>' +
        '<p>Verifique se os arquivos em <code>/public/vendor/</code> existem.</p></div>';
      throw new Error('GrapesJS not loaded');
    }

    // ── GrapesJS init ──────────────────────────────────────────────────────────
    var pluginTailwind   = typeof grapesjs !== 'undefined' && grapesjs.plugins && grapesjs.plugins.get
      ? grapesjs.plugins.get('grapesjs-tailwind')   || window['grapesjs-tailwind']
      : window['grapesjs-tailwind'];
    var pluginBlocksBasic = window['gjs-blocks-basic'];

    var editor;
    var initConfigs = [
      { plugins: [pluginTailwind, pluginBlocksBasic].filter(Boolean), label: 'tailwind + blocks' },
      { plugins: [pluginBlocksBasic].filter(Boolean),                 label: 'só blocks-basic'   },
      { plugins: [],                                                   label: 'sem plugins'        },
    ];

    for (var cfg of initConfigs) {
      try {
        editor = grapesjs.init({
          container:      '#gjs-comp',
          height:         '100vh',
          width:          'auto',
          fromElement:    false,
          storageManager: false,
          allowScripts:   1,
          plugins:        cfg.plugins,
          canvas: {
            scripts: [window.location.origin + '/vendor/jquery.min.js'],
            styles:  [window.location.origin + '/vendor/fontawesome/css/all-canvas.css'],
          },
          pluginsOpts: {
            'grapesjs-tailwind': {},
            'gjs-blocks-basic': { flexGrid: true }
          },
          assetManager: {
            assets:     '/api/assets/load',
            upload:     '/api/assets/upload',
            uploadName: 'files[]',
          },
          styleManager: {
            sectors: [
              {
                name: 'Geral', open: false,
                properties: [
                  { name: 'Display',    property: 'display',   type: 'select',
                    options: [{value:'block'},{value:'inline-block'},{value:'flex'},{value:'inline-flex'},{value:'grid'},{value:'none'}] },
                  { name: 'Position',   property: 'position',  type: 'select',
                    options: [{value:'static'},{value:'relative'},{value:'absolute'},{value:'fixed'},{value:'sticky'}] },
                  { name: 'Top',        property: 'top',       type: 'integer', units: ['px','%','vh','em','rem'] },
                  { name: 'Right',      property: 'right',     type: 'integer', units: ['px','%','vh','em','rem'] },
                  { name: 'Bottom',     property: 'bottom',    type: 'integer', units: ['px','%','vh','em','rem'] },
                  { name: 'Left',       property: 'left',      type: 'integer', units: ['px','%','vh','em','rem'] },
                  { name: 'Z-index',    property: 'z-index',   type: 'integer' },
                  { name: 'Float',      property: 'float',     type: 'radio',
                    options: [{value:'none',title:'Nenhum'},{value:'left',title:'Esq'},{value:'right',title:'Dir'}] },
                  { name: 'Clear',      property: 'clear',     type: 'select',
                    options: [{value:'none'},{value:'left'},{value:'right'},{value:'both'}] },
                  { name: 'Overflow',   property: 'overflow',  type: 'select',
                    options: [{value:'visible'},{value:'hidden'},{value:'scroll'},{value:'auto'}] },
                  { name: 'Cursor',     property: 'cursor',    type: 'select',
                    options: [{value:'auto'},{value:'default'},{value:'pointer'},{value:'move'},{value:'not-allowed'},{value:'grab'}] },
                ]
              },
              {
                name: 'Dimensão', open: false,
                properties: [
                  { name: 'Largura',      property: 'width',      type: 'integer', units: ['px','%','vw','em','rem','auto'] },
                  { name: 'Alt. Mínima',  property: 'min-height', type: 'integer', units: ['px','%','vh','em','rem'] },
                  { name: 'Altura',       property: 'height',     type: 'integer', units: ['px','%','vh','em','rem','auto'] },
                  { name: 'Larg. Máxima', property: 'max-width',  type: 'integer', units: ['px','%','vw','em','rem'] },
                  { name: 'Alt. Máxima',  property: 'max-height', type: 'integer', units: ['px','%','vh','em','rem'] },
                  { name: 'Margin',  property: 'margin',  type: 'composite', properties: [
                    { name: 'Cima',    property: 'margin-top',    type: 'integer', units: ['px','%','em','rem','auto'] },
                    { name: 'Direita', property: 'margin-right',  type: 'integer', units: ['px','%','em','rem','auto'] },
                    { name: 'Baixo',   property: 'margin-bottom', type: 'integer', units: ['px','%','em','rem','auto'] },
                    { name: 'Esq.',    property: 'margin-left',   type: 'integer', units: ['px','%','em','rem','auto'] },
                  ]},
                  { name: 'Padding', property: 'padding', type: 'composite', properties: [
                    { name: 'Cima',    property: 'padding-top',    type: 'integer', units: ['px','%','em','rem'] },
                    { name: 'Direita', property: 'padding-right',  type: 'integer', units: ['px','%','em','rem'] },
                    { name: 'Baixo',   property: 'padding-bottom', type: 'integer', units: ['px','%','em','rem'] },
                    { name: 'Esq.',    property: 'padding-left',   type: 'integer', units: ['px','%','em','rem'] },
                  ]},
                ]
              },
              {
                name: 'Tipografia', open: false,
                properties: [
                  { name: 'Fonte',         property: 'font-family',     type: 'text' },
                  { name: 'Tamanho',       property: 'font-size',       type: 'integer', units: ['px','em','rem','%','vw'] },
                  { name: 'Peso',          property: 'font-weight',     type: 'select',
                    options: [{value:'100'},{value:'200'},{value:'300'},{value:'400',name:'Normal'},{value:'500'},{value:'600'},{value:'700',name:'Bold'},{value:'800'},{value:'900'}] },
                  { name: 'Estilo',        property: 'font-style',      type: 'radio',
                    options: [{value:'normal'},{value:'italic'},{value:'oblique'}] },
                  { name: 'Cor',           property: 'color',           type: 'color' },
                  { name: 'Alinhamento',   property: 'text-align',      type: 'radio',
                    options: [{value:'left',title:'Esq'},{value:'center',title:'Centro'},{value:'right',title:'Dir'},{value:'justify',title:'Just'}] },
                  { name: 'Altura linha',  property: 'line-height',     type: 'integer', units: ['px','em','rem',''] },
                  { name: 'Espaç. letra',  property: 'letter-spacing',  type: 'integer', units: ['px','em','rem'] },
                  { name: 'Decoração',     property: 'text-decoration', type: 'select',
                    options: [{value:'none'},{value:'underline'},{value:'line-through'},{value:'overline'}] },
                  { name: 'Transf. texto', property: 'text-transform',  type: 'select',
                    options: [{value:'none'},{value:'uppercase'},{value:'lowercase'},{value:'capitalize'}] },
                ]
              },
              {
                name: 'Decorações', open: false,
                properties: [
                  { name: 'Cor de fundo',  property: 'background-color', type: 'color' },
                  { name: 'Background',    property: 'background',        type: 'text' },
                  { name: 'Borda',         property: 'border',            type: 'text' },
                  { name: 'Borda raio',    property: 'border-radius',     type: 'integer', units: ['px','%','em'] },
                  { name: 'Sombra caixa',  property: 'box-shadow',        type: 'text' },
                  { name: 'Sombra texto',  property: 'text-shadow',       type: 'text' },
                  { name: 'Opacidade',     property: 'opacity',           type: 'slider', min: 0, max: 1, step: 0.01 },
                  { name: 'Transição',     property: 'transition',        type: 'text' },
                  { name: 'Transformação', property: 'transform',         type: 'text' },
                  { name: 'Filtro',        property: 'filter',            type: 'text' },
                ]
              },
              {
                name: 'Flexbox', open: false,
                properties: [
                  { name: 'Direção',     property: 'flex-direction',  type: 'radio',
                    options: [{value:'row'},{value:'row-reverse'},{value:'column'},{value:'column-reverse'}] },
                  { name: 'Quebra',      property: 'flex-wrap',       type: 'radio',
                    options: [{value:'nowrap'},{value:'wrap'},{value:'wrap-reverse'}] },
                  { name: 'Justificar',  property: 'justify-content', type: 'select',
                    options: [{value:'flex-start'},{value:'flex-end'},{value:'center'},{value:'space-between'},{value:'space-around'},{value:'space-evenly'}] },
                  { name: 'Alinhar',     property: 'align-items',     type: 'select',
                    options: [{value:'stretch'},{value:'flex-start'},{value:'flex-end'},{value:'center'},{value:'baseline'}] },
                  { name: 'Alin. cont.', property: 'align-content',   type: 'select',
                    options: [{value:'stretch'},{value:'flex-start'},{value:'flex-end'},{value:'center'},{value:'space-between'},{value:'space-around'}] },
                  { name: 'Gap',         property: 'gap',             type: 'integer', units: ['px','em','rem','%'] },
                  { name: 'Flex',        property: 'flex',            type: 'text' },
                  { name: 'Ordem',       property: 'order',           type: 'integer' },
                ]
              },
            ]
          },
        });
        console.log('[CMS Comp] GrapesJS iniciado com:', cfg.label);
        break;
      } catch(err) {
        console.warn('[CMS Comp] Falha ao iniciar com', cfg.label, ':', err.message);
        const gjsComp = document.getElementById('gjs-comp');
        if (gjsComp) gjsComp.innerHTML = '';
      }
    }

    if (!editor) {
      document.getElementById('gjs-comp').innerHTML =
        '<div style="padding:40px;font-family:sans-serif;color:#c00;text-align:center;">' +
        '<h2>Erro crítico: GrapesJS não inicializou</h2>' +
        '<p>Verifique o console para mais detalhes.</p></div>';
      throw new Error('GrapesJS failed to initialize');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // FIX ÍCONES FONT AWESOME
    // Causa 1: o GrapesJS classifica <i class="fa..."> como TEXTO editável e
    //          injeta textnodes de espaço/quebra ("\n      ") que reaparecem ao
    //          salvar e podem deslocar a renderização do glifo.
    // Causa 2: o CSS de dimensionamento (ex.: .social-links a { width:42px... })
    //          às vezes não fica salvo no projectData, só no campo "css" bruto;
    //          como o load usa loadProjectData(), esse CSS era ignorado e os
    //          ícones apareciam minúsculos e sem o botão circular.
    // ═══════════════════════════════════════════════════════════════════════
    var FA_CLASS_RE = /(^|\s)(fa|fas|far|fab|fal|fad|fass|fasr|fa-solid|fa-regular|fa-brands|fa-light|fa-duotone|fa-thin|fa-sharp)(\s|$)/;

    // 1) Tipo dedicado para ícones FA: não-editável e sem filhos de texto.
    editor.DomComponents.addType('fa-icon', {
      isComponent(el) {
        if (el.tagName === 'I' && FA_CLASS_RE.test(el.className || '')) {
          return { type: 'fa-icon' };
        }
      },
      model: {
        defaults: {
          tagName:       'i',
          editable:      false,   // impede virar campo de texto
          droppable:     false,   // nada pode ser solto dentro
          highlightable: true,
          components:    '',       // nasce vazio (sem textnodes de espaço)
        },
        init() {
          // Remove textnodes de espaço herdados de dados antigos
          if (this.components().length) this.components('');
        },
      },
    });

    // 2) Sanitiza ícones já existentes na árvore: projectData salvo antigamente
    //    guarda type:"text" + textnode "\n      ", que ignora o isComponent acima.
    function healFaIcons(ed) {
      try {
        ed.getWrapper().find('i').forEach(function (cmp) {
          var classStr = (cmp.getClasses() || []).join(' ');
          if (!FA_CLASS_RE.test(' ' + classStr + ' ')) return;
          if (cmp.components().length) cmp.components('');  // remove espaço/quebra
          cmp.set('editable',  false);
          cmp.set('droppable', false);
        });
      } catch (e) { console.warn('[CMS Comp] healFaIcons:', e.message); }
    }

    // 3) Carregamento unificado de componente:
    //    projectData (vincula o Style Manager) + reaplicação do CSS bruto via
    //    addRules (merge idempotente que recupera regras ausentes do projectData)
    //    + cura dos ícones FA.
    function loadComponentInto(ed, comp) {
      if (comp && comp.projectData && comp.projectData.pages && comp.projectData.pages.length) {
        ed.loadProjectData(comp.projectData);
      } else {
        ed.loadProjectData({
          pages: [{
            id: 'comp-page',
            frames: [{ component: { type: 'wrapper', components: (comp && comp.html) || '' } }]
          }],
          styles: (comp && comp.css) || '',
        });
      }
      if (comp && comp.css) {
        var cssMod = ed.Css || ed.CssComposer;
        if (cssMod && cssMod.addRules) {
          try { cssMod.addRules(comp.css); } catch (e) { console.warn('[CMS Comp] addRules:', e.message); }
        }
      }
      healFaIcons(ed);
    }

      /* ── Formatadores de código para as textareas ──────────────────────────── */
      function formatHTML(html) {
        if (!html) return '';
        var VOID = /^(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/i;
        var indent = 0, out = '', i = 0, pad = '  ';
        // Normaliza: remove espaço entre tags e quebras múltiplas
        html = html.replace(/>\s+</g, '><').trim();
        var tokens = html.match(/(<[^>]+>|[^<]+)/g) || [];
        tokens.forEach(function(tok) {
          tok = tok.trim();
          if (!tok) return;
          if (/^<!--/.test(tok)) {               // comentário
            out += pad.repeat(indent) + tok + '\n';
          } else if (/^<\//.test(tok)) {          // tag de fechamento
            indent = Math.max(0, indent - 1);
            out += pad.repeat(indent) + tok + '\n';
          } else if (/^</.test(tok)) {            // tag de abertura
            var tag = (tok.match(/^<([a-zA-Z0-9-]+)/) || [])[1] || '';
            var selfClose = /\/>$/.test(tok) || VOID.test(tag);
            out += pad.repeat(indent) + tok + '\n';
            if (!selfClose) indent++;
          } else {                                // texto
            if (tok) out += pad.repeat(indent) + tok + '\n';
          }
        });
        return out.trimEnd();
      }

      function formatCSS(css) {
        if (!css) return '';
        // Garante quebras em { } ;
        css = css
          .replace(/\s*\{\s*/g, ' {\n  ')
          .replace(/;\s*/g, ';\n  ')
          .replace(/\s*\}\s*/g, '\n}\n')
          .replace(/,\s*(?=[^{]*\{)/g, ',\n')   // vírgulas em seletores
          .replace(/  \n\}/g, '\n}')             // remove espaço antes de }
          .replace(/\n{3,}/g, '\n\n')            // máx 2 linhas em branco
          .trim();
        return css;
      }
      /* ── Fim formatadores ───────────────────────────────────────────────────── */

      // ── Editor de Código ──────────────────────────────────────────────────────
    editor.Commands.add('core:open-code', {
      run(ed) {
        const modal = ed.Modal;
        const wrap = document.createElement('div');
        wrap.style.cssText = 'display:flex;gap:0;width:860px;max-width:96vw;height:72vh;box-sizing:border-box;';

        const htmlPane = document.createElement('div');
        htmlPane.style.cssText = 'flex:1;display:flex;flex-direction:column;border-right:1px solid #333;';
        const htmlLabel = document.createElement('div');
        htmlLabel.textContent = 'HTML';
        htmlLabel.style.cssText = 'padding:6px 12px;font-size:11px;font-weight:700;color:#f59e0b;background:#1a1a2e;letter-spacing:1px;';
        const htmlArea = document.createElement('textarea');
        htmlArea.value = formatHTML(ed.getHtml());
        htmlArea.spellcheck = false;
        htmlArea.style.cssText = 'flex:1;background:#0d0d1a;color:#d4d4d4;border:none;padding:12px;font-size:12px;font-family:monospace;resize:none;outline:none;line-height:1.6;';
        htmlPane.appendChild(htmlLabel);
        htmlPane.appendChild(htmlArea);

        const cssPane = document.createElement('div');
        cssPane.style.cssText = 'flex:1;display:flex;flex-direction:column;';
        const cssLabel = document.createElement('div');
        cssLabel.textContent = 'CSS';
        cssLabel.style.cssText = 'padding:6px 12px;font-size:11px;font-weight:700;color:#818cf8;background:#1a1a2e;letter-spacing:1px;';
        const cssArea = document.createElement('textarea');
        cssArea.value = formatCSS(ed.getCss());
        cssArea.spellcheck = false;
        cssArea.style.cssText = 'flex:1;background:#0d0d1a;color:#d4d4d4;border:none;padding:12px;font-size:12px;font-family:monospace;resize:none;outline:none;line-height:1.6;';
        cssPane.appendChild(cssLabel);
        cssPane.appendChild(cssArea);

        wrap.appendChild(htmlPane);
        wrap.appendChild(cssPane);

        const outer = document.createElement('div');
        outer.style.cssText = 'display:flex;flex-direction:column;width:860px;max-width:96vw;';
        outer.appendChild(wrap);

        const footer = document.createElement('div');
        footer.style.cssText = 'display:flex;justify-content:flex-end;gap:8px;padding:10px 0 2px;';

        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Cancelar';
        cancelBtn.style.cssText = 'background:#2a2a3e;color:#ccc;border:none;border-radius:4px;padding:7px 18px;cursor:pointer;font-size:13px;font-family:sans-serif;';
        cancelBtn.onclick = () => modal.close();

        const applyBtn = document.createElement('button');
        applyBtn.textContent = '✓ Aplicar';
        applyBtn.style.cssText = 'background:#22c55e;color:#fff;border:none;border-radius:4px;padding:7px 20px;cursor:pointer;font-size:13px;font-weight:700;font-family:sans-serif;';
        applyBtn.onclick = () => {
          try {
            ed.setComponents(htmlArea.value);
            ed.setStyle(cssArea.value);
            healFaIcons(ed);
            modal.close();
          } catch(err) {
            alert('Erro ao aplicar: ' + err.message);
          }
        };

        footer.appendChild(cancelBtn);
        footer.appendChild(applyBtn);
        outer.appendChild(footer);

        modal.setTitle('Editor de Código');
        modal.setContent(outer);
        modal.open();
      }
    });

    // ── Save component ─────────────────────────────────────────────────────────
    async function saveComponent(name) {
      // Separar HTML limpo do JS para injeção correta nas páginas
      const rawHtml = editor.getHtml();
      const scriptMatches = [...rawHtml.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)];
      const extractedJs = scriptMatches.map(m => m[1].trim()).filter(Boolean).join('\n\n');
      const html = rawHtml.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '').trim();

      // Determinar js e jquery:
      // 1. Se o modal de código definiu valores pendentes, usar eles
      // 2. Senão, separar automaticamente do script extraído do HTML
      let js, jquery;
      if (editor._pendingJs !== undefined || editor._pendingJquery !== undefined) {
        js     = editor._pendingJs || '';
        jquery = editor._pendingJquery || '';
        // limpar pendências após uso
        delete editor._pendingJs;
        delete editor._pendingJquery;
      } else {
        // Auto-separação: extrair interior de $(function(){}) como jQuery
        const fnMatch = extractedJs.match(/\$\(\s*function\s*\([^)]*\)\s*\{([\s\S]*)\}\s*\)\s*;?\s*$/);
        const readyMatch = extractedJs.match(/\$\(\s*document\s*\)\.ready\s*\(\s*function\s*\([^)]*\)\s*\{([\s\S]*)\}\s*\)\s*;?\s*$/);
        if (fnMatch) {
          js = ''; jquery = fnMatch[1].trim();
        } else if (readyMatch) {
          js = ''; jquery = readyMatch[1].trim();
        } else if (/[\$]|jQuery/.test(extractedJs)) {
          js = ''; jquery = extractedJs.trim();
        } else {
          js = extractedJs.trim(); jquery = '';
        }
      }

      const payload = {
        name,
        html,
        js,
        jquery,
        css:         editor.getCss(),
        projectData: editor.getProjectData()
      };
      const res = await fetch('/api/components/save', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload)
      });
      if (res.ok) {
        const result = await res.json().catch(() => ({}));
        currentComponent = name;
        await loadLibrary();
        const affected = result.affectedPages || [];
        if (affected.length > 0) {
          showToast(`Componente "${name}" salvo! ${affected.length} página(s) atualizada(s): ${affected.join(', ')}`, 'success');
        } else {
          showToast(`Componente "${name}" salvo!`, 'success');
        }
      } else {
        showToast('Erro ao salvar componente.', 'error');
      }
    }

    // ── Delete component ───────────────────────────────────────────────────────
    async function deleteComponent(name) {
      if (!confirm(`Excluir o componente "${name}"?`)) return;
      await fetch('/api/components/delete', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name })
      });
      currentComponent = null;
      editor.setComponents('');
      editor.setStyle('');
      await loadLibrary();
      showToast(`Componente "${name}" excluído.`, 'success');
    }

    // ── Toast ──────────────────────────────────────────────────────────────────
    function showToast(msg, type = 'success') {
      const t = document.createElement('div');
      t.textContent = msg;
      t.style.cssText = `
        position:fixed;bottom:24px;right:24px;z-index:9999;
        background:${type === 'success' ? '#22c55e' : '#ef4444'};
        color:#fff;padding:10px 20px;border-radius:6px;font-size:14px;
        box-shadow:0 4px 12px rgba(0,0,0,.3);animation:fadeIn .2s ease;
      `;
      document.body.appendChild(t);
      setTimeout(() => t.remove(), 3000);
    }

    // ── Toolbar ────────────────────────────────────────────────────────────────

      // ── Remover botão nativo "View Code" do GrapesJS ─────────────────────
      (function removeViewCodeBtn() {
        function doRemove() {
          // Remover via Panels API
          try { editor.Panels.removeButton('options', 'export-template'); } catch(e) {}
          // Variável xf do GrapesJS mapeia para 'gjs-open-code' ou similar
          // Remover qualquer botão do painel options com className fa-code
          var panel = editor.Panels.getPanel('options');
          if (panel) {
            var btns = panel.get('buttons');
            if (btns) {
              var toRemove = btns.filter(function(b) {
                var cls = b.get('className') || '';
                return cls.indexOf('fa-code') > -1;
              });
              toRemove.forEach(function(b) { btns.remove(b); });
            }
          }
          // Remover elemento DOM diretamente como fallback
          setTimeout(function() {
            document.querySelectorAll('.gjs-pn-options .fa-code, .gjs-pn-options button[title="View code"]')
              .forEach(function(el) { el.style.setProperty('display','none','important'); });
          }, 200);
        }
        doRemove();
        editor.on('load', doRemove);
      }());

    editor.on('load', async () => {

      // ── Função para anexar click ao logo (abre painel Sobre) ──────────────
      function cmsAttachLogoClick() {
        var logo = document.getElementById('cms-toolbar-logo');
        if (!logo || logo._cmsAboutBound) return;
        logo._cmsAboutBound = true;
        logo.style.cursor = 'pointer';
        logo.title = 'Sobre o Visual CMS 360°';
        logo.addEventListener('click', function() {
          var panel = document.getElementById('cms-about-panel');
          var isOpen = panel && panel.classList.contains('active');
          if (isOpen) editor.stopCommand('cms-open-about-comp');
          else editor.runCommand('cms-open-about-comp');
        });
      }

      // ── Logo: injeta no painel devices-c ──────────────────────────────────
      var _doInjectLogo;
      (function injectToolbarLogo() {

        // CSS global: ocultar label Device
        if (!document.getElementById('cms-hide-device-label-style')) {
          var st = document.createElement('style');
          st.id = 'cms-hide-device-label-style';
          st.textContent = [
            '.gjs-devices-c .gjs-device-label { display:none !important; }',
            '.gjs-devices-c > span { display:none !important; }',
            '.gjs-devices-c label { display:none !important; }',
            '.gjs-select-label { display:none !important; }',
            '[class*="pn-panel"][class*="devices-c"] { display:flex; align-items:center; height:40px; max-height:40px; padding:0; overflow:hidden; }',
            '[class*="pn-panel"][class*="devices-c"].gjs-hidden { display:none; }',
          ].join('\n');
          document.head.appendChild(st);
        }

        function doInject() {
          _doInjectLogo = doInject;
          var panelModel = editor.Panels.getPanel('devices-c');
          var panelWrapper = panelModel && panelModel.view && panelModel.view.el;
          if (!panelWrapper) {
            var devEl = document.querySelector('.gjs-devices-c');
            panelWrapper = devEl ? devEl.parentElement : null;
          }
          if (!panelWrapper) { setTimeout(doInject, 100); return; }

          panelWrapper.style.alignItems = 'center';
          panelWrapper.style.overflow = 'hidden';

          var sel = panelWrapper.querySelector('select');
          if (sel && !sel.style.background) {
            sel.style.cssText = 'background:#2a2a3e;color:#ccc;border:1px solid #444;border-radius:4px;padding:2px 6px;font-size:12px;height:26px;cursor:pointer;outline:none;';
          }

          if (!document.getElementById('cms-toolbar-logo')) {
            var logo = document.createElement('div');
            logo.id = 'cms-toolbar-logo';
            logo.style.cssText = 'display:flex;align-items:center;padding:0 8px;flex-shrink:0;height:40px;overflow:hidden;border-right:1px solid rgba(255,255,255,0.12);margin-right:4px;cursor:pointer;';
            var img = document.createElement('img');
            img.src = '/VisualCMS360header.png';
            img.alt = 'Visual CMS 360°';
            img.draggable = false;
            img.style.cssText = 'height:22px;width:auto;display:block;user-select:none;';
            logo.appendChild(img);
            panelWrapper.prepend(logo);
            setTimeout(cmsAttachLogoClick, 100);
          }

          if (!panelWrapper._cmsLogoObserving) {
            panelWrapper._cmsLogoObserving = true;
            var obs = new MutationObserver(function() {
              if (!document.getElementById('cms-toolbar-logo')) doInject();
            });
            obs.observe(panelWrapper, { childList: true });
          }
        }

        doInject();
      })();


      // Voltar ao editor de páginas
      editor.Panels.addButton('options', [{
        id:        'go-pages',
        label:     '📄',
        className: 'gjs-pn-btn',
        attributes: { title: 'Ir para o Editor de Páginas' },
        command: { run: () => { window.location.href = '/editor'; } }
      }]);

      // Importar / Editar código
      editor.Panels.addButton('views', [{
        id: 'import-code-comp',
        label: '',
        className: 'gjs-pn-btn fa fa-code',
        command: 'import-code-comp',
        attributes: { title: 'Importar / Editar HTML & CSS do componente' },
        active: false,
      }]);

      // ── Botão Sobre (painel lateral) ───────────────────────────────────────
      editor.Panels.addButton('views', [{
        id: 'cms-about-comp',
        label: `<span style="font-size:13px;font-weight:700;letter-spacing:0.03em;padding:0 4px;">Sobre</span>`,
        command: 'cms-open-about-comp',
        attributes: { title: 'Sobre o VisualCMS360°' },
        active: false,
        togglable: true,
        className: 'gjs-pn-btn cms-about-btn',
      }]);

      // ── Painel lateral "Sobre" ─────────────────────────────────────────────
      (function() {
        if (!document.getElementById('cms-about-styles')) {
          var st = document.createElement('style');
          st.id = 'cms-about-styles';
          st.textContent = `
            .cms-about-btn { color: #a78bfa !important; }
            .cms-about-btn:hover, .cms-about-btn.gjs-pn-active { color: #c4b5fd !important; background: rgba(167,139,250,0.12) !important; }
            #cms-about-panel {
              display: none;
              position: absolute;
              inset: 0;
              overflow-y: auto;
              background: #232435;
              z-index: 10;
              padding: 18px 16px 24px;
              font-family: system-ui, sans-serif;
              color: #e2e4ef;
              animation: cmsAboutFadeIn 0.18s ease;
            }
            #cms-about-panel.active { display: block; }
            @keyframes cmsAboutFadeIn { from{opacity:0;transform:translateX(8px)} to{opacity:1;transform:none} }
            #cms-about-panel h3 {
              margin: 0 0 10px;
              font-size: 11px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.1em;
            }
            #cms-about-panel a { text-decoration: none; }
            #cms-about-panel a:hover { text-decoration: underline; }
            .cms-about-section { margin-bottom: 20px; }
            .cms-about-divider { border: none; border-top: 1px solid rgba(255,255,255,0.08); margin: 0 0 18px; }
            .cms-about-grid {
              display: grid;
              grid-template-columns: auto 1fr;
              gap: 5px 12px;
              font-size: 12.5px;
              line-height: 1.6;
              text-align: left;
            }
            .cms-about-label { color: #6b7280; white-space: nowrap; text-align: left; }
            .cms-about-value { color: #e2e4ef; text-align: left; }
            .cms-about-link { color: #60a5fa; }
            .cms-about-lic-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 4px 0;
              border-bottom: 1px solid rgba(255,255,255,0.05);
              font-size: 12px;
            }
            .cms-about-lic-row:last-child { border-bottom: none; }
            .cms-about-badge {
              font-size: 10.5px;
              font-weight: 600;
              padding: 1px 7px;
              border-radius: 4px;
              background: rgba(245,158,11,0.15);
              color: #f59e0b;
            }
            .cms-about-badge-sec { font-size: 10.5px; color: #6b7280; }
            #cms-about-logo-wrap {
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 4px 0 18px;
            }
            #cms-about-logo-wrap img { height: 22px; width: auto; }
            #cms-about-footer {
              text-align: center;
              font-size: 11px;
              color: #4b5563;
              margin-top: 6px;
            }
          `;
          document.head.appendChild(st);
        }

        function buildAboutPanel() {
          if (document.getElementById('cms-about-panel')) return;
          var container = document.querySelector('.gjs-pn-views-container');
          if (!container) { setTimeout(buildAboutPanel, 200); return; }

          var panel = document.createElement('div');
          panel.id = 'cms-about-panel';
          panel.innerHTML = `
            <div id="cms-about-logo-wrap">
              <img src="/VisualCMS360header.png" alt="Visual CMS 360°">
            </div>

            <div class="cms-about-section">
              <div style="text-align:center;margin-bottom:8px;">
                <img src="/glv.png" alt="Gerson Luis Vertematti" style="height:40px;width:40px;border-radius:50%;object-fit:cover;opacity:0.95;">
              </div>
              <h3 style="color:#60a5fa;text-align:center;">Autor</h3>
              <div class="cms-about-grid">
                <span class="cms-about-label">Nome</span>
                <span class="cms-about-value" style="font-weight:600;">Gerson Luis Vertematti</span>
                <span class="cms-about-label">Portal</span>
                <a class="cms-about-link" href="https://gersonlv.com.br" target="_blank">gersonlv.com.br</a>
                <span class="cms-about-label">Contato</span>
                <a class="cms-about-link" href="mailto:gersonlv@gmail.com">gersonlv@gmail.com</a>
                <span class="cms-about-label">Docs</span>
                <a class="cms-about-link" href="https://gersonlv.com.br/visual_cms_360" target="_blank">gersonlv.com.br/visual_cms_360</a>
                <span class="cms-about-label">GitHub</span>
                <a class="cms-about-link" href="https://github.com/vertematti/VisualCMS360" target="_blank">github.com/vertematti/VisualCMS360</a>
              </div>
            </div>

            <hr class="cms-about-divider">

            <div class="cms-about-section">
              <div style="text-align:center;margin-bottom:8px;">
                <img src="/openmaker.png" alt="Open Maker" style="height:40px;width:auto;opacity:0.92;">
              </div>
              <h3 style="color:#34d399;text-align:center;">Open Maker</h3>
              <p style="margin:0;font-size:12.5px;line-height:1.7;color:#c9cce0;">
                Gerson é <strong style="color:#34d399;">Educador Maker voluntário</strong> do
                <a style="color:#34d399;" href="https://www.dispensados.com.br" target="_blank">Open Maker</a>,
                iniciativa dedicada à educação criativa e cultura maker.
                O Visual CMS 360° nasceu desse espírito: uma ferramenta aberta e acessível para criadores de conteúdo.
              </p>
            </div>

            <hr class="cms-about-divider">

            <div class="cms-about-section">
              <h3 style="color:#f59e0b;">📄 Licenças</h3>
              <div>
                <div class="cms-about-lic-row"><span style="color:#e2e4ef;font-weight:600;">Visual CMS 360°</span><span class="cms-about-badge">GPL v3</span></div>
                <div class="cms-about-lic-row"><span style="color:#9ca3af;">Astro / @astrojs/node</span><span class="cms-about-badge-sec">MIT</span></div>
                <div class="cms-about-lic-row"><span style="color:#9ca3af;">GrapesJS</span><span class="cms-about-badge-sec">BSD-3-Clause</span></div>
                <div class="cms-about-lic-row"><span style="color:#9ca3af;">grapesjs-blocks-basic</span><span class="cms-about-badge-sec">BSD-3-Clause</span></div>
                <div class="cms-about-lic-row"><span style="color:#9ca3af;">grapesjs-tailwind</span><span class="cms-about-badge-sec">MIT</span></div>
                <div class="cms-about-lic-row"><span style="color:#9ca3af;">A-Frame</span><span class="cms-about-badge-sec">MIT</span></div>
                <div class="cms-about-lic-row"><span style="color:#9ca3af;">Pannellum</span><span class="cms-about-badge-sec">MIT</span></div>
                <div class="cms-about-lic-row"><span style="color:#9ca3af;">Tailwind CSS</span><span class="cms-about-badge-sec">MIT</span></div>
                <div class="cms-about-lic-row"><span style="color:#9ca3af;">Cheerio</span><span class="cms-about-badge-sec">MIT</span></div>
              </div>
            </div>

          `;
          container.appendChild(panel);
        }

        editor.on('load', buildAboutPanel);

        editor.Commands.add('cms-open-about-comp', {
          run: function() {
            buildAboutPanel();
            var panel = document.getElementById('cms-about-panel');
            if (panel) panel.classList.add('active');
          },
          stop: function() {
            var panel = document.getElementById('cms-about-panel');
            if (panel) panel.classList.remove('active');
          }
        });

      }());

      editor.Commands.add('import-code-comp', {
        run(ed, sender) {
          sender && sender.set('active', 0);

          function extractScripts(html) {
            const matches = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)];
            return matches.map(m => m[1].trim()).filter(Boolean).join('\n\n');
          }
          function stripScripts(html) {
            return html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '').trim();
          }

          // ── Syntax highlighters ────────────────────────────────────────────

          function highlightHTML(code) {
            // Escape primeiro
            let out = code
              .replace(/&/g,'&amp;')
              .replace(/</g,'&lt;')
              .replace(/>/g,'&gt;');

            // Comentários HTML
            out = out.replace(/(&lt;!--[\s\S]*?--&gt;)/g,
              '<span style="color:#6a9955">$1</span>');

            // Tags: colorir nome da tag sem afetar atributos já processados
            // Processa cada "token" de tag completo de forma isolada
            out = out.replace(/(&lt;\/?)([\w-]+)(\s[^&]*?)?(\/?&gt;)/g,
              function(m, open, tag, attrs, close) {
                let result = open + '<span style="color:#4ec9b0">' + tag + '</span>';
                if (attrs) {
                  // Colorir atributos: nome=valor
                  let a = attrs
                    .replace(/([\w:-]+)(=)/g,
                      '<span style="color:#9cdcfe">$1</span>$2')
                    .replace(/(=)(&quot;[^&]*?&quot;|'[^']*?')/g,
                      '$1<span style="color:#ce9178">$2</span>');
                  result += a;
                }
                result += (close || '');
                return result;
              });

            // Tags de fechamento simples sem attrs já capturadas acima
            out = out.replace(/(&lt;\/)([\w-]+)(&gt;)/g,
              function(m, open, tag, close) {
                if (m.includes('<span')) return m; // já processado
                return open + '<span style="color:#4ec9b0">' + tag + '</span>' + close;
              });

            return out;
          }

          function highlightCSS(code) {
            // Escapar tudo primeiro
            let esc = code.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
            // Processar linha a linha para evitar contaminação entre spans
            const lines = esc.split('\n');
            let inComment = false;
            const out = lines.map(line => {
              // Comentários multilinha
              if (inComment) {
                if (line.includes('*/')) {
                  const idx = line.indexOf('*/') + 2;
                  const commented = '<span style="color:#6a9955">' + line.slice(0, idx) + '</span>';
                  inComment = false;
                  return commented + highlightCssLine(line.slice(idx));
                }
                return '<span style="color:#6a9955">' + line + '</span>';
              }
              // Comentário inicia nesta linha?
              const cStart = line.indexOf('/*');
              if (cStart > -1 && line.indexOf('*/', cStart) === -1) {
                inComment = true;
                return highlightCssLine(line.slice(0, cStart)) +
                  '<span style="color:#6a9955">' + line.slice(cStart) + '</span>';
              }
              return highlightCssLine(line);
            });
            return out.join('\n');
          }
          function highlightCssLine(line) {
            // Comentário inline completo /* ... */
            line = line.replace(/(\/\*.*?\*\/)/g, '\x00C\x01$1\x00c\x01');
            // Seletor: linha que termina com {
            if (/\{\s*$/.test(line) && !line.includes(':')) {
              line = line.replace(/^(\s*)([^{]+?)(\s*\{\s*)$/,
                '$1\x00S\x01$2\x00s\x01$3');
            } else {
              // Propriedade: valor;
              line = line.replace(/^(\s*)([\w-]+)(\s*:\s*)([^;]*)(;?)\s*$/,
                '$1\x00P\x01$2\x00p\x01$3\x00V\x01$4\x00v\x01$5');
            }
            // Converter marcadores em spans (seguro, pois texto já escapado)
            return line
              .replace(/\x00C\x01/g,'<span style="color:#6a9955">').replace(/\x00c\x01/g,'</span>')
              .replace(/\x00S\x01/g,'<span style="color:#d7ba7d">').replace(/\x00s\x01/g,'</span>')
              .replace(/\x00P\x01/g,'<span style="color:#9cdcfe">').replace(/\x00p\x01/g,'</span>')
              .replace(/\x00V\x01/g,'<span style="color:#ce9178">').replace(/\x00v\x01/g,'</span>');
          }
          function highlightJS(code) {
            // Escapar primeiro
            let esc = code.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
            // Usar marcadores temporários para evitar contaminação
            // Comentários de linha
            esc = esc.replace(/(\/\/[^\n]*)/g,'\x00C\x01$1\x00c\x01');
            // Comentários de bloco
            esc = esc.replace(/(\/\*[\s\S]*?\*\/)/g,'\x00C\x01$1\x00c\x01');
            // Strings
            esc = esc.replace(/('[^'\n]*'|"[^"\n]*"|`[^`]*`)/g,'\x00T\x01$1\x00t\x01');
            // Keywords (só fora de marcadores já inseridos)
            esc = esc.replace(/\b(var|let|const|function|return|if|else|for|while|do|new|this|class|import|export|from|async|await|try|catch|finally|typeof|instanceof|null|undefined|true|false)\b/g,
              '\x00K\x01$1\x00k\x01');
            // Converter marcadores em spans
            return esc
              .replace(/\x00C\x01/g,'<span style="color:#6a9955">').replace(/\x00c\x01/g,'</span>')
              .replace(/\x00T\x01/g,'<span style="color:#ce9178">').replace(/\x00t\x01/g,'</span>')
              .replace(/\x00K\x01/g,'<span style="color:#c586c0">').replace(/\x00k\x01/g,'</span>');
          }

          // ── Editor sintático ───────────────────────────────────────────────
          function makeEditor(id, lang, placeholder='') {
            const wrap = document.createElement('div');
            wrap.style.cssText = 'position:relative;border:1px solid #444;border-radius:4px;background:#0d0d1a;overflow:hidden;flex:1;min-height:80px;';
            const nums = document.createElement('div');
            nums.style.cssText = 'position:absolute;top:0;left:0;width:34px;padding:12px 0;text-align:right;color:#555;font:12px/1.6 monospace;user-select:none;background:#080810;border-right:1px solid #333;overflow:hidden;box-sizing:border-box;';
            const hi = document.createElement('div');
            hi.style.cssText = 'position:absolute;inset:0;left:38px;padding:12px;font:12px/1.6 monospace;white-space:pre;pointer-events:none;overflow:hidden;word-break:break-all;color:#d4d4d4;';
            const ta = document.createElement('textarea');
            ta.id = id; ta.placeholder = placeholder; ta.spellcheck = false;
            ta.style.cssText = 'position:relative;left:38px;width:calc(100% - 38px);height:100%;background:transparent;color:transparent;caret-color:#fff;padding:12px;border:none;outline:none;font:12px/1.6 monospace;resize:none;box-sizing:border-box;white-space:pre;overflow-x:auto;';
            function renderHighlight() {
              const val = ta.value;
              nums.innerHTML = val.split('\n').map((_,i)=>`<div style="padding:0 6px">${i+1}</div>`).join('');
              let h; if (lang==='html') h=highlightHTML(val); else if (lang==='css') h=highlightCSS(val); else h=highlightJS(val);
              hi.innerHTML = h + '\n';
              hi.scrollTop = ta.scrollTop; hi.scrollLeft = ta.scrollLeft;
            }
            ta.addEventListener('input', renderHighlight);
            ta.addEventListener('scroll', ()=>{ hi.scrollTop=ta.scrollTop; hi.scrollLeft=ta.scrollLeft; nums.scrollTop=ta.scrollTop; });
            ta.addEventListener('keydown', e=>{ if(e.key==='Tab'){e.preventDefault();const s=ta.selectionStart;ta.value=ta.value.slice(0,s)+'  '+ta.value.slice(ta.selectionEnd);ta.selectionStart=ta.selectionEnd=s+2;renderHighlight();} });
            wrap.appendChild(nums); wrap.appendChild(hi); wrap.appendChild(ta);
            wrap._ta = ta; wrap._render = renderHighlight;
            return wrap;
          }

          // ── Estilos do modal ───────────────────────────────────────────────
          if (!document.getElementById('imp-comp-modal-styles')) {
            const s = document.createElement('style');
            s.id = 'imp-comp-modal-styles';
            s.textContent = `
              #imp-comp-wrap { display:flex;flex-direction:column;height:calc(94vh - 56px);padding:10px;gap:6px;overflow:hidden; }
              .imp-comp-section { display:flex;flex-direction:column;gap:4px;min-height:0; }
              .imp-comp-section.collapsed .imp-comp-ew { display:none!important; }
              .imp-comp-hdr { display:flex;align-items:center;gap:6px;cursor:pointer;user-select:none;padding:4px 8px;border-radius:4px;background:rgba(255,255,255,0.05);color:#ccc;font-size:12px;font-weight:600; }
              .imp-comp-hdr:hover { background:rgba(255,255,255,0.09); }
              .imp-comp-arrow { font-size:10px;transition:transform .2s; }
              .imp-comp-section.collapsed .imp-comp-arrow { transform:rotate(-90deg); }
              .imp-comp-badge { margin-left:auto;font-size:10px;color:#666;font-weight:400; }
              .imp-comp-ew { flex:1;display:flex;min-height:0; }
              .imp-comp-section:not(.collapsed) { flex:1; }
              #imp-comp-apply { background:#3b82f6;color:#fff;border:none;border-radius:4px;padding:8px 20px;cursor:pointer;font-size:13px;font-weight:600;margin-top:4px;align-self:flex-end;flex-shrink:0; }
              #imp-comp-apply:hover { background:#2563eb; }
            `;
            document.head.appendChild(s);
          }

          const wrap = document.createElement('div');
          wrap.id = 'imp-comp-wrap';

          function makeSection(label, langTag, color, placeholder='') {
            const sec = document.createElement('div');
            sec.className = 'imp-comp-section';
            const hdr = document.createElement('div');
            hdr.className = 'imp-comp-hdr';
            hdr.innerHTML = `<span class="imp-comp-arrow">▼</span> <span style="color:${color}">${label}</span> <span class="imp-comp-badge">${langTag}</span>`;
            const ew = document.createElement('div');
            ew.className = 'imp-comp-ew';
            const ed2 = makeEditor(`comp-imp-${langTag}`, langTag, placeholder);
            ed2.style.width = '100%';
            ew.appendChild(ed2);
            hdr.addEventListener('click', ()=> sec.classList.toggle('collapsed'));
            sec.appendChild(hdr); sec.appendChild(ew);
            sec._editor = ed2;
            return sec;
          }

          const secHtml = makeSection('HTML', 'html', '#4ec9b0');
          const secCss  = makeSection('CSS',  'css',  '#d7ba7d');
          const secJs   = makeSection('JavaScript', 'js', '#c586c0', '// JavaScript puro (sem jQuery, sem tags <script>)');
          const secJq   = makeSection('jQuery', 'js', '#2563eb', '// Código jQuery — será envolvido em $(function(){ ... }) na página');
          secCss.classList.add('collapsed');
          secJs.classList.add('collapsed');
          secJq.classList.add('collapsed');

          const applyBtn = document.createElement('button');
          applyBtn.id = 'imp-comp-apply';
          applyBtn.textContent = '✓ Aplicar';

          wrap.appendChild(secHtml); wrap.appendChild(secCss); wrap.appendChild(secJs); wrap.appendChild(secJq); wrap.appendChild(applyBtn);

          // Separar código JS puro de código jQuery
          // jQuery: linhas/blocos que usam $ ou jQuery
          function splitJsAndJquery(rawJs) {
            if (!rawJs || !rawJs.trim()) return { js: '', jquery: '' };
            // Se já houver wrapper $(function(){...}) ou $(document).ready, extrair o interior como jQuery
            const readyMatch = rawJs.match(/\$\(\s*(?:document)?\s*\)?\.?\s*(?:ready\s*\(\s*)?function\s*\([^)]*\)\s*\{([\s\S]*)\}\s*\)?\s*;?\s*$/);
            const fnMatch = rawJs.match(/^\s*\$\(\s*function\s*\([^)]*\)\s*\{([\s\S]*)\}\s*\)\s*;?\s*$/);
            if (fnMatch) return { js: '', jquery: fnMatch[1].trim() };
            if (readyMatch) return { js: '', jquery: readyMatch[1].trim() };
            // Heurística: se contém $ ou jQuery, tratar tudo como jQuery
            if (/[\$]|jQuery/.test(rawJs)) {
              return { js: '', jquery: rawJs.trim() };
            }
            return { js: rawJs.trim(), jquery: '' };
          }

          const currentHtml = ed.getHtml();
          // GrapesJS retorna <body>...</body> — extrair apenas o conteúdo interno
          const innerHtml = currentHtml.replace(/^<body[^>]*>([\s\S]*)<\/body>$/i, '$1').trim();
          secHtml._editor._ta.value = formatHTML(stripScripts(innerHtml));
          secCss._editor._ta.value  = formatCSS(ed.getCss());

          // Carregar JS e jQuery — preferir campos salvos; fallback: extrair do HTML
          const savedComp = currentComponent ? componentList[currentComponent] : null;
          if (savedComp && (savedComp.js || savedComp.jquery)) {
            secJs._editor._ta.value = savedComp.js || '';
            secJq._editor._ta.value = savedComp.jquery || '';
          } else {
            const extracted = extractScripts(currentHtml);
            const split = splitJsAndJquery(extracted);
            secJs._editor._ta.value = split.js;
            secJq._editor._ta.value = split.jquery;
          }
          secHtml._editor._render(); secCss._editor._render(); secJs._editor._render(); secJq._editor._render();

          applyBtn.onclick = () => {
            let html = secHtml._editor._ta.value;
            const js = secJs._editor._ta.value.trim();
            const jq = secJq._editor._ta.value.trim();
            // Reconstruir script combinado para o canvas (preview):
            // jQuery dentro de $(function(){}) para funcionar no canvas também
            let scriptContent = '';
            if (js) scriptContent += js + '\n';
            if (jq) scriptContent += '\n$(function(){\n' + jq + '\n});\n';
            if (scriptContent.trim()) html += '\n<script>\n' + scriptContent + '\n<\/script>';
            ed.setComponents(html);
            ed.setStyle(secCss._editor._ta.value);
            healFaIcons(ed);
            // Guardar js e jquery separados para o save usar
            ed._pendingJs = js;
            ed._pendingJquery = jq;
            ed.Modal.close();
          };

          ed.Modal.setTitle('✏️ Editar / Importar Código do Componente');
          ed.Modal.setContent(wrap);
          ed.Modal.open();

          setTimeout(()=>{
            const dlg = document.querySelector('.gjs-mdl-dialog');
            if (dlg) { dlg.style.width='min(900px,95vw)'; dlg.style.maxHeight='96vh'; dlg.style.height='96vh'; }
            const cont = document.querySelector('.gjs-mdl-content');
            if (cont) { cont.style.padding='0'; cont.style.overflow='hidden'; }
            [secHtml,secCss,secJs,secJq].forEach(s=>s._editor._render());
          }, 30);
        }
      });

      // Reset site
      editor.Panels.addButton('options', [{
        id:        'reset-site',
        label:     '⚠️',
        className: 'gjs-pn-btn',
        attributes: { title: 'Apagar todas as páginas e componentes permanentemente' },
        command: {
          run: async () => {
            if (confirm('ATENÇÃO: Você está prestes a apagar permanentemente todas as páginas e componentes do site. Deseja continuar?')) {
              try {
                await fetch('/api/reset', { method: 'POST' });
                window.location.reload();
              } catch(e) { alert('Erro ao resetar.'); }
            }
          }
        }
      }]);

      // Component selector + Save + Delete — mesmo padrão da combo de páginas
      editor.Panels.addButton('options', [{
        id: 'comp-manager',
        className: 'gjs-pn-btn',
        attributes: {
          style: 'display:inline-flex;align-items:center;margin-right:12px;background:#222;border-radius:4px;padding:3px 6px;'
        },
        label: `
          <select id="comp-selector" style="background:transparent;color:#fff;border:none;outline:none;cursor:pointer;max-width:150px;font-size:12px;">
            <option value="">— Novo componente —</option>
          </select>
          <button id="comp-save-btn" title="Salvar componente" style="background:#22c55e;color:#fff;border:none;border-radius:3px;padding:2px 8px;margin-left:6px;cursor:pointer;font-size:14px;">💾</button>
          <button id="comp-delete-btn" title="Excluir componente" style="background:#ef4444;color:#fff;border:none;border-radius:3px;padding:2px 8px;margin-left:4px;cursor:pointer;font-size:12px;display:none;">🗑️</button>
        `,
        command: ''
      }]);

      await loadLibrary();

      // ── Fechar e reordenar categorias de blocos ──────────────────────────
      const COMP_CATEGORY_ORDER = {
        'Media':   0, 'Basic':   1, 'Header':  2,
        'Content': 3, 'Footer':  4,
      };
      function applyCompCategoryOrder() {
        try {
          const cats = editor.BlockManager.getCategories();
          cats.each(cat => {
            const label = cat.get('label') || cat.id || '';
            const orderVal = COMP_CATEGORY_ORDER.hasOwnProperty(label)
              ? COMP_CATEGORY_ORDER[label]
              : 100 + label.charCodeAt(0);
            cat.set('order', orderVal);
            cat.set('open', false);
          });
          editor.BlockManager.render();
        } catch(e) {}
      }
      editor.on('block:add', applyCompCategoryOrder);
      setTimeout(applyCompCategoryOrder, 600);

      // ── Gaveta: botão para recolher/expandir painel lateral ───────────────
      (function initDrawerToggle() {
        var toggleBtn = document.getElementById('cms-drawer-toggle');
        if (!toggleBtn) return;

        var collapsed = false;
        var PANEL_W = 320;  /* deve coincidir com --cms-panel-width no CSS */

        function setPanels(col) {
          var views     = document.querySelector('.gjs-pn-views');
          var viewsCont = document.querySelector('.gjs-pn-views-container');
          var canvas    = document.querySelector('.gjs-cv-canvas');
          var commands  = document.querySelector('.gjs-pn-commands');
          var options   = document.querySelector('.gjs-pn-options');

          if (!views || !viewsCont || !canvas) return false;

          if (col) {
            views.style.right     = (-PANEL_W) + 'px';
            viewsCont.style.right = (-PANEL_W) + 'px';
            if (options) options.style.right = '0px';
            canvas.style.width = '100%';
            if (commands) commands.style.width = '100%';
          } else {
            views.style.right     = '0px';
            viewsCont.style.right = '0px';
            if (options) options.style.right = PANEL_W + 'px';
            canvas.style.width = 'calc(100% - ' + PANEL_W + 'px)';
            if (commands) commands.style.width = 'calc(100% - ' + PANEL_W + 'px)';
          }
          return true;
        }

        function setCollapsed(val) {
          collapsed = val;
          var ok = setPanels(collapsed);
          if (!ok) setTimeout(function() { setPanels(collapsed); }, 200);
          toggleBtn.style.right = collapsed ? '0px' : PANEL_W + 'px';
          var svg = toggleBtn.querySelector('svg');
          if (svg) svg.style.transform = collapsed ? 'scaleX(1)' : 'scaleX(-1)';
          setTimeout(function() { try { editor.refresh(); } catch(e) {} }, 320);
        }

        toggleBtn.addEventListener('click', function() { setCollapsed(!collapsed); });
        setTimeout(function() { setCollapsed(false); }, 600);
      })();

      // ── Preview: ocultar toggle; GrapesJS já oculta os painéis ──────────────
      editor.on('command:run:preview', function() {
        var tb = document.getElementById('cms-drawer-toggle');
        if (tb) tb.style.setProperty('display', 'none', 'important');
      });
      editor.on('command:stop:preview', function() {
        var tb = document.getElementById('cms-drawer-toggle');
        if (tb) tb.style.removeProperty('display');
        // Reinjetar logo se necessário
        setTimeout(function() {
          if (!document.getElementById('cms-toolbar-logo') && _doInjectLogo) {
            _doInjectLogo();
          }
        }, 80);
      });

      // ── Fullscreen: mover toggle para dentro do elemento fullscreen ──────────
      // requestFullscreen() é assíncrono — usar fullscreenchange
      (function() {
        var PANEL_W = 320;
        editor.on('command:run:fullscreen', function() {
          function onFsEnter() {
            document.removeEventListener('fullscreenchange', onFsEnter);
            document.removeEventListener('webkitfullscreenchange', onFsEnter);
            var tb   = document.getElementById('cms-drawer-toggle');
            var fsEl = document.fullscreenElement || document.webkitFullscreenElement;
            if (!tb || !fsEl) return;
            if (!tb._origParent) {
              tb._origParent      = tb.parentNode;
              tb._origNextSibling = tb.nextSibling;
            }
            fsEl.appendChild(tb);
            var views     = fsEl.querySelector('.gjs-pn-views');
            var panelOpen = !views || views.style.right !== (-PANEL_W) + 'px';
            tb.style.right = panelOpen ? PANEL_W + 'px' : '0px';
            tb.style.removeProperty('display');
          }
          document.addEventListener('fullscreenchange', onFsEnter);
          document.addEventListener('webkitfullscreenchange', onFsEnter);
        });
        editor.on('command:stop:fullscreen', function() {
          function onFsExit() {
            document.removeEventListener('fullscreenchange', onFsExit);
            document.removeEventListener('webkitfullscreenchange', onFsExit);
            var tb = document.getElementById('cms-drawer-toggle');
            if (!tb || !tb._origParent) return;
            if (tb._origNextSibling) {
              tb._origParent.insertBefore(tb, tb._origNextSibling);
            } else {
              tb._origParent.appendChild(tb);
            }
            tb._origParent      = null;
            tb._origNextSibling = null;
          }
          document.addEventListener('fullscreenchange', onFsExit);
          document.addEventListener('webkitfullscreenchange', onFsExit);
        });
      }());


      // ── Editar classe (renomear + CSS) no Style Manager ──────────────────
      (function initClassRenameComp() {

        if (!document.getElementById('cms-cls-style')) {
          var rs = document.createElement('style');
          rs.id = 'cms-cls-style';
          rs.textContent = `
            .cms-clm-edit { display:inline-flex;align-items:center;justify-content:center;width:12px;height:12px;margin-left:3px;cursor:pointer;opacity:0.5;flex-shrink:0;transition:opacity .15s; }
            .cms-clm-edit:hover { opacity:1; }
            .cms-clm-edit svg { fill:currentColor;display:block; }
            #cms-cls-modal { display:none;position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,0.62);backdrop-filter:blur(4px);align-items:center;justify-content:center; }
            #cms-cls-modal.open { display:flex; }
            #cms-cls-dialog { background:#1a1b2e;border-radius:12px;border:1px solid rgba(255,255,255,0.1);box-shadow:0 24px 64px rgba(0,0,0,0.7);padding:24px;width:520px;max-width:94vw;font-family:system-ui,sans-serif;color:#e2e4ef;animation:clsIn .18s ease; }
            @keyframes clsIn { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:none} }
            #cms-cls-dialog h4 { margin:0 0 16px;font-size:14px;font-weight:700;color:#9cdcfe;display:flex;align-items:center;gap:8px; }
            .cms-cls-row { margin-bottom:12px; }
            .cms-cls-label { display:block;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;margin-bottom:5px; }
            #cms-cls-name-input { width:100%;box-sizing:border-box;background:#0d0d1a;color:#9cdcfe;border:1px solid #334155;border-radius:6px;padding:8px 12px;font-size:13px;font-family:monospace;outline:none; }
            #cms-cls-name-input:focus { border-color:#3b82f6; }
            #cms-cls-css-input { width:100%;box-sizing:border-box;min-height:140px;background:#0d0d1a;color:#d4d4d4;border:1px solid #334155;border-radius:6px;padding:10px 12px;font-size:12px;font-family:monospace;line-height:1.7;outline:none;resize:vertical; }
            #cms-cls-css-input:focus { border-color:#d7ba7d; }
            .cms-cls-hint { font-size:10px;color:#4b5563;margin-top:4px; }
            .cms-cls-btns { display:flex;gap:8px;justify-content:flex-end;margin-top:16px; }
            .cms-cls-btns button { padding:8px 20px;border-radius:6px;border:none;font-size:13px;font-weight:600;cursor:pointer;transition:background .15s; }
            #cms-cls-cancel { background:rgba(255,255,255,0.07);color:#9ca3af; }
            #cms-cls-cancel:hover { background:rgba(255,255,255,0.13); }
            #cms-cls-ok { background:#3b82f6;color:#fff; }
            #cms-cls-ok:hover { background:#2563eb; }
            #cms-cls-name-input[readonly] { opacity:0.55; cursor:default; }
            #cms-cls-tw-badge { display:none; }

          `;
          document.head.appendChild(rs);
        }

        if (!document.getElementById('cms-cls-modal')) {
          var modal = document.createElement('div');
          modal.id = 'cms-cls-modal';
          modal.innerHTML = `
            <div id="cms-cls-dialog">
              <h4>✏️ Editar Classe</h4>
              <div class="cms-cls-row" id="cms-cls-name-row">
                <span class="cms-cls-label">Nome da classe <span id="cms-cls-tw-badge" style="display:none;margin-left:6px;background:#0f3460;color:#38bdf8;font-size:9px;padding:1px 6px;border-radius:3px;font-weight:700;letter-spacing:.04em;vertical-align:middle;">TAILWIND</span></span>
                <input id="cms-cls-name-input" type="text" autocomplete="off" spellcheck="false" placeholder="nome-da-classe" />
                <div class="cms-cls-hint">Tailwind: nome somente leitura. Classes custom: renomeie livremente.</div>
              </div>
              <div class="cms-cls-row">
                <span class="cms-cls-label">Propriedades CSS</span>
                <textarea id="cms-cls-css-input" spellcheck="false" placeholder="color: red;\nfont-size: 16px;"></textarea>
                <div class="cms-cls-hint" id="cms-cls-css-hint">Escreva as propriedades (sem seletor, sem chaves). Ctrl+Enter aplica.</div>
              </div>
              <div class="cms-cls-btns">
                <button id="cms-cls-cancel">Cancelar</button>
                <button id="cms-cls-ok">✓ Aplicar</button>
              </div>
            </div>
          `;
          document.body.appendChild(modal);
          document.getElementById('cms-cls-cancel').onclick = function() { modal.classList.remove('open'); };
          modal.addEventListener('click', function(e) { if (e.target === modal) modal.classList.remove('open'); });
          document.addEventListener('keydown', function(e) { if (e.key === 'Escape' && modal.classList.contains('open')) modal.classList.remove('open'); });
        }

        var pencilSVG = '<svg width="10" height="10" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm17.71-10.21a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>';

        // Extrair propriedades CSS de uma classe do CSS atual

        // Prefixos/padrões de classes Tailwind conhecidas
        var TAILWIND_PATTERNS = [
          /^(m|p)[trblxy]?-/, /^(w|h)-/, /^(min|max)-(w|h)-/,
          /^text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl|left|center|right|justify|gray|red|blue|green|yellow|indigo|purple|pink|white|black)/,
          /^(font)-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black|sans|serif|mono)/,
          /^(bg|border|ring|shadow|outline)(-|$)/, /^(flex|grid|block|inline|hidden|table)(-|$)/,
          /^(items|justify|self|content|place)(-|$)/, /^(gap|space)(-|$)/,
          /^(rounded|overflow|opacity|cursor|pointer|select|resize)(-|$)/,
          /^(absolute|relative|fixed|sticky|static)$/, /^(top|right|bottom|left|inset)(-|$)/,
          /^(z|order)(-|$)/, /^(col|row)(-|$)/, /^(transition|duration|ease|delay|animate)(-|$)/,
          /^(scale|rotate|translate|skew|origin)(-|$)/, /^(sr-only|not-sr-only)$/,
          /^(leading|tracking|whitespace|break|truncate|line-clamp)(-|$)/,
          /^(list|decoration|underline|italic|uppercase|lowercase|capitalize|normal-case)(-|$)/,
          /^(border-(t|r|b|l|x|y|0|2|4|8|solid|dashed|dotted|double|none))$/,
          /^(divide|ring|shadow)(-|$)/, /^(container|prose|aspect)(-|$)/,
          /^(sm:|md:|lg:|xl:|2xl:|hover:|focus:|active:|disabled:|dark:)/,
          /^(p|m)\d/, /^(w|h)\d/, /^(text|bg|border)-\[/
        ];
        function isTailwindClass(cls) {
          return TAILWIND_PATTERNS.some(function(rx) { return rx.test(cls); });
        }

        // Tentar ler o CSS computado da classe do canvas do GrapesJS
        function getComputedClassCss(className) {
          try {
            var iframe = document.querySelector('.gjs-frame');
            if (!iframe) return null;
            var doc = iframe.contentDocument || iframe.contentWindow.document;
            // Criar elemento temporário com a classe para obter o computado
            var tmp = doc.createElement('div');
            tmp.className = className;
            tmp.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none;';
            doc.body.appendChild(tmp);
            var computed = iframe.contentWindow.getComputedStyle(tmp);
            // Coletar propriedades não-default relevantes
            var props = [
              'color','background-color','background','font-size','font-weight','font-family',
              'line-height','letter-spacing','text-align','text-decoration','text-transform',
              'padding','padding-top','padding-right','padding-bottom','padding-left',
              'margin','margin-top','margin-right','margin-bottom','margin-left',
              'width','height','min-width','min-height','max-width','max-height',
              'display','flex-direction','align-items','justify-content','flex-wrap','gap',
              'grid-template-columns','grid-template-rows',
              'border','border-radius','border-color','border-width','border-style',
              'box-shadow','opacity','overflow','position','top','right','bottom','left',
              'z-index','cursor','transition','transform'
            ];
            var lines = [];
            props.forEach(function(p) {
              var val = computed.getPropertyValue(p);
              if (val && val !== '' && val !== 'none' && val !== 'normal' && val !== 'auto'
                  && val !== '0px' && val !== 'rgba(0, 0, 0, 0)' && val !== 'rgb(0, 0, 0)'
                  && val !== 'static' && val !== 'visible' && val !== '1') {
                // Skip shorthand if already individual values collected
                if ((p === 'padding' || p === 'margin') && lines.some(function(l){ return l.startsWith(p+'-'); })) return;
                lines.push(p + ': ' + val + ';');
              }
            });
            doc.body.removeChild(tmp);
            return lines.length ? lines.join('\n') : null;
          } catch(e) { return null; }
        }

        // Extrair propriedades CSS de uma classe do CSS gerenciado pelo GrapesJS
        function getClassCssBody(className) {
          var css = editor.getCss() || '';
          var escaped = className.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          var rx = new RegExp('[^}]*\\.\\s*' + escaped + '\\s*\\{([^}]*)\\}', 'i');
          var m = css.match(rx);
          if (!m) return '';
          return m[1].replace(/;\s*/g, ';\n').replace(/^\s+|\s+$/gm, '').trim();
        }

        // Substituir/inserir regra CSS de uma classe no GrapesJS
        function setClassCssBody(className, newBody) {
          var css = editor.getCss() || '';
          var escaped = className.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          var rx = new RegExp('[^{]*\\.\\s*' + escaped + '\\s*\\{[^}]*\\}', 'gi');
          var newRule = '.' + className + ' { ' + newBody.trim().replace(/\n/g, ' ') + ' }';
          if (rx.test(css)) {
            css = css.replace(rx, newRule);
          } else {
            css = css + '\n' + newRule;
          }
          editor.setStyle(css);
        }

        function injectEditButtons() {
          document.querySelectorAll('.gjs-clm-tag').forEach(function(tag) {
            if (tag.querySelector('.cms-clm-edit')) return;
            var closeBtn = tag.querySelector('.gjs-clm-tag-close');
            if (!closeBtn) return;

            var editBtn = document.createElement('span');
            editBtn.className = 'cms-clm-edit';
            editBtn.title = 'Editar classe (CSS + renomear)';
            editBtn.innerHTML = pencilSVG;

            editBtn.addEventListener('click', function(e) {
              e.stopPropagation();

              // Obter nome atual da classe
              var tagText = '';
              tag.childNodes.forEach(function(n) { if (n.nodeType === 3 && n.textContent.trim()) tagText = n.textContent.trim(); });
              if (!tagText) {
                var st = tag.querySelector('.gjs-clm-tag-status');
                tagText = st ? tag.textContent.replace(st.textContent, '').trim() : tag.textContent.trim();
              }

              tagText = tagText.replace(/^\./, '').trim();

              var isTW   = isTailwindClass(tagText);
              var modal   = document.getElementById('cms-cls-modal');
              var nameInp = document.getElementById('cms-cls-name-input');
              var cssInp  = document.getElementById('cms-cls-css-input');
              var hintEl  = document.getElementById('cms-cls-css-hint');
              var badgeEl = document.getElementById('cms-cls-tw-badge');
              var nameRow = document.getElementById('cms-cls-name-row');

              // Classe Tailwind: nome não é editável (não faz sentido renomear)
              // Classe custom: editável normalmente
              nameInp.value    = tagText;
              nameInp.readOnly = isTW;
              nameInp.style.color    = isTW ? '#6b7280' : '';
              nameInp.style.cursor   = isTW ? 'default' : '';
              nameInp.style.borderColor = isTW ? '#1f2937' : '';
              if (badgeEl) badgeEl.style.display = isTW ? 'inline-flex' : 'none';

              // Preencher CSS:
              // - Custom: CSS do GrapesJS (o que foi salvo no editor)
              // - Tailwind: CSS computado do canvas OU vazio (para criar override)
              var existingCss = getClassCssBody(tagText);
              if (existingCss) {
                cssInp.value = existingCss;
                if (hintEl) hintEl.textContent = isTW
                  ? 'Override Tailwind ativo. Ctrl+Enter aplica. Limpe o campo para remover o override.'
                  : 'Propriedades da classe. Ctrl+Enter aplica.';
              } else if (isTW) {
                // Tentar mostrar o CSS computado como referência (read-only comentado)
                var computed = getComputedClassCss(tagText);
                if (computed) {
                  cssInp.value = '/* CSS Tailwind atual (leitura) — edite para criar override: */\n/*\n' + computed + '\n*/\n\n/* Seu override: */\n';
                } else {
                  cssInp.value = '/* Classe Tailwind: escreva propriedades para sobrescrever */\n';
                }
                if (hintEl) hintEl.textContent = 'Tailwind: escreva propriedades para criar override. Ctrl+Enter aplica.';
              } else {
                cssInp.value = '';
                if (hintEl) hintEl.textContent = 'Classe custom sem CSS no editor. Escreva as propriedades. Ctrl+Enter aplica.';
              }

              modal.classList.add('open');
              setTimeout(function() { cssInp.focus(); cssInp.setSelectionRange(cssInp.value.length, cssInp.value.length); }, 60);

              function doApply() {
                var newName = nameInp.value.trim().replace(/^\./, '');
                var newCss  = cssInp.value.trim();
                if (!newName) { modal.classList.remove('open'); return; }
                modal.classList.remove('open');

                // Para Tailwind: não renomear nunca; só aplicar override CSS
                // Remover blocos de comentário antes de aplicar (o usuário pode ter deixado o placeholder)
                var cssToApply = newCss
                  .replace(/\/\*[\s\S]*?\*\//g, '')  // remover comentários /* ... */
                  .trim();

                // 1. Aplicar CSS
                if (cssToApply !== '') {
                  setClassCssBody(tagText, cssToApply);
                }

                // 2. Renomear — apenas se não for Tailwind e o nome mudou
                var renamed = (!isTW && newName !== tagText);
                if (renamed) {
                  var sm = editor.SelectorManager;
                  var sel = sm.get('.' + tagText);
                  if (sel) { sel.set('name', newName); sel.set('label', newName); }
                  var currentCss = editor.getCss() || '';
                  var esc = tagText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                  editor.setStyle(currentCss.replace(new RegExp('\\.' + esc, 'g'), '.' + newName));
                  editor.getSelectedAll().forEach(function(comp) {
                    if (comp.getClasses().indexOf(tagText) > -1) {
                      comp.removeClass(tagText);
                      comp.addClass(newName);
                    }
                  });
                }

                try { editor.refresh(); } catch(err) {}
              }

              // Registrar handlers (sobrescrever anteriores)
              document.getElementById('cms-cls-ok').onclick = doApply;
              nameInp.onkeydown = function(e) { if (e.key === 'Enter') { e.preventDefault(); cssInp.focus(); } };
              // Remover handler anterior antes de adicionar novo
              if (cssInp._applyHandler) cssInp.removeEventListener('keydown', cssInp._applyHandler);
              cssInp._applyHandler = function(e) {
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); doApply(); }
              };
              cssInp.addEventListener('keydown', cssInp._applyHandler);
            });

            tag.insertBefore(editBtn, closeBtn);
          });
        }

        var clmObs = new MutationObserver(function() { injectEditButtons(); });
        editor.on('load', function() {
          setTimeout(function() {
            var area = document.querySelector('.gjs-clm-tags, .gjs-pn-views-container');
            if (area) clmObs.observe(area, { childList: true, subtree: true });
            injectEditButtons();
          }, 800);
        });
        editor.on('component:selected', function() { setTimeout(injectEditButtons, 100); });

      }());

      // ── Toolbar: ajuste
      // ── Toolbar: ajuste dinâmico do canvas top quando a toolbar quebra ─────
      (function watchToolbarHeight() {
        var commands = document.querySelector('.gjs-pn-commands');
        var canvas   = document.querySelector('.gjs-cv-canvas');
        var viewsContainer = document.querySelector('.gjs-pn-views-container');
        if (!commands || !canvas) return;
        function syncCanvasTop() {
          var h = commands.offsetHeight;
          canvas.style.top = h + 'px';
          if (viewsContainer) viewsContainer.style.paddingTop = h + 'px';
        }
        var ro = new ResizeObserver(syncCanvasTop);
        ro.observe(commands);
        syncCanvasTop();
      })();

      // Auto-load primeiro componente salvo
      const names = Object.keys(componentList);
      if (names.length > 0) {
        const first = names[0];
        currentComponent = first;
        setTimeout(() => {
          const sel = document.getElementById('comp-selector');
          if (sel) sel.value = first;
          const delBtn = document.getElementById('comp-delete-btn');
          if (delBtn) delBtn.style.display = 'inline-block';
          const comp = componentList[first];
          // Loader unificado: projectData + backfill de CSS + cura de ícones FA
          loadComponentInto(editor, comp);
        }, 200);
      }

      // Wire up selector
      document.getElementById('comp-selector').addEventListener('change', async (e) => {
        const name = e.target.value;
        const del  = document.getElementById('comp-delete-btn');
        if (!name) {
          currentComponent = null;
          editor.setComponents('');
          editor.setStyle('');
          del.style.display = 'none';
          return;
        }
        currentComponent  = name;
        del.style.display = 'inline-block';
        const comp = componentList[name];
        loadComponentInto(editor, comp);
      });

      document.getElementById('comp-save-btn').addEventListener('click', async () => {
        let name = currentComponent;
        if (!name) {
          name = prompt('Nome do componente (ex: "header", "footer", "card-produto"):');
          if (!name) return;
          name = name.trim().toLowerCase().replace(/\s+/g, '-');
        }
        if (!name) return;
        await saveComponent(name);
        document.getElementById('comp-delete-btn').style.display = 'inline-block';
      });

      // Delete button
      document.getElementById('comp-delete-btn').addEventListener('click', async () => {
        if (currentComponent) await deleteComponent(currentComponent);
      });
    });

    // ── Custom link trait: internal page select + free text ───────────────────
    editor.TraitManager.addType('page-href', {
      createInput({ trait }) {
        const wrap = document.createElement('div');
        wrap.style.cssText = 'display:flex;flex-direction:column;gap:4px;width:100%';

        const select = document.createElement('select');
        select.id = 'trait-page-select-comp';
        select.style.cssText = 'background:#1a1a2e;color:#fff;border:1px solid #444;border-radius:3px;padding:4px 6px;width:100%;font-size:12px;';

        const textInput = document.createElement('input');
        textInput.type = 'text';
        textInput.id = 'trait-href-text-comp';
        textInput.placeholder = 'Ou digita URL externa (https://...)';
        textInput.style.cssText = 'background:#1a1a2e;color:#fff;border:1px solid #444;border-radius:3px;padding:4px 6px;width:100%;font-size:12px;box-sizing:border-box;';

        const fileBtn = document.createElement('button');
        fileBtn.type = 'button';
        fileBtn.textContent = '📁 Linkar PDF / Arquivo';
        fileBtn.style.cssText = 'background:#4f46e5;color:#fff;border:none;border-radius:3px;padding:4px 6px;width:100%;font-size:12px;cursor:pointer;';
        fileBtn.onclick = () => {
          editor.AssetManager.open({
            select(asset, complete) {
              const url = asset.get('src');
              textInput.value = url;
              select.value = '';
              trait.set('value', url);
              editor.AssetManager.close();
            }
          });
        };

        const hint = document.createElement('div');
        hint.style.cssText = 'font-size:10px;color:#888;';
        hint.textContent = 'Selecione uma página, digite URL ou anexe arquivo.';

        const refreshSelect = () => {
          const currentHref = trait.get('value') || '';
          select.innerHTML =
            '<option value="">— Páginas do site —</option>' +
            availablePages.map(p => {
              const path = p === 'index' ? '/' : '/' + p;
              return `<option value="${path}" ${currentHref === path ? 'selected' : ''}>${p} (${path})</option>`;
            }).join('');
        };
        refreshSelect();

        select.addEventListener('change', () => {
          if (select.value) {
            textInput.value = select.value;
            this.onChange(select.value);
          }
        });
        textInput.addEventListener('input', () => {
          select.value = '';
          this.onChange(textInput.value);
        });

        wrap.appendChild(select);
        wrap.appendChild(textInput);
        wrap.appendChild(fileBtn);
        wrap.appendChild(hint);
        return wrap;
      },
      onEvent({ elInput, component }) {
        const textInput = elInput.querySelector('#trait-href-text-comp');
        if (textInput) component.addAttributes({ href: textInput.value });
      },
      onUpdate({ elInput, component }) {
        const href = component.getAttributes().href || '';
        const select = elInput.querySelector('#trait-page-select-comp');
        const textInput = elInput.querySelector('#trait-href-text-comp');
        if (!select || !textInput) return;
        const match = availablePages.find(p => (p === 'index' ? '/' : '/' + p) === href);
        if (match) { select.value = href; textInput.value = href; }
        else { select.value = ''; textInput.value = href; }
      }
    });

    // ── Override standard link component ──────────────────────────────────────
    editor.DomComponents.addType('link', {
      extend: 'link',
      isComponent: el => el.tagName === 'A',
      model: {
        defaults: {
          traits: [
            { type: 'page-href', name: 'href', label: 'URL / Página' },
            { type: 'select', name: 'target', label: 'Abrir em',
              options: [{ value: '', name: 'Esta janela' }, { value: '_blank', name: 'Nova janela' }] }
          ]
        }
      }
    });