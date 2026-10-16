#!/bin/sh
set -eu
# Run only after native installation + checker/UAT. This script does not claim completeness.
mkdir -p artifacts
pac solution export --name FieldOps360 --path artifacts/FieldOps360_unmanaged.zip --managed false
printf '%s\n' 'Verify exported components before treating this as a release artifact.'
