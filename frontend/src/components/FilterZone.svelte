<script>
  export let spectrogramCanvas;

  let brightness = 0;
  let contrast = 0;
  let color = "#ff0000";

  function setBrightness() {
    console.log("Brillo = ", brightness);
    spectrogramCanvas.setBrightness(brightness);
  }

  function setContrast() {
    console.log("Contraste = ", contrast);
    spectrogramCanvas.setContrast(contrast);
  }

  function colorize(color) {
    // console.log("Color = ", color);
    spectrogramCanvas.colorize(color);
  }
</script>
  
<div class="d-xl-flex flex-column justify-content-xl-start">
  <span>Brillo</span>
  <input
    type="range"
    min="-1"
    max="1"
    step="0.01"
    bind:value={brightness}
    on:change={setBrightness} 
  />
  <input type="text" value="{brightness}" readonly/>
</div>

<div class="d-xl-flex flex-column justify-content-xl-start">
  <span>Contraste</span>
  <input
    type="range"
    min="-1"
    max="1"
    step="0.01"
    bind:value={contrast}
    on:change={setContrast} 
  />
  <input type="text" value="{contrast}" readonly/>
</div>

<div class="d-xl-flex flex-column justify-content-xl-start">
  <span>Color</span>
  <input 
    type="color" 
    bind:value={color}
    on:change={colorize} 
  />
</div>