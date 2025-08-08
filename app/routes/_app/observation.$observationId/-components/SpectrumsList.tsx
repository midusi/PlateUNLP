import { useMutation } from "@tanstack/react-query"
import { useRouter } from "@tanstack/react-router"
import * as tf from "@tensorflow/tfjs"
import { useEffect, useState } from "react"
import { type BoundingBox, BoundingBoxer } from "~/components/BoundingBoxer"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Separator } from "~/components/ui/separator"
import { Table, TableBody, TableCell, TableRow } from "~/components/ui/table"
import { usePredictBBs } from "~/hooks/use-predict-BBs"
import { notifyError } from "~/lib/notifications"
import { cn, idToColor } from "~/lib/utils"
import { type BBClassesProps, classesSpectrumDetection } from "~/types/BBClasses"
import { addSpectrum } from "../-actions/add-spectrum"
import { addSpectrums } from "../-actions/add-spectrums"
import type { getSpectrums } from "../-actions/get-spectrums"
import { updateSpectrum } from "../-actions/update-spectrum"

export type Spectrum = Awaited<ReturnType<typeof getSpectrums>>[number]

export function spectrumToBoundingBox(spectrum: Spectrum): BoundingBox {
  return {
    id: spectrum.id,
    name: "",
    color: idToColor(spectrum.id),
    top: spectrum.imageTop,
    left: spectrum.imageLeft,
    width: spectrum.imageWidth,
    height: spectrum.imageHeight,
  }
}

