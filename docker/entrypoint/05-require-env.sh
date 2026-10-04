#!/bin/sh
# Fails fast with a clear message when required configuration is missing.
set -eu

case "${API_UPSTREAM:-}" in
  http://*|https://*) ;;
  '')
    echo "FATAL: API_UPSTREAM is not set (expected the API base URL, e.g. http://api:9090 or http://localhost:3001)" >&2
    exit 1
    ;;
  *)
    echo "FATAL: API_UPSTREAM must start with http:// or https:// (got '${API_UPSTREAM}')" >&2
    exit 1
    ;;
esac

case "${API_UPSTREAM}" in
  *[!A-Za-z0-9.:/_-]*|*/)
    echo "FATAL: API_UPSTREAM must be scheme://host[:port] with no trailing slash (got '${API_UPSTREAM}')" >&2
    exit 1
    ;;
esac
