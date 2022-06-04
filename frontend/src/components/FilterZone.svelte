<script>
  export let spectrogramCanvas;

  let brightness_input = 0;
  let contrast_input = 0;
  let color_input = "#ffffff";

  function setBrightness() {
    console.log("Brillo = ", brightness_input);
    spectrogramCanvas.setBrightness(brightness_input);
  }

  function setContrast() {
    console.log("Contraste = ", contrast_input);
    spectrogramCanvas.setContrast(contrast_input);
  }

  function colorize() {
    console.log("Color = ", color_input);
    //var color = new fabric.Color(color_input);
    spectrogramCanvas.colorize(color_input);
  }
</script>
  
<div class="d-xl-flex flex-column justify-content-xl-start">
  <span>Brillo</span>
  <input
    type="range"
    min="-1"
    max="1"
    step="0.01"
    bind:value={brightness_input}
    on:change={setBrightness} 
  />
  <input type="text" value="{brightness_input}" readonly/>
</div>

<div class="d-xl-flex flex-column justify-content-xl-start">
  <span>Contraste</span>
  <input
    type="range"
    min="-1"
    max="1"
    step="0.01"
    bind:value={contrast_input}
    on:change={setContrast} 
  />
  <input type="text" value="{contrast_input}" readonly/>
</div>

<div class="d-xl-flex flex-column justify-content-xl-start">
  <span>Color</span>
  <input 
    type="color" 
    bind:value={color_input}
    on:change={colorize} 
  />
</div>