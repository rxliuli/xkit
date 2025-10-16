/**
 * Converts an image URL to base64 format
 */
async function convertImageToBase64(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Unable to create canvas context'))
        return
      }
      ctx.drawImage(img, 0, 0)
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = url
  })
}

/**
 * Converts SVG element to PNG base64 data URL
 * @param svgSelector - CSS selector for the SVG element
 * @param options - Configuration options
 * @returns Promise resolving to base64 data URL
 */
export async function svgToPNGBase64(
  svgSelector: string,
  options: {
    scale?: number
    backgroundColor?: string
  } = {},
): Promise<string> {
  const { scale = 2, backgroundColor = '#f8fafc' } = options

  const svgElement = document.querySelector(svgSelector) as SVGSVGElement
  if (!svgElement) {
    throw new Error('SVG element not found')
  }

  // Clone SVG to avoid modifying the original
  const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement

  // Convert all image URLs to base64
  const imageElements = clonedSvg.querySelectorAll('image')
  const imagePromises = Array.from(imageElements).map(async (img) => {
    const href = img.getAttribute('href') || img.getAttribute('xlink:href')
    if (href && href.startsWith('http')) {
      try {
        const base64 = await convertImageToBase64(href)
        img.setAttribute('href', base64)
      } catch (error) {
        console.warn('Skip image conversion:', href, error)
      }
    }
  })

  await Promise.all(imagePromises)

  // Get SVG dimensions
  const svgRect = svgElement.getBoundingClientRect()
  const svgData = new XMLSerializer().serializeToString(clonedSvg)

  // Create canvas
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Unable to create canvas context')
  }

  // Set canvas dimensions
  canvas.width = svgRect.width * scale
  canvas.height = svgRect.height * scale
  ctx.scale(scale, scale)

  // Set background color
  ctx.fillStyle = backgroundColor
  ctx.fillRect(0, 0, svgRect.width, svgRect.height)

  // Create image and draw
  return new Promise((resolve, reject) => {
    const img = new Image()
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(svgBlob)

    img.onload = () => {
      ctx.drawImage(img, 0, 0, svgRect.width, svgRect.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/png', 0.95))
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load SVG image'))
    }

    img.src = url
  })
}

/**
 * Exports SVG element as a PNG file download
 * @param svgSelector - CSS selector for the SVG element
 * @param filename - Name of the downloaded file
 * @param options - Configuration options
 */
export async function exportSVGToPNG(
  svgSelector: string,
  filename: string,
  options?: {
    scale?: number
    backgroundColor?: string
  },
): Promise<void> {
  const imageBase64 = await svgToPNGBase64(svgSelector, options)

  // Download image
  const link = document.createElement('a')
  link.download = filename
  link.href = imageBase64
  link.click()
}
