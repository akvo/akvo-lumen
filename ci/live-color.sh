#!/usr/bin/env bash

kubectl get service lumen-live -o jsonpath='{@.spec.selector.color}'
