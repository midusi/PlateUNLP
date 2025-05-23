# @plateunlp/app

Frontend de PlateUNLP. Se trata de una app React con Vite como bundler. Se utiliza [Vinxi](https://vinxi.vercel.app/) para servir la app estática y el server dinámico ([@plateunlp/server](../server/README.md)).

## Servidor

El servidor se encuentra en [`server/`](./server/). Se basa en endpoints de [tRPC v11](https://trpc.io/). No se recomienda su uso directo, sino a través de la interfaz web.

## Base de datos

Para generar la base de datos, ejecutar el siguiente comando:

```bash
pnpm db:dev
```

Esto creará una base de datos y hará un seed de la misma.
