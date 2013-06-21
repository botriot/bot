#!/bin/bash
#
#

FOREVER=`which forever`
FILE=server.js
$FOREVER $@ $FILE
