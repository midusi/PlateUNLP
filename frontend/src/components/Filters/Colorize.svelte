<script>
    export let spectrogramCanvas;
    export let colorize_input = 0;
  
    function colorize() {
        console.log("Color = ", colorize_input);
        spectrogramCanvas.colorize(colorize_input);
    }
</script>
  
<div class="d-xl-flex flex-column justify-content-xl-start">
    <span>Color</span>
    <input 
        type="color" 
        bind:value={colorize_input}
        on:change={colorize} 
    />
</div>