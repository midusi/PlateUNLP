<script>
  import Zoom from './Filters/Zoom.svelte'
  import Brightness from './Filters/Brightness.svelte'
  import Contrast from './Filters/Contrast.svelte'
  import Colorize from './Filters/Colorize.svelte'
  
  export let spectrogramCanvas;
  export let scale;  
</script>

<div class="card">
  <h5 class="card-header">Filtros</h5>
  <div class="card-body">
    <Zoom spectrogramCanvas={spectrogramCanvas} bind:scale={scale}/>
    <Brightness spectrogramCanvas={spectrogramCanvas}/>
    <Contrast spectrogramCanvas={spectrogramCanvas}/>
    <Colorize spectrogramCanvas={spectrogramCanvas}/>
  </div>
</div>
<p>&nbsp;</p>    