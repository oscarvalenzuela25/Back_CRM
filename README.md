# CRM

Sigue estos pasos para levantar la app localmente

## Instalaciones y configuraciones

#### Instalar node_modules

```
  npm i
```

#### Variables de entorno

Necesitamos crear un archivo llamado **.env**, despues tendras que copiar el contenido del archivo .env.example y rellenar este con los datos solicitados.

#### Levantar Mongo local

Descargaremos la imagen de mongo, vamos a nuestra consola y digitamos

```
docker pull mongo
```

Crearemos un archivo dentro de nuestro proyecto llamado **docker-compose.yaml** y lo completaremos con este código

```
services:
  entriesdb: # nombre de la BD
    image: mongo:5.0.0 # mongo para la ultima version
    container_name: entries-database # nombre que se mostrara en docker
    ports:
      - 27017:27017
    volumes:
      - ./mongo:/data/db
```

Ahora ejecutaremos **docker-compose up -d** en nuestra consola en el path del proyecto donde esta el archivo creado en el paso anterior.

Ahora debería estar creado un volumen en su docker desktop, al levantar este volumen pueden conectarse localmente, puedes usar [Mongo compass](https://www.github.com/octokatherine).

Recuerda que la cadena de coneccion localmente es

```
  mongodb://localhost:27017
```

#### Iniciar proyecto

```
  npm run devel
```

## API Reference GraphQL

#### Agregar un usuario admin

URL del servidor local

```
  http://localhost:4000/
```

Query

```
  mutation NewUser($input: UserInput) {
    newUser(input: $input) {
        _id
        name
        lastname
        email
        createdAt
    }
  }
```

Ejemplo del UserInput

```
{
    "input": {
        "name": "User",
        "lastname": "Test",
        "email": "testito@test.com",
        "password": "123456",
        "adminSecret": "adminSecret"
    }
}
```

**Recuerda setear en el .env el adminSecret para crear tu primer admin, esta peticion puede mandarla por postman o el mismo ambiente de apollo**
