/* Visual CMS 360° — substituto vazio do "Tailwind Play CDN" (v3).
 * O plugin grapesjs-tailwind injeta no canvas o script de `tailwindPlayCdn` e,
 * no onload, faz `window.tailwind.config = {...}`. Apontamos a opção para este
 * arquivo para NÃO carregar o Tailwind v3 do CDN — o canvas usa o Tailwind v4
 * (/vendor/tailwindcss-browser.js), igual ao build do site. Este stub só
 * garante que `window.tailwind` exista, para o onload do plugin não dar erro. */
window.tailwind = window.tailwind || {};
