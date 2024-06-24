#!/bin/sh

if [ $# -ne 1 ]; then
  echo "Usage: $0 <project_name>"
  exit 1
fi

cd `dirname $0`
mkdir -p ../$1/src/styles
for dir in src/*; do
  if [ $dir = "src/locales" ] || [ $dir = "src/styles" ]; then
    continue
  fi
  ln -sfn ../../base/$dir ../$1/$dir
done

for dir in src/styles/*; do
  ln -sfn ../../../base/$dir ../$1/$dir
done