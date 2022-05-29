<script>
  export let spectrogramCanvas;

  let brightness = 0.5;
  let contrast = 255;

  function updateBrightness() {
      spectrogramCanvas.setBrightness(brightness);
  }

  function updateContrast() {
      console.log("Contraste = ", contrast-255);
      spectrogramCanvas.setContrast(contrast-255);
      console.log("Ok Contraste");
    }
</script>
  
<div class="d-xl-flex flex-column justify-content-xl-start">
  <span>Brillo</span>
  <input
    type="range"
    min="0"
    max="255"
    step="0.01"
    bind:value={brightness}
    on:change={updateBrightness} 
  />
</div>
<div class="d-xl-flex flex-column justify-content-xl-start">
  <span>Contraste</span>
  <input
    type="range"
    min="1"
    max="510"
    step="1"
    bind:value={contrast}
    on:change={updateContrast} 
  />
</div>