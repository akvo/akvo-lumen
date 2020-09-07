#!/usr/bin/env bash
# shellcheck disable=SC1010

set -o nounset
set -o errexit

./wait-for-dependencies.sh

echo "Starting REPL ..."

cmd="${1:-repl}"

if [[ "${cmd}" == "repl" ]]; then
    run-as-user.sh lein repl :headless
elif [[ "${cmd}" == "functional-and-seed" ]]; then
    # Two thing in one so that we avoid starting yet another JVM
    run-as-user.sh lein do kaocha-functional, run -m dev/migrate-and-seed
else
    true
fi
