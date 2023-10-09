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
            content = document.getElementById('textarea').value.replace(/\n/g, "<br>")

            document.getElementById('textbox').value = ''
            document.getElementById('textarea').value = ''

            fetch(`/createPost?title=${title}&content=${content}&latitude=${latitude}&longitude=${longitude}`)
                .then((res) => res.json())
                .then((data) => {
                    userId = JSON.parse(localStorage.getItem('userId'))
                    userId.push(data['id'])
                    localStorage.setItem('userId', JSON.stringify(userId))
                    updatePosts()
                })
        })
    }

    function error() {
        alert('This application requires browser geolocation to work');
    }

    function updatePosts() {
        fetch('/getPosts?' + new URLSearchParams({
            latitude: latitude,
            longitude: longitude,
        }), { method: "GET" })
            .then((res) => res.json())
            .then((data) => {
                document.getElementById('posts').innerHTML = ''
                if (data.length == 0) {
                    div = document.createElement('div')
                    div.classList.add('sketch-border')
                    div.classList.add('sketch-posts-system')
                    div.innerHTML = '<h2 class="post-text">There are no posts near you</h2><div class="post-text">Be the first to post something for others to see</div>'
                    document.getElementById('posts').append(div)
                }
                else {
                    for (let item of data) {
                        objects = JSON.parse(localStorage.getItem('userId'))
                        div = document.createElement('div')
                        div.classList.add('sketch-border')
                        if (objects.includes(item['id'])) {
                            div.classList.add('sketch-posts-user')
                        }
                        else {
                            div.classList.add('sketch-posts-public')
                        }
                        div.innerHTML = `<h2 class='post-text'>${item['title']}</h2><div class='post-text'>${item['content']}</div>`
                        document.getElementById('posts').append(div)
                    }
                }
            })
    }
})
