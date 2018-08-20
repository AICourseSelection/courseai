# Dockerfile

# FROM directive instructing base image to build upon
FROM python:3-onbuild

COPY . /app
WORKDIR /app

RUN pip install -r /app/requirements.txt

# EXPOSE port 8000 to allow communication to/from server
EXPOSE 8000

# CMD specifcies the command to execute to start the server running.
CMD ["/app/start.sh"]
# done
