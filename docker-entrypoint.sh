#!/bin/sh
set -e

# Run the environment setup script
/scripts/env.sh

# Execute the CMD
exec "$@" 