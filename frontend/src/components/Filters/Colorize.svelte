<script>
    export let canvas;
    export let colorize_input = "#ffffff";

    let original="#ffffff"
    let cian="#00ffff"
    let yellow="#ffff00"
    let green="#37ff00"
    
  
    function colorize() {
        console.log("Color = ", colorize_input);
        canvas.setColorize(colorize_input);
        canvas.ReRender()
    }

    function set_original() {
        colorize_input = original;
        colorize()
    }

    function set_cian() {
        colorize_input = cian;
        colorize()
    }

    function set_yellow() {
        colorize_input = yellow;
        colorize()
    }

    function set_green() {
        colorize_input = green;
        colorize()
    }
</script>
  
<div class="d-xl-flex flex-column justify-content-xl-start" style="margin-left: 20px; width: 300px;">
    <span>Color</span>
    <div class="linea">
        <button style="background:{original};" on:click={set_original}/>
        <button style="background:{cian};" on:click={set_cian}/>
        <button style="background:{yellow};" on:click={set_yellow}/>
        <button style="background:{green};" on:click={set_green}/>
    </div>
</div>

<style>
    button {
        font-size: 20px;
        line-height: 50px;
        margin:2px;
        width: 10px;
        height: 10px;
    }
</style>