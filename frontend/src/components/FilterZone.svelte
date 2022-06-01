<script>
  export let spectrogramCanvas;

  let brightness = 0;
  let contrast = 0;

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
    list="tickmarks"
    min="-1"
    max="1"
    step="0.01"
    bind:value={brightness}
    on:change={updateBrightness} 
  />
  <input type="text" value="{brightness}" readonly/>
</div>

<div class="d-xl-flex flex-column justify-content-xl-start">
  <span>Contraste</span>
  <input
    type="range"
    list="tickmarks"
    min="-1"
    max="1"
    step="0.01"
    bind:value={contrast}
    on:change={updateContrast} 
  />
  <input type="text" value="{contrast}" readonly/>
</div>
<datalist id="tickmarks">
  <option value="-1">
  <option value="-0.9">
  <option value="-0.8">
  <option value="-0.7">
  <option value="-0.6">
  <option value="-0.5">
  <option value="-0.4">
  <option value="-0.3">
  <option value="-0.2">
  <option value="-0.1">
  <option value="0">
  <option value="0.1">
  <option value="0.2">
  <option value="0.3">
  <option value="0.4">
  <option value="0.5">
  <option value="0.6">
  <option value="0.7">
  <option value="0.8">
  <option value="0.9">
  <option value="1">
</datalist>