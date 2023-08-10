# ![RealWorld Example App](logo.png)

> ### NextJS + tRPC + Prisma codebase containing real world examples (CRUD, auth, advanced patterns, etc) that adheres to the [RealWorld](https://github.com/gothinkster/realworld) spec and API.


### [Demo](https://demo.realworld.io/)&nbsp;&nbsp;&nbsp;&nbsp;[RealWorld](https://github.com/gothinkster/realworld)


This codebase was created to demonstrate a fully fledged fullstack application built with **NextJS + tRPC + Prisma** including CRUD operations, authentication, routing, pagination, and more.

We've gone to great lengths to adhere to the **NextJS + tRPC + Prisma** community styleguides & best practices.

For more information on how to this works with other frontends/backends, head over to the [RealWorld](https://github.com/gothinkster/realworld) repo.


# How it works

This project uses NextJS and its pages router to serve a React frontend. The backend utilizes tRPC, which usually does not expose a usable REST API, which is required by the RealWorld specs, therefor [trpc-openai](https://github.com/prosepilot/trpc-openapi) is used to create a REST API and also generate a Swagger UI.

The database is managed by Prisma; for simplicity’s sake it uses a sqlite database, but it can be easily changed to any other database supported by Prisma.

# Project Structure

- `prisma` - The Prisma schema and sqlite database
- `public` - Static assets
- `src` - The NextJS application
  - `components` - React components used in the pages
  - `pages` - NextJS pages & api route setup
  - `server` - Setup for the database and tRPC router
  - `styles` - Official RealWorld css styles
- `test` - Tests (includes the official RealWorld api postman tests)

# Getting started

Install all the dependencies, this will also set up the prisma sqlite database.

```bash
pnpm install
```

To run the application in development mode:

```bash
pnpm dev
```
