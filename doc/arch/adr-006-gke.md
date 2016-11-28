# ADR 006: Google Container Engine as Infrastructure Platform

# Context
At Akvo we run multiple products on multiple platforms. To be efficient we want
to consolidate future application development. We also want the product teams
themselves to own the deployment themselves. There is also few apps / services
which are not products, but helper services. At Akvo we have Open source in our
blood, and it's a requirement that tools we use is open source. We want to store
customers data in Europe, with the possibility to host in specific countries due
to regional data laws. We want to go for a solution that gives us the most
leverage without being a lock in. There should be an easy migration path from one provider to another. Since we have a limited ops team and multiple
product teams minimising the dependancy on ops in day to day work is highly
regarded.

Historically Akvo have used both apps hosted on VPS using Puppet to application running on Google App Engine. There have been drawback on each of these. We hope the use of containers and a container management tool will be a middle ground which allow future decisions.

We started out using Docker compose on Amazon AWS, and had our eyes on the Amazon container service. After further investigtion Kubernetes started to look very appealing. Main reasons was that Kubernetes is open source. It also have a lot of handy features such as built in secrets management, an appealing network
model, the notion of deployments. In general Kubernetes is a very active project which we also have some team knowledge about.

Since has a hosted Kubernetes solution in Google Container Engine (GKE) and the fact that Akvo runs the Akvo Flow product on Google App Enigne. Google Cloud Platform was the most suitable pick. The Google cloud also provides really good tools for encrypting data. The major drawback compared to AWS is the lack of hosted Postgres. There is however third party solution and hope that Google will start to support Postgres in the future. Also we rather run a Postgres cluster ourselves than a Kubernetes cluster hence GCP seems attractive.

# Decision
- We will use containers as the base unit for shipping our applications.
- We will use Kubernetes to manage containerised applications.
- We will use the Google Cloud Platform and their Container Engine (hosted Kubernetes).

# Status
Accepted

# Consequences
- Kubernetes deployment files needs to be written CI needs to configured to deploy against Google Container Engine
- We need to adopt the notion of cattle instead of pets
- New routines between the Ops team and product teams need to be built

*This  ADR summarises a longer and more detailed working document*
