<script>
    import { slide } from 'svelte/transition';
    import NButton from "./NButton.svelte";
    export let paths, getImg, getPaths;
    let selectedImage = "";
    let showFinished = false;

    function handleSelect(){
        getImg(selectedImage);
    }

    function refresh(){
        getPaths();
    }
</script>

<div in:slide="{{duration:1000}}">
    <div class="my-3">
        <select bind:value={showFinished}>
            <option value={false}>En proceso</option>
            <option value={true}>Exportados</option>
        </select>
        <NButton on:click={refresh} style="float: right;">
            <img src="refresh.png" alt="Icono de boton para actualizar lista de archivos"/>
        </NButton>
    </div>
    <select
        bind:value={selectedImage}
        on:change={handleSelect}
        class="form-select"
        size="10"
        aria-label=""
        style="width:100%"
    >
        {#each paths as path}
            {#if showFinished}
                {#if path.number_of_spectra === -1}
                    <option style="background-color:LightBlue" value={path.fileName}>{path.fileName}</option>
                {/if}
            {:else}
                {#if path.number_of_spectra !== -1}
                    <option style="background-color:{path.saved ? "LightBlue" : "white"}" value={path.fileName}>{`${path.fileName} ${path.number_of_spectra > 0 ? `(${path.number_of_spectra})` : ""}`}</option>
                {/if}
            {/if}
        {/each}
    </select>
</div>