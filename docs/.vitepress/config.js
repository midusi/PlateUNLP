import markdownItFootnote from "markdown-it-footnote"
import { defineConfig } from "vitepress"

export default defineConfig({
  title: "PlateUNLP Docs",
  titleTemplate: ":title /// PlateUNLP",
  lang: "es-AR",
  base: "/docs/",
  cleanUrls: true,

  srcDir: "./src",
  outDir: "./dist",

  appearance: true,
  lastUpdated: true,
  markdown: {
    math: true,
    config: (md) => {
      md.use(markdownItFootnote)
    },
  },

  themeConfig: {
    sidebar: [
      {
        text: "Guide",
        items: [
          { text: "Introducción", link: "/" },
          {
            text: "Distribución de Componentes",
            link: "/component-distribution",
          },
          { text: "Metadatos de Placa", link: "/plate-metadata" },
          { text: "Segmentación de Placa", link: "/plate-segmentation" },
          { text: "Elección de espectro", link: "/spectrum-selection" },
          { text: "Metadatos de Espectro", link: "/spectrum-metadata" },
          { text: "Segmentación de Espectro", link: "/spectrum-segmentation" },
          {
            text: "Extracción de Caracteristicas",
            link: "/feature-extraction",
          },
          {
            text: "Calibración en Longitud de Onda",
            link: "/wavelength-calibration",
          },
        ],
      },
      {
        text: "Technical information",
        items: [{ text: "Instalación", link: "/Install" }],
      },
      {
        text: "Other topics",
        items: [
          { text: "Detector de Espectro", link: "/spectrum-detector" },
          {
            text: "Detector de Partes de Espectro",
            link: "/spectrum-part-detector",
          },
          {
            text: "Funciones de Interpolación",
            link: "/interpolation-functions",
          },
        ],
      },
      {
        text: "Reference",
        items: [
          {
            text: "Astronomical calculations",
            link: "/reference/astronomical",
          },
        ],
      },
    ],
    socialLinks: [{ icon: "github", link: "https://github.com/midusi/PlateUNLP" }],
    footer: {
      message: `This work is licensed under <a target="_blank" rel="license noopener noreferrer" href="http://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a>.`,
    },
    editLink: {
      pattern: "https://github.com/midusi/PlateUNLP/edit/main/docs/src/:path",
    },
  },
})
