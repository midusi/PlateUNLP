/**
 * Cajas orientadas (OBB): rectangulos de `width` x `height` rotados `angle`
 * grados alrededor de su centro.
 *
 * Convencion (la de los modelos OBB y la de CSS `rotate`): el eje de `width`
 * apunta a `(cos a, sin a)` en coordenadas de imagen (y hacia abajo), asi que un
 * angulo positivo gira la caja en sentido horario.
 *
 * Las filas de `observation` y `spectrum` siguen guardando el rectangulo
 * envolvente alineado a los ejes (`imageLeft/Top/Width/Height`), que es el que
 * se recorta, y suman `imageAngle`. La caja orientada se deriva de ambos: su
 * centro es el del rectangulo y sus dimensiones salen de resolver
 * `W = w cos + h sin`, `H = w sin + h cos` (ver `boxFromExtent`). Una fila con
 * angulo 0 es una caja alineada, igual a su rectangulo.
 *
 * Nada de esto se guarda en disco como imagen: la mascara se deriva a pedido.
 */

/** Caja orientada: dimensiones propias y giro, sin posicion (el centro va aparte). */
export interface OrientedBox {
  width: number
  height: number
  /** Grados, sentido horario. */
  angle: number
}

/** Lo que guardan las filas de la base de datos sobre la caja orientada. */
export interface StoredBox {
  imageAngle?: number | null
}

/** Una caja con rectangulo envolvente y, si esta inclinada, su orientacion. */
export interface BoxGeometry extends StoredBox {
  imageLeft: number
  imageTop: number
  imageWidth: number
  imageHeight: number
}

/** Angulos por debajo de este valor (en grados) se tratan como una caja alineada. */
export const ANGLE_EPSILON = 1e-6

