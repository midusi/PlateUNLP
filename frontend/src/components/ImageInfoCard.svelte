<script>
  import { workspaceStore } from "../store";
  export let state;
</script>

{#if $workspaceStore.imageProperties.name !== undefined}
  <div class="card">
    <h5 class="card-header">Información de la imagen</h5>
    <div class="card-body">
      <strong>Nombre: </strong>{$workspaceStore.imageProperties.name}<br />
      <strong>Extensión: </strong>{$workspaceStore.imageProperties.ext}<br />
      <strong>Ancho: </strong>{$workspaceStore.imageProperties.width}<br />
      <strong>Alto: </strong>{$workspaceStore.imageProperties.heigth}<br />
      <strong>Profundidad de canales: </strong>{$workspaceStore.imageProperties.dtype}<br />
      <strong>Ruta: </strong>{$workspaceStore.imageProperties.path}<br />
      {#if state}
        <div class="d-flex justify-content-end">&#9989</div>
      {:else}
        <div class="d-flex justify-content-end"><img src="https://c.tenor.com/On7kvXhzml4AAAAi/loading-gif.gif" width="25" height="25"></div>
      {/if}
    </div>
  </div>
{/if}
