export default {
    themeConfig: {
        sidebar: [
            {
                text: 'Guide',
                items: [
                    { text: 'Introducción', link: '/' },
                    { text: 'Instalación', link: '/Install' },
                    { text: 'Distribución de Componentes', link: '/component-distribution' },
                    { text: 'Metadatos de Placa', link: '/plate-metadata' },
                    { text: 'Segmentación de Placa', link: '/plate-segmentation' },
                    { text: 'Elección de espectro', link: '/spectrum-selection' },
                    { text: 'Metadatos de Espectro', link: '/spectrum-metadata' },
                    { text: 'Segmentación de Espectro', link: '/spectrum-segmentation' },
                    { text: 'Extracción de Caracteristicas', link: '/feature-extraction' },
                ],
            }
        ]
    },
    markdown: {
        math: true
    }
}