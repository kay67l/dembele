function uploadResource(id){

    const file=document.getElementById(id).files[0];

    if(!file){

        alert("Select a file first.");

        return;

    }

    let resources=
    JSON.parse(localStorage.getItem("resources"))||[];

    resources.push(file.name);

    localStorage.setItem("resources",
    JSON.stringify(resources));

    displayResources();

    alert(file.name+" uploaded successfully.");

}

function displayResources(){

    const list=document.getElementById("resourceList");

    let resources=
    JSON.parse(localStorage.getItem("resources"))||[];

    list.innerHTML="<h2>Uploaded Resources</h2>";

    resources.forEach(resource=>{

        list.innerHTML+=`

        <div class="item">

        📄 ${resource}

        </div>

        `;

    });

}

displayResources();