<script>
    import Modal from "../Modal.svelte"
    import SimpleCanvas from "../../models/SimpleCanvas"
    import Brightness from "../Filters/Brightness.svelte";
    import Contrast from "../Filters/Contrast.svelte";
    import Colorize from "../Filters/Colorize.svelte";
    import NButton from "../NButton.svelte";

    let src_img_test = "https://gcdn.emol.cl/mitos-y-enigmas/files/2020/05/luna-1024x576.jpg";
    let brightness_global = 0;
    let contrast_global = 0;
    let colorize_global = "#ffffff";
    let simpleCanvas;

    function clearSelection(){
        //cosas
    }

    function update(){
        // spectrogramStore.update();
    }

    function init() {
        simpleCanvas = new SimpleCanvas();
    }

    document.addEventListener("DOMContentLoaded", init, false);

</script>

<!-- <style>
    img.imagen_muestra {
        max-width:60%;
        max-height:60%;
    }
</style> -->
<Modal bottonText="⚙ Valores por defecto de los filtros" titleModal="Editar valores por defecto de los filtros" key="filtersValues">
    <div slot="modalBody">
        <Brightness canvas={simpleCanvas} bind:brightness_input={brightness_global}/>
        <Contrast canvas={simpleCanvas} bind:contrast_input={contrast_global}/>
        <Colorize canvas={simpleCanvas} bind:colorize_input={colorize_global}/>
        <hr/>  
        <center>
            <!-- <img class="imagen_muestra" src = {src_img_test} alt = "imagen de referencia para ver como aplican los valores de los filtros"> -->
            <canvas
                id="canvas-global-filters"
                width="300"
                height="300"
                style="border-width: 1px;
                    border-style: solid;
                    border-color: black;"
            />       
        </center>
        <NButton click={update} >
            Update
        </NButton>
    </div>

    <div slot="footerBody">
        <button type="button" class="btn btn-secondary" data-dismiss="modal" on:click={clearSelection}>
            Close
        </button>
    </div>

</Modal>