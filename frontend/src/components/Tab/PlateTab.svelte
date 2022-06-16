<script>
	export let handlePlateSelected,bboxSelected;

</script>

<button class:selected={bboxSelected === -1} on:click={handlePlateSelected}>
	<slot/>
</button>

<style>
	button {
		background: none;
		border: none;
		border-bottom: 2px solid white;
		border-radius: 0;
		margin: 0;
		color: #ccc;
	}

	.selected {
		border-bottom: 2px solid black;
		color: #333;
	}
</style>
