#!/bin/sh
set -eu
# Sign into the dedicated test browser before running. Never records login.
FIELDOPS_BROWSER_SESSION="${FIELDOPS_BROWSER_SESSION:-fieldops-native}"
mkdir -p .data
playwright-cli -s="$FIELDOPS_BROWSER_SESSION" video-start .data/native-demo-short-hq.webm --size=1800x1000 --fps=15 --cursor
trap 'playwright-cli -s="$FIELDOPS_BROWSER_SESSION" video-stop' EXIT
playwright-cli -s="$FIELDOPS_BROWSER_SESSION" run-code --filename=scripts/native-demo-tour.js > .data/native-demo-tour.log
