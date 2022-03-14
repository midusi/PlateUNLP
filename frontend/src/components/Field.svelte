<script>
  import { metadataStore } from "../store/metadata";
  export let name, value, onchange;
  let aux = "";
  const setType = (node) => {
    node.type = $metadataStore.fields[name].type;
  };

  function selection() {
    metadataStore.addOptionObservat(name, aux);
    value = aux;
    aux = "";
  }
</script>

<div class="mt-2">
  <span>
    {$metadataStore.fields[name].label}
    <span style="color:red;">
      {$metadataStore.fields[name].required ? "*" : ""}
    </span>
  </span>
  {#if $metadataStore.fields[name].options === undefined}
    <input
      class="form-control"
      use:setType
      bind:value
      on:change={onchange}
      placeholder={$metadataStore.fields[name].info}
    />
  {:else}
    <select
      bind:value
      class="browser-default custom-select"
      aria-label="Select Obsevat"
      on:change={onchange}
    >
      {#each $metadataStore.fields[name].options as observat}
        <option value={observat}> {observat} </option>
      {/each}
    </select>
  {/if}
</div>
