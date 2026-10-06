/* Every still ships at its native width plus an @2x copy (AI-upscaled with
   Real-ESRGAN, saved as WebP at quality 85). Spreading hiRes(src) into an
   <img> gives the browser both, and `sizes` on the element tells it which one
   the layout actually needs - phones keep the light file, Retina screens get
   the sharp one. */

const NATIVE_WIDTH = {
  products: 720,
  'collection-a': 520,
  'collection-b': 520,
  'collection-main': 1000,
  'maison-1': 600,
  'maison-2': 600,
  'maison-3': 600,
  'maison-4': 600,
}

export function hiRes(src) {
  const name = src.split('/').pop().replace(/\.webp$/, '')
  const width = NATIVE_WIDTH[name] || NATIVE_WIDTH[src.split('/').slice(-2)[0]]
  if (!width) return { src }
  const hd = src.replace(/\.webp$/, '@2x.webp')
  return { src, srcSet: src + ' ' + width + 'w, ' + hd + ' ' + width * 2 + 'w' }
}
