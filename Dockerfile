FROM python:3.13.3-alpine3.22  

RUN mkdir /app

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV SECRET_KEY=46@a01os_&53es#5_q@*#s)wcci4vnwk-e^#11#yt=gm8c(c+v
ENV DEBUG=1
ENV ALLOWED_HOSTS=*

RUN pip install --upgrade pip 
 
COPY requirements.txt  /app/
 
RUN pip install --no-cache-dir -r requirements.txt
 
COPY . /app/