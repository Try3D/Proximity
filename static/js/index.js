document.addEventListener("DOMContentLoaded", () => {
    navigator.geolocation.getCurrentPosition(success, error);

    if (localStorage.getItem("userId") == null) {
        localStorage.setItem("userId", JSON.stringify([]));
    }

    function success(position) {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        updatePosts(latitude, longitude);

        setInterval(() => { updatePosts(latitude, longitude) }, 5000);

        document.querySelector("#button").addEventListener("click", () => {
            const title = document.querySelector("#textbox").value;
            const content = document.querySelector("#textarea").value.replace(/\n/g, "<br>");

            document.querySelector("#textbox").value = "";
            document.querySelector("#textarea").value = "";

            const postData = {
                title: title,
                content: content,
                latitude: latitude,
                longitude: longitude,
            };

            fetch("/createPost", {
                method: "POST",
                headers: {
                    "Content-Type": 'application/json'
                },
                body: JSON.stringify(postData)
            })
                .then(res => res.json())
                .then(data => {
                    const userId = JSON.parse(localStorage.getItem("userId"));
                    userId.push(parseInt(data["id"]));
                    localStorage.setItem("userId", JSON.stringify(userId));
                    updatePosts(latitude, longitude);
            });
        });
    }

    function error() {
        alert("This application requires browser geolocation to work");
    }

    function updatePosts(latitude, longitude) {
        fetch(`/getPosts?latitude=${latitude}&longitude=${longitude}`)
            .then(res => res.json())
            .then(data => {
                const posts = document.querySelector("#posts");
                posts.innerHTML = "";

                if (data.length == 0) {
                    const div = document.createElement("div");
                    div.classList.add("sketch-border");
                    div.classList.add("sketch-posts-system");
                    div.innerHTML = '<h2 class="post-text">There are no posts near you</h2><div class="post-text">Be the first to post something for others to see</div>';
                    posts.append(div);
                }
                else {
                    for (let item of data) {
                        console.log(item["id"])

                        const objects = JSON.parse(localStorage.getItem("userId"));
                        const div = document.createElement("div");
                        div.classList.add("sketch-border");
                        if (objects.includes(item["id"])) {
                            div.classList.add("sketch-posts-user");
                        }
                        else {
                            div.classList.add("sketch-posts-public");
                        }
                        div.innerHTML = `<h2 class='post-title'>${item["title"]}</h2><div class='post-text'>${item["content"]}</div>`;
                        posts.append(div);
                    }
                }
            });
    }
});
