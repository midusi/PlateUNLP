# Intalacion y arranque

## Pre-requisitos

Previo a la ejecución de los comandos uno se tiene que asegurar de tener la herramienta _pnpm_ instalada.

## Desarrollo

Para levantar el entorno en desarrollo tener en cuenta los siguientes comandos.

Instalar dependencias:

```bash
pnpm install
```

Ejecutar:

```bash
pnpm dev
```

## Producción

Para levantar el entorno en producción tener en cuenta los siguientes comandos.

Coinstruir build:

```bash
pnpm build
```

Ejecutar:

```bash
pnpm start
```

## Docker

Se cuenta con un `Dockerfile` que permite crear una imagen del proyecto. Por ejemplo, ejecutando estos comandos se tiene una instancia de _PlateUNLP_:

```bash
docker build . -t plateunlp:latest
docker run --rm -it plateunlp:latest
```
