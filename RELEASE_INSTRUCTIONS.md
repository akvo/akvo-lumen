# Release instructions

## 1 Merge PR to master
This will cause CI to run tests, build containers and if successful deploy
to dark-test.
develop.

## 2 Autoflip test
If the end to end tests (Cypress) are successful we autoflip test. This means
test (https://lumen.akvotest.org) will closely run what's in develop.

# 3 Promote to production
```
$ ./ci/promote-test-to-prod.sh
```
Will show some info on what's promoted and provide instructions on how to tag
for a new deployment.


## 4 Manual flip production
To bring what's dark to live run.
```
$ ./ci/flip-blue-green-deployment.sh
```
