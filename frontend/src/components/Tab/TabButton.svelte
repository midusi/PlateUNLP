<script>
  export let click,
    color,
    index,
    names,
    validated

    let name;
    $: name = names[index]

    let prefix
    $: prefix = validated ? "✔ " : ""
</script>

<button 
  type="button"  
  style={`background-color:${color} !important; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; border-color: black; width:100px; height:40px; border-radius:1px`} 
  on:click={click}
>
  {prefix+name}
</button>
