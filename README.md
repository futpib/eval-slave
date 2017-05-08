
# eval-slave

Dead simple node.js evaluator controlled via standart input

## Install

With [npm](https://www.npmjs.com/) do:

```
npm install eval-slave
```

Or install globally if you want to add the `node-eval-slave` executable:

```
npm install -g eval-slave
```

## Usage

Check out the [exapmles](https://github.com/futpib/eval-slave/tree/master/examples) dir

### Abstract
1. Start `node-eval-slave` or `node ./cli.js`
2. Write JSON array of "tasks" to the process's standard input
3. Results will be printed as a JSON array to the standard output

You can even try it from shell!

### Bash

```
echo '[{"source":"() => \"test\""}]' | node-eval-slave
```

### Python

See [example.py](https://github.com/futpib/eval-slave/tree/master/examples/foo.py)

### Emacs Lisp

Check out [emacs-nodejs-slave](https://github.com/futpib/emacs-nodejs-slave)

## Example

input (js, because real json is a bit too hairy):
```js
[{
  id: 0,
  source: (function (input) {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(`Hello, ${input}`)
      }, 1000)
    })
  }).toString(),
  arguments: ["world"]
}, {
  id: 1,
  source: "() => \"foobar\"",
}]
```

output (json):
```json
[{
  "type": "queued",
  "data": {
    "id": 0
  }
}, {
  "type": "queued",
  "data": {
    "id": 1
  }
}, {
  "type": "fulfilled",
  "data": {
    "id": 1,
    "value": "foobar"
  }
}, {
  "type": "fulfilled",
  "data": {
    "id": 0,
    "value": "Hello, world"
  }
}]
```
