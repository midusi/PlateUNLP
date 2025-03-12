<script>
  import NButton from "./NButton.svelte";
  import Brightness from "./Filters/Brightness.svelte";
  import Contrast from "./Filters/Contrast.svelte";
  import Colorize from "./Filters/Colorize.svelte";
  import { createEventDispatcher } from "svelte";
  // import Zoom from "./Filters/Zoom.svelte";
  export let spectrogramCanvas
  export let reset_filters_flag
  // export let scale = 0.1
  export let rotate
  export let invertImage
  
  const dispatch = createEventDispatcher();

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
      spectrogramCanvas.disable_filters()
    } else {
      enabled_filters_icon='🕶'
      spectrogramCanvas.enable_filters()
      resetSpectrogramCanvas()
    }
    enabled_filters = !enabled_filters
  }

  $: invertImage, dispatch('changeInvert', { value: invertImage });

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
    <!--
    <NButton click={rotate}  style="float: right;">
      🔄
    </NButton>
    -->
  </h5>
  <div class="card-body">
    <div class="row">
      <Brightness canvas={spectrogramCanvas} bind:brightness_input={brightness_input}/>
      <Contrast canvas={spectrogramCanvas} bind:contrast_input={contrast_input}/>
      <!-- <Zoom canvas={spectrogramCanvas} bind:scale={scale}/> -->
      <Colorize canvas={spectrogramCanvas} bind:colorize_input={colorize_input}/>
      <div class="col">
        <label class="form-check-label">
          <input type="checkbox" class="form-check-input" bind:checked={invertImage}>
          Invertir imagen
        </label>
      </div>
    </div>
  </div>
</div>
<p>&nbsp;</p>    