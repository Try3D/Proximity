import math
import sqlite3
from flask import Flask, render_template, request


def dict_factory(cursor, row):
    d = {}
    for idx, col in enumerate(cursor.description):
        d[col[0]] = row[idx]
    return d


con = sqlite3.connect("posts.db", check_same_thread=False)
con.row_factory = dict_factory
cur = con.cursor()

app = Flask(__name__)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/createPost", methods=["POST"])
def create_post():
    data = request.get_json()
    title = data["title"]
    content = data["content"]
    latitude = float(data["latitude"])
    longitude = float(data["longitude"])

    last_post = cur.execute("SELECT * FROM posts ORDER BY id DESC LIMIT 1")

    id = 0
    for post in last_post:
        id = post["id"]
    if id:
        id += 1
    else:
        id = 1

    cur.execute("INSERT INTO posts (id, title, content, latitude, longitude) VALUES (?, ?, ?, ?, ?)", [id, title, content, latitude, longitude])
    con.commit()

    return {"message": "Post created", "id": f"{id}"}


@app.route("/getPosts", methods=["GET"])
def get_posts():
    latitude = float(request.args["latitude"])
    longitude = float(request.args["longitude"])

    try:
        posts = cur.execute("SELECT * FROM posts ORDER BY id DESC")
    except sqlite3.OperationalError:
        cur.execute("CREATE TABLE posts(id INT, title TEXT, content TEXT, latitude REAL, longitude REAL)")
        posts = cur.execute("SELECT * FROM posts ORDER BY id DESC")

    a = []
    for post in posts:
        if haversine_distance(float(post["latitude"]), float(post["longitude"]), latitude, longitude) < 1:
            a.append(post)
    return a


@app.route("/getPost/<id>", methods=["GET"])
def get_post(id):
    posts = cur.execute("SELECT * FROM posts WHERE id = ?", [id])

    a = []
    n = 0

    for post in posts:
        a.append(post)
        n += 1

    if n:
        return a
    else:
        return {"message": "Post not found"}


@app.route("/updatePost/<id>", methods=["PUT"])
def update_post(id):
    posts = cur.execute("SELECT * FROM posts WHERE id = ?", [id])

    n = 0
    for _ in posts:
        n += 1

    if n:
        content = request.args["content"]
        title = request.args["title"]
        cur.execute("UPDATE posts SET title = ? WHERE id = ?", [title, id])
        cur.execute("UPDATE posts SET content = ? WHERE id = ?", [content, id])
        posts = cur.execute("SELECT * FROM posts")
        return {"message": "Post updated"}
    else:
        return {"message": "Post not found"}


@app.route("/deletePost/<id>", methods=["DELETE"])
def delete_post(id):
    posts = cur.execute("SELECT * FROM posts WHERE id = ?", [id])

    n = 0
    for _ in posts:
        n += 1

    if n:
        cur.execute("DELETE FROM posts WHERE id = ?", [id])
        return {"message": "Post deleted"}
    else:
        return {"message": "Post not found"}


@app.errorhandler(404)
def error_404(error):
    return render_template("error404.html", error=error)


def haversine_distance(lat_1, lon_1, lat_2, lon_2):
    d_lat = (lat_2 - lat_1) * math.pi / 180
    d_lon = (lon_2 - lon_1) * math.pi / 180
    a = math.sin(d_lat / 2) * math.sin(d_lat / 2) + math.cos(lat_1 * math.pi / 180) * math.cos(lat_2 * math.pi / 180) * math.sin(d_lon / 2) * math.sin(d_lon / 2)
    b = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    c = 6361 * b
    return c


if __name__ == "__main__":
    app.run()
