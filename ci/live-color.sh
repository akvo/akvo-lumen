#!/usr/bin/env bash

kubectl get service lumen-live -ao jsonpath='{@.spec.selector.color}'