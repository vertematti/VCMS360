# Visual CMS 360° — Desktop App (Electron)

> 🌐 **Language:** [Português](README.pt-BR.md) · **English**

Packages VCMS360 as a native desktop application (own window, icon, installer),
with no need for the end user to have Node/npm installed.

## How it works

The app is an Electron "wrapper" around VCMS360's own server:

1. On the **first run**, it copies the initial data (pages, components, resources)
   into a **writable** user folder.
2. It starts the production SSR server (`dist/server/entry.mjs`) on a **fixed
   port**, with the working directory pointing at that writable folder — that's
   where the editor saves everything (pages, uploads, imported images). The fixed
   port keeps the origin stable, so the editor's `localStorage` persists across
   launches.
3. It opens the window on the editor as soon as the server responds.
4. On close, it shuts the server down.

The static-site export ("Build" button) runs **in-process, without a CLI**: since
the production server is already up, the app fetches each page's HTML from itself
and copies the already-compiled assets. No `npm`/Astro needed on the machine.

Where the data lives (writable folder):

- **Linux:** `~/.config/Visual CMS 360/data`
- **Windows:** `%APPDATA%\Visual CMS 360\data`
- **macOS:** `~/Library/Application Support/Visual CMS 360/data`

The exported static site goes to `.../Visual CMS 360/site-estatico`
(menu **File → Open export folder**).

## Installation: two profiles (browser vs desktop)

Only the desktop mode needs Electron — and it's already in `devDependencies`.
To install just what you need, use the shortcuts:

```bash
npm run setup:web       # site only (browser) — does NOT download Electron
npm run setup:desktop   # everything, including Electron (to package the app)
```

`setup:web` keeps `npm run dev`, `npm run build` and `npm run export:static`
working; it only skips `electron` + `electron-builder` (saves the Electron binary
download, ~150 MB).

> **Why not `npm install --omit=electron`?**
> npm's `--omit` **does not accept a package name** — only the `dev`, `optional`
> and `peer` groups. So `--omit=electron` would be ignored. What works is
> `--omit=dev` (and since Electron is the only devDependency here, it's the same
> intent in practice). The scripts above just wrap that with a clearer name;
> under the hood, `setup:web` = `npm install --omit=dev`.

If you already ran the full install and want to remove just Electron afterwards:

```bash
npm prune --omit=dev
```

## Run in development

```bash
npm run setup:desktop   # includes electron and electron-builder (downloads the Electron binary)
npm run electron:dev    # builds and opens the app
```

In dev mode, the app uses the **project folder itself** as the data directory
(so you see the real data during development).

## Build the installers

Each command runs `npm run build` first and then packages:

```bash
npm run dist:linux   # AppImage + .deb   (in /dist-desktop)
npm run dist:win     # .exe installer (nsis)
npm run dist:mac     # .dmg
npm run dist         # all targets configured for the current OS
```

The generated files land in `dist-desktop/`.

### Important about cross-platform builds

Packaging **usually needs to run on the target system**:

- **Linux (AppImage/.deb):** build on Linux. ✅ the simplest case here.
- **Windows (.exe):** build on Windows. It's possible from Linux with Wine
  installed, but a Windows machine is the recommended path.
- **macOS (.dmg):** can only be built **on macOS** (Apple's requirement), and to
  distribute outside your own machine you must sign/notarize the app.

## Uninstall and user data

The data you create in the app (pages, components, uploads, imported images) is
**not** stored alongside the program — it lives in the writable user folder:

- **Linux:** `~/.config/Visual CMS 360/`
- **Windows:** `%APPDATA%\Visual CMS 360\`
- **macOS:** `~/Library/Application Support/Visual CMS 360/`

(In the app, use **File → Open data folder** to see the exact path.)

**Uninstalling the `.deb` does NOT delete this folder — and that's intentional.**
The `.deb` (dpkg/apt) only removes the files it installed (under `/opt`). The
folder in `~/.config` is created at runtime, per user, and is not tracked by the
package manager — neither `apt remove` nor `apt purge` removes it. The upside is
that reinstalling or upgrading keeps your sites intact.

To delete the data manually (irreversible):

```bash
rm -rf ~/.config/"Visual CMS 360"
```

If you WANT the uninstall to wipe this data automatically, a post-removal script
can be added to the `.deb`. But deleting user data on uninstall is non-standard
(against Debian Policy) and risky (it runs as root and would have to sweep every
user's `/home`), so it's left disabled for safety. Just ask and I'll add it.

## Notes

- **Icon:** replace `build/icon.png` (1024×1024) with the final icon.
  electron-builder auto-generates the `.ico`/`.icns` formats.
- **Git dependency (A-Frame):** the project's `.npmrc` already ships
  `allow-git=all`, required since npm 12. Keep it versioned.
- **Package size:** Electron bundles Chromium (~150–200 MB). To slim it down, you
  can move build-only dependencies (astro, vite, tailwind, grapesjs…) to
  `devDependencies`, so electron-builder doesn't include them in the package.
  This is an optional optimization — test the packaged app after changing it.
- **asar disabled:** the server reads `dist/client` and `node_modules` as real
  files at runtime; that's why packaging uses `asar: false`.
