import { FilterQueque } from './FiltersQueque'
import { workspaceStore } from "../store"
export default class SimpleCanvas {
    constructor() {
        let resource_name = "Luna.png"
       // let aux = workspaceStore.getResource(resource_name)
        //console.log("responce: "+aux) // aux es una promesa y no se como recibirlo.
        //this.src_img = "/Luna.png"
        // const fs = require('fs');
        // fs.readFile(this.src_img, 'utf8', (error, datos) => {
        //     if (error) throw error;
        //     console.log("El contenido es: ", datos);
        // });
        //this.src_img = "https://lieb-gewonnenmanchmal.com/xikng/vP-aSVwHbrDZyib2uXlr0gHaEr.jpg";
        // this.src_img = "https://sites.google.com/site/tics1mallacurricular/unidad-iii---internet/introduccion-al-internet-y-sus-servicios/HTTP_logo.svg.png?attredirects=0"
        this.scale = 1
        this.filter_queque = new FilterQueque()
    
        this.canvas = new fabric.Canvas('canvas-global-filters', {
            hoverCursor: 'pointer',
            selection: true,
            selectionBorderColor: 'green',
            backgroundColor: null
        })
        var ctx = this.canvas.getContext("2d");

        // if (fabric.isWebglSupported()) {
        //     fabric.textureSize = 20000;
        //     fabric.maxTextureSize = 20000;
        // }

        // var imageObj = new Image();
        // imageObj.src = this.src_img;
        // this.canvas.setHeight(imageObj.height)
        // this.canvas.setWidth(imageObj.width)
        // imageObj.onload = function () {
        //     ctx.drawImage(imageObj,0,0);   
        // }

        // this.canvas.setBackgroundImage(
        //     this.src_img,
        //     this.canvas.renderAll.bind(this.canvas),
        //     {
        //         backgroundImageOpacity: 0.5,
        //         backgroundImageStretch: false
        //     }
        // )
    }

    resetFilters() {
        this.filter_queque = new FilterQueque();
        this.canvas.setBackgroundImage(
            this.src_img,
            this.canvas.renderAll.bind(this.canvas),
            {
                backgroundImageOpacity: 0.5,
                backgroundImageStretch: false
            }
        )
    }

    setBrightness(brightness) {
        // const canvas =  this.canvas;
        // const filter_queque = this.filter_queque;
        // fabric.Image.fromURL(this.src_img, function(img) {
        //     let filter = new fabric.Image.filters.Brightness({ brightness: brightness });
        //     filter_queque.setBrightness(filter);
        //     img.filters = filter_queque.getFilters(); // Comprobar si funciona
        //     // apply filters and re-render canvas when done
        //     img.applyFilters();
        //     // add image onto canvas (it also re-render the canvas)
        //     canvas.setBackgroundImage(
        //         img,
        //         canvas.renderAll.bind(canvas),
        //         {
        //             backgroundImageOpacity: 0.5,
        //             backgroundImageStretch: false
        //         }
        //     )
        // });
    }

    setContrast(contrast) {
        // const canvas =  this.canvas;
        // const filter_queque = this.filter_queque;
        // fabric.Image.fromURL(this.src_img, function(img) {
        //     // add filter
        //     let filter = new fabric.Image.filters.Contrast({ contrast: contrast })
        //     filter_queque.setContrast(filter);
        //     img.filters = filter_queque.getFilters(); // Comprobar si funciona
        //     // apply filters and re-render canvas when done
        //     img.applyFilters();
        //     // add image onto canvas (it also re-render the canvas)
        //     canvas.setBackgroundImage(
        //         img,
        //         canvas.renderAll.bind(canvas),
        //         {
        //             backgroundImageOpacity: 0.5,
        //             backgroundImageStretch: false
        //         }
        //     )
        // });
    }
      
    colorize(color) {
        // const canvas =  this.canvas;
        // const filter_queque = this.filter_queque;
        // // const color = new fabric.Color('rgb(255,0,100)');
    
        // fabric.Image.fromURL(this.src_img, function(img) {
        //     // add filter
        //     let filter = new fabric.Image.filters.BlendColor({ color: color });
        //     filter_queque.setColorize(filter);
        //     img.filters = filter_queque.getFilters(); // Comprobar si funciona
        //     // apply filters and re-render canvas when done
        //     img.applyFilters();
        //     // add image onto canvas (it also re-render the canvas)
        //     canvas.setBackgroundImage(
        //         img,
        //         canvas.renderAll.bind(canvas),
        //         {
        //             backgroundImageOpacity: 0.5,
        //             backgroundImageStretch: false
        //         }
        //     )
        // });
    }
}