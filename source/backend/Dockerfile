FROM python:3

LABEL version="1.0"
LABEL description="Docker image for the Sonar 881 configuration and control back end."
LABEL maintainer = "Louis Ross <louis.ross@gmail.com"

WORKDIR /usr/src/app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY ["package.json", "package-lock.json", "./"]
COPY install-deps ./

RUN     echo 'debconf debconf/frontend select Noninteractive' | debconf-set-selections
RUN     bash ./install-deps >>install-deps.log


RUN ls

COPY . .

EXPOSE 5000

CMD ["npm", "start"]
