import { useMeasure } from "@uidotdev/usehooks";
import { AxisBottom, AxisLeft } from "@visx/axis";
import { curveLinear } from "@visx/curve";
import { localPoint } from "@visx/event";
import { GridColumns, GridRows } from "@visx/grid";
import { Group } from "@visx/group";
import { scaleLinear } from "@visx/scale";
import { Bar, Line, LinePath } from "@visx/shape";
import { defaultStyles, TooltipWithBounds, useTooltip } from "@visx/tooltip";
import * as d3 from "@visx/vendor/d3-array";
import { useCallback, useMemo } from "react";
import { materialsPalette } from "~/lib/materials-palette";
import type { SpectrumPoint } from "~/lib/spectral-data";

// data accessors
const getX = (p: SpectrumPoint) => p.wavelength ?? 0;
const getY = (p: SpectrumPoint) => p.intensity ?? 0;

const height = 150;
const margin = { top: 6, right: 0, bottom: 40, left: 0 };

const tooltipStyles = {
	...defaultStyles,
	background: "#3b6978",
	border: "1px solid white",
	color: "white",
};

type ReferenceLampSpectrumProps = {
	minWavelength: number;
	maxWavelength: number;
	material: string;
	materialArr: {
		wavelength: number;
		material: string;
		intensity: number;
	}[];
	onlyOneLine: boolean;
	materialPoints: { x: number; y: number }[];
	setMaterialPoints: (arr: { x: number; y: number }[]) => void;
};

