<script>
  export let spectrogramCanvas;

  let brightness = 1;
  let contrast = 255;

  function updateBrightness() {
      console.log("Brillo = ", brightness);
      spectrogramCanvas.setBrightness(brightness);
  }

  function updateContrast() {
      console.log("Contraste = ", contrast);
      spectrogramCanvas.setContrast(contrast);
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
    on:change={updateBrightness} 
  />
</div>
<div class="d-xl-flex flex-column justify-content-xl-start">
  <span>Contraste</span>
  <input
    type="range"
    min="-1"
    max="1"
    step="0.01"
    bind:value={contrast}
    on:change={updateContrast} 
  />
</div>