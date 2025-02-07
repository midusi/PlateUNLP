# PlateUNLP

_PlateUNLP_ es un software especializado en la digitalización y procesamiento de información espectroscópica en placas de vidrio.

Este resuelve el pipeline completo de procesamiento incorporando automatizaciones variadas que permiten al usuario acelerar el flujo de trabajo de cada placa.

## Funcionamiento

El input principal que espera el software es un escaneo de una placa espectroscópica, en base a este se pasará por varias etapas para lograr su digitalización (formato FITS). También se pueden procesar los datos digitalizados hasta conseguir los datos del espectro de ciencia y los espectro de lámparas calibrados (formato FITS).

## Comandos

- Previo a la ejecución de los comandos uno se tiene que asegurar de tener la herramienta _pnpm_ instalada en su sistema.

### Desarrollo

Para levantar el entorno en desarrollo tener en cuenta los siguientes comandos.

Instalar dependencias:

```bash
pnpm install
```

Ejecutar:

```bash
pnpm dev
```

### Producción

Para levantar el entorno en producción tener en cuenta los siguientes comandos.

Coinstruir build:

```bash
pnpm build
```

Ejecutar:

```bash
pnpm start
```

---
---

# Para desarrolladores

Algunas consideraciones especiales que se deben tener en cuenta durante el trabajo de desarrollo.

## Inferencia de modelos funcional solo en Producción.

Las funcionalidades relacionadas al reconocimiento de objetos en imágenes se ejecutan en su totalidad en el Frontend. Gracias a esto no se requiere de ningún tipo de Backend.

Si va a trabajar con las funcionalidades de detección de objetos tenga en cuenta que ⚠ Estas funcionalidades no funcionan en Desarrollo, 🔧 asegurarse de levantar Producción si pretende testearlas.