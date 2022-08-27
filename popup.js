const BASE = 'https://d3bb-2409-4072-89a-e089-6991-d0ee-6b50-b253.ngrok.io';

const link = document.createElement('style');
link.type = 'text/css';
link.innerHTML = `
.connect-video-call {
	position: fixed;
	bottom: 10px;
	right: 10px;
	z-index: 9999;
}

.__web_annotation_container {
	position: fixed;
	bottom: 5px;
	left: auto;
	right: calc(50% - 5em);
	width: 10em;
	height: min-content;
	padding: 10px;
	background-color: green;
	display: flex;
	column-gap: 15px;
}

.__web_annotation_target {
	border-style: dashed !important;
	border-color: green;
}

.__web_annotation_selected {
	border-style: dashed !important;
	border-color: red;
}
`;
document.head.appendChild(link);

// const initScript = (v) => {
// 	script.innerHTML = v;
// 	script.type = 'text/javascript';
// 	document.body.append(script);
// };

// fetch(`${BASE}/connect-video-call.js`, {
// 	mode: 'no-cors',
// 	'accept-content-type': 'text/javascript',
// })
// 	.then((v) => v.text())
// 	.then((v) => {
// 		initScript(v);
// 	})
// 	.catch((e) => {
// 		console.error(e);
// 	});

// initScript(``);

const scriptsUrl = [
	// 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@2.7.0/dist/tf.min.js',
	// 'https://cdn.jsdelivr.net/gh/nicolaspanel/numjs@0.15.1/dist/numjs.min.js',
	// 'https://cdn.jsdelivr.net/npm/@mediapipe/holistic/holistic.js',
	// `${BASE}/connect-video-call.js`,
];
const createScript = (url) => {
	const script = document.createElement('script');
	script.src = url;
	script.type = 'module';
	document.body.append(script);
	return script;
};

const insertScript = (data) => {
	const script = document.createElement('script');
	script.innerHTML = data;
	script.type = 'module';
	document.body.append(script);
	return script;
};

scriptsUrl.forEach(createScript);

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

let images = [];
let LIMIT = 30;
let intervalId;

const blobToBase64 = (blob) => {
  const reader = new FileReader();
  reader.readAsDataURL(blob);
  return new Promise((resolve) => {
    reader.onloadend = () => {
      resolve(reader.result);
    };
  });
};

currentSelected.observe(async (v) => {
  clearInterval(intervalId);
  if (!v) return;

  const videoTag = document.querySelector(
    ".__web_annotation_selected video:not([style='display: none;'])"
  );
  if (!videoTag) return;

  mediaStream = videoTag.srcObject;
  if (!mediaStream) return;

  try {
    const imageCapture = new ImageCapture(mediaStream.getVideoTracks()[0]);
    intervalId = setInterval(async () => {
      if (images.length >= LIMIT) {
        images = images.slice(images.length - LIMIT, images.length);
        const response = await fetch(
          "https://18f1-34-143-168-148.ap.ngrok.io/predict",
          {
            mode: "no-cors",
            method: "POST",
            headers: {
              "ngrok-skip-browser-warning": "true",
            },
            body: JSON.stringify({
              images,
            }),
          }
        );
        const word = await response.text();
        console.log(word);
        images = images.slice(images.length - (LIMIT - 10), images.length);
      } else {
        const image = await imageCapture.takePhoto();
        const base64 = await blobToBase64(image);
        const imageBase64 = base64.split(",", 1)[1];
        console.log(imageBase64);
        images.push(imageBase64);
      }
    }, 1000 / 30);
  } catch (error) {
    clearInterval(intervalId);
    console.error(error);
  }
});

document.body.appendChild(button);
