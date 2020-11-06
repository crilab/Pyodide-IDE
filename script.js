let python = new Python()
let run = document.getElementById('run')
let reset = document.getElementById('reset')
let terminal = document.getElementById('terminal')

terminal.scroll = function() {
	this.scrollTop = this.scrollHeight
}

python.stdin = callback => {
	let input = document.createElement('input')
	input.type = 'text'

	input.style.border = 'none'
	input.style.backgroundColor = 'transparent'
	input.style.color = 'white'
	input.style.textShadow = '1px 1px 0px black'
	input.style.fontFamily = '\'VT323\', monospace'
	input.style.fontSize = '17px'
	input.style.outline = 'none'
	input.style.margin = '0'
	input.style.padding = '0'

	input.size = 1
	input.oninput = () => {
		if (0 < input.value.length)
			input.size = input.value.length
	}

	input.addEventListener('keyup', (e) => {
		if (e.key == 'Enter') {
			let i = input.value
			input.remove()
			python.stdout(i + '\n')
			callback(i)
		}
	})

	terminal.appendChild(input)

	terminal.onclick = () => {
		input.focus()
	}
	terminal.click()
}

python.stdout = str => {
	terminal.innerText += str
	terminal.scroll()
}

python.stderr = str => {
	let span = document.createElement('span')
	span.style.color = 'red'
	span.innerText = str
	terminal.appendChild(span)
	terminal.scroll()
}

python.clear = () => {
	terminal.innerHTML = ''
}

let resetting = true

python.onstatuschange = busy => {
	if (busy) {
		run.disabled = true
		reset.disabled = false
	} else {
		if (resetting) {
			terminal.innerHTML = ''
			resetting = false
		}
		run.disabled = false
		reset.disabled = true
	}
}

run.onclick = () => {
	terminal.innerHTML = ''
	python.run(editor.getValue())
}

reset.onclick = () => {
	run.disabled = true
	reset.disabled = true
	python.reset()
	resetting = true
}
