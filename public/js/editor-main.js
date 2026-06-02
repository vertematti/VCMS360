    // ── Verificar se os scripts carregaram corretamente ──────────────────────
    if (typeof grapesjs === 'undefined') {
      document.getElementById('gjs').innerHTML =
        '<div style="padding:40px;font-family:sans-serif;color:#c00;text-align:center;">' +
        '<h2>Erro: GrapesJS não carregou</h2>' +
        '<p>Verifique sua conexão com a internet e recarregue a página.</p>' +
        '<button onclick="location.reload()" style="margin-top:12px;padding:8px 20px;background:#3b82f6;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:14px;">Recarregar</button>' +
        '</div>';
      throw new Error('GrapesJS not loaded');
    }

    // ── State ────────────────────────────────────────────────────────────────
    let currentSlug    = 'index';
    let availablePages = ['index'];
    let savedComponents = {};   // name → { html, css }

    // ── GrapesJS init ─────────────────────────────────────────────────────────
    const pluginTailwind    = window['grapesjs-tailwind'];
    const pluginBlocksBasic = window['gjs-blocks-basic'];

    let editor;
    // Tenta com ambos os plugins; se falhar, tenta só blocks-basic; se falhar, inicia sem plugins
    const pluginConfigs = [
      { plugins: [pluginTailwind, pluginBlocksBasic].filter(Boolean), label: 'tailwind + blocks' },
      { plugins: [pluginBlocksBasic].filter(Boolean),                 label: 'só blocks-basic'   },
      { plugins: [],                                                   label: 'sem plugins'        },
    ];

    for (const cfg of pluginConfigs) {
      try {
        editor = grapesjs.init({
          container: '#gjs',
          height: '100vh',
          width: 'auto',
          fromElement: false,
          storageManager: false,
          allowScripts: 1,
          plugins: cfg.plugins,
          pluginsOpts: {
            'grapesjs-tailwind': {},
            'gjs-blocks-basic': { flexGrid: true }
          },
          assetManager: {
            assets: '/api/assets/load',
            upload: '/api/assets/upload',
            uploadName: 'files[]',
          },
          styleManager: {
            sectors: [
              {
                name: 'Geral',
                open: false,
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
                name: 'Dimensão',
                open: false,
                properties: [
                  { name: 'Largura',       property: 'width',      type: 'integer', units: ['px','%','vw','em','rem','auto'] },
                  { name: 'Alt. Mínima',   property: 'min-height', type: 'integer', units: ['px','%','vh','em','rem'] },
                  { name: 'Altura',        property: 'height',     type: 'integer', units: ['px','%','vh','em','rem','auto'] },
                  { name: 'Larg. Máxima',  property: 'max-width',  type: 'integer', units: ['px','%','vw','em','rem'] },
                  { name: 'Alt. Máxima',   property: 'max-height', type: 'integer', units: ['px','%','vh','em','rem'] },
                  {
                    name: 'Margin', property: 'margin', type: 'composite',
                    properties: [
                      { name: 'Cima',    property: 'margin-top',    type: 'integer', units: ['px','%','em','rem','auto'] },
                      { name: 'Direita', property: 'margin-right',  type: 'integer', units: ['px','%','em','rem','auto'] },
                      { name: 'Baixo',   property: 'margin-bottom', type: 'integer', units: ['px','%','em','rem','auto'] },
                      { name: 'Esq.',    property: 'margin-left',   type: 'integer', units: ['px','%','em','rem','auto'] },
                    ]
                  },
                  {
                    name: 'Padding', property: 'padding', type: 'composite',
                    properties: [
                      { name: 'Cima',    property: 'padding-top',    type: 'integer', units: ['px','%','em','rem'] },
                      { name: 'Direita', property: 'padding-right',  type: 'integer', units: ['px','%','em','rem'] },
                      { name: 'Baixo',   property: 'padding-bottom', type: 'integer', units: ['px','%','em','rem'] },
                      { name: 'Esq.',    property: 'padding-left',   type: 'integer', units: ['px','%','em','rem'] },
                    ]
                  },
                ]
              },
              {
                name: 'Tipografia',
                open: false,
                properties: [
                  { name: 'Fonte',        property: 'font-family',    type: 'text' },
                  { name: 'Tamanho',      property: 'font-size',      type: 'integer', units: ['px','em','rem','%','vw'] },
                  { name: 'Peso',         property: 'font-weight',    type: 'select',
                    options: [{value:'100'},{value:'200'},{value:'300'},{value:'400',name:'Normal'},{value:'500'},{value:'600'},{value:'700',name:'Bold'},{value:'800'},{value:'900'}] },
                  { name: 'Estilo',       property: 'font-style',     type: 'radio',
                    options: [{value:'normal'},{value:'italic'},{value:'oblique'}] },
                  { name: 'Cor',          property: 'color',          type: 'color' },
                  { name: 'Alinhamento',  property: 'text-align',     type: 'radio',
                    options: [{value:'left',title:'Esq'},{value:'center',title:'Centro'},{value:'right',title:'Dir'},{value:'justify',title:'Just'}] },
                  { name: 'Altura linha', property: 'line-height',    type: 'integer', units: ['px','em','rem',''] },
                  { name: 'Espaç. letra', property: 'letter-spacing', type: 'integer', units: ['px','em','rem'] },
                  { name: 'Decoração',    property: 'text-decoration', type: 'select',
                    options: [{value:'none'},{value:'underline'},{value:'line-through'},{value:'overline'}] },
                  { name: 'Transf. texto',property: 'text-transform', type: 'select',
                    options: [{value:'none'},{value:'uppercase'},{value:'lowercase'},{value:'capitalize'}] },
                ]
              },
              {
                name: 'Decorações',
                open: false,
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
                name: 'Flexbox',
                open: false,
                properties: [
                  { name: 'Direção',    property: 'flex-direction',  type: 'radio',
                    options: [{value:'row'},{value:'row-reverse'},{value:'column'},{value:'column-reverse'}] },
                  { name: 'Quebra',     property: 'flex-wrap',       type: 'radio',
                    options: [{value:'nowrap'},{value:'wrap'},{value:'wrap-reverse'}] },
                  { name: 'Justificar',property: 'justify-content',  type: 'select',
                    options: [{value:'flex-start'},{value:'flex-end'},{value:'center'},{value:'space-between'},{value:'space-around'},{value:'space-evenly'}] },
                  { name: 'Alinhar',   property: 'align-items',      type: 'select',
                    options: [{value:'stretch'},{value:'flex-start'},{value:'flex-end'},{value:'center'},{value:'baseline'}] },
                  { name: 'Alin. cont.',property: 'align-content',   type: 'select',
                    options: [{value:'stretch'},{value:'flex-start'},{value:'flex-end'},{value:'center'},{value:'space-between'},{value:'space-around'}] },
                  { name: 'Gap',       property: 'gap',              type: 'integer', units: ['px','em','rem','%'] },
                  { name: 'Flex',      property: 'flex',             type: 'text' },
                  { name: 'Ordem',     property: 'order',            type: 'integer' },
                ]
              },
            ]
          },
        });
        console.log('[CMS] GrapesJS iniciado com:', cfg.label);
        break;
      } catch(err) {
        console.warn('[CMS] Falha ao iniciar com', cfg.label, ':', err.message);
        // Limpar o container para tentar de novo
        const gjs = document.getElementById('gjs');
        if (gjs) gjs.innerHTML = '';
      }
    }

    if (!editor) {
      document.getElementById('gjs').innerHTML =
        '<div style="padding:40px;font-family:sans-serif;color:#c00;text-align:center;">' +
        '<h2>Erro crítico: GrapesJS não inicializou</h2>' +
        '<p>Verifique o console para mais detalhes.</p></div>';
      throw new Error('GrapesJS failed to initialize');
    }

    // ══════════════════════════════════════════════════════════════════════════
    // ── Virtual Tour 360° Component (Pannellum)
    // ══════════════════════════════════════════════════════════════════════════

    // ── IDs únicos por tour ───────────────────────────────────────────────────
    function tourUID() {
      return 'vt_' + Math.random().toString(36).slice(2, 9);
    }

    // ── HTML estático do estado vazio (no canvas) ─────────────────────────────
    function buildTourPreview(scenes, height) {
      const h = height || '420px';
      if (!scenes || !scenes.length) {
        return `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;
          height:${h};background:#1a1a2e;border:2px dashed #4a4a6a;border-radius:6px;color:#888;">
          <div style="font-size:40px;margin-bottom:10px;">🌐</div>
          <div style="font-weight:600;color:#aaa;">Tour Virtual 360° vazio</div>
          <div style="font-size:12px;margin-top:6px;color:#999;">
            Selecione este bloco e clique em <strong style="color:#3b82f6">🌐 Cenas</strong> no menu superior para gerenciar
          </div>
        </div>`;
      }

      const first = scenes[0];
      const firstIsVideo = first.sceneType === 'video';
      const firstThumb   = firstIsVideo ? (first.poster || '') : (first.src || '');

      // Miniaturas com badge de vídeo
      const thumbsHTML = scenes.slice(0, 6).map((s, i) => {
        const isVid  = s.sceneType === 'video';
        const thumb  = isVid ? (s.poster || '') : (s.src || '');
        const badge  = isVid ? `<div style="position:absolute;top:2px;right:2px;background:rgba(220,38,38,0.9);
          color:#fff;font-size:9px;font-weight:700;padding:1px 4px;border-radius:3px;line-height:1.4;">▶</div>` : '';
        return `<div style="flex-shrink:0;width:60px;height:44px;border-radius:4px;overflow:hidden;position:relative;
          border:2px solid ${i===0?'#3b82f6':'transparent'};opacity:${i===0?1:0.7};">
          ${thumb ? `<img src="${thumb}" style="width:100%;height:100%;object-fit:cover;" />` :
            `<div style="width:100%;height:100%;background:#1a1a2e;display:flex;align-items:center;justify-content:center;font-size:18px;">${isVid?'🎬':'🌐'}</div>`}
          ${badge}
        </div>`;
      }).join('');

      const heroContent = firstIsVideo
        ? `<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;flex-direction:column;z-index:2;">
            <div style="font-size:52px;opacity:0.85;">🎬</div>
            <div style="color:#fff;font-family:sans-serif;font-size:13px;font-weight:600;
              background:rgba(220,38,38,0.75);padding:6px 14px;border-radius:20px;margin-top:8px;">
              Vídeo 360° · A-Frame · (preview animado no editor)
            </div>
          </div>`
        : `<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;flex-direction:column;z-index:2;">
            <div style="font-size:48px;opacity:0.7;">🌐</div>
            <div style="color:#fff;font-family:sans-serif;font-size:13px;font-weight:600;
              background:rgba(0,0,0,0.6);padding:6px 14px;border-radius:20px;margin-top:8px;">
              Tour 360° · ${scenes.length} cena${scenes.length!==1?'s':''} · (preview animado no editor)
            </div>
          </div>`;

      // Animação CSS para dar sensação de Tour Virtual 360
      const animStyle = firstThumb ? `
        background-image: url('${firstThumb}');
        background-size: auto 100%;
        background-position: 0% 50%;
        animation: pan360_${first.id || Math.random().toString(36).slice(2)} 35s linear infinite alternate;
      ` : '';

      const keyframes = firstThumb ? `
        <style>
          @keyframes pan360_${first.id || Math.random().toString(36).slice(2)} {
            0% { background-position: 0% 50%; }
            100% { background-position: 100% 50%; }
          }
        </style>
      ` : '';

      return `
      ${keyframes}
      <div style="position:relative;width:100%;background:#0d0d1a;border-radius:6px;overflow:hidden;">
        <div style="position:relative;height:${h};overflow:hidden;background:#000;${animStyle}">
          <!-- Overlay escuro para destacar o texto -->
          <div style="position:absolute;inset:0;background:rgba(0,0,0,0.3);z-index:1;"></div>
          ${heroContent}
          ${first.title ? `<div style="position:absolute;top:10px;left:10px;background:rgba(0,0,0,0.6);
            color:#fff;font-family:sans-serif;font-size:12px;font-weight:600;padding:5px 10px;border-radius:4px;z-index:3;">
            ${first.title}</div>` : ''}
        </div>
        ${scenes.length > 1 ? `<div style="display:flex;gap:5px;padding:7px 9px;background:rgba(0,0,0,0.9);overflow-x:auto;position:relative;z-index:3;">${thumbsHTML}</div>` : ''}
      </div>`;
    }

    // ── Tipo GrapesJS para Virtual Tour ──────────────────────────────────────
    editor.DomComponents.addType('virtual-tour', {

      isComponent(el) {
        if (!el || !el.getAttribute) return false;
        return el.getAttribute('data-gjs-type') === 'virtual-tour';
      },

      model: {
        defaults: {
          name: 'Tour Virtual 360°',
          droppable: false,
          copyable: true,
          'tour-scenes':     [],
          'tour-height':     '520px',
          'tour-name':       'Tour Virtual',
          'tour-show-thumbs': true,
          tagName: 'div',
          attributes: { 'data-gjs-type': 'virtual-tour' },
          toolbar: [
            {
              label: '🌐 Cenas',
              command: 'tour:edit',
              attributes: { title: 'Gerenciar cenas do tour', style: 'padding:0 8px;background:#3b82f6;color:#fff;border-radius:3px;cursor:pointer;' }
            },
            { label: '<svg viewBox="0 0 24 24" width="12"><path fill="currentColor" d="M10 9h4V6h3l-5-5-5 5h3v3zm-1 1H6V7l-5 5 5 5v-3h3v-4zm14 2l-5-5v3h-3v4h3v3l5-5zm-9 3h-4v3H7l5 5 5-5h-3v-3z"/></svg>', command: 'tlb-move',   attributes: { title: 'Mover' } },
            { label: '<svg viewBox="0 0 24 24" width="12"><path fill="currentColor" d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>', command: 'tlb-clone',  attributes: { title: 'Duplicar' } },
            { label: '<svg viewBox="0 0 24 24" width="12"><path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>', command: 'tlb-delete', attributes: { title: 'Excluir tour', style: 'color:#e74c3c' } },
          ]
        },

        init() {
          this.listenTo(this, 'change:tour-scenes change:tour-height', this._render);
          setTimeout(() => this._render(), 0);
        },

        _render() {
          const scenes     = this.get('tour-scenes') || [];
          const height     = this.get('tour-height') || '56.25vw';
          const name       = this.get('tour-name')   || 'Tour Virtual';
          const showThumbs = this.get('tour-show-thumbs') !== false;

          // btoa evita que o cheerio corrompa o JSON ao processar o HTML salvo
          const tourJson = btoa(unescape(encodeURIComponent(JSON.stringify({ scenes }))));

          const currentAttrs = this.get('attributes') || {};
          this.set('attributes', {
            ...currentAttrs,
            'data-gjs-type':   'virtual-tour',
            'data-tour':        tourJson,
            'data-tour-enc':   'base64',
            'data-height':      height,
            'data-show-thumbs': showThumbs ? 'true' : 'false',
            'data-tname':       name,
          }, { silent: true });

          this.components(buildTourPreview(scenes, height));
        },

        // Sobrescreve a serialização HTML: salva apenas o <div> com atributos,
        // sem conteúdo interno (o preview do editor não deve ir para o pages.json)
        toHTML() {
          const attrs = this.getAttributes();
          const attrStr = Object.entries(attrs)
            .map(([k, v]) => `${k}="${String(v).replace(/"/g, '&quot;')}"`).join(' ');
          return `<div ${attrStr}></div>`;
        }
      },

      view: {
        events() { return {}; }
      }
    });

    // ── Restaurar dados do tour ao carregar do JSON salvo ─────────────────────
    editor.on('component:add', comp => {
      if (comp.get('type') !== 'virtual-tour') return;
      const attrs = comp.getAttributes();
      if (attrs['data-tour'] && !comp.get('tour-scenes')?.length) {
        try {
          let raw = attrs['data-tour'];
          // Suporta base64 (novo) e urlencode (legado)
          const td = attrs['data-tour-enc'] === 'base64'
            ? JSON.parse(decodeURIComponent(escape(atob(raw))))
            : JSON.parse(decodeURIComponent(raw));
          if (td && td.scenes) comp.set('tour-scenes', td.scenes);
        } catch {}
      }
      if (attrs['data-height'])     comp.set('tour-height',     attrs['data-height']);
      if (attrs['data-tname'])      comp.set('tour-name',       attrs['data-tname']);
      if (attrs['data-show-thumbs']) comp.set('tour-show-thumbs', attrs['data-show-thumbs'] !== 'false');
      if (!attrs['data-tour-id']) {
        comp.addAttributes({ 'data-tour-id': tourUID() });
      }
    });

    // ── Comando: editar tour selecionado ──────────────────────────────────────
    editor.Commands.add('tour:edit', {
      run(ed) {
        const comp = ed.getSelected();
        if (!comp || comp.get('type') !== 'virtual-tour') return;
        openTourModal(comp);
      }
    });

    // ── Comando principal: abre gerenciador de tours ──────────────────────────
    editor.Commands.add('tour:manage', {
      run(ed, sender) {
        if (sender && typeof sender.set === 'function') sender.set('active', 0);
        const tours = [];
        ed.getWrapper().onAll(c => { if (c.get('type') === 'virtual-tour') tours.push(c); });

        if (!tours.length) {
          alert('Nenhum Tour Virtual na página.\nArraste o bloco "🌐 Tour Virtual 360°" para o canvas primeiro.');
          return;
        }
        if (tours.length === 1) { openTourModal(tours[0]); return; }

        // Seletor quando há múltiplos tours
        const wrap = document.createElement('div');
        wrap.style.cssText = 'padding:16px;font-family:sans-serif;color:#ccc;min-width:400px;';

        function renderSelector() {
          wrap.innerHTML = `<p style="margin:0 0 12px;font-size:13px;color:#aaa;">
            <strong style="color:#fff">${tours.length} tours</strong> nesta página:
          </p>`;
          tours.forEach((comp, idx) => {
            const name   = comp.get('tour-name') || `Tour ${idx+1}`;
            const scenes = comp.get('tour-scenes') || [];
            const thumb  = scenes[0]?.src || null;

            const row = document.createElement('div');
            row.style.cssText = 'display:flex;align-items:center;gap:10px;background:#1a1a2e;border:1px solid #333;border-radius:8px;padding:8px 12px;margin-bottom:8px;transition:border-color .2s;cursor:pointer;';

            const thumbEl = document.createElement('div');
            thumbEl.style.cssText = 'width:48px;height:48px;flex-shrink:0;border-radius:4px;overflow:hidden;background:#111;display:flex;align-items:center;justify-content:center;font-size:22px;';
            if (thumb) thumbEl.innerHTML = `<img src="${thumb}" style="width:100%;height:100%;object-fit:cover;">`;
            else thumbEl.textContent = '🌐';

            const info = document.createElement('div');
            info.style.cssText = 'flex:1;min-width:0;';
            info.innerHTML = `<div style="font-weight:700;color:#fff;font-size:14px;">${name}</div>
              <div style="font-size:11px;color:#999;margin-top:2px;">${scenes.length} cena${scenes.length!==1?'s':''}</div>`;

            const arrow = document.createElement('span');
            arrow.textContent = '›'; arrow.style.cssText = 'color:#3b82f6;font-size:22px;';

            row.appendChild(thumbEl); row.appendChild(info); row.appendChild(arrow);
            row.onclick = () => { ed.Modal.close(); setTimeout(() => openTourModal(comp), 120); };
            row.onmouseover = () => row.style.borderColor = '#3b82f6';
            row.onmouseout  = () => row.style.borderColor = '#333';
            wrap.appendChild(row);
          });
        }
        renderSelector();
        ed.Modal.setTitle('Gerenciar Tours Virtuais');
        ed.Modal.setContent(wrap);
        ed.Modal.open();
      }
    });

    // ═══════════════════════════════════════════════════════════════════
    // ── Modal principal do Tour Virtual ──────────────────────────────
    // ═══════════════════════════════════════════════════════════════════
    function openTourModal(comp) {
      let scenes     = JSON.parse(JSON.stringify(comp.get('tour-scenes') || []));
      let tourHeight = comp.get('tour-height')     || '520px';
      let tourName   = comp.get('tour-name')       || 'Tour Virtual';
      let showThumbs = comp.get('tour-show-thumbs') !== false;

      // Telas: lista, editar cena, picker de imagem, hotspot editor
      const wrap = document.createElement('div');
      wrap.style.cssText = 'font-family:sans-serif;color:#ccc;width:820px;max-width:92vw;box-sizing:border-box;';

      const screenList    = document.createElement('div'); screenList.style.cssText    = 'padding:14px;';
      const screenScene   = document.createElement('div'); screenScene.style.cssText   = 'padding:14px;display:none;';
      const screenPicker  = document.createElement('div'); screenPicker.style.cssText  = 'padding:14px;display:none;';
      const screenHotspot = document.createElement('div'); screenHotspot.style.cssText = 'padding:14px;display:none;';
      const screenNorth   = document.createElement('div'); screenNorth.style.cssText   = 'padding:14px;display:none;';
      const screenView    = document.createElement('div'); screenView.style.cssText    = 'padding:14px;display:none;';

      wrap.appendChild(screenList);
      wrap.appendChild(screenScene);
      wrap.appendChild(screenPicker);
      wrap.appendChild(screenHotspot);
      wrap.appendChild(screenNorth);
      wrap.appendChild(screenView);

      let editingSceneIndex = -1;    // índice da cena sendo editada
      let editingHotspotIndex = -1;  // índice do hotspot sendo editado
      let pickingForScene = -1;      // para qual cena está escolhendo mídia
      let pickerMode     = 'image';  // 'image' | 'video'
      let pickerCallback = null;     // função chamada com a URL escolhida
      let pickerReturnScreen = null; // tela para voltar após picker
      let hotspotViewer = null;      // viewer pannellum do editor de hotspot
      let northViewer = null;        // viewer pannellum para configurar norte
      let viewViewer = null;         // viewer pannellum para configurar visão inicial
      let currentHs = null;          // objeto hs persistente durante edição de hotspot

      // ────────────────────────────────────────────────────────────────
      // TELA: Lista de cenas
      // ────────────────────────────────────────────────────────────────
      function showList() {
        [screenScene, screenPicker, screenHotspot, screenNorth, screenView].forEach(s => s.style.display = 'none');
        screenList.style.display = 'block';
        editor.Modal.setTitle(`🌐 ${tourName} — ${scenes.length} cena${scenes.length!==1?'s':''}`);
        renderList();
      }

      function renderList() {
        screenList.innerHTML = '';

        // ── Cabeçalho ──
        const header = document.createElement('div');
        header.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:10px;';

        const nameInput = document.createElement('input');
        nameInput.type = 'text'; nameInput.value = tourName;
        nameInput.style.cssText = 'flex:1;background:#1a1a2e;color:#fff;border:1px solid #444;border-radius:4px;padding:5px 10px;font-size:14px;font-weight:700;';
        nameInput.oninput = () => { tourName = nameInput.value; };

        const addBtn = document.createElement('button');
        addBtn.textContent = '+ Nova Cena';
        addBtn.style.cssText = 'background:#3b82f6;color:#fff;border:none;border-radius:4px;padding:6px 14px;cursor:pointer;font-size:13px;flex-shrink:0;';
        addBtn.onclick = () => {
          scenes.push({ id: tourUID(), title: '', desc: '', src: '', north: 0, hfov: 100, yaw: 0, pitch: 0, hotspots: [] });
          editingSceneIndex = scenes.length - 1;
          showSceneEditor();
        };

        header.appendChild(nameInput); header.appendChild(addBtn);
        screenList.appendChild(header);

        // ── Configurações gerais ──
        const cfg = document.createElement('div');
        cfg.style.cssText = 'display:flex;gap:8px;margin-bottom:10px;background:#111;border-radius:6px;padding:8px;align-items:flex-end;';

        function mkField(label, val, onch, type='text', extra='') {
          const box = document.createElement('div');
          box.style.cssText = 'display:flex;flex-direction:column;gap:2px;flex:1;';
          const lbl = document.createElement('label');
          lbl.textContent = label;
          lbl.style.cssText = 'font-size:10px;color:#bbb;text-transform:uppercase;letter-spacing:.5px;';
          const inp = document.createElement('input');
          inp.type = type; inp.value = val;
          inp.style.cssText = 'background:#1a1a2e;color:#ccc;border:1px solid #333;border-radius:3px;padding:3px 6px;font-size:12px;width:100%;box-sizing:border-box;';
          if (extra) inp.setAttribute('placeholder', extra);
          inp.oninput = () => onch(inp.value);
          box.appendChild(lbl); box.appendChild(inp); return box;
        }

        function mkCheck(label, checked, onch) {
          const box = document.createElement('div');
          box.style.cssText = 'display:flex;flex-direction:column;gap:4px;flex:0.6;';
          const lbl = document.createElement('label');
          lbl.style.cssText = 'font-size:10px;color:#bbb;text-transform:uppercase;letter-spacing:.5px;';
          lbl.textContent = label;
          const inp = document.createElement('input');
          inp.type = 'checkbox'; inp.checked = checked;
          inp.style.cssText = 'width:16px;height:16px;margin-top:2px;';
          inp.onchange = () => onch(inp.checked);
          box.appendChild(lbl); box.appendChild(inp); return box;
        }

        cfg.appendChild(mkField('Altura', tourHeight, v => { tourHeight = v; }, 'text', '520px'));
        cfg.appendChild(mkCheck('Miniaturas', showThumbs, v => { showThumbs = v; }));
        screenList.appendChild(cfg);

        // ── Lista de cenas ──
        const list = document.createElement('div');
        list.style.cssText = 'max-height:300px;overflow-y:auto;display:flex;flex-direction:column;gap:6px;margin-bottom:12px;';

        if (!scenes.length) {
          list.innerHTML = '<div style="text-align:center;padding:32px;color:#999;font-size:13px;">Nenhuma cena. Clique em <strong style="color:#888">+ Nova Cena</strong>.</div>';
        }

        scenes.forEach((scene, i) => {
          const row = document.createElement('div');
          row.style.cssText = 'display:flex;align-items:center;gap:8px;background:#1a1a2e;border-radius:6px;padding:8px;cursor:pointer;transition:background .15s;';
          row.onmouseover = () => row.style.background = '#1e2a3e';
          row.onmouseout  = () => row.style.background = '#1a1a2e';

          const num = document.createElement('span');
          num.textContent = i + 1;
          num.style.cssText = 'color:#444;font-size:11px;width:16px;text-align:right;flex-shrink:0;';

          const thumb = document.createElement('div');
          thumb.style.cssText = 'width:64px;height:46px;border-radius:4px;overflow:hidden;flex-shrink:0;background:#0d0d1a;display:flex;align-items:center;justify-content:center;font-size:18px;position:relative;';
          const isVidScene = scene.sceneType === 'video';
          const thumbSrc   = isVidScene ? (scene.poster || '') : (scene.src || '');
          if (thumbSrc) {
            thumb.innerHTML = `<img src="${thumbSrc}" style="width:100%;height:100%;object-fit:cover;">`;
          } else {
            thumb.textContent = isVidScene ? '🎬' : '🌐';
          }
          if (isVidScene) {
            const badge = document.createElement('div');
            badge.style.cssText = 'position:absolute;top:2px;right:2px;background:rgba(220,38,38,0.9);color:#fff;font-size:9px;font-weight:700;padding:1px 4px;border-radius:3px;line-height:1.4;';
            badge.textContent = '▶';
            thumb.appendChild(badge);
          }

          const info = document.createElement('div');
          info.style.cssText = 'flex:1;min-width:0;';
          info.innerHTML = `
            <div style="font-weight:700;color:${scene.src?'#fff':'#666'};font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
              ${scene.title || `<em style="color:#555">Sem título</em>`}
            </div>
            <div style="font-size:11px;color:#999;margin-top:2px;">
              ${scene.hotspots?.length||0} hotspot${(scene.hotspots?.length||0)!==1?'s':''} &nbsp;·&nbsp;
              hfov:${scene.hfov||100} &nbsp;·&nbsp; yaw:${scene.yaw||0}
            </div>`;

          const editBtn = document.createElement('button');
          editBtn.textContent = '✏️ Editar';
          editBtn.style.cssText = 'background:#2a2a3e;color:#aaa;border:none;border-radius:3px;padding:4px 10px;cursor:pointer;font-size:12px;flex-shrink:0;';
          editBtn.onclick = (e) => { e.stopPropagation(); editingSceneIndex = i; showSceneEditor(); };

          const up = document.createElement('button'); up.textContent = '↑';
          up.style.cssText = 'background:#2a2a3e;color:#fff;border:none;border-radius:3px;width:24px;height:24px;cursor:pointer;flex-shrink:0;';
          up.disabled = i === 0;
          up.onclick = (e) => { e.stopPropagation(); if(i>0){[scenes[i-1],scenes[i]]=[scenes[i],scenes[i-1]]; renderList();} };

          const dn = document.createElement('button'); dn.textContent = '↓';
          dn.style.cssText = 'background:#2a2a3e;color:#fff;border:none;border-radius:3px;width:24px;height:24px;cursor:pointer;flex-shrink:0;';
          dn.disabled = i === scenes.length - 1;
          dn.onclick = (e) => { e.stopPropagation(); if(i<scenes.length-1){[scenes[i],scenes[i+1]]=[scenes[i+1],scenes[i]]; renderList();} };

          const del = document.createElement('button'); del.textContent = '🗑';
          del.style.cssText = 'background:#7f1d1d;color:#fca5a5;border:none;border-radius:3px;width:24px;height:24px;cursor:pointer;font-size:12px;flex-shrink:0;';
          del.onclick = (e) => { e.stopPropagation(); if(confirm(`Excluir cena "${scene.title||'sem título'}"?`)) { scenes.splice(i,1); renderList(); } };

          row.appendChild(num); row.appendChild(thumb); row.appendChild(info);
          row.appendChild(editBtn); row.appendChild(up); row.appendChild(dn); row.appendChild(del);
          list.appendChild(row);
        });
        screenList.appendChild(list);

        // ── Footer ──
        const footer = document.createElement('div');
        footer.style.cssText = 'display:flex;gap:8px;align-items:center;border-top:1px solid #2a2a3e;padding-top:12px;';

        const delTourBtn = document.createElement('button');
        delTourBtn.textContent = '🗑 Excluir Tour';
        delTourBtn.style.cssText = 'background:#7f1d1d;color:#fca5a5;border:none;border-radius:4px;padding:7px 14px;cursor:pointer;font-size:13px;margin-right:auto;';
        delTourBtn.onclick = () => {
          if (!confirm(`Excluir o tour "${tourName}" da página?`)) return;
          comp.remove(); editor.Modal.close();
        };

        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Cancelar';
        cancelBtn.style.cssText = 'background:#2a2a3e;color:#ccc;border:none;border-radius:4px;padding:7px 18px;cursor:pointer;font-size:13px;';
        cancelBtn.onclick = () => {
        var dlg = document.querySelector('.gjs-mdl-dialog');
        if (dlg) { dlg.style.width = ''; dlg.style.maxWidth = ''; }
        editor.Modal.close();
      };

        const applyBtn = document.createElement('button');
        applyBtn.textContent = '✓ Aplicar';
        applyBtn.style.cssText = 'background:#22c55e;color:#fff;border:none;border-radius:4px;padding:7px 20px;cursor:pointer;font-size:13px;font-weight:700;';
        applyBtn.onclick = () => {
          comp.set('tour-scenes',      JSON.parse(JSON.stringify(scenes)));
          comp.set('tour-height',      tourHeight);
          comp.set('tour-name',        tourName);
          comp.set('tour-show-thumbs', showThumbs);
          editor.Modal.close();
        };

        footer.appendChild(delTourBtn); footer.appendChild(cancelBtn); footer.appendChild(applyBtn);
        screenList.appendChild(footer);
      }

      // ────────────────────────────────────────────────────────────────
      // TELA: Editor de Cena
      // ────────────────────────────────────────────────────────────────
      function showSceneEditor() {
        [screenList, screenPicker, screenHotspot, screenNorth, screenView].forEach(s => s.style.display = 'none');
        screenScene.style.display = 'block';
        const scene = scenes[editingSceneIndex];
        editor.Modal.setTitle(`✏️ Editar Cena ${editingSceneIndex+1}${scene.title?' — '+scene.title:''}`);
        renderSceneEditor();
      }

      function renderSceneEditor() {
        screenScene.innerHTML = '';
        const scene = scenes[editingSceneIndex];

        // ── Seletor de tipo de cena ───────────────────────────────────────────
        const sceneTypeWrap = document.createElement('div');
        sceneTypeWrap.style.cssText = 'display:flex;gap:8px;margin-bottom:12px;';

        [{v:'image',icon:'📷',label:'Foto 360°',color:'#3b82f6'},
         {v:'video',icon:'🎬',label:'Vídeo 360° (A-Frame)',color:'#dc2626'}].forEach(({v,icon,label,color}) => {
          const btn = document.createElement('button');
          const isActive = (scene.sceneType||'image') === v;
          btn.style.cssText = `flex:1;display:flex;align-items:center;justify-content:center;gap:6px;
            padding:8px;border-radius:6px;cursor:pointer;font-family:sans-serif;font-size:13px;font-weight:600;
            border:2px solid ${isActive?color:'#2a2a3e'};
            background:${isActive?color+'22':'#111'};color:${isActive?'#fff':'#666'};
            transition:all .15s;`;
          btn.innerHTML = `<span style="font-size:18px;">${icon}</span><span>${label}</span>`;
          btn.onclick = () => {
            scene.sceneType = v;
            renderSceneEditor();
          };
          sceneTypeWrap.appendChild(btn);
        });
        screenScene.appendChild(sceneTypeWrap);

        const isVideo = (scene.sceneType || 'image') === 'video';

        // ── Layout 2 colunas ──
        const cols = document.createElement('div');
        cols.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;';

        // Coluna esquerda: campos de dados
        const leftCol = document.createElement('div');
        leftCol.style.cssText = 'display:flex;flex-direction:column;gap:8px;';

        function mkField(label, val, onch, type='text', placeholder='') {
          const box = document.createElement('div');
          const lbl = document.createElement('label');
          lbl.textContent = label;
          lbl.style.cssText = 'display:block;font-size:10px;color:#bbb;text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px;';
          const inp = document.createElement('input');
          inp.type = type; inp.value = val;
          inp.placeholder = placeholder;
          inp.style.cssText = 'width:100%;background:#0d0d1a;color:#ccc;border:1px solid #2a2a3e;border-radius:3px;padding:5px 8px;font-size:12px;box-sizing:border-box;';
          inp.oninput = () => onch(inp.value);
          box.appendChild(lbl); box.appendChild(inp); return box;
        }

        function mkTextArea(label, val, onch) {
          const box = document.createElement('div');
          const lbl = document.createElement('label');
          lbl.textContent = label;
          lbl.style.cssText = 'display:block;font-size:10px;color:#bbb;text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px;';
          const ta = document.createElement('textarea');
          ta.value = val; ta.rows = 2;
          ta.style.cssText = 'width:100%;background:#0d0d1a;color:#ccc;border:1px solid #2a2a3e;border-radius:3px;padding:5px 8px;font-size:12px;box-sizing:border-box;resize:vertical;font-family:inherit;';
          ta.oninput = () => onch(ta.value);
          box.appendChild(lbl); box.appendChild(ta); return box;
        }

        leftCol.appendChild(mkField('Título', scene.title, v => scene.title = v, 'text', 'Ex: Sala de Estar'));
        leftCol.appendChild(mkTextArea('Descrição', scene.desc || '', v => scene.desc = v));

        // Campos numéricos agrupados
        const numGroup = document.createElement('div');
        numGroup.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:6px;';

        function mkNumReadonly(label, val) {
          const box = document.createElement('div');
          const lbl = document.createElement('label');
          lbl.textContent = label;
          lbl.style.cssText = 'display:block;font-size:10px;color:#bbb;text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px;';
          const inp = document.createElement('input');
          inp.type = 'number'; inp.value = val; inp.readOnly = true;
          inp.style.cssText = 'width:100%;background:#0a0a15;color:#ccc;border:1px solid #1e1e30;border-radius:3px;padding:5px 8px;font-size:12px;box-sizing:border-box;cursor:default;';
          box.appendChild(lbl); box.appendChild(inp); return box;
        }

        numGroup.appendChild(mkNumReadonly('Norte (north)', scene.north||0));
        numGroup.appendChild(mkNumReadonly('HFOV', scene.hfov||100));
        numGroup.appendChild(mkNumReadonly('Yaw (início)', scene.yaw||0));
        numGroup.appendChild(mkNumReadonly('Pitch (início)', scene.pitch||0));

        const northBtn = document.createElement('button');
        northBtn.innerHTML = '📍 Configurar Norte Visualmente';
        northBtn.style.cssText = 'background:#4f46e5;color:#fff;border:none;padding:8px;border-radius:4px;cursor:pointer;font-size:12px;font-weight:600;margin-top:8px;width:100%;transition:background 0.2s;';
        northBtn.onmouseover = () => northBtn.style.background = '#4338ca';
        northBtn.onmouseout  = () => northBtn.style.background = '#4f46e5';
        northBtn.onclick = () => showNorthScreen(scene);
        numGroup.appendChild(northBtn);

        const viewBtn = document.createElement('button');
        viewBtn.innerHTML = '🎯 Configurar Visão Inicial';
        viewBtn.style.cssText = 'background:#0891b2;color:#fff;border:none;padding:8px;border-radius:4px;cursor:pointer;font-size:12px;font-weight:600;margin-top:4px;width:100%;transition:background 0.2s;';
        viewBtn.onmouseover = () => viewBtn.style.background = '#0e7490';
        viewBtn.onmouseout  = () => viewBtn.style.background = '#0891b2';
        viewBtn.onclick = () => showViewScreen(scene);
        numGroup.appendChild(viewBtn);

        leftCol.appendChild(numGroup);

        // Coluna direita: mídia (imagem ou vídeo conforme sceneType)
        const rightCol = document.createElement('div');
        rightCol.style.cssText = 'display:flex;flex-direction:column;gap:8px;';

        if (!isVideo) {
          // ── Imagem 360° ────────────────────────────────────────────────────
          const imgLabel = document.createElement('div');
          imgLabel.style.cssText = 'font-size:10px;color:#bbb;text-transform:uppercase;letter-spacing:.5px;';
          imgLabel.textContent = 'Imagem 360° (equiretangular)';

          const imgPreview = document.createElement('div');
          imgPreview.style.cssText = 'position:relative;height:110px;background:#0d0d1a;border:1px dashed #333;border-radius:4px;overflow:hidden;display:flex;align-items:center;justify-content:center;cursor:pointer;';
          if (scene.src) {
            imgPreview.innerHTML = `<img src="${scene.src}" style="width:100%;height:100%;object-fit:cover;opacity:0.8;">
              <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;opacity:0;background:rgba(0,0,0,0.5);transition:opacity .2s;" class="img-hover-overlay">
                <span style="color:#fff;font-size:12px;font-weight:600;">Trocar</span>
              </div>`;
            imgPreview.onmouseover = () => { imgPreview.querySelector('.img-hover-overlay').style.opacity='1'; };
            imgPreview.onmouseout  = () => { imgPreview.querySelector('.img-hover-overlay').style.opacity='0'; };
          } else {
            imgPreview.innerHTML = `<div style="text-align:center;color:#999;"><div style="font-size:28px;">🌐</div><div style="font-size:11px;margin-top:4px;">Clique para adicionar</div></div>`;
          }
          imgPreview.onclick = () => { pickingForScene = editingSceneIndex; showPickerForScene(); };
          rightCol.appendChild(imgLabel);
          rightCol.appendChild(imgPreview);
          const tip = document.createElement('div');
          tip.style.cssText = 'font-size:10px;color:#444;line-height:1.4;';
          tip.innerHTML = 'Use imagens equiretangulares 360°.<br>Proporção ideal: 2:1 (ex: 4096×2048px)';
          rightCol.appendChild(tip);

        } else {
          // ── Vídeo 360° ─────────────────────────────────────────────────────
          const vidLabel = document.createElement('div');
          vidLabel.style.cssText = 'font-size:10px;color:#dc2626;text-transform:uppercase;letter-spacing:.5px;font-weight:700;';
          vidLabel.textContent = '🎬 Vídeo 360° (equiretangular)';
          rightCol.appendChild(vidLabel);

          // URL do vídeo
          function mkVidField(label, val, onch, placeholder) {
            const box = document.createElement('div');
            const lbl = document.createElement('label');
            lbl.textContent = label;
            lbl.style.cssText = 'display:block;font-size:10px;color:#bbb;text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px;';
            const inp = document.createElement('input');
            inp.type = 'text'; inp.value = val || ''; inp.placeholder = placeholder || '';
            inp.style.cssText = 'width:100%;background:#0d0d1a;color:#ccc;border:1px solid #2a2a3e;border-radius:3px;padding:5px 8px;font-size:12px;box-sizing:border-box;';
            inp.oninput = () => onch(inp.value);
            box.appendChild(lbl); box.appendChild(inp); return box;
          }

          // ── Seletor de vídeo 360° ────────────────────────────────────────
          function mkMediaRow(label, currentSrc, accentColor, onPick, pickMode) {
            const box = document.createElement('div');
            const lbl = document.createElement('label');
            lbl.textContent = label;
            lbl.style.cssText = 'display:block;font-size:10px;color:#bbb;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px;';
            box.appendChild(lbl);

            const row = document.createElement('div');
            row.style.cssText = 'display:flex;gap:6px;align-items:center;';

            const preview = document.createElement('div');
            preview.style.cssText = 'flex:1;background:#0d0d1a;border:1px solid #2a2a3e;border-radius:3px;padding:5px 8px;font-size:11px;color:#aaa;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-height:28px;display:flex;align-items:center;';
            preview.textContent = currentSrc ? currentSrc.split('/').pop() : '— não selecionado —';
            if (currentSrc) preview.style.color = '#aaa';

            const pickBtn = document.createElement('button');
            pickBtn.textContent = pickMode === 'video' ? '🎬 Selecionar' : '🖼️ Selecionar';
            pickBtn.style.cssText = `background:${accentColor};color:#fff;border:none;border-radius:3px;padding:5px 10px;cursor:pointer;font-size:11px;font-weight:600;flex-shrink:0;`;
            pickBtn.onclick = () => {
              pickingForScene = editingSceneIndex;
              showPicker(pickMode, src => {
                onPick(src);
                preview.textContent = src.split('/').pop();
                preview.style.color = '#aaa';
              }, screenScene);
            };

            row.appendChild(preview);
            row.appendChild(pickBtn);
            box.appendChild(row);
            return box;
          }

          rightCol.appendChild(mkMediaRow(
            '🎬 Arquivo de Vídeo 360° (.mp4)',
            scene.src, '#dc2626',
            v => scene.src = v,
            'video'
          ));

          rightCol.appendChild(mkMediaRow(
            '🖼️ Poster (capa antes do play)',
            scene.poster, '#6366f1',
            v => scene.poster = v,
            'image'
          ));

          // Opções de playback
          const optsRow = document.createElement('div');
          optsRow.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:6px;';

          function mkCheck(label, checked, onch) {
            const box = document.createElement('div');
            box.style.cssText = 'display:flex;align-items:center;gap:5px;';
            const inp = document.createElement('input');
            inp.type = 'checkbox'; inp.checked = !!checked;
            inp.style.cssText = 'width:14px;height:14px;cursor:pointer;accent-color:#dc2626;';
            inp.onchange = () => onch(inp.checked);
            const lbl = document.createElement('label');
            lbl.textContent = label;
            lbl.style.cssText = 'font-size:11px;color:#888;cursor:pointer;';
            lbl.onclick = () => { inp.click(); };
            box.appendChild(inp); box.appendChild(lbl); return box;
          }

          optsRow.appendChild(mkCheck('Autoplay', scene.videoAutoplay,   v => scene.videoAutoplay   = v));
          optsRow.appendChild(mkCheck('Loop',     scene.videoLoop,       v => scene.videoLoop       = v));
          optsRow.appendChild(mkCheck('Mudo',     scene.videoMuted !== false, v => scene.videoMuted = v));
          rightCol.appendChild(optsRow);

          const vidTip = document.createElement('div');
          vidTip.style.cssText = 'font-size:10px;color:#444;line-height:1.4;margin-top:4px;';
          vidTip.innerHTML = 'Use .mp4 equiretangular 360°.<br>Proporção 2:1 · H.264 recomendado.';
          rightCol.appendChild(vidTip);
        }

        cols.appendChild(leftCol);
        cols.appendChild(rightCol);
        screenScene.appendChild(cols);

        // ── Seção Hotspots ──
        const hsHeader = document.createElement('div');
        hsHeader.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;padding-top:10px;border-top:1px solid #2a2a3e;';
        hsHeader.innerHTML = `<div style="font-size:12px;font-weight:700;color:#aaa;">HOTSPOTS <span style="color:#999;font-weight:400;">(${scene.hotspots?.length||0})</span></div>`;

        const addHsBtn = document.createElement('button');
        addHsBtn.textContent = '+ Adicionar Hotspot Visualmente';
        addHsBtn.style.cssText = 'background:#7c3aed;color:#fff;border:none;border-radius:4px;padding:5px 12px;cursor:pointer;font-size:12px;';
        addHsBtn.onclick = () => {
          if (!scene.src) { alert('Adicione uma imagem 360° (ou URL de vídeo 360°) à cena antes de criar hotspots.'); return; }
          editingHotspotIndex = -1;
          showHotspotEditor();
        };
        hsHeader.appendChild(addHsBtn);
        screenScene.appendChild(hsHeader);

        // Lista de hotspots existentes
        const hsList = document.createElement('div');
        hsList.style.cssText = 'max-height:160px;overflow-y:auto;display:flex;flex-direction:column;gap:4px;margin-bottom:12px;';

        if (!scene.hotspots || !scene.hotspots.length) {
          hsList.innerHTML = '<div style="padding:12px;text-align:center;color:#444;font-size:12px;">Nenhum hotspot. Clique em "+ Adicionar" para posicionar visualmente.</div>';
        } else {
          (scene.hotspots || []).forEach((hs, hi) => {
            const hsRow = document.createElement('div');
            hsRow.style.cssText = 'display:flex;align-items:center;gap:6px;background:#1a1a2e;border-radius:4px;padding:6px 8px;';

            const hsType = document.createElement('span');
            hsType.textContent = hs.type === 'scene' ? '🔗' : hs.type === 'info' ? 'ℹ️' : hs.type === 'video-flat' ? '📹' : hs.type === 'video-modal' ? '🎞️' : hs.type === 'video-wall' ? '🖼️' : hs.type === 'image-detail' ? '🖼' : '🌐';
            hsType.style.cssText = 'font-size:14px;flex-shrink:0;';

            const hsInfo = document.createElement('div');
            hsInfo.style.cssText = 'flex:1;min-width:0;';
            hsInfo.innerHTML = `<div style="font-size:12px;color:#ccc;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${hs.text||'(sem texto)'}</div>
              <div style="font-size:10px;color:#999;">pitch:${hs.pitch?.toFixed(1)}, yaw:${hs.yaw?.toFixed(1)}${hs.sceneId?' → '+hs.sceneId:''}</div>`;

            const editHsBtn = document.createElement('button');
            editHsBtn.textContent = '✏️';
            editHsBtn.title = 'Editar hotspot';
            editHsBtn.style.cssText = 'background:#2a2a3e;color:#aaa;border:none;border-radius:3px;padding:3px 8px;cursor:pointer;font-size:12px;';
            editHsBtn.onclick = () => { editingHotspotIndex = hi; showHotspotEditor(); };

            const delHsBtn = document.createElement('button');
            delHsBtn.textContent = '🗑';
            delHsBtn.style.cssText = 'background:#7f1d1d;color:#fca5a5;border:none;border-radius:3px;padding:3px 8px;cursor:pointer;font-size:12px;';
            delHsBtn.onclick = () => { scene.hotspots.splice(hi, 1); renderSceneEditor(); };

            hsRow.appendChild(hsType); hsRow.appendChild(hsInfo); hsRow.appendChild(editHsBtn); hsRow.appendChild(delHsBtn);
            hsList.appendChild(hsRow);
          });
        }
        screenScene.appendChild(hsList);

        // ── Footer da tela de edição de cena ──
        const footer = document.createElement('div');
        footer.style.cssText = 'display:flex;gap:8px;align-items:center;border-top:1px solid #2a2a3e;padding-top:12px;';

        const backBtn = document.createElement('button');
        backBtn.textContent = '← Voltar';
        backBtn.style.cssText = 'background:#2a2a3e;color:#ccc;border:none;border-radius:4px;padding:7px 14px;cursor:pointer;font-size:13px;margin-right:auto;';
        backBtn.onclick = showList;

        const saveSceneBtn = document.createElement('button');
        saveSceneBtn.textContent = '✓ Salvar Cena';
        saveSceneBtn.style.cssText = 'background:#22c55e;color:#fff;border:none;border-radius:4px;padding:7px 20px;cursor:pointer;font-size:13px;font-weight:700;';
        saveSceneBtn.onclick = showList; // dados já atualizados via closure

        footer.appendChild(backBtn); footer.appendChild(saveSceneBtn);
        screenScene.appendChild(footer);
      }

      // ────────────────────────────────────────────────────────────────
      // TELA: Picker de imagem (reusa o mesmo padrão da galeria)
      // ────────────────────────────────────────────────────────────────
      // ── Voltar do picker para a tela de origem ────────────────────────────────
      function returnFromPicker() {
        [screenList, screenPicker, screenHotspot, screenScene].forEach(s => s.style.display = 'none');
        if (pickerReturnScreen) {
          pickerReturnScreen.style.display = 'block';
          // Atualizar título do modal conforme tela de retorno
          if (pickerReturnScreen === screenScene) {
            editor.Modal.setTitle(`✏️ Editar Cena ${editingSceneIndex+1}`);
            renderSceneEditor();
          } else if (pickerReturnScreen === screenHotspot) {
            const isNew = editingHotspotIndex === -1;
            const scene = scenes[editingSceneIndex];
            editor.Modal.setTitle(`${isNew?'➕ Novo':'✏️ Editar'} Hotspot — ${scene?.title||'Cena '+(editingSceneIndex+1)}`);
            renderHotspotEditor();
          }
        } else {
          editingSceneIndex = pickingForScene;
          screenScene.style.display = 'block';
          editor.Modal.setTitle(`✏️ Editar Cena ${editingSceneIndex+1}`);
          renderSceneEditor();
        }
      }

      // ── Picker genérico de mídia ────────────────────────────────────────────
      // mode: 'image' | 'video'
      // callback(url): chamado com a URL escolhida
      // returnScreen: elemento DOM a exibir após seleção (null = screenScene)
      function showPicker(mode, callback, returnScreen) {
        pickerMode     = mode || 'image';
        pickerCallback = callback;
        pickerReturnScreen = returnScreen || screenScene;
        [screenList, screenScene, screenHotspot].forEach(s => s.style.display = 'none');
        screenPicker.style.display = 'block';
        const titles = { image: 'Selecionar Imagem 360°', video: 'Selecionar Vídeo' };
        editor.Modal.setTitle(titles[pickerMode] || 'Selecionar Arquivo');
        renderPicker();
      }

      // Atalho para compatibilidade interna (cena de imagem)
      function showPickerForScene() {
        showPicker('image', src => {
          scenes[pickingForScene].src = src;
          editingSceneIndex = pickingForScene;
          editor.Modal.setTitle(`✏️ Editar Cena ${editingSceneIndex+1}`);
          renderSceneEditor();
        }, screenScene);
      }

      // Legado — mantido para compatibilidade
      function onImagePicked(src) {
        if (pickerCallback) { pickerCallback(src); return; }
        scenes[pickingForScene].src = src;
        editingSceneIndex = pickingForScene;
        [screenList, screenPicker, screenHotspot].forEach(s => s.style.display = 'none');
        screenScene.style.display = 'block';
        editor.Modal.setTitle(`✏️ Editar Cena ${editingSceneIndex+1}`);
        renderSceneEditor();
      }

      function renderPicker() {
        screenPicker.innerHTML = '';
        const isVideo   = pickerMode === 'video';
        const accentClr = isVideo ? '#dc2626' : '#3b82f6';
        const uploadClr = isVideo ? '#b91c1c' : '#6366f1';
        const allAssets = editor.AssetManager.getAll();

        // ── Grid de assets existentes ──────────────────────────────────────
        const gridLbl = document.createElement('div');
        gridLbl.textContent = 'Imagens disponíveis';
        gridLbl.style.cssText = 'font-size:10px;color:#bbb;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px;';
        screenPicker.appendChild(gridLbl);

        const grid = document.createElement('div');
        grid.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;max-height:200px;overflow-y:auto;background:#111;border-radius:6px;padding:8px;margin-bottom:12px;min-height:56px;';

        // Filtrar assets por tipo
        const videoExts = ['.mp4','.webm','.ogg','.mov'];
        const isVideoSrc = s => videoExts.some(e => s.toLowerCase().includes(e));
        const filtered = allAssets.filter(a => {
          const src = a.get('src') || '';
          return isVideo ? isVideoSrc(src) : !isVideoSrc(src);
        });

        if (filtered.length) {
          filtered.forEach(asset => {
            const src = asset.get('src');
            const cell = document.createElement('div');
            cell.style.cssText = 'position:relative;width:80px;height:55px;border-radius:4px;overflow:hidden;cursor:pointer;border:2px solid transparent;transition:border-color .15s,transform .15s;flex-shrink:0;background:#1a1a2e;display:flex;align-items:center;justify-content:center;';
            if (isVideo) {
              // Vídeo: mostrar nome do arquivo + ícone
              const name = src.split('/').pop();
              cell.innerHTML = `<div style="text-align:center;padding:4px;"><div style="font-size:20px;">🎬</div><div style="font-size:9px;color:#aaa;word-break:break-all;line-height:1.2;margin-top:2px;">${name}</div></div>`;
            } else {
              cell.innerHTML = `<img src="${src}" style="width:100%;height:100%;object-fit:cover;display:block;pointer-events:none;">`;
            }
            cell.onmouseover = () => { cell.style.borderColor = accentClr; cell.style.transform='scale(1.04)'; };
            cell.onmouseout  = () => { cell.style.borderColor = 'transparent'; cell.style.transform=''; };
            cell.onclick = () => { onImagePicked(src); returnFromPicker(); };
            grid.appendChild(cell);
          });
        } else {
          grid.innerHTML = `<p style="color:#999;font-size:12px;padding:8px;margin:0;">Nenhum ${isVideo?'vídeo':'imagem'} nos assets. Faça upload abaixo.</p>`;
        }
        screenPicker.appendChild(grid);

        // ── URL manual ────────────────────────────────────────────────────
        const urlLbl = document.createElement('div');
        urlLbl.textContent = 'Ou cole uma URL';
        urlLbl.style.cssText = 'font-size:10px;color:#bbb;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px;';
        screenPicker.appendChild(urlLbl);

        const urlRow = document.createElement('div');
        urlRow.style.cssText = 'display:flex;gap:8px;margin-bottom:10px;';
        const urlInput = document.createElement('input');
        urlInput.type = 'text';
        urlInput.placeholder = isVideo ? 'Cole URL do vídeo (.mp4, .webm)...' : 'Cole URL da imagem 360°...';
        urlInput.style.cssText = 'flex:1;background:#1a1a2e;color:#fff;border:1px solid #444;border-radius:3px;padding:6px 10px;font-size:13px;';
        const urlBtn = document.createElement('button');
        urlBtn.textContent = 'Usar URL';
        urlBtn.style.cssText = `background:${accentClr};color:#fff;border:none;border-radius:3px;padding:6px 14px;cursor:pointer;font-size:13px;`;
        urlBtn.onclick = () => { const u = urlInput.value.trim(); if(u) { onImagePicked(u); returnFromPicker(); } };
        urlInput.onkeydown = e => { if(e.key==='Enter') urlBtn.onclick(); };
        urlRow.appendChild(urlInput); urlRow.appendChild(urlBtn);
        screenPicker.appendChild(urlRow);

        // ── Upload ────────────────────────────────────────────────────────
        const uploadRow = document.createElement('div');
        uploadRow.style.cssText = 'display:flex;gap:8px;align-items:center;';
        const uploadStatus = document.createElement('span');
        uploadStatus.style.cssText = 'font-size:12px;color:#bbb;flex:1;';
        const uploadLabel = document.createElement('label');
        uploadLabel.style.cssText = `background:${uploadClr};color:#fff;border-radius:3px;padding:7px 16px;cursor:pointer;font-size:13px;display:inline-block;flex-shrink:0;`;
        uploadLabel.textContent = isVideo ? '🎬 Upload Vídeo' : '📤 Upload Imagem';
        const uploadInput = document.createElement('input');
        uploadInput.type = 'file';
        uploadInput.accept = isVideo ? 'video/*' : 'image/*';
        uploadInput.style.display = 'none';
        uploadLabel.appendChild(uploadInput);
        uploadInput.onchange = async (e) => {
          const file = e.target.files[0];
          if (!file) return;
          uploadStatus.textContent = '⏳ Enviando...';
          const fd = new FormData(); fd.append('files[]', file);
          try {
            const res  = await fetch('/api/assets/upload', { method:'POST', body:fd });
            const data = await res.json();
            const src  = data.data?.[0]?.src || data[0]?.src;
            if (src) {
              editor.AssetManager.add({ src, name: file.name });
              uploadStatus.textContent = `✓ ${file.name.slice(0,30)}`;
              // Chamar picked e voltar para a tela de origem
              onImagePicked(src);
              returnFromPicker();
            } else {
              uploadStatus.textContent = '✗ Erro: resposta inválida do servidor';
            }
          } catch(err) { uploadStatus.textContent = '✗ ' + err.message; }
        };

        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = '← Voltar';
        cancelBtn.style.cssText = 'background:#2a2a3e;color:#ccc;border:none;border-radius:3px;padding:7px 14px;cursor:pointer;font-size:13px;';
        cancelBtn.onclick = returnFromPicker;

        uploadRow.appendChild(uploadLabel); uploadRow.appendChild(uploadStatus); uploadRow.appendChild(cancelBtn);
        screenPicker.appendChild(uploadRow);
      }

      // ────────────────────────────────────────────────────────────────
      // TELA: Editor de Hotspot (com viewer Pannellum interativo)
      // ────────────────────────────────────────────────────────────────
      function showHotspotEditor() {
        [screenList, screenScene, screenPicker].forEach(s => s.style.display = 'none');
        screenHotspot.style.display = 'block';
        const scene = scenes[editingSceneIndex];
        const isNew = editingHotspotIndex === -1;
        // Resetar currentHs ao abrir o editor pela primeira vez (não ao re-renderizar vindo do picker)
        currentHs = null;
        editor.Modal.setTitle(`${isNew?'➕ Novo':'✏️ Editar'} Hotspot — ${scene.title||'Cena '+(editingSceneIndex+1)}`);
        renderHotspotEditor();
      }

      function renderHotspotEditor() {
        screenHotspot.innerHTML = '';
        const scene = scenes[editingSceneIndex];
        const isNew = editingHotspotIndex === -1;

        // Usar currentHs persistente para não perder dados entre re-renders
        // (ex: ao voltar do picker de vídeo)
        if (!currentHs) {
          currentHs = isNew
            ? { pitch: 0, yaw: 0, type: 'scene', text: '', sceneId: '', url: '' }
            : JSON.parse(JSON.stringify(scene.hotspots[editingHotspotIndex]));
        }
        const hs = currentHs;

        // ── Instrução ──
        const instruction = document.createElement('div');
        instruction.style.cssText = 'background:#1a1a2e;border-radius:6px;padding:10px 14px;margin-bottom:12px;font-size:12px;color:#aaa;line-height:1.5;';
        instruction.innerHTML = '<strong style="color:#7c3aed;">Como usar:</strong> Navegue no panorama abaixo e <strong style="color:#fff;">clique</strong> no local exato onde deseja o hotspot. As coordenadas serão preenchidas automaticamente.';
        screenHotspot.appendChild(instruction);

        // ── Viewer Pannellum para posicionamento ──
        const viewerContainer = document.createElement('div');
        viewerContainer.style.cssText = 'width:100%;height:280px;border-radius:6px;overflow:hidden;margin-bottom:12px;position:relative;background:#000;';
        screenHotspot.appendChild(viewerContainer);

        // Coordenadas exibidas em tempo real
        const coordDisplay = document.createElement('div');
        coordDisplay.style.cssText = 'position:absolute;bottom:8px;right:10px;background:rgba(0,0,0,0.75);color:#fff;font-size:11px;padding:4px 8px;border-radius:4px;z-index:10;pointer-events:none;font-family:monospace;';
        coordDisplay.textContent = 'Clique para definir posição';
        viewerContainer.appendChild(coordDisplay);

        // Inicializar Pannellum com hotspots existentes (ícones por tipo)
        const hsEditorIcons = { scene: '🔗', info: 'ℹ️', url: '🌐', 'image-detail': '🖼', 'video-flat': '📹', 'video-modal': '🎞️', 'video-wall': '🖼️' };
        const existingHotspots = (scene.hotspots || []).filter((h, hi) => hi !== editingHotspotIndex).map((h, hi) => ({
          pitch: h.pitch, yaw: h.yaw, type: 'info',
          text: (hsEditorIcons[h.type] || '•') + ' ' + (h.text || `HS ${hi+1}`),
          cssClass: 'pnlm-hotspot-base pnlm-info',
        }));

        // Hotspot de preview para o atual (se editando)
        let previewHs = null;
        if (!isNew) {
          previewHs = { pitch: hs.pitch, yaw: hs.yaw, type: 'info', text: '✎ ' + (hs.text || 'editando'), cssClass: 'pnlm-hotspot-base pnlm-info' };
        }

        // Pequeno delay para que o DOM esteja pronto
        setTimeout(() => {
          if (hotspotViewer) { try { hotspotViewer.destroy(); } catch {} }
          try {
            hotspotViewer = pannellum.viewer(viewerContainer, {
              type: 'equirectangular',
              panorama: scene.src,
              hfov: scene.hfov || 100,
              yaw: isNew ? (scene.yaw || 0) : hs.yaw,
              pitch: isNew ? (scene.pitch || 0) : hs.pitch,
              autoLoad: true,
              showControls: true,
              hotSpotDebug: false,
              hotSpots: existingHotspots,
            });

            // Capturar clique para definir posição
            hotspotViewer.on('mousedown', function(e) {
              // O pannellum não expõe o método direto — usamos o evento nativo
            });

            // Usar evento nativo no container
            viewerContainer.addEventListener('click', function(e) {
              const rect = viewerContainer.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const y = e.clientY - rect.top;
              const coords = hotspotViewer.mouseEventToCoords(e);
              if (coords) {
                hs.pitch = parseFloat(coords[0].toFixed(2));
                hs.yaw   = parseFloat(coords[1].toFixed(2));
                coordDisplay.textContent = `pitch: ${hs.pitch}° · yaw: ${hs.yaw}°`;
                pitchInput.value = hs.pitch;
                yawInput.value   = hs.yaw;
              }
            });

          } catch(err) {
            viewerContainer.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#999;font-size:13px;flex-direction:column;gap:8px;">
              <div>⚠️ Não foi possível carregar o preview</div>
              <div style="font-size:11px;color:#444;">Defina pitch/yaw manualmente abaixo</div>
            </div>`;
          }
        }, 80);

        // ── Campos do hotspot ──
        const fields = document.createElement('div');
        fields.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;';

        function mkField(label, val, onch, type='text', placeholder='') {
          const box = document.createElement('div');
          const lbl = document.createElement('label');
          lbl.textContent = label;
          lbl.style.cssText = 'display:block;font-size:10px;color:#bbb;text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px;';
          const inp = document.createElement('input');
          inp.type = type; inp.value = val; inp.placeholder = placeholder;
          inp.style.cssText = 'width:100%;background:#0d0d1a;color:#ccc;border:1px solid #2a2a3e;border-radius:3px;padding:5px 8px;font-size:12px;box-sizing:border-box;';
          inp.oninput = () => onch(inp.value);
          box.appendChild(lbl); box.appendChild(inp); return { box, inp };
        }

        const pitchField = mkField('Pitch', hs.pitch, v => { hs.pitch = parseFloat(v)||0; }, 'number', '0');
        const yawField   = mkField('Yaw',   hs.yaw,   v => { hs.yaw   = parseFloat(v)||0; }, 'number', '0');
        const pitchInput = pitchField.inp;
        const yawInput   = yawField.inp;
        fields.appendChild(pitchField.box);
        fields.appendChild(yawField.box);

        // Tipo do hotspot
        const typeBox = document.createElement('div');
        typeBox.style.cssText = 'grid-column:1/-1;';
        const typeLbl = document.createElement('label');
        typeLbl.textContent = 'Tipo';
        typeLbl.style.cssText = 'display:block;font-size:10px;color:#bbb;text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px;';
        const typeSel = document.createElement('select');
        typeSel.style.cssText = 'width:100%;background:#0d0d1a;color:#ccc;border:1px solid #2a2a3e;border-radius:3px;padding:5px 8px;font-size:12px;';
        [['scene','🔗 Navegar para cena'], ['info','ℹ️ Informação'], ['url','🌐 Link externo'],
          ['image-detail','🖼 Imagem de detalhe (modal)'],
          ['video-flat','📹 Vídeo plano (tooltip)'], ['video-modal','🎞️ Vídeo (modal overlay)'],
          ['video-wall','🖼️ Vídeo em perspectiva (parede 3D)']].forEach(([v,t]) => {
          const o = document.createElement('option');
          o.value = v; o.textContent = t; if(v===hs.type) o.selected=true;
          typeSel.appendChild(o);
        });
        typeSel.onchange = () => { hs.type = typeSel.value; renderHotspotFields(); };
        typeBox.appendChild(typeLbl); typeBox.appendChild(typeSel);
        fields.appendChild(typeBox);

        // Texto do hotspot
        const textField = mkField('Texto (tooltip)', hs.text||'', v => hs.text = v, 'text', 'Ex: Cozinha');
        textField.box.style.gridColumn = '1/-1';
        fields.appendChild(textField.box);

        screenHotspot.appendChild(fields);

        // Container dinâmico para campos condicionais
        const dynFields = document.createElement('div');
        dynFields.style.cssText = 'margin-bottom:12px;';
        screenHotspot.appendChild(dynFields);

        // ── Picker de mídia para hotspots (imagem ou vídeo) ────────────────
        // Declarada fora do renderHotspotFields para estar disponível a todos os tipos
        function mkHsMediaRow(label, currentSrc, accentColor, onChange, pickMode) {
          const box = document.createElement('div');
          box.style.cssText = 'margin-bottom:8px;';
          const lbl = document.createElement('label');
          lbl.textContent = label;
          lbl.style.cssText = 'display:block;font-size:10px;color:#bbb;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px;';
          box.appendChild(lbl);

          const row = document.createElement('div');
          row.style.cssText = 'display:flex;gap:6px;align-items:center;';

          const preview = document.createElement('div');
          preview.style.cssText = 'flex:1;background:#0d0d1a;border:1px solid #2a2a3e;border-radius:3px;padding:5px 8px;font-size:11px;color:#aaa;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-height:28px;display:flex;align-items:center;';
          preview.textContent = currentSrc ? currentSrc.split('/').pop() : '— não selecionado —';
          if (currentSrc) preview.style.color = '#aaa';

          const pickBtn = document.createElement('button');
          pickBtn.textContent = pickMode === 'video' ? '🎬 Selecionar' : '🖼️ Selecionar';
          pickBtn.style.cssText = `background:${accentColor};color:#fff;border:none;border-radius:3px;padding:5px 10px;cursor:pointer;font-size:11px;font-weight:600;flex-shrink:0;`;
          pickBtn.onclick = () => {
            showPicker(pickMode, src => {
              onChange(src);
              preview.textContent = src.split('/').pop();
              preview.style.color = '#aaa';
            }, screenHotspot);
          };

          row.appendChild(preview);
          row.appendChild(pickBtn);
          box.appendChild(row);
          return box;
        }

        function renderHotspotFields() {
          dynFields.innerHTML = '';
          if (hs.type === 'scene') {
            const box = document.createElement('div');
            const lbl = document.createElement('label');
            lbl.textContent = 'Cena de destino';
            lbl.style.cssText = 'display:block;font-size:10px;color:#bbb;text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px;';
            const sel = document.createElement('select');
            sel.style.cssText = 'width:100%;background:#0d0d1a;color:#ccc;border:1px solid #2a2a3e;border-radius:3px;padding:5px 8px;font-size:12px;';
            const empty = document.createElement('option'); empty.value=''; empty.textContent='— Selecionar cena —';
            sel.appendChild(empty);
            scenes.forEach((s, si) => {
              if (si === editingSceneIndex) return; // não pode linkar para si mesmo
              const o = document.createElement('option');
              o.value = s.id; o.textContent = `${si+1}. ${s.title||'(sem título)'}`;
              if(s.id === hs.sceneId) o.selected = true;
              sel.appendChild(o);
            });
            sel.onchange = () => { hs.sceneId = sel.value; };
            box.appendChild(lbl); box.appendChild(sel);
            dynFields.appendChild(box);
          } else if (hs.type === 'url') {
            const box = document.createElement('div');
            const lbl = document.createElement('label');
            lbl.textContent = 'URL de destino';
            lbl.style.cssText = 'display:block;font-size:10px;color:#bbb;text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px;';
            const inp = document.createElement('input');
            inp.type = 'url'; inp.value = hs.url||''; inp.placeholder = 'https://...';
            inp.style.cssText = 'width:100%;background:#0d0d1a;color:#ccc;border:1px solid #2a2a3e;border-radius:3px;padding:5px 8px;font-size:12px;box-sizing:border-box;';
            inp.oninput = () => { hs.url = inp.value; };
            box.appendChild(lbl); box.appendChild(inp);
            dynFields.appendChild(box);

          } else if (hs.type === 'image-detail') {
            // ── Campos do hotspot de imagem de detalhe ─────────────────────
            dynFields.appendChild(mkHsMediaRow(
              '🖼 Imagem de detalhe',
              hs.imageUrl, '#6366f1',
              v => hs.imageUrl = v,
              'image'
            ));

            // Descrição da imagem
            const descBox = document.createElement('div');
            descBox.style.cssText = 'margin-top:8px;';
            const descLbl = document.createElement('label');
            descLbl.textContent = 'Descrição da imagem';
            descLbl.style.cssText = 'display:block;font-size:10px;color:#bbb;text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px;';
            const descInp = document.createElement('textarea');
            descInp.rows = 2;
            descInp.value = hs.imageDesc || '';
            descInp.placeholder = 'Ex: Vista da varanda sul — detalhe do acabamento';
            descInp.style.cssText = 'width:100%;background:#0d0d1a;color:#ccc;border:1px solid #2a2a3e;border-radius:3px;padding:5px 8px;font-size:12px;box-sizing:border-box;resize:vertical;font-family:inherit;line-height:1.4;';
            descInp.oninput = () => { hs.imageDesc = descInp.value; };
            descBox.appendChild(descLbl); descBox.appendChild(descInp);
            dynFields.appendChild(descBox);

          } else if (hs.type === 'video-flat' || hs.type === 'video-modal' || hs.type === 'video-wall') {
            // ── Campos comuns aos dois tipos de vídeo ──────────────────────
            function mkVidInp(label, val, onch, placeholder) {
              const box = document.createElement('div');
              box.style.cssText = 'margin-bottom:8px;';
              const lbl = document.createElement('label');
              lbl.textContent = label;
              lbl.style.cssText = 'display:block;font-size:10px;color:#bbb;text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px;';
              const inp = document.createElement('input');
              inp.type = 'text'; inp.value = val||''; inp.placeholder = placeholder||'';
              inp.style.cssText = 'width:100%;background:#0d0d1a;color:#ccc;border:1px solid #2a2a3e;border-radius:3px;padding:5px 8px;font-size:12px;box-sizing:border-box;';
              inp.oninput = () => onch(inp.value);
              box.appendChild(lbl); box.appendChild(inp); return box;
            }

            dynFields.appendChild(mkHsMediaRow(
              '🎬 Arquivo de Vídeo (.mp4)',
              hs.videoUrl, '#dc2626',
              v => hs.videoUrl = v,
              'video'
            ));
            dynFields.appendChild(mkHsMediaRow(
              '🖼️ Poster / Thumbnail (opcional)',
              hs.videoPoster, '#6366f1',
              v => hs.videoPoster = v,
              'image'
            ));

            if (hs.type === 'video-wall') {
              // Campos extras para o plano 3D
              const wallCfg = document.createElement('div');
              wallCfg.style.cssText = 'display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-top:6px;';

              function mkNumWall(label, key, def) {
                const box = document.createElement('div');
                const lbl = document.createElement('label');
                lbl.textContent = label;
                lbl.style.cssText = 'display:block;font-size:10px;color:#bbb;text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px;';
                const inp = document.createElement('input');
                inp.type = 'number'; inp.value = hs[key] !== undefined ? hs[key] : def;
                inp.step = '0.1';
                inp.style.cssText = 'width:100%;background:#0d0d1a;color:#ccc;border:1px solid #2a2a3e;border-radius:3px;padding:5px 8px;font-size:12px;box-sizing:border-box;';
                inp.oninput = () => { hs[key] = parseFloat(inp.value)||def; };
                box.appendChild(lbl); box.appendChild(inp); return box;
              }

              wallCfg.appendChild(mkNumWall('Largura (m)', 'wallWidth', 4));
              wallCfg.appendChild(mkNumWall('Altura (m)', 'wallHeight', 2.25));
              wallCfg.appendChild(mkNumWall('Distância (m)', 'wallDist', 3));

              const wallNote = document.createElement('div');
              wallNote.style.cssText = 'font-size:10px;color:#999;margin-top:4px;line-height:1.4;grid-column:1/-1;';
              wallNote.textContent = 'O vídeo será projetado em um plano 3D no espaço — perspectiva muda ao girar a câmera.';
              wallCfg.appendChild(wallNote);
              dynFields.appendChild(wallCfg);
            }

            if (hs.type === 'video-flat') {
              const tipBox = document.createElement('div');
              tipBox.style.cssText = 'background:#1a1a2e;border-radius:4px;padding:8px 10px;font-size:11px;color:#aaa;line-height:1.5;';
              tipBox.innerHTML = '<strong style="color:#888;">📹 Tooltip nativo Pannellum:</strong><br>O vídeo aparece como painel flutuante sobre o panorama ao passar o mouse ou clicar no hotspot.';
              dynFields.appendChild(tipBox);
              // Opção: mostrar tooltip ao carregar a cena
              const showLoadRow = document.createElement('div');
              showLoadRow.style.cssText = 'display:flex;align-items:center;gap:6px;margin-top:8px;';
              const showLoadChk = document.createElement('input');
              showLoadChk.type = 'checkbox'; showLoadChk.checked = !!hs.videoShowOnLoad;
              showLoadChk.style.cssText = 'accent-color:#7c3aed;cursor:pointer;';
              showLoadChk.onchange = () => hs.videoShowOnLoad = showLoadChk.checked;
              const showLoadLbl = document.createElement('label');
              showLoadLbl.textContent = 'Mostrar vídeo ao carregar (sem precisar clicar)';
              showLoadLbl.style.cssText = 'font-size:11px;color:#aaa;cursor:pointer;';
              showLoadLbl.onclick = () => showLoadChk.click();
              showLoadRow.appendChild(showLoadChk); showLoadRow.appendChild(showLoadLbl);
              dynFields.appendChild(showLoadRow);
            } else {
              const tipBox = document.createElement('div');
              tipBox.style.cssText = 'background:#1a1a2e;border-radius:4px;padding:8px 10px;font-size:11px;color:#aaa;line-height:1.5;';
              tipBox.innerHTML = '<strong style="color:#888;">🎞️ Modal overlay:</strong><br>Clicando no hotspot abre um modal centralizado com player completo (play/pause/volume/fullscreen).';
              dynFields.appendChild(tipBox);

              // Largura do modal (só para modal)
              const wBox = document.createElement('div');
              wBox.style.cssText = 'margin-top:6px;';
              const wLbl = document.createElement('label');
              wLbl.textContent = 'Largura do modal';
              wLbl.style.cssText = 'display:block;font-size:10px;color:#bbb;text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px;';
              const wInp = document.createElement('input');
              wInp.type='text'; wInp.value=hs.videoWidth||'80vw'; wInp.placeholder='80vw';
              wInp.style.cssText='width:100%;background:#0d0d1a;color:#ccc;border:1px solid #2a2a3e;border-radius:3px;padding:5px 8px;font-size:12px;box-sizing:border-box;';
              wInp.oninput = () => hs.videoWidth = wInp.value;
              wBox.appendChild(wLbl); wBox.appendChild(wInp);
              dynFields.appendChild(wBox);
            }

            // Checkboxes autoplay / loop / mudo
            const optsRow = document.createElement('div');
            optsRow.style.cssText = 'display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-top:8px;';
            [{label:'Autoplay', key:'videoAutoplay'},{label:'Loop', key:'videoLoop'},{label:'Mudo', key:'videoMuted'}].forEach(({label,key}) => {
              const cell = document.createElement('div');
              cell.style.cssText = 'display:flex;align-items:center;gap:4px;';
              const chk = document.createElement('input');
              chk.type='checkbox'; chk.checked=!!hs[key];
              chk.style.cssText='accent-color:#7c3aed;cursor:pointer;';
              chk.onchange = () => hs[key] = chk.checked;
              const lbl = document.createElement('label');
              lbl.textContent=label; lbl.style.cssText='font-size:11px;color:#888;cursor:pointer;';
              lbl.onclick = () => chk.click();
              cell.appendChild(chk); cell.appendChild(lbl);
              optsRow.appendChild(cell);
            });
            dynFields.appendChild(optsRow);
          }
        }
        renderHotspotFields();

        // ── Footer ──
        const footer = document.createElement('div');
        footer.style.cssText = 'display:flex;gap:8px;border-top:1px solid #2a2a3e;padding-top:12px;';

        const backBtn = document.createElement('button');
        backBtn.textContent = '← Voltar';
        backBtn.style.cssText = 'background:#2a2a3e;color:#ccc;border:none;border-radius:4px;padding:7px 14px;cursor:pointer;font-size:13px;margin-right:auto;';
        backBtn.onclick = () => {
          currentHs = null;
          if (hotspotViewer) { try { hotspotViewer.destroy(); hotspotViewer = null; } catch {} }
          showSceneEditor();
        };

        if (!isNew) {
          const delHsBtn = document.createElement('button');
          delHsBtn.textContent = '🗑 Excluir';
          delHsBtn.style.cssText = 'background:#7f1d1d;color:#fca5a5;border:none;border-radius:4px;padding:7px 14px;cursor:pointer;font-size:13px;';
          delHsBtn.onclick = () => {
            currentHs = null;
            scene.hotspots.splice(editingHotspotIndex, 1);
            if (hotspotViewer) { try { hotspotViewer.destroy(); hotspotViewer = null; } catch {} }
            showSceneEditor();
          };
          footer.appendChild(delHsBtn);
        }

        const saveHsBtn = document.createElement('button');
        saveHsBtn.textContent = isNew ? '➕ Adicionar Hotspot' : '✓ Salvar Hotspot';
        saveHsBtn.style.cssText = 'background:#22c55e;color:#fff;border:none;border-radius:4px;padding:7px 20px;cursor:pointer;font-size:13px;font-weight:700;';
        saveHsBtn.onclick = () => {
          if (!scene.hotspots) scene.hotspots = [];
          if (isNew) {
            scene.hotspots.push({ ...hs });
          } else {
            scene.hotspots[editingHotspotIndex] = { ...hs };
          }
          currentHs = null;
          if (hotspotViewer) { try { hotspotViewer.destroy(); hotspotViewer = null; } catch {} }
          showSceneEditor();
        };

        footer.appendChild(backBtn); footer.appendChild(saveHsBtn);
        screenHotspot.appendChild(footer);
      }

      // ────────────────────────────────────────────────────────────────
      // TELA: Configuração de Norte Visual
      // ────────────────────────────────────────────────────────────────
      function showNorthScreen(scene) {
        [screenList, screenPicker, screenHotspot, screenScene].forEach(s => s.style.display = 'none');
        screenNorth.style.display = 'block';
        screenNorth.innerHTML = '';
        editor.Modal.setTitle(`📍 Configurar Norte Visualmente`);

        const pBox = document.createElement('div');
        pBox.style.cssText = 'position:relative;width:100%;height:350px;background:#000;border-radius:6px;overflow:hidden;margin-bottom:14px;';
        
        const pContainer = document.createElement('div');
        pContainer.style.cssText = 'width:100%;height:100%;';
        pBox.appendChild(pContainer);

        // A mira vertical para alinhar o Norte
        const crosshair = document.createElement('div');
        crosshair.style.cssText = 'position:absolute;top:0;bottom:0;left:50%;width:2px;background:rgba(239, 68, 68, 0.8);transform:translateX(-50%);pointer-events:none;z-index:10;box-shadow:0 0 4px rgba(0,0,0,0.5);';
        
        const lbl = document.createElement('div');
        lbl.textContent = 'Norte (Arraste para alinhar)';
        lbl.style.cssText = 'position:absolute;top:10px;left:50%;transform:translateX(-50%);background:rgba(239, 68, 68, 0.9);color:#fff;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:700;z-index:11;pointer-events:none;white-space:nowrap;';
        
        pBox.appendChild(crosshair);
        pBox.appendChild(lbl);
        screenNorth.appendChild(pBox);

        // Inicializar pannellum
        requestAnimationFrame(() => {
          try {
            northViewer = pannellum.viewer(pContainer, {
              type: 'equirectangular',
              panorama: scene.src,
              yaw: scene.north || 0,
              pitch: 0,
              hfov: 100,
              autoLoad: true,
              showControls: false
            });
          } catch(e) { console.warn('Erro ao inicializar pannellum de norte:', e); }
        });

        const footer = document.createElement('div');
        footer.style.cssText = 'display:flex;gap:8px;border-top:1px solid #2a2a3e;padding-top:12px;';

        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Cancelar';
        cancelBtn.style.cssText = 'background:#2a2a3e;color:#ccc;border:none;border-radius:4px;padding:7px 14px;cursor:pointer;font-size:13px;margin-right:auto;';
        cancelBtn.onclick = () => {
          if (northViewer) { try { northViewer.destroy(); northViewer = null; } catch {} }
          showSceneEditor();
        };

        const applyBtn = document.createElement('button');
        applyBtn.textContent = '✓ Salvar Norte';
        applyBtn.style.cssText = 'background:#22c55e;color:#fff;border:none;border-radius:4px;padding:7px 20px;cursor:pointer;font-size:13px;font-weight:700;';
        applyBtn.onclick = () => {
          if (northViewer) {
            scene.north = Math.round(northViewer.getYaw() * 10) / 10;
            try { northViewer.destroy(); northViewer = null; } catch {}
          }
          showSceneEditor();
        };

        footer.appendChild(cancelBtn); footer.appendChild(applyBtn);
        screenNorth.appendChild(footer);
      }

      // ────────────────────────────────────────────────────────────────
      // TELA: Configuração de Visão Inicial (HFOV, YAW, PITCH)
      // ────────────────────────────────────────────────────────────────
      function showViewScreen(scene) {
        [screenList, screenPicker, screenHotspot, screenScene, screenNorth].forEach(s => s.style.display = 'none');
        screenView.style.display = 'block';
        screenView.innerHTML = '';
        editor.Modal.setTitle(`🎯 Configurar Visão Inicial — ${scene.title || 'Cena'}`);

        // Instrução
        const instr = document.createElement('div');
        instr.style.cssText = 'background:#1a1a2e;border-radius:6px;padding:10px 14px;margin-bottom:12px;font-size:12px;color:#aaa;line-height:1.5;';
        instr.innerHTML = '<strong style="color:#0891b2;">Como usar:</strong> Navegue e ajuste o zoom no panorama abaixo até encontrar o enquadramento inicial perfeito. Os hotspots configurados são exibidos como referência. Ao salvar, os valores de <strong style="color:#fff;">HFOV</strong>, <strong style="color:#fff;">Yaw</strong> e <strong style="color:#fff;">Pitch</strong> serão capturados automaticamente.';
        screenView.appendChild(instr);

        // Container do Pannellum
        const pBox = document.createElement('div');
        pBox.style.cssText = 'position:relative;width:100%;height:350px;background:#000;border-radius:6px;overflow:hidden;margin-bottom:10px;';

        const pContainer = document.createElement('div');
        pContainer.style.cssText = 'width:100%;height:100%;';
        pBox.appendChild(pContainer);

        // Display de coordenadas em tempo real
        const coordBar = document.createElement('div');
        coordBar.style.cssText = 'position:absolute;bottom:8px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.8);color:#fff;font-size:11px;padding:5px 12px;border-radius:4px;z-index:10;pointer-events:none;font-family:monospace;white-space:nowrap;';
        coordBar.textContent = 'Carregando...';
        pBox.appendChild(coordBar);

        // Mira central (cruz)
        const crossH = document.createElement('div');
        crossH.style.cssText = 'position:absolute;top:50%;left:calc(50% - 15px);width:30px;height:2px;background:rgba(8,145,178,0.7);transform:translateY(-50%);pointer-events:none;z-index:10;';
        const crossV = document.createElement('div');
        crossV.style.cssText = 'position:absolute;left:50%;top:calc(50% - 15px);width:2px;height:30px;background:rgba(8,145,178,0.7);transform:translateX(-50%);pointer-events:none;z-index:10;';
        pBox.appendChild(crossH);
        pBox.appendChild(crossV);

        screenView.appendChild(pBox);

        // Montar hotspots existentes para exibição com ícones diferenciados por tipo
        const hsIcons = { scene: '🔗', info: 'ℹ️', url: '🌐', 'image-detail': '🖼', 'video-flat': '📹', 'video-modal': '🎞️', 'video-wall': '🖼️' };
        const displayHotspots = (scene.hotspots || []).map((h, hi) => ({
          pitch: h.pitch, yaw: h.yaw, type: 'info',
          text: (hsIcons[h.type] || '•') + ' ' + (h.text || 'HS ' + (hi + 1)),
          cssClass: 'pnlm-hotspot-base pnlm-info',
        }));

        // Inicializar Pannellum
        requestAnimationFrame(() => {
          try {
            viewViewer = pannellum.viewer(pContainer, {
              type: 'equirectangular',
              panorama: scene.src,
              yaw: scene.yaw || 0,
              pitch: scene.pitch || 0,
              hfov: scene.hfov || 100,
              autoLoad: true,
              showControls: true,
              hotSpots: displayHotspots,
            });

            // Atualizar coordenadas em tempo real
            function updateCoords() {
              if (!viewViewer) return;
              try {
                const y = viewViewer.getYaw().toFixed(1);
                const p = viewViewer.getPitch().toFixed(1);
                const h = viewViewer.getHfov().toFixed(0);
                coordBar.textContent = `HFOV: ${h}°  ·  Yaw: ${y}°  ·  Pitch: ${p}°`;
              } catch(e) {}
              requestAnimationFrame(updateCoords);
            }
            requestAnimationFrame(updateCoords);

          } catch(e) { console.warn('Erro ao inicializar pannellum de visão:', e); }
        });

        // Footer
        const footer = document.createElement('div');
        footer.style.cssText = 'display:flex;gap:8px;border-top:1px solid #2a2a3e;padding-top:12px;';

        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = '← Voltar';
        cancelBtn.style.cssText = 'background:#2a2a3e;color:#ccc;border:none;border-radius:4px;padding:7px 14px;cursor:pointer;font-size:13px;margin-right:auto;';
        cancelBtn.onclick = () => {
          if (viewViewer) { try { viewViewer.destroy(); viewViewer = null; } catch {} }
          showSceneEditor();
        };

        const applyBtn = document.createElement('button');
        applyBtn.textContent = '✓ Salvar Visão Inicial';
        applyBtn.style.cssText = 'background:#22c55e;color:#fff;border:none;border-radius:4px;padding:7px 20px;cursor:pointer;font-size:13px;font-weight:700;';
        applyBtn.onclick = () => {
          if (viewViewer) {
            scene.hfov  = Math.round(viewViewer.getHfov());
            scene.yaw   = Math.round(viewViewer.getYaw() * 10) / 10;
            scene.pitch = Math.round(viewViewer.getPitch() * 10) / 10;
            try { viewViewer.destroy(); viewViewer = null; } catch {}
          }
          showSceneEditor();
        };

        footer.appendChild(cancelBtn); footer.appendChild(applyBtn);
        screenView.appendChild(footer);
      }

      // Abrir na tela de lista
      showList();
      editor.Modal.setContent(wrap);
      editor.Modal.open();

      // Limpar viewer ao fechar modal
      editor.on('modal:close', () => {
        currentHs = null;
        if (hotspotViewer) { try { hotspotViewer.destroy(); hotspotViewer = null; } catch {} }
        if (northViewer) { try { northViewer.destroy(); northViewer = null; } catch {} }
        if (viewViewer) { try { viewViewer.destroy(); viewViewer = null; } catch {} }
      });
    }

    // ── Bloco GrapesJS para Virtual Tour ─────────────────────────────────────
    editor.BlockManager.add('virtual-tour', {
      label: '🌐 Tour Virtual 360°',
      category: { label: 'Media', order: 1 },
      attributes: { title: 'Galeria de tour virtual 360° com Pannellum' },
      content: {
        type:       'virtual-tour',
        attributes: { 'data-gjs-type': 'virtual-tour', 'data-tour-id': tourUID() },
        style:      { width: '100%', 'box-sizing': 'border-box' }
      }
    });

    // ════════════════════════════════════════════════════════════════════════════
    // ── Photo Gallery Component ───────────────────────────────────────────────
    // ════════════════════════════════════════════════════════════════════════════

    // CSS injetado uma vez na página (fora do iframe) para o lightbox overlay
    (function injectLightboxCSS() {
      if (document.getElementById('gallery-lightbox-style')) return;
      const style = document.createElement('style');
      style.id = 'gallery-lightbox-style';
      style.textContent = `
        #gjs-lightbox-overlay {
          position: fixed; inset: 0; z-index: 99999;
          background: rgba(0,0,0,0.92);
          display: flex; align-items: center; justify-content: center;
          opacity: 0; pointer-events: none;
          transition: opacity 0.25s ease;
        }
        #gjs-lightbox-overlay.active {
          opacity: 1; pointer-events: all;
        }
        #gjs-lightbox-overlay img {
          max-width: 88vw; max-height: 85vh;
          object-fit: contain; border-radius: 6px;
          box-shadow: 0 8px 60px rgba(0,0,0,0.7);
          transition: opacity 0.2s ease;
          display: block;
        }
        #gjs-lightbox-overlay img.fading { opacity: 0; }
        .gjs-lb-btn {
          position: absolute; top: 50%; transform: translateY(-50%);
          background: rgba(255,255,255,0.12);
          border: none; color: #fff; font-size: 28px;
          width: 52px; height: 52px; border-radius: 50%;
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          transition: background 0.2s;
          user-select: none;
        }
        .gjs-lb-btn:hover { background: rgba(255,255,255,0.28); }
        #gjs-lb-prev { left: 18px; }
        #gjs-lb-next { right: 18px; }
        #gjs-lb-close {
          position: absolute; top: 14px; right: 18px;
          background: rgba(255,255,255,0.12);
          border: none; color: #fff; font-size: 20px;
          width: 40px; height: 40px; border-radius: 50%;
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          transition: background 0.2s;
        }
        #gjs-lb-close:hover { background: rgba(255,255,255,0.28); }
        #gjs-lb-counter {
          position: absolute; bottom: 18px; left: 50%; transform: translateX(-50%);
          color: rgba(255,255,255,0.6); font-size: 13px; font-family: sans-serif;
          letter-spacing: 1px;
        }
        #gjs-lb-caption {
          position: absolute; bottom: 42px; left: 50%; transform: translateX(-50%);
          color: rgba(255,255,255,0.85); font-size: 14px; font-family: sans-serif;
          max-width: 70vw; text-align: center; text-shadow: 0 1px 4px rgba(0,0,0,0.8);
        }
      `;
      document.head.appendChild(style);
    })();

    // Singleton lightbox element (lives outside the iframe, in the editor page)
    let lbImages = [];
    let lbIndex  = 0;

    function buildLightbox() {
      if (document.getElementById('gjs-lightbox-overlay')) return;
      const ov = document.createElement('div');
      ov.id = 'gjs-lightbox-overlay';
      ov.innerHTML = `
        <button class="gjs-lb-btn" id="gjs-lb-prev">&#8592;</button>
        <img id="gjs-lb-img" src="" alt="" />
        <button class="gjs-lb-btn" id="gjs-lb-next">&#8594;</button>
        <button id="gjs-lb-close">&#10005;</button>
        <div id="gjs-lb-caption"></div>
        <div id="gjs-lb-counter"></div>
      `;
      document.body.appendChild(ov);

      document.getElementById('gjs-lb-close').onclick = closeLightbox;
      document.getElementById('gjs-lb-prev').onclick  = () => navigateLb(-1);
      document.getElementById('gjs-lb-next').onclick  = () => navigateLb(+1);
      ov.addEventListener('click', e => { if (e.target === ov) closeLightbox(); });
      document.addEventListener('keydown', e => {
        const ov = document.getElementById('gjs-lightbox-overlay');
        if (!ov || !ov.classList.contains('active')) return;
        if (e.key === 'ArrowRight') navigateLb(+1);
        if (e.key === 'ArrowLeft')  navigateLb(-1);
        if (e.key === 'Escape')     closeLightbox();
      });
    }

    function openLightbox(images, index) {
      buildLightbox();
      lbImages = images;
      lbIndex  = index;
      renderLbSlide(false);
      document.getElementById('gjs-lightbox-overlay').classList.add('active');
    }

    function closeLightbox() {
      const ov = document.getElementById('gjs-lightbox-overlay');
      if (ov) ov.classList.remove('active');
    }

    function navigateLb(dir) {
      if (!lbImages.length) return;
      const img = document.getElementById('gjs-lb-img');
      img.classList.add('fading');
      setTimeout(() => {
        lbIndex = (lbIndex + dir + lbImages.length) % lbImages.length;
        renderLbSlide(true);
      }, 180);
    }

    function renderLbSlide(fromNav) {
      const img     = document.getElementById('gjs-lb-img');
      const caption = document.getElementById('gjs-lb-caption');
      const counter = document.getElementById('gjs-lb-counter');
      const prev    = document.getElementById('gjs-lb-prev');
      const next    = document.getElementById('gjs-lb-next');
      const item    = lbImages[lbIndex];

      img.src = item.src;
      img.alt = item.alt || '';
      caption.textContent = item.alt || '';
      counter.textContent = `${lbIndex + 1} / ${lbImages.length}`;

      // Hide nav buttons if only one image
      const showNav = lbImages.length > 1;
      prev.style.display = showNav ? '' : 'none';
      next.style.display = showNav ? '' : 'none';

      if (fromNav) {
        img.classList.remove('fading');
      }
    }

    // ── Gallery Component Type ────────────────────────────────────────────────
    // ══════════════════════════════════════════════════════════════════════════
    // ── GALERIA DE FOTOS ──────────────────────────────────────────────────────
    // Arquitetura: tipo GrapesJS real + ID único por galeria + modal próprio
    // ══════════════════════════════════════════════════════════════════════════

    function galleryUID() {
      return 'gal_' + Math.random().toString(36).slice(2, 9);
    }

    // ── Gera o HTML estático interno da galeria (renderizado dentro do iframe) ─
    function buildGalleryHTML(images, cols, gap, radius) {
      if (!images || !images.length) {
        return `<div data-gallery-empty="1" style="display:flex;flex-direction:column;
          align-items:center;justify-content:center;min-height:160px;
          border:2px dashed #aaa;border-radius:8px;color:#888;
          font-family:sans-serif;font-size:14px;padding:24px;text-align:center;">
          <div style="font-size:36px;margin-bottom:10px;">🖼️</div>
          <div style="font-weight:600;color:#999;">Galeria vazia</div>
          <div style="font-size:12px;margin-top:6px;color:#999;">
            Use o botão <strong style="color:#aaa">🖼️ Galeria</strong> na barra superior
          </div>
        </div>`;
      }
      const items = images.map((img, i) => {
        const title = img.title || '';
        const titleOverlay = title ? `
          <div style="
            position:absolute;bottom:0;left:0;right:0;
            background:linear-gradient(transparent,rgba(0,0,0,0.72));
            padding:18px 10px 8px;
            font-family:sans-serif;font-size:13px;font-weight:600;
            color:#fff;text-shadow:0 1px 3px rgba(0,0,0,0.8);
            white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
            pointer-events:none;border-radius:0 0 ${radius} ${radius};
          ">${title}</div>` : '';
        return `
        <div data-lb-index="${i}" style="position:relative;cursor:pointer;overflow:hidden;
          border-radius:${radius};aspect-ratio:1/1;
          transition:transform 0.2s,box-shadow 0.2s;"
          onmouseover="this.style.transform='scale(1.03)';this.style.boxShadow='0 4px 20px rgba(0,0,0,.35)'"
          onmouseout="this.style.transform='';this.style.boxShadow=''">
          <img src="${img.src}" alt="${img.alt||title||''}"
            style="width:100%;height:100%;object-fit:cover;display:block;pointer-events:none;"/>
          ${titleOverlay}
        </div>`;
      }).join('');
      return `<div style="display:grid;grid-template-columns:repeat(${cols},1fr);gap:${gap};padding:4px;">${items}</div>`;
    }

    // ── Tipo GrapesJS para galeria ────────────────────────────────────────────
    editor.DomComponents.addType('photo-gallery', {

      isComponent(el) {
        if (!el || !el.getAttribute) return false;
        return el.getAttribute('data-gjs-type') === 'photo-gallery';
      },

      model: {
        defaults: {
          name: 'Galeria de Fotos',
          droppable: false,
          copyable: true,
          'gallery-images':  [],
          'gallery-columns': '3',
          'gallery-gap':     '8px',
          'gallery-radius':  '6px',
          'gallery-name':    'Galeria',
          tagName: 'div',
          attributes: { 'data-gjs-type': 'photo-gallery' },
          toolbar: [
            {
              label: '🖼️ Imagens',
              command: 'gallery:edit',
              attributes: { title: 'Gerenciar imagens desta galeria', style: 'padding:0 8px;background:#0ea5e9;color:#fff;border-radius:3px;cursor:pointer;' }
            },
            { label: '<svg viewBox="0 0 24 24" width="12"><path fill="currentColor" d="M10 9h4V6h3l-5-5-5 5h3v3zm-1 1H6V7l-5 5 5 5v-3h3v-4zm14 2l-5-5v3h-3v4h3v3l5-5zm-9 3h-4v3H7l5 5 5-5h-3v-3z"/></svg>', command: 'tlb-move',   attributes: { title: 'Mover' } },
            { label: '<svg viewBox="0 0 24 24" width="12"><path fill="currentColor" d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>', command: 'tlb-clone',  attributes: { title: 'Duplicar' } },
            { label: '<svg viewBox="0 0 24 24" width="12"><path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>', command: 'tlb-delete', attributes: { title: 'Excluir galeria', style: 'color:#e74c3c' } },
          ]
        },

        init() {
          this.listenTo(this, 'change:gallery-images change:gallery-columns change:gallery-gap change:gallery-radius', this._render);
        },

        _render() {
          const imgs   = this.get('gallery-images')  || [];
          const cols   = this.get('gallery-columns') || '3';
          const gap    = this.get('gallery-gap')     || '8px';
          const radius = this.get('gallery-radius')  || '6px';
          const gname  = this.get('gallery-name')    || 'Galeria';

          // Sincronizar atributos silenciosamente (sem trigger de eventos)
          // usando set direto nos attributes para não causar loop
          const currentAttrs = this.get('attributes') || {};
          this.set('attributes', {
            ...currentAttrs,
            'data-gjs-type': 'photo-gallery',
            'data-images':   encodeURIComponent(JSON.stringify(imgs)),
            'data-columns':  cols,
            'data-gap':      gap,
            'data-radius':   radius,
            'data-gname':    gname,
          }, { silent: true });

          this.components(buildGalleryHTML(imgs, cols, gap, radius));
        },

        // Sobrescreve a serialização HTML: salva apenas o <div> com atributos,
        // sem conteúdo interno (o preview do editor não deve ir para o pages.json)
        toHTML() {
          // Serializa apenas o <div> com atributos data-* — sem conteúdo interno.
          // data-images contém JSON URL-encoded, não precisa escapar aspas internas.
          const attrs = this.getAttributes();
          const attrStr = Object.entries(attrs).map(([k, v]) => {
            // Atributos que já são URL-encoded ou não contêm aspas: serializar direto
            const safe = String(v).replace(/"/g, '&quot;');
            return `${k}="${safe}"`;
          }).join(' ');
          return `<div ${attrStr}></div>`;
        }
      },

      view: {
        events() { return {}; }
      }
    });

    // ── Restaurar dados das galerias — feito no component:add (antes da view montar) ──
    editor.on('component:add', comp => {
      if (comp.get('type') !== 'photo-gallery') return;
      const attrs = comp.getAttributes();
      // Restaurar dados dos atributos serializados (silent: não dispara change ainda)
      if (attrs['data-images'] && !comp.get('gallery-images')?.length) {
        try {
          let imgs;
          try { imgs = JSON.parse(decodeURIComponent(attrs['data-images'])); }
          catch(e) { imgs = JSON.parse(attrs['data-images']); }
          // silent: true — evita _render prematuro antes da view estar pronta
          comp.set('gallery-images', imgs, { silent: true });
        } catch(e) { console.warn('[Gallery] Erro ao restaurar imagens:', e); }
      }
      if (attrs['data-columns']) comp.set('gallery-columns', attrs['data-columns'], { silent: true });
      if (attrs['data-gap'])     comp.set('gallery-gap',     attrs['data-gap'],     { silent: true });
      if (attrs['data-radius'])  comp.set('gallery-radius',  attrs['data-radius'],  { silent: true });
      if (attrs['data-gname'])   comp.set('gallery-name',    attrs['data-gname'],   { silent: true });
      if (!attrs['data-gallery-id']) {
        comp.addAttributes({ 'data-gallery-id': galleryUID() });
      }
    });

    // ── Renderizar após a view estar montada no DOM (component:mount) ─────────
    editor.on('component:mount', comp => {
      if (comp.get('type') !== 'photo-gallery') return;
      // Agora a view está no DOM — _render via components() vai funcionar
      comp._render && comp._render();
    });

    // ── Comando: editar galeria selecionada ───────────────────────────────────
    editor.Commands.add('gallery:edit', {
      run(ed) {
        const comp = ed.getSelected();
        if (!comp || comp.get('type') !== 'photo-gallery') return;
        openGalleryModal(comp);
      }
    });

    // ── Comando principal: abre seletor ou direto se 1 galeria ───────────────
    editor.Commands.add('gallery:manage', {
      run(ed, sender) {
        if (sender && typeof sender.set === 'function') sender.set('active', 0);
        const galleries = [];
        ed.getWrapper().onAll(c => { if (c.get('type') === 'photo-gallery') galleries.push(c); });

        if (!galleries.length) {
          alert('Nenhuma galeria na página.\nArraste o bloco "🖼️ Galeria de Fotos" para o canvas primeiro.');
          return;
        }
        if (galleries.length === 1) { openGalleryModal(galleries[0]); return; }

        // Seletor de galerias
        const wrap = document.createElement('div');
        wrap.style.cssText = 'padding:16px;font-family:sans-serif;color:#ccc;min-width:400px;';

        function renderSelector() {
          wrap.innerHTML = `<p style="margin:0 0 12px;font-size:13px;color:#aaa;">
            <strong style="color:#fff">${galleries.length} galerias</strong> nesta página:
          </p>`;

          galleries.forEach((comp, idx) => {
            const name  = comp.get('gallery-name') || `Galeria ${idx+1}`;
            const imgs  = comp.get('gallery-images') || [];
            const thumb = imgs[0]?.src || null;
            const gid   = comp.getAttributes()['data-gallery-id'] || '';

            const row = document.createElement('div');
            row.style.cssText = 'display:flex;align-items:center;gap:10px;background:#1a1a2e;border:1px solid #333;border-radius:8px;padding:8px 12px;margin-bottom:8px;transition:border-color .2s;';

            // Thumbnail
            const thumbEl = document.createElement('div');
            thumbEl.style.cssText = 'width:48px;height:48px;flex-shrink:0;border-radius:4px;overflow:hidden;background:#111;display:flex;align-items:center;justify-content:center;font-size:22px;';
            if (thumb) {
              thumbEl.innerHTML = `<img src="${thumb}" style="width:100%;height:100%;object-fit:cover;">`;
            } else {
              thumbEl.textContent = '🖼️';
            }

            // Info
            const info = document.createElement('div');
            info.style.cssText = 'flex:1;min-width:0;cursor:pointer;';
            info.innerHTML = `
              <div style="font-weight:700;color:#fff;font-size:14px;">${name}</div>
              <div style="font-size:11px;color:#999;margin-top:2px;">${imgs.length} imagem${imgs.length!==1?'s':''} &nbsp;·&nbsp; <code style="font-size:10px;">${gid}</code></div>`;
            info.onclick = () => { ed.Modal.close(); setTimeout(() => openGalleryModal(comp), 120); };

            // Seta editar
            const editArrow = document.createElement('span');
            editArrow.textContent = '›';
            editArrow.style.cssText = 'color:#3b82f6;font-size:22px;cursor:pointer;flex-shrink:0;';
            editArrow.title = 'Editar galeria';
            editArrow.onclick = () => { ed.Modal.close(); setTimeout(() => openGalleryModal(comp), 120); };

            // Botão excluir
            const delBtn = document.createElement('button');
            delBtn.textContent = '🗑';
            delBtn.title = `Excluir "${name}" do canvas`;
            delBtn.style.cssText = 'background:#7f1d1d;color:#fca5a5;border:none;border-radius:4px;width:32px;height:32px;cursor:pointer;font-size:14px;flex-shrink:0;';
            delBtn.onclick = (e) => {
              e.stopPropagation();
              if (!confirm(`Excluir a galeria "${name}" da página?\n\nEsta ação não pode ser desfeita.`)) return;
              comp.remove();
              galleries.splice(idx, 1);
              if (!galleries.length) {
                ed.Modal.close();
              } else {
                renderSelector();
              }
            };

            row.onmouseover = () => row.style.borderColor = '#3b82f6';
            row.onmouseout  = () => row.style.borderColor = '#333';
            row.appendChild(thumbEl);
            row.appendChild(info);
            row.appendChild(editArrow);
            row.appendChild(delBtn);
            wrap.appendChild(row);
          });
        }

        renderSelector();
        ed.Modal.setTitle('Gerenciar Galerias da Página');
        ed.Modal.setContent(wrap);
        ed.Modal.open();
      }
    });

    // ── Modal de gerenciamento de galeria ─────────────────────────────────────
    function openGalleryModal(comp) {
      let images  = JSON.parse(JSON.stringify(comp.get('gallery-images') || []));
      let cols    = comp.get('gallery-columns') || '3';
      let gap     = comp.get('gallery-gap')     || '8px';
      let radius  = comp.get('gallery-radius')  || '6px';
      let gname   = comp.get('gallery-name')    || 'Galeria';

      // Container principal do modal
      const wrap = document.createElement('div');
      wrap.style.cssText = 'font-family:sans-serif;color:#ccc;width:720px;max-width:92vw;box-sizing:border-box;';

      // ── Tela 1: gerenciador de galeria ────────────────────────────────────
      const screenGallery = document.createElement('div');
      screenGallery.style.cssText = 'padding:14px;';

      // ── Tela 2: seletor de imagem (fica oculto até ser chamado) ────────────
      const screenPicker = document.createElement('div');
      screenPicker.style.cssText = 'padding:14px;display:none;';

      wrap.appendChild(screenGallery);
      wrap.appendChild(screenPicker);

      // Índice da imagem sendo trocada (-1 = nova imagem)
      let pickingIndex = -1;

      // ── Abrir tela do picker ──────────────────────────────────────────────
      function showPicker(idx) {
        pickingIndex = idx;
        screenGallery.style.display = 'none';
        screenPicker.style.display  = 'block';
        editor.Modal.setTitle(idx === -1 ? 'Adicionar Imagem' : 'Trocar Imagem');
        /* Ajustar largura do dialog ao picker */
        (function() {
          var dlg = document.querySelector('.gjs-mdl-dialog');
          if (dlg) { dlg.style.width = '740px'; dlg.style.maxWidth = '94vw'; }
        })();
        renderPicker();
      }

      // ── Voltar para tela da galeria ───────────────────────────────────────
      function showGallery() {
        screenPicker.style.display  = 'none';
        screenGallery.style.display = 'block';
        editor.Modal.setTitle(`🖼️ Galeria — ${gname}`);
        renderGallery();
      }

      // ── Quando uma imagem é escolhida no picker ───────────────────────────
      function onImagePicked(src) {
        if (pickingIndex === -1) {
          images.push({ src, alt: '' });
        } else {
          images[pickingIndex].src = src;
        }
        showGallery();
      }

      // ── Renderizar tela do picker ─────────────────────────────────────────
      function renderPicker() {
        screenPicker.innerHTML = '';

        // Assets existentes
        const allAssets = editor.AssetManager.getAll();

        const grid = document.createElement('div');
        grid.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;max-height:200px;overflow-y:auto;background:#111;border-radius:6px;padding:8px;margin-bottom:12px;min-height:56px;';

        if (allAssets.length) {
          allAssets.forEach(asset => {
            const src = asset.get('src');
            const img = document.createElement('img');
            img.src = src;
            img.style.cssText = 'width:68px;height:68px;object-fit:cover;border-radius:4px;cursor:pointer;border:2px solid transparent;transition:border-color .15s,transform .15s;';
            img.title = src;
            img.onmouseover = () => { img.style.borderColor='#3b82f6'; img.style.transform='scale(1.05)'; };
            img.onmouseout  = () => { img.style.borderColor='transparent'; img.style.transform=''; };
            img.onclick = () => onImagePicked(src);
            grid.appendChild(img);
          });
        } else {
          grid.innerHTML = '<p style="color:#999;font-size:12px;padding:8px;margin:0;">Nenhuma imagem ainda. Faça upload abaixo.</p>';
        }
        screenPicker.appendChild(grid);

        // URL manual
        const urlRow = document.createElement('div');
        urlRow.style.cssText = 'display:flex;gap:8px;margin-bottom:10px;';
        const urlInput = document.createElement('input');
        urlInput.type = 'text'; urlInput.placeholder = 'Cole uma URL de imagem...';
        urlInput.style.cssText = 'flex:1;background:#1a1a2e;color:#fff;border:1px solid #444;border-radius:3px;padding:6px 10px;font-size:13px;';
        const urlBtn = document.createElement('button');
        urlBtn.textContent = 'Usar URL';
        urlBtn.style.cssText = 'background:#3b82f6;color:#fff;border:none;border-radius:3px;padding:6px 14px;cursor:pointer;font-size:13px;flex-shrink:0;';
        urlBtn.onclick = () => { const u = urlInput.value.trim(); if(u) onImagePicked(u); };
        urlInput.onkeydown = e => { if(e.key==='Enter') urlBtn.onclick(); };
        urlRow.appendChild(urlInput); urlRow.appendChild(urlBtn);
        screenPicker.appendChild(urlRow);

        // Upload
        const uploadRow = document.createElement('div');
        uploadRow.style.cssText = 'display:flex;gap:8px;align-items:center;';

        const uploadStatus = document.createElement('span');
        uploadStatus.style.cssText = 'font-size:12px;color:#888;flex:1;';

        const uploadLabel = document.createElement('label');
        uploadLabel.style.cssText = 'background:#6366f1;color:#fff;border-radius:3px;padding:7px 16px;cursor:pointer;font-size:13px;flex-shrink:0;display:inline-block;';
        uploadLabel.textContent = '📤 Fazer Upload';
        const uploadInput = document.createElement('input');
        uploadInput.type='file'; uploadInput.accept='image/*'; uploadInput.multiple=true;
        uploadInput.style.display='none';
        uploadLabel.appendChild(uploadInput);

        uploadInput.onchange = async (e) => {
          const files = Array.from(e.target.files);
          if (!files.length) return;
          uploadStatus.textContent = '⏳ Enviando...';
          uploadLabel.style.opacity = '0.6';
          uploadLabel.style.pointerEvents = 'none';

          for (const file of files) {
            const fd = new FormData();
            fd.append('files[]', file);
            try {
              const res  = await fetch('/api/assets/upload', { method:'POST', body:fd });
              const data = await res.json();
              const src  = data.data?.[0]?.src || data[0]?.src;
              if (src) {
                editor.AssetManager.add({ src, name: file.name });
                uploadStatus.textContent = `✓ ${file.name}`;
                onImagePicked(src);
                return; // volta para galeria automaticamente
              } else {
                uploadStatus.textContent = '✗ Erro: resposta inválida';
              }
            } catch(err) {
              console.error('Upload error:', err);
              uploadStatus.textContent = '✗ Erro no upload: ' + err.message;
            }
          }
          uploadLabel.style.opacity = '';
          uploadLabel.style.pointerEvents = '';
        };

        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = '← Voltar';
        cancelBtn.style.cssText = 'background:#2a2a3e;color:#ccc;border:none;border-radius:3px;padding:7px 14px;cursor:pointer;font-size:13px;flex-shrink:0;';
        cancelBtn.onclick = showGallery;

        uploadRow.appendChild(uploadLabel);
        uploadRow.appendChild(uploadStatus);
        uploadRow.appendChild(cancelBtn);
        screenPicker.appendChild(uploadRow);
      }

      // ── Renderizar tela da galeria ────────────────────────────────────────
      function renderGallery() {
        screenGallery.innerHTML = '';

        // Cabeçalho: nome + contador + botão adicionar
        const header = document.createElement('div');
        header.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:10px;';

        const nameInput = document.createElement('input');
        nameInput.type='text'; nameInput.value=gname;
        nameInput.style.cssText = 'flex:1;background:#1a1a2e;color:#fff;border:1px solid #444;border-radius:4px;padding:5px 10px;font-size:14px;font-weight:700;';
        nameInput.oninput = () => { gname = nameInput.value; };

        const badge = document.createElement('span');
        badge.textContent = `${images.length} img${images.length!==1?'s':''}`;
        badge.style.cssText = 'font-size:11px;color:#999;flex-shrink:0;';

        const addBtn = document.createElement('button');
        addBtn.textContent = '+ Adicionar';
        addBtn.style.cssText = 'background:#3b82f6;color:#fff;border:none;border-radius:4px;padding:6px 14px;cursor:pointer;font-size:13px;flex-shrink:0;';
        addBtn.onclick = () => showPicker(-1);

        header.appendChild(nameInput); header.appendChild(badge); header.appendChild(addBtn);
        screenGallery.appendChild(header);

        // Configurações visuais
        const cfg = document.createElement('div');
        cfg.style.cssText = 'display:flex;gap:8px;margin-bottom:10px;background:#111;border-radius:6px;padding:8px;';

        function mkSel(label, options, current, onChange) {
          const box = document.createElement('div');
          box.style.cssText = 'display:flex;flex-direction:column;gap:2px;flex:1;';
          const lbl = document.createElement('label');
          lbl.textContent = label;
          lbl.style.cssText = 'font-size:10px;color:#bbb;text-transform:uppercase;letter-spacing:.5px;';
          const sel = document.createElement('select');
          sel.style.cssText = 'background:#1a1a2e;color:#ccc;border:1px solid #333;border-radius:3px;padding:3px 6px;font-size:12px;';
          options.forEach(([v,t]) => {
            const o = document.createElement('option');
            o.value=v; o.textContent=t; if(v===current) o.selected=true;
            sel.appendChild(o);
          });
          sel.onchange = () => onChange(sel.value);
          box.appendChild(lbl); box.appendChild(sel); return box;
        }

        cfg.appendChild(mkSel('Colunas',  [['2','2'],['3','3'],['4','4'],['5','5']], cols, v => { cols=v; }));
        cfg.appendChild(mkSel('Espaço',   [['4px','Mínimo'],['8px','Pequeno'],['12px','Médio'],['20px','Grande']], gap, v => { gap=v; }));
        cfg.appendChild(mkSel('Bordas',   [['0px','Reto'],['6px','Suave'],['12px','Arredondado'],['50%','Círculo']], radius, v => { radius=v; }));
        screenGallery.appendChild(cfg);

        // Lista de imagens
        const list = document.createElement('div');
        list.style.cssText = 'max-height:260px;overflow-y:auto;display:flex;flex-direction:column;gap:6px;margin-bottom:12px;';

        if (!images.length) {
          list.innerHTML = '<div style="text-align:center;padding:28px;color:#999;font-size:13px;">Sem imagens. Clique em <strong style="color:#888">+ Adicionar</strong>.</div>';
        }

        images.forEach((img, i) => {
          const row = document.createElement('div');
          row.style.cssText = 'display:flex;align-items:flex-start;gap:8px;background:#1a1a2e;border-radius:6px;padding:8px;';

          const num = document.createElement('span');
          num.textContent = i+1;
          num.style.cssText = 'color:#888;font-size:11px;width:14px;text-align:right;flex-shrink:0;padding-top:4px;';

          const thumb = document.createElement('img');
          thumb.src = img.src;
          thumb.style.cssText = 'width:56px;height:56px;object-fit:cover;border-radius:4px;flex-shrink:0;cursor:pointer;border:2px solid #333;transition:border-color .15s;';
          thumb.title = 'Clique para trocar';
          thumb.onmouseover = () => thumb.style.borderColor='#3b82f6';
          thumb.onmouseout  = () => thumb.style.borderColor='#333';
          thumb.onclick = () => showPicker(i);

          // Coluna de campos de texto
          const fields = document.createElement('div');
          fields.style.cssText = 'flex:1;display:flex;flex-direction:column;gap:4px;min-width:0;';

          function mkLbl(txt) {
            const l = document.createElement('label');
            l.textContent = txt;
            l.style.cssText = 'font-size:10px;color:#bbb;text-transform:uppercase;letter-spacing:.5px;margin-bottom:1px;display:block;';
            return l;
          }

          const titleIn = document.createElement('input');
          titleIn.type='text'; titleIn.value=img.title||''; titleIn.placeholder='Ex: Sala de Estar';
          titleIn.style.cssText='width:100%;background:#0d0d1a;color:#fff;border:1px solid #2a2a3e;border-radius:3px;padding:4px 8px;font-size:13px;font-weight:600;box-sizing:border-box;';
          titleIn.oninput = () => images[i].title = titleIn.value;

          const descIn = document.createElement('textarea');
          descIn.value=img.desc||''; descIn.placeholder='Descrição (opcional)';
          descIn.rows=2;
          descIn.style.cssText='width:100%;background:#0d0d1a;color:#ccc;border:1px solid #2a2a3e;border-radius:3px;padding:4px 8px;font-size:12px;resize:vertical;box-sizing:border-box;font-family:inherit;';
          descIn.oninput = () => images[i].desc = descIn.value;

          const altIn = document.createElement('input');
          altIn.type='text'; altIn.value=img.alt||''; altIn.placeholder='Descrição para leitores de tela';
          altIn.style.cssText='width:100%;background:#0d0d1a;color:#ccc;border:1px solid #1a1a2e;border-radius:3px;padding:3px 8px;font-size:11px;box-sizing:border-box;';
          altIn.oninput = () => images[i].alt = altIn.value;

          fields.appendChild(mkLbl('Título'));   fields.appendChild(titleIn);
          fields.appendChild(mkLbl('Descrição')); fields.appendChild(descIn);
          fields.appendChild(mkLbl('Alt Text')); fields.appendChild(altIn);

          // Coluna de botões
          const btns = document.createElement('div');
          btns.style.cssText = 'display:flex;flex-direction:column;gap:3px;flex-shrink:0;';

          const up = document.createElement('button'); up.textContent='↑';
          up.style.cssText='background:#2a2a3e;color:#fff;border:none;border-radius:3px;width:24px;height:24px;cursor:pointer;';
          up.disabled = i===0;
          up.onclick = () => { if(i>0){[images[i-1],images[i]]=[images[i],images[i-1]]; renderGallery();} };

          const dn = document.createElement('button'); dn.textContent='↓';
          dn.style.cssText='background:#2a2a3e;color:#fff;border:none;border-radius:3px;width:24px;height:24px;cursor:pointer;';
          dn.disabled = i===images.length-1;
          dn.onclick = () => { if(i<images.length-1){[images[i],images[i+1]]=[images[i+1],images[i]]; renderGallery();} };

          const del = document.createElement('button'); del.textContent='🗑';
          del.style.cssText='background:#7f1d1d;color:#fca5a5;border:none;border-radius:3px;width:24px;height:24px;cursor:pointer;font-size:12px;margin-top:4px;';
          del.onclick = () => { images.splice(i,1); renderGallery(); };

          btns.appendChild(up); btns.appendChild(dn); btns.appendChild(del);

          row.appendChild(num); row.appendChild(thumb); row.appendChild(fields); row.appendChild(btns);
          list.appendChild(row);
        });
        screenGallery.appendChild(list);

        // Footer
        const footer = document.createElement('div');
        footer.style.cssText='display:flex;gap:8px;align-items:center;border-top:1px solid #2a2a3e;padding-top:12px;';

        // Botão excluir (lado esquerdo)
        const delGalleryBtn = document.createElement('button');
        delGalleryBtn.textContent = '🗑 Excluir Galeria';
        delGalleryBtn.title = 'Remove esta galeria do canvas';
        delGalleryBtn.style.cssText = 'background:#7f1d1d;color:#fca5a5;border:none;border-radius:4px;padding:7px 14px;cursor:pointer;font-size:13px;margin-right:auto;';
        delGalleryBtn.onclick = () => {
          if (!confirm(`Excluir a galeria "${gname}" da página?\n\nEsta ação não pode ser desfeita.`)) return;
          comp.remove();
          var _dlg = document.querySelector('.gjs-mdl-dialog');
          if (_dlg) { _dlg.style.width = ''; _dlg.style.maxWidth = ''; }
          editor.Modal.close();
        };

        const cancelBtn = document.createElement('button');
        cancelBtn.textContent='Cancelar';
        cancelBtn.style.cssText='background:#2a2a3e;color:#ccc;border:none;border-radius:4px;padding:7px 18px;cursor:pointer;font-size:13px;';
        cancelBtn.onclick = () => {
          var _dlg = document.querySelector('.gjs-mdl-dialog');
          if (_dlg) { _dlg.style.width = ''; _dlg.style.maxWidth = ''; }
          editor.Modal.close();
        };

        const applyBtn = document.createElement('button');
        applyBtn.textContent='✓ Aplicar';
        applyBtn.style.cssText='background:#22c55e;color:#fff;border:none;border-radius:4px;padding:7px 20px;cursor:pointer;font-size:13px;font-weight:700;';
        applyBtn.onclick = () => {
          comp.set('gallery-images',  JSON.parse(JSON.stringify(images)));
          comp.set('gallery-columns', cols);
          comp.set('gallery-gap',     gap);
          comp.set('gallery-radius',  radius);
          comp.set('gallery-name',    gname);
          var _dlg = document.querySelector('.gjs-mdl-dialog');
          if (_dlg) { _dlg.style.width = ''; _dlg.style.maxWidth = ''; }
          editor.Modal.close();
        };

        footer.appendChild(delGalleryBtn);
        footer.appendChild(cancelBtn);
        footer.appendChild(applyBtn);
        screenGallery.appendChild(footer);
      }

      // Abrir na tela da galeria
      renderGallery();
      editor.Modal.setTitle(`🖼️ Galeria — ${gname}`);
      editor.Modal.setContent(wrap);
      editor.Modal.open();
      /* Ajustar largura do dialog ao conteúdo da galeria */
      (function() {
        var dlg = document.querySelector('.gjs-mdl-dialog');
        if (dlg) { dlg.style.width = '740px'; dlg.style.maxWidth = '94vw'; }
      })();
    }

    // ── Block ─────────────────────────────────────────────────────────────────
    editor.BlockManager.add('photo-gallery', {
      label: '🖼️ Galeria de Fotos',
      category: { label: 'Media', order: 1 },
      attributes: { title: 'Galeria com lightbox e navegação' },
      content: {
        type:       'photo-gallery',
        attributes: { 'data-gjs-type': 'photo-gallery', 'data-gallery-id': galleryUID() },
        style:      { width: '100%', 'box-sizing': 'border-box' }
      }
    });

    // ──────────────────────────────────────────────────────────────────────────
    // ── Helper to lock components ──────────────────────────────────────────────
    function lockComponent(comp) {
      comp.set({
        hoverable: false,
        selectable: false,
        droppable: false,
        editable: false,
        copyable: false,
        draggable: false,
        layerable: false
      });
      comp.get('components').each(child => lockComponent(child));
    }

    // ── Shared Component Type ────────────────────────────────────────────────
    editor.DomComponents.addType('shared-component', {
      model: {
        defaults: {
          name: 'Componente Vinculado',
          droppable: false,
          editable: false,
          traits: [
            { type: 'text', name: 'data-component-id', label: 'ID', attributes: { readonly: true } }
          ]
        },
        init() {
          this.on('change:attributes:data-component-id', this.updateContent);
          this.updateContent();
        },
        updateContent() {
          const compId = this.getAttributes()['data-component-id'];
          if (compId && savedComponents[compId]) {
            const css = savedComponents[compId].css || '';
            const html = savedComponents[compId].html || '';
            this.components(`<style>${css}</style>${html}`);
            this.get('components').each(child => lockComponent(child));
          }
        }
      }
    });

    // ── API helpers ──────────────────────────────────────────────────────────
    async function loadPage(slug) {
      try {
        const res = await fetch(`/api/load?slug=${encodeURIComponent(slug)}`);
        const data = await res.json();

        // Update available pages list
        if (data.availablePages) availablePages = data.availablePages;

        // Load content into editor
        if (data.projectData && data.projectData.pages && data.projectData.pages.length > 0) {
          editor.loadProjectData(data.projectData);
        } else if (data.html) {
          editor.setComponents(data.html);
          editor.setStyle(data.css || '');
        } else {
          // Brand-new empty page
          editor.setComponents('<div class="p-8 text-center"><h1 class="text-3xl font-bold mb-4">Start Building</h1><p class="text-gray-600">Drag and drop elements here.</p></div>');
          editor.setStyle('');
        }
      } catch(e) {
        console.error('Load error:', e);
      }
    }

    async function savePage() {
      try {
        // ── Sincronizar dados dos tours virtuais nos atributos HTML antes de salvar ──
        editor.getWrapper().onAll(comp => {
          if (comp.get('type') !== 'virtual-tour') return;
          const scenes = comp.get('tour-scenes') || [];
          const currentAttrs = comp.get('attributes') || {};
          comp.set('attributes', {
            ...currentAttrs,
            'data-gjs-type':   'virtual-tour',
            'data-tour':        btoa(unescape(encodeURIComponent(JSON.stringify({ scenes })))),
            'data-tour-enc':   'base64',
            'data-height':      comp.get('tour-height')      || '56.25vw',
            'data-show-thumbs': comp.get('tour-show-thumbs') !== false ? 'true' : 'false',
            'data-tname':       comp.get('tour-name')        || 'Tour Virtual',
          }, { silent: true });
        });

        // ── Sincronizar dados das galerias nos atributos HTML antes de salvar ──
        editor.getWrapper().onAll(comp => {
          if (comp.get('type') !== 'photo-gallery') return;
          const imgs = comp.get('gallery-images') || [];
          const currentAttrs = comp.get('attributes') || {};
          comp.set('attributes', {
            ...currentAttrs,
            'data-gjs-type': 'photo-gallery',
            'data-images':   encodeURIComponent(JSON.stringify(imgs)),
            'data-columns':  comp.get('gallery-columns') || '3',
            'data-gap':      comp.get('gallery-gap')     || '8px',
            'data-radius':   comp.get('gallery-radius')  || '6px',
            'data-gname':    comp.get('gallery-name')    || 'Galeria',
          }, { silent: true });
        });

        const payload = {
          slug: currentSlug,
          html: editor.getHtml(),
          css: editor.getCss(),
          projectData: editor.getProjectData()
        };
        const res = await fetch('/api/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          alert(`Página "${currentSlug}" salva com sucesso!`);
        } else {
          alert('Erro ao salvar! Verifique o console.');
          console.error('Save error:', await res.text());
        }
      } catch(e) {
        console.error('Save error:', e);
        alert('Erro de rede ao salvar.');
      }
    }

    async function deletePage(slug) {
      try {
        await fetch('/api/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug })
        });
        availablePages = availablePages.filter(p => p !== slug);
        currentSlug = 'index';
        await loadPage('index');
        updateUI();
      } catch(e) {
        console.error('Delete error:', e);
      }
    }

    // ── UI update ─────────────────────────────────────────────────────────────
    function updateUI() {
      // Datalist for link traits
      const datalist = document.getElementById('page-list');
      if (datalist) {
        datalist.innerHTML = availablePages
          .map(p => `<option value="${p === 'index' ? '/' : '/' + p}">`)
          .join('');
      }

      // Dropdown
      const select = document.getElementById('page-selector');
      if (select) {
        select.innerHTML = availablePages
          .map(p => `<option value="${p}"${p === currentSlug ? ' selected' : ''}>${p}</option>`)
          .join('');
      }

      // Trash button – visible only when NOT on index
      const delBtn = document.getElementById('del-page-btn');
      if (delBtn) {
        if (currentSlug === 'index') {
          delBtn.style.setProperty('display', 'none', 'important');
        } else {
          delBtn.style.setProperty('display', 'inline-block', 'important');
        }
      }
    }

    // ── Editor de Código editável (sobrescreve o readonly padrão) ─────────────
    editor.Commands.add('core:open-code', {
      run(ed) {
        const modal = ed.Modal;
        const wrap = document.createElement('div');
        wrap.style.cssText = 'display:flex;gap:0;width:860px;max-width:96vw;height:72vh;box-sizing:border-box;';

        // ── Painel HTML ───────────────────────────────────────────────────────
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

        // ── Painel CSS ────────────────────────────────────────────────────────
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

        // ── Footer ────────────────────────────────────────────────────────────
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

    // ── Toolbar buttons ───────────────────────────────────────────────────────

    // Button: Gerenciar Galeria

    // ── Botão Build ──────────────────────────────────────────────────────────
    editor.Panels.addButton('options', [{
      id:        'build-site',
      label:     `<svg viewBox="0 0 24 24" width="17" height="17" fill="#FBBF24" style="vertical-align:middle;">
                    <path d="M13 2L4.09 12.97A1 1 0 0 0 5 14.5h5.5L11 22l8.91-10.97A1 1 0 0 0 19 9.5h-5.5L13 2z"/>
                  </svg>`,
      className: 'gjs-pn-btn cms-build-btn',
      attributes: { title: 'Build — Gerar site estático (npm run build)' },
      command:   { run: (ed, sender) => { sender && sender.set('active', 0); runBuild(); } }
    }]);

    // ── Botão Export ─────────────────────────────────────────────────────────
    editor.Panels.addButton('options', [{
      id:        'cms-export',
      label:     `<svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" style="vertical-align:middle;">
                    <path d="M12 2a1 1 0 0 1 .707.293l4 4a1 1 0 0 1-1.414 1.414L13 5.414V15a1 1 0 0 1-2 0V5.414L8.707 7.707A1 1 0 0 1 7.293 6.293l4-4A1 1 0 0 1 12 2zM4 17a1 1 0 0 1 1 1v1h14v-1a1 1 0 1 1 2 0v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1a1 1 0 0 1 1-1z"/>
                  </svg>`,
      className: 'gjs-pn-btn cms-export-btn',
      attributes: { title: 'Exportar projeto (ZIP)' },
      command: { run: (ed, sender) => {
        sender && sender.set('active', 0);
        cmsExportProject();
      }}
    }]);

    // ── Botão Import ─────────────────────────────────────────────────────────
    editor.Panels.addButton('options', [{
      id:        'cms-import',
      label:     `<svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" style="vertical-align:middle;">
                    <path d="M12 15a1 1 0 0 1-.707-.293l-4-4a1 1 0 0 1 1.414-1.414L11 11.586V2a1 1 0 0 1 2 0v9.586l2.293-2.293a1 1 0 0 1 1.414 1.414l-4 4A1 1 0 0 1 12 15zm-7 2a1 1 0 0 0-1 1v1a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-1a1 1 0 1 0-2 0v1H5v-1a1 1 0 0 0-1-1z"/>
                  </svg>`,
      className: 'gjs-pn-btn cms-import-btn',
      attributes: { title: 'Importar projeto (ZIP)' },
      command: { run: (ed, sender) => {
        sender && sender.set('active', 0);
        cmsImportProject();
      }}
    }]);

    editor.Panels.addButton('options', [{
      id:        'gallery-manage',
      label:     '🖼️',
      className: 'gjs-pn-btn',
      attributes: {
        title: 'Gerenciar Imagens da Galeria'
      },
      command: { run: () => { editor.runCommand('gallery:manage'); } }
    }]);

    // Button: Gerenciar Tour Virtual
    editor.Panels.addButton('options', [{
      id:        'tour-manage',
      label:     '🌐',
      className: 'gjs-pn-btn',
      attributes: {
        title: 'Gerenciar Tour Virtual 360°'
      },
      command: { run: () => { editor.runCommand('tour:manage'); } }
    }]);

    // Button: go to component editor
    editor.Panels.addButton('options', [{
      id:        'go-components',
      label:     '🧩',
      className: 'gjs-pn-btn',
      attributes: {
        title: 'Ir para o Editor de Componentes'
      },
      command: { run: () => { window.location.href = '/editor/components'; } }
    }]);

    // Button: Reset Site
    editor.Panels.addButton('options', [{
      id:        'reset-site',
      label:     '⚠️',
      className: 'gjs-pn-btn',
      attributes: {
        title: 'Apagar todas as páginas, componentes e uploads permanentemente'
      },
      command: {
        run: async (ed, sender) => {
          if (sender) sender.set('active', 0);

          // ── Confirmação em duas etapas ─────────────────────────────────
          const step1 = confirm(
            '⚠️ ATENÇÃO: OPERAÇÃO IRREVERSÍVEL\n\n' +
            'Isso vai apagar permanentemente:\n' +
            '  • Todas as páginas (exceto index)\n' +
            '  • Todos os componentes salvos\n' +
            '  • Todas as imagens e vídeos de upload\n' +
            '  • Tours virtuais e galerias cadastrados\n\n' +
            'Deseja continuar?'
          );
          if (!step1) return;

          const confirm2 = window.prompt(
            'Para confirmar, digite RESETAR (em maiúsculas):'
          );
          if (confirm2 !== 'RESETAR') {
            alert('Reset cancelado — texto não confere.');
            return;
          }

          // ── Executar reset ─────────────────────────────────────────────
          try {
            const res  = await fetch('/api/reset', { method: 'POST' });
            const data = await res.json();

            if (!data.success) {
              alert('Erro ao resetar: ' + (data.error || 'desconhecido'));
              return;
            }

            // Limpar AssetManager em memória
            ed.AssetManager.getAll().reset();

            // Limpar canvas e estado do editor
            ed.DomComponents.clear();
            ed.CssComposer.clear();
            ed.UndoManager.clear();

            const s = data.summary || {};
            alert(
              '✓ Reset concluído!\n\n' +
              `• Páginas: resetadas
` +
              `• Componentes: removidos
` +
              `• Uploads apagados: ${s.uploads?.deleted ?? '?'} arquivo(s)`
            );

            // Recarregar para a página index limpa
            window.location.href = '/editor?page=index';
          } catch(e) {
            alert('Erro ao conectar com o servidor: ' + e.message);
          }
        }
      }
    }]);

    // Salvar — integrado no page-manager (ver abaixo)

    // Import/Editar código — painel views, ao lado do </> nativo
    // Ícone: seta de download com colchetes (diferente do view-code que tem só colchetes)
    editor.Panels.addButton('views', [
      {
        id: 'import-code',
        label: `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" title="Importar / Editar HTML &amp; CSS">
          <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>
          <path d="M12 17l1.5-1.5L11 13h8v-2h-8l2.5-2.5L12 7l-5 5 5 5z" opacity=".6"/>
        </svg>`,
        command: 'import-code',
        attributes: { title: 'Importar / Editar HTML & CSS' },
        active: false,
      }
    ]);


    // ── Export: baixa ZIP com pages.json + components.json + uploads ────────
    function cmsExportProject() {
      const a = document.createElement('a');
      a.href = '/api/export';
      a.download = '';
      document.body.appendChild(a);
      a.click();
      a.remove();
    }

    // ── Import: abre picker de arquivo ZIP e envia para /api/import ──────────
    function cmsImportProject() {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.zip';
      input.onchange = async () => {
        const file = input.files && input.files[0];
        if (!file) return;

        editor.Modal.open();
        editor.Modal.setTitle('Importar Projeto');
        const body = document.createElement('div');
        body.style.cssText = 'padding:20px;font-family:sans-serif;color:#ddd;';
        body.textContent = 'Enviando e restaurando dados...';
        editor.Modal.setContent(body);

        const form = new FormData();
        form.append('file', file);

        try {
          const res = await fetch('/api/import', { method: 'POST', body: form });
          const json = await res.json();
          if (json.success) {
            const list = json.imported.map(function(f) { return '<li>' + f + '</li>'; }).join('');
            body.innerHTML =
              '<p style="color:#34d399;font-weight:600;">Importacao concluida!</p>' +
              '<p style="color:#9ca3af;font-size:13px;">Arquivos restaurados: ' + json.imported.length + '</p>' +
              '<ul style="color:#9ca3af;font-size:12px;margin:8px 0 16px 18px;">' + list + '</ul>' +
              '<p style="color:#fbbf24;font-size:12px;">Recarregue o editor para ver as paginas importadas.</p>' +
              '<button onclick="location.reload()" style="margin-top:12px;padding:8px 18px;background:#4f46e5;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:13px;">Recarregar agora</button>';
          } else {
            body.innerHTML = '<p style="color:#f87171;">Erro: ' + (json.error || 'falha desconhecida') + '</p>';
          }
        } catch (err) {
          body.innerHTML = '<p style="color:#f87171;">Erro de rede: ' + err + '</p>';
        }
      };
      input.click();
    }


    // ── Build: abre modal com progresso em tempo real ────────────────────────
    function runBuild() {
      // Marcar botão como "building"
      const buildBtnEl = document.querySelector('.cms-build-btn');
      if (buildBtnEl) buildBtnEl.classList.add('building');

      // ── Modal de progresso ────────────────────────────────────────────────
      const outer = document.createElement('div');
      outer.style.cssText = 'font-family:sans-serif;width:100%;box-sizing:border-box;display:flex;flex-direction:column;gap:10px;';

      // Barra de status
      const statusBar = document.createElement('div');
      statusBar.style.cssText = [
        'display:flex;align-items:center;gap:10px;',
        'background:#1a1a2e;border:1px solid #2a2a3e;border-radius:6px;padding:8px 14px;',
      ].join('');

      const statusDot = document.createElement('span');
      statusDot.style.cssText = 'width:10px;height:10px;border-radius:50%;background:#f59e0b;flex-shrink:0;animation:cms-build-pulse 1s ease-in-out infinite alternate;';
      const statusText = document.createElement('span');
      statusText.style.cssText = 'font-size:13px;color:#f59e0b;font-weight:600;';
      statusText.textContent = '⚙️ Compilando...';
      const statusTime = document.createElement('span');
      statusTime.style.cssText = 'font-size:12px;color:#666;margin-left:auto;font-family:monospace;';
      const startTs = Date.now();
      const ticker = setInterval(() => {
        statusTime.textContent = ((Date.now() - startTs) / 1000).toFixed(1) + 's';
      }, 100);

      statusBar.appendChild(statusDot);
      statusBar.appendChild(statusText);
      statusBar.appendChild(statusTime);

      // Log terminal
      const log = document.createElement('pre');
      log.style.cssText = [
        'background:#0d0d1a;color:#d4d4d4;border:1px solid #2a2a3e;border-radius:6px;',
        'padding:14px;font-size:12px;line-height:1.6;height:260px;overflow-y:auto;',
        'margin:0;white-space:pre-wrap;word-break:break-word;font-family:monospace;',
      ].join('');

      // Footer
      const footer = document.createElement('div');
      footer.style.cssText = 'display:flex;justify-content:space-between;align-items:center;';

      const footerNote = document.createElement('span');
      footerNote.style.cssText = 'font-size:11px;color:#555;';
      footerNote.textContent = 'Arquivos gerados em /dist';

      const closeBtn = document.createElement('button');
      closeBtn.textContent = '⏳ Aguarde...';
      closeBtn.disabled = true;
      closeBtn.style.cssText = 'background:#2a2a3e;color:#888;border:none;border-radius:4px;padding:7px 22px;cursor:default;font-size:13px;';

      footer.appendChild(footerNote);
      footer.appendChild(closeBtn);

      outer.appendChild(statusBar);
      outer.appendChild(log);
      outer.appendChild(footer);

      editor.Modal.setTitle('🏗️ Build do Site');
      editor.Modal.setContent(outer);
      editor.Modal.open();

      // ── Helpers ───────────────────────────────────────────────────────────
      const append = (text, color) => {
        const span = document.createElement('span');
        if (color) span.style.color = color;
        span.textContent = text;
        log.appendChild(span);
        log.scrollTop = log.scrollHeight;
      };

      let _finalized = false;
      function finalize(success) {
        if (_finalized) return;   // executar apenas uma vez
        _finalized = true;
        clearInterval(ticker);
        if (buildBtnEl) buildBtnEl.classList.remove('building');
        closeBtn.disabled = false;
        closeBtn.style.cursor = 'pointer';
        if (success) {
          statusDot.style.animation = 'none';
          statusDot.style.background = '#4ade80';
          statusText.style.color = '#4ade80';
          statusText.textContent = '✅ Build concluído com sucesso!';
          closeBtn.textContent = '✓ Fechar';
          closeBtn.style.cssText = 'background:#166534;color:#bbf7d0;border:none;border-radius:4px;padding:7px 22px;cursor:pointer;font-size:13px;font-weight:700;';
        } else {
          statusDot.style.animation = 'none';
          statusDot.style.background = '#f87171';
          statusText.style.color = '#f87171';
          statusText.textContent = '❌ Build falhou';
          closeBtn.textContent = 'Fechar';
          closeBtn.style.cssText = 'background:#2a2a3e;color:#ccc;border:none;border-radius:4px;padding:7px 22px;cursor:pointer;font-size:13px;';
        }
        closeBtn.onclick = () => editor.Modal.close();
      }

      // ── Streaming SSE ─────────────────────────────────────────────────────
      fetch('/api/build', { method: 'POST' })
        .then(res => {
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let buf = '';
          const ansi = /\x1b\[[0-9;]*m/g;

          function read() {
            reader.read().then(({ done, value }) => {
              if (done) { if (!_finalized) finalize(false); return; }
              buf += decoder.decode(value, { stream: true });
              const parts = buf.split('\n\n');
              buf = parts.pop();
              parts.forEach(part => {
                const line = part.replace(/^data: /, '').trim();
                if (!line) return;
                try {
                  const { type, data } = JSON.parse(line);
                  const clean = data.replace(ansi, '');
                  if (type === 'success') {
                    append(clean, '#4ade80');
                    finalize(true);
                  } else if (type === 'error') {
                    append(clean, '#f87171');
                    finalize(false);
                  } else {
                    append(clean);
                  }
                } catch(e) { append(part); }
              });
              read();
            }).catch(() => { if (!_finalized) finalize(false); });
          }
          read();
        })
        .catch(err => {
          append('\n❌ Erro de conexão: ' + err.message + '\n', '#f87171');
          if (!_finalized) finalize(false);
        });
    }

    editor.Commands.add('save-db', {
      run(ed, sender) {
        sender && sender.set('active', 0);
        savePage();
      }
    });


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

      editor.Commands.add('import-code', {
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
          <textarea id="imp-html" style="width:100%;height:220px;background:#0d0d1a;color:#d4d4d4;padding:12px;border:1px solid #444;margin-bottom:12px;font-family:monospace;font-size:12px;line-height:1.6;border-radius:4px;resize:vertical;box-sizing:border-box;"></textarea>
          <div style="margin-bottom:5px;color:#ccc;font-size:12px;font-weight:600;">CSS</div>
          <textarea id="imp-css" style="width:100%;height:130px;background:#0d0d1a;color:#d4d4d4;padding:12px;border:1px solid #444;margin-bottom:12px;font-family:monospace;font-size:12px;line-height:1.6;border-radius:4px;resize:vertical;box-sizing:border-box;"></textarea>
          <div style="margin-bottom:5px;color:#ccc;font-size:12px;font-weight:600;">JavaScript</div>
          <textarea id="imp-js" style="width:100%;height:120px;background:#0d0d1a;color:#d4d4d4;padding:12px;border:1px solid #444;margin-bottom:15px;font-family:monospace;font-size:12px;line-height:1.6;border-radius:4px;resize:vertical;box-sizing:border-box;" placeholder="// Seu JavaScript aqui (sem as tags <script>)"></textarea>
          <button id="imp-apply" style="background:#3b82f6;color:#fff;border:none;border-radius:4px;padding:8px 20px;cursor:pointer;font-size:13px;">Aplicar</button>
        `;
        wrap.querySelector('#imp-html').value = formatHTML(stripScripts(currentHtml));
        wrap.querySelector('#imp-css').value  = formatCSS(ed.getCss());
        wrap.querySelector('#imp-js').value   = extractScripts(currentHtml);
        wrap.querySelector('#imp-apply').onclick = () => {
          let html = wrap.querySelector('#imp-html').value;
          const js = wrap.querySelector('#imp-js').value.trim();
          if (js) html += '\n<script>\n' + js + '\n<\/script>';
          ed.setComponents(html);
          ed.setStyle(wrap.querySelector('#imp-css').value);
          ed.Modal.close();
        };

        ed.Modal.setTitle('Editar / Importar Código');
        ed.Modal.setContent(wrap);
        ed.Modal.open();
      }
    });

    // Page manager widget in the toolbar
    editor.Panels.addButton('options', [{
      id: 'page-manager',
      className: 'gjs-pn-btn',
      attributes: {
        style: 'display:inline-flex;align-items:center;margin-right:12px;background:#222;border-radius:4px;padding:3px 6px;'
      },
      label: `
        <select id="page-selector" style="background:transparent;color:#fff;border:none;outline:none;cursor:pointer;max-width:130px;">
          <option value="index">index</option>
        </select>
        <button id="new-page-btn" title="Nova página" style="background:#3b82f6;color:#fff;border:none;border-radius:3px;padding:2px 8px;margin-left:6px;cursor:pointer;font-size:14px;">+</button>
        <button id="save-page-btn" title="Salvar página" style="background:#22c55e;color:#fff;border:none;border-radius:3px;padding:2px 8px;margin-left:4px;cursor:pointer;font-size:14px;">💾</button>
        <button id="del-page-btn" title="Excluir página" style="background:#ef4444;color:#fff;border:none;border-radius:3px;padding:2px 8px;margin-left:4px;cursor:pointer;font-size:14px;display:none;">🗑️</button>
      `,
      command: ''
    }]);

    // ── Component blocks helpers ───────────────────────────────────────────────
    function registerComponentBlock(name, html, css) {
      const blockId = `custom-comp-${name}`;
      // Remove old version if it exists
      try { editor.BlockManager.remove(blockId); } catch {}
      editor.BlockManager.add(blockId, {
        label:    name,
        category: { label: 'Meus Componentes', order: 0 },
        content:  { type: 'shared-component', attributes: { 'data-component-id': name } },
        attributes: { class: 'fa fa-puzzle-piece' }
      });
    }

    function removeComponentBlock(name) {
      try { editor.BlockManager.remove(`custom-comp-${name}`); } catch {}
    }

    async function loadComponentBlocks() {
      const res = await fetch('/api/components/load');
      savedComponents = await res.json();
      for (const [name, data] of Object.entries(savedComponents)) {
        registerComponentBlock(name, data.html || '', data.css || '');
      }
      // Force the block panel to re-render so the new category appears
      try { editor.BlockManager.render(); } catch(e) {}
    }

    // ── SSE – real-time component sync ────────────────────────────────────────
    function connectSSE() {
      const es = new EventSource('/api/events');
      es.addEventListener('component:updated', (e) => {
        const { name, html, css } = JSON.parse(e.data);
        savedComponents[name] = { html, css };
        registerComponentBlock(name, html, css);

        // Update all instances on the canvas
        const wrappers = editor.getWrapper().find(`[data-component-id="${name}"]`);
        wrappers.forEach(wrap => {
          if (typeof wrap.updateContent === 'function') {
            wrap.updateContent();
          }
        });

        try { editor.BlockManager.render(); } catch(err) {}
      });
      es.addEventListener('component:deleted', (e) => {
        const { name } = JSON.parse(e.data);
        delete savedComponents[name];
        removeComponentBlock(name);
        try { editor.BlockManager.render(); } catch(err) {}
      });
      es.onerror = () => {
        es.close();
        setTimeout(connectSSE, 5000); // reconnect after 5 s
      };
    }

    // ── Wire up events AFTER the panel is rendered (editor 'load') ────────────
    editor.on('load', async () => {
      // Load pages and components
      await loadPage(currentSlug);
      await loadComponentBlocks();
      updateUI();

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

      // ── Fechar e reordenar categorias do Open Blocks ─────────────────────
      // Fecha todas as categorias assim que qualquer bloco é adicionado
      // (incluindo os do plugin Tailwind que chegam mais tarde)
      const CATEGORY_ORDER = {
        'Meus Componentes': 0,
        'Media':            1,
        'Basic':            2,
        'Header':           3,
        'Content':          4,
        'Footer':           5,
      };

      function applyCategoryOrder() {
        try {
          const cats = editor.BlockManager.getCategories();
          cats.each(cat => {
            const label = cat.get('label') || cat.id || '';
            const orderVal = CATEGORY_ORDER.hasOwnProperty(label)
              ? CATEGORY_ORDER[label]
              : 100 + label.charCodeAt(0); // resto em ordem alfabética após os prioritários
            cat.set('order', orderVal);
            cat.set('open', false);
          });
          editor.BlockManager.render();
        } catch(e) {}
      }

      // Disparar em cada bloco adicionado (plugin Tailwind registra em lote)
      editor.on('block:add', applyCategoryOrder);
      // E também após um delay para pegar qualquer registrado de forma assíncrona
      setTimeout(applyCategoryOrder, 600);

      // Start listening for real-time component updates
      connectSSE();

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
          /* pn-options = ícones do topo-direito (style manager, settings, etc.)
             posicionados em right:var(--gjs-left-width) pelo GrapesJS */
          var options   = document.querySelector('.gjs-pn-options');

          if (!views || !viewsCont || !canvas) return false;

          if (col) {
            /* ── RECOLHIDO ─────────────────────────────────────────────── */
            /* Painéis laterais: sair pela direita */
            views.style.right     = (-PANEL_W) + 'px';
            viewsCont.style.right = (-PANEL_W) + 'px';
            /* Ícones do topo-direito: ir para a borda direita */
            if (options) options.style.right = '0px';
            /* Canvas e toolbar: expandir para 100% */
            canvas.style.width = '100%';
            if (commands) commands.style.width = '100%';
          } else {
            /* ── EXPANDIDO ─────────────────────────────────────────────── */
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
          if (!ok) {
            // GrapesJS ainda não renderizou — tentar de novo em breve
            setTimeout(function() { setPanels(collapsed); }, 200);
          }

          // Mover o botão toggler
          toggleBtn.style.right = collapsed ? '0px' : PANEL_W + 'px';

          // Virar a seta
          var svg = toggleBtn.querySelector('svg');
          if (svg) svg.style.transform = collapsed ? 'scaleX(-1)' : 'scaleX(1)';

          // Forçar o GrapesJS a recalcular dimensões do canvas
          setTimeout(function() { try { editor.refresh(); } catch(e) {} }, 320);
        }

        toggleBtn.addEventListener('click', function() { setCollapsed(!collapsed); });

        // Aguardar GrapesJS renderizar completamente antes de configurar o drawer
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

      // Dropdown change
      document.getElementById('page-selector').addEventListener('change', async (e) => {
        currentSlug = e.target.value;
        await loadPage(currentSlug);
        updateUI();
      });

      // New page button
      document.getElementById('new-page-btn').addEventListener('click', async () => {
        const name = prompt('Nome da nova página (ex: "sobre"):');
        if (!name) return;
        const slug = name.trim().toLowerCase().replace(/\s+/g, '-');
        if (!slug || availablePages.includes(slug)) {
          alert('Nome inválido ou já existente.');
          return;
        }
        currentSlug = slug;
        availablePages.push(slug);
        editor.setComponents('<div class="p-8 text-center"><h1 class="text-3xl font-bold mb-4">Start Building</h1><p class="text-gray-600">Drag and drop elements here.</p></div>');
        editor.setStyle('');
        await savePage();
        updateUI();
      });

      // Save page button (inline, ao lado de Nova Página)
      document.getElementById('save-page-btn').addEventListener('click', () => {
        savePage();
      });

      // Delete page button
      document.getElementById('del-page-btn').addEventListener('click', async () => {
        if (currentSlug === 'index') return;
        if (confirm(`Excluir a página "${currentSlug}"? Esta ação não pode ser desfeita.`)) {
          await deletePage(currentSlug);
        }
      });
    });

    // ── Custom "href" trait: select + free text combined ─────────────────────
    // We create a custom trait type that renders a <select> for internal pages
    // AND a text input for manual URLs, both living in GrapesJS's own panel DOM
    // (not inside the iframe), so there's no cross-frame datalist issue.
    editor.TraitManager.addType('page-href', {
      // Build the UI element for this trait
      createInput({ trait }) {
        const wrap = document.createElement('div');
        wrap.style.cssText = 'display:flex;flex-direction:column;gap:4px;width:100%';

        const select = document.createElement('select');
        select.id   = 'trait-page-select';
        select.style.cssText = 'background:#1a1a2e;color:#fff;border:1px solid #444;border-radius:3px;padding:4px 6px;width:100%;font-size:12px;';

        const textInput = document.createElement('input');
        textInput.type  = 'text';
        textInput.id    = 'trait-href-text';
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
        hint.textContent   = 'Selecione uma página, digite URL ou anexe arquivo.';

        // Populate select with pages
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

        // When select changes → copy to text input and trait
        select.addEventListener('change', () => {
          if (select.value) {
            textInput.value = select.value;
            this.onChange(select.value);
          }
        });

        // When text input changes → clear select selection and update trait
        textInput.addEventListener('input', () => {
          select.value = '';          // deselect any page
          this.onChange(textInput.value);
        });

        wrap.appendChild(select);
        wrap.appendChild(textInput);
        wrap.appendChild(fileBtn);
        wrap.appendChild(hint);

        // Re-populate when pages change (after load / new page creation)
        editor.on('load', refreshSelect);
        editor.on('storage:end:load', refreshSelect);

        return wrap;
      },

      // Called by GrapesJS to read the current value from our UI
      onEvent({ elInput, component }) {
        const textInput = elInput.querySelector('#trait-href-text');
        if (textInput) component.addAttributes({ href: textInput.value });
      },

      // Called by GrapesJS to set our UI value when a component is selected
      onUpdate({ elInput, component }) {
        const href      = component.getAttributes().href || '';
        const select    = elInput.querySelector('#trait-page-select');
        const textInput = elInput.querySelector('#trait-href-text');
        if (!select || !textInput) return;

        // Check if current href matches any internal page path
        const match = availablePages.find(p => (p === 'index' ? '/' : '/' + p) === href);
        if (match) {
          select.value    = href;
          textInput.value = href;
        } else {
          select.value    = '';
          textInput.value = href;
        }
      }
    });

    editor.DomComponents.addType('link', {
      extend: 'link',
      isComponent: el => el.tagName === 'A',
      model: {
        defaults: {
          traits: [
            {
              type: 'page-href',   // our custom trait
              name: 'href',
              label: 'URL / Página'
            },
            {
              type: 'select',
              name: 'target',
              label: 'Abrir em',
              options: [
                { value: '',       name: 'Esta janela'  },
                { value: '_blank', name: 'Nova janela'  }
              ]
            }
          ]
        }
      }
    });