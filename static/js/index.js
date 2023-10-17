document.addEventListener("DOMContentLoaded", () => {
    navigator.geolocation.getCurrentPosition(success, error);

    function success(position) {
        if (localStorage.getItem("userId") == null) {
            localStorage.setItem("userId", JSON.stringify([]));
        }

        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        const button = document.querySelector("#button");
        button.addEventListener("click", clickButton);

        updatePosts();
        setInterval(updatePosts, 5000);

        function updatePosts() {
            fetch(`/getPosts?latitude=${latitude}&longitude=${longitude}`)
                .then((res) => res.json())
                .then((data) => {
                    const posts = document.querySelector("#posts");
                    posts.innerHTML = "";

                    if (data.length == 0) {
                        const div = document.createElement("div");
                        div.classList.add("sketch-border");
                        div.classList.add("sketch-posts-system");

                        const title = document.createElement("h2");
                        title.innerHTML = "There are no posts near you";
                        title.classList.add("post-text")

                        const content = document.createElement("div");
                        content.innerHTML = "Be the first to post something for others to see";
                        content.classList.add("post-text");

                        div.append(title);
                        div.append(content);
                        posts.append(div);

                        popup(div);
                    }
                    else {
                        for (let item of data) {
                            const div = document.createElement("div");
                            const objects = JSON.parse(localStorage.getItem("userId"));
                            div.classList.add("sketch-border");

                            const post = document.createElement("h2");
                            post.innerHTML = item["title"];
                            post.classList.add("post-title");

                            const content = document.createElement("div");
                            content.innerHTML = item["content"];
                            content.classList.add("post-text");

                            if (objects.includes(item["id"])) {
                                div.classList.add("sketch-posts-user");

                                div.append(post);
                                div.append(content);
                                posts.append(div);

                                popup(div);

                                const edit = document.createElement("button");
                                edit.innerHTML = "<img src='/static/icons/edit.svg' alt='delete' width=17>";
                                edit.classList.add("buttons");

                                edit.addEventListener("click", (event) => {
                                    event.stopPropagation();
                                    fetch("/getPost/" + item["id"], {
                                        method: "GET",
                                    })
                                        .then((res) => res.json())
                                        .then((data) => {
                                            const title = document.querySelector("#textbox");
                                            const content = document.querySelector("#textarea");
                                            const button = document.querySelector("#button");

                                            title.value = data[0]["title"];
                                            content.value = data[0]["content"];
                                            button.innerHTML = "UPDATE POST";

                                            button.removeEventListener("click", clickButton);
                                            button.addEventListener("click", updateButton);

                                            function updateButton() {
                                                fetch("/updatePost/" + item["id"], {
                                                        method: "PUT",
                                                        headers: {
                                                            "Content-Type": "application/json",
                                                        },
                                                        body: JSON.stringify({
                                                            title: title.value,
                                                            content: content.value,
                                                        }),
                                                    })
                                                    .then(() => {
                                                        title.value = "";
                                                        content.value = "";

                                                        button.removeEventListener("click", updateButton);
                                                        button.addEventListener("click", clickButton);
                                                        button.innerHTML = "POST";

                                                        updatePosts();
                                                    });
                                            }
                                        });
                                });

                                const close = document.createElement("button");
                                close.innerHTML = "<img src='/static/icons/close.svg' alt='delete' width=17>";
                                close.classList.add("buttons");

                                close.addEventListener("click", (event) => {
                                    event.stopPropagation();
                                    fetch("/deletePost/" + item["id"], {
                                        method: "DELETE",
                                    })
                                        .then(() => {
                                            const userId = JSON.parse(localStorage.getItem("userId"));
                                            const index = userId.indexOf(item["id"]);
                                            if (index != -1) {
                                                userId.splice(index, 1);
                                            }
                                            localStorage.setItem("userId", JSON.stringify(userId));
                                            updatePosts();
                                        });
                                });
                                div.prepend(edit);
                                div.prepend(close);
                            }
                            else {
                                div.classList.add("sketch-posts-public");

                                div.append(post);
                                div.append(content);
                                posts.append(div);

                                popup(div)
                            }
                        }
                    }
                });
        }

        function clickButton() {
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
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(postData),
            })
                .then((res) => res.json())
                .then((data) => {
                    const userId = JSON.parse(localStorage.getItem("userId"));
                    userId.push(parseInt(data["id"]));
                    localStorage.setItem("userId", JSON.stringify(userId));
                    updatePosts();
                });
        }

        function popup(div) {
            const clone = div.cloneNode(true);
            clone.style.cursor = "auto"

            const popup = document.querySelector("#popup");
            const popupContent = document.querySelector("#popup-content");

            div.addEventListener("click", () => {
                popupContent.innerHTML = "";
                popupContent.append(clone);
                popup.style.display = "block";
            });

            window.onclick = function (event) {
                if (event.target == popup) {
                    popup.style.display = "none";
                }
            };
        }
    }

    function error() {
        alert("This application requires browser geolocation to work");
    }
});
