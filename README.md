# finnest [![CI](https://github.com/SeinopSys/finnest/actions/workflows/ci.yml/badge.svg)](https://github.com/SeinopSys/finnest/actions/workflows/ci.yml)

## Description

Simple stock checker application written in Nest.js

## Project setup

For local development use the included `docker-compose.dev.yml` file:

```bash
$ docker compose -f docker-compose.dev.yml up --build
```

This will start the application in watch mode, as well as a dedicated database server.

To clean up the containers, run:

```bash
$ docker compose -f docker-compose.dev.yml down
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## View API documentation

This project uses [@nestjs/wswagger](https://docs.nestjs.com/openapi/introduction). Once the app is running navigate to http://localhost:3000/api to check the API documentation via the Swagger UI.

## Deployment

Use the included `docker-compose.yml` file to create a production deployment.