export function ReferenceLampSpectrum({
	minWavelength,
	maxWavelength,
	material,
	materialArr,
	onlyOneLine,
	materialPoints,
	setMaterialPoints,
}: ReferenceLampSpectrumProps) {
	const { materialArrInRange, materialArrForLabel } = useMemo(() => {
		/** Arreglo de todos los registros que encajan en el rango seleccionado */
		const materialArrInRange = materialArr.filter(
			(mp) => getX(mp) >= minWavelength && getX(mp) <= maxWavelength,
		);

		/** Arreglo de intensidades de materiales separados por etiquetas */
		let materialArrForLabel: {
			label: string;
			arr: {
				wavelength: number;
				material: string;
				intensity: number;
			}[];
		}[];
		if (onlyOneLine) {
			materialArrForLabel = [
				{
					label: material,
					arr: materialArrInRange,
				},
			];
		} else {
			/** Listado de etiquetas encontradas en el arreglo de materiales */
			const labels = new Set(materialArr.map((ma) => ma.material));
			/** Separar arreglo por etiqueta */
			materialArrForLabel = Array.from(labels).map((label) => ({
				label: label,
				arr: materialArrInRange.filter((p) => p.material === label),
			}));
		}

		return {
			materialArrInRange,
			materialArrForLabel,
		};
	}, [materialArr, minWavelength, maxWavelength, onlyOneLine, material]);

	// bounds
	const [measureRef, measured] = useMeasure<HTMLDivElement>();
	const width = measured.width ?? 0;
	const xMax = Math.max(width - margin.left - margin.right, 0);
	const yMax = Math.max(height - margin.top - margin.bottom, 0);

	const {
		tooltipData,
		tooltipLeft,
		tooltipTop: _tooltipTop,
		showTooltip,
		hideTooltip,
	} = useTooltip<{
		wavelength: number;
		intensity: number;
	}>();

	const wavelengthScale = useMemo(
		() =>
			scaleLinear({
				range: [0, width - margin.right - margin.left],
				domain: [minWavelength, maxWavelength],
			}),
		[minWavelength, maxWavelength, width],
	);

	const wavelengthBisector = d3.bisector<
		{
			wavelength: number;
			material: string;
			intensity: number;
		},
		number
	>((d) => d.wavelength).right;

	const intensityScale = useMemo(
		() =>
			scaleLinear({
				range: [height - margin.bottom - margin.top, 0],
				domain: [0, (d3.max(materialArr, getY) || 1) * 1.1],
				nice: true,
			}),
		[materialArr],
	);

	const handleTooltip = useCallback(
		(
			event:
				| React.TouchEvent<SVGRectElement>
				| React.MouseEvent<SVGRectElement>,
		) => {
			let { x } = localPoint(event) || { x: 0 };
			x = x - margin.right - margin.left;
			const x0 = wavelengthScale.invert(x);
			const index = wavelengthBisector(materialArr, x0);
			const d0 = materialArr[index - 1];
			const d1 = materialArr[index];
			/** Elegir el elemento mas cercano */
			let d = d0;
			let interpolatedX: number | undefined;
			let interpolatedY:
				| number
				| undefined; /* Da problemas con mas de un elemento */
			if (d1 && getX(d1)) {
				const x0v = x0.valueOf();
				const x0d = getX(d0).valueOf();
				const x1d = getX(d1).valueOf();

				d = x0v - x0d > x1d - x0v ? d1 : d0;

				const y0d = getY(d0);
				const y1d = getY(d1);

				/** Si x0 está entre d0 y d1, interpolar */
				const t = (x0v - x0d) / (x1d - x0d);
				interpolatedX = x0d + t * (x1d - x0d);
				interpolatedY = y0d + t * (y1d - y0d);
			}

			showTooltip({
				tooltipData: {
					wavelength: interpolatedX ?? d.wavelength,
					/* Da problemas con mas de un elemento */
					intensity: interpolatedY ?? d.intensity,
				},
				tooltipLeft: x,
				/* Da problemas con mas de un elemento */
				tooltipTop: intensityScale(interpolatedY ?? getY(d)),
			});
		},
		[
			materialArr,
			showTooltip,
			intensityScale,
			wavelengthScale,
			wavelengthBisector,
		],
	);

	/** Manejar click en el grafico */
	function onClick(event: React.MouseEvent<Element>) {
		const svgRect = event.currentTarget.getBoundingClientRect();
		const xClick = event.clientX - svgRect.left - margin.left;
		const xVal = wavelengthScale.invert(xClick);

		setMaterialPoints([
			...materialPoints,
			{
				x: xVal,
				y: 0, // El registro de intensidad se esta desperdiciando
			},
		]);
	}

	/** Permite al usuario borrar las longitudes de onda que marco */
	function handleUserMarkDelete(x: number) {
		setMaterialPoints(materialPoints.filter((mp) => mp.x !== x));
	}

	return (
		<div
			ref={measureRef}
			className="relative"
			style={{ height: `${height}px` }}
		>
			<svg width={width} height={height} role="img" aria-label="Lamp Spectrum">
				<Group top={margin.top} left={margin.left}>
					<rect
						x={margin.right}
						y={0}
						width={Math.max(width - margin.right - margin.left, 0)}
						height={Math.max(height - margin.bottom - margin.top, 0)}
						fill="#374151"
						rx={1}
					/>
					<GridColumns
						scale={wavelengthScale}
						width={xMax}
						height={yMax}
						stroke="rgba(255,255,255,0.15)"
					/>
					<GridRows
						scale={intensityScale}
						width={xMax}
						height={yMax}
						stroke="rgba(255,255,255,0.15)"
					/>
					{/* Espectro en relacion a cada material */}
					{materialArrForLabel.map((item, index) => (
						<LinePath<SpectrumPoint>
							key={`material_line-${item.label}`}
							curve={curveLinear}
							data={item.arr}
							x={(p) => wavelengthScale(getX(p))}
							y={(p) => intensityScale(getY(p))}
							shapeRendering="geometricPrecision"
							className="stroke-1"
							stroke={materialsPalette[index % materialsPalette.length]}
						/>
					))}
					{/** Capturar eventos del mouse */}
					<Bar
						x={0}
						y={0}
						width={width - margin.right - margin.left}
						height={height - margin.bottom - margin.top}
						fill="transparent"
						rx={14}
						onClick={onClick}
						onTouchStart={handleTooltip}
						onTouchMove={handleTooltip}
						onMouseMove={handleTooltip}
						onMouseLeave={() => hideTooltip()}
					/>
					{/* Referencia visual de lo que se va a seleccionar */}
					{tooltipData && (
						<g>
							<Line
								from={{ x: tooltipLeft ?? -1, y: 0 }}
								to={{
									x: tooltipLeft ?? -1,
									y: height - margin.bottom - margin.top,
								}}
								stroke="#3B82F6"
								strokeWidth={2}
								pointerEvents="none"
								strokeDasharray="5,2"
							/>
							{/* Punto señalador de intensidad, da problemas con mas de un elemento */}
							{/* <circle
								cx={(tooltipLeft ?? -1)}
								cy={(tooltipTop ?? -1) - margin.top}
								r={4}
								fill="#75daad"
								stroke="white"
								strokeWidth={2}
								pointerEvents="none"
							/> */}
						</g>
					)}

					{/* Longitudes de onda marcadas por el usuario */}
					{materialPoints.map((mp, idx) => {
						if (
							materialArrInRange.length > 0 &&
							materialArrInRange[0].wavelength <= mp.x &&
							mp.x <=
								materialArrInRange[materialArrInRange.length - 1].wavelength
						) {
							const xClick = wavelengthScale(mp.x);

							return (
								<g key={`ReferenceLampSpectrumLine-${mp.x}`}>
									<Line
										x1={xClick}
										y1={0} // Valor inicial en el eje y
										x2={xClick}
										y2={height - margin.bottom - margin.top} // Altura del gráfico
										stroke="#FFFFFF"
										strokeWidth={2}
										strokeDasharray="5,2" // Define el patrón de punteado
									/>
									{/** biome-ignore lint/a11y/noStaticElementInteractions: <explanation> */}
									<rect // Area cliqueable
										x={xClick - 2}
										y={0}
										width={4}
										height={height - margin.bottom - margin.top}
										fill="transparent"
										onClick={(e) => {
											e.stopPropagation();
											handleUserMarkDelete(mp.x);
										}}
										style={{
											cursor:
												"url('data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 height=%2216%22 width=%2216%22><text y=%2214%22 font-size=%2216%22 fill=%22red%22>✖</text></svg>') 8 8, not-allowed",
										}}
									/>
									<text
										x={xClick + 5}
										y={10}
										fill="#FFFFFF"
										fontSize="12"
										fontFamily="Arial, sans-serif"
									>
										#{`${idx}`}
									</text>
								</g>
							);
						}
					})}

					<AxisBottom
						scale={wavelengthScale}
						top={yMax}
						label="Wavelength (Å)"
						numTicks={Math.floor(xMax / 80)}
					/>
				</Group>

				<Group top={margin.top} left={width - margin.right - 100}>
					{materialArrForLabel.map((item, index) => (
						<Group top={index * 20} key={`legend-item-${item.label}`}>
							<rect
								width={15}
								height={15}
								fill={materialsPalette[index % materialsPalette.length]}
							/>
							<text x={20} y={12} fontSize={12} fill="#FFFFFF">
								{item.label}
							</text>
						</Group>
					))}
				</Group>
			</svg>
			{tooltipData && (
				<div>
					<TooltipWithBounds
						key={Math.random()}
						top={(height - margin.top - margin.bottom) / 10}
						left={(tooltipLeft ?? 0) + margin.left + margin.top}
						style={tooltipStyles}
					>
						{`Å ${tooltipData.wavelength}`}
					</TooltipWithBounds>
				</div>
			)}
		</div>
	);
}
