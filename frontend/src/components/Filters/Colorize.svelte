<script>
    export let spectrogramCanvas;

    let color_input = "#ffffff";

    function colorize() {
        console.log("Color = ", color_input);
        //var color = new fabric.Color(color_input);
        spectrogramCanvas.colorize(color_input);
    }
</script>

<div class="d-xl-flex flex-column justify-content-xl-start">
    <span>Color</span>
    <input 
      type="color" 
      bind:value={color_input}
      on:change={colorize} 
    />
</div>