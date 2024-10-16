import { fabric } from 'fabric'
import { saveAs } from 'file-saver'
import { getColor } from '../helpers/canvasUtilities'
import { FilterQueque } from './FiltersQueque'
import LabeledRect from './LabeledRect'

export default class SpectrogramCanvas {
  constructor(events, max_width) {
    this.widthOriginal = null
    this.heightOriginal = null
    this.originalImage = null
    this.max_width = max_width - 45
    this.scale = 1
    this.IDBBOX = 0
    this.filter_queque = new FilterQueque()
    this.enabled_filters = true

    this.canvas = new fabric.Canvas('canvas-container', {
      hoverCursor: 'pointer',
      selection: true,
      selectionBorderColor: 'green',
      backgroundColor: null
    })
    this.canvas.on(events)
  }

  getCanvas() {
    return this.canvas
  }

  updateAllLabels(names){
    for(let i = 0 ; i < this.canvas.getObjects().length ; i++){
      this.updateLabel(i,names[i]);
    }
  }

  updateLabel(id,name){
    const color = this.canvas.getObjects()[id].stroke

    if(!name){
      name = `Nuevo#${id+1}`
    }

    this.canvas.getObjects()[id].set({
      stroke: 'white'
    })

    this.canvas.getObjects()[id].set({
      label: name,
      stroke: color
    })

  
    this.canvas.renderAll()
    
  }

  addBbox(id,name = "") {
    this.IDBBOX += 1

    if(!name){
      name = `Nuevo#${id}`
    }

    let rect;
    if(this.canvas.getObjects().length > 0){

      const clone = this.canvas.getObjects()[0]

      rect = new LabeledRect({
        id: this.IDBBOX,
        top: this.getCanvasWidth()/4,
        left: clone.left,
        width: clone.width,
        height: clone.height,
        opacity: 1,
        fill: '',
        stroke: getColor(this.IDBBOX-1),
        strokeWidth: 10,
        lockRotation: true,
        label: name
      })
    }
    else{
      rect = new LabeledRect({
        id: this.IDBBOX,
        top: this.getCanvasWidth()/4,
        left: this.getCanvasHeight()/2,
        width: this.getCanvasWidth()*1.5,
        height: this.getCanvasHeight()/2,
        opacity: 1,
        fill: '',
        stroke: getColor(this.IDBBOX-1),
        strokeWidth: 10,
        lockRotation: true,
        label: name
      })
    }
    
    this.canvas.add(rect)
    this.canvas.setActiveObject(rect)
  }

  getReady() {
    return !this.widthOriginal === undefined
  }

  getCanvasWidth() {
    return this.widthOriginal * this.scale
  }

  getCanvasHeight() {
    return this.heightOriginal * this.scale
  }

  saveBboxYoloFormat(fileName = 'bboxs.txt') {
    let text = ''
    const objs = this.canvas.getObjects()
    objs.forEach((obj) => {
      const coord = this._convertYoloBbox(
        obj.aCoords.tl.x,
        obj.aCoords.tl.y,
        obj.aCoords.br.x - obj.aCoords.bl.x,
        obj.aCoords.bl.y - obj.aCoords.tl.y
      )
      text += `0 ${coord[0]} ${coord[1]} ${coord[2]} ${coord[3]} \r\n`
    })
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    saveAs(blob, fileName)
  }

  async loadBboxYoloFormat(inputText) {
    const file = inputText.files[0]
    if (file) {
      const text = await file.text()
      const lines = text.split('\n')
      lines.pop()
      lines.forEach((line) => {
        const values = line.split(' ')

        const x1 = parseFloat(values[1])
        const y1 = parseFloat(values[2])
        const w = parseFloat(values[3])
        const h = parseFloat(values[4])

        const res = this._convertCoordinates(x1, y1, w, h)
        const rect = new fabric.Rect({
          top: res[1],
          left: res[0],
          width: res[2],
          height: res[3],
          opacity: 0.5,
          fill: 'green',
          lockRotation: true
        })

        this.canvas.add(rect)
      })
    }
  }

  loadBboxYoloFormatJson(predictions,metadata = null) {
    this.IDBBOX = 0;
    predictions.forEach((prediction,index) => {
      const x1 = prediction.x
      const y1 = prediction.y
      const { w } = prediction
      const { h } = prediction
      this.IDBBOX += 1
      let name = "";
      if(metadata){
        name = metadata[index]["OBJECT"];
      }
      
      if(name === ""){
        name = `Nuevo#${this.IDBBOX}`
      }

      const rect = new LabeledRect({
        id: this.IDBBOX,
        top: y1,
        left: x1,
        width: w,
        height: h,
        opacity: 1,
        fill: '',
        stroke: getColor(this.IDBBOX-1),
        strokeWidth: 10,
        lockRotation: true,
        label: name
      })
      this.canvas.add(rect)
    })
  }

