/**
 * Image pipeline — the only image tool in this starter.
 *
 *   src/assets/images/   sources, committed to git
 *          |
 *          |  sharp (raster)  +  svgo (svg)
 *          v
 *   public/img/          generated, git-ignored, content-hashed
 *
 * Run with `npm run images`. npm also runs it automatically before
 * `npm run dev` and `npm run build`, so a fresh clone just works.
 *
 * Files whose source and config have not changed are skipped, which makes
 * repeat runs effectively free.
 */
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { basename, extname, join, relative, resolve, sep } from 'node:path'
import sharp from 'sharp'
import { optimize } from 'svgo'
import config from '../image.config.js'

const ROOT = resolve(import.meta.dirname, '..')
const SOURCE_DIR = resolve(ROOT, 'src/assets/images')
const OUT_DIR = resolve(ROOT, 'public/img')
const PUBLIC_BASE = '/img'
// Build metadata, not a public asset: kept out of public/ so it never ships.
const MANIFEST = resolve(ROOT, '.image-manifest.json')

const RASTER = new Set(['.jpg', '.jpeg', '.png'])
const FALLBACK_FORMAT = { '.jpg': 'jpeg', '.jpeg': 'jpeg', '.png': 'png' }
const MIME = { avif: 'image/avif', webp: 'image/webp', jpeg: 'image/jpeg', png: 'image/png' }
const EXT = { avif: 'avif', webp: 'webp', jpeg: 'jpg', png: 'png' }

/** Encoder options per format. Only options that format actually accepts. */
function encoderOptions(format, quality) {
  switch (format) {
    case 'avif':
      return { quality, effort: 4 }
    case 'webp':
      return { quality, effort: 4 }
    case 'jpeg':
      return { quality, progressive: true, mozjpeg: true }
    case 'png':
      return { quality, compressionLevel: 9, palette: true }
    default:
      return { quality }
  }
}

const hash = (input) => createHash('sha256').update(input).digest('hex').slice(0, 8)
const configHash = hash(JSON.stringify(config))

function listSources() {
  if (!existsSync(SOURCE_DIR)) return []
  return readdirSync(SOURCE_DIR, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && !entry.name.startsWith('.'))
    .map((entry) => join(entry.parentPath, entry.name))
}

function loadManifest() {
  if (!existsSync(MANIFEST)) return { images: {}, svg: {} }
  try {
    const previous = JSON.parse(readFileSync(MANIFEST, 'utf8'))
    return { images: previous.images ?? {}, svg: previous.svg ?? {} }
  } catch {
    return { images: {}, svg: {} }
  }
}

/** An entry can be reused only if its hash matches and every file is still on disk. */
function isFresh(entry, fileHash) {
  if (!entry || entry.hash !== fileHash) return false
  const urls = [...Object.values(entry.sources ?? {}).flat(), ...(entry.fallback ?? [])].map(
    (variant) => variant.src,
  )
  return urls.every((url) => existsSync(join(OUT_DIR, basename(url))))
}

async function buildRaster(file, key, fileHash) {
  const ext = extname(file).toLowerCase()
  const stem = basename(file, extname(file))
  const fallbackFormat = FALLBACK_FORMAT[ext]
  const source = sharp(file)
  const meta = await source.metadata()

  const settings = { ...config, ...(config.overrides?.[key] ?? {}) }
  let widths = [...new Set(settings.widths)].filter((w) => w <= meta.width).sort((a, b) => a - b)
  if (widths.length === 0) widths = [meta.width]

  const entry = { hash: fileHash, width: 0, height: 0, sources: {}, fallback: [] }
  const formats = [...settings.formats, fallbackFormat]

  for (const width of widths) {
    const resized = sharp(file).resize({ width, withoutEnlargement: true })

    for (const format of formats) {
      const quality = settings.quality[format] ?? 80
      const name = `${stem}-${width}.${fileHash}.${EXT[format]}`
      const buffer = await resized
        .clone()
        .toFormat(format, encoderOptions(format, quality))
        .toBuffer()
      writeFileSync(join(OUT_DIR, name), buffer)

      const variant = { w: width, src: `${PUBLIC_BASE}/${name}` }
      if (format === fallbackFormat) {
        entry.fallback.push(variant)
        entry.width = width
        entry.height = Math.round((meta.height / meta.width) * width)
      } else {
        ;(entry.sources[MIME[format]] ??= []).push(variant)
      }
    }
  }

  return entry
}

function buildSvg(file, fileHash) {
  const stem = basename(file, '.svg')
  const name = `${stem}.${fileHash}.svg`
  const { data } = optimize(readFileSync(file, 'utf8'), { path: file, multipass: true })
  writeFileSync(join(OUT_DIR, name), data)
  return `${PUBLIC_BASE}/${name}`
}

async function run() {
  mkdirSync(OUT_DIR, { recursive: true })

  const previous = loadManifest()
  const manifest = { generatedAt: new Date().toISOString(), images: {}, svg: {} }
  const sources = listSources()
  let built = 0
  let reused = 0

  for (const file of sources) {
    const key = relative(SOURCE_DIR, file).replaceAll(sep, '/')
    const ext = extname(file).toLowerCase()
    const fileHash = hash(Buffer.concat([readFileSync(file), Buffer.from(configHash)]))

    if (ext === '.svg') {
      const known = previous.svg[key]
      if (known && known.includes(`.${fileHash}.`) && existsSync(join(OUT_DIR, basename(known)))) {
        manifest.svg[key] = known
        reused += 1
      } else {
        manifest.svg[key] = buildSvg(file, fileHash)
        built += 1
      }
      continue
    }

    if (!RASTER.has(ext)) continue

    if (isFresh(previous.images[key], fileHash)) {
      manifest.images[key] = previous.images[key]
      reused += 1
    } else {
      manifest.images[key] = await buildRaster(file, key, fileHash)
      built += 1
    }
  }

  // Drop files from earlier runs that nothing references any more.
  const keep = new Set()
  for (const image of Object.values(manifest.images)) {
    for (const variant of [...Object.values(image.sources).flat(), ...image.fallback]) {
      keep.add(basename(variant.src))
    }
  }
  for (const url of Object.values(manifest.svg)) keep.add(basename(url))

  let removed = 0
  for (const name of readdirSync(OUT_DIR)) {
    if (!keep.has(name)) {
      rmSync(join(OUT_DIR, name), { force: true })
      removed += 1
    }
  }

  writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`)

  const total = Object.keys(manifest.images).length + Object.keys(manifest.svg).length
  console.log(
    `images: ${total} source file(s) — ${built} built, ${reused} unchanged` +
      (removed ? `, ${removed} stale file(s) removed` : ''),
  )
  if (total === 0) {
    console.log('         (drop images into src/assets/images/ and run `npm run images`)')
  }
}

run().catch((error) => {
  console.error(`\nimages: failed — ${error.message}\n`)
  process.exitCode = 1
})
