
const test = require('ava');
const {stdio} = require('stdio-mock');

const slave = require('./index');

test.beforeEach(t => {
	const {stdin, stdout} = stdio();
	t.context.input = stdin;
	t.context.output = stdout;
});

test.cb('evaluates', t => {
	const {input, output} = t.context;

	output.on('end', () => {
		console.log(output, output.data());
		t.end();
	});

	slave({input, output});

	input.write(JSON.stringify([{
		id: 0,
		source: (x => x + 1).toString(),
		arguments: [1]
	}]));
	input.end();
});
