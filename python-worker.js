importScripts('https://cdn.jsdelivr.net/pyodide/v0.15.0/full/pyodide.js')

function send(type, value=null) {
	postMessage({type, value})
}

languagePluginLoader.then(() => {
	send('READY')
})

self.streams = {
	stdin: {
		readline: () => {
			let sab = new SharedArrayBuffer(2048)
			let sab_int32 = new Int32Array(sab)
			let sab_uint8 = new Uint8Array(sab)

			send('STDIN', sab)

			Atomics.wait(sab_int32, 0, 0)

			let str_len = sab_int32[0]
			let str_uint8 = sab_uint8.slice(4, 4 + str_len)

			return new TextDecoder().decode(str_uint8) + '\n'
		},
	},
	stdout: {
		write: str => {
			send('STDOUT', str)
			self.functions.sleep(0.003)
		}
	},
	stderr: {
		write: str => {
			send('STDERR', str)
			self.functions.sleep(0.003)
		}
	}
}

self.functions = {
	clear: () => {
		send('CLEAR')
	},
	sleep: secs => {
		if (!isNaN(secs)) {
			let sab = new SharedArrayBuffer(4)
			let sab_int32 = new Int32Array(sab)

			send('SLEEP', {secs, sab})

			Atomics.wait(sab_int32, 0, 0)
		}
	}
}

let exec_template = `
import traceback
import sys
import js

sys.stdin = js.streams['stdin']
sys.stdout = js.streams['stdout']
sys.stderr = js.streams['stderr']

functions = {
	'clear': js.functions['clear'],
	'sleep': js.functions['sleep']
}

try:
	exec(js.exec_object, functions, {})
except Exception:
	traceback.print_exc(limit=0)
`

let actions = {
	RUN: src => {
		send('BUSY')
		self.exec_object = src
		pyodide.runPython(exec_template)
		send('READY')
	}
}

onmessage = data => {
	data = data.data
	actions[data.type](data.value)
}
