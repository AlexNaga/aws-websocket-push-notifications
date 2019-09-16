#!/bin/bash

cd ..
sls invoke local -f pushNotifications -s test -p test/events/pushNotificationsEvent.json
