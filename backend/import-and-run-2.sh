#!/usr/bin/env bash
# shellcheck disable=SC1010

set -o nounset
set -o errexit

./wait-for-dependencies.sh

echo "Starting REPL ..."

cmd="${1:-repl}"
if [[ "${cmd}" == "repl" ]]; then
   run-as-user.sh clojure -A:akvo-flumen-clj -R:nREPL:dev:test -C:dev:test
elif [[ "${cmd}" == "functional-and-seed" ]]; then
    # Two thing in one so that we avoid starting yet another JVM
    # run-as-user.sh lein do test :functional, run -m dev/migrate-and-seed
    run-as-user.sh clojure -A:dev:test -i :functional -m dev/migrate-and-seed
    echo "Yikes, no test script yet"
else
    true
fi