export function SpectrumsList({
  observationId,
  initialSpectrums,
}: {
  observationId: string
  initialSpectrums: Spectrum[]
}) {
  const router = useRouter()

  const [boundingBoxes, setBoundingBoxes] = useState<BoundingBox[]>(
    initialSpectrums.map(spectrumToBoundingBox),
  )

  const determineBBFunction = usePredictBBs(
    1088,
    "spectrum_part_segmentator.onnx",
    classesSpectrumDetection,
    false,
    0.7,
  )

  // const [predictions, setPredictions] = useState<BoundingBox[]>([]);
  // useEffect(() => {
  // 	const loadModel = async () => {
  // 		const input_height = 1088;
  // 		const input_width = 1088;
  // 		const forceMaxWidth = true;
  // 		const CONFIDENCE_THRESHOLD = 0.7;
  // 		const CLASSES = classesSpectrumDetection;
  // 		const model = await tf.loadGraphModel(
  // 			"/models/spectrum_part_segmentator_tfjs/model.json",
  // 		);
  // 		// podés guardar el modelo en un state si lo necesitás
  // 		console.log("Modelo cargado:", model);

  // 		const img = new Image();
  // 		img.src = `/observation/${observationId}/preview`;
  // 		await new Promise((resolve, reject) => {
  // 			img.onload = resolve;
  // 			img.onerror = reject;
  // 		});

  // 		let tensor = tf.browser.fromPixels(img, 3).toFloat();
  // 		tensor = tf.image.resizeNearestNeighbor(tensor, [
  // 			input_height,
  // 			input_width,
  // 		]);
  // 		tensor = tensor.div(255);

  // 		tensor = tensor.expandDims(0); // (1, 1088, 1088, 3)
  // 		tensor = tensor.transpose([0, 3, 1, 2]); // (1, 3, 1088, 1088)

  // 		let output = model.predict(tensor) as tf.Tensor;
  // 		output = output.reshape(output.shape); // (1, 6:atributos, x:predicciones)
  // 		output = output.squeeze(); // (6, x:predicciones)
  // 		const scores = output.gather(4); // Vector de atributo 5 (probabilidades)
  // 		const mask = scores.greater(tf.scalar(CONFIDENCE_THRESHOLD)); // Vector de ejemplos que cumplen
  // 		output = await tf.booleanMaskAsync(output, mask, 1); // Filtra ejemplos que no cumplen con confianza minima
  // 		const boundingBoxArr: number[][] = output
  // 			.transpose()
  // 			.arraySync() as number[][]; // (x, 6)
  // 		const maped = boundingBoxArr.map((bb, idx) => {
  // 			const xc: number = bb[0];
  // 			const yc: number = bb[1];
  // 			let w: number = bb[2];
  // 			let h: number = bb[3];
  // 			const prob: number = bb[4];
  // 			const class_id: number = Math.round(bb[5]);

  // 			let x1 = xc - w / 2;
  // 			let y1 = yc - h / 2;

  // 			// Escalado
  // 			x1 = x1 * (img.naturalWidth / input_width);
  // 			y1 = y1 * (img.naturalHeight / input_width);
  // 			w = w * (img.naturalWidth / input_width);
  // 			h = h * (img.naturalHeight / input_width);

  // 			// Modificacion para que el ancho valla hasta los extremos
  // 			if (forceMaxWidth) {
  // 				x1 = 0;
  // 				w = img.naturalWidth;
  // 			}
  // 			return {
  // 				id: `${idx}`,
  // 				name: "",
  // 				top: y1,
  // 				left: x1,
  // 				width: w,
  // 				height: h,
  // 				color: CLASSES[class_id].color,
  // 				prob,
  // 			};
  // 		});
  // 		const sorted = maped.sort((bb1, bb2) => bb2.prob - bb1.prob);
  // 		setPredictions(sorted);
  // 	};

  // 	loadModel().catch(console.error);

  // 	return () => {};
  // }, [observationId]);

  const determineBBMut = useMutation({
    mutationFn: async () => {
      /** Obtener ancho de la imagen */
      const img = new Image()
      img.src = `/observation/${observationId}/preview`
      img.onload = async () => {
        /** Obtener predicciones */
        /** Obtener predicciones */
        const boundingBoxes = await determineBBFunction(`/observation/${observationId}/preview`)
        //const boundingBoxes = predictions;
        /** Actualizar base de datos */
        const science = {
          imageTop: boundingBoxes[0].y, //.top
          imageLeft: 0, // Forzar ancho maximo
          imageWidth: img.naturalWidth, // Forzar ancho maximo
          imageHeight: boundingBoxes[0].height,
        }
        const lamp1 = {
          imageTop: boundingBoxes[1].y, //.top
          imageLeft: 0, // Forzar ancho maximo
          imageWidth: img.naturalWidth, // Forzar ancho maximo
          imageHeight: boundingBoxes[1].height,
        }
        const lamp2 = {
          imageTop: boundingBoxes[2].y, //.top
          imageLeft: 0, // Forzar ancho maximo
          imageWidth: img.naturalWidth, // Forzar ancho maximo
          imageHeight: boundingBoxes[2].height,
        }
        const newSpectrums = await addSpectrums({
          data: { observationId, science, lamp1, lamp2 },
        })
        router.invalidate()
        const boundingBoxesFormated = [
          spectrumToBoundingBox(newSpectrums.science),
          spectrumToBoundingBox(newSpectrums.lamp1),
          spectrumToBoundingBox(newSpectrums.lamp2),
        ]
        setBoundingBoxes((prev) => [...boundingBoxesFormated, ...prev])
      }
    },
    onError: (error) => notifyError("Error determine bounding boxes", error),
  })

  const addSpectrumMut = useMutation({
    mutationFn: async (boundingBox: Pick<BoundingBox, "top" | "left" | "width" | "height">) => {
      const spectrum = await addSpectrum({ data: { ...boundingBox, observationId } })
      setBoundingBoxes((prev) => [spectrumToBoundingBox(spectrum), ...prev])
    },
    onError: (error) => notifyError("Error adding spectrum", error),
  })

  return (
    <Card className="overflow-hidden p-0">
      <CardContent className="grid h-[500px] grid-cols-[1fr_300px] p-0">
        <BoundingBoxer
          imageSrc={`/observation/${observationId}/preview`}
          boundingBoxes={boundingBoxes}
          onBoundingBoxChange={(boundingBox) => {
            setBoundingBoxes((prev) =>
              prev.map((box) => (box.id === boundingBox.id ? { ...box, ...boundingBox } : box)),
            )
          }}
          onBoundingBoxChangeEnd={async (boundingBox) => {
            await updateSpectrum({
              data: {
                spectrumId: boundingBox.id,
                imageTop: boundingBox.top,
                imageLeft: boundingBox.left,
                imageWidth: boundingBox.width,
                imageHeight: boundingBox.height,
              },
            })
            router.invalidate()
          }}
          onBoundingBoxAdd={(boundingBox) => addSpectrumMut.mutate(boundingBox)}
        >
          <Button
            size="sm"
            variant="default"
            disabled={addSpectrumMut.isPending || determineBBMut.isPending}
            onClick={() => determineBBMut.mutate()}
            className="h-7"
          >
            <span
              className={cn(
                determineBBMut.isPending
                  ? "icon-[ph--spinner-bold] animate-spin"
                  : "icon-[ph--magic-wand-bold]",
              )}
            />
            Autodetect
          </Button>
        </BoundingBoxer>
        <div className="border-l">
          <CardHeader className="p-2">
            <CardTitle>Spectrums</CardTitle>
          </CardHeader>
          <Separator />
          <Table>
            <TableBody>
              {boundingBoxes.map((boundingBox) => (
                <TableRow key={boundingBox.id}>
                  <TableCell className="font-medium"></TableCell>
                  <TableCell>{boundingBox.name}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
