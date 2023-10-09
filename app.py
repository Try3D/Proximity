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

app = Flask(__name__)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/createPost")
def create_post():
    title = request.args["title"]
    content = request.args["content"]
    latitude = float(request.args["latitude"])
    longitude = float(request.args["longitude"])

    cur = con.cursor()
    posts = cur.execute("SELECT COUNT(*) as count FROM posts")
    for post in posts:
        count = post["count"]

    if count:
        p = cur.execute("SELECT * FROM posts")
        for b in p:
            id = int(b["id"]) + 1
    else:
        id = 1

    cur.execute("INSERT INTO posts (id, title, content, latitude, longitude) VALUES (?, ?, ?, ?, ?)", [
                id, title, content, latitude, longitude])
    con.commit()
    return [id]


@app.route("/getPosts")
def get_posts():
    cur = con.cursor()
    latitude = float(request.args["latitude"])
    longitude = float(request.args["longitude"])
    try:
        posts = cur.execute("SELECT * FROM posts ORDER BY id DESC")
    except sqlite3.OperationalError:
        cur.execute(
            "CREATE TABLE posts(id INT, title TEXT, content TEXT, latitude REAL, longitude REAL)")
        posts = cur.execute("SELECT * FROM posts ORDER BY id DESC")

    a = []
    for post in posts:
        if haversine_distance(float(post["latitude"]), float(post["longitude"]), latitude, longitude) < 1:
            a.append(post)
    return a


@app.route("/getPosts/<id>")
def get_post_by_id(id):
    cur = con.cursor()
    posts = cur.execute("SELECT * FROM posts WHERE id IS ?", [id])

    a = []
    for post in posts:
        a.append(post)
    return a


@app.route("/updatePost/<id>")
def update_post(id):
    content = request.args["content"]
    cur = con.cursor()
    cur.execute("UPDATE posts SET content=? WHERE id is ?", [content, id])

    posts = cur.execute("SELECT * FROM posts")
    a = []
    for post in posts:
        a.append(post)
    return a


@app.route("/deletePost/<id>")
def delete_post(id):
    cur = con.cursor()
    cur.execute("DELETE FROM posts WHERE id IS ?", [id])
    posts = cur.execute("SELECT * FROM posts")

    a = []
    for post in posts:
        a.append(post)
    return a


@app.errorhandler(404)
def return_404_error(error):
    return render_template("404.html")


def haversine_distance(lat_1, lon_1, lat_2, lon_2):
    r = 6361
    d_lat = deg_to_rad(lat_2 - lat_1)
    d_lon = deg_to_rad(lon_2 - lon_1)
    a = math.sin(d_lat / 2) * math.sin(d_lat / 2) + math.cos(deg_to_rad(lat_1)) * \
        math.cos(deg_to_rad(lat_2)) * math.sin(d_lon / 2) * math.sin(d_lon / 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    d = r * c
    return d


def deg_to_rad(deg):
    return deg * math.pi / 180


if __name__ == "__main__":
    app.run()
