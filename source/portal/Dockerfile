FROM node:16

LABEL version="1.0"
LABEL description="React-based web page for managing Sonar controller"
LABEL maintainer="Louis Ross <louis.ross@gmail.com>"

WORKDIR /app/portal-app

COPY ["./portal-app/package.json", "./portal-app/package-lock.json", "/app/portal-app/"]
RUN ["npm", "install"]

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
