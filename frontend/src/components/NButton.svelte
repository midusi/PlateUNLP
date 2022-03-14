<script>
  export let click,
    disabled = false,
    style,
    classStyle = "btn btn-primary";
</script>

<button type="button" class={classStyle} {style} {disabled} on:click={click}>
  <slot />
</button>
