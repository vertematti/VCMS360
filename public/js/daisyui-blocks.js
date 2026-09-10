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

// ── Blocos DaisyUI ────────────────────────────────────────────────────────
// Biblioteca compartilhada de blocos GrapesJS baseados em componentes do
// DaisyUI (https://daisyui.com), usada tanto no editor de páginas
// (editor-main.js) quanto no editor de componentes (components-main.js).
//
// Cada item vira um bloco arrastável na categoria "DaisyUI" do painel de
// blocos. O HTML usa só classes utilitárias do Tailwind + classes de
// componente do DaisyUI (.btn, .card, .alert, etc.) — nada de JS: qualquer
// interatividade (ex.: <details> do collapse, <dialog> do modal) é resolvida
// nativamente pelo HTML/CSS.
//
// Isso é carregado como um <script> simples (não módulo ES) para poder ser
// incluído com <script is:inline> nas páginas .astro do editor, então
// exportamos via `window.VCMS_DAISYUI_BLOCKS`.
(function () {
  window.VCMS_DAISYUI_BLOCKS = [
    {
      id: 'daisy-button',
      label: 'Botão',
      media: '🔘',
      content: '<button class="btn btn-primary">Botão</button>',
    },
    {
      id: 'daisy-button-group',
      label: 'Grupo de botões',
      media: '🔘',
      content:
        '<div class="join">' +
        '<button class="btn join-item">Um</button>' +
        '<button class="btn join-item">Dois</button>' +
        '<button class="btn join-item">Três</button>' +
        '</div>',
    },
    {
      id: 'daisy-badge',
      label: 'Badge',
      media: '🏷️',
      content: '<span class="badge badge-primary">Novo</span>',
    },
    {
      id: 'daisy-alert',
      label: 'Alerta',
      media: '⚠️',
      content:
        '<div role="alert" class="alert alert-info">' +
        '<span>Esta é uma mensagem informativa.</span>' +
        '</div>',
    },
    {
      id: 'daisy-card',
      label: 'Card',
      media: '🗂️',
      content:
        '<div class="card bg-base-100 w-96 shadow-sm">' +
        '<figure><img src="https://placehold.co/600x300" alt="Imagem do card"></figure>' +
        '<div class="card-body">' +
        '<h2 class="card-title">Título do card</h2>' +
        '<p>Um breve texto descrevendo o conteúdo deste card.</p>' +
        '<div class="card-actions justify-end">' +
        '<button class="btn btn-primary">Ver mais</button>' +
        '</div>' +
        '</div>' +
        '</div>',
    },
    {
      id: 'daisy-avatar',
      label: 'Avatar',
      media: '🙂',
      content:
        '<div class="avatar">' +
        '<div class="w-16 rounded-full">' +
        '<img src="https://placehold.co/100x100" alt="Avatar" />' +
        '</div>' +
        '</div>',
    },
    {
      id: 'daisy-navbar',
      label: 'Barra de navegação',
      media: '🧭',
      content:
        '<div class="navbar bg-base-100 shadow-sm">' +
        '<div class="flex-1"><a class="btn btn-ghost text-xl">Minha Marca</a></div>' +
        '<div class="flex-none">' +
        '<ul class="menu menu-horizontal px-1">' +
        '<li><a>Início</a></li>' +
        '<li><a>Sobre</a></li>' +
        '<li><a>Contato</a></li>' +
        '</ul>' +
        '</div>' +
        '</div>',
    },
    {
      id: 'daisy-footer',
      label: 'Rodapé',
      media: '🦶',
      content:
        '<footer class="footer footer-horizontal footer-center bg-base-200 text-base-content p-10 rounded">' +
        '<nav class="grid grid-flow-col gap-4">' +
        '<a class="link link-hover">Início</a>' +
        '<a class="link link-hover">Sobre</a>' +
        '<a class="link link-hover">Contato</a>' +
        '</nav>' +
        '<aside><p>© ' + new Date().getFullYear() + ' — Todos os direitos reservados</p></aside>' +
        '</footer>',
    },
    {
      id: 'daisy-hero',
      label: 'Hero',
      media: '🌄',
      content:
        '<div class="hero bg-base-200 min-h-[400px] rounded-lg">' +
        '<div class="hero-content text-center">' +
        '<div class="max-w-md">' +
        '<h1 class="text-5xl font-bold">Título de destaque</h1>' +
        '<p class="py-6">Um parágrafo curto explicando a proposta desta seção, com espaço para uma chamada para ação logo abaixo.</p>' +
        '<button class="btn btn-primary">Começar</button>' +
        '</div>' +
        '</div>' +
        '</div>',
    },
    {
      id: 'daisy-stats',
      label: 'Estatísticas',
      media: '📊',
      content:
        '<div class="stats shadow">' +
        '<div class="stat">' +
        '<div class="stat-title">Visitas</div>' +
        '<div class="stat-value">89,400</div>' +
        '<div class="stat-desc">↗︎ 400 (22%)</div>' +
        '</div>' +
        '<div class="stat">' +
        '<div class="stat-title">Novos usuários</div>' +
        '<div class="stat-value">1,200</div>' +
        '<div class="stat-desc">↘︎ 90 (14%)</div>' +
        '</div>' +
        '</div>',
    },
    {
      id: 'daisy-tabs',
      label: 'Abas',
      media: '📑',
      content:
        '<div role="tablist" class="tabs tabs-lift">' +
        '<a role="tab" class="tab tab-active">Aba 1</a>' +
        '<a role="tab" class="tab">Aba 2</a>' +
        '<a role="tab" class="tab">Aba 3</a>' +
        '</div>',
    },
    {
      id: 'daisy-breadcrumbs',
      label: 'Breadcrumbs',
      media: '🍞',
      content:
        '<div class="breadcrumbs text-sm">' +
        '<ul>' +
        '<li><a>Início</a></li>' +
        '<li><a>Categoria</a></li>' +
        '<li>Página atual</li>' +
        '</ul>' +
        '</div>',
    },
    {
      id: 'daisy-menu',
      label: 'Menu lateral',
      media: '📋',
      content:
        '<ul class="menu bg-base-200 rounded-box w-56">' +
        '<li><a>Item 1</a></li>' +
        '<li><a>Item 2</a></li>' +
        '<li><a>Item 3</a></li>' +
        '</ul>',
    },
    {
      id: 'daisy-collapse',
      label: 'Sanfona (accordion)',
      media: '📂',
      content:
        '<div class="collapse collapse-arrow bg-base-200">' +
        '<input type="checkbox" />' +
        '<div class="collapse-title font-semibold">Clique para expandir</div>' +
        '<div class="collapse-content text-sm">Conteúdo que aparece ao expandir esta seção.</div>' +
        '</div>',
    },
    {
      id: 'daisy-table',
      label: 'Tabela',
      media: '📋',
      content:
        '<div class="overflow-x-auto">' +
        '<table class="table">' +
        '<thead><tr><th>Nome</th><th>Cargo</th><th>Cidade</th></tr></thead>' +
        '<tbody>' +
        '<tr><td>Ana Silva</td><td>Designer</td><td>São Paulo</td></tr>' +
        '<tr><td>Bruno Costa</td><td>Desenvolvedor</td><td>Curitiba</td></tr>' +
        '</tbody>' +
        '</table>' +
        '</div>',
    },
    {
      id: 'daisy-progress',
      label: 'Barra de progresso',
      media: '📈',
      content: '<progress class="progress progress-primary w-56" value="60" max="100"></progress>',
    },
    {
      id: 'daisy-loading',
      label: 'Spinner de carregamento',
      media: '⏳',
      content: '<span class="loading loading-spinner loading-lg text-primary"></span>',
    },
    {
      id: 'daisy-toast',
      label: 'Toast (notificação)',
      media: '🔔',
      content:
        '<div class="toast toast-top toast-end">' +
        '<div class="alert alert-success"><span>Alterações salvas com sucesso.</span></div>' +
        '</div>',
    },
    {
      id: 'daisy-modal',
      label: 'Modal',
      media: '🪟',
      content:
        '<button class="btn" onclick="document.getElementById(\'daisy_modal_1\').showModal()">Abrir modal</button>' +
        '<dialog id="daisy_modal_1" class="modal">' +
        '<div class="modal-box">' +
        '<h3 class="text-lg font-bold">Título do modal</h3>' +
        '<p class="py-4">Conteúdo do modal aqui.</p>' +
        '<div class="modal-action">' +
        '<form method="dialog"><button class="btn">Fechar</button></form>' +
        '</div>' +
        '</div>' +
        '<form method="dialog" class="modal-backdrop"><button>close</button></form>' +
        '</dialog>',
    },
    {
      id: 'daisy-form-input',
      label: 'Campo de formulário',
      media: '📝',
      content:
        '<fieldset class="fieldset w-full max-w-xs">' +
        '<legend class="fieldset-legend">E-mail</legend>' +
        '<input type="email" class="input w-full" placeholder="voce@exemplo.com" />' +
        '</fieldset>',
    },
  ];
})();
