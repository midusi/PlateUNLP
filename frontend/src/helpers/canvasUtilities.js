import { fabric } from 'fabric'
import { deleteAlert } from "../helpers/Alert";
// eslint-disable-next-line func-names

const colors = ["#FF2B2B","#FFFC2B","#44FF2B","#2BFFEF","#2B34FF","#E52BFF","white"];

fabric.Canvas.prototype.getItem = function (id) {
  let target = null
  this.getObjects().forEach((item) => {
    if (item.id === id) target = item
  })
  return target
}

/* Funcionalidad para borrar los bbox */
fabric.Object.prototype.controls.deleteControl = new fabric.Control({
  x: 0.5,
  y: -0.5,
  offsetY: -16,
  offsetX: 16,
  cursorStyle: 'pointer',
  // eslint-disable-next-line no-use-before-define
  mouseUpHandler: deleteBBbox,
  // eslint-disable-next-line no-use-before-define
  render: renderIconDelete(getDeleteIcon()),
  cornerSize: 24
})

function deleteBBbox(eventData, transform) {
  deleteAlert({
    succesFunc: () => {
      const { target } = transform
      const { canvas } = target
      canvas.remove(target)
      canvas.requestRenderAll()
    }
  });
}

function renderIconDelete(icon) {
  return function renderIcon(
    ctx,
    left,
    top,
    styleOverride,
    fabricObject
  ) {
    const size = this.cornerSize
    ctx.save()
    ctx.translate(left, top)
    ctx.rotate(fabric.util.degreesToRadians(fabricObject.angle))
    ctx.drawImage(icon, -size / 2, -size / 2, size, size)
    ctx.restore()
  }
}

function getDeleteIcon() {
  // eslint-disable-next-line no-multi-str
  const deleteIcon = "data:image/svg+xml,%3C%3Fxml version='1.0' encoding='utf-8'%3F%3E%3C!DOCTYPE \
        svg PUBLIC '-//W3C//DTD SVG 1.1//EN' 'assets/images/close.svg'%3E%3Csvg version='1.1' \
        id='Ebene_1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' \
        x='0px' y='0px' width='595.275px' height='595.275px' viewBox='200 215 230 470' \
        xml:space='preserve'%3E%3Ccircle style='fill:%23F44336;' cx='299.76' cy='439.067' \
        r='218.516'/%3E%3Cg%3E%3Crect x='267.162' y='307.978' transform='matrix(0.7071 -0.7071\
        0.7071 0.7071 -222.6202 340.6915)' style='fill:white;' width='65.545' height='262.18'/%3E%3Crect \
        x='266.988' y='308.153' transform='matrix(0.7071 0.7071 -0.7071 0.7071 398.3889 -83.3116)'\
        style='fill:white;' width='65.544' height='262.179'/%3E%3C/g%3E%3C/svg%3E"
  const deleteImg = document.createElement('img')
  deleteImg.src = deleteIcon
  return deleteImg
}

function getColor(id) {
  console.log(colors[id % colors.length])
  return colors[id % colors.length];
}

export { getColor }
