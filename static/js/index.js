document.addEventListener('DOMContentLoaded', () => {
    navigator.geolocation.getCurrentPosition(success, error);

    if (localStorage.getItem('userId') == null) {
        localStorage.setItem('userId', JSON.stringify([]))
    }

    function success(position) {
        latitude = position.coords.latitude
        longitude = position.coords.longitude

        updatePosts()

        document.getElementById('button').addEventListener('click', () => {
            title = document.getElementById('textbox').value
            content = document.getElementById('textarea').value
            fetch(`/createPost?title=${title}&content=${content}&latitude=${latitude}&longitude=${longitude}`)
                .then((res) => res.json())
                .then((data) => {
                    userId = localStorage.getItem('userId')
                    object = JSON.parse(userId)
                    object.push(data[0])
                    localStorage.setItem('userId', JSON.stringify(object))
                })

            updatePosts()
        })
    }

    function error() {
        alert("This application requires browser geolocation to work");
    }

    function updatePosts() {
        fetch(`/getPosts?latitude=${latitude}&longitude=${longitude}`)
            .then((res) => res.json())
            .then((data) => {
                if (data.length == 0) {
                    div = document.createElement('div')
                    div.classList.add("sketch-border")
                    div.classList.add("sketch-border-posts-public")
                    div.innerHTML = "<h4>There are no posts here</h4><div>Be the first to post something for others to see</div>"
                    document.getElementById('posts').append(div)
                }

                for (let item of data) {
                    objects = JSON.parse(localStorage.getItem('userId'))
                    div = document.createElement('div')
                    div.classList.add("sketch-border")
                    if (objects.includes(item['id'])) {
                        div.classList.add("sketch-border-posts-user")
                    }
                    else {
                        div.classList.add("sketch-border-posts-public")
                    }
                    div.innerHTML = `<h2 class="sketch-post">${item['title']}</h2><div class="sketch-post">${item['content']}</div>`
                    document.getElementById('posts').append(div)
                }
            })
        }

})
