This directory contains the scripts to generate the initial version of immersion-db.

# Testing schema changes locally

1. Ensure that you have a `immersion-facile/.env` file containing at least the following environment variables:

   ```sh
   NODE_ENV=local
   REPOSTIORIES=PG
   PG_URL="postgresql://postgres:pg-password@postgres:5432/immersion-db"
   ```

1. Purge any existing database and bring up the docker-compose setup:

   ```sh
   immersion-facile$ docker-compose down --volumes
   immersion-facile$ rm -rf docker-data
   immersion-facile$ docker-compose up --build
   ```

   The local frontend can be reached at http://localhost:80
   The local adminer UI can be reached at http://localhost:80/__db__admin. To login, use the following parameters:

   - System: `PostgreSQL`
   - Server: `postgres:5432`
   - Username: `postgres`
   - Password: `pg-password`
   - Database: `immersion-db`
