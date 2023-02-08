class FaceDetectionElement extends HTMLElement { 

    constructor() {
        super()

        this.videoElement = undefined
        this.canvasElement = undefined
        this.canvasCtx = undefined
        this.drawingUtils = window;
    }

    render() {
        let template = this.template()
        this.innerHTML = template

        this.videoElement = this.querySelector(".input")
        this.canvasElement = this.querySelector(".output")
        this.canvasCtx = this.canvasElement.getContext('2d')

        this.detection()
    }

    template() {
        return `<video class="input d-none"></video>
        <canvas class="output" width="1280px" height="720px"></canvas>
        <p></p>`
    }



    onResults(results) {
        this.canvasCtx.save();
        this.canvasCtx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
        this.canvasCtx.drawImage(
            results.image, 0, 0, this.canvasElement.width, this.canvasElement.height);
        if (results.detections.length > 0) {
            let detections = results.detections[0].boundingBox
            let location = {
                x: (detections.xCenter - (detections.width / 2)) * 1280,
                y: (detections.yCenter - (detections.height / 2)) * 720,
                w: detections.width * 1280,
                h: detections.height * 720
            }

            this.querySelector("p").innerHTML = JSON.stringify(location)
            let imageData = this.canvasCtx.getImageData(location.x, location.y, location.w, location.h);

            this.canvasCtx.putImageData(imageData, 0, 0);

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
            width: 1280,
            height: 720
        });

        camera.start();
    }


    connectedCallback() {
        this.render()

    }
}

export { FaceDetectionElement }