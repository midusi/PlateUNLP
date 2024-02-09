<script>
    export let canvas
    export let brightness_input = 0
  
    function setBrightness() {
        // console.log("Brillo = ", brightness_input)
        canvas.setBrightness(brightness_input)
        canvas.ReRender()
    }
</script>
  
<div class="d-xl-flex flex-column justify-content-xl-start" style="margin-left: 40px; width: 300px;">
    <span>Brillo</span>
    <input
        id="barra_de_control_de_brillo"
        name="barra_de_control_de_brillo"
        type="range"
        min="0"
        max="1"
        step="0.01"
        bind:value={brightness_input}
        on:change={setBrightness} 
    />
</div>