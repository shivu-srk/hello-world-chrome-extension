class Observable {
	constructor(value) {
		this.value = value;
		this.observers = [];
		this.observe = this.observe.bind(this);
		this.postValue = this.postValue.bind(this);
		this.remove = this.remove.bind(this);
		this.getValue = this.getValue.bind(this);
	}
	observe(cb) {
		this.observers.push(cb);
	}

	remove(cb) {
		this.observers = this.observers.filter((v) => v !== cb);
	}

	postValue(value) {
		if (this.value === value) return;
		this.value = value;
		this.observers.forEach((cb) => cb(value));
	}

	getValue() {
		return this.value;
	}
}

const containerClass = '__web_annotation_container';
const actionClass = '__web_annotation_action';
const targetClass = '__web_annotation_target';
const selectedClass = '__web_annotation_selected';

const isStart = new Observable(false);

function onClickAction() {
	if (isStart.getValue()) {
		isStart.postValue(false);
	} else {
		isStart.postValue(true);
	}
}

const currentSelected = new Observable(null);

function onElementClick(e) {
	onClearSelected();
	if ([document.body, button].includes(e.target)) return;
	e.target.classList.add(selectedClass);
	currentSelected.postValue(e.target);
}

function onClearSelected() {
	if (
		!currentSelected.getValue() ||
		[document.body, button].includes(currentSelected.getValue())
	)
		return;
	currentSelected.getValue().classList.remove(selectedClass);
	currentSelected.postValue(null);
}

function onMouseOver(e) {
	if ([document.body, button].includes(e.target)) return;
	e.target.classList.add(targetClass);
	e.target.addEventListener('click', onElementClick);
}

function onMouseOut(e) {
	if ([document.body, button].includes(e.target)) return;
	e.target.classList.remove(targetClass);
	e.target.removeEventListener('click', onElementClick);
}

const button = document.createElement('button');
button.append('Start');
button.classList.add('connect-video-call');
button.addEventListener('click', (e) => {
	e.preventDefault();
	onClickAction();
});

isStart.observe((v) => {
	if (v) {
		button.innerText = 'Stop';
		document.body.addEventListener('mouseover', onMouseOver);
		document.body.addEventListener('mouseout', onMouseOut);
	} else {
		button.innerText = 'Start';
		document.body.removeEventListener('mouseover', onMouseOver);
		document.body.removeEventListener('mouseout', onMouseOut);
	}
});

let mediaStream = null;

currentSelected.observe(async (v) => {
	if (!v) return;

	const videoTag = document.querySelector(
		".__web_annotation_selected video:not([style='display: none;'])",
	);
	if (!videoTag) return;

	mediaStream = videoTag.srcObject;
	if (!mediaStream) return;

	try {
		const imageCapture = new ImageCapture(mediaStream.getVideoTracks()[0]);
		const imageBitmap = await imageCapture.grabFrame();
		// if (holistic) {
		// 	await holistic.send({ image: imageBitmap });
		// }
	} catch (error) {
		console.error(error);
	}
});

document.body.appendChild(button);
