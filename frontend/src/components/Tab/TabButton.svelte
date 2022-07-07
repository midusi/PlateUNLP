<script>
  export let click,
    color,
    index,
    names

    let name;
    $: name = names[index] ? names[index] : `Nuevo#${index+1}`
    
</script>

<button type="button"  style={`background-color:${color} !important; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; border-color: black; width:100px; height:40px; border-radius:1px`} on:click={click}>
{name}
</button>
