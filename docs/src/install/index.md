# Instalación y arranque

## Pre-requisitos

Antes de ejecutar los comandos, asegurar tener instalada la herramienta _pnpm_.

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

Para levantar el entorno en producción, usar los siguientes comandos.

Coinstruir build:

```bash
pnpm build
```

Ejecutar:

```bash
pnpm start
```

## Docker

Se cuenta con un `Dockerfile` que permite crear una imagen del proyecto. Por ejemplo, ejecutar estos comandos inicia una instancia de _PlateUNLP_:

```bash
docker build . -t plateunlp:latest
docker run --rm -it plateunlp:latest
```
