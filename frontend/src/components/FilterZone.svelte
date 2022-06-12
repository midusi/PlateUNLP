<script>
  import NButton from "./NButton.svelte";

  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();
  
  export let spectrogramCanvas;
  export let scale;  
  
  let brightness_input = 0;
  let contrast_input = 0;
  let color_input = "#ffffff";

  function resetSpectrogramCanvas() {
    dispatch('reset')
    brightness_input = 0;
    brightness_input = brightness_input
    console.log("Brillo = ", brightness_input);
    contrast_input = 0;
    color_input = "#ffffff";
    spectrogramCanvas.resetFilters();
    console.log("Reset Filters");
  }

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
    spectrogramCanvas.colorize(color_input);
  }

  function updatescale() {
    console.log("Scale = ", scale);
    spectrogramCanvas.setScale(scale);
  }
</script>

<div class="card">
  <h5 class="card-header">Filtros</h5>
  <div class="card-body">

    <div class="d-xl-flex flex-column justify-content-xl-start">
      <span>Zoom</span>
      <input
        type="range"
        min="0.1"
        max="1"
        step="0.01"
        bind:value={scale}
        on:change={updatescale}
      />
    </div>

    <div class="d-xl-flex flex-column justify-content-xl-start">
      <span>Brillo</span>
      <input
        type="range"
        min="0"
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
        min="0"
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

    <p>&nbsp;</p>   

    <NButton click={resetSpectrogramCanvas}>
      Reiniciar Filtros
    </NButton>

  </div>
</div>
<p>&nbsp;</p>    