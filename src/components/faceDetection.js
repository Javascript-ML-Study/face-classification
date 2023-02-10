import * as tf from '@tensorflow/tfjs';
import * as tfvis from '@tensorflow/tfjs-vis';


class FaceDetectionElement extends HTMLElement { 

    constructor() {
        super()

        this.inputImageSize = {
            w: 720,
            h: 720
        }

        this.faceImageSize = {
            w: 32,
            h: 32
        }

        this.videoElement = undefined
        this.canvasElement = undefined
        this.canvasCtx = undefined
        this.drawingUtils = window;

        this.isCapture = false
        this.targetCaptureLabel = "default"
        this.captureLabelList = ["default"]
        
        this.faceData = {}


        this.test = 0
    }

    render() {
        let template = this.template()
        this.innerHTML = template

        this.videoElement = this.querySelector(".input")
        this.canvasElement = this.querySelector(".output")
        this.canvasCtx = this.canvasElement.getContext('2d')

        this.faceElement = this.querySelector(".output_face")
        this.faceCtx = this.faceElement.getContext('2d')


        this.addFaceCaptureLabelSelect({ faceLabel: "default" })
        this.detection()
    }

    template() {
        return `<video class="input d-none"></video>
        <canvas class="output" width="${this.inputImageSize.w}px" height="${this.inputImageSize.h}px"></canvas>
        <p></p>

        <input type="text" id="inputCaptureLabel" />
        <button id="addCaptureLabel">Add Capture Label</button>

        <select name="captureLabel" id="captureLabel">
        </select>

        <button id="capture">Capture</button>
        <canvas class="output_face d-none" width="${this.faceImageSize.w}px" height="${this.faceImageSize.h}px"></canvas>`
    }



    onResults(results) {
        this.canvasCtx.save();
        this.canvasCtx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
        this.canvasCtx.drawImage(
            results.image, 0, 0, this.canvasElement.width, this.canvasElement.height);
        if (results.detections.length > 0) {
            console.log(results.detections.length)
            let now = Date.now()
            let detections = results.detections[0].boundingBox
            let location = {
                x: (detections.xCenter - (detections.width / 2)) * this.inputImageSize.w,
                y: (detections.yCenter - (detections.height / 2)) * this.inputImageSize.h,
                w: detections.width * this.inputImageSize.w,
                h: detections.height * this.inputImageSize.h
            }

            this.querySelector("p").innerHTML = JSON.stringify(location)

            let imageData = this.canvasCtx.getImageData(location.x, location.y, location.w, location.h)
        
            let face = tf.browser.fromPixels(imageData)
            let resizeFace = face.resizeBilinear([32,32]).cast('int32')

            if (this.isCapture == true) {
                this.faceData[now] = {
                    tensor: resizeFace,
                    label: this.targetCaptureLabel
                }

                this.showCaptureFace({ timestamp: now })

                this.isCapture = false
            }


            //tf.browser.toPixels(resizeFace, this.faceElement);



            this.drawingUtils.drawRectangle(
                this.canvasCtx, results.detections[0].boundingBox,
                {color: 'blue', lineWidth: 4, fillColor: '#00000000'});
            // this.drawingUtils.drawLandmarks(this.canvasCtx, results.detections[0].landmarks, {
            // color: 'red',
            // radius: 5,
            // });
        }
        this.canvasCtx.restore();
    }


    detection() {
        const faceDetection = new FaceDetection({locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`;
        }});


        faceDetection.setOptions({
            model: 'short',
            minDetectionConfidence: 0.5
        });
        faceDetection.onResults(this.onResults.bind(this));
        
        const camera = new Camera(this.videoElement, {
            onFrame: async () => {
                await faceDetection.send({image: this.videoElement});
            },
            width: this.inputImageSize.w,
            height: this.inputImageSize.h
        });

        camera.start();
    }


    showVisor(imageTensor) {
        const surface = tfvis.visor().surface({ name: 'Face Examples', tab: 'Face Data'});

        surface.drawArea.appendChild(this.faceElement);
    
        imageTensor.dispose();
    }

    imagedataToImage(imagedata) {
        let canvas = document.createElement('canvas');
        let ctx = canvas.getContext('2d');

        canvas.width = imagedata.width;
        canvas.height = imagedata.height;
        ctx.putImageData(imagedata, 0, 0);
    
        let image = new Image();
        image.src = canvas.toDataURL();
        return image;
    }

    showCaptureFace({ timestamp }) {
        let id = `face_${timestamp}`
        this.addFaceCanvas({ canvasId: id })

        let faceElement = this.querySelector(`#${id}`)
        console.log(faceElement)
        tf.browser.toPixels(this.faceData[timestamp].tensor, faceElement);
    }

    addFaceCanvas({ canvasId }) {
        this.insertAdjacentHTML("beforeend", `<canvas id="${canvasId}" width="${this.faceImageSize.w}px" height="${this.faceImageSize.h}px"></canvas>`)
    }

    addFaceCaptureLabelSelect({ faceLabel }) {
        let captureLabelSelect = this.querySelector("#captureLabel")
        captureLabelSelect.insertAdjacentHTML("beforeend", `<option value="${faceLabel}">${faceLabel}</option>`)

    }

    handleClickCapture() {
        this.isCapture = true
    }

    handleClickAddCaptureLabel() {
        let label = this.querySelector("#inputCaptureLabel").value
        this.captureLabelList.push(label)
        this.addFaceCaptureLabelSelect({ faceLabel: label })
    }

    handleSelect() {
        let target = this.querySelector("#captureLabel")
        let value = target.value;
        this.targetCaptureLabel = value
    }


    connectedCallback() {
        this.render()
        this.querySelector("#capture").addEventListener("click", this.handleClickCapture.bind(this))
        this.querySelector("#captureLabel").addEventListener("change", this.handleSelect.bind(this))
        this.querySelector("#addCaptureLabel").addEventListener("click", this.handleClickAddCaptureLabel.bind(this))

        
    }
}

export { FaceDetectionElement }