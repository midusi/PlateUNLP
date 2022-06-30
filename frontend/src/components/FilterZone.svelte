<script>
  import NButton from "./NButton.svelte";
  import Brightness from "./Filters/Brightness.svelte";
  import Contrast from "./Filters/Contrast.svelte";
  import Colorize from "./Filters/Colorize.svelte";
  import Zoom from "./Filters/Zoom.svelte";  
  import FiltersGlobalValuesModal from "./Modals/FiltersGlobalValuesModal.svelte";  
  
  export let spectrogramCanvas
  export let scale
  
  let brightness_input = 0
  let contrast_input = 0
  let colorize_input = "#ffffff"

  function setValues(){
    let aux
    aux = localStorage.getItem('Defect_brightness_global')
    if(aux){ brightness_input = aux } else { brightness_input = 0 }
    aux = localStorage.getItem('Defect_contrast_global')
    if(aux){ contrast_input = aux } else { contrast_input = 0 }
    aux = localStorage.getItem('Defect_colorize_global')
    if(aux){ colorize_input = aux } else { colorize_input = "#ffffff" }
  }

  function init() {
    setValues()
  }

  document.addEventListener("DOMContentLoaded", init, false)
  
  function resetSpectrogramCanvas() {
    setValues()
    spectrogramCanvas.resetFilters()
    console.log("Reset Filters")
  }
</script>

<div class="card">
  <h5 class="card-header">Filtros</h5>
  <div class="card-body">
    <Zoom canvas={spectrogramCanvas} bind:scale={scale}/>
    <Brightness canvas={spectrogramCanvas} bind:brightness_input={brightness_input}/>
    <Contrast canvas={spectrogramCanvas} bind:contrast_input={contrast_input}/>
    <Colorize canvas={spectrogramCanvas} bind:colorize_input={colorize_input}/>
    <p>&nbsp;</p>   
    <NButton click={resetSpectrogramCanvas} >
      Reiniciar Filtros
    </NButton>
    <FiltersGlobalValuesModal/>
  </div>
</div>
<p>&nbsp;</p>    