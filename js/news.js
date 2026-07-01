const publishBtn = document.getElementById("publishBtn");

publishBtn.addEventListener("click", function () {

    const title = document.getElementById("title").value.trim();
    const category = document.getElementById("category").value;
    const content = document.getElementById("content").value.trim();

    if (title === "" || content === "") {
        alert("Please complete the article.");
        return;
    }

    const post = {
        title: title,
        category: category,
        content: content,
        date: new Date().toLocaleString()
    };

    let posts = JSON.parse(localStorage.getItem("arsrcPosts")) || [];

    posts.unshift(post);

    localStorage.setItem("arsrcPosts", JSON.stringify(posts));

    alert("Blog published successfully!");

    document.getElementById("title").value = "";
    document.getElementById("content").value = "";
});