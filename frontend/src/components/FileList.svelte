<script>
import { slide } from 'svelte/transition';
export let paths,getImg;
let selectedImage = "";
let showFinished = false;

function handleSelect(){
    getImg(selectedImage);
}

</script>
  
<div in:slide="{{duration:1000}}">
    <div class="my-3">
        <select bind:value={showFinished}>
            <option value={false}>En proceso</option>
            <option value={true}>Exportados</option>
        </select>
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
            
                <option style="background-color:LightBlue" value={path.fileName}>ASD {path.fileName}</option>
            {/if}
        {:else}
            {#if path.number_of_spectra !== -1}
                <option style="background-color:{path.number_of_spectra > 0 ? "LightBlue" : "white"}" value={path.fileName}>{`${path.fileName} ${path.number_of_spectra > 0 ? `(${path.number_of_spectra})` : ""}`}</option>
            {/if}
        {/if}
      {/each}
    </select>
</div>