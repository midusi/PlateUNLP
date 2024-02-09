<script>
  export let click = {},
    disabled = false,
    style = {},
    classStyle = "btn btn-outline-dark"
</script>

<button name="genericButton" type="button" class={classStyle} {style} {disabled} on:click={click}>
  <slot />
</button>
