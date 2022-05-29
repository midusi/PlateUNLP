function imagedata_to_src(imagedata) {
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    canvas.width = imagedata.width;
    canvas.height = imagedata.height;
    ctx.putImageData(imagedata, 0, 0);

    var src = canvas.toDataURL();

    return src;
}

function src_to_imagedata(src) {
    let image = new Image();
    image.src = src;
    image.onload = function(){
        console.log("Onload function");
    }
    // Create canvas
    const canvas = document.createElement('canvas');
    let context = canvas.getContext('2d');
    // Set width and height
    canvas.width = image.width;
    canvas.height = image.height;

    context.drawImage(image, 0, 0);
    let imagedata = context.getImageData( 0, 0, image.width, image.height); 
    return imagedata;
}

export { imagedata_to_src, src_to_imagedata }