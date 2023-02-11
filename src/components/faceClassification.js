import * as tf from '@tensorflow/tfjs';
import * as tfvis from '@tensorflow/tfjs-vis';

class FaceClassification extends HTMLElement { 

    constructor() {
        super()

        this.IMAGE_WIDTH = 32;
        this.IMAGE_HEIGHT = 32;
        this.IMAGE_CHANNELS = 1;
    }

    render() {
        let template = this.template()
        this.innerHTML = template
    }

    template() {
        return ` <button class="mt-5">Show</button>`
    }


    async showExamples() {
        const facedata = document.querySelector("face-detection").faceData        
        const surface = tfvis.visor().surface({ name: 'Input Data Examples', tab: 'Input Data'});
        
        for (const key in facedata) {
            if (Object.hasOwnProperty.call(facedata, key)) {
                const canvas = document.createElement('canvas');
                canvas.width = 28;
                canvas.height = 28;
                canvas.style = 'margin: 4px;';
                await tf.browser.toPixels(facedata[key].tensor, canvas);
                surface.drawArea.appendChild(canvas);
            
                facedata[key].tensor.dispose();
            }
        }
    }


    

  
    async run() {
    
        // const model = this.getModel();
        // tfvis.show.modelSummary({name: 'Model Architecture', tab: 'Model'}, model);

        //await this.train(model, data);


    }


    async handleClick() {
        await this.showExamples();

    }


    connectedCallback() {
        this.render()
        this.querySelector("button").addEventListener('click', this.handleClick.bind(this));
        //document.addEventListener('DOMContentLoaded', this.run.bind(this));

        
    }
}

export { FaceClassification }