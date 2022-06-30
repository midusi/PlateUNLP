<script>
    import Modal from "../Modal.svelte"
    import SimpleCanvas from "../../models/SimpleCanvas"
    import Brightness from "../Filters/Brightness.svelte";
    import Contrast from "../Filters/Contrast.svelte";
    import Colorize from "../Filters/Colorize.svelte";

    let brightness_global = 0;
    let contrast_global = 0;
    let colorize_global = "#ffffff";
    let simpleCanvas;

    let disabled_save = true;
    // Reacciones reactivas de disable_save respecto a cambios en otras variables
    $: disabled_save = (brightness_global === localStorage.getItem('Defect_brightness_global'))
    $: disabled_save = (contrast_global === localStorage.getItem('Defect_contrast_global'))
    $: disabled_save = (colorize_global === localStorage.getItem('Defect_colorize_global'))

    // IMPORTANTE: Ejecutar al cerrar el modal
    function setValues(){
        let aux
        aux = localStorage.getItem('Defect_brightness_global')
        if(aux){ brightness_global = aux } else { brightness_global = 0 }
        aux = localStorage.getItem('Defect_contrast_global')
        if(aux){ contrast_global = aux } else { contrast_global = 0 }
        aux = localStorage.getItem('Defect_colorize_global')
        if(aux){ colorize_global = aux } else { colorize_global = "#ffffff" }
    }

    function init() {
        simpleCanvas = new SimpleCanvas();
        setValues()
    }

    document.addEventListener("DOMContentLoaded", init, false)

    function save_changes(){
        // Se guardan los nuevos valores mediante localStorage
        // Todas las los parametros guardados usaran de llava Defect_{NombreP};
        localStorage.setItem('Defect_brightness_global', brightness_global);
        localStorage.setItem('Defect_contrast_global', contrast_global);
        localStorage.setItem('Defect_colorize_global', colorize_global);
        disabled_save = true  //Deshabilita el boton de guardar hasta que ocurra otra modificacion
    }

</script>

<!-- <style>
    img.imagen_muestra {
        max-width:60%;
        max-height:60%;
    }
</style> -->
<!-- <img class="imagen_muestra" src = {"/Luna.png"} alt = "imagen de referencia para ver como aplican los valores de los filtros"> -->
<Modal bottonText="⚙ Valores por defecto de los filtros" titleModal="Editar valores por defecto de los filtros" key="glovalFiltersValues">
    <div slot="modalBody">
        <Brightness canvas={simpleCanvas} bind:brightness_input={brightness_global}/>
        <Contrast canvas={simpleCanvas} bind:contrast_input={contrast_global}/>
        <Colorize canvas={simpleCanvas} bind:colorize_input={colorize_global}/>
        <!-- <hr/>  
        <center>
            <canvas
                id="canvas-global-filters"
                width="300"
                height="300"
                style="border-width: 1px;
                    border-style: solid;
                    border-color: black;"
            />       
        </center> -->
    </div>

    <div slot="footerBody">
        <button type="button" class="btn btn-secondary" disabled={disabled_save} on:click={save_changes}>
            Guardar Cambios
        </button>
        <button type="button" class="btn btn-secondary" data-dismiss="modal" on:click={setValues}>
            Close
        </button>
    </div>
</Modal>