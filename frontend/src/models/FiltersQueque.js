class FilterQueque {
	constructor() {
		this.mapa = new Map(); //Guarda que indice le corresponde a cada filtro (Orden de aplicacion)
		this.mapa.set("brightness",0);
		this.mapa.set("contrast",1);
		this.mapa.set("colorize",2);
		this.filters = new Array(this.mapa.keys.length).fill(null); //Reserva el espacio de los filtros e inicializa con null
		// new Array(this.mapa.size); //Reserva el espacio de los filtros
		// this.filters.map(x => null); //Inicializa el vector con null
	}

	setBrightness(filter){
		this.filters[this.mapa.get("brightness")]=filter;
	}

	setContrast(filter){
		this.filters[this.mapa.get("contrast")]=filter;
	}

	setColorize(filter){
		this.filters[this.mapa.get("colorize")]=filter;
	}

	getFilters() {
		return this.filters.filter(filter => filter != null); //Devuelve solo los filtros configurados
    }
}

export { FilterQueque }