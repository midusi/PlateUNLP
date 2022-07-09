<script>
  import NButton from "./NButton.svelte";
  import Brightness from "./Filters/Brightness.svelte";
  import Contrast from "./Filters/Contrast.svelte";
  import Colorize from "./Filters/Colorize.svelte";
  import Zoom from "./Filters/Zoom.svelte";
  
  export let spectrogramCanvas
  export let reset_filters_flag
  export let scale
  
  let brightness_input = 0
  let contrast_input = 0
  let colorize_input = "#ffffff"

  let enabled_save = true
  $: enabled_save = (
    (brightness_input != localStorage.getItem('Defect_brightness')) | 
    (contrast_input != localStorage.getItem('Defect_contrast')) | 
    (colorize_input != localStorage.getItem('Defect_colorize')))

  let enabled_filters = true
  let enabled_filters_icon='🕶'

  $: if (reset_filters_flag) {
    loadValues()
    resetSpectrogramCanvas()
    reset_filters_flag=false
  }

  function loadValues(){
    let aux
    aux = localStorage.getItem('Defect_brightness')
    if(aux){ brightness_input = aux } else { brightness_input = 0 }
    aux = localStorage.getItem('Defect_contrast')
    if(aux){ contrast_input = aux } else { contrast_input = 0 }
    aux = localStorage.getItem('Defect_colorize')
    if(aux){ colorize_input = aux } else { colorize_input = "#ffffff" }
  }
  
  function resetSpectrogramCanvas() {
    if(spectrogramCanvas) {
      spectrogramCanvas.setBrightness(brightness_input)
      spectrogramCanvas.setContrast(contrast_input)
      spectrogramCanvas.setColorize(colorize_input)
      spectrogramCanvas.ReRender()
    }
  }

  function save_changes(){
    enabled_save = false 
    localStorage.setItem('Defect_brightness', brightness_input);
    localStorage.setItem('Defect_contrast', contrast_input);
    localStorage.setItem('Defect_colorize', colorize_input);
  }

  function alter_enable_filters(){
    if(enabled_filters) {
      enabled_filters_icon='👓'
      spectrogramCanvas.resetFilters()
      spectrogramCanvas.ReRender()    
    } else {
      enabled_filters_icon='🕶'
      resetSpectrogramCanvas()
    }
    enabled_filters = !enabled_filters
  }

</script>

<div class="card">
  <h5 class="card-header">
    Filtros 
    <NButton click={save_changes} disabled={!enabled_save} style="float: right;">
      💾
    </NButton>
    <NButton click={alter_enable_filters} style="float: right;">
      {enabled_filters_icon}
    </NButton>
  </h5>
  <div class="card-body">
    <Zoom canvas={spectrogramCanvas} bind:scale={scale}/>
    <Brightness canvas={spectrogramCanvas} bind:brightness_input={brightness_input}/>
    <Contrast canvas={spectrogramCanvas} bind:contrast_input={contrast_input}/>
    <Colorize canvas={spectrogramCanvas} bind:colorize_input={colorize_input}/>
    <p>&nbsp;</p>   
  </div>
</div>
<p>&nbsp;</p>    