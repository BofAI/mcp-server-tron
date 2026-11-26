#!/bin/sh

set -eu

case "$0" in
  */*) cd "${0%/*}" ;;
esac

exec node docker-start.cjs
