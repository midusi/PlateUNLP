class FilterQueque {
	constructor() {
		this.filters = {};
	}
	
	push(filter, key) {
		this.filters[key]=filter;
    }

	getFilters() {
		return this.filters;
    }
}

export { FilterQueque }