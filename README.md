# Chat Application
Spring boot websocket backen and reactjs client

Server:
    - Spring boot Websocket (Maven)

Client:
    - ReactJS

<!-- GETTING STARTED -->
# Quick Start

## Prerequisites
- SpringBoot
- maven
- npm
- reactjs
- Docker (optional)

## Installation
Server

(in the chatserver folder)
```shell
mvn spring-boot:run 
```

Client

(in the chatclient folder)
```shell
# install react package
npm install 

# build
npm start
```

# Containerize
## Server
(in the chatserver folder)

- Set up a Spring Boot Application (.jar)

    Run the application without the Docker container:

    ```shell
    ./mvnw package && java -jar target/*.jar
    ```

- Containerize it
        
    Example 1. Dockerfile

    ```Dockerfile
    FROM openjdk:8-jdk-alpine
    ARG JAR_FILE=target/*.jar
    COPY ${JAR_FILE} app.jar
    ENTRYPOINT ["java","-jar","/app.jar"]
    ```

    Example 2. Dockerfile
        
    ```Dockerfile
    FROM openjdk:8-jdk-alpine
    RUN addgroup -S spring && adduser -S spring -G spring
    USER spring:spring
    ARG JAR_FILE=target/*.jar
    COPY ${JAR_FILE} app.jar
    ENTRYPOINT ["java","-jar","/app.jar"]
    ```

    Example 3. Dockerfile

    ```Dockerfile
    FROM openjdk:8-jdk-alpine
    RUN addgroup -S spring && adduser -S spring -G spring
    USER spring:spring
    ARG DEPENDENCY=target/dependency
    COPY ${DEPENDENCY}/BOOT-INF/lib /app/lib
    COPY ${DEPENDENCY}/META-INF /app/META-INF
    COPY ${DEPENDENCY}/BOOT-INF/classes /app
    ENTRYPOINT ["java","-cp","app:app/lib/*","hello.Application"]
    ```

- Build and Run

    ```shell
    docker build -t springio/spring-chatserver-docker .

    docker run -p 8080:8080 springio/spring-chatserver-docker
    ```

    with DEPENDENCY

    ```shell
    mkdir -p target/dependency && (cd target/dependency; jar -xf ../*.jar)

    docker build -t springio/spring-chatserver-docker .
    ```

- **Build a Docker Image with Maven**
    ```shell
    ./mvnw spring-boot:build-image -Dspring-boot.build-image.imageName=springio/spring-chatserver-docker
    ```

## Client
(in the chatclient folder)

- containerize it
    ```Dockerfile
    # pull official base image
    FROM node:13.12.0-alpine

    # set working directory
    WORKDIR /app

    # add `/app/node_modules/.bin` to $PATH
    ENV PATH /app/node_modules/.bin:$PATH

    # install app dependencies
    COPY package.json ./
    COPY package-lock.json ./
    RUN npm install --silent
    RUN npm install react-scripts@3.4.1 -g --silent

    # add app
    COPY . ./

    # start app
    CMD ["npm", "start"]
    ```

- Build and Run
    ```shell
    docker build -t reactjs:reactjs-chatclient-docker .

    docker run \
    -it \
    --rm \
    -v ${PWD}:/app \
    -v /app/node_modules \
    -p 3001:3000 \
    -e CHOKIDAR_USEPOLLING=true \
    reactjs:reactjs-chatclient-docker
    ```

## Acknowledgments

- https://github.com/JayaramachandranAugustin/ChatApplication/blob/main/README.md
- https://spring.io/guides/gs/spring-boot-docker/
- https://mherman.org/blog/dockerizing-a-react-app/