#!/usr/bin/env bash

OLDER_GIT_VERSION=$1
NEWEST_GIT_VERSION=$2
MSG=$3
COLOR=$4

cat << EOF > notify.slack.sh
#!/usr/bin/env bash

if [ -z "\${SLACK_CLI_TOKEN}" ]; then
  echo "You need a env var SLACK_CLI_TOKEN with a Slack legacy token"
  echo "Go to https://api.slack.com/custom-integrations/legacy-tokens to create one"
  echo "Create the env variable and rerun this script (\$0)"
  exit 1
fi

slack_txt=\$(git log --oneline $OLDER_GIT_VERSION..$NEWEST_GIT_VERSION | grep -v "Merge pull request" | grep -v "Merge branch" | cut -f 2- -d\  | sed 's/\[#\([0-9]*\)\]/<https:\/\/github.com\/akvo\/akvo-lumen\/issues\/\1|[#\1]>/' | tr \" \')
docker run --rm -e SLACK_CLI_TOKEN 512k/slack-cli \
    chat send \
    --channel='#flumen-dev' \
    --pretext="$MSG. <https://github.com/akvo/akvo-lumen/compare/$OLDER_GIT_VERSION..$NEWEST_GIT_VERSION|Full diff>." \
    --color $COLOR \
    --text "\$slack_txt" > /dev/null
EOF

chmod u+x notify.slack.sh
