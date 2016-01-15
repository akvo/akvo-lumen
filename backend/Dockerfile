FROM python:3.4
MAINTAINER Akvo.org <akvo.dev@akvo.org>

ENV PYTHONUNBUFFERED 1

RUN mkdir -p /app
WORKDIR /app
ADD requirements.txt /app
RUN pip install -r requirements.txt
ADD . /app
