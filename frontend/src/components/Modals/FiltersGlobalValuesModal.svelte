<script>
    import Modal from "../Modal.svelte"
    import SimpleCanvas from "../../models/SimpleCanvas"

    let src_img_test = "https://gcdn.emol.cl/mitos-y-enigmas/files/2020/05/luna-1024x576.jpg";
    let contrast_global=0;
    let simpleCanvas = new SimpleCanvas();
    let canvas;

    function setContrast() {
        //cosas
    }

    function clearSelection(){
        //cosas
    }
</script>

<!-- <style>
    img.imagen_muestra {
        max-width:60%;
        max-height:60%;
    }
</style> -->
<Modal bottonText="⚙ Valores por defecto de los filtros" titleModal="Editar valores por defecto de los filtros" key="filtersValues">
    <div slot="modalBody">
        <h4 class="mt-2">Contrate</h4>
            <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                bind:value={contrast_global}
                on:change={setContrast} 
            />
            <input type="text" value="{contrast_global}" readonly/>
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
    </div>

    <div slot="footerBody">
        <button type="button" class="btn btn-secondary" data-dismiss="modal" on:click={clearSelection}>
            Close
        </button>
    </div>

</Modal>