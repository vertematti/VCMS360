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
      const payload = {
        name,
        html:        editor.getHtml(),
        css:         editor.getCss(),
        projectData: editor.getProjectData()
      };
      const res = await fetch('/api/components/save', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload)
      });
      if (res.ok) {
        currentComponent = name;
        await loadLibrary();
        showToast(`Componente "${name}" salvo!`, 'success');
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
    editor.on('load', async () => {

      // ── Logo: injeta no painel devices-c (esquerda nativa do GrapesJS) ────
      (function injectToolbarLogo() {
        function doInject() {
          var devPanel = document.querySelector('.gjs-pn-devices-c');
          if (!devPanel) { setTimeout(doInject, 100); return; }

          // ── Forçar inline styles no painel via JS (CSS não tem especificidade) ──
          devPanel.style.cssText = [
            'display:flex !important',
            'align-items:center !important',
            'height:40px !important',
            'max-height:40px !important',
            'overflow:hidden !important',
            'padding:0 !important',
            'gap:0 !important',
          ].join(';');

          // ── Ocultar label "Device" — cobre todas as estruturas do GrapesJS ──
          function hideDeviceLabel() {
            // 1. Text nodes diretos no devPanel
            devPanel.childNodes.forEach(function(node) {
              if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
                node.textContent = '';
              }
            });
            // 2. Qualquer elemento que contenha SOMENTE o texto "Device"
            devPanel.querySelectorAll('*').forEach(function(el) {
              if (el.children.length === 0 && el.textContent.trim() === 'Device') {
                el.style.setProperty('display', 'none', 'important');
              }
            });
            // 3. Seletores específicos do GrapesJS
            [
              '.gjs-select-label',
              '.gjs-devices-c > span',
              '.gjs-pn-devices-c > span',
              '.gjs-devices-c label',
            ].forEach(function(sel) {
              devPanel.querySelectorAll(sel).forEach(function(el) {
                el.style.setProperty('display', 'none', 'important');
              });
            });
          }
          hideDeviceLabel();

          // ── Estilizar o select de device ─────────────────────────────────────
          var sel = devPanel.querySelector('select');
          if (sel) {
            sel.style.cssText = [
              'background:#2a2a3e',
              'color:#ccc',
              'border:1px solid #444',
              'border-radius:4px',
              'padding:2px 6px',
              'font-size:12px',
              'height:26px',
              'cursor:pointer',
              'outline:none',
            ].join(';');
          }

          // ── Injetar logo ──────────────────────────────────────────────────────
          if (!document.getElementById('cms-toolbar-logo')) {
            var logo = document.createElement('div');
            logo.id = 'cms-toolbar-logo';
            logo.style.cssText = [
              'display:flex',
              'align-items:center',
              'padding:0 10px 0 6px',
              'flex-shrink:0',
              'height:40px',
              'overflow:hidden',
              'border-right:1px solid rgba(255,255,255,0.12)',
              'margin-right:8px',
            ].join(';');
            var img = document.createElement('img');
            img.src = '/VisualCMS360header.png';
            img.alt = 'Visual CMS 360°';
            img.draggable = false;
            img.style.cssText = 'height:24px;width:auto;display:block;pointer-events:none;user-select:none;';
            logo.appendChild(img);
            devPanel.prepend(logo);
          }

          // ── Injetar regra CSS global via <style> para garantir ocultamento ──
          if (!document.getElementById('cms-hide-device-label-style')) {
            var st = document.createElement('style');
            st.id = 'cms-hide-device-label-style';
            st.textContent = [
              '.gjs-devices-c > span { display:none !important; }',
              '.gjs-pn-devices-c > span { display:none !important; }',
              '.gjs-select-label { display:none !important; }',
              '.gjs-devices-c label { display:none !important; }',
            ].join('\n');
            document.head.appendChild(st);
          }

          // ── MutationObserver — reaplica se o GrapesJS re-renderizar ──────────
          var observer = new MutationObserver(function() {
            hideDeviceLabel();
            var s = devPanel.querySelector('select');
            if (s && !s.style.background) {
              s.style.cssText = 'background:#2a2a3e;color:#ccc;border:1px solid #444;border-radius:4px;padding:2px 6px;font-size:12px;height:26px;cursor:pointer;outline:none;';
            }
          });
          // Observar também o pai para pegar re-renders do GrapesJS no nível acima
          var observeTarget = devPanel.parentNode || devPanel;
          observer.observe(observeTarget, { childList: true, subtree: true, characterData: true });
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
        label: `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
          <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>
          <path d="M12 17l1.5-1.5L11 13h8v-2h-8l2.5-2.5L12 7l-5 5 5 5z" opacity=".6"/>
        </svg>`,
        command: 'import-code-comp',
        attributes: { title: 'Importar / Editar HTML & CSS do componente' },
        active: false,
      }]);

      editor.Commands.add('import-code-comp', {
        run(ed, sender) {
          sender && sender.set('active', 0);

          /* Extrair JS existente do HTML atual (tags <script>...</script>) */
          function extractScripts(html) {
            const matches = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)];
            return matches.map(m => m[1].trim()).filter(Boolean).join('\n\n');
          }
          function stripScripts(html) {
            return html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '').trim();
          }

          const currentHtml = ed.getHtml();

          const wrap = document.createElement('div');
          wrap.style.padding = '10px';
          wrap.innerHTML = `
            <div style="margin-bottom:5px;color:#ccc;font-size:12px;font-weight:600;">HTML</div>
            <textarea id="comp-imp-html" style="width:100%;height:150px;background:#0d0d1a;color:#d4d4d4;padding:10px;border:1px solid #444;margin-bottom:12px;box-sizing:border-box;font-family:monospace;font-size:12px;line-height:1.6;border-radius:4px;resize:vertical;"></textarea>
            <div style="margin-bottom:5px;color:#ccc;font-size:12px;font-weight:600;">CSS</div>
            <textarea id="comp-imp-css" style="width:100%;height:110px;background:#0d0d1a;color:#d4d4d4;padding:10px;border:1px solid #444;margin-bottom:12px;box-sizing:border-box;font-family:monospace;font-size:12px;line-height:1.6;border-radius:4px;resize:vertical;"></textarea>
            <div style="margin-bottom:5px;color:#ccc;font-size:12px;font-weight:600;">JavaScript</div>
            <textarea id="comp-imp-js" style="width:100%;height:110px;background:#0d0d1a;color:#d4d4d4;padding:10px;border:1px solid #444;margin-bottom:15px;box-sizing:border-box;font-family:monospace;font-size:12px;line-height:1.6;border-radius:4px;resize:vertical;" placeholder="// Seu JavaScript aqui (sem as tags <script>)"></textarea>
            <button id="comp-imp-apply" style="background:#3b82f6;color:#fff;border:none;border-radius:4px;padding:8px 20px;cursor:pointer;font-size:13px;">Aplicar</button>
          `;
          wrap.querySelector('#comp-imp-html').value = formatHTML(stripScripts(currentHtml));
          wrap.querySelector('#comp-imp-css').value  = formatCSS(ed.getCss());
          wrap.querySelector('#comp-imp-js').value   = extractScripts(currentHtml);
          wrap.querySelector('#comp-imp-apply').onclick = () => {
            let html = wrap.querySelector('#comp-imp-html').value;
            const js = wrap.querySelector('#comp-imp-js').value.trim();
            if (js) html += '\n<script>\n' + js + '\n<\/script>';
            ed.setComponents(html);
            ed.setStyle(wrap.querySelector('#comp-imp-css').value);
            ed.Modal.close();
          };
          ed.Modal.setTitle('Importar / Editar Código do Componente');
          ed.Modal.setContent(wrap);
          ed.Modal.open();
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

      // Component selector + Save + Delete
      editor.Panels.addButton('options', [{
        id:        'comp-manager',
        className: 'gjs-pn-btn',
        attributes: {
          style: 'display:inline-flex;align-items:center;gap:6px;background:#222;border-radius:4px;padding:3px 8px;margin-right:8px;'
        },
        label: `
          <select id="comp-selector"
            style="background:transparent;color:#fff;border:none;outline:none;cursor:pointer;max-width:150px;font-size:12px;">
            <option value="">— Novo componente —</option>
          </select>
          <button id="comp-save-btn"   title="Salvar componente"  style="background:#22c55e;color:#fff;border:none;border-radius:3px;padding:2px 8px;cursor:pointer;font-size:14px;">💾</button>
          <button id="comp-delete-btn" title="Excluir componente" style="background:#ef4444;color:#fff;border:none;border-radius:3px;padding:2px 8px;cursor:pointer;font-size:12px;display:none;">🗑️</button>
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
          if (svg) svg.style.transform = collapsed ? 'scaleX(-1)' : 'scaleX(1)';
          setTimeout(function() { try { editor.refresh(); } catch(e) {} }, 320);
        }

        toggleBtn.addEventListener('click', function() { setCollapsed(!collapsed); });
        setTimeout(function() { setCollapsed(false); }, 600);
      })();

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
          if (comp.projectData?.pages?.length) {
            editor.loadProjectData(comp.projectData);
          } else {
            editor.setComponents(comp.html || '');
            editor.setStyle(comp.css   || '');
          }
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
        if (comp.projectData?.pages?.length) {
          editor.loadProjectData(comp.projectData);
        } else {
          editor.setComponents(comp.html || '');
          editor.setStyle(comp.css   || '');
        }
      });

      // Save button
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