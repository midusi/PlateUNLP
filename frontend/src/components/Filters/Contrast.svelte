<script>
    export let canvas;
    export let contrast_input = 0;
  
    function setContrast() {
        // console.log("Contraste = ", contrast_input);
        canvas.setContrast(contrast_input);
        canvas.ReRender()
    }
</script>
  
<div class="d-xl-flex flex-column justify-content-xl-start" style="margin-left: 40px; width: 400px;">
    <span>Contraste</span>
    <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        bind:value={contrast_input}
        on:change={setContrast} 
    />
</div>