
const vm = require('vm');
const {EventEmitter} = require('events');

const _ = require('lodash');
const Promise = require('bluebird');

const globals = require('globals');

const StreamArray = require('stream-json/utils/StreamArray');

const serializeError = require('serialize-error');

const DEFAULT_TIMEOUT = 2000;
const DEFAULT_CONTEXT_NAME = 'DEFAULT_CONTEXT';

class Writer {
	constructor(stream) {
		this._stream = stream;

		this._started = false;
		this._index = 0;
		this._ended = false;
	}

	start() {
		if (this._started || this._ended) {
			return;
		}
		this._stream.write('[');
		this._started = true;
	}

	write(obj) {
		this.start();

		if (this._ended) {
			return;
		}

		if (this._index !== 0) {
			this._stream.write(', ');
		}

		this._stream.write(JSON.stringify(obj, null, 2));
		this._index += 1;
	}

	end() {
		this.start();

		if (this._ended) {
			return;
		}

		this._stream.write(']');
		this._ended = true;
	}
}

class Contexts {
	constructor() {
		this._map = new Map();
	}

	get(name) {
		if (!this._map.has(name)) {
			this._map.set(name, this._createContext());
		}
		return this._map.get(name);
	}

	cleanupExports(name) {
		const ctx = this.get(name);

		ctx.exports = {};
		ctx.module.exports = ctx.exports;

		return ctx;
	}

	_createContext() {
		const globalValues = _(globals.node)
			.omit([
				'global',
				'GLOBAL',
				'root',
				'module',
				'exports',
				'arguments',
				'__dirname',
				'__filename'
			])
			.mapValues((v, k) => global[k])
			.value();

		const exports = {};

		return vm.createContext(_.extend(globalValues, {
			require,
			exports,
			module: {exports}
		}));
	}
}

const contexts = new Contexts();
let allSettled = Promise.resolve();

function repl(input, output) {
	input.on('data', ({index, value: taskJSON}) => {
		taskJSON.id = taskJSON.id || index;

		const taskFn = () => Promise.resolve(taskJSON)
			.then(taskJSON => ({
				id: taskJSON.id,

				thisArg: taskJSON.thisArg || null,
				arguments: taskJSON.arguments || [],

				context: taskJSON.context || DEFAULT_CONTEXT_NAME,
				script: new vm.Script(`module.exports = ${taskJSON.source};`, {
					displayErrors: true,
					timeout: taskJSON.timeout || DEFAULT_TIMEOUT
				}),

				_taskJSON: taskJSON
			}))

			.then(task => {
				const context = contexts.cleanupExports(task.context);

				task.script.runInContext(context, {
					breakOnSiging: true
				});
				const fn = context.module.exports;

				return fn.apply(task.thisArg, task.arguments);
			});

		output.emit('queued', {
			id: taskJSON.id
		});

		const promise = taskFn()
			.then(value => {
				output.emit('fulfilled', {
					id: taskJSON.id,
					value
				});
			}, reason => {
				output.emit('rejected', {
					id: taskJSON.id,
					reason
				});
			});

		allSettled = Promise.all([
			allSettled,
			promise.then(_.noop, _.noop)
		]).then(_.noop, _.noop);
	});

	input.on('end', () => {
		allSettled.then(() => output.emit('end'));
	});
}

function run(options = {}) {
	options.input = options.input || process.stdin;
	options.output = options.output || process.stdout;

	const input = StreamArray.make();
	options.input.pipe(input.input);

	const writer = new Writer(options.output);

	const output = new EventEmitter();
	output.on('queued', data => writer.write({
		type: 'queued',
		data
	}));

	output.on('fulfilled', data => {
		writer.write({
			type: 'fulfilled',
			data
		});
	});

	output.on('rejected', data => {
		data.reason = serializeError(data.reason);

		writer.write({
			type: 'rejected',
			data
		});
	});

	output.on('end', () => {
		writer.end();
	});

	repl(input.output, output);
}

module.exports = run;