const toRadians = (degrees: number) => (degrees * Math.PI) / 180
const toDegrees = (radians: number) => (radians * 180) / Math.PI
const roundTo = (value: number, decimals: number) => {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

/**
 * Lleva una caja a la forma canonica: angulo en (-45, 45] e intercambiando ancho
 * y alto cuando hace falta. Un rectangulo girado 90 grados es el mismo con el
 * ancho y el alto cambiados, y el modelo devuelve angulos sin normalizar (se
 * observaron -1439.63 y -90.05 grados).
 */
export function normalizeOrientedBox(box: OrientedBox): OrientedBox {
  let { width, height } = box
  // Modulo 180: una caja rotada 180 grados es la misma. Rango [-90, 90).
  let angle = ((((box.angle + 90) % 180) + 180) % 180) - 90
  if (angle <= -45) {
    angle += 90
    ;[width, height] = [height, width]
  } else if (angle > 45) {
    angle -= 90
    ;[width, height] = [height, width]
  }
  return { width, height, angle }
}

/** Igual que `normalizeOrientedBox` pero con el angulo en radianes, como lo devuelve el modelo. */
export function normalizeOrientedBoxRadians(width: number, height: number, angleRad: number) {
  return normalizeOrientedBox({ width, height, angle: toDegrees(angleRad) })
}

/** Dimensiones del rectangulo alineado a los ejes que contiene a la caja. */
export function orientedBoxExtent(box: OrientedBox): { width: number; height: number } {
  const radians = toRadians(box.angle)
  const cos = Math.abs(Math.cos(radians))
  const sin = Math.abs(Math.sin(radians))
  return {
    width: box.width * cos + box.height * sin,
    height: box.width * sin + box.height * cos,
  }
}

/**
 * Caja orientada de angulo `angle` cuyo rectangulo envolvente mide `width` x `height`.
 * Invierte `orientedBoxExtent`: con |angulo| < 45 grados el sistema tiene solucion
 * unica. Con 0 grados (o cerca de 45, donde se vuelve inestable) es el rectangulo.
 */
export function boxFromExtent(width: number, height: number, angle: number): OrientedBox {
  const radians = toRadians(angle)
  const cos = Math.abs(Math.cos(radians))
  const sin = Math.abs(Math.sin(radians))
  const determinant = cos * cos - sin * sin
  if (determinant < 1e-3) return { width, height, angle }
  return {
    width: Math.max(1, (width * cos - height * sin) / determinant),
    height: Math.max(1, (height * cos - width * sin) / determinant),
    angle,
  }
}

/** Caja orientada que describe una fila, derivada de su rectangulo y su angulo. */
export function resolveOrientedBox(geometry: BoxGeometry): OrientedBox {
  return boxFromExtent(geometry.imageWidth, geometry.imageHeight, geometry.imageAngle ?? 0)
}

/** Una caja con angulo 0 es igual a su rectangulo: no hay nada que enmascarar. */
export function isAxisAligned(geometry: StoredBox): boolean {
  return Math.abs(geometry.imageAngle ?? 0) < ANGLE_EPSILON
}

/**
 * Mascara de un recorte de `width` x `height` px cuyo centro es el de la caja:
 * `mask[fila * width + columna]` es 1 si el centro del pixel cae dentro de la
 * caja, 0 si cae fuera (esquinas del rectangulo envolvente).
 *
 * Se recorre por filas: en una fila, las dos desigualdades de la caja son
 * lineales en x y dan un intervalo, que se rellena de una vez.
 */
export function buildBoxMask(width: number, height: number, box: OrientedBox): Uint8Array {
  const mask = new Uint8Array(width * height)
  const radians = toRadians(box.angle)
  const cos = Math.cos(radians)
  const sin = Math.sin(radians)
  const halfW = box.width / 2
  const halfH = box.height / 2
  const centerX = width / 2
  const centerY = height / 2
  // |angulo| <= 45 grados despues de normalizar, asi que cos > 0. Con angulos
  // mas grandes se vuelve a una caja equivalente, normalizada.
  if (Math.abs(cos) < 1e-9) return buildBoxMask(width, height, normalizeOrientedBox(box))

  for (let row = 0; row < height; row++) {
    const dy = row + 0.5 - centerY
    // along = dx * cos + dy * sin, en [-halfW, halfW]
    let low = (-halfW - dy * sin) / cos
    let high = (halfW - dy * sin) / cos
    if (cos < 0) [low, high] = [high, low]
    // across = -dx * sin + dy * cos, en [-halfH, halfH]
    if (Math.abs(sin) < 1e-12) {
      if (Math.abs(dy * cos) > halfH) continue
    } else {
      let acrossLow = (dy * cos - halfH) / sin
      let acrossHigh = (dy * cos + halfH) / sin
      if (acrossLow > acrossHigh) [acrossLow, acrossHigh] = [acrossHigh, acrossLow]
      low = Math.max(low, acrossLow)
      high = Math.min(high, acrossHigh)
    }
    if (low > high) continue
    // Pixeles cuyo centro (column + 0.5 - centerX) cae en [low, high].
    const first = Math.max(0, Math.ceil(low + centerX - 0.5))
    const last = Math.min(width - 1, Math.floor(high + centerX - 0.5))
    if (first > last) continue
    mask.fill(1, row * width + first, row * width + last + 1)
  }
  return mask
}

/** Mascara del recorte de una caja guardada, o `null` si esta alineada y no hay nada que tapar. */
export function buildGeometryMask(geometry: BoxGeometry): Uint8Array | null {
  if (isAxisAligned(geometry)) return null
  return buildBoxMask(
    Math.floor(geometry.imageWidth),
    Math.floor(geometry.imageHeight),
    resolveOrientedBox(geometry),
  )
}

/** Caja orientada ya ubicada: centro, dimensiones propias y giro. */
export interface PlacedBox extends OrientedBox {
  centerX: number
  centerY: number
}

/**
 * Ajusta una caja para que su rectangulo envolvente entre en `[0, limits.x] x
 * [0, limits.y]`: si no entra la acorta a lo largo de su ancho (y, si ni asi,
 * la achica entera), y despues la desplaza adentro.
 */
export function fitBoxInside(box: PlacedBox, limits: { x: number; y: number }): PlacedBox {
  const radians = toRadians(box.angle)
  const cos = Math.abs(Math.cos(radians))
  const sin = Math.abs(Math.sin(radians))
  let { width, height } = box
  const extent = orientedBoxExtent({ width, height, angle: box.angle })
  if (cos > 1e-9 && (extent.width > limits.x || extent.height > limits.y)) {
    // Ancho maximo con el que el alto de la caja entra en las dos direcciones.
    const maxWidth = Math.min(
      (limits.x - height * sin) / cos,
      sin > 1e-9 ? (limits.y - height * cos) / sin : Number.POSITIVE_INFINITY,
    )
    if (maxWidth >= 1) {
      width = Math.min(width, maxWidth)
    } else {
      const k = Math.min(limits.x / extent.width, limits.y / extent.height)
      width *= k
      height *= k
    }
  }
  const half = { x: (width * cos + height * sin) / 2, y: (width * sin + height * cos) / 2 }
  return {
    ...box,
    width,
    height,
    centerX: Math.min(Math.max(box.centerX, half.x), Math.max(half.x, limits.x - half.x)),
    centerY: Math.min(Math.max(box.centerY, half.y), Math.max(half.y, limits.y - half.y)),
  }
}

/**
 * Rectangulo entero `[left, right) x [top, bottom)` que contiene a la caja y esta
 * centrado en ella. Si el centro es multiplo de 0.5 (el de cualquier rectangulo
 * guardado) lo conserva exacto, eligiendo un tamaño de la misma paridad: asi girar
 * o redimensionar una caja nunca corre su centro.
 */
function boundsAroundCenter(box: PlacedBox): {
  left: number
  top: number
  right: number
  bottom: number
} {
  const extent = orientedBoxExtent(box)
  const span = (center: number, size: number): [number, number] => {
    if (!Number.isInteger(center * 2)) return [Math.round(center - size / 2), Math.round(center + size / 2)]
    const parity = (center * 2) % 2
    const length = Math.max(parity === 1 ? 1 : 2, parity + 2 * Math.round((size - parity) / 2))
    const start = center - length / 2
    return [start, start + length]
  }
  const [left, right] = span(box.centerX, extent.width)
  const [top, bottom] = span(box.centerY, extent.height)
  return { left, top, right, bottom }
}

/**
 * Gira una caja sobre su propio centro hasta `target`, o hasta el angulo mas cercano
 * (yendo desde `target` hacia el actual) con el que todavia entra en `limits`. La caja
 * no se corre: al llegar al borde de la imagen simplemente no gira mas, y si ninguno
 * entra queda como esta.
 *
 * Con `keepSpan` la caja conserva las rectas de sus extremos al girar (perpendiculares a
 * su eje original): se alarga o acorta sobre su eje en vez de ensancharse, como hacen los
 * espectros de una observacion, que comparten sus extremos.
 */
export function rotatePlacedBox(
  box: PlacedBox,
  target: number,
  limits: { x: number; y: number },
  keepSpan = false,
): PlacedBox {
  const ends = endLinesOf(box)
  const rotated = (angle: number): PlacedBox =>
    keepSpan ? extendBoxToLines({ ...box, angle }, ends) : { ...box, angle }
  const fits = (candidate: PlacedBox) => {
    const bounds = boundsAroundCenter(candidate)
    return bounds.left >= 0 && bounds.top >= 0 && bounds.right <= limits.x && bounds.bottom <= limits.y
  }
  let angle = target
  while (Math.abs(angle - box.angle) > 0.05) {
    const candidate = rotated(angle)
    if (fits(candidate)) return candidate
    angle = Math.round((angle + (box.angle > angle ? 0.1 : -0.1)) * 10) / 10
  }
  return box
}

/** Si el rectangulo envolvente de la caja ubicada entra en `[0, limits.x] x [0, limits.y]`. */
export function boxFitsInside(box: PlacedBox, limits: { x: number; y: number }): boolean {
  const extent = orientedBoxExtent(box)
  const epsilon = 1e-6
  return (
    box.centerX - extent.width / 2 >= -epsilon &&
    box.centerY - extent.height / 2 >= -epsilon &&
    box.centerX + extent.width / 2 <= limits.x + epsilon &&
    box.centerY + extent.height / 2 <= limits.y + epsilon
  )
}

/**
 * Rectas de borde compartidas por varias cajas: dos rectas perpendiculares a un eje de
 * direccion `angle` (grados). Un punto `p` esta en la de inicio si `p · (cos, sin) =
 * start`, y en la de fin si vale `end`. Los espectros de una observacion se alinean asi:
 * las lineas espectrales son perpendiculares a la dispersion, y dos puntos tienen la
 * misma longitud de onda si estan a la misma distancia sobre ese eje, no en la misma
 * columna `x`.
 */
export interface EndLines {
  angle: number
  start: number
  end: number
}

/** Direccion (cos, sin) de un angulo en grados. */
function directionOf(angle: number): [number, number] {
  const radians = toRadians(angle)
  return [Math.cos(radians), Math.sin(radians)]
}

/** Promedio de los angulos de un grupo de cajas, en grados. */
export function meanAngle(boxes: { angle: number }[]): number {
  return boxes.reduce((sum, box) => sum + box.angle, 0) / Math.max(1, boxes.length)
}

/** Rectas perpendiculares a `angle` que pasan por los dos extremos de la caja. */
export function endLinesOf(box: PlacedBox, angle: number = box.angle): EndLines {
  const [nx, ny] = directionOf(angle)
  const [dx, dy] = directionOf(box.angle)
  const center = box.centerX * nx + box.centerY * ny
  const half = (box.width / 2) * (dx * nx + dy * ny)
  return { angle, start: center - half, end: center + half }
}

/**
 * Alarga o acorta una caja sobre su eje hasta que sus extremos caigan en las rectas de
 * `lines`. Su inclinacion y su alto no cambian.
 */
export function extendBoxToLines(box: PlacedBox, lines: EndLines): PlacedBox {
  const [nx, ny] = directionOf(lines.angle)
  const [dx, dy] = directionOf(box.angle)
  const along = dx * nx + dy * ny
  const center = box.centerX * nx + box.centerY * ny
  const from = (lines.start - center) / along
  const to = (lines.end - center) / along
  return {
    ...box,
    width: Math.max(1, to - from),
    centerX: box.centerX + ((from + to) / 2) * dx,
    centerY: box.centerY + ((from + to) / 2) * dy,
  }
}

/**
 * Rectas de borde, perpendiculares a la inclinacion promedio del grupo, lo mas separadas
 * que permite el ancho `totalWidth` de la imagen: ninguna caja, alargada hasta ellas, se
 * sale por la izquierda ni por la derecha.
 */
export function endLinesWithin(boxes: PlacedBox[], totalWidth: number): EndLines {
  const angle = meanAngle(boxes)
  const [nx, ny] = directionOf(angle)
  let start = Number.NEGATIVE_INFINITY
  let end = Number.POSITIVE_INFINITY
  for (const box of boxes) {
    const [dx, dy] = directionOf(box.angle)
    // Punto del eje de la caja en x = 0 y en x = totalWidth, y su posicion sobre el eje del grupo.
    const atLeft = (0 - box.centerX) / dx
    const atRight = (totalWidth - box.centerX) / dx
    start = Math.max(start, (box.centerX + atLeft * dx) * nx + (box.centerY + atLeft * dy) * ny)
    end = Math.min(end, (box.centerX + atRight * dx) * nx + (box.centerY + atRight * dy) * ny)
  }
  return { angle, start, end }
}

/** Valores que se guardan en `observation` / `spectrum` para una caja ubicada. */
export interface StoredGeometry {
  imageLeft: number
  imageTop: number
  imageWidth: number
  imageHeight: number
  imageAngle: number
}

/**
 * Convierte una caja ubicada en lo que se guarda: el rectangulo envolvente,
 * entero y centrado en la caja, y el angulo. Las dimensiones propias no se guardan: se
 * derivan de ambos (`boxFromExtent`).
 */
export function toStoredGeometry(
  box: PlacedBox,
  limits?: { x: number; y: number },
  /** Si es false la caja no se achica ni se corre para entrar en `limits`: solo se recorta el rectangulo. */
  fit = true,
): StoredGeometry {
  const fitted = limits && fit ? fitBoxInside(box, limits) : box
  let { left, top, right, bottom } = boundsAroundCenter(fitted)
  if (limits) {
    left = Math.max(0, left)
    top = Math.max(0, top)
    right = Math.min(Math.floor(limits.x), right)
    bottom = Math.min(Math.floor(limits.y), bottom)
  }
  return {
    imageLeft: left,
    imageTop: top,
    imageWidth: Math.max(1, right - left),
    imageHeight: Math.max(1, bottom - top),
    imageAngle: Math.abs(fitted.angle) < ANGLE_EPSILON ? 0 : roundTo(fitted.angle, 4),
  }
}

/**
 * Columna de la caja orientada que corresponde a un rectangulo recibido de afuera.
 * Con angulo 0 la caja es el propio rectangulo.
 */
export function storedOrientation(input: StoredBox): { imageAngle: number } {
  return { imageAngle: isAxisAligned(input) ? 0 : (input.imageAngle ?? 0) }
}
