/* Visual CMS 360° — Copyright (C) 2025 Gerson Luis Vertematti
 * GNU GPL v3 — https://www.gnu.org/licenses/gpl-3.0.html
 *
 * Prepara o canvas do editor (GrapesJS) para renderizar as classes Tailwind +
 * DaisyUI do MESMO jeito que o site publicado.
 *
 * O site é compilado com Tailwind v4 + plugin DaisyUI. O canvas usa o "browser
 * build" do Tailwind v4 (/vendor/tailwindcss-browser.js), que NÃO suporta
 * plugins, junto com a CSS pronta do DaisyUI (/vendor/daisyui/daisyui.css).
 * Essa combinação cobre as classes de componente (.btn, .card…) e as de cor
 * "simples" (bg-primary), mas não registra as cores do DaisyUI como tokens do
 * Tailwind — então ring-primary, ring-offset-base-100, bg-base-200/50,
 * from-base-100, shadow-primary etc. saíam com cor errada no editor.
 *
 * O que este script faz, em cada documento do canvas:
 *  1) declara a ordem das camadas CSS (theme < base < components < utilities)
 *     ANTES do daisyui.css. Sem isso, o @layer theme do Tailwind (criado depois)
 *     passa a vencer o @layer base do DaisyUI, onde ficam as variáveis de tema;
 *  2) registra as cores do DaisyUI como tokens (@theme inline), referenciando
 *     as variáveis --color-* que o DaisyUI define por tema (light/dark).
 */
(function () {
  var COLORS = [
    'base-100', 'base-200', 'base-300', 'base-content',
    'primary', 'primary-content', 'secondary', 'secondary-content',
    'accent', 'accent-content', 'neutral', 'neutral-content',
    'info', 'info-content', 'success', 'success-content',
    'warning', 'warning-content', 'error', 'error-content',
  ];
  var THEME_CSS = '@theme inline {\n' + COLORS.map(function (c) {
    return '  --color-' + c + ': var(--color-' + c + ');';
  }).join('\n') + '\n}';

  window.VCMS_setupCanvasTailwind = function (editor) {
    function inject() {
      try {
        var doc = editor.Canvas.getDocument();
        if (!doc || !doc.head) return;
        if (!doc.getElementById('cms-tw-layer-order')) {
          var layers = doc.createElement('style');
          layers.id = 'cms-tw-layer-order';
          layers.textContent = '@layer theme, base, components, utilities;';
          doc.head.insertBefore(layers, doc.head.firstChild);
        }
        if (!doc.getElementById('cms-tw-daisy-theme')) {
          var theme = doc.createElement('style');
          theme.id = 'cms-tw-daisy-theme';
          theme.setAttribute('type', 'text/tailwindcss');
          theme.textContent = THEME_CSS;
          doc.head.appendChild(theme);
        }
      } catch (e) { /* canvas ainda não pronto */ }
    }
    editor.on('canvas:frame:load:head', inject);
    editor.on('canvas:frame:load:body', inject);
    editor.on('load', inject);
    inject();
  };
})();
