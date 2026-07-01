const preview=document.getElementById("preview");

function addImage(){

const file=document.getElementById("galleryImage").files[0];

if(!file){

alert("Choose an image.");

return;

}

const reader=new FileReader();

reader.onload=function(e){

let images=JSON.parse(localStorage.getItem("gallery"))||[];

images.push(e.target.result);

localStorage.setItem("gallery",JSON.stringify(images));

showImages();

}

reader.readAsDataURL(file);

}

function showImages(){

preview.innerHTML="";

let images=JSON.parse(localStorage.getItem("gallery"))||[];

images.forEach(image=>{

preview.innerHTML+=`

<div class="photo">

<img src="${image}">

</div>

`;

});

}

showImages();