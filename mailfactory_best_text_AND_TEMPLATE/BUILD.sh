#!/bin/sh
# Regenerate index.html from the part files (source of truth).
cd "$(dirname "$0")"
cat parts/01-head-hero.html \
    parts/01b-openers.html \
    parts/02-product-dashboard-engine.html \
    parts/02b-notify-heat.html \
    parts/03-generator-library.html \
    parts/03b-tips-caustic.html \
    parts/04-onetouch-settings.html \
    parts/04b-showcases.html \
    parts/05-workflow-system.html \
    parts/05b-fluid-aurora.html \
    parts/06b-closers.html \
    parts/06-deepdive-download-brand.html > index.html
echo "index.html: $(wc -c < index.html) bytes, $(grep -c '<section' index.html) sections"
