# ADR 007: Using Google Stackdriver as the monitoring solution for Windshaft

## Context

The Windshaft tiler subsystem needs a monitoring solution to enable troubleshooting, health checks and other operational concerns.

Akvo is committed to creating open source based software. One of the reasons for this is for our partners to avoid vendor lock in situations, not only with Akvo but also with the providers of different libraries, services and tools that are needed to run the products that we develop.

Supporting services and systems, for example CI, logging, monitoring and DBMS, often come with a significant cost in operation and maintenance. In many cases our strategy is, instead of hosting the systems ourselves, to find a service hosting partner for said services. The decision to use a hosted service versus hosting the service ourselves is far from trivial and hinges on aspects like interchangeability, long term costs and data integrity and data security concerns.

Regardless of if the systems are hosted on premise or as a service some costs of ownership still remain. One significant cost among these is the cost of knowing and utilizing the tools that need to be distributed among team members. It is for us imperative to keep the number of services and tools (especially ones that are in some way overlapping) to a minimum.

In the case of monitoring the recommendation from ops engineering and others has been to use [Google Stackdriver](https://cloud.google.com/stackdriver/). The reasons being that it's a very complete monitoring, logging, error reporting and alerting solution natively integrated with Google Cloud Platform, as well as it's quite simple and cheap compared to all alternatives.

Stackdriver is already available in our Kubernetes cluster for the other services in Akvo Lumen. Choosing a different monitoring solution for Windshaft would add a learning cost and also introduce risks that the individual monitoring systems would need to share the attention of the responsible system owner, thus increasing the risk of fatal problems going unnoticed.

### Considerations
Using a third party service provider for machine and application monitoring still comes with some considerations that need to be seen and addressed. These are:

* Data security
* Avoiding vendor lock-in
* Cost

### Data security
First and foremost, it should be possible to switch monitoring on and off. Both for the sake of running local development environments without monitoring having to be set up, but also in the cases where partners or other users want to run Lumen by themselves and not having to pay for Google Stackdriver usage. Being able to switch off application monitoring is also a first, minimum step to enable Lumen to be run within the confines of the borders of a country.

It is also important that care is taken to ensure that data that is sent from Windshaft to Stackdriver does not identify the partner or leak any of the data on their subjects.

To allow for efficient usage and to get value from the monitoring system, an application owner needs to be able to identify different cases of use to see which cases have a severe impact on application performance. A suggested strategy for achieving this is to use a strong hashing algorithm on the identifiers in the monitoring data (for example the tenant and user IDs) and to generate and store the hash keys, the salt(s) and the identity lookup table privately and securely for our convenience. Even when we obfuscate the identities in this way, we should still carefully consider what data and metrics will be sent to the monitoring systems so that these could not be used to glean important information on our users and their source data.

Question: how will SQL queries be handled in the monitoring system? [Dan]

### Interoperability to avoid vendor lock-in
Stackdriver supports consuming monitoring data in statsd format. This should be used so that someone that wants to host Lumen in their own premises could switch monitoring system to another one that uses statsd or collectd.

### Cost
The total cost of ownership is deemed to be significantly lower when a hosted service is being used, compared to the cost of operating, supporting, maintaining and updating a monitoring solution by ourselves.

## Decision

After discussing with members from the platform team and the operations engineer and taking into account the aspects mentioned above, we have decided:

* To use Stackdriver as the monitoring solution for Windshaft.

* That no identity values should be visible in the monitoring data. To ensure anonymous data in Stackdriver, the identities will be hashed.

* Use statsd format for the monitoring if possible. Otherwise, research and document other strategies for making monitoring interchangeable and take a decision on when such a strategy can be implemented.

* Review all data sent to Stackdriver as part of code review.

## Status

Preliminary decision by head of software development after discussion with lead operations engineer and platform architect. Alos Needs review before final decision.

## Consequences

* Application monitoring for Windshaft can be set up
* Operations and support handled by third party
* An added SaaS cost
* Added software development cost for identity hashing functionality. Estimated to be around 3 days of work.
* Added process cost for reviewing monitoring data before any code changes to systems utilizing monitoring functionality
* A step in the right direction on the long term strategy of unification of supporting software services in Akvo
