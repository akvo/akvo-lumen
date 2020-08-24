#!/usr/bin/env bash
# shellcheck disable=SC1010

set -o nounset
set -o errexit

./wait-for-dependencies.sh

echo "Starting REPL ..."

cmd="${1:-repl}"
if [[ "${cmd}" == "repl" ]]; then
    run-as-user.sh clj -C:org.akvo.lumen.dev:org.akvo.lumen.test -R:org.akvo.lumen.dev:org.akvo.lumen.test -A:org.akvo.lumen.nREPL-server:org.akvo.lumen.override
elif [[ "${cmd}" == "functional-and-seed" ]]; then
    # Two thing in one so that we avoid starting yet another JVM
    # run-as-user.sh lein do test :functional, run -m dev/migrate-and-seed
    run-as-user.sh clojure -A:org.akvo.lumen.dev:org.akvo.lumen.test -i :functional -m dev/migrate-and-seed
    echo "Yikes, no test script yet"
else
    true
fi
