# PlateUNLP

*PlateUNLP* is a software specialized in the digitization and processing of spectroscopic information on glass plates.

## Documentation

The `docs` folder contains descriptions of how to perform operations in each section of *PlateUNLP*. The webpage documentation (recommended method) is enabled when the application is launched, by default at `http://localhost:3054/docs`.

## Development

To develop this project locally, you'll need [Node.js v22](https://nodejs.org/) and [pnpm v10](https://pnpm.io/). After you have cloned the repository, run the following commands to set up your environment:

```bash
pnpm db:init  # To initialize and seed the database
pnpm dev      # To start the development server
```

## Deployment

*PlateUNLP* is designed to be easily deployed using Docker. The project includes a `Dockerfile` that allows you to create a Docker image of the application. For example, running the following commands will give you a running instance of *PlateUNLP*:

```bash
docker build . -t plateunlp:latest
docker run --rm -it -p 3000:3000 plateunlp:latest
```

## DB manegement

```bash
pnpm db:generate ['migration-name']
pnpm db:migrate 
```

Delete DB

```bash

```
