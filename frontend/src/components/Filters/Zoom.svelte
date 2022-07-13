<script>
    export let canvas;
    export let scale;
  
    function updatescale() {
        console.log("Scale = ", scale);
        canvas.setScale(scale);
    }
</script>
  
<div class="d-xl-flex flex-column justify-content-xl-start" style="margin-left: 40px; width: 400px;">
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