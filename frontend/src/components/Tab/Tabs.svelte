<script context="module">
	export const TABS = {};
</script>

<script>
	import { metadataStore } from "../../store/metadata"
	import { createEventDispatcher } from "svelte";
	import { setContext, onDestroy } from "svelte";
	import { writable } from "svelte/store";

	const dispatch = createEventDispatcher();
	const tabs = [];
	const panels = [];
	const selectedTab = writable(null);
	const selectedPanel = writable(null);

	let actions = {
		selectForIndex: (index) => {
			selectedTab.set(tabs[index]);
			selectedPanel.set(panels[index]);
			dispatch("selectTab", {
				index
			});
		},
	} 
	metadataStore.initFormActions(actions)
	setContext(TABS, {
		registerTab: (tab) => {
			tabs.push(tab);
			selectedTab.update((current) => current || tab);
			onDestroy(() => {
				const i = tabs.indexOf(tab);
				tabs.splice(i, 1);
				selectedTab.update((current) =>
					current === tab ? tabs[i] || tabs[tabs.length - 1] : current
				);
			});
		},

		registerPanel: (panel) => {
			panels.push(panel);
			selectedPanel.update((current) => current || panel);

			onDestroy(() => {
				const i = panels.indexOf(panel);
				panels.splice(i, 1);
				selectedPanel.update((current) =>
					current === panel
						? panels[i] || panels[panels.length - 1]
						: current
				);
			});
		},

		selectTab: (tab) => {
			const i = tabs.indexOf(tab);
			selectedTab.set(tab);
			selectedPanel.set(panels[i]);
			dispatch("selectTab", {
				index: i,
			});
		},
		selectedTab,
		selectedPanel,
	});
</script>

<div class="tabs">
	<slot />
</div>
