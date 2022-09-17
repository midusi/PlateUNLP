<script>
    import Modal from "./Modal.svelte";
    import Param from "./DefaultSettings/Param.svelte";
    import { metadataStore } from "../store/metadata";

    let lists = {
        observers : [],
        imageTypes : [],
        digitalis : [],
        scanners : [],
        scanress : [],
        scancols : [],
        softwares : []
    }

    let listsKeys = {
        observers: "observers",
        imageTypes: "imageTypes",
        digitalis: "digitalis",
        scanners: "scanners",
        scanress : "scanress",
        scancols : "scancols",
        softwares : "softwares"
    }

    
    let defaults = {
        observerDefault : "",
        imageTypeDefault : "",
        digitaliDefault : "",
        scannerDefault : "",
        scanresDefault : "",
        scancolDefault : "",
        softwareDefault : ""
    }

    let defaultKeys = {
        observerDefault : "observerDefault",
        imageTypeDefault: "imageTypeDefault",
        digitaliDefault: "digitaliDefault",
        scannerDefault: "scannerDefault",
        scanresDefault : "scanresDefault",
        scancolDefault : "scancolDefault",
        softwareDefault : "softwareDefault"
    }
    
    let observerComponent;
    let imageTypeComponent;
    let digitaliComponent;
    let scannerComponent;
    let scanresComponent;
    let scancolComponent;
    let softwareComponent;

    Object.entries(listsKeys).forEach(([key]) => {
        if(localStorage.getItem(key)){
            lists[key] = JSON.parse(localStorage.getItem(key));
        }
        //console.log("LLAVES RECUPERADAS DE key ",key,": ",JSON.parse(localStorage.getItem(key)))
        //console.log("lista correspondiente: ",lists[key])
    })

    Object.entries(defaultKeys).forEach(([key]) => {
        if(localStorage.getItem(key)){
            defaults[key] = JSON.parse(localStorage.getItem(key));
        }
    })

    /*// Esta funcion NO se usa
    export function updateLists(observers,imageTypes,digitalis,scanners,scanress,softwares){
        lists.observers = observers;
        lists.imageTypes = imageTypes;
        lists.digitalis = digitalis;
        lists.scanners = scanners;
        lists.scanress = scanress;
        lists.scancols = scancols;
        lists.softwares = softwares;
    }*/

    function setDefault(value,param){
        defaults[param] = value;
        if(defaults[param] !== ""){
            localStorage.setItem(param,JSON.stringify(defaults[param]));
        }
        else{
            localStorage.removeItem(param);
        }
    }
    
    function addElem(value,param){
        if(value){
            if(!lists[param].includes(value)){
                lists[param] = [... lists[param],value];
                localStorage.setItem(param,JSON.stringify(lists[param]));
            }
        }
    }

    function deleteElem(value,paramLists,paramDef){
        let index;
        if(value){
            value.forEach(elem => {
                index = lists[paramLists].indexOf(elem);
                lists[paramLists].splice(index,1);
                if(lists[paramLists] === JSON.parse(localStorage.getItem(paramDef))){
                    localStorage.removeItem(paramDef);
                    defaults[paramDef] = ""; 
                }
            })
            if(lists[paramLists].length === 0){
                localStorage.removeItem(paramLists);
                localStorage.removeItem(paramDef);
                lists[paramLists] = [];
            }
            else {
                localStorage.setItem(paramLists,JSON.stringify(lists[paramLists]));
                lists[paramLists] = JSON.parse(localStorage.getItem(paramLists));
            }  
        }
    }

    function clearSelection(){
        observerComponent.reset(defaults.observerDefault);
        imageTypeComponent.reset(defaults.imageTypeDefault);
        digitaliComponent.reset(defaults.digitaliDefault);
        scannerComponent.reset(defaults.scannerDefault);
        scanresComponent.reset(defaults.scanresDefault);
        scancolComponent.reset(defaults.scancolDefault);
        softwareComponent.reset(defaults.softwareDefault);
        metadataStore.updateDefaults(); // Problema????
    }

    
</script>

<Modal bottonText="⚙ Valores por defecto" titleModal="Editar valores por defecto" key="parameters">
    <div slot="modalBody">
        <h4 class="mt-2">OBSERVER</h4>
            <Param bind:this={observerComponent} paramNameLists="observers"  paramNameDef="observerDefault"
            defaultValue={defaults.observerDefault} list={lists.observers} 
            handleDefault={setDefault} handleDelete={deleteElem} handleAdd={addElem}/>
        <hr/>
        <h4 class="mt-2">IMAGETYPE</h4>
            <Param bind:this={imageTypeComponent}  paramNameLists="imageTypes"  paramNameDef="imageTypeDefault"
            defaultValue={defaults.imageTypeDefault} list={lists.imageTypes} 
            handleDefault={setDefault} handleDelete={deleteElem} handleAdd={addElem}/>
        <hr/>
        <h4 class="mt-2">DIGITALI</h4>
            <Param bind:this={digitaliComponent} paramNameLists="digitalis"  paramNameDef="digitaliDefault" 
            defaultValue={defaults.digitaliDefault} list={lists.digitalis} 
            handleDefault={setDefault} handleDelete={deleteElem} handleAdd={addElem}/>
        <hr/>
        <h4 class="mt-2">SCANNER</h4>
            <Param bind:this={scannerComponent} paramNameLists="scanners"  paramNameDef="scannerDefault" 
            defaultValue={defaults.scannerDefault} list={lists.scanners} 
            handleDefault={setDefault} handleDelete={deleteElem} handleAdd={addElem}/>
        <hr/>
        <h4 class="mt-2">SCAN-RES</h4>
            <Param bind:this={scanresComponent} paramNameLists="scanress"  paramNameDef="scanresDefault" 
            defaultValue={defaults.scanresDefault} list={lists.scanress} 
            handleDefault={setDefault} handleDelete={deleteElem} handleAdd={addElem}/>
        <hr/>
        <h4 class="mt-2">SCAN-COL</h4>
            <Param bind:this={scancolComponent} paramNameLists="scancols"  paramNameDef="scancolDefault" 
            defaultValue={defaults.scancolDefault} list={lists.scancols} 
            handleDefault={setDefault} handleDelete={deleteElem} handleAdd={addElem}/>
        <hr/>
        <h4 class="mt-2">SOFTWARE</h4>
            <Param bind:this={softwareComponent} paramNameLists="softwares"  paramNameDef="softwareDefault" 
            defaultValue={defaults.softwareDefault} list={lists.softwares} 
            handleDefault={setDefault} handleDelete={deleteElem} handleAdd={addElem}/>
       
    </div>

    <div slot="footerBody">
        <button type="button" class="btn btn-secondary" data-dismiss="modal" on:click={clearSelection}>
            Close
        </button>
    </div>
</Modal>