<script>
  import { metadataStore } from "../store/metadata";
  import {getContext} from "svelte";
  export let name, value;

  const setChangeFlag = getContext("setChangeFlag");
  let aux = "";

  const setType = (node) => {
    node.type = $metadataStore.fields[name].type;
  };

  function remoteDataChange(){
    $metadataStore.fields[name].loaded = false
    setChangeFlag();
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
    {#if $metadataStore.fields[name].remote}
      <input
        class="form-control"
        use:setType
        style={`background-color: ${$metadataStore.fields[name].loaded ? "lavender" : "white"};`}
        bind:value
        on:change={() => remoteDataChange(name)}
        placeholder={$metadataStore.fields[name].info}
      />
    {:else}
      <input
        class="form-control"
        use:setType
        bind:value
        on:change={setChangeFlag}
        placeholder={$metadataStore.fields[name].info}
      />
    {/if}
  {:else if $metadataStore.fields[name].label === "OBSERVAT"}
  <select
      bind:value
      class="browser-default custom-select"
      aria-label="Select Obsevat"
      on:change={setChangeFlag}
    >
      {#each $metadataStore.fields[name].options as observat}
        <option value={observat}> {observat} </option>
      {/each}
    </select>
  {:else}
    <input
      list={`${name}Options`}
      class="form-control"
      use:setType
      bind:value
      on:change={setChangeFlag}
      placeholder={$metadataStore.fields[name].info}
    />
    <datalist id={`${name}Options`}>
      {#each $metadataStore.fields[name].options as el}
        <option value={el}> {el} </option>
      {/each}
    </datalist>
  {/if}
</div>
