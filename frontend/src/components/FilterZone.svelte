<script>
  import NButton from "./NButton.svelte";
  import Brightness from "./Filters/Brightness.svelte";
  import Contrast from "./Filters/Contrast.svelte";
  import Colorize from "./Filters/Colorize.svelte";
  import Zoom from "./Filters/Zoom.svelte";  

  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();
  
  export let spectrogramCanvas;
  export let scale;  
  
  let brightness_input = 0;
  let contrast_input = 0;
  let colorize_input = "#ffffff";

  function resetSpectrogramCanvas() {
      dispatch('reset')
      brightness_input = 0;
      contrast_input = 0;
      colorize_input = "#ffffff";
      spectrogramCanvas.resetFilters();
      console.log("Reset Filters");
  }
</script>

<div class="card">
  <h5 class="card-header">Filtros</h5>
  <div class="card-body">
    <Zoom spectrogramCanvas={spectrogramCanvas} bind:scake={scale}/>
    <Brightness spectrogramCanvas={spectrogramCanvas} bind:brightness_input={brightness_input}/>
    <Contrast spectrogramCanvas={spectrogramCanvas} bind:contrast_input={contrast_input}/>
    <Colorize spectrogramCanvas={spectrogramCanvas} bind:color_input={colorize_input}/>
    <p>&nbsp;</p>   
    <NButton click={resetSpectrogramCanvas}>
      Reiniciar Filtros
    </NButton>
  </div>
</div>
<p>&nbsp;</p>    