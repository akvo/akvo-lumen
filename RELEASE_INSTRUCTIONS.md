# Release instructions

Releases and deployments are in a sense two orthogonal activities. We happen to
use Github releases to track release progress and for external communication. In
terms of deployment of new code this is done via branches. The master branch is
used for production and develop for the test environment.

To release involved both creating a Github release with proper notes and to
deploy a newer version for use.

## Github releases

We use Github releases and tags to track release versions. To create a new
release the easiest things to do is to look at the current releases and follow
the same naming convention. The big job with Github releases is to craft the
release message by figuring out what Pull requests are in the release and
add it to the release message.

## Deployment
We deploy based on branches and have two version of the software running in each
environment (light and dark). The light version is the current one. The dark is
the next version. This enables us to deploy to the production environment, and
make sure the dark version is running fine in the production environment before
we switch over the new version for all users (and it becomes light).

### Test work flow
Feature branch -> pull request -> develop branch -> deployed to dark test by
Travis

Once Travis deployed, we can now access the dark version at
https://dark-lumen.akvotest.org. Once we now everything is fine, flip dark to
light:

```
$ ./ci/flip-blue-green-deployment.sh
```

### Production work flow
Develop branch -> local merge -> push to github -> master branch -> deployed to
dark production by Travis

Same as in test. Once Travis deployed, we can now access the dark version at
https://dark-demo.akvolumen.org. Once we now everything is fine, flip dark to
light:

```
$ ./ci/flip-blue-green-deployment.sh
```
