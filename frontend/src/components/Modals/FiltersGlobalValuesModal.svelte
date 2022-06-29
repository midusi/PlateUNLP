<script>
    import Modal from "../Modal.svelte"
    import SimpleCanvas from "../../models/SimpleCanvas"
    import Brightness from "../Filters/Brightness.svelte";
    import Contrast from "../Filters/Contrast.svelte";
    import Colorize from "../Filters/Colorize.svelte";
    import NButton from "../NButton.svelte"
import { update_await_block_branch } from "svelte/internal";

    let brightness_global = 0;
    let contrast_global = 0;
    let colorize_global = "#ffffff";
    let simpleCanvas;
    let disabled = false;

    function clearSelection(){
        //cosas
    }

    function init() {
        simpleCanvas = new SimpleCanvas();
        // var micanvas = document.getElementById("canvas-global-filters");
        // var ctx = micanvas.getContext("2d");
        // var img = new Image();
        // img.src = "/Luna.jpg";
        // ctx.drawImage(img,0,0);  

    }

    document.addEventListener("DOMContentLoaded", init, false)

    function save_changes(){
        // Se guardan los nuevos valores mediante localstorage
        // Todas las los parametros guardados usaran de llava Defect_{NombreP};
        localStorage.setItem('Defect_brightness_global', brightness_global);
        localStorage.setItem('Defect_contrast_global', contrast_global);
        localStorage.setItem('Defect_colorize_global', colorize_global);
    }

</script>

<!-- <style>
    img.imagen_muestra {
        max-width:60%;
        max-height:60%;
    }
</style> -->
<!-- <img class="imagen_muestra" src = {"/Luna.png"} alt = "imagen de referencia para ver como aplican los valores de los filtros"> -->
<Modal bottonText="⚙ Valores por defecto de los filtros" titleModal="Editar valores por defecto de los filtros" key="filtersValues">
    <div slot="modalBody">
        <Brightness canvas={simpleCanvas} bind:brightness_input={brightness_global}/>
        <Contrast canvas={simpleCanvas} bind:contrast_input={contrast_global}/>
        <Colorize canvas={simpleCanvas} bind:colorize_input={colorize_global}/>
        <hr/>  
        <center>
            <canvas
                id="canvas-global-filters"
                width="300"
                height="300"
                style="border-width: 1px;
                    border-style: solid;
                    border-color: black;"
            />       
        </center>
    </div>

    <div slot="footerBody">
        <button type="button" class="btn btn-secondary" disabled={disabled} on:click={save_changes}>
            Guardar Cambios
        </button>
        <button type="button" class="btn btn-secondary" data-dismiss="modal" on:click={clearSelection}>
            Close
        </button>
    </div>
</Modal>