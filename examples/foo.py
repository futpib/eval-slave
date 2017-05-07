
from subprocess import Popen, PIPE
from os import path

import json

cli_js = path.join(path.dirname(path.realpath(__file__)), '..', 'cli.js')
command = ['node', cli_js]
# you can use `command = ['node-eval-slave']` instead
# if you have installed `eval-slave` globally

p = Popen(command, stdout=PIPE, stdin=PIPE, stderr=PIPE)

commands = [{
    'id': 0,
    'source': '''
        function (input) {
            return new Promise(resolve => {
                setTimeout(() => {
                    resolve(`Hello, ${input}`)
                }, 1000)
            })
        }
    ''',
    'arguments': ['world']
}, {
    'id': 1,
    'source': '() => "foobar"'
}]

print(json.dumps(commands))

stdout_data = p.communicate(input=json.dumps(commands).encode('utf-8'))[0]

print(stdout_data.decode('utf-8'))
