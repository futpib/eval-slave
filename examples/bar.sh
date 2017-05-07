
echo '[{"source":"() => \"test\""}]' | node ../cli.js
echo '[{"source":"() => \"test\""}]' | node ./cli.js
echo '[{"source":"() => \"test\""}]' | node-eval-slave
