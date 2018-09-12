## Deployment Steps
Deploying the website involves three key steps:
1. Setting-up an Elasticsearch instance or cluster with a load-balancer
2. Indexing scraped results
3. Building and running the docker image

**Note: Step 1 could be completed purely with Docker as Elasticsearch container images are readily available to be pulled.** 

Steps 1 and 3 are heavily dependent on the desired server configuration. The configuration used in our deployment consisted of a Kubernetes cluster for the web-app and a single instance for Elasticsearch (manually configured) as that was more than enough to handle predicted web traffic. Therefore, this deployment documentation is intended to be used as a rough guideline rather than a step-by-step guide.

### 1. Elasticsearch
Follow the installation steps listed on the [official Elasticsearch page](https://www.elastic.co/downloads/elasticsearch). At the time of writing, we used versions 6.3-6.4 of Elasticsearch. 

### 2. Indexing
Indexing can be completed by running our `populate_indices.sh` script in `courseai/Code/elastic-queries`. The script takes the IP address of the server/servers running Elasticsearch as an argument to index the scraped results. For example, if we were running Elasticsearch locally this should be executed as:
```
courseai/Code/elastic-queries/populate_indices.sh localhost
```

### 3. Building and Running the Docker Image
After Elasticsearch has been indexed and is running in the background, we begin building the dockerized django web-app. With docker, the dependencies (e.g. Django, numpy, Elasticsearch) do not have to be manually installed: we can run the web-app on any operating system that has docker installed.
#### Install Docker
On most linux based operating systems, this would usually involve:
```
sudo apt-get update
sudo apt-get install docker
```

#### Local Hosting
Go to `courseai/Code/courseai` then build the docker image with:
```
run sudo docker build -t courseai-app .
```
This builds an image tagged as `courseai-app` and may take several minutes. Next run the following line to begin hosting the web-app locally. 
```
sudo docker run -p 8000:8000 -e SECRET_KEY='a' -e ES_IP='localhost' courseai-app
```

The port mapping (`-p 8000:8000`) must be specified as described in the official docker documentation. You may use another port if desired (e.g. `-p 80:8000` to be able to connect to the website with simply `localhost` as the url in any browser). The environment variables `SECRET_KEY` and `ES_IP` must also be specified for the web-app to run successfully after building.

**Note: In production, the `SECRET_KEY` environment variable should be set to a randomly generated key and kept hidden, as specified in the official Django docs. For local hosting, using any random key is sufficient. The `ES_IP` environment variable should point to the IP address of the Elasticsearch server/servers. For a cluster, this would simply be the IP address of the load-balancer.**

You should now be able to open a browser and connect to the website by entering
`localhost:8000` as the url.

#### 4. CI/CD Pipeline (Codefresh) - Production Hosting
Our configuration for the web-app uses a Kubernetes cluster for the web-app component (e.g. docker image built in step 3) for CI/CD. This can be accomplished by creating a free account on Codefresh which gives ~4 builds/day. Setting up the pipeline involves:
1. Creating a Google Cloud account (free trial - ~$400 AUD)
2. Creating a Compute Engine VM instance to run Elasticsearch
    1. Use `SSH` to connect to the instance and install Elastichsearch as described in step 1 of this document
    2. Index the scraped data as described in step 2 of this document
3. Setting up a Kubernetes cluster on Google Cloud through Codefresh, exposing port 80 in particular and setting the environment variables `SECRET_KEY`, `DEBUG` (set to false) and `ES_IP` (as the internal Google Cloud IP address of the Elasticsearch instance).
4. Checking that the Kubernetes cluster is working as expected (i.e. can open the website through a browser)
5. Re-configuring the kubernetes cluster to pull docker images from Docker Hub
6. Creating a webhook in the Github repository settings so that Codefresh can be notified of git push changes
7. Specifying the github webhook as a trigger in Codefresh
8. Configuring Codefresh so that only files modified in a `glob` pattern triggers a build (i.e. `Code/courseai/**`)
9. Configuring Codefresh to push to Docker Hub on trigger, and have the Kubernetes cluster pull from Docker Hub

A diagram of the pipeline can be seen below (copied from [Codefresh](https://codefresh.io/docs/images/getting-started/quick-start-k8s/overview.png)).
![pipeline](https://codefresh.io/docs/images/getting-started/quick-start-k8s/overview.png)

**Edit**: *as of 6/9/18, the repository was converted to a private repository. The pipeline was configured to pull directly from Codefresh's internal docker registry to avoid having to configure secrets with Dockerhub. Therefore, the pipeline is now simplified: git triggers cause a docker image to be built on Codefresh that the Kubernetes cluster pulls directly before being redeployed. Dockerhub is no longer included in the pipeline.*

#### Miscellaneous
The important files for deployment are: `courseai/Code/courseai/settings/settings.py` and `courseai/Code/courseai/degree/course_data_helper.py`. The first specifies Django related settings that must be modified for a production environment. The second contains the line `es_conn = Elasticsearch([os.environ.get("ES_IP")])`, which specifies that an environment variable should be used for the address of the server running Elasticsearch. This may be modified to an explicit IP address if desired.