  resetFilters() {
    this.filter_queque = new FilterQueque()
  }
  
  // Desactualizado, se deja aca, por que capaz es util en el futuro
  setScale(scale) {
    this.scale = scale
    this.canvas.setHeight(this.getCanvasHeight())
    this.canvas.setWidth(this.getCanvasWidth())
    this.canvas.setZoom(this.scale)
  }

  recalculateScale() {
    this.scale = this.max_width / this.widthOriginal
    this.canvas.setHeight(this.getCanvasHeight())
    this.canvas.setWidth(this.getCanvasWidth())
    this.canvas.setZoom(this.scale)
  }

  setBrightness(brightness) {
    let filter = new fabric.Image.filters.Brightness({ brightness: brightness });
    this.filter_queque.setBrightness(filter);
  }

  setContrast(contrast) {
    let filter = new fabric.Image.filters.Contrast({ contrast: contrast })
    this.filter_queque.setContrast(filter);
  }
  
  setColorize(color) {
    let filter = new fabric.Image.filters.BlendColor({ color: color });
    this.filter_queque.setColorize(filter);
  }

  enable_filters() {
    this.enabled_filters = true
  }

  disable_filters() {
    this.enabled_filters = false
  }

  ReRender() {
    if(this.enabled_filters){
      const canvas =  this.canvas;
      const filter_queque = this.filter_queque;
      fabric.Image.fromURL(this.originalImage, function(img) {
        img.filters = filter_queque.getFilters(); 
        img.applyFilters();
        // add image onto canvas (it also re-render the canvas)
        canvas.setBackgroundImage(
          img,
          canvas.renderAll.bind(canvas),
          {
            backgroundImageOpacity: 0.5,
            backgroundImageStretch: false
          }
        )
      });
    }
  }

  loadImage(src, width, height) {
    if (fabric.isWebglSupported()) {
      fabric.textureSize = 20000;
      fabric.maxTextureSize = 20000;
    }

    if (src !== '') {    
      this.originalImage = src
      this.widthOriginal = width
      this.heightOriginal = height
      this.filter_queque = new FilterQueque()
      this.recalculateScale()

      var imageObj = new Image();
      imageObj.src = src;
      this.canvas.setBackgroundImage(
        src,
        this.canvas.renderAll.bind(this.canvas),
        {
          backgroundImageOpacity: 0.5,
          backgroundImageStretch: false
        }
      )

      return true
    }
    return false
  }

  deleteAllBbox() {
    const objs = this.canvas.getObjects()
    objs.forEach((obj) => {
      if (obj.get('type') === 'labeledRect') this.canvas.remove(obj)
    })
  }

  setPredictions(json) {
    this.IDBBOX = 0
    this.deleteAllBbox()
    let predictions = json.sort((a, b) => a.x - b.x).map((bbox) => {return this._convertCoordinates(bbox)});
    this.loadBboxYoloFormatJson(predictions);
    this.canvas.setActiveObject(this.canvas.item(0))
    this.canvas.renderAll()
  }

  getBbox(id) {
    const bbox = this.canvas.getItem(id)
    return {
      x: bbox.aCoords.tl.x,
      y: bbox.aCoords.tl.y, 
      h: bbox.aCoords.bl.y - bbox.aCoords.tl.y,
      w: bbox.aCoords.tr.x - bbox.aCoords.tl.x
    }
    /*
    return idsBbox.map((element) => {
      const bbox = this.canvas.getItem(element.id)
      return {
        ...element,
        x: bbox.aCoords.tl.x,
        y: bbox.aCoords.tl.y,
        h: bbox.aCoords.bl.y - bbox.aCoords.tl.y,
        w: bbox.aCoords.tr.x - bbox.aCoords.tl.x
      }
    })
    */
  }

  getBboxes(){
    let bboxes = [];
    
    this.canvas.getObjects().forEach((bbox) => {
      bboxes.push(this.getBbox(bbox.id));
    })

    return bboxes;
  }

  /* Convertir bbox a coordenadas YoLov5 */
  _convertYoloBbox(x, y, wl, hl) {
    const x1 = (2 * x + wl) / (2 * this.widthOriginal)
    const y1 = (2 * y + hl) / (2 * this.heightOriginal)
    const w = wl / this.widthOriginal
    const h = hl / this.heightOriginal
    return [x1, y1, w, h]
  }

  /* Convertir coordenadas de Yolov5 a coordenadas de la imagen actual */
  _convertCoordinates(bbox) {
    const w = bbox.w * this.widthOriginal
    const h = bbox.h * this.heightOriginal
    const x = (bbox.x * (2 * this.widthOriginal) - w) / 2
    const y = (bbox.y * (2 * this.heightOriginal) - h) / 2
    return {x, y, w, h}
  }
}
