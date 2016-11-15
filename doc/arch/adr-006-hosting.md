#  ADR 006: Google Container Engine as Infrastructure Platform

#  Context
At  Akvo we run multiple products on multiple platforms. To be efficient we want
to consolidate future application development. We also want the product teams
themselves to own the deployments themselves. We also have started to build up a
few apps / services which are not products. At Akvo we have Open source in our
blood, and it's a requirement that tools we use is open source. We want to store
customers data in Europe, with the possibility to host in specific countries due
to regional data laws. We want to chose a solution that is not a lock in. We
should be able to migrate away. Since we have a limited ops team and multiple
product teams minimising the dependancy on ops in day to day work is highly
regarded.

Historically  Akvo have used both apps hosted on VPS using Puppet to application running on
Google App Engine. There have been drawback on each of these. We hope the use of
containers and a container management tool will be a middle ground which allow
future decisions.

We started out using Docker compose on Amazon AWS, and had our eyes on the Amazon
container service.After further investigation Kubernetes started to look very
appealing. Main reasons was that Kubernetes is open source. It also have a lot
of handy features such as built in secrets management, an appealing network
model, the notion of deployments. In general Kubernetes seems to be a very
active project which we also have some team knowledge about.

Since Google hosts Kubernetes in form of Google Container Engine (GKE) & also other
products are running on the Google platform, GCP seemed like the obvious choice.
The major drawback compared to AWS is the lack of hosted Postgres. There is
however third party solution and hope that Google will start to support Postgres
in the future. Also we rather run a Postgres cluster ourselves than a Kubernetes
cluster hence GCP seems attractive.

#  Decision
- We will use containers as the base unit for shipping our applications.
- We will use Kubernetes to manage containerised applications.
- We will use the Google Cloud Platform and their Container Engine (hosted Kubernetes).

#  Status
Accepted

#  Consequences
- Kubernetes deployment files needs to be written CI needs to configured to deploy against Google Container Engine
- We need to adopt the notion of cattle instead of pets
- New routines between the Ops team and product teams need to be built

*This  ADR summarises a longer and more detailed working document*
