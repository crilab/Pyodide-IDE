class Python {
	constructor() {
		this.stdin = callback => { callback('STDIN NOT IMPLEMENTED') }
		this.stderr = str => { this.stdout(str) }
		this.stdout = console.log
		this.clear = () => {}

		this.onstatuschange = () => {}

		this.worker = null
		this.reset()
	}

	reset() {
		if (this.worker)
			this.worker.terminate()

		this.worker = new Worker('python-worker.js')

		this.worker_busy = true

		this.worker_actions = {
			BUSY: () => {
				this.worker_busy = true
				this.onstatuschange(this.worker_busy)
			},
			READY: () => {
				this.worker_busy = false
				this.onstatuschange(this.worker_busy)
			},
			STDIN: sab => {
				this.stdin(str => {
					let sab_int32 = new Int32Array(sab)
					let sab_uint8 = new Uint8Array(sab)
					let str_uint8 = new TextEncoder().encode(str)

					sab_uint8.set(str_uint8, 4)
					Atomics.store(sab_int32, 0, str_uint8.length)
					Atomics.notify(sab_int32, 0)
				})
			},
			STDOUT: str => {
				this.stdout(str)
			},
			STDERR: str => {
				this.stderr(str)
			},
			CLEAR: () => {
				this.clear()
			},
			SLEEP: function(data) {
				let sab = data.sab
				let secs = data.secs

				let sab_int32 = new Int32Array(sab)

				setTimeout(() => {
					Atomics.store(sab_int32, 0, 1)
					Atomics.notify(sab_int32, 0)
				}, secs * 1000)
			}
		}

		this.worker.onmessage = data => {
			data = data.data
			this.worker_actions[data.type](data.value)
		}
	}

	send(type, value) {
		this.worker.postMessage({type, value})
	}

	run(source) {
		if (!this.busy)
			this.send('RUN', source)
	}
}
