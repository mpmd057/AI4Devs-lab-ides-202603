# LTI - Talent Tracking System  | EN

This project is a full-stack application with a React frontend and an Express backend using Prisma as an ORM. The frontend is initiated with Create React App, and the backend is written in TypeScript.

## Directory and File Explanation

- `backend/`: Contains the server-side code written in Node.js.
  - `src/`: Contains the source code for the backend.
    - `index.ts`:  The entry point for the backend server.
  - `prisma/`: Contains the Prisma schema file for ORM.
  - `tsconfig.json`: TypeScript configuration file.
  - `.env`: Contains the environment variables.
- `frontend/`: Contains the client-side code written in React.
  - `src/`: Contains the source code for the frontend.
  - `public/`: Contains static files such as the HTML file and images.
  - `build/`: Contains the production-ready build of the frontend.
- `docker-compose.yml`: Contains the Docker Compose configuration to manage your application's services.
- `README.md`: This file contains information about the project and instructions on how to run it.

## Project Structure

The project is divided into two main directories: `frontend` and `backend`.

### Frontend

The frontend is a React application, and its main files are located in the `src` directory. The `public` directory contains static assets, and the build directory contains the production `build` of the application.

### Backend

El backend es una aplicación Express escrita en TypeScript.
- The `src` directory contains the source code
- The `prisma` directory contains the Prisma schema.

## First steps

To get started with this project, follow these steps:

1. Clone the repo
2. install the dependencias for frontend and backend
```sh
cd frontend
npm install

cd ../backend
npm install
```
3. Build the backend server
```
cd backend
npm run build
````
4. Run the backend server
```
cd backend
npm run dev 
```

5. In a new terminal window, build the frontend server:
```
cd frontend
npm run build
```
6. Start the frontend server
```
cd frontend
npm start
```

The backend server will be running at http://localhost:3010, and the frontend will be available at http://localhost:3000.

## Docker y PostgreSQL

This project uses Docker to run a PostgreSQL database. Here's how to get it up and running:

Install Docker on your machine if you haven't done so already. You can download it here.
Navigate to the root directory of the project in your terminal.
Run the following command to start the Docker container:
```
docker-compose up -d
```
This will start a PostgreSQL database in a Docker container. The -d flag runs the container in detached mode, meaning it runs in the background.

To access the PostgreSQL database from the host machine, use the values in `docker-compose.yml` (not generic defaults). Typical local settings:
 - Host: `127.0.0.1` (recommended on Windows if `localhost` causes IPv6 connection issues)
 - Port: **5433** on the host (container listens on 5432 internally)
 - User: `LTIdbUser`
 - Password: same as `POSTGRES_PASSWORD` in `docker-compose.yml`
 - Database: `LTIdb`

For Prisma and the backend, set **`DATABASE_URL`** in `backend/.env`, for example `postgresql://LTIdbUser:<password>@127.0.0.1:5433/LTIdb`. See `docs/development_guide.md` for the full setup and migration commands (`npm run prisma:generate`, `npx prisma migrate deploy`).

To stop the Docker container, run the following command:
```
docker-compose down
```

# LTI - Sistema de Seguimiento de Talento  | ES

Este proyecto es una aplicación full-stack con un frontend en React y un backend en Express usando Prisma como ORM. El frontend se inicia con Create React App y el backend está escrito en TypeScript.

## Explicación de Directorios y Archivos

- `backend/`: Contiene el código del lado del servidor escrito en Node.js.
  - `src/`: Contiene el código fuente para el backend.
    - `index.ts`: El punto de entrada para el servidor backend.
  - `prisma/`: Contiene el archivo de esquema de Prisma para ORM.
  - `tsconfig.json`: Archivo de configuración de TypeScript.
  - `.env`: Contiene las variables de entorno.
- `frontend/`: Contiene el código del lado del cliente escrito en React.
  - `src/`: Contiene el código fuente para el frontend.
  - `public/`: Contiene archivos estáticos como el archivo HTML e imágenes.
  - `build/`: Contiene la construcción lista para producción del frontend.
- `docker-compose.yml`: Contiene la configuración de Docker Compose para gestionar los servicios de tu aplicación.
- `README.md`: Este archivo contiene información sobre el proyecto e instrucciones sobre cómo ejecutarlo.

## Estructura del Proyecto

El proyecto está dividido en dos directorios principales: `frontend` y `backend`.

### Frontend

El frontend es una aplicación React y sus archivos principales están ubicados en el directorio `src`. El directorio `public` contiene activos estáticos y el directorio `build` contiene la construcción de producción de la aplicación.

### Backend

El backend es una aplicación Express escrita en TypeScript.
- El directorio `src` contiene el código fuente
- El directorio `prisma` contiene el esquema de Prisma.

## Primeros Pasos

Para comenzar con este proyecto, sigue estos pasos:

1. Clona el repositorio.
2. Instala las dependencias para el frontend y el backend:
```sh
cd frontend
npm install

cd ../backend
npm install
```
3. Construye el servidor backend:
```
cd backend
npm run build
```
4. Inicia el servidor backend:
```
cd backend
npm run dev 
```

5. En una nueva ventana de terminal, construye el servidor frontend:
```
cd frontend
npm run build
```
6. Inicia el servidor frontend:
```
cd frontend
npm start
```

El servidor backend estará corriendo en http://localhost:3010 y el frontend estará disponible en http://localhost:3000.

## Docker y PostgreSQL

Este proyecto usa Docker para ejecutar una base de datos PostgreSQL. Así es cómo ponerlo en marcha:

Instala Docker en tu máquina si aún no lo has hecho. Puedes descargarlo desde aquí.
Navega al directorio raíz del proyecto en tu terminal.
Ejecuta el siguiente comando para iniciar el contenedor Docker:
```
docker-compose up -d
```
Esto iniciará una base de datos PostgreSQL en un contenedor Docker. La bandera -d corre el contenedor en modo separado, lo que significa que se ejecuta en segundo plano.

Use the same PostgreSQL connection details as in the English section above (`docker-compose.yml`, host port **5433**, `DATABASE_URL` in `backend/.env`, and `docs/development_guide.md`).

Para detener el contenedor Docker, ejecuta el siguiente comando:
```
docker-compose down
```
